import litellm
from typing import Dict, Any
import logging
from langchain_core.messages import HumanMessage, AIMessage
from langchain_community.chat_message_histories import ChatMessageHistory
from app.core.llm_router import llm_router
from app.utils.pii_filter import mask_pii_data

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

    def clear_session(self, session_id: str):
        """
        특정 세션의 대화 이력을 삭제하여 새 대화를 시작합니다.
        """
        if session_id in session_store:
            del session_store[session_id]
            return True
        return False

    async def run_agent(self, text: str, session_id: str, context_data: Dict[str, Any] = None):
        """
        LiteLLM Router를 통해 에이전트 실행 및 메모리 처리
        """
        # 1. 세션 이력 가져오기
        history = get_session_history(session_id)

        # 2. PII 마스킹 처리 (CLAUDE.md 가이드라인 준수)
        masked_context = mask_pii_data(context_data)

        # 3. 시스템 프롬프트 구성
        context_str = str(masked_context) if masked_context else "No additional context provided."
        system_prompt = f"귀하는 Meta Dashboard의 AI 에이전트입니다. 전달받은 context_data를 참고하여 답변하십시오.\nContext: {context_str}"
        
        # 4. 메시지 리스트 구성 (System + History + Human)
        messages = [{"role": "system", "content": system_prompt}]
        
        # 이전 대화 이력 추가
        for msg in history.messages:
            if isinstance(msg, HumanMessage):
                messages.append({"role": "user", "content": msg.content})
            elif isinstance(msg, AIMessage):
                messages.append({"role": "assistant", "content": msg.content})
        
        # 현재 질문 추가
        messages.append({"role": "user", "content": text})

        # 5. LiteLLM Router를 통한 호출 (Retry 및 Fallback 자동 처리)
        try:
            # LiteLLM Router가 설정된 모든 키 중 최적의 리소스를 자동 선택 (Load Balancing & Failover)
            response = await self.router.acompletion(
                model="meta-agent-service",
                messages=messages
            )
            answer = response.choices[0].message.content
        except litellm.exceptions.AuthenticationError as e:
            logger.error(f"Authentication error: {str(e)}")
            answer = "API 키 인증 오류가 발생했습니다. 관리자에게 문의하세요. (.env 파일의 API 키를 확인하십시오)"
        except litellm.exceptions.RateLimitError as e:
            logger.error(f"Rate limit error: {str(e)}")
            answer = "현재 요청이 많아 일시적으로 서비스 제한이 발생했습니다. 잠시 후 다시 시도해주세요."
        except litellm.exceptions.Timeout as e:
            logger.error(f"Timeout error: {str(e)}")
            answer = "응답 시간이 초과되었습니다. 네트워크 상태를 확인하거나 잠시 후 다시 시도해주세요."
        except litellm.exceptions.APIError as e:
            logger.error(f"API error: {str(e)}")
            answer = f"AI 서비스 연동 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        except Exception as e:
            logger.error(f"Unexpected error in agent service: {str(e)}", exc_info=True)
            answer = "예상치 못한 오류가 발생했습니다. 관리자에게 문의하세요."

        # 6. 이력 업데이트
        history.add_user_message(text)
        history.add_ai_message(answer)
        
        return {
            "output": answer,
            "session_id": session_id,
            "history_count": len(history.messages)
        }

meta_agent_service = MetaAgentService()
