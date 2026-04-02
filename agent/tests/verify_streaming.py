import asyncio
import sys
import os

# 프로젝트 루트 디렉토리를 PYTHONPATH에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.agent_service import meta_agent_service

async def test_streaming():
    print("--- 스트리밍 테스트 시작 ---")
    session_id = "test_session_123"
    query = "안녕하세요, 주입된 LLM 키로 정상적으로 동작하는지 짧은 인사를 남겨주세요."
    
    print(f"질문: {query}")
    print("응답: ", end="", flush=True)
    
    full_response = ""
    async for chunk in meta_agent_service.run_agent_stream(query, session_id):
        if chunk.startswith("Error:"):
            print(f"\n에러 발생: {chunk}")
            return
        
        print(chunk, end="", flush=True)
        full_response += chunk
        # 실시간 느낌을 확인하기 위해 약간의 지연 (실제로는 LLM 응답 속도에 따름)
        await asyncio.sleep(0.01)

    print("\n\n--- 스트리밍 완료 ---")
    print(f"최종 누적 대화 길이: {len(full_response)}자")
    
    # 이력 저장이 잘 되었는지 확인 (내부 store 조회)
    from app.services.agent_service import session_store
    history = session_store.get(session_id)
    if history and len(history.messages) >= 2:
        print("✅ 대화 이력이 성공적으로 저장되었습니다.")
    else:
        print("❌ 대화 이력 저장에 실패했습니다.")

if __name__ == "__main__":
    if not os.getenv("GEMINI_API_KEY"):
        print("⚠️ GEMINI_API_KEY 환경변수가 설정되지 않았습니다. 테스트가 실패할 수 있습니다.")
    
    try:
        asyncio.run(test_streaming())
    except Exception as e:
        print(f"\n❌ 테스트 중 예외 발생: {e}")
