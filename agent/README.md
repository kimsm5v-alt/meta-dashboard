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

```bash
# 기본 키
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-...

# 추가 키 (자동 로드밸런싱 활성화)
OPENAI_API_KEY_2=sk-...
GEMINI_API_KEY_2=AIza...
```

## 5. 로컬 실행 가이드

1. **설치 및 실행**:
   ```bash
   npm run agent
   ```
2. **테스트**: `agent/tests/test_api_integration.py`를 통해 API 작동 여부와 로드밸런싱 구 구조를 검증할 수 있습니다.
