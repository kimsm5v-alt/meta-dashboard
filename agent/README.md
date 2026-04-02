# Meta Dashboard AI Agent Service

이 서비스는 맞춤형 학습 분석 대시보드를 위한 고성능 AI 에이전트 백엔드입니다. LangChain과 LiteLLM을 결합하여 대규모 트래픽 수용이 가능한 엔터프라이즈급 아키텍처를 지향합니다.

## 1. 아키텍처 및 핵심 기능

### 1.1 계층 구조
- **API Layer (FastAPI)**: RESTful 엔드포인트를 제공하며, 비동기 처리를 통해 높은 처리량(Throughput)을 보장합니다.
- **Service Layer (MetaAgentService)**: 비즈니스 로직 및 대화 세션 식별을 담당하며, 싱글톤 패턴으로 구현되어 효율적인 리소스 관리를 수행합니다.
- **Security Layer (PII Filter)**: 모든 외부 데이터(context_data) 유입 시 학생 이름, 학번 등 개인식별정보(PII)를 자동으로 마스킹하여 보안 가이드라인을 준수합니다.
- **Orchestration Layer (LiteLLM Router)**: 다중 LLM 프로바이더 및 다중 API 키를 하나의 풀(Pool)로 관리하여 부하 분산과 가용성을 책임집니다.

### 1.2 고가용성 설계 (Load Balancing & Failover)
- **다중 API 키 지원**: 동일한 프로바이더에 대해 여러 개의 API 키를 등록하여 할당량(Quota)을 대폭 확장할 수 있습니다.
- **자동 장애 복구 (Failover)**: 특정 모델이나 키가 응답 불능 또는 속도 제한(429)에 걸릴 경우, 라우터가 즉시 다른 가용 리소스로 요청을 우회시킵니다.
- **지능형 라우팅 (`least-busy`)**: 현재 요청량이 가장 적고 응답이 빠른 엔드포인트를 실시간으로 선택하여 응답 지연(Latency)을 최소화합니다.

## 2. LiteLLM 구현 현황

`app/core/llm_router.py`를 통해 구현된 상세 기능은 다음과 같습니다.

- **통합 서비스 모델 (`meta-agent-service`)**: 내부적으로 OpenAI, Gemini, Anthropic 등을 하나의 서비스명으로 추합하여 클라이언트 코드의 복잡성을 제거했습니다.
- **동적 키 바인딩**: 환경 변수에서 `_2`, `_3` 등의 접미사가 붙은 추가 키를 자동으로 인식하여 로드합니다.
- **재시도 전략**: 일시적인 네트워크 오류나 API 에러 시 최대 5회까지 자동 재시도를 수행하며, 속도 제한 발생 시 지능적인 대기(Retry-after) 로직이 작동합니다.

## 3. 주요 API 사용법

### 3.1 AI 에이전트 대화 (POST /chat)
사용자 질문을 처리하며, 세션 기반 메모리와 실시간 콘텍스트 주입을 지원합니다.

**요청 (Request):**
```json
{
  "text": "이 학생의 보완점과 지도 방향을 알려줘",
  "session_id": "std_001_session",
  "context_data": {
    "student_name": "김철수",
    "type": "자원소진형",
    "t_scores": [45, 38, 52]
  }
}
```
*참고: `student_name` 등 개인정보는 보안 레이어에서 자동으로 `김**` 형태로 마스킹되어 LLM에 전달됩니다.*

**응답 (Response):**
```json
{
  "response": "분석 결과, 김** 학생은 현재 학습 소진도가 높습니다. 정서적 지지가 우선되어야 하며...",
  "session_id": "std_001_session",
  "history_count": 4
}
```

### 3.2 세션 초기화 (DELETE /chat/{session_id})
특정 세션의 대화 메모리를 명시적으로 삭제합니다.

## 4. 환경 변수 및 설정 (Config)

`.env` 파일에 다음과 같이 여러 개의 키를 설정하여 성능을 확장할 수 있습니다.

현재 **Gemini 단일 프로바이더 + 10개 키** 구성으로 운영됩니다. 상용 배포 시 각 키를 서로 다른 값으로 교체하면 10배의 Quota 확장 효과를 얻을 수 있습니다.

```bash
# 사용 모델 설정
GEMINI_MODEL=gemini-2.5-flash

# Gemini API 키 (현재 동일 키 10개 설정 / 상용 배포 시 각각 다른 키로 교체)
GEMINI_API_KEY=AIza...
GEMINI_API_KEY_2=AIza...
GEMINI_API_KEY_3=AIza...
GEMINI_API_KEY_4=AIza...
GEMINI_API_KEY_5=AIza...
GEMINI_API_KEY_6=AIza...
GEMINI_API_KEY_7=AIza...
GEMINI_API_KEY_8=AIza...
GEMINI_API_KEY_9=AIza...
GEMINI_API_KEY_10=AIza...
```

> `_2`, `_3` ... `_N` 접미사 키는 `llm_router.py`의 `get_api_keys()` 함수가 자동으로 탐색하여 LiteLLM Router에 등록합니다. 키 추가 시 코드 수정 없이 환경 변수만 설정하면 됩니다.

## 5. 로컬 실행 가이드

### 5.1 사전 준비 (Python 환경 설정)

이 프로젝트는 Python 3.11.9 버전을 권장하며, `pyenv`와 `venv`를 사용하여 환경을 격리하는 것을 권장합니다.

1. **Python 버전 설치 (pyenv)**:
   ```bash
   # .python-version 파일에 명시된 버전 설치
   pyenv install 3.11.9
   pyenv local 3.11.9
   ```

2. **가상환경 생성 및 활성화**:
   ```bash
   # 가상환경 생성
   python -m venv .venv

   # 가상환경 활성화 (macOS/Linux)
   source .venv/bin/activate
   ```

3. **의존성 패키지 설치**:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

### 5.2 서비스 실행

1. **기동 명령어**:
   ```bash
   npm run agent
   ```
   *(참고: 루트 디렉토리의 package.json에 정의된 스크립트로, `cd agent && python main.py`를 수행합니다.)*
2. **테스트 (Testing)**:
   서비스의 정상 작동 여부와 보안 필터링 기능을 검증하기 위해 제공되는 테스트 스크립트를 실행할 수 있습니다. 상세한 내용은 [tests/README.md](file:///Users/jay/github/work/meta-dashboard/agent/tests/README.md)를 참고하세요.

   - **전체 테스트 실행**:
     ```bash
     pytest agent/tests/
     ```
   - **API 통합 테스트**: 에이전트 서버가 실행 중인 상태에서 별도의 터미널을 통해 실행합니다.
     ```bash
     python agent/tests/test_api_integration.py
     ```
   - **보안(PII) 필터 단위 테스트**: LLM 연동 없이 내부 로직을 즉시 검증합니다.
     ```bash
     pytest agent/tests/test_pii_filter.py
     ```

### 5.1 Quick Test (cURL)

서버 실행 후, 아래 명령어를 복사하여 터미널에서 즉시 API를 테스트할 수 있습니다.

**1. 상태 확인 (Health Check)**
```bash
curl -s -X GET http://localhost:8000/ | python3 -m json.tool
```

**2. 에이전트 대화 (Context 주입)**
```bash
curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "text": "이 학생의 성적을 바탕으로 분석해줘.",
    "session_id": "test_session_001",
    "context_data": {
      "name": "홍길동",
      "scores": {"math": 95, "science": 88},
      "recent_comment": "수학에 매우 흥미를 보임"
    }
  }' | python3 -m json.tool
```

**3. 메모리 기반 후속 질문 (이전 대화 문맥 유지 확인)**
```bash
curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "text": "내가 방금 물어본 학생의 수학 점수가 몇 점이었지?",
    "session_id": "test_session_001"
  }' | python3 -m json.tool
```

**4. 세션 초기화**
```bash
curl -s -X DELETE http://localhost:8000/chat/test_session_001 | python3 -m json.tool
```


## 6. 컨테이너 배포 (Docker)

모노레포 구조를 지원하기 위해 프로젝트 루트 디렉토리에서 빌드를 수행해야 합니다.

**이미지 빌드 (모노레포 루트 기준)**
```bash
# 프로젝트의 최상위 디렉토리(meta-dashboard)에서 실행
docker build -t meta-agent-service -f agent/Dockerfile .
```

**컨테이너 실행**
```bash
docker run -d -p 8000:8000 --env-file agent/.env --name meta-agent meta-agent-service
```

### 6.1 API 키 주입 방식 (보안 원칙)

`.dockerignore`에 의해 `.env` 파일은 이미지에 포함되지 않습니다. API 키는 **컨테이너 실행 시점에 외부에서 주입**하는 것이 보안 원칙입니다.

| 방법 | 명령 / 설정 | 사용 시나리오 |
|---|---|---|
| `--env-file` | `docker run --env-file agent/.env ...` | 단일 서버 직접 배포 |
| `-e` 플래그 | `docker run -e GEMINI_API_KEY=AIza... ...` | 개별 키 주입 |
| Docker Compose | `env_file: [agent/.env]` | Compose 기반 배포 |
| AWS Secrets Manager / GCP Secret Manager | 클라우드 SDK 연동 | 클라우드 배포 |
| Kubernetes Secret | `envFrom.secretRef` | K8s 배포 |

> **핵심 원칙**: API 키를 이미지에 굽지 않고 실행 환경에서 주입합니다. `.env` 파일은 배포 서버에만 존재하며 Git 및 이미지에는 포함되지 않습니다.



