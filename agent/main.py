from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import AgentQuery, AgentResponse
from app.services.agent_service import meta_agent_service
import logging
import json

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
    [하위 호환성 유지] 전체 응답을 한 번에 반환하는 엔드포인트
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

@app.post("/chat/stream")
async def chat_stream(query: AgentQuery):
    """
    [신규] 실시간 스트리밍 응답을 반환하는 엔드포인트
    - 클라이언트는 SSE(Server-Sent Events) 방식으로 데이터를 수신합니다.
    - 데이터는 JSON 형식으로 패킹되어 전달됩니다.
    """
    async def event_generator():
        try:
            async for chunk in meta_agent_service.run_agent_stream(
                text=query.text,
                session_id=query.session_id,
                context_data=query.context_data
            ):
                # JSON 형식으로 데이터 패킹 (디자인 패턴 고려)
                data = json.dumps({"text": chunk, "is_final": False}, ensure_ascii=False)
                yield f"data: {data}\n\n"
            
            # 최종 종료 메시지 (프론트엔드 처리용)
            yield f"data: {json.dumps({'text': '', 'is_final': True})}\n\n"
            
        except Exception as e:
            logger.error(f"Streaming event error: {str(e)}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

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
