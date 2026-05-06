> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 2697c53a

## 코드 복잡도 분석

변경된 파일의 복잡도 정보를 찾을 수 없습니다.
(인덱스가 생성되지 않았거나 새로운 파일일 수 있습니다)

---



## 변경 배경

이 커밋은 AI Agent가 백엔드 REST API를 경유하지 않고 Neo4j에 직접 Bolt 통신을 수행하는 아키텍처로 전환됨에 따라, 불필요해진 `httpx` 의존성을 제거하고 Neo4j 연동을 위한 문서 및 구현 계획을 추가한 변경입니다.

- **목적**: httpx 의존성 제거 및 Neo4j Tool Calling 아키텍처 문서화
- **도메인**: 인프라/아키텍처 (Agent - Neo4j 직접 연동)
- **변경 방향**: REST API 경유 방식에서 Neo4j Bolt 직접 연결 방식으로 전환, 불필요한 의존성 제거

## [GOOD] 잘된 점

1. **아키텍처 결정의 명확한 문서화**: `NEO4J_ANALYSIS.md`와 `NEO4J_TOOL_IMPLEMENTATION_PLAN.md` 두 문서를 통해 Backend Neo4j 구조, Cypher 쿼리, 데이터 모델, Agent 연동 아키텍처를 상세히 기록했습니다. 특히 Dual-Usage Architecture 개념을 명확히 구분하여 Frontend(Backend REST 경유)와 Agent(Neo4j Bolt 직접)의 역할을 분리한 점이 좋습니다.

2. **하위 호환성 보장 설계**: Tool Calling 방식으로 전환하면서도 Frontend의 `contextBuilder.ts`와 Backend의 REST API를 전혀 수정하지 않는 Zero-touch 접근법을 채택한 점이 실용적입니다. 기존 RAG 방식의 문제점(컨텍스트 낭비, 프론트엔드 수정 필요)을 정확히 파악하고 대안을 제시했습니다.

3. **Graceful Degradation 에러 처리 전략**: Neo4j 연결 실패 시에도 Agent 루프가 중단되지 않도록 빈 리스트나 에러 딕셔너리를 반환하는 설계가 명시되어 있습니다. 이는 프로덕션 환경에서 중요한 안전장치입니다.

## 변경사항 요약

- `agent/requirements.txt`: `httpx` 제거 및 `neo4j` Python 드라이버 의존성 추가
- `agent/docs/NEO4J_ANALYSIS.md` (신규): Backend Neo4j 데이터 모델, Cypher 쿼리, 서비스 레이어, Agent 연동 아키텍처 심층 분석 문서 (535줄)
- `agent/docs/NEO4J_TOOL_IMPLEMENTATION_PLAN.md` (신규): Tool Calling 구현 명세서, 데이터 흐름, 모듈 아키텍처, 에러 처리 전략 (144줄)

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

없음

### Medium (개선 권장)

#### 1. `requirements.txt` — neo4j 드라이버 버전 고정 제안

**변경 내용:**
`httpx`가 제거되고 `neo4j`가 추가되었습니다. `grep_search`로 `agent/` 디렉토리 내 `httpx` 사용 여부를 확인한 결과, 사용처가 존재하지 않아 안전하게 제거되었음을 확인했습니다.

**개선 제안:**
`neo4j` Python 드라이버의 버전을 명시하는 것이 좋습니다. 현재는 버전 미지정(`neo4j`)으로 최신 버전이 설치되는데, 프로덕션 환경에서는 재현성을 위해 버전 고정을 권장합니다.

- **위치**: `agent/requirements.txt` (라인 15)
- **기존 코드**:
```
neo4j
```
- **해결 방안 (수정 코드)**:
```
neo4j>=5.0.0,<6.0.0
```
  > 문서(`NEO4J_ANALYSIS.md`)에서 Backend는 `neo4j-java-driver:5.28.5`를 사용 중이므로, Python 드라이버도 동일 메이저 버전(5.x)으로 고정하는 것이 일관성에 좋습니다. `>=5.0.0,<6.0.0` 범위로 설정하면 5.x 대역 내에서 보안 패치를 자동으로 수용하면서도 메이저 버전 변경에 따른 호환성 문제를 방지할 수 있습니다.

---

#### 2. `NEO4J_ANALYSIS.md` — high 학교급 매핑 로직 구현 시 주의

**변경 내용:**
고등학교(`CMM13003`)는 `middle` 모델로 처리된다는 정책이 문서 Section 8 (주의사항 #3)에 포함되어 있습니다.

**개선 제안:**
이 정책은 중요한 비즈니스 로직 결정이므로, 문서에만 명시하는 것보다 실제 Agent 코드에도 이 매핑 로직이 반영되어야 합니다. 현재 Diff에는 Agent 코드 변경이 포함되어 있지 않으므로, 추후 `agent/app/tools/neo4j_tools.py` 또는 `agent/app/services/agent_service.py` 구현 시 `school_level` 매핑 로직(`high` -> `middle`)이 누락되지 않도록 주의해야 합니다.

구체적으로, Agent가 `context_data.context` 텍스트에서 추출한 `schoolLevel` 값이 `"high"`인 경우, Neo4j 쿼리 파라미터로는 `"middle"`을 전달해야 합니다. 이는 Backend의 `DgnssLpaService`에서 이미 구현된 로직(`SCH_GRADE` 코드 매핑)과 동일한 정책입니다. 문서에 "추후 구현 시 반영 필요"라는 명시적 표기를 추가하거나, TODO 항목으로 기록하는 것을 검토하세요.

---

#### 3. `NEO4J_TOOL_IMPLEMENTATION_PLAN.md` — Tool Binding 프레임워크 명시 필요

**변경 내용:**
Section 5에서 `agent_service.py`의 역할로 "LiteLLM/LangChain 등 프레임워크의 도구 바인딩 기능"을 통해 `Neo4jTools`의 메서드들을 LLM에 주입한다고 명시되어 있습니다.

**개선 제안:**
현재 Agent가 어떤 LLM 프레임워크를 사용 중인지에 따라 Tool Binding 방식이 달라집니다. LiteLLM과 LangChain은 Tool Calling 인터페이스가 다르므로, 문서에 사용할 프레임워크와 구체적인 바인딩 방식을 명시하는 것이 좋습니다.

예를 들어, LangChain을 사용한다면 `@tool` 데코레이터와 `bind_tools()` 메서드를 사용하고, LiteLLM을 사용한다면 `tools` 파라미터에 JSON 스키마를 직접 전달하는 방식이 필요합니다. 문서에 "LangChain 기반 `@tool` 데코레이터 사용" 또는 "LiteLLM `tools` 파라미터 직접 전달"과 같이 구체적인 방식을 명시하면 구현 단계에서 혼선을 방지할 수 있습니다.

---

## 주요 파일 분석

### `agent/requirements.txt`

**변경 내용:**
`httpx` 제거, `neo4j` 추가

**분석:**
- `grep_search`로 `agent/` 디렉토리 내 `httpx` 사용처를 확인한 결과, 사용처가 존재하지 않아 안전한 제거입니다.
- `neo4j` 드라이버 추가는 아키텍처 전환에 필수적입니다.
- 버전 미지정 상태이나, 프로덕션 환경에서는 `neo4j>=5.0.0,<6.0.0` 형태의 버전 고정을 권장합니다.

---

### `agent/docs/NEO4J_ANALYSIS.md` (신규, 535줄)

**변경 내용:**
Backend Neo4j 구조, Cypher 쿼리, 데이터 모델, Agent 연동 아키텍처 심층 분석 문서

**분석:**
- **Section 1 (접속 정보)**: Backend와 Agent의 환경변수를 명확히 구분하여 문서화했습니다. 특히 `DGNSS_NEO4J_URI`와 `NEO4J_URI`가 동일 엔드포인트를 바라보도록 설계된 점이 일관성 있습니다.
- **Section 2 (데이터 모델)**: 4개 노드 타입(LPAClass, ModerationPath, MediationPath, Factor)과 3개 관계 타입(HAS_MODERATION_PATH, HAS_MEDIATION_PATH, GROUP_TSCORE)을 상세히 정의했습니다. 그래프 구조 다이어그램이 시각적 이해를 돕습니다.
- **Section 3 (Cypher 쿼리)**: 4개의 핵심 쿼리를 파라미터와 함께 완전히 문서화했습니다. `$schoolLevel = ''` 조건으로 전체 조회가 가능한 옵셔널 필터 패턴이 일관성 있게 적용되어 있습니다.
- **Section 6 (Dual-Usage Architecture)**: Frontend(Backend REST 경유)와 Agent(Neo4j Bolt 직접)의 역할 분리를 명확히 설명했습니다. 데이터 흐름 다이어그램이 아키텍처 이해에 큰 도움이 됩니다.
- **Section 8 (주의사항)**: 6가지 주의사항을 구체적으로 명시하여 구현 시 실수를 방지할 수 있도록 했습니다. 특히 "Python Driver 비동기 전용", "high 학교급 미지원", "Backend 응답 Envelope" 항목이 실무적으로 중요합니다.

---

### `agent/docs/NEO4J_TOOL_IMPLEMENTATION_PLAN.md` (신규, 144줄)

**변경 내용:**
Tool Calling 구현 명세서, 데이터 흐름, 모듈 아키텍처

**분석:**
- **Section 1 (AS-WAS vs TO-BE)**: RAG 방식의 문제점(컨텍스트 낭비, 프론트엔드 수정 필요)을 정확히 진단하고, Tool Calling 방식의 장점(하위 호환성, 추론 정합성, 토큰 효율)을 명확히 대비했습니다.
- **Section 3 (Tool Calling 구조)**: 4개의 Tool 함수(`get_lpa_class_info`, `get_moderation_paths`, `get_mediation_paths`, `get_factor_scores`)를 정의하고, 각각의 파라미터와 반환 데이터를 명시했습니다. LLM이 `context_data` 텍스트에서 유형명을 추출하여 Tool을 호출하는 동작 원리가 잘 설명되어 있습니다.
- **Section 4 (모듈 아키텍처)**: 파일 트리 구조로 변경될 파일들을 명확히 표시했습니다. `[수정]`, `[신설]`, `[유지]` 레이블이 변경 범위를 한눈에 파악할 수 있게 해줍니다.
- **Section 6 (에러 처리)**: 3가지 에러 상황별 Graceful Degradation 전략을 명시했습니다. 특히 "LPAClass Not Found 시 빈 배열 반환" 정책은 Agent 루프 중단을 방지하는 실용적인 접근법입니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [x] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [ ] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**
httpx 의존성 제거는 안전하게 수행되었으며, Neo4j 연동 아키텍처 문서화가 매우 상세하고 체계적으로 잘 작성되었습니다. 특히 Dual-Usage Architecture 개념과 Zero-touch Frontend/Backend 설계는 실용적이고 현실적인 접근법입니다. 문서 수준의 제안사항(버전 고정, 학교급 매핑 로직 구현 시 주의, Tool Binding 프레임워크 명시)은 추후 실제 구현 단계에서 반영하면 충분할 것으로 보입니다. 전반적으로 깔끔하고 잘 정리된 커밋이며, CP님의 매의 눈 덕분에 불필요한 의존성이 제거되고 아키텍처가 더 명확해졌습니다.