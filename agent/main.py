import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from app.models.schemas import AgentQuery, AgentResponse
from app.services.agent_service import meta_agent_service
import logging
import json
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from app.tools import Neo4jConnectionManager

# 환경 변수 로드 (.env 파일이 없어도 시스템 환경 변수 우선 인식)
load_dotenv()

# 환경 변수 설정 (K8s ConfigMap/Secret 연동 대응)
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# 로깅 설정 (Lifespan에서 logger를 먼저 사용할 수 있도록 위치 상향)
log_level = logging.DEBUG if DEBUG else logging.INFO
logging.basicConfig(level=log_level)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Neo4j 연결 검증 (실패해도 텍스트 추론은 가능하므로 degraded mode로 가동)
    logger.info("Starting up: Verifying Neo4j connection...")
    try:
        await Neo4jConnectionManager.verify()
        logger.info("Neo4j connectivity OK.")
    except Exception as e:
        logger.warning(f"Neo4j unavailable at startup, will operate in degraded mode: {e}")
    yield
    # Shutdown: 리소스 해제
    logger.info("Shutting down: Closing Neo4j connection...")
    await Neo4jConnectionManager.close()

app = FastAPI(
    title="Meta Dashboard AI Agent", 
    version="1.0.0",
    debug=DEBUG,
    lifespan=lifespan
)

# CORS 설정: 지정된 도메인으로부터의 요청을 허용함
origins = [
    "https://meta-service.vsaidt.com",
    "https://t-meta-service.vsaidt.com",
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/")
async def root():
    return {"message": "Meta Dashboard AI Agent is running with LangChain & LiteLLM"}

@app.post("/chat", response_model=AgentResponse)
async def chat(query: AgentQuery):
    """
    [하위 호환성 유지] 전체 응답을 한 번에 반환하는 엔드포인트
    - 서비스 레이어의 싱글톤 인스턴스를 활용하여 비즈니스 로직 수행
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
    - 데이터는 JSON 형식으로 패킹되어 전달되며, is_final 플래그로 종료를 알립니다.
    """
    async def event_generator():
        try:
            async for chunk in meta_agent_service.run_agent_stream(
                text=query.text,
                session_id=query.session_id,
                context_data=query.context_data
            ):
                # 클라이언트 수신 편의성을 위해 JSON 패킹
                data = json.dumps({"text": chunk, "is_final": False}, ensure_ascii=False)
                yield f"data: {data}\n\n"
            
            # 스트림 종료 알림
            yield f"data: {json.dumps({'text': '', 'is_final': True})}\n\n"
            
        except Exception as e:
            logger.error(f"Streaming event error: {str(e)}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.delete("/chat/{session_id}")
async def reset_chat(session_id: str):
    """
    특정 세션의 대화 메모리를 명시적으로 삭제하여 초기화합니다.
    """
    success = meta_agent_service.clear_session(session_id)
    if success:
        return {"message": f"Session {session_id} has been reset."}
    else:
        return {"message": f"Session {session_id} not found, but is now clean."}

if __name__ == "__main__":
    import uvicorn
    # 환경 변수 설정을 반영하여 서버 실행 (K8s 가용성 확보)
    uvicorn.run(app, host=HOST, port=PORT)
