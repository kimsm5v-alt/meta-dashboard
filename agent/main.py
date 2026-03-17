from fastapi import FastAPI, Depends, HTTPException
from app.models.schemas import AgentQuery, AgentResponse
from app.services.agent_service import meta_agent_service
import logging

app = FastAPI(title="Meta Dashboard AI Agent", version="1.0.0")

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.get("/")
async def root():
    return {"message": "Meta Dashboard AI Agent is running with LangChain & LiteLLM"}

@app.post("/chat", response_model=AgentResponse)
async def chat(query: AgentQuery):
    """
    LLM 에이전트와 대화하는 엔드포인트
    - session_id를 통해 대화 메모리 유지
    - context_data를 통해 추가적인 학생/검사 데이터 전달 가능
    """
    try:
        logger.info(f"Received query for session {query.session_id}: {query.text}")
        
        result = await meta_agent_service.run_agent(
            text=query.text,
            session_id=query.session_id,
            context_data=query.context_data
        )
        
        return AgentResponse(
            response=result["output"],
            session_id=result["session_id"],
            history_count=result["history_count"]
        )
        
    except Exception as e:
        logger.error(f"Error processing agent query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.delete("/chat/{session_id}")
async def reset_chat(session_id: str):
    """
    특정 세션의 대화 내용을 초기화하여 새 대화를 시작합니다.
    """
    success = meta_agent_service.clear_session(session_id)
    if success:
        return {"message": f"Session {session_id} has been reset."}
    else:
        return {"message": f"Session {session_id} not found, but is now clean."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
