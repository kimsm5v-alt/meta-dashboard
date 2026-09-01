import json
import os
import uuid
import litellm
from typing import Any, Dict, List, Optional
import logging
from langchain_core.messages import HumanMessage, AIMessage
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.utils.function_calling import convert_to_openai_tool
import langsmith
from langsmith import traceable
from langgraph.errors import GraphRecursionError
from app.core.llm_router import llm_router, ROUTER_MODEL_NAME
from app.core.agent_graph import compiled_graph, RECURSION_LIMIT, MAX_ITERATIONS_FALLBACK_MESSAGE
from app.core.prompts import load_prompt
from app.utils.pii_filter import mask_pii_data
from app.tools import all_tools_list
from app.core.tracing import is_enabled as langsmith_is_enabled

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
        self.tools = [convert_to_openai_tool(t) for t in all_tools_list]
        self.tool_map = {t.name: t for t in all_tools_list}
        self.max_iterations = 8

    @traceable(run_type="llm", name="LiteLLM")
    async def _call_llm_once(self, messages: list, tools: list) -> Any:
        """
        단일 LLM 호출을 수행한다. (non-stream)

        @traceable 데코레이터를 통해 LangSmith ContextVar에서 부모 Run을 자동 인식한다.
        상위에 langsmith.trace() context가 존재하면 자식 Run으로 연결된다.
        """
        return await self.router.acompletion(
            model=ROUTER_MODEL_NAME,
            messages=messages,
            tools=tools,
        )

    @traceable(run_type="tool")
    async def _invoke_tool_with_tracing(self, func_name: str, arguments: dict) -> str:
        """
        Tool을 실행하고 결과를 JSON 문자열로 반환한다.

        @traceable 데코레이터를 통해 LangSmith ContextVar에서 부모 Run을 자동 인식한다.
        상위에 langsmith.trace() context가 존재하면 자식 Tool Run으로 연결된다.
        Tool 미존재 또는 실행 오류 시 예외를 그대로 raise하여 @traceable이
        LangSmith에 실패 Run으로 기록할 수 있도록 한다.
        """
        if func_name not in self.tool_map:
            raise ValueError(f"Tool '{func_name}' not found")
        result = await self.tool_map[func_name].ainvoke(arguments)
        return json.dumps(result, ensure_ascii=False)

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
        """mode + profile 기반으로 Tool 호출 가이드 및 할루시네이션 방지 규칙을 포함한 시스템 프롬프트를 생성한다.

        mode(student/class/all)는 프론트엔드 AI Room이 명시적으로 보내는 컨텍스트 모드다.
        mode가 없는 호출자(예: dataHelperService처럼 profile만 보내는 기존 연동)와의 하위 호환을 위해,
        mode가 없거나 "student"면 기존과 동일하게 schoolLevel+predictedType 존재 여부로 판단한다.
        """
        ctx = masked_context or {}
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

        domain_knowledge = (
            f"{load_prompt('domain_knowledge_basic_info')}\n\n"
            f"{load_prompt('domain_knowledge_operations')}\n\n"
            f"{load_prompt('domain_knowledge_ai_assistant')}\n\n"
            f"{load_prompt('domain_knowledge_coaching')}"
        )

        return (
            f"{load_prompt('role_and_rules')}\n\n"
            "## 학습심리정서 도메인 참고 문서\n"
            f"{domain_knowledge}\n\n"
            f"{profile_block}"
            f"## Tool 호출 정책\n{tool_policy}\n"
            "\n## 학생 컨텍스트 (마크다운)\n"
            f"{context_text}"
        )

    @staticmethod
    def _append_user_turn(messages: list, text: str, images: Optional[List[str]]) -> None:
        """현재 사용자 발화를 messages에 추가한다. images가 있으면 멀티모달 블록으로 얹는다."""
        if images:
            messages.append({
                "role": "user",
                "content": [{"type": "text", "text": text}] + [
                    {"type": "image_url", "image_url": {"url": img}} for img in images
                ],
            })
        else:
            messages.append({"role": "user", "content": text})

    def _build_messages(self, text: str, session_id: str, context_data: Dict[str, Any] = None,
                        images: Optional[List[str]] = None,
                        history: Optional[List[Any]] = None):
        """LLM에 전달할 메시지 목록을 구성한다.

        두 가지 모드로 동작한다:
        - 무상태(stateless) 모드: history가 주어지면(빈 리스트 포함) 대화 이력의 정본은
          백엔드 DB이며, 여기서는 전달받은 history로 컨텍스트를 구성한다. 인메모리
          세션(session_store/session_context_store)을 읽거나 쓰지 않는다. context_data는
          매 턴 전달되므로 마스킹 후 시스템 프롬프트에 그대로 반영한다.
          반환하는 session_history는 None이다(영속 대상 없음).
        - 레거시(in-memory) 모드: history가 None이면 기존과 동일하게 session_store에
          누적된 이력을 사용하고, context_data는 첫 턴에만 전달되어 세션에 캐시된다.

        images는 이번 턴에만 쓰이는 휘발성 입력이다 — LLM 전송용 messages에는 포함되지만
        어떤 이력에도 저장되지 않는다(텍스트만 남긴다).
        """
        # --- 무상태 모드: 이력의 정본은 DB, 프론트가 매 턴 replay ---
        if history is not None:
            masked = mask_pii_data(context_data) if context_data else None
            system_prompt = self._build_system_prompt(masked)
            messages = [{"role": "system", "content": system_prompt}]
            for msg in history:
                role = getattr(msg, "role", None)
                content = getattr(msg, "content", None)
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": content})
            self._append_user_turn(messages, text, images)
            return messages, None

        # --- 레거시(in-memory) 모드 ---
        session_history = get_session_history(session_id)

        if context_data is not None:
            masked = mask_pii_data(context_data)
            if masked:
                session_context_store[session_id] = masked

        effective_context = session_context_store.get(session_id)
        system_prompt = self._build_system_prompt(effective_context)

        messages = [{"role": "system", "content": system_prompt}]
        for msg in session_history.messages:
            if isinstance(msg, HumanMessage):
                messages.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                messages.append({"role": "assistant", "content": msg.content})

        self._append_user_turn(messages, text, images)
        return messages, session_history

    async def run_agent(self, text: str, session_id: str, context_data: Dict[str, Any] = None,
                         images: Optional[List[str]] = None,
                         history: Optional[List[Any]] = None):
        """
        LiteLLM Router를 통해 에이전트 실행 (Tool Calling 자동화 포함)

        history가 주어지면 요청 단위 무상태 모드로 동작한다(이력 정본=DB). 생략 시
        기존 인메모리 세션 모드로 폴백한다. 자세한 내용은 _build_messages 참고.

        LangSmith 구조:
          langsmith.trace("meta-agent-run")       최상위 Run (메타데이터, 태그 포함)
            ├── LiteLLM (@traceable, run_type=llm) LLM 호출 자식 Run
            └── tool:xxx (@traceable, run_type=tool) Tool 실행 자식 Run
        """
        profile = (context_data or {}).get("profile", {})
        _trace_ctx = None
        _run_tree = None
        _langsmith_error: str | None = None
        answer = "응답을 생성하지 못했습니다."

        # trace inputs에 system_prompt를 포함하기 위해 trace 진입 전에 먼저 빌드
        # session_history는 무상태 모드에서 None (영속 대상 없음)
        messages, session_history = self._build_messages(text, session_id, context_data, images, history)

        # 초기 메시지 수 기록: outputs에서 에이전트가 추가한 메시지만 슬라이싱하기 위해
        _initial_msg_len = len(messages)

        if langsmith_is_enabled():
            # inputs["messages"]: OpenAI 채팅 형식 → LangSmith가 System/User/AI/Tool 아이콘으로 렌더링
            _trace_ctx = langsmith.trace(
                name="meta-agent-run",
                inputs={"messages": list(messages)},
                tags=["agent", "non-stream"],
                metadata={
                    "session_id": session_id,
                    "school_level": profile.get("schoolLevel"),
                    "predicted_type": profile.get("predictedType"),
                },
            )
            _run_tree = _trace_ctx.__enter__()

        try:
            iterations = 0

            while iterations < self.max_iterations:
                # @traceable(run_type="llm")이 LangSmith ContextVar를 통해
                # 자동으로 최상위 Run의 자식 LLM Run으로 연결됨
                response = await self._call_llm_once(messages, self.tools)

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
                        # @traceable(run_type="tool")이 ContextVar를 통해 자동으로 자식 Run으로 연결됨
                        result_str = await self._invoke_tool_with_tracing(func_name, arguments)
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
            _langsmith_error = f"AuthenticationError: {e}"
        except litellm.exceptions.RateLimitError as e:
            logger.error(f"Rate limit error: {str(e)}")
            answer = "현재 요청이 많아 일시적으로 서비스 제한이 발생했습니다."
            _langsmith_error = f"RateLimitError: {e}"
        except litellm.exceptions.Timeout as e:
            logger.error(f"Timeout error: {str(e)}")
            answer = "응답 시간이 초과되었습니다."
            _langsmith_error = f"Timeout: {e}"
        except litellm.exceptions.APIError as e:
            logger.error(f"API error: {str(e)}")
            answer = "AI 서비스 연동 중 오류가 발생했습니다."
            _langsmith_error = f"APIError: {e}"
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}", exc_info=True)
            answer = "예상치 못한 오류가 발생했습니다."
            _langsmith_error = f"UnexpectedError: {e}"
        finally:
            if _trace_ctx is not None:
                if _run_tree is not None:
                    # outputs["messages"]: 에이전트가 추가한 메시지만 (AI + Tool), System/User 제외
                    _run_tree.end(
                        outputs={"messages": messages[_initial_msg_len:], "response": answer},
                        error=_langsmith_error,
                    )
                _trace_ctx.__exit__(None, None, None)

        # 무상태 모드(session_history is None)에서는 이력 정본이 DB이므로 여기서 저장하지 않는다.
        if session_history is not None:
            session_history.add_user_message(text)
            session_history.add_ai_message(answer)
            history_count = len(session_history.messages)
        else:
            # 전달받은 이력(직전 턴들) + 이번 사용자 발화 + 이번 답변
            history_count = len(history) + 2

        return {
            "output": answer,
            "session_id": session_id,
            "history_count": history_count,
        }

    async def run_agent_stream(self, text: str, session_id: str, context_data: Dict[str, Any] = None,
                                images: Optional[List[str]] = None,
                                history: Optional[List[Any]] = None):
        """
        LiteLLM Router를 통해 Tool Calling을 지원하는 스트리밍 오케스트레이션.

        history가 주어지면 요청 단위 무상태 모드로 동작한다(이력 정본=DB). 생략 시
        기존 인메모리 세션 모드로 폴백한다. 자세한 내용은 _build_messages 참고.

        LangSmith 구조:
          langsmith.trace("meta-agent-stream")     최상위 Run (스트리밍 전체)
            └── tool:xxx (@traceable, run_type=tool) Tool 실행 자식 Run
          * stream LLM 호출은 @traceable 적용 불가하여 개별 추적 안 됨
        """
        profile = (context_data or {}).get("profile", {})
        _trace_ctx = None
        _run_tree = None
        _stream_output = ""
        _langsmith_error: str | None = None

        # trace inputs에 system_prompt를 포함하기 위해 trace 진입 전에 먼저 빌드
        # session_history는 무상태 모드에서 None (영속 대상 없음)
        messages, session_history = self._build_messages(text, session_id, context_data, images, history)

        def _persist(ai_text: str) -> None:
            """레거시 인메모리 모드에서만 이번 턴을 세션 이력에 저장한다.
            무상태 모드(session_history is None)에서는 이력 정본이 DB이므로 no-op."""
            if session_history is not None:
                session_history.add_user_message(text)
                session_history.add_ai_message(ai_text)

        # 초기 메시지 수 기록: outputs에서 에이전트가 추가한 메시지만 슬라이싱하기 위해
        _initial_msg_len = len(messages)

        if langsmith_is_enabled():
            # inputs["messages"]: OpenAI 채팅 형식 → LangSmith가 System/User/AI/Tool 아이콘으로 렌더링
            _trace_ctx = langsmith.trace(
                name="meta-agent-stream",
                inputs={"messages": list(messages)},
                tags=["agent", "stream"],
                metadata={
                    "session_id": session_id,
                    "school_level": profile.get("schoolLevel"),
                    "predicted_type": profile.get("predictedType"),
                },
            )
            _run_tree = _trace_ctx.__enter__()

        try:
            iterations = 0
            final_content = ""

            fallback_message = "응답을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요."
            try:
                while iterations < self.max_iterations:
                    # 스트리밍 모드: @traceable 적용 불가하여 router.acompletion 직접 호출
                    # LangSmith에는 최상위 Run + Tool 자식 Run만 기록됨 (LLM 개별 호출은 미추적)
                    response = await self.router.acompletion(
                        model=ROUTER_MODEL_NAME,
                        messages=messages,
                        tools=self.tools,
                        stream=True,
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
                        _stream_output = final_content
                        # 최종 AI 응답을 messages에 추가해야 LangSmith Output에 assistant 턴이 표시됨
                        messages.append({"role": "assistant", "content": final_content})
                        _persist(final_content)
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

                    # Tool 실행: @traceable(run_type="tool")이 ContextVar를 통해 자식 Run으로 연결됨
                    for tc in tool_calls_list:
                        func_name = tc["function"]["name"]
                        try:
                            arguments = json.loads(tc["function"]["arguments"])
                            arguments = self._normalize_tool_args(func_name, arguments)
                            result_str = await self._invoke_tool_with_tracing(func_name, arguments)
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
                    _stream_output = max_iter_message
                    messages.append({"role": "assistant", "content": max_iter_message})
                    _persist(max_iter_message)
                    yield max_iter_message

            except litellm.exceptions.AuthenticationError as e:
                logger.error(f"Authentication error: {str(e)}")
                msg = "API 키 인증 오류가 발생했습니다. 관리자에게 문의하세요."
                _stream_output = msg
                _langsmith_error = f"AuthenticationError: {e}"
                _persist(msg)
                yield msg
            except litellm.exceptions.RateLimitError as e:
                logger.error(f"Rate limit error: {str(e)}")
                msg = "현재 요청이 많아 일시적으로 서비스 제한이 발생했습니다."
                _stream_output = msg
                _langsmith_error = f"RateLimitError: {e}"
                _persist(msg)
                yield msg
            except litellm.exceptions.Timeout as e:
                logger.error(f"Timeout error: {str(e)}")
                msg = "응답 시간이 초과되었습니다."
                _stream_output = msg
                _langsmith_error = f"Timeout: {e}"
                _persist(msg)
                yield msg
            except litellm.exceptions.APIError as e:
                logger.error(f"API error: {str(e)}")
                msg = "AI 서비스 연동 중 오류가 발생했습니다."
                _stream_output = msg
                _langsmith_error = f"APIError: {e}"
                _persist(msg)
                yield msg
            except Exception as e:
                logger.error(f"Streaming error in agent service: {str(e)}", exc_info=True)
                _stream_output = fallback_message
                _langsmith_error = f"UnexpectedError: {e}"
                _persist(fallback_message)
                yield fallback_message

        except BaseException:
            if _trace_ctx is not None:
                if _run_tree is not None:
                    _run_tree.end(
                        outputs={
                            "messages": messages[_initial_msg_len:],
                            "response": _stream_output or "응답을 생성하지 못했습니다.",
                        },
                        error=_langsmith_error,
                    )
                _trace_ctx.__exit__(None, None, None)
                _trace_ctx = None
            raise
        finally:
            if _trace_ctx is not None:
                if _run_tree is not None:
                    _run_tree.end(
                        outputs={
                            "messages": messages[_initial_msg_len:],
                            "response": _stream_output or "응답을 생성하지 못했습니다.",
                        },
                        error=_langsmith_error,
                    )
                _trace_ctx.__exit__(None, None, None)


class LangGraphAgentService:
    """LangGraph StateGraph 기반 구현 (병행 운영용).

    MetaAgentService(레거시)와 동일한 인터페이스(run_agent/run_agent_stream/clear_session)를
    제공하여 main.py 수정 없이 AGENT_BACKEND 플래그로 전환할 수 있게 한다.
    설계 근거: agent/docs/LANGGRAPH_MIGRATION_PLAN.md
    """

    def __init__(self):
        self.graph = compiled_graph

    @staticmethod
    def _history_count(messages: list) -> int:
        """레거시 ChatMessageHistory와 동일한 의미(사용자 턴 + 최종 답변 턴 수)로 카운트한다.

        LangGraph는 tool-call 중간 AIMessage/ToolMessage도 함께 영속화하므로
        전체 messages 길이를 그대로 쓰면 레거시 대비 값이 부풀려진다.
        """
        return sum(
            1
            for m in messages
            if isinstance(m, HumanMessage)
            or (isinstance(m, AIMessage) and not m.tool_calls)
        )

    @staticmethod
    def _history_to_lc_messages(history: List[Any]) -> list:
        """프론트가 replay한 이력(role/content)을 LangChain 메시지로 변환한다.
        무상태 모드에서 그래프 초기 state["messages"]로 주입된다."""
        lc_messages: list = []
        for msg in history:
            role = getattr(msg, "role", None)
            content = getattr(msg, "content", None)
            if not content:
                continue
            if role == "user":
                lc_messages.append(HumanMessage(content=content))
            elif role == "assistant":
                lc_messages.append(AIMessage(content=content))
        return lc_messages

    def _prepare_invocation(self, text: str, session_id: str, history: Optional[List[Any]]):
        """(thread_id, initial_messages, ephemeral) 3-튜플을 구성한다.

        history가 주어지면(무상태 모드) 이번 요청 전용 ephemeral thread_id를 사용해
        체크포인트가 턴 간에 누적/병합되지 않게 하고, 이력은 초기 messages로 주입한다.
        ephemeral=True인 경우 호출부가 사용 후 delete_thread로 정리해야 메모리 누수가 없다.
        """
        if history is not None:
            thread_id = f"{session_id}:{uuid.uuid4().hex}"
            initial_messages = self._history_to_lc_messages(history) + [HumanMessage(content=text)]
            return thread_id, initial_messages, True
        return session_id, [HumanMessage(content=text)], False

    async def _recover_from_recursion_limit(self, thread_id: str) -> None:
        """GraphRecursionError 발생 시 레거시와 동일한 폴백 메시지를 이력에 남기고
        thread 상태를 "완료됨"으로 되돌린다 (as_node="call_model" -> tools_condition이
        tool_calls 없는 메시지를 보고 END로 라우팅). 이렇게 하지 않으면 체크포인트가
        중단된 지점(tools 재실행 대기)에 멈춰 있어 다음 턴이 정상적으로 시작되지 않는다.
        """
        config = {"configurable": {"thread_id": thread_id}}
        await self.graph.aupdate_state(
            config,
            {"messages": [AIMessage(content=MAX_ITERATIONS_FALLBACK_MESSAGE)]},
            as_node="call_model",
        )

    @staticmethod
    def _resolve_student_context_update(context_data: Optional[Dict[str, Any]]) -> Optional[dict]:
        """legacy(MetaAgentService._build_messages)와 동일하게, 마스킹 결과가 빈 값이면
        기존 student_context를 덮어쓰지 않도록 None을 반환한다.

        context_data가 None이면 애초에 갱신 의도가 없는 것이고, {}처럼 falsy한
        마스킹 결과도 "의미 있는 새 컨텍스트 없음"으로 취급해야 한다. student_context
        reducer(_keep_or_update)는 None이 아닌 값을 받으면 무조건 덮어쓰므로, 여기서
        None으로 정규화하지 않으면 이전 턴에 확립된 학생 프로필이 사라질 수 있다.
        """
        if context_data is None:
            return None
        masked = mask_pii_data(context_data)
        return masked if masked else None

    async def run_agent(self, text: str, session_id: str, context_data: Dict[str, Any] = None,
                         images: Optional[List[str]] = None,
                         history: Optional[List[Any]] = None):
        student_context_update = self._resolve_student_context_update(context_data)
        thread_id, initial_messages, ephemeral = self._prepare_invocation(text, session_id, history)
        config = {"configurable": {"thread_id": thread_id}, "recursion_limit": RECURSION_LIMIT}

        try:
            try:
                result = await self.graph.ainvoke(
                    {
                        "messages": initial_messages,
                        "student_context": student_context_update,
                        # 명시적으로 매 호출마다 덮어써서 이전 턴 이미지가 이번 턴에 새지 않게 한다
                        # (reducer가 없는 필드라 키를 생략하면 이전 체크포인트 값이 남을 수 있음).
                        "pending_images": images,
                    },
                    config=config,
                )
                answer = result["messages"][-1].content or "응답을 생성하지 못했습니다."
                messages_for_count = result["messages"]
            except GraphRecursionError:
                logger.warning(f"Recursion limit reached for session {session_id}")
                await self._recover_from_recursion_limit(thread_id)
                answer = MAX_ITERATIONS_FALLBACK_MESSAGE
                snapshot = await self.graph.aget_state(config)
                messages_for_count = snapshot.values["messages"]
        finally:
            # 무상태 모드의 ephemeral thread는 재사용하지 않으므로 즉시 정리(메모리 누수 방지)
            if ephemeral:
                self.graph.checkpointer.delete_thread(thread_id)

        return {
            "output": answer,
            "session_id": session_id,
            "history_count": self._history_count(messages_for_count),
        }

    async def run_agent_stream(self, text: str, session_id: str, context_data: Dict[str, Any] = None,
                                images: Optional[List[str]] = None,
                                history: Optional[List[Any]] = None):
        student_context_update = self._resolve_student_context_update(context_data)
        thread_id, initial_messages, ephemeral = self._prepare_invocation(text, session_id, history)
        config = {"configurable": {"thread_id": thread_id}, "recursion_limit": RECURSION_LIMIT}

        yielded_any = False
        try:
            try:
                async for chunk in self.graph.astream(
                    {
                        "messages": initial_messages,
                        "student_context": student_context_update,
                        "pending_images": images,
                    },
                    config=config,
                    stream_mode="custom",
                ):
                    if chunk.get("type") == "token" and chunk.get("text"):
                        yielded_any = True
                        yield chunk["text"]
            except GraphRecursionError:
                logger.warning(f"Recursion limit reached for session {session_id} (stream)")
                await self._recover_from_recursion_limit(thread_id)
                yield MAX_ITERATIONS_FALLBACK_MESSAGE
                # 아래 "미생성" 폴백으로 흘러 들어가 메시지가 중복 전송되지 않도록 여기서 종료한다.
                # (async generator에서 return은 함수 끝 도달과 동일하지 않다 — 이 아래에 실행될
                # 코드가 남아있는 한 return 없이는 반드시 폴스루된다.)
                return
        finally:
            if ephemeral:
                self.graph.checkpointer.delete_thread(thread_id)

        if not yielded_any:
            yield "응답을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요."

    def clear_session(self, session_id: str) -> bool:
        """특정 세션(thread)의 체크포인트 이력을 삭제한다."""
        config = {"configurable": {"thread_id": session_id}}
        existed = self.graph.checkpointer.get_tuple(config) is not None
        self.graph.checkpointer.delete_thread(session_id)
        return existed


# AGENT_BACKEND=langgraph 이면 신규 LangGraph 구현, 그 외(기본값 "legacy")면 기존 구현을 사용한다.
# 병행 운영 전략: agent/docs/LANGGRAPH_MIGRATION_PLAN.md 4장 참고.
AGENT_BACKEND = os.getenv("AGENT_BACKEND", "legacy").strip().lower()

if AGENT_BACKEND == "langgraph":
    logger.info("AGENT_BACKEND=langgraph: LangGraph 기반 MetaAgentService 사용")
    meta_agent_service = LangGraphAgentService()
else:
    logger.info("AGENT_BACKEND=legacy: 기존 수작업 ReAct 루프 기반 MetaAgentService 사용")
    meta_agent_service = MetaAgentService()
