import requests
import json
import time

BASE_URL = "http://localhost:8000"
SESSION_ID = "test_session_999"

def test_api_health():
    print("\n[1/4] Health Check 테스트 중...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("성공: API가 정상적으로 작동 중입니다.")
            return True
        else:
            print(f"실패: 상태 코드 {response.status_code}")
            return False
    except Exception as e:
        print(f"에러: 서버가 실행 중인지 확인하세요. {e}")
        return False

def test_chat_with_context():
    print("\n[2/4] 컨텍스트를 포함한 첫 번째 대화 테스트 중...")
    payload = {
        "text": "이 학생의 성적을 바탕으로 분석해줘.",
        "session_id": SESSION_ID,
        "context_data": {
            "name": "테스트학생",
            "scores": {"math": 95, "science": 88},
            "recent_comment": "수학에 매우 흥미를 보임"
        }
    }
    try:
        response = requests.post(f"{BASE_URL}/chat", json=payload)
        if response.status_code == 200:
            data = response.json()
            print(f"성공: 응답 수신 완료 (이력 개수: {data.get('history_count')})")
            print(f"AI 응답: {data.get('response')[:100]}...")
            return True
        else:
            print(f"실패: 상태 코드 {response.status_code}")
            return False
    except Exception as e:
        print(f"에러: {e}")
        return False

def test_memory_continuity():
    print("\n[3/4] 대화 메모리 지속성 테스트 중...")
    payload = {
        "text": "내가 방금 전에 분석해달라고 한 학생의 수학 점수는 몇 점이었지?",
        "session_id": SESSION_ID
    }
    try:
        response = requests.post(f"{BASE_URL}/chat", json=payload)
        if response.status_code == 200:
            data = response.json()
            print(f"성공: 메모리 기반 응답 수신 완료 (이력 개수: {data.get('history_count')})")
            print(f"AI 응답: {data.get('response')}")
            return True
        else:
            print(f"실패: 상태 코드 {response.status_code}")
            return False
    except Exception as e:
        print(f"에러: {e}")
        return False

def test_reset_session():
    print("\n[4/4] 세션 초기화 테스트 중...")
    try:
        response = requests.delete(f"{BASE_URL}/chat/{SESSION_ID}")
        if response.status_code == 200:
            print(f"성공: {response.json().get('message')}")
            # 초기화 확인을 위한 검증 (이력 개수 확인 등은 다음 대화에서 가능)
            return True
        else:
            print(f"실패: 상태 코드 {response.status_code}")
            return False
    except Exception as e:
        print(f"에러: {e}")
        return False

if __name__ == "__main__":
    print("="*50)
    print("Meta Dashboard AI Agent 통합 테스트 시작")
    print("="*50)
    
    if test_api_health():
        test_chat_with_context()
        time.sleep(1) # 약간의 지연
        test_memory_continuity()
        time.sleep(1)
        test_reset_session()
    
    print("\n" + "="*50)
    print("테스트 종료")
    print("="*50)
