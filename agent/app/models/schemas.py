from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict

class ChatMessage(BaseModel):
    role: str
    content: str

class AgentQuery(BaseModel):
    text: str = Field(..., description="사용자의 질문 내용")
    session_id: str = Field(..., description="대화 세션 ID (메모리 관리용)")
    context_data: Optional[Dict[str, Any]] = Field(
        None, 
        description="추가적으로 전달할 콘텍스트 데이터 (예: 학생 정보, 설정값 등)"
    )

class AgentResponse(BaseModel):
    response: str
    session_id: str
    history_count: int
