# Meta Dashboard AI Agent Service

이 서비스는 맞춤형 학습 분석 대시보드를 위한 고성능 AI 에이전트 백엔드입니다. LangChain과 LiteLLM을 결합하여 대규모 트래픽 수용이 가능한 엔터프라이즈급 아키텍처를 지향하며, 오케스트레이션 레이어는 기존 수작업 ReAct 루프(Legacy)와 LangGraph `StateGraph` 구현을 `AGENT_BACKEND` 환경 변수로 전환하며 병행 운영할 수 있습니다(1.3절 참고).

## 1. 아키텍처 및 핵심 기능

### 1.1 계층 구조
- **API Layer (FastAPI)**: RESTful 엔드포인트를 제공하며, 비동기 처리를 통해 높은 처리량(Throughput)을 보장합니다.
- **Service Layer (`MetaAgentService` / `LangGraphAgentService`)**: 비즈니스 로직 및 대화 세션 식별을 담당하며, 싱글톤 패턴으로 구현되어 효율적인 리소스 관리를 수행합니다. `AGENT_BACKEND` 값에 따라 둘 중 하나가 `meta_agent_service`로 선택됩니다(1.3절).
- **Security Layer (PII Filter)**: 모든 외부 데이터(context_data) 유입 시 학생 이름, 학번 등 개인식별정보(PII)를 자동으로 마스킹하여 보안 가이드라인을 준수합니다.
- **Orchestration Layer (LiteLLM Router)**: 다중 LLM 프로바이더 및 다중 API 키를 하나의 풀(Pool)로 관리하여 부하 분산과 가용성을 책임집니다.
- **Tool Layer (Neo4j / MySQL)**: `app/tools/all_tools_list`로 통합 등록되는 LLM Tool Calling 대상. `neo4j_tools.py`(LPA 유형·경로·요인점수, 5종)와 `mysql_tools.py`(학생/학급 검사 결과·메모·상담·생기부·교사 전체 학급 현황·위험군 학생, 8종)로 구성되며 두 백엔드 모두 동일한 목록을 사용합니다.
- **Prompt Layer (`app/core/prompts/`)**: 시스템 프롬프트/Tool 정책 문구는 코드가 아닌 `.md` 파일로 분리되어 있어, 기획자가 Python 코드를 몰라도 문구만 수정할 수 있습니다. 파일은 요청마다 새로 읽으므로 서버 재시작 없이 즉시 반영됩니다. `context_data.mode`(student/class/all)에 따라 `tool_policy_student.md`/`tool_policy_class.md`/`tool_policy_teacher.md` 중 하나가 선택되며, 식별자가 전혀 없으면 `tool_policy_none.md`가 쓰입니다(`mode` 미전달 시 하위 호환으로 student 취급). 단, Tool 함수의 docstring(`app/tools/*.py`)은 LLM 함수 호출 스키마 자체라 여기 포함하지 않습니다 — 그 문구를 수정하면 Tool 호출이 깨질 수 있어 개발자가 코드로 관리합니다.

### 1.2 고가용성 설계 (Load Balancing & Failover)
- **다중 API 키 지원**: 동일한 프로바이더에 대해 여러 개의 API 키를 등록하여 할당량(Quota)을 대폭 확장할 수 있습니다.
- **자동 장애 복구 (Failover)**: 특정 모델이나 키가 응답 불능 또는 속도 제한(429)에 걸릴 경우, 라우터가 즉시 다른 가용 리소스로 요청을 우회시킵니다.
- **지능형 라우팅 (`least-busy`)**: 현재 요청량이 가장 적고 응답이 빠른 엔드포인트를 실시간으로 선택하여 응답 지연(Latency)을 최소화합니다.

### 1.3 에이전트 오케스트레이션 백엔드 (Legacy / LangGraph, 병행 운영)

`app/services/agent_service.py`는 `AGENT_BACKEND` 환경 변수(기본값 `legacy`)에 따라 두 구현 중 하나를 `meta_agent_service` 싱글톤으로 노출합니다. 두 구현 모두 API 계약(`/chat`, `/chat/stream`, `DELETE /chat/{session_id}`의 요청·응답 스키마)이 완전히 동일하므로 `main.py`나 클라이언트 코드는 전혀 수정할 필요가 없습니다.

| | `legacy` (기본값) | `langgraph` |
|---|---|---|
| 구현체 | `MetaAgentService` | `LangGraphAgentService` (`app/core/agent_graph.py`) |
| 오케스트레이션 | 수작업 while 루프 기반 ReAct | LangGraph `StateGraph`(`call_model` ↔ `tools` 노드) |
| 세션 상태 | 인메모리 `dict`(`session_store`) | LangGraph `MemorySaver` 체크포인터 (`thread_id = session_id`) |
| LLM 호출 | `litellm.Router`(멀티 키 로테이션 + OpenAI→Gemini 폴백) 직접 호출 — 두 구현 모두 동일하게 재사용 |
| LangSmith 트레이싱 | 수동 `langsmith.trace()` + `@traceable` | 그래프 자동 트레이싱 + `@traceable`로 감싼 스트리밍 LLM nested span |

전환 방법(재시작 필요, 런타임 토글 아님):
```bash
# .env
AGENT_BACKEND=langgraph   # 또는 legacy (기본값)
```

설계 배경, 마이그레이션 단계별 계획, 호환성 검증 결과(세션 격리·병렬 Tool 호출·litellm 예외 매핑·recursion limit 등)는 [`agent/docs/LANGGRAPH_MIGRATION_PLAN.md`](docs/LANGGRAPH_MIGRATION_PLAN.md)에 상세히 정리되어 있습니다.

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

`context_data`는 다음 구조를 따릅니다. **`mode`를 반드시 명시하는 것을 권장합니다** — 생략 시 하위 호환 목적으로 `profile.schoolLevel`+`predictedType` 존재 여부만으로 student 모드처럼 처리되지만, 신규 연동에서는 명시적으로 지정해야 의도한 Tool 범위가 정확히 활성화됩니다.

| mode | 필요한 `profile` 필드 | 활성화되는 Tool |
|---|---|---|
| `student` | `schoolLevel` + `predictedType` 필수. `stdtId`/`claId`/`tcId`/`schoolLevelCode`/`grade`/`classNumber`는 있는 만큼 추가 활성화 | Neo4j 5종 + 학생 단위 MySQL 4종 |
| `class` | `claId` 필수 (`tcId`/`schoolLevel`/`grade`/`classNumber` 선택) | 학급 단위 MySQL 3종 |
| `all` | `tcId` 필수 | 교사 전체 현황 MySQL 1종 |

- `context`: LLM에 전달할 학생/학급 컨텍스트 본문(마크다운 문자열). `name` 등 PII 필드는 보안 레이어에서 자동 마스킹됩니다(단, 자유 텍스트 안에 섞인 실명까지는 걸러내지 못합니다).
- `profile.schoolLevel`에는 **`"elementary"` 또는 `"middle"`만 유효**합니다. 고등학생은 `schoolLevel: "middle"`(중등 모델 재사용) + `schoolLevelCode: "high"`(원본 학교급, 답변에 "중등 규준 기준" 자동 고지) 조합으로 보내야 합니다. `"high"`를 `schoolLevel`에 직접 넣으면 Neo4j Tool이 전부 실패합니다.
- `profile.predictedType`은 정확히 6개 유형명 중 하나여야 합니다(공백 포함 정확히 일치): `elementary` → `자원소진형`/`안전 균형형`/`몰입자원 풍부형`, `middle` → `냉소적 무기력형`/`정서조절 취약형`/`자기주도 몰입형`.

`images`(선택, 하위 호환): 멀티모달 컨텍스트로 사용할 base64 이미지 목록입니다. 자세한 내용은 3.2절 참고.

**요청 (Request) — student 모드:**
```json
{
  "text": "이 학생의 보완점과 지도 방향을 알려줘",
  "session_id": "std_001_session",
  "context_data": {
    "mode": "student",
    "context": "## 학생 정보\n- 이름: 김철수\n- T점수: 인지조절 45, 동기조절 38, 정서조절 52\n- 4단계 진단: 위험\n- 최근 상담 기록: 수업 집중도 저하, 학습 의욕 감소",
    "profile": {
      "schoolLevel": "middle",
      "predictedType": "냉소적 무기력형",
      "grade": 2,
      "classNumber": 3,
      "stdtId": "stdt_00123",
      "claId": "cla_00045",
      "tcId": "tc_00007"
    }
  }
}
```
*참고: `context` 내의 `이름` 등 개인정보는 보안 레이어에서 자동으로 `김**` 형태로 마스킹되어 LLM에 전달됩니다. `stdtId`/`claId`/`tcId`는 MySQL Tool(`query_student_lpa_and_scores` 등) 호출에 쓰이며, 없어도 Neo4j Tool(유형 기반 코칭 전략)까지는 정상 동작합니다.*

**응답 (Response):**
```json
{
  "response": "T점수 기준으로 볼 때 김** 학생은 현재 학습 소진도가 높습니다. 정서적 지지가 우선되어야 하며...",
  "session_id": "std_001_session",
  "history_count": 2
}
```

### 3.2 멀티모달 이미지 입력 (선택, POST /chat, /chat/stream)

`AgentQuery.images`에 base64 data URI 목록을 담아 보내면 해당 턴에 한해 이미지가 LLM 컨텍스트로 함께 전달됩니다(vision 지원 모델 필요, 기본 설정된 `gpt-4.1`/`gemini-3.5-flash` 기준).

- 형식: `data:image/(png|jpeg|jpg|webp|gif);base64,...` — 형식이 다르면 `400 Bad Request`.
- 제한: 턴당 최대 3장, 장당 최대 5MB(`app/utils/image_validation.py`).
- **비영속(턴 한정)**: 이미지는 그 턴의 LLM 호출에만 포함되고 세션 히스토리/체크포인트에는 저장되지 않습니다. 즉 다음 턴에는 자동으로 사라지며, 계속 참조하려면 매 턴 다시 보내야 합니다(토큰·메모리 비용 방지를 위한 설계).
- Legacy/LangGraph 두 백엔드 모두 동일하게 지원됩니다.
- `image_url` 타입을 쓰지만 실제 값은 URL이 아니라 base64 data URI입니다 — OpenAI Chat Completions의 멀티모달 콘텐츠 블록 스펙(`{"type": "image_url", "image_url": {"url": "data:..."}}`)을 그대로 따른 것으로, `url` 필드가 HTTP(S) 링크와 data URI를 모두 허용하기 때문입니다. 원격 이미지 URL을 직접 넘기는 방식은 이 프로젝트에서 지원하지 않습니다(학생 개인정보가 포함된 이미지를 외부에서 fetch 가능하게 노출하지 않기 위한 설계 선택).

**로컬 이미지 파일을 data URI로 변환** (테스트용):
```bash
# macOS
echo "data:image/png;base64,$(base64 -i photo.png)"
# Linux
echo "data:image/png;base64,$(base64 -w0 photo.png)"
```

**1) 단일 이미지 + 텍스트만 (POST /chat)**
```json
{
  "text": "이 검사지 사진을 보고 특이사항이 있는지 알려줘",
  "session_id": "std_001_session",
  "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="]
}
```

**2) 이미지 여러 장(최대 3장) + `context_data` 병행 전달**

학생 컨텍스트와 검사지 사진을 함께 분석시키는 실제 사용 시나리오입니다. `images`는 매 요청마다 새로 보내야 하는 턴 한정 필드이므로, `context_data`(세션에 누적 저장)와 성격이 다르다는 점에 유의하세요.
```json
{
  "text": "첨부한 두 장의 검사지 사진에서 이전 회차 대비 달라진 점을 학생 컨텍스트 기준으로 짚어줘",
  "session_id": "std_001_session",
  "context_data": {
    "profile": { "schoolLevel": "middle", "predictedType": "자원소진형" },
    "context": "## 학생 정보\n- T점수: 인지조절 45, 동기조절 38, 정서조절 52"
  },
  "images": [
    "data:image/png;base64,iVBORw0KGgo...(1회차 검사지)",
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...(2회차 검사지)"
  ]
}
```

**3) 스트리밍 + 이미지 (POST /chat/stream)**

이미지 파라미터는 `/chat`과 완전히 동일하게 사용하며, 응답만 SSE로 순차 전달됩니다.
```bash
curl -N -s -X POST http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "text": "이 이미지를 보고 실시간으로 분석해줘",
    "session_id": "std_001_session",
    "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="]
  }'
```

**4) 검증 실패 시 응답 (400 Bad Request)**

`app/utils/image_validation.py`가 형식·개수·크기 위반을 API 경계(main.py)에서 LLM 호출 전에 즉시 차단하므로 불필요한 비용이 들지 않습니다.
```jsonc
// 4장 이상 첨부 (개수 초과)
{ "detail": "이미지는 최대 3장까지 첨부할 수 있습니다." }

// data URI 형식이 아님 (예: 순수 https:// URL, 잘못된 MIME, base64 누락)
{ "detail": "이미지는 data:image/(png|jpeg|webp|gif);base64,... 형식의 data URI여야 합니다." }

// 장당 5MB 초과
{ "detail": "이미지 크기는 장당 최대 5MB까지 허용됩니다." }
```

### 3.3 세션 초기화 (DELETE /chat/{session_id})
특정 세션의 대화 메모리를 명시적으로 삭제합니다.

### 3.4 생활기록부(행동특성 및 종합의견) 문구 생성 (POST /school-record/generate, /school-record/generate/stream)

프론트가 요인 검사 결과와 관찰 입력을 모두 실어 보내므로 `/chat`과 달리 Tool 호출(Neo4j/MySQL)을 타지 않고 LiteLLM Router를 직접 단발 호출합니다. 단건 작성(학생 1명)과 일괄 생성(최대 30명, `MAX_STUDENTS_PER_REQUEST`)은 동일한 요청 계약을 씁니다 — 단건은 `students` 길이가 1인 일괄입니다.

- `/generate`: 전체 학생 생성이 끝난 뒤 한 번에 반환합니다. 재시도·배치·검증용.
- `/generate/stream`: 학생 단위로 SSE 이벤트(`start`/`student_start`/`token`/`student_done`/`student_error`/`ping`/`done`)를 순차 방출합니다. `stream_tokens: true`면 토큰까지 실시간으로 흘리고, `false`(기본)면 내부적으로 최대 3명(`PREFETCH_CONCURRENCY`)을 선행 생성해두되 학생 순서는 지켜서 방출합니다.

**PII 원칙**: 요청 스키마에 학생 이름·학번이 아예 없습니다(마스킹이 아니라 미전송) — 생기부 문구는 프롬프트에서 주어를 생략해 쓰도록 강제하므로 이름 자체가 필요 없습니다. `student_id`는 결과를 프론트가 학생에 매핑하기 위한 식별자일 뿐 PII가 아닙니다.

**`strengths`/`improvements`의 `is_positive`**: 요인은 점수가 높을수록 좋은 요인(`is_positive: true`, 예: 자기효능감)과 낮을수록 좋은 요인(`is_positive: false`, 예: 시험불안·학업스트레스 계열)이 섞여 있습니다. 어느 배열(`strengths`/`improvements`)에 넣을지는 **프론트가 이미 방향을 반영해 분류**해서 보내야 합니다(`frontend/src/features/school-record/model/computeStudentProfile.ts`의 `meritScore` 계산 참고). Agent는 그 분류를 그대로 신뢰하되, 프롬프트에 넣는 "요인 수준"(매우낮음~매우높음) 텍스트를 만들 때 `is_positive`로 방향을 한 번 더 보정합니다(`t_score_to_level(t_score, is_positive)`) — `is_positive: false`인 요인은 점수를 뒤집어(`100 - t_score`) 매핑하므로, 원점수가 낮아도(=좋은 상태) "레벨"은 항상 "이 요인이 얼마나 긍정적으로 나타나는가"를 의미하게 됩니다. 원문 T점수 자체는 정책상 LLM에 전달되지 않습니다.

**요청 (Request):**
```json
{
  "session_id": "verify-is-positive",
  "class_id": "c1",
  "school_level": "중등",
  "grade": 2,
  "source": "TEST_ONLY",
  "action": "generate",
  "students": [
    {
      "student_id": "s1",
      "lpa_type": "안전 균형형",
      "strengths": [
        { "name": "자기효능감", "t_score": 68.4, "is_positive": true },
        { "name": "시험불안", "t_score": 25.0, "is_positive": false }
      ],
      "improvements": [
        { "name": "공부부담", "t_score": 75.0, "is_positive": false },
        { "name": "학업열의", "t_score": 35.0, "is_positive": true }
      ]
    }
  ]
}
```

**응답 (Response)** — 로컬 기동 후 실제 호출로 확인:
```json
{
  "results": [
    {
      "student_id": "s1",
      "text": "자기효능감이 높아 스스로 목표를 세우고 계획적으로 학습에 임하는 모습을 보임. 시험 기간에도 꾸준한 자기 관리로 불안감을 이겨내려는 성실함과 책임감을 드러냄. 앞으로 학업 과정에서 내적 동기 부여를 강화하며 자신에게 적합한 학습 방법을 찾아 더욱 성장할 수 있는 가능성이 큼.",
      "char_count": 117,
      "warnings": []
    }
  ],
  "succeeded": 1,
  "failed": 0,
  "errors": []
}
```

*참고(관찰 사항): 위 응답에서 `시험불안`(is_positive: false, t_score=25 → 실제로는 불안이 매우 낮은 상태)이 "불안감을 이겨내려는 성실함"이라는 표현으로 서술됐습니다. `is_positive` 보정 덕분에 강점(`strengths`) 버킷·레벨(매우높음) 자체는 방향이 올바르게 들어갔지만, LLM이 "시험불안"이라는 요인명 자체의 어휘 연상(불안 관련 표현)을 문장에 끌어오는 경향은 프롬프트 데이터 보정만으로 완전히 제거되진 않습니다 — 문체 품질은 별도의 프롬프트 튜닝 대상입니다.*

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

# 에이전트 오케스트레이션 백엔드 (1.3절 참고) — legacy(기본값) 또는 langgraph
# 프로세스 기동 시 1회만 평가되므로 전환 시 재시작 필요
AGENT_BACKEND=legacy

# LangSmith Observability (선택)
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=your_langsmith_api_key_here
LANGSMITH_ENV=dev   # 프로젝트명이 meta-dashboard-agent-{ENV}로 자동 구성됨
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

### 5.1.1 Windows(PowerShell/Git Bash)에서 다른 점

위 5.1 안내는 macOS/Linux 기준이라, Windows에서는 아래 차이를 감안해야 합니다.

- **가상환경 활성화**: `source .venv/bin/activate` 대신
  ```powershell
  .venv\Scripts\activate
  ```
- **`VAR=값 명령어` 문법 불가**: bash/zsh 전용 문법이라 PowerShell에서는 안 먹힙니다. PowerShell에서는
  `$env:VAR=값; 명령어` 형태로, 또는 Git Bash를 열어서 원래 문법 그대로 씁니다.
  ```powershell
  $env:LOCAL_PORT=5006; bash scripts/db_tunnel.sh
  ```
- **`scripts/db_tunnel.sh` 줄바꿈(CRLF) 문제**: Windows에서 체크아웃한 `.sh`가 CRLF로 저장되면
  `bash`가 `line 16: $'\r': command not found` 에러를 냅니다. 최초 1회 LF로 변환하세요.
  ```bash
  sed -i 's/\r$//' scripts/db_tunnel.sh
  ```
- **`requirements.txt`의 `litellm` 빌드 실패**: 일부 `litellm` 버전은 Windows용 prebuilt wheel이 없어
  pip가 소스 빌드를 시도하다 Rust/Cargo 요구 에러(`Preparing metadata (pyproject.toml) ... error`)로
  실패할 수 있습니다. 이 경우 `litellm`만 wheel이 있는 버전으로 강제 설치합니다.
  ```bash
  .venv/Scripts/python.exe -m pip install --only-binary=litellm -r requirements.txt
  ```
- **`requirements.txt`의 한글 주석 때문에 pip가 cp949로 읽다 깨지는 경우**
  (`UnicodeDecodeError: 'cp949' codec can't decode byte ...`): `PYTHONUTF8=1`을 붙여 우회합니다.
  ```bash
  PYTHONUTF8=1 .venv/Scripts/python.exe -m pip install --only-binary=litellm -r requirements.txt
  ```

### 5.2 서비스 실행

1. **기동 명령어**:
   ```bash
   npm run agent
   ```
   *(참고: 루트 디렉토리의 package.json에 정의된 스크립트로, `cd agent && python main.py`를 수행합니다.)*

   > **Windows 참고**: `main.py`(`manage_venv.py`)는 실행할 때마다 `pip install -r requirements.txt`를
   > 재실행하므로, 5.1.1에서 우회했던 `litellm` 버전으로 다시 갱신을 시도하다 실패할 수 있습니다.
   > 재기동 시에는 uvicorn을 직접 실행하는 편이 안전합니다.
   > ```bash
   > .venv/Scripts/uvicorn.exe main:app --host 0.0.0.0 --port 8000 --reload
   > ```
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

### 5.5 Quick Test (cURL)

서버 실행 후, 아래 명령어를 복사하여 터미널에서 즉시 API를 테스트할 수 있습니다. IP·포트는 로컬 기준(`http://localhost:8000`)이며, `profile.predictedType`/`schoolLevel` 조합과 `stdtId`/`claId`/`tcId`는 모두 3.1절 표에 따른 유효한 예시(placeholder ID)입니다.

**1. 상태 확인 (Health Check)**
```bash
curl -s -X GET http://localhost:8000/ | python3 -m json.tool
```
응답:
```json
{
  "message": "Meta Dashboard AI Agent is running with LangChain & LiteLLM"
}
```

**2. 학생 모드 대화 (mode: student, Context 주입)**
```bash
curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "text": "이 학생의 보완점과 지도 방향을 알려줘.",
    "session_id": "test_session_001",
    "context_data": {
      "mode": "student",
      "context": "## 학생 정보\n- 이름: 홍길동\n- T점수: 인지조절 45, 동기조절 38, 정서조절 52\n- 4단계 진단: 위험\n- 최근 상담 기록: 수업 집중도 저하, 학습 의욕 감소",
      "profile": {
        "schoolLevel": "middle",
        "predictedType": "냉소적 무기력형",
        "grade": 2,
        "classNumber": 3,
        "stdtId": "stdt_00123",
        "claId": "cla_00045",
        "tcId": "tc_00007"
      }
    }
  }' | python3 -m json.tool
```
응답:
```json
{
  "response": "T점수 기준으로 볼 때 홍** 학생은 냉소적 무기력형에 가까운 양상을 보입니다. 정서조절(52)은 양호하나 동기조절(38)이 낮아 학습 참여 유도가 우선되어야 하며, 4단계 진단이 '위험' 단계인 만큼 담임/상담 교사와의 개별 면담을 권장합니다...",
  "session_id": "test_session_001",
  "history_count": 2
}
```

**3. 학급 모드 대화 (mode: class, 학급 단위 MySQL Tool 활성화)**
```bash
curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "text": "이 학급의 진단 결과 분포와 위험군 학생 현황을 알려줘.",
    "session_id": "test_session_class_001",
    "context_data": {
      "mode": "class",
      "context": "## 학급 정보\n- 2학년 3반, 담임: 김** 교사\n- 전체 학생 수: 28명",
      "profile": {
        "claId": "cla_00045",
        "tcId": "tc_00007",
        "schoolLevel": "middle",
        "grade": 2,
        "classNumber": 3
      }
    }
  }' | python3 -m json.tool
```
응답:
```json
{
  "response": "2학년 3반은 전체 28명 중 24명이 검사를 완료했습니다(응답률 85.7%). 4단계 진단 기준 위험군은 3명이며, 냉소적 무기력형 비중이 상대적으로 높게 나타납니다. 위험군 학생에 대해서는 개별 상담을 우선 배정하는 것을 권장합니다...",
  "session_id": "test_session_class_001",
  "history_count": 2
}
```

**4. 교사 전체 현황 모드 대화 (mode: all, `tcId` 필수)**
```bash
curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "text": "내가 담당하는 학급들 중에서 우선적으로 살펴봐야 할 학급이 있을까?",
    "session_id": "test_session_teacher_001",
    "context_data": {
      "mode": "all",
      "context": "## 교사 정보\n- 담당 학급 수: 4개",
      "profile": {
        "tcId": "tc_00007"
      }
    }
  }' | python3 -m json.tool
```
응답:
```json
{
  "response": "담당하신 4개 학급 중 2학년 3반의 위험군 비율(10.7%)이 가장 높아 우선 확인을 권장합니다. 나머지 학급은 대체로 안정적인 분포를 보입니다...",
  "session_id": "test_session_teacher_001",
  "history_count": 2
}
```

**5. 메모리 기반 후속 질문 (이전 대화 문맥 유지 확인)**
```bash
curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "text": "내가 방금 물어본 학생의 정서조절 점수가 몇 점이었지?",
    "session_id": "test_session_001"
  }' | python3 -m json.tool
```
응답:
```json
{
  "response": "네, 방금 말씀드린 홍** 학생의 정서조절 T점수는 52점이었습니다.",
  "session_id": "test_session_001",
  "history_count": 4
}
```

**6. 실시간 스트리밍 대화 (SSE)**
버퍼링을 방지하기 위해 `-N` (또는 `--no-buffer`) 옵션을 사용하여 실시간으로 생성되는 텍스트 청크를 확인할 수 있습니다.
```bash
curl -N -s -X POST http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "text": "실시간 응답 테스트를 해줘",
    "session_id": "test_session_002"
  }'
```
응답 (SSE, 각 청크는 `data: {"text": "...", "is_final": false}\n\n` 형태의 JSON으로 패킹되어 전송되고, 마지막에 `is_final: true`인 빈 텍스트 청크로 종료됩니다):
```
data: {"text": "네, ", "is_final": false}

data: {"text": "실시간 ", "is_final": false}

data: {"text": "응답 테스트를 ", "is_final": false}

data: {"text": "진행하겠습니다.", "is_final": false}

data: {"text": "", "is_final": true}
```

**7. 멀티모달 이미지 입력 (선택, 3.2절 참고)**
```bash
curl -s -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "text": "이 이미지를 참고해서 답변해줘",
    "session_id": "test_session_003",
    "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="]
  }' | python3 -m json.tool
```
응답:
```json
{
  "response": "첨부해주신 이미지를 확인했습니다. 해당 이미지에서는...",
  "session_id": "test_session_003",
  "history_count": 2
}
```

**8. 멀티모달 + 스트리밍 조합**
```bash
curl -N -s -X POST http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "text": "이 이미지를 보고 실시간으로 분석해줘",
    "session_id": "test_session_003",
    "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="]
  }'
```
응답 (SSE, 형식은 6번과 동일):
```
data: {"text": "네, ", "is_final": false}

data: {"text": "첨부하신 이미지를 ", "is_final": false}

data: {"text": "분석해보겠습니다...", "is_final": false}

data: {"text": "", "is_final": true}
```

**9. 이미지 검증 실패 재현 (400 확인용)**
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "text": "이 이미지를 참고해서 답변해줘",
    "session_id": "test_session_003",
    "images": ["not-a-data-uri"]
  }'
# -> 400
```
응답 본문(위 명령은 상태 코드만 출력하도록 `-o /dev/null -w`를 사용했습니다. 본문까지 보려면 `-o`/`-w` 옵션을 빼고 실행하세요):
```json
{ "detail": "이미지는 data:image/(png|jpeg|webp|gif);base64,... 형식의 data URI여야 합니다." }
```

**10. 세션 초기화**
```bash
curl -s -X DELETE http://localhost:8000/chat/test_session_001 | python3 -m json.tool
```
응답:
```json
{
  "message": "Session test_session_001 has been reset."
}
```

**11. 생활기록부 문구 생성 (`is_positive` 방향 보정 확인, 3.4절 참고)**

`시험불안`(is_positive: false)을 `strengths`에, `공부부담`(is_positive: false)을 `improvements`에 넣어 부적 요인의 방향 보정이 실제로 반영되는지 확인하는 예시입니다.
```bash
curl -s -X POST http://localhost:8000/school-record/generate \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "verify-is-positive",
    "class_id": "c1",
    "school_level": "중등",
    "grade": 2,
    "source": "TEST_ONLY",
    "action": "generate",
    "students": [
      {
        "student_id": "s1",
        "lpa_type": "안전 균형형",
        "strengths": [
          { "name": "자기효능감", "t_score": 68.4, "is_positive": true },
          { "name": "시험불안", "t_score": 25.0, "is_positive": false }
        ],
        "improvements": [
          { "name": "공부부담", "t_score": 75.0, "is_positive": false },
          { "name": "학업열의", "t_score": 35.0, "is_positive": true }
        ]
      }
    ]
  }' | python3 -m json.tool
```
응답 (로컬 실행으로 실측):
```json
{
  "results": [
    {
      "student_id": "s1",
      "text": "자기효능감이 높아 스스로 목표를 세우고 계획적으로 학습에 임하는 모습을 보임. 시험 기간에도 꾸준한 자기 관리로 불안감을 이겨내려는 성실함과 책임감을 드러냄. 앞으로 학업 과정에서 내적 동기 부여를 강화하며 자신에게 적합한 학습 방법을 찾아 더욱 성장할 수 있는 가능성이 큼.",
      "char_count": 117,
      "warnings": []
    }
  ],
  "succeeded": 1,
  "failed": 0,
  "errors": []
}
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
  AGENT_BACKEND: "legacy"   # 또는 "langgraph" (1.3절 참고)
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
