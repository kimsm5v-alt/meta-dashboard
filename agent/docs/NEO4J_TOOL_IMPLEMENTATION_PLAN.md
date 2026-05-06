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
│       └── schemas.py                    ← [수정] Tool 응답을 위한 스키마 추가
└── docs/
    ├── NEO4J_ANALYSIS.md                 ← [수정] Neo4j 구조 및 Tool 연동 아키텍처 가이드
    └── NEO4J_TOOL_IMPLEMENTATION_PLAN.md ← 이 문서 (구 RAG_IMPLEMENTATION_PLAN.md)
```

---

## 5. 핵심 모듈 상세

### `neo4j_tools.py`
**역할**: Neo4j 드라이버 인스턴스를 관리하고, 각각의 Cypher 쿼리를 실행하여 JSON 형태의 결과를 리턴하는 Tool 기능 캡슐화.

- **`Neo4jTools` 클래스**:
  - `__init__`: `neo4j.AsyncDriver` 지연 생성 (Lazy-loading).
  - `get_lpa_class_info(className, schoolLevel)`: `@tool` 데코레이터 적용, 클래스 기본 메타데이터 반환.
  - `get_moderation_paths(...)`, `get_mediation_paths(...)`, `get_factor_scores(...)`: 각 경로별 데이터 리스트 반환.
  - 에러 처리 시 Exception을 발생시키지 않고 빈 리스트 또는 적절한 에러 딕셔너리를 반환하여 에이전트 루프가 중단되지 않도록 보호.

### `agent_service.py`
**역할**: `context_data` 전처리 및 LLM Tool Calling 오케스트레이션.

- **Context 주입**: `context_data.context` 텍스트를 `pii_filter`를 거쳐 System Message로 삽입합니다. 이 텍스트에는 학생의 실제 T-점수와 예측된 유형명(`predictedType`)이 들어 있습니다.
- **Tool Binding**: LangChain의 `@tool` 데코레이터를 사용하여 `Neo4jTools`의 각 메서드를 Tool 함수로 등록하고, `bind_tools()` 메서드를 통해 LLM에 주입합니다. (참고: `requirements.txt`에 `langchain>=0.3.0` 명시됨. LiteLLM 사용 시에는 `tools` 파라미터에 JSON 스키마를 직접 전달하는 방식으로 대체 가능.)
- **추론**: LLM은 텍스트(학생의 개별 점수)와 Tool 호출 결과(해당 유형의 집단 평균 점수 및 조절 경로 전략)를 대조하여 고도화된 응답을 생성합니다.

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
