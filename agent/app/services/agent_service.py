import json
import litellm
from typing import Dict, Any
import logging
from langchain_core.messages import HumanMessage, AIMessage
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.utils.function_calling import convert_to_openai_tool
from app.core.llm_router import llm_router
from app.utils.pii_filter import mask_pii_data
from app.tools import neo4j_tools_list

logger = logging.getLogger(__name__)

# 임메모리 세션 저장소 (프로덕션에서는 Redis 등으로 대체 권장)
session_store: Dict[str, ChatMessageHistory] = {}
session_context_store: Dict[str, Dict[str, Any]] = {}

def get_session_history(session_id: str) -> ChatMessageHistory:
    if session_id not in session_store:
        session_store[session_id] = ChatMessageHistory()
    return session_store[session_id]

class MetaAgentService:
    def __init__(self):
        # LiteLLM Router 인스턴스 사용 (멀티 LLM 오케스트레이션)
        self.router = llm_router
        self.tools = [convert_to_openai_tool(t) for t in neo4j_tools_list]
        self.tool_map = {t.name: t for t in neo4j_tools_list}
        self.max_iterations = 8

    def clear_session(self, session_id: str):
        """특정 세션의 대화 이력과 컨텍스트를 삭제하여 새 대화를 시작합니다."""
        existed = session_id in session_store
        session_store.pop(session_id, None)
        session_context_store.pop(session_id, None)
        return existed

    @staticmethod
    def _normalize_tool_args(_func_name: str, args: dict) -> dict:
        """LLM이 잘못된 schoolLevel 값을 넣어도 정규화하는 후처리 방어 로직

        Args:
            _func_name: 미사용. 향후 Tool별 분기가 필요할 때 활성화.
            args: Tool 호출 인자 (schoolLevel 정규화 대상)
        """
        sl = args.get("schoolLevel")
        if isinstance(sl, str):
            s = sl.strip().lower()
            mapping = {
                "초등": "elementary", "elementary": "elementary", "e": "elementary",
                "중등": "middle", "middle": "middle", "m": "middle",
                # "고등"/"high"는 명시적으로 매핑하지 않음 — VALID_SCHOOL_LEVELS에 없으므로 _validate_args에서 차단됨
            }
            args["schoolLevel"] = mapping.get(s, sl)
        return args

    @staticmethod
    def _build_system_prompt(masked_context: dict | None) -> str:
        """profile 기반으로 Tool 호출 가이드 및 할루시네이션 방지 규칙을 포함한 시스템 프롬프트를 생성한다."""
        profile = (masked_context or {}).get("profile") or {}
        context_text = (masked_context or {}).get("context") or "No additional context provided."
        school_level = profile.get("schoolLevel")
        predicted_type = profile.get("predictedType")

        # profile에 schoolLevel + predictedType이 모두 있을 때만 Tool 호출 유도
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

    def _build_messages(self, text: str, session_id: str, context_data: Dict[str, Any] = None):
        """LLM에 전달할 메시지 목록을 구성한다.

        context_data는 첫 메시지에만 전달되므로, 마스킹 후 세션 단위로 저장하여
        이후 턴에서도 동일한 학생 컨텍스트와 Tool 호출 권한을 유지한다.
        """
        history = get_session_history(session_id)

        if context_data is not None:
            masked = mask_pii_data(context_data)
            if masked:
                session_context_store[session_id] = masked

        effective_context = session_context_store.get(session_id)
        system_prompt = self._build_system_prompt(effective_context)
        
        messages = [{"role": "system", "content": system_prompt}]
        for msg in history.messages:
            if isinstance(msg, HumanMessage):
                messages.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                messages.append({"role": "assistant", "content": msg.content})
                
        messages.append({"role": "user", "content": text})
        return messages, history

    async def run_agent(self, text: str, session_id: str, context_data: Dict[str, Any] = None):
        """
        LiteLLM Router를 통해 에이전트 실행 (Tool Calling 자동화 포함)
        """
        messages, history = self._build_messages(text, session_id, context_data)
        iterations = 0
        answer = "응답을 생성하지 못했습니다."

        try:
            while iterations < self.max_iterations:
                response = await self.router.acompletion(
                    model="meta-agent-service",
                    messages=messages,
                    tools=self.tools
                )
                
                response_message = response.choices[0].message
                
                msg_dict = {"role": "assistant"}
                if response_message.content:
                    msg_dict["content"] = response_message.content
                if getattr(response_message, "tool_calls", None):
                    msg_dict["tool_calls"] = []
                    for tc in response_message.tool_calls:
                        msg_dict["tool_calls"].append({
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments
                            }
                        })
                messages.append(msg_dict)
                
                if not getattr(response_message, "tool_calls", None):
                    answer = response_message.content or "응답을 생성하지 못했습니다."
                    break
                    
                for tool_call in response_message.tool_calls:
                    func_name = tool_call.function.name
                    try:
                        arguments = json.loads(tool_call.function.arguments)
                        arguments = self._normalize_tool_args(func_name, arguments)
                        if func_name in self.tool_map:
                            result = await self.tool_map[func_name].ainvoke(arguments)
                            result_str = json.dumps(result, ensure_ascii=False)
                        else:
                            result_str = f"Error: Tool {func_name} not found"
                    except Exception as e:
                        logger.error(f"Tool error ({func_name}): {e}", exc_info=True)
                        result_str = json.dumps({"error": str(e)})
                        
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": func_name,
                        "content": result_str
                    })
                iterations += 1

            if iterations >= self.max_iterations:
                answer = "에이전트가 최대 허용 횟수 내에 답변을 완료하지 못했습니다."

        except litellm.exceptions.AuthenticationError as e:
            logger.error(f"Authentication error: {str(e)}")
            answer = "API 키 인증 오류가 발생했습니다. 관리자에게 문의하세요."
        except litellm.exceptions.RateLimitError as e:
            logger.error(f"Rate limit error: {str(e)}")
            answer = "현재 요청이 많아 일시적으로 서비스 제한이 발생했습니다."
        except litellm.exceptions.Timeout as e:
            logger.error(f"Timeout error: {str(e)}")
            answer = "응답 시간이 초과되었습니다."
        except litellm.exceptions.APIError as e:
            logger.error(f"API error: {str(e)}")
            answer = "AI 서비스 연동 중 오류가 발생했습니다."
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}", exc_info=True)
            answer = "예상치 못한 오류가 발생했습니다."

        history.add_user_message(text)
        history.add_ai_message(answer)
        
        return {
            "output": answer,
            "session_id": session_id,
            "history_count": len(history.messages)
        }

    async def run_agent_stream(self, text: str, session_id: str, context_data: Dict[str, Any] = None):
        """
        LiteLLM Router를 통해 Tool Calling을 지원하는 스트리밍 오케스트레이션
        """
        messages, history = self._build_messages(text, session_id, context_data)
        iterations = 0
        final_content = ""

        fallback_message = "응답을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요."
        try:
            while iterations < self.max_iterations:
                response = await self.router.acompletion(
                    model="meta-agent-service",
                    messages=messages,
                    tools=self.tools,
                    stream=True
                )

                content_buffer = ""
                tool_call_buffer = {}

                async for chunk in response:
                    delta = chunk.choices[0].delta

                    if getattr(delta, "content", None):
                        content_buffer += delta.content
                        yield delta.content

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

                if not tool_call_buffer:
                    final_content = content_buffer or fallback_message
                    history.add_user_message(text)
                    history.add_ai_message(final_content)
                    break

                # 버퍼에 모인 Tool Call 내역으로 메시지 업데이트
                msg_dict = {"role": "assistant"}
                if content_buffer:
                    msg_dict["content"] = content_buffer

                tool_calls_list = []
                for idx, tc in tool_call_buffer.items():
                    tool_calls_list.append({
                        "id": tc["id"],
                        "type": "function",
                        "function": {"name": tc["name"], "arguments": tc["arguments"]}
                    })
                msg_dict["tool_calls"] = tool_calls_list
                messages.append(msg_dict)

                # Tool 실행
                for tc in tool_calls_list:
                    func_name = tc["function"]["name"]
                    try:
                        arguments = json.loads(tc["function"]["arguments"])
                        arguments = self._normalize_tool_args(func_name, arguments)
                        if func_name in self.tool_map:
                            result = await self.tool_map[func_name].ainvoke(arguments)
                            result_str = json.dumps(result, ensure_ascii=False)
                        else:
                            result_str = f"Error: Tool {func_name} not found"
                    except Exception as e:
                        logger.error(f"Streaming Tool error: {e}")
                        result_str = json.dumps({"error": str(e)})

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "name": func_name,
                        "content": result_str
                    })

                iterations += 1

            if iterations >= self.max_iterations:
                max_iter_message = "에이전트가 최대 허용 횟수 내에 답변을 완료하지 못했습니다."
                history.add_user_message(text)
                history.add_ai_message(max_iter_message)
                yield max_iter_message

        except Exception as e:
            logger.error(f"Streaming error in agent service: {str(e)}", exc_info=True)
            history.add_user_message(text)
            history.add_ai_message(fallback_message)
            yield fallback_message

meta_agent_service = MetaAgentService()
