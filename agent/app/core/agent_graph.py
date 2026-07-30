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
from app.core.prompts import load_prompt
from app.tools import all_tools_list

logger = logging.getLogger(__name__)


def _keep_or_update(old: Optional[dict], new: Optional[dict]) -> Optional[dict]:
    """student_context reducer: 이번 턴에 값이 없으면 이전 턴 값을 유지한다."""
    return new if new is not None else old


class AgentState(TypedDict):
    messages: Annotated[list, add_messages]
    student_context: Annotated[Optional[dict], _keep_or_update]
    # 이번 턴에만 쓰이는 휘발성 이미지 입력 (data URI 목록). reducer 없음 = 매 invoke마다
    # 전달한 값으로 덮어쓰기(overwrite)되므로, 다음 턴에 생략/None으로 넘기면 자동으로 사라진다.
    # state["messages"]에는 포함되지 않으므로 체크포인트(세션 히스토리)에도 남지 않는다.
    pending_images: Optional[list]


_TOOLS = all_tools_list
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
    """mode + profile 기반으로 Tool 호출 가이드 및 할루시네이션 방지 규칙을 포함한 시스템 프롬프트를 생성한다.

    mode(student/class/all)는 프론트엔드 AI Room이 명시적으로 보내는 컨텍스트 모드다.
    mode가 없는 호출자(예: dataHelperService처럼 profile만 보내는 기존 연동)와의 하위 호환을 위해,
    mode가 없거나 "student"면 기존과 동일하게 schoolLevel+predictedType 존재 여부로 판단한다.
    """
    ctx = student_context or {}
    mode = ctx.get("mode")
    profile = ctx.get("profile") or {}
    context_text = ctx.get("context") or "No additional context provided."

    school_level = profile.get("schoolLevel")
    predicted_type = profile.get("predictedType")
    stdt_id = profile.get("stdtId")
    cla_id = profile.get("claId")
    tc_id = profile.get("tcId")
    grade = profile.get("grade")
    class_number = profile.get("classNumber")
    is_high_school = profile.get("schoolLevelCode") == "high"

    high_school_notice = (
        "- ⚠️ 실제 학교급: 고등학교 (위 schoolLevel은 고등학생 전용 심리유형 모델이 아직 없어 "
        "중등 모델을 재사용한 값입니다. 답변 시 반드시 고지하십시오)\n"
    )

    if mode in (None, "student") and school_level and predicted_type:
        profile_block = (
            "\n## 분석 대상 학생 식별자 (Tool 호출 인자로 그대로 사용)\n"
            f"- className: \"{predicted_type}\"\n"
            f"- schoolLevel: \"{school_level}\"\n"
        )
        if stdt_id:
            profile_block += f"- stdt_id: \"{stdt_id}\"\n"
        if cla_id:
            profile_block += f"- cla_id: \"{cla_id}\"\n"
        if tc_id:
            profile_block += f"- tc_id: \"{tc_id}\"\n"
        if is_high_school:
            profile_block += high_school_notice
        tool_policy = load_prompt("tool_policy_student")
    elif mode == "class" and cla_id:
        profile_block = "\n## 분석 대상 학급 식별자 (Tool 호출 인자로 그대로 사용)\n" f"- cla_id: \"{cla_id}\"\n"
        if tc_id:
            profile_block += f"- tc_id: \"{tc_id}\"\n"
        if school_level:
            profile_block += f"- schoolLevel: \"{school_level}\"\n"
        if grade:
            profile_block += f"- grade: \"{grade}\"\n"
        if class_number:
            profile_block += f"- classNumber: \"{class_number}\"\n"
        if is_high_school:
            profile_block += high_school_notice
        tool_policy = load_prompt("tool_policy_class")
    elif mode == "all" and tc_id:
        profile_block = "\n## 담당 교사 식별자 (Tool 호출 인자로 그대로 사용)\n" f"- tc_id: \"{tc_id}\"\n"
        tool_policy = load_prompt("tool_policy_teacher")
    else:
        profile_block = ""
        tool_policy = load_prompt("tool_policy_none")

    return (
        f"{load_prompt('role_and_rules')}\n\n"
        f"{profile_block}"
        f"## Tool 호출 정책\n{tool_policy}\n"
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


def _inject_pending_images(openai_messages: list, pending_images: Optional[list]) -> None:
    """가장 최근 user 메시지의 content를 멀티모달 블록으로 변환해 이미지를 주입한다.

    state["messages"]는 텍스트만 저장하므로(비영속 정책), 이미지는 여기서 LLM 전송
    직전에만 얹는다. tool-call 왕복 중에는 마지막 메시지가 role="tool"일 수 있으므로
    뒤에서부터 가장 최근 role="user" 메시지를 찾아 주입한다(이번 턴의 원본 질문).
    """
    if not pending_images:
        return
    for msg in reversed(openai_messages):
        if msg.get("role") == "user":
            text_content = msg["content"]
            image_blocks = [{"type": "image_url", "image_url": {"url": img}} for img in pending_images]
            msg["content"] = [{"type": "text", "text": text_content}] + image_blocks
            break


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
    _inject_pending_images(openai_messages, state.get("pending_images"))

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
