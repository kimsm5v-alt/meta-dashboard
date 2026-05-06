# Neo4j Tool Calling 구현 명세서

> **목적**: 프론트엔드에서 전달되는 문맥(`context_data`)을 활용하여, Agent가 필요 시 자율적으로 Neo4j 그래프 DB를 쿼리(Tool Calling)함으로써 추론 정합성 및 컨텍스트 효율을 극대화하는 아키텍처 도입  
> **작성일**: 2026-05-06 | **현행화**: 2026-05-06  
> **참조 문서**: `agent/docs/NEO4J_ANALYSIS.md`

---

## 1. 구현 전(RAG) vs 현재 아키텍처(Tool Calling)

### RAG 방식 (AS-WAS - 기존 설계안)
- **방식**: 프론트엔드가 넘겨준 `answerIdx`를 기반으로 백엔드를 호출해 유형을 알아낸 뒤, 무조건 사전에 Neo4j를 모두 조회하여 방대한 양의 그래프 데이터를 프롬프트에 정적으로 하드코딩하려던 계획.
- **한계점**:
  1. **컨텍스트 낭비**: 질문과 무관한 모든 요인 점수와 모든 조절/매개 경로가 불필요하게 주입됨.
  2. **프론트엔드 하위 호환성 침해**: 프론트엔드의 `assistantService.ts`는 `answerIdx`를 보내지 않고 이미 완성된 마크다운 텍스트(`ragContext`)만 보내도록 구현되어 있어, 기존 설계안은 프론트엔드 코드의 대대적인 수정을 요구함.

### Tool Calling 방식 (TO-BE - 최종 확정안)
- **방식**: 프론트엔드에서 전달되는 기존 `context_data` (학생의 T-점수와 유형명이 포함된 마크다운 텍스트)를 **수정 없이 그대로 초기 문맥**으로 LLM에 제공합니다. LLM은 이 텍스트를 읽고 학생의 유형(예: "자원소진형")을 파악한 뒤, 추가적인 그래프 데이터(조절/매개 경로 등)가 필요할 때만 자율적으로 **Neo4j Tool을 호출**하여 획득합니다.
- **기대 효과 및 하위 호환성 보장**:
  1. **완벽한 하위 호환성 (Zero-touch Frontend/Backend)**: 프론트엔드의 `contextBuilder.ts` 전송 로직과 백엔드의 `/api/dgnss/graph` REST API(코칭 모달용)를 단 한 줄도 수정할 필요 없이 100% 호환됩니다.
  2. **추론 정합성 향상**: 학생의 실제 점수(텍스트)와 집단의 전략 데이터(Tool 반환값)를 런타임에 융합하여 LLM의 환각(Hallucination)을 줄이고 초개인화된 맞춤형 답변을 생성합니다.
  3. **토큰 효율 최적화**: 사전에 불필요한 전체 그래프 데이터를 주입하지 않으므로 토큰 소모와 Lost-in-the-middle 현상을 방지합니다.

---

## 2. 데이터 흐름 상세

## 2. 데이터 흐름 상세

```
┌─────────────┐    ┌──────────────────────────────┐    ┌──────────────┐
│   Frontend  │    │        Agent (FastAPI)        │    │   Neo4j DB   │
│             │    │                              │    │  (Bolt 7687) │
│ POST /chat  │───▶│ agent_service                 │    │              │
│ {           │    │  │                           │    │              │
│  text,      │    │  ├─ context_data 주입         │    │              │
│  session_id,│    │  │  (학생 점수, 유형명 텍스트)│    │              │
│  context_   │    │  │                           │    │              │
│  data: {    │    │  ├─ LLM 추론 시작             │    │              │
│   mode      │    │  │                           │    │              │
│   context   │    │  ├─ Tool 호출 (Neo4jTools)    │───▶│  Cypher 질의 │
│  }          │    │  │  (텍스트에서 유형 파악)    │◀───│  결과 반환   │
│ }           │    │  │                           │    └──────────────┘
│             │    │  ├─ Tool 결과 + 실제 점수 결합│
│             │◀───│                              │
│ {response}  │    └──────────────────────────────┘
└─────────────┘
```

> **참고**: 프론트엔드는 코칭 모달 렌더링을 위해 Backend REST API를 직접 호출하지만, Agent는 상담 추론을 위해 Neo4j Bolt 직접 연결을 통한 Tool Calling 패턴을 사용합니다. (Dual-Usage Architecture)

---

## 3. Tool Calling 구조

에이전트는 다음과 같은 4가지의 독립적인 함수(Tool)를 보유하며, LLM은 `className`과 `schoolLevel` 인자를 활용해 필요한 함수를 호출합니다.

| Tool (함수명) | 기능 (조회 데이터) | 주요 파라미터 |
|:---|:---|:---|
| `get_lpa_class_info` | LPAClass 노드 정보 단일 조회 (유형명, 학교급, 설명 등) | `className`, `schoolLevel` |
| `get_moderation_paths` | 특정 LPAClass의 `HAS_MODERATION_PATH` (조절 경로) 목록 조회 | `className`, `schoolLevel` |
| `get_mediation_paths` | 특정 LPAClass의 `HAS_MEDIATION_PATH` (매개 경로) 목록 조회 | `className`, `schoolLevel` |
| `get_factor_scores` | 특정 LPAClass의 `GROUP_TSCORE` 요인 정보(점수) 전체 조회 | `className`, `schoolLevel` |

> **동작 원리**: 프론트엔드가 넘겨준 `context_data.context` (마크다운 텍스트, ex. `- **유형**: 자원소진형 ...`)가 초기 System Message로 입력됨 → LLM은 자신이 "자원소진형"을 가진 학생을 상담하고 있음을 텍스트에서 인지 → 사용자가 "강점을 알려줘"라고 하면 LLM이 스스로 텍스트에서 파악한 유형명을 이용해 `get_factor_scores(className="자원소진형")`을 호출함.

---

## 4. 모듈 아키텍처 및 구현 파일

```
agent/
├── main.py                               ← [수정] lifespan 추가 (Neo4jTools 자원 해제)
├── requirements.txt                      ← [수정] neo4j 추가
├── app/
│   ├── services/
│   │   └── agent_service.py              ← [수정] Tool Binding 및 LLM 실행 루프 구성
│   ├── tools/
│   │   ├── __init__.py
│   │   └── neo4j_tools.py                ← [신설] Neo4j Bolt 직접 쿼리를 수행하는 툴셋 정의
│   ├── utils/
│   │   └── pii_filter.py                 ← [유지] PII 데이터 마스킹
│   └── models/
│       └── schemas.py                    ← [유지] AgentQuery, AgentResponse 스키마 (변경 없음)
└── docs/
    ├── NEO4J_ANALYSIS.md                 ← [수정] Neo4j 구조 및 Tool 연동 아키텍처 가이드
    └── NEO4J_TOOL_IMPLEMENTATION_PLAN.md ← 이 문서 (구 RAG_IMPLEMENTATION_PLAN.md)
```

---

## 5. 핵심 모듈 상세

### `neo4j_tools.py`
**역할**: Neo4j 드라이버 인스턴스를 관리하고, 각각의 Cypher 쿼리를 실행하여 JSON 형태의 결과를 리턴하는 Tool 기능 캡슐화.

- **`Neo4jConnectionManager` 클래스 (클래스 메서드 기반 싱글톤)**:
  - `get_driver()`: `AsyncGraphDatabase.driver` 지연 생성 (Lazy-loading).
  - `close()`: `main.py` lifespan 종료 시 드라이버 자원 반환.
- **`_execute_query()` 공통 실행기**: `asyncio.wait_for()`로 타임아웃 처리. `ServiceUnavailable`, `AuthError`, `ClientError` 예외별 Graceful Degradation.
- **4대 Tool 함수** (`get_lpa_class_info`, `get_moderation_paths`, `get_mediation_paths`, `get_factor_scores`): `langchain_core.tools.tool` 데코레이터 적용, 에러 발생 시 에러 딕셔너리를 반환하여 에이전트 루프가 중단되지 않도록 보호.

### `agent_service.py`
**역할**: `context_data` 전처리 및 LLM Tool Calling 오케스트레이션.

- **Context 주입**: `context_data.context` 텍스트를 `pii_filter`를 거쳐 System Message로 삽입합니다.
- **Tool Binding**: `langchain_core.utils.function_calling.convert_to_openai_tool`을 통해 LangChain Tool 스키마를 OpenAI Function 형식으로 변환한 뒤, LiteLLM Router `acompletion()` 호출 시 `tools` 파라미터로 전달합니다. (LangChain `bind_tools()` 미사용)
- **Tool Calling 루프**: `tool_calls` 감지 시 해당 함수를 `ainvoke()`로 실행 후 결과를 메시지 이력에 추가, 최대 5회(`max_iterations`) 반복. 스트리밍 시 `tool_call_buffer`로 청크를 병합 후 실행.
- **추론**: LLM은 텍스트(학생의 개별 점수)와 Tool 호출 결과(해당 유형의 집단 평균 점수 및 조절/매개 경로 전략)를 대조하여 고도화된 응답을 생성합니다.

---

## 6. 에러 처리 전략

| 상황 | 처리 방법 (Graceful Degradation) |
|:---|:---|
| Neo4j DB 연결 실패 / 타임아웃 | Tool 실행 시 `{"error": "Database connection failed"}` 반환 → LLM이 일반 지식으로 답변 시도. |
| Backend REST 연동 불필요 | 프론트엔드 컨텍스트에서 직접 유형명을 추출하므로 Backend의 `answerIdx` 해석 엔드포인트 의존성 제거. |
| LPAClass Not Found | 쿼리 결과 빈 배열 반환. LLM은 "해당 유형의 정보를 찾을 수 없음"을 자연어로 안내. |

---

## 7. 환경변수

```bash
# Neo4j 연결
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=test1234

# 타임아웃 제어
GRAPH_TOOL_TIMEOUT=5.0
```

---

## 8. 기대 시나리오 및 테스트 방안

**사용자 질문**: "현재 자원소진형 학생인데, 가장 주의해야 할 학습 약점과 이를 개선하기 위한 지지 전략을 알려주세요."

**처리 흐름 (Trace)**:
1. Agent가 `context_data.context` 텍스트에서 "유형: 자원소진형" 및 학생의 38개 요인 실제 T-점수 리스트를 인지.
2. LLM이 학생의 약점 요인을 텍스트에서 파악한 후, 이를 어떻게 개선할지 전략을 얻기 위해 `get_mediation_paths(className="자원소진형")` 또는 `get_moderation_paths(...)` 호출.
3. Tool 응답(JSON)으로 자원소진형 집단의 전략 데이터를 반환 받음.
4. LLM이 학생의 개별 점수 편차와 해당 유형의 집단 전략을 결합하여, 교사에게 완전히 개인화된 맞춤형 전략 텍스트 답변 생성.

---

## 9. 단계별 구현 계획 (Phased Execution Plan)

### Phase 1: Neo4j Tools 뼈대 및 핵심 쿼리 구현 (`neo4j_tools.py`)
- **목표**: Agent가 Neo4j와 통신할 수 있는 드라이버 환경 및 도구 함수 세트 구축
- **상세 작업**:
  1. `AsyncGraphDatabase`를 이용한 비동기 DB 연결 및 해제 메서드(`__init__`, `close`) 작성.
  2. `GRAPH_TOOL_TIMEOUT` 타임아웃 환경 변수 적용 및 예외 발생 시 Graceful Degradation(빈 딕셔너리 반환 등) 처리 로직 구현.
  3. 4대 Tool (`get_lpa_class_info`, `get_moderation_paths`, `get_mediation_paths`, `get_factor_scores`)의 Cypher 쿼리 매핑 및 `langchain_core.tools.tool` 데코레이터를 적용할 수 있는 형태로 함수 구조화. (`@tool` 데코레이터 적용 시 함수는 단일 반환값을 가져야 하고, 인자는 타입 힌트가 명시된 파라미터로 정의되어야 OpenAI Tool 형식으로 자동 변환됨)

### Phase 2: Agent 오케스트레이션 및 Tool Binding (`agent_service.py` 수정)
- **목표**: 기존 RAG 컨텍스트를 주입받아 LLM이 텍스트 내에서 유형명을 추출하고 자율적으로 Tool을 호출하도록 연동.
- **상세 작업**:
  1. `langchain_core.utils.function_calling.convert_to_openai_tool`을 사용하여 `Neo4jTools`의 함수들을 OpenAI Tool 형식으로 변환한 후, LiteLLM Router (`agent/app/core/llm_router.py`)의 `acompletion()` 호출 시 `tools` 파라미터로 전달하여 LLM이 자율적으로 호출할 수 있도록 연동. (현재 코드베이스는 LangChain 에이전트 미사용, `convert_to_openai_tool`을 이용해 스키마를 변환하여 LiteLLM API 직접 호출 구조)
  2. **System Prompt 고도화**: 프론트엔드가 주입한 마크다운 `ragContext` 텍스트에서 학생의 요인 점수와 `className`을 명확히 읽어내고, 이를 파라미터로 사용하여 Tool을 자율 호출하도록 지침(Instruction) 추가.

### Phase 3: 수명주기 관리 및 통합 검증 (`main.py` 및 테스트)
- **목표**: FastAPI 서버 시작/종료 주기에 맞춘 자원 최적화 및 최종 안전성 테스트.
- **상세 작업**:
  1. FastAPI `lifespan` 내부에 `Neo4jTools` 드라이버 인스턴스 초기화 및 종료 로직 마운트.
  2. 환경 변수 누락 또는 Neo4j DB 다운 상황을 강제로 연출하여, Agent가 뻗지 않고(Crash-free) 텍스트 기반 일반 상담으로 우회 동작하는지 검증.
  3. 동시에 여러 요청이 들어올 경우 Neo4j 연결 풀(Connection Pool)이 고갈되지 않고 정상 동작하는지 부하 테스트 수행.
  4. Neo4j 쿼리 응답이 타임아웃(`GRAPH_TOOL_TIMEOUT`)을 초과할 경우, Agent가 무한 대기하지 않고 적절히 타임아웃 처리되어 정상적으로 LLM 답변이 이루어지는지 검증.
