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
session_store = {}

def get_session_history(session_id: str):
    if session_id not in session_store:
        session_store[session_id] = ChatMessageHistory()
    return session_store[session_id]

class MetaAgentService:
    def __init__(self):
        # LiteLLM Router 인스턴스 사용 (멀티 LLM 오케스트레이션)
        self.router = llm_router
        self.tools = [convert_to_openai_tool(t) for t in neo4j_tools_list]
        self.tool_map = {t.name: t for t in neo4j_tools_list}
        self.max_iterations = 5

    def clear_session(self, session_id: str):
        """
        특정 세션의 대화 이력을 삭제하여 새 대화를 시작합니다.
        """
        if session_id in session_store:
            del session_store[session_id]
            return True
        return False

    def _build_messages(self, text: str, session_id: str, context_data: Dict[str, Any] = None):
        history = get_session_history(session_id)
        masked_context = mask_pii_data(context_data)
        if masked_context:
            context_str = masked_context.get("context") or str(masked_context)
        else:
            context_str = "No additional context provided."
        
        system_prompt = (
            "귀하는 Meta Dashboard의 AI 에이전트입니다.\n"
            "전달받은 context_data를 참고하여 답변하십시오.\n"
            "전달된 context_data에서 사용자의 유형(className)과 학교급(schoolLevel)을 파악하십시오.\n"
            "필요 시 제공된 Neo4j Graph Tools를 활용하여 해당 유형의 조절/매개 경로 및 T-Score 평균을 조회하십시오.\n"
            "조회된 데이터를 바탕으로 학생의 현재 상태를 진단하고 맞춤형 학습 피드백을 제공하십시오.\n"
            f"Context: {context_str}"
        )
        
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
