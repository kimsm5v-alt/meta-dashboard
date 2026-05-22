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

### 2.1 Primary / Fallback 이중화 구조

| 구분 | 프로바이더 | 모델 | 역할 |
|------|-----------|------|------|
| Primary | OpenAI | `gpt-4.1` | 기본 호출 대상. 에이전트·Tool Calling 특화, 1M 토큰 컨텍스트 |
| Fallback | Gemini | `gemini-3.5-flash` | OpenAI 장애·Rate Limit 시 자동 전환 |

OpenAI 호출이 실패하면 LiteLLM Router의 `fallbacks` 설정에 의해 별도 코드 변경 없이 Gemini로 즉시 전환됩니다.

### 2.2 논리 모델명 추상화

`AgentService`는 실제 LLM 종류를 알 필요 없이 `ROUTER_MODEL_NAME` 상수를 통해 호출합니다. 프로바이더 교체 시 `llm_router.py`만 수정하면 됩니다.

```
AgentService → ROUTER_MODEL_NAME ("meta-agent-primary")
                      ↓ LiteLLM Router
               OpenAI gpt-4.1  [실패 시 →]  Gemini gemini-3.5-flash
```

### 2.3 기타 기능

- **동적 키 바인딩**: 환경 변수에서 `_2`, `_3` 등의 접미사가 붙은 추가 키를 자동으로 인식하여 로드합니다.
- **재시도 전략**: 일시적인 네트워크 오류나 API 에러 시 최대 3회까지 자동 재시도를 수행합니다.
- **방어 로직**: Primary(OpenAI) 키 미설정 시 Fallback(Gemini)을 Primary로 자동 승격합니다.

## 3. 주요 API 사용법

### 3.1 AI 에이전트 대화 (POST /chat)
사용자 질문을 처리하며, 세션 기반 메모리와 실시간 콘텍스트 주입을 지원합니다.

`context_data`는 반드시 다음 구조를 따라야 합니다:
- `profile.schoolLevel` + `profile.predictedType`: Neo4j Tool 호출 여부를 결정하는 학생 식별자. 두 값이 모두 있어야 DB 조회가 활성화됩니다.
- `context`: LLM에 전달할 학생 컨텍스트 본문(마크다운 문자열). `name` 등 PII 필드는 보안 레이어에서 자동 마스킹됩니다.

**요청 (Request):**
```json
{
  "text": "이 학생의 보완점과 지도 방향을 알려줘",
  "session_id": "std_001_session",
  "context_data": {
    "profile": {
      "schoolLevel": "middle",
      "predictedType": "자원소진형"
    },
    "context": "## 학생 정보\n- 이름: 김철수\n- T점수: 인지조절 45, 동기조절 38, 정서조절 52\n- 4단계 진단: 위험\n- 최근 상담 기록: 수업 집중도 저하, 학습 의욕 감소"
  }
}
```
*참고: `context` 내의 `이름` 등 개인정보는 보안 레이어에서 자동으로 `김**` 형태로 마스킹되어 LLM에 전달됩니다.*

**응답 (Response):**
```json
{
  "response": "분석 결과, 김** 학생은 현재 학습 소진도가 높습니다. 정서적 지지가 우선되어야 하며...",
  "session_id": "std_001_session",
  "history_count": 2
}
```

### 3.2 세션 초기화 (DELETE /chat/{session_id})
특정 세션의 대화 메모리를 명시적으로 삭제합니다.

## 4. 환경 변수 및 설정 (Config)

`.env` 파일에 다음과 같이 설정합니다. 상용 배포 시 각 키를 서로 다른 값으로 교체하면 Quota를 최대 10배 확장할 수 있습니다.

```bash
# Primary: OpenAI (기본)
OPENAI_API_KEY=sk-...
OPENAI_API_KEY_2=sk-...  # 추가 키 (선택)
OPENAI_MODEL=gpt-4.1

# Fallback: Gemini (OpenAI 장애 시 자동 전환)
GEMINI_API_KEY=AIza...
GEMINI_API_KEY_2=AIza...
# ... GEMINI_API_KEY_10 까지 지원
GEMINI_MODEL=gemini-3.5-flash

# Neo4j Graph DB
NEO4J_URI=bolt://your-neo4j-host:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password

# FastAPI Settings
PORT=8000
HOST=0.0.0.0
DEBUG=False
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
### 5.3 채팅 프론트엔드 실행 (Streamlit)

웹 브라우저를 통해 AI 에이전트와 대화할 수 있는 인터페이스를 제공합니다.

1. **프론트엔드 기동**:
   ```bash
   # agent 디렉토리에서 실행
   streamlit run streamlit_app.py
   ```
2. **사용 방법**:
   - 접속 주소: `http://localhost:8501`
   - 사이드바에서 API 서버 주소 및 콘텍스트 데이터(JSON)를 설정할 수 있습니다.
   - 세션 초기화 버튼을 통해 대화 내역을 리셋할 수 있습니다.

### 5.4 테스트 (Testing)
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
    "text": "이 학생의 보완점과 지도 방향을 알려줘.",
    "session_id": "test_session_001",
    "context_data": {
      "profile": {
        "schoolLevel": "middle",
        "predictedType": "자원소진형"
      },
      "context": "## 학생 정보\n- 이름: 홍길동\n- T점수: 인지조절 45, 동기조절 38, 정서조절 52\n- 4단계 진단: 위험\n- 최근 상담 기록: 수업 집중도 저하, 학습 의욕 감소"
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

**4. 실시간 스트리밍 대화 (SSE)**
버퍼링을 방지하기 위해 `-N` (또는 `--no-buffer`) 옵션을 사용하여 실시간으로 생성되는 텍스트 청크를 확인할 수 있습니다.
```bash
curl -N -s -X POST http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "text": "실시간 응답 테스트를 해줘",
    "session_id": "test_session_002"
  }'
```

**5. 세션 초기화**
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
| `-e` 플래그 | `docker run -e OPENAI_API_KEY=sk-... ...` | 개별 키 주입 |
| Docker Compose | `env_file: [agent/.env]` | Compose 기반 배포 |
| AWS Secrets Manager / GCP Secret Manager | 클라우드 SDK 연동 | 클라우드 배포 |
| Kubernetes Secret | `envFrom.secretRef` | K8s 배포 |

> **핵심 원칙**: API 키를 이미지에 굽지 않고 실행 환경에서 주입합니다. `.env` 파일은 배포 서버에만 존재하며 Git 및 이미지에는 포함되지 않습니다.


## 7. Kubernetes 배포 가이드 (Argo CD & Jenkins)

Kubernetes(K8s) 환경에서 본 서비스를 배포할 때는 GitOps 원칙에 따라 환경 변수를 **ConfigMap**과 **Secret**으로 분리하여 주입하는 것이 권장됩니다.

### 7.1 환경 변수 리소스 정의

일반 설정은 `ConfigMap`에, API 키와 같은 민감 정보는 `Secret`에 정의합니다.

**ConfigMap 예시 (`agent-config.yaml`):**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: agent-config
  namespace: meta-dashboard
data:
  OPENAI_MODEL: "gpt-4.1"
  GEMINI_MODEL: "gemini-3.5-flash"
  LOG_LEVEL: "INFO"
```

**Secret 예시 (`agent-secret.yaml`):**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: agent-secret
  namespace: meta-dashboard
type: Opaque
stringData:
  # 현실적으로는 Sealed Secrets나 External Secrets를 통해 암호화 관리 권장
  # Primary: OpenAI
  OPENAI_API_KEY: "sk-..."
  OPENAI_API_KEY_2: "sk-..."
  # Fallback: Gemini
  GEMINI_API_KEY: "AIza..."
  GEMINI_API_KEY_2: "AIza..."
  # ... 필요한 만큼 추가
```

### 7.2 Deployment 적용 방식 (`envFrom`)

개별 변수를 하나씩 매핑하는 대신, `envFrom`을 사용하여 ConfigMap과 Secret의 모든 필드를 한 번에 주입하는 방식이 유지보수에 유리합니다.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: meta-agent-deployment
spec:
  template:
    spec:
      containers:
      - name: meta-agent
        image: meta-agent-service:latest
        ports:
        - containerPort: 8000
        # 환경 변수 일괄 주입
        envFrom:
        - configMapRef:
            name: agent-config
        - secretRef:
            name: agent-secret
```

### 7.3 CI/CD 파이프라인 (Jenkins + Argo CD)

1.  **Jenkins**: 애플리케이션 코드를 빌드하고 Docker 이미지를 Push한 뒤, K8s 매니페스트 레포지토리의 이미지 태그만 업데이트합니다.
2.  **Argo CD**: 매니페스트 레포지토리의 변경을 감지하여 클러스터에 배포합니다. 이때 위에서 정의한 `ConfigMap/Secret`이 함께 동기화됩니다.
3.  **동작 원리**: 컨테이너가 시작될 때 K8s가 환경 변수를 주입하면, 애플리케이션 내부의 `load_dotenv()`가 시스템 환경 변수를 인식하여 별도의 `.env` 파일 없이도 정상 동작하게 됩니다.

> **주의**: API 키를 추가할 경우, `ConfigMap/Secret` 리소스를 업데이트하고 Argo CD에서 `Sync`를 수행하면 자동으로 반영됩니다. (단, 환경 변수 변경은 Pod 재시작이 필요할 수 있습니다.)
