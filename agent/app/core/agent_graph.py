"""
LangGraph 기반 Agent 오케스트레이션

agent_service.py의 수작업 ReAct 루프(while 반복 제어 + litellm 예외 처리 4종 중복 +
스트림 tool_call 버퍼링 중복)를 StateGraph로 대체한다. LLM 호출은 LangChain
ChatModel이 아니라 기존 llm_router(LiteLLM Router, 멀티키 로테이션 + OpenAI→Gemini
폴백)를 그대로 호출하므로 prebuilt create_react_agent는 쓰지 않고 커스텀 노드로
구성한다.

참조: agent/docs/LANGGRAPH_MIGRATION_PLAN.md
"""
import json
import logging
from typing import Annotated, Optional

import litellm
from langchain_core.messages import AIMessage
from langchain_core.messages.utils import convert_to_openai_messages
from langchain_core.utils.function_calling import convert_to_openai_tool
from langgraph.checkpoint.memory import MemorySaver
from langgraph.config import get_stream_writer
from langgraph.graph import add_messages, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition
from langsmith import traceable
from typing_extensions import TypedDict

from app.core.llm_router import ROUTER_MODEL_NAME, llm_router
from app.tools import neo4j_tools_list

logger = logging.getLogger(__name__)


def _keep_or_update(old: Optional[dict], new: Optional[dict]) -> Optional[dict]:
    """student_context reducer: 이번 턴에 값이 없으면 이전 턴 값을 유지한다."""
    return new if new is not None else old


class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    student_context: Annotated[Optional[dict], _keep_or_update]


_TOOLS = neo4j_tools_list
_TOOL_SCHEMAS = [convert_to_openai_tool(t) for t in _TOOLS]

# 레거시 MetaAgentService.max_iterations(=8, LLM 왕복 횟수)와 동등한 상한.
# LangGraph의 recursion_limit은 super-step(노드 실행) 단위로 세며, 이 그래프는
# 왕복 1회당 call_model + tools 2 super-step을 소비한다(실측 확인됨).
MAX_ITERATIONS = 8
RECURSION_LIMIT = MAX_ITERATIONS * 2
MAX_ITERATIONS_FALLBACK_MESSAGE = "에이전트가 최대 허용 횟수 내에 답변을 완료하지 못했습니다."

# litellm 예외 -> 사용자 노출 메시지 (agent_service.py 레거시 경로와 동일한 매핑,
# 구체적인 예외부터 순서대로 검사해야 하위 클래스가 상위 클래스로 오분류되지 않는다)
_LITELLM_ERROR_MESSAGES = (
    (litellm.exceptions.AuthenticationError, "API 키 인증 오류가 발생했습니다. 관리자에게 문의하세요."),
    (litellm.exceptions.RateLimitError, "현재 요청이 많아 일시적으로 서비스 제한이 발생했습니다."),
    (litellm.exceptions.Timeout, "응답 시간이 초과되었습니다."),
    (litellm.exceptions.APIError, "AI 서비스 연동 중 오류가 발생했습니다."),
)


def _normalize_tool_args(_func_name: str, args: dict) -> dict:
    """LLM이 잘못된 schoolLevel 값을 넣어도 정규화하는 후처리 방어 로직."""
    sl = args.get("schoolLevel")
    if isinstance(sl, str):
        s = sl.strip().lower()
        mapping = {
            "초등": "elementary", "elementary": "elementary", "e": "elementary",
            "중등": "middle", "middle": "middle", "m": "middle",
        }
        args["schoolLevel"] = mapping.get(s, sl)
    return args


def _build_system_prompt(student_context: Optional[dict]) -> str:
    """profile 기반으로 Tool 호출 가이드 및 할루시네이션 방지 규칙을 포함한 시스템 프롬프트를 생성한다."""
    profile = (student_context or {}).get("profile") or {}
    context_text = (student_context or {}).get("context") or "No additional context provided."
    school_level = profile.get("schoolLevel")
    predicted_type = profile.get("predictedType")

    profile_block = ""
    if school_level and predicted_type:
        profile_block = (
            "\n## 분석 대상 학생 식별자 (Tool 호출 인자로 그대로 사용)\n"
            f"- className: \"{predicted_type}\"\n"
            f"- schoolLevel: \"{school_level}\"\n"
        )
        tool_policy = (
            "학생의 LPA 유형 기반 분석(강/약점, 개입 전략, 조절·매개 경로, 집단 평균 T점수 비교)이 "
            "필요한 경우 반드시 Neo4j Tool을 호출하여 실제 데이터를 확보한 후 답변하십시오. "
            "처음에는 `get_lpa_overview`를 1회 호출하여 전반을 파악하고, "
            "세부 질문에는 개별 Tool을 추가 호출하십시오. "
            "Tool을 호출하기 전에 반드시 호출 이유를 한 문장으로 먼저 서술하십시오. "
            "Tool 결과가 빈 목록([])이거나 오류를 반환하면 "
            "'해당 데이터를 현재 조회할 수 없습니다'라고 안내하고, 임의로 내용을 창작하지 마십시오.\n"
        )
    else:
        tool_policy = (
            "현재 단일 학생 식별자(schoolLevel + predictedType)가 없으므로 "
            "Neo4j Tool을 호출하지 마십시오. "
            "주어진 텍스트 컨텍스트만을 근거로 답변하십시오.\n"
        )

    return (
        "# 역할 및 운영 원칙\n"
        "귀하는 비상교육 **학습심리정서검사(LPA) 시스템**의 상담 보조 AI입니다.\n"
        "교사가 학생의 검사 결과를 이해하고 올바른 교육적 개입을 할 수 있도록 돕는 것이 유일한 목적입니다.\n\n"

        "## 답변 범위 및 데이터 우선순위\n"
        "답변은 반드시 아래 순서의 데이터 소스에만 근거하십시오:\n"
        "1. **학생 컨텍스트** (아래 마크다운에 제공된 T점수, 4단계 진단, 상담기록 등)\n"
        "2. **Neo4j Tool 조회 결과** (LPA 유형 특성, 조절·매개 경로, 집단 평균 T점수)\n"
        "3. **학습심리정서 도메인 일반 지식** — 위 두 소스를 보완하는 수준에서만 제한적으로 활용\n\n"

        "## 할루시네이션 방지 규칙 (반드시 준수)\n"
        "- **창작 금지**: 컨텍스트에 없는 학생의 개인정보, 성격, 가정환경, 성적 등을 추측하거나 창작하지 마십시오.\n"
        "- **불확실성 명시**: 컨텍스트나 Tool 데이터에서 확인할 수 없는 내용은 "
        "'제공된 데이터에서 확인할 수 없습니다'라고 명시하십시오.\n"
        "- **근거 표기**: 핵심 판단의 근거가 컨텍스트 T점수인지, Neo4j Tool 결과인지 간략히 밝히십시오. "
        "(예: 'T점수 기준', '조절 경로 데이터 기준')\n"
        "- **도메인 한정**: 학습심리정서검사와 무관한 질문(일반 교과 지식, 외부 이슈 등)에는 "
        "'이 시스템의 학습심리정서검사 범위 외의 질문입니다'라고 안내하십시오.\n\n"

        f"{profile_block}"
        f"## Neo4j Tool 호출 정책\n{tool_policy}"
        "\n## 학생 컨텍스트 (마크다운)\n"
        f"{context_text}"
    )


@traceable(run_type="llm", name="LiteLLM")
async def _stream_llm_call(messages: list, tools: list):
    """LiteLLM Router 스트리밍 호출을 감싸 LangSmith에 nested LLM span으로 기록한다.

    async generator를 @traceable로 감싸면 yield되는 청크가 그대로 run outputs에
    누적되어, 레거시(agent_service.py)에서 "스트림 LLM 호출은 개별 추적 불가"였던
    한계를 해소한다(langsmith>=0.7의 async generator 지원 확인됨,
    agent/docs/LANGGRAPH_MIGRATION_PLAN.md 3.6 참고). LangSmith가 비활성화된 상태에서도
    안전한 no-op으로 동작함을 런타임으로 확인했다. call_model_node가 이 함수를
    순회하며 토큰을 get_stream_writer()로 흘려보낸다.
    """
    response = await llm_router.acompletion(
        model=ROUTER_MODEL_NAME,
        messages=messages,
        tools=tools,
        stream=True,
    )
    async for chunk in response:
        yield chunk


async def call_model_node(state: AgentState) -> dict:
    """LiteLLM Router를 스트리밍 모드로 호출하고, 토큰은 커스텀 스트림으로 흘려보낸 뒤
    최종 결과를 LangChain AIMessage로 변환해 반환한다.

    stream=True로 통일해 /chat(ainvoke)과 /chat/stream(astream, stream_mode="custom")이
    완전히 동일한 노드 구현을 공유하도록 한다. get_stream_writer()는 커스텀 스트림 소비자가
    없는 컨텍스트(ainvoke)에서도 안전한 no-op으로 동작함을 런타임으로 확인했다.
    """
    writer = get_stream_writer()
    system_prompt = _build_system_prompt(state.get("student_context"))
    openai_messages = [{"role": "system", "content": system_prompt}] + convert_to_openai_messages(
        state["messages"]
    )

    try:
        content_buffer = ""
        tool_call_buffer: dict = {}

        async for chunk in _stream_llm_call(openai_messages, _TOOL_SCHEMAS):
            delta = chunk.choices[0].delta

            if getattr(delta, "content", None):
                content_buffer += delta.content
                writer({"type": "token", "text": delta.content})

            if getattr(delta, "tool_calls", None):
                for tc in delta.tool_calls:
                    idx = getattr(tc, "index", 0)
                    if idx not in tool_call_buffer:
                        tool_call_buffer[idx] = {"id": "", "name": "", "arguments": ""}
                    if getattr(tc, "id", None):
                        tool_call_buffer[idx]["id"] += tc.id
                    if getattr(tc, "function", None):
                        if getattr(tc.function, "name", None):
                            tool_call_buffer[idx]["name"] += tc.function.name
                        if getattr(tc.function, "arguments", None):
                            tool_call_buffer[idx]["arguments"] += tc.function.arguments

    except Exception as e:
        for exc_type, message in _LITELLM_ERROR_MESSAGES:
            if isinstance(e, exc_type):
                logger.error(f"{exc_type.__name__}: {e}")
                writer({"type": "token", "text": message})
                return {"messages": [AIMessage(content=message)]}
        logger.error(f"Unexpected error in call_model_node: {e}", exc_info=True)
        message = "예상치 못한 오류가 발생했습니다."
        writer({"type": "token", "text": message})
        return {"messages": [AIMessage(content=message)]}

    tool_calls = []
    for tc in tool_call_buffer.values():
        try:
            args = json.loads(tc["arguments"] or "{}")
        except json.JSONDecodeError:
            args = {}
        args = _normalize_tool_args(tc["name"], args)
        tool_calls.append({"name": tc["name"], "args": args, "id": tc["id"], "type": "tool_call"})

    return {"messages": [AIMessage(content=content_buffer, tool_calls=tool_calls)]}


def _build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("call_model", call_model_node)
    graph.add_node("tools", ToolNode(_TOOLS))
    graph.set_entry_point("call_model")
    graph.add_conditional_edges("call_model", tools_condition)
    graph.add_edge("tools", "call_model")
    return graph.compile(checkpointer=MemorySaver())


# 모듈 로드 시 1회 컴파일되는 싱글톤 그래프 (agent_service.py에서 참조)
compiled_graph = _build_graph()
