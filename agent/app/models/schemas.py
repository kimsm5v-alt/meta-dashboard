from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict

class ChatMessage(BaseModel):
    role: str
    content: str

class AgentQuery(BaseModel):
    text: str = Field(..., description="사용자의 질문 내용")
    session_id: str = Field(..., description="대화 세션 ID (트레이싱/로그 상관관계용)")
    context_data: Optional[Dict[str, Any]] = Field(
        None,
        description="추가적으로 전달할 콘텍스트 데이터 (예: 학생 정보, 설정값 등)"
    )
    history: Optional[List[ChatMessage]] = Field(
        None,
        description=(
            "직전까지의 대화 이력(정본은 백엔드 DB). 값이 오면 에이전트는 이 이력으로 "
            "컨텍스트를 구성하는 '요청 단위 무상태' 모드로 동작하고, 자체 인메모리 세션에 "
            "이력을 누적하지 않는다. 생략 시 기존 인메모리 세션 모드로 폴백한다. "
            "현재 사용자 발화(text)는 포함하지 않는다."
        ),
    )
    images: Optional[List[str]] = Field(
        None,
        description=(
            "멀티모달 컨텍스트로 사용할 이미지 목록 (data URI 형식: data:image/png;base64,...). "
            "최대 3장, 장당 5MB. 해당 턴에서만 사용되며 세션 히스토리에는 저장되지 않습니다."
        ),
    )

class AgentResponse(BaseModel):
    response: str
    session_id: str
    history_count: int

class StreamChunk(BaseModel):
    """스트리밍 응답의 작은 조각(Chunk)을 정의하는 스키마"""
    text: str = Field(..., description="현재 생성된 텍스트 조각")
    is_final: bool = Field(False, description="마지막 조각 여부")
    session_id: Optional[str] = None
