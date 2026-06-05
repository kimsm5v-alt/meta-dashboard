# Neo4j Tool Calling 구현 명세서 V2 (수정·확정안)

> **목적**: Backend(`DgnssGraphService`)가 이미 정상 동작 중인 Neo4j 그래프 DB를 Agent의 LLM Tool로 정확히 매핑하여, "프론트가 주입한 학생 컨텍스트(텍스트)" + "Tool로 가져온 집단 전략 데이터"를 융합한 초개인화 응답을 가능하게 한다.
>
> **상태**: V1(`NEO4J_TOOL_IMPLEMENTATION_PLAN.md`)은 폐기. 본 V2가 단일 SSOT.
> **작성일**: 2026-05-09  
> **최종 현행화**: 2026-05-09 — Frontend AI 호출 경로 팩트체크·엣지 케이스·세션 캐시 이슈 반영.
> **참조**: `agent/docs/NEO4J_ANALYSIS.md`(주의: V1과 함께 작성된 예시 Cypher 일부에 오류가 남아 있어, 본 문서의 §3 스키마 표가 우선한다)
> **참조 코드**:
> - Backend(정답 레퍼런스): `backend/src/main/java/com/vs/meta/api/dgnss/service/DgnssGraphService.java`
> - Backend(typeName 매핑): `backend/src/main/java/com/vs/meta/api/dgnss/service/DgnssLpaService.java`
> - Neo4j 마이그레이션: `backend/docs/lpa/graph/{elementary,middle}/*_merge_safe.cypher`
> - Frontend 컨텍스트 빌더: `frontend/src/features/ai-room/api/contextBuilder.ts`
> - Frontend 에이전트 호출: `frontend/src/features/ai-room/api/assistantService.ts`, `agentApiService.ts`, `model/useConversations.ts`
> - Frontend 타입: `frontend/src/shared/types/index.ts` (`SCHOOL_LEVEL_REVERSE_MAP`)

---

## 0. V1과의 차이 한눈에 보기

| 항목 | V1 (폐기) | V2 (확정) |
|:---|:---|:---|
| Cypher Property | `LPAClass.className/schoolLevel`, `Factor.factorName`, `r.tscore`, `r.priority` | **`LPAClass.name/school_level`, `Factor.name`, `r.t_score`** (Backend와 동일) |
| ModerationPath 반환 | `pathName, description, priority` (존재하지 않음) | `id, path_type, path_color, x, z, y, keyword_interp, keyword_strat, interpretation, strategy` |
| MediationPath 반환 | `pathName, description, priority` (존재하지 않음) | `id, x, m(mediator), y, interpretation, strategy, path_type` |
| schoolLevel 값 | docstring `"E"/"M"/"H"` (어디서도 안 씀) | **`"elementary" / "middle"`** (Backend·Neo4j 실제 값) |
| schoolLevel 주입 | "텍스트에서 알아서 파악" | **Frontend 컨텍스트 빌더가 명시적으로 주입** + Tool 인자로 강제 |
| Tool 개수 | 4개 (info/mod/med/factor) | 4개 + 안전망용 1개(`get_lpa_overview`) |
| Driver Lifecycle | Lazy + 검증 없음 | Lifespan에서 `verify_connectivity()` 강제 |
| max_iterations | 5 | 8 (4개 Tool 모두 호출 + 종합 응답 여유) |
| 회귀 테스트 | 없음 | Tool 단위 + Live Neo4j 통합 테스트 |
| Frontend `profile` 전달 | 미정의 | **`context_data`에 옵셔널 `profile` 추가** — Agent `Dict[str,Any]` 스키마 변경 불필요 |
| AI Room 호출 경로 | 문서만 언급 | **`useConversations` → `callAssistantStream` → `agentChatStream`** (실제 UI 경로) |

---

## 1. 사실 기반 데이터 모델 (Backend·마이그레이션 직접 검증)

### 1.1 노드 Property (실제 Neo4j 데이터)

| 노드 | Identity Key | 주요 Property (실제 값 형태) |
|:---|:---|:---|
| `LPAClass` | `(school_level, id)` UNIQUE | `name`(예: `'자원소진형'`), `school_level`(`'elementary'` / `'middle'`), `class_num`, `color`, `description`, `id`(==name) |
| `Factor` | `id` UNIQUE | `name`, `factor_type`(`'positive'`/`'negative'`), `factor_type_ko`, `op_def`, `section_1`, `section_2`, `section_nm_full`, `env_type`, `mean_elem`/`mean_mid`, `sd_elem`/`sd_mid`, `need_score_direction`, `badge_*_threshold` |
| `ModerationPath` | `id` UNIQUE | `lpa_class`, `x`, `z`, `y`, `path_type`, `path_color`, `keyword_interp`, `keyword_strat`, `interpretation`, `strategy`, `z_factor_type`, `z_need_direction` |
| `MediationPath` | `id` UNIQUE | `lpa_class`, `x`, `m`, `y`, `interpretation`, `strategy`, `path_type` |
| `Outcome` | `id` UNIQUE | `id`(예: `'학업성취도'`) |

### 1.2 관계 (실제 Neo4j 데이터)

| 관계 | 시작 | 종료 | 관계 Property |
|:---|:---|:---|:---|
| `:HAS_MODERATION_PATH` | `LPAClass` | `ModerationPath` | **없음** |
| `:HAS_MEDIATION_PATH` | `LPAClass` | `MediationPath` | **없음** |
| `:GROUP_TSCORE` | `LPAClass` | `Factor` | `t_score`(double), `raw_mean`(double), `school_level`(string) |

### 1.3 합법적인 (className, schoolLevel) 조합 — 6쌍 전부

| schoolLevel | className | classId (Backend) |
|:---|:---|:---|
| `elementary` | `자원소진형` | Class1 |
| `elementary` | `안전 균형형` | Class2 |
| `elementary` | `몰입자원 풍부형` | Class3 |
| `middle` | `냉소적 무기력형` | Class4 |
| `middle` | `정서조절 취약형` | Class5 |
| `middle` | `자기주도 몰입형` | Class6 |

> **공백 주의**: `'안전 균형형'`, `'몰입자원 풍부형'`, `'냉소적 무기력형'`, `'정서조절 취약형'`, `'자기주도 몰입형'` — 모두 공백을 포함한 정확한 문자열로 매칭해야 합니다. (`lpa-types.json`은 공백 없는 변형을 사용하지만, **Tool 인자로 사용 금지**)
>
> **`high` 처리**: Backend `DgnssLpaService.resolveModelSchoolLevel()`이 `high → middle`로 매핑. Frontend `SCHOOL_LEVEL_MAP.high === '중등'`. → Agent에서도 `high → middle` 정규화 필수.

---

## 2. 종단 간 데이터 흐름 (TO-BE)

```
┌─────────────────┐        ┌──────────────────────────────┐        ┌─────────────────┐
│   Frontend      │        │       Agent (FastAPI)         │        │   Neo4j (Bolt)  │
│  ai-room        │ POST   │                              │        │                 │
│  contextBuilder │  /chat │ agent_service                 │        │                 │
│                 │ ─────▶ │  ├─ context_data 주입         │        │                 │
│  context_data:  │        │  │  (mode/context/profile)   │        │                 │
│  {              │        │  │                           │        │                 │
│   mode,         │        │  ├─ system_prompt 합성        │        │                 │
│   context,      │        │  │  + profile.schoolLevel 강제│        │                 │
│   profile: {    │        │  │  + profile.predictedType  │        │                 │
│     schoolLevel,│        │  │                           │        │                 │
│     predictedType│       │  ├─ LLM (Gemini) 추론         │        │                 │
│     studentName │        │  │                           │        │                 │
│   }             │        │  ├─ Tool Call 발생            │        │                 │
│  }              │        │  │   ↓                       │        │                 │
└─────────────────┘        │  │  neo4j_tools.<fn>         │        │                 │
                           │  │  (className, schoolLevel) │ Cypher │                 │
                           │  │  ─────────────────────────│ ─────▶ │  실행 결과 반환 │
                           │  │  ◀────────────────────── JSON                       │
                           │  │                           │        │                 │
                           │  ├─ Tool 결과 + 학생 점수 융합 │        │                 │
                           │  └─ 최종 응답                │        │                 │
                           └──────────────────────────────┘        └─────────────────┘
```

### 핵심 정책
1. **`mode === 'student'` 이고 학생이 정확히 1명**일 때에만 `profile.{schoolLevel, predictedType}`이 채워진다. (Tool 호출 가능)
2. `mode === 'class'` / `mode === 'all'` 또는 다중 학생 → `profile`은 `null`이며, system prompt에 "Tool 호출 자제, 텍스트로만 답변" 지침이 추가된다.
3. 다중 학생 모드에서 LLM이 굳이 Tool을 호출하면 → Tool은 인자 누락 시 명시적 에러를 반환해 환각을 방지한다.
4. **`profile`이 비어 있거나 `predictedType`/`schoolLevel`이 없으면** Neo4j Tool 호출을 유도하지 않는다. (검사 미완료 학생 등)

---

## 2.1 Frontend AI 에이전트 호출 경로 (코드 기준 팩트)

| 단계 | 파일 | 내용 |
|:---|:---|:---|
| UI 전송 | `frontend/src/features/ai-room/model/useConversations.ts` | `handleSend` → `callAssistantStream(...)`; `sessionId` = `activeConversationId`; 첫 턴은 `cachedContext === null`이면 `buildRAGContext` 실행 |
| 조립 | `frontend/src/features/ai-room/api/assistantService.ts` | `context_data` = 첫 턴에만 `{ mode, context }` (현행). **`profile` 추가 시 동일 분기에서 함께 실음** |
| HTTP | `frontend/src/features/ai-room/api/agentApiService.ts` | `POST {BASE_URL}/chat/stream`, body `{ text, session_id, context_data }` |
| 수신 | `agent/app/models/schemas.py` | `context_data: Optional[Dict[str, Any]]` → **`profile` 키 추가에 Pydantic 변경 불필요** |

**구현 가능성 결론**: §4에서 제안하는 `schoolLevel` 마크다운 주입·`profile` 동봉은 **현재 스택에서 기술적으로 차단 요소 없음**.

---

## 3. 신규 Tool 인터페이스 명세

### 3.1 공통 규칙
- 모든 Tool은 **`schoolLevel: Literal["elementary","middle"]`** 만 허용.
- `high` / `초등` / `중등` / `E` / `M` 등은 **Agent 입력단(System Prompt + tool decorator pre-validation)에서 정규화 후 호출**한다. Tool 내부에는 정규화 로직을 두지 않는다(SRP).
- 모든 Tool 반환은 `list[dict]` 또는 `dict`. 에러 시 `{"error": "<code>", "message": "<human-readable>"}` 단일 dict 반환.
- 모든 Tool에 `MAX_LIMIT = 100` 적용.

### 3.2 `get_lpa_class_info(className, schoolLevel)`
**용도**: 유형 메타데이터(설명, 색상, 클래스 번호) 1건.

```cypher
MATCH (c:LPAClass {name: $className, school_level: $schoolLevel})
RETURN c.name AS className, c.school_level AS schoolLevel,
       c.class_num AS classNum, c.color AS color, c.description AS description
LIMIT 1
```

**반환 스키마** (예시):
```json
{
  "className": "자원소진형",
  "schoolLevel": "elementary",
  "classNum": 1,
  "color": "#E74C3C",
  "description": "학습에 필요한 심리·정서적 자원이 전반적으로 낮고..."
}
```

### 3.3 `get_moderation_paths(className, schoolLevel, limit=20)`
**용도**: 조절 효과 경로(개입 전략) 목록.

```cypher
MATCH (c:LPAClass {name: $className, school_level: $schoolLevel})
      -[:HAS_MODERATION_PATH]->(p:ModerationPath)
RETURN p.id AS id,
       p.path_type AS pathType,
       p.path_color AS pathColor,
       p.x AS x, p.z AS z, p.y AS y,
       p.keyword_interp AS keywordInterp,
       p.keyword_strat AS keywordStrat,
       p.interpretation AS interpretation,
       p.strategy AS strategy,
       p.z_factor_type AS zFactorType,
       p.z_need_direction AS zNeedDirection
ORDER BY p.id
LIMIT $limit
```

### 3.4 `get_mediation_paths(className, schoolLevel, limit=20)`
**용도**: 매개 효과 경로(원인→매개→결과) 목록.

```cypher
MATCH (c:LPAClass {name: $className, school_level: $schoolLevel})
      -[:HAS_MEDIATION_PATH]->(p:MediationPath)
RETURN p.id AS id,
       p.x AS x, p.m AS mediator, p.y AS y,
       p.path_type AS pathType,
       p.interpretation AS interpretation,
       p.strategy AS strategy
ORDER BY p.id
LIMIT $limit
```

### 3.5 `get_factor_scores(className, schoolLevel)`
**용도**: 해당 유형 집단의 38개 요인 평균 T-Score (학생 개별 점수와 비교 분석용).

```cypher
MATCH (c:LPAClass {name: $className, school_level: $schoolLevel})
      -[r:GROUP_TSCORE]->(f:Factor)
RETURN f.name AS factorName,
       f.factor_type AS factorType,
       f.need_score_direction AS needScoreDirection,
       r.t_score AS tScore,
       r.raw_mean AS rawMean
ORDER BY f.name
```

### 3.6 `get_lpa_overview(className, schoolLevel, modPathLimit=10, medPathLimit=5)` *(신규)*
**용도**: 대화 초반 1회 호출만으로 유형의 핵심 컨텍스트(설명+상위 조절경로+매개경로+요인평균)를 일괄 획득하여 Tool Call 왕복 횟수를 줄임. `max_iterations` 절약.

```cypher
MATCH (c:LPAClass {name: $className, school_level: $schoolLevel})
OPTIONAL MATCH (c)-[:HAS_MODERATION_PATH]->(mod:ModerationPath)
WITH c, collect(DISTINCT {
  id: mod.id, pathType: mod.path_type, x: mod.x, z: mod.z, y: mod.y,
  keywordStrat: mod.keyword_strat, strategy: mod.strategy
})[0..$modPathLimit] AS moderationPaths
OPTIONAL MATCH (c)-[:HAS_MEDIATION_PATH]->(med:MediationPath)
WITH c, moderationPaths, collect(DISTINCT {
  id: med.id, x: med.x, mediator: med.m, y: med.y, strategy: med.strategy
})[0..$medPathLimit] AS mediationPaths
OPTIONAL MATCH (c)-[r:GROUP_TSCORE]->(f:Factor)
RETURN
  c.name AS className,
  c.school_level AS schoolLevel,
  c.description AS description,
  moderationPaths,
  mediationPaths,
  collect(DISTINCT {factorName: f.name, tScore: r.t_score}) AS factorScores
```

> 이 Tool은 "유형 전반 요약"이 필요한 첫 질문 처리에 권장. 세부 질문은 §3.3-3.5의 개별 Tool 사용.

### 3.7 모든 Tool에 공통 적용되는 Docstring 템플릿

```python
"""
<무엇을 가져오는지 1줄 설명>

Args:
    className: LPA 유형명. 다음 6개 중 정확히 하나(공백 포함):
      - elementary: "자원소진형" | "안전 균형형" | "몰입자원 풍부형"
      - middle: "냉소적 무기력형" | "정서조절 취약형" | "자기주도 몰입형"
    schoolLevel: 학교급. "elementary" 또는 "middle". (한국어/약어/high 금지 — 호출 전에 매핑)

Returns:
    list[dict] (각 dict의 키는 카멜케이스). 데이터 없을 시 [] 반환.
    오류 시 단일 dict {"error": "<code>", "message": "..."} 반환.
"""
```

---

## 4. Frontend 변경 사항 (필수)

### 4.0 구현 시 유의 (분석에서 도출된 엣지 케이스)

1. **검사 데이터 없는 학생**  
   `buildStudentContext`는 `getLatestAssessment(student)`가 없으면 해당 학생 블록을 **생략**한다. 이 경우 `profile`은 반드시 **`null`** (또는 키 생략). `predictedType` 없이 Tool을 유도하면 안 된다.

2. **`classNumber` 채우기**  
   `AssistantRequest`에는 `selectedClass`만 있고 학생별 반 번호는 `Student`에 직접 없을 수 있다. 권장:  
   `classes.find((c) => c.id === student.classId)?.classNumber` 로 보완.

3. **`getLatestAssessment` 중복**  
   `contextBuilder.ts` 내부 비공개 함수와 동일 로직이 필요하면, **`contextBuilder.ts`에서 export**하거나 `ai-room/api/studentAssessment.ts` 등 공통 유틸로 한 곳에만 두어 `assistantService`와 빌더가 공유한다.

4. **`callAssistant` / `callAssistantStream` 동일 정책**  
   비스트리밍 `callAssistant`는 현재 AI Room UI에서 쓰이지 않을 수 있으나, **`contextData` 구성은 두 함수 모두 동일**하게 유지한다.

5. **세션 ID ↔ 컨텍스트 캐시 (알려진 동작)**  
   `useConversations`의 `contextCacheRef`는 키로 `activeConversationId`를 쓴다. 새 대화는 `temp-…`로 시작 후 서버 ID로 **교체**되므로, 첫 응답 직후 ID가 바뀌면 **캐시 키 불일치**로 두 번째 사용자 메시지에서 `cachedContext`가 비어 **`context_data`가 다시 전송**될 수 있다.  
   - Neo4j 기능 관점: 중복 전송은 기능적으로 무해할 수 있음.  
   - “첫 턴만 `context_data`”를 엄밀히 지키려면 **선택 과제(P2)**: `temp-` → 숫자 ID 전환 시 `contextCacheRef` 항목을 이관하는 패치를 Phase 2 또는 후속 티켓에 포함.

---

### 4.1 `frontend/src/features/ai-room/api/contextBuilder.ts`

**변경 1**: `student` 모드에서 단일 학생일 때 컨텍스트 텍스트 상단에 `schoolLevel`(영문 코드)을 명시.

```ts
// SCHOOL_LEVEL_REVERSE_MAP 활용 (이미 존재하는 매핑)
import { SCHOOL_LEVEL_REVERSE_MAP } from '@shared/types';

// student 모드 빌더 안에서:
const schoolLevelCode = SCHOOL_LEVEL_REVERSE_MAP[student.schoolLevel]; // '초등' → 'elementary'

let context = `### ${alias}
- **schoolLevel**: ${schoolLevelCode}
- **유형**: ${assessment.predictedType} (확신도 ${(assessment.typeConfidence * 100).toFixed(0)}%)${badgeText}
...
`;
```

**변경 2**: `class` 모드에서도 학급 단위 `schoolLevel`을 헤더에 추가:

```ts
return `## ${cls.grade}학년 ${cls.classNumber}반 현황 (schoolLevel: ${SCHOOL_LEVEL_REVERSE_MAP[cls.schoolLevel]})
- 학생 수: ${cls.students.length}명
...`;
```

**변경 3 (권장)**: `all` 모드 `buildAllContext`에서 학급별 블록 헤더에 각 `cls.schoolLevel` 역매핑 한 줄 추가 — 다중 학급이 초·중 혼재일 때 LLM이 학교급 단서를 갖도록 함.

### 4.2 `frontend/src/features/ai-room/api/assistantService.ts`

**변경**: `mode === 'student' && selectedStudents.length === 1`일 때만 `context_data.profile`을 채우고, **최신 검사가 없으면 `profile: null`**.

```ts
const profile =
  mode === 'student' && selectedStudents.length === 1
    ? (() => {
        const s = selectedStudents[0];
        const a = getLatestAssessment(s); // contextBuilder와 동일 시그니처 권장(공통 유틸)
        if (!a) return null;
        const cls = classes.find((c) => c.id === s.classId);
        return {
          schoolLevel: SCHOOL_LEVEL_REVERSE_MAP[s.schoolLevel], // 'elementary' | 'middle'
          predictedType: a.predictedType,
          grade: s.grade,
          classNumber: cls?.classNumber ?? null,
        };
      })()
    : null;

const contextData: Record<string, unknown> | null = cachedContext
  ? null
  : { mode, context: ragContext, ...(profile !== null ? { profile } : {}) };
```

> **`profile` 키 생략 vs 명시 `null`**: Agent는 둘 다 “식별자 없음”으로 처리 가능. 일관성을 위해 **`null` 명시** 또는 키 생략 중 한 가지로 통일한다.

> **하위 호환성**: 기존 키(`mode`, `context`)는 그대로 유지. `profile`은 옵셔널. Agent는 `profile` 없거나 불완전하면 Neo4j Tool 미사용 정책(§2, §5.3).

### 4.3 타입 (선택)

`agentApiService.ts`의 `AgentQuery`를 로컬 타입으로 확장할 수 있음:

```ts
interface AgentContextProfile {
  schoolLevel: 'elementary' | 'middle';
  predictedType: string;
  grade: number;
  classNumber: number | null;
}

interface AgentQuery {
  text: string;
  session_id: string;
  context_data?: {
    mode?: string;
    context?: string;
    profile?: AgentContextProfile | null;
  } | null;
}
```

---


## 5. Agent 변경 사항

### 5.1 `agent/app/tools/neo4j_tools.py` (전면 교체)

```python
import os
import logging
import asyncio
from typing import Dict, List, Any, Literal, Union
from neo4j import AsyncGraphDatabase, exceptions as neo4j_exceptions
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

VALID_SCHOOL_LEVELS = {"elementary", "middle"}
VALID_CLASS_NAMES = {
    "elementary": {"자원소진형", "안전 균형형", "몰입자원 풍부형"},
    "middle":     {"냉소적 무기력형", "정서조절 취약형", "자기주도 몰입형"},
}
MAX_LIMIT = 100


class Neo4jConnectionManager:
    _driver = None

    @classmethod
    def get_driver(cls):
        if cls._driver is None:
            uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
            user = os.getenv("NEO4J_USERNAME", "neo4j")
            password = os.getenv("NEO4J_PASSWORD", "test1234")
            cls._driver = AsyncGraphDatabase.driver(uri, auth=(user, password))
        return cls._driver

    @classmethod
    async def verify(cls):
        """기동 시 1회 호출. 실패 시 명시적으로 raise."""
        driver = cls.get_driver()
        await driver.verify_connectivity()

    @classmethod
    async def close(cls):
        if cls._driver is not None:
            await cls._driver.close()
            cls._driver = None


def _validate_args(className: str, schoolLevel: str) -> Union[None, Dict[str, str]]:
    if schoolLevel not in VALID_SCHOOL_LEVELS:
        return {"error": "INVALID_SCHOOL_LEVEL",
                "message": f"schoolLevel must be one of {sorted(VALID_SCHOOL_LEVELS)}, got '{schoolLevel}'"}
    if className not in VALID_CLASS_NAMES[schoolLevel]:
        return {"error": "INVALID_CLASS_NAME",
                "message": f"className '{className}' invalid for schoolLevel '{schoolLevel}'. "
                           f"Allowed: {sorted(VALID_CLASS_NAMES[schoolLevel])}"}
    return None


async def _execute_query(query: str, parameters: dict) -> List[Dict[str, Any]]:
    driver = Neo4jConnectionManager.get_driver()
    timeout = float(os.getenv("GRAPH_TOOL_TIMEOUT", "5.0"))

    async def _run():
        async with driver.session() as session:
            result = await session.run(query, parameters)
            return await result.data()

    try:
        return await asyncio.wait_for(_run(), timeout=timeout)
    except asyncio.TimeoutError:
        logger.error(f"Neo4j query timeout ({timeout}s)")
        return [{"error": "TIMEOUT", "message": "Query timeout exceeded"}]
    except neo4j_exceptions.ServiceUnavailable as e:
        logger.error(f"Neo4j unavailable: {e}")
        return [{"error": "UNAVAILABLE", "message": "Database service unavailable"}]
    except neo4j_exceptions.AuthError as e:
        logger.error(f"Neo4j auth failed: {e}")
        return [{"error": "AUTH_FAILED", "message": "Database authentication failed"}]
    except neo4j_exceptions.ClientError as e:
        logger.error(f"Neo4j client error: {e}")
        return [{"error": "CLIENT_ERROR", "message": str(e)}]
    except Exception as e:
        logger.exception("Unknown Neo4j error")
        return [{"error": "UNKNOWN", "message": str(e)}]


@tool
async def get_lpa_class_info(className: str, schoolLevel: str) -> List[Dict[str, Any]]:
    """LPA 유형의 메타데이터(설명/색상/번호)를 1건 조회.
    Args:
        className: 다음 6개 중 정확히 하나(공백 포함):
          elementary: "자원소진형" | "안전 균형형" | "몰입자원 풍부형"
          middle:     "냉소적 무기력형" | "정서조절 취약형" | "자기주도 몰입형"
        schoolLevel: "elementary" 또는 "middle".
    """
    err = _validate_args(className, schoolLevel)
    if err: return [err]
    return await _execute_query(
        """
        MATCH (c:LPAClass {name: $className, school_level: $schoolLevel})
        RETURN c.name AS className, c.school_level AS schoolLevel,
               c.class_num AS classNum, c.color AS color, c.description AS description
        LIMIT 1
        """,
        {"className": className, "schoolLevel": schoolLevel},
    )


@tool
async def get_moderation_paths(className: str, schoolLevel: str, limit: int = 20) -> List[Dict[str, Any]]:
    """해당 유형의 조절(Moderation) 경로 전략 목록 조회. (개입 전략)"""
    err = _validate_args(className, schoolLevel)
    if err: return [err]
    safe_limit = max(1, min(int(limit), MAX_LIMIT))
    return await _execute_query(
        """
        MATCH (c:LPAClass {name: $className, school_level: $schoolLevel})
              -[:HAS_MODERATION_PATH]->(p:ModerationPath)
        RETURN p.id AS id, p.path_type AS pathType, p.path_color AS pathColor,
               p.x AS x, p.z AS z, p.y AS y,
               p.keyword_interp AS keywordInterp, p.keyword_strat AS keywordStrat,
               p.interpretation AS interpretation, p.strategy AS strategy,
               p.z_factor_type AS zFactorType, p.z_need_direction AS zNeedDirection
        ORDER BY p.id
        LIMIT $limit
        """,
        {"className": className, "schoolLevel": schoolLevel, "limit": safe_limit},
    )


@tool
async def get_mediation_paths(className: str, schoolLevel: str, limit: int = 20) -> List[Dict[str, Any]]:
    """해당 유형의 매개(Mediation) 경로 전략 목록 조회. (X→M→Y 경로)"""
    err = _validate_args(className, schoolLevel)
    if err: return [err]
    safe_limit = max(1, min(int(limit), MAX_LIMIT))
    return await _execute_query(
        """
        MATCH (c:LPAClass {name: $className, school_level: $schoolLevel})
              -[:HAS_MEDIATION_PATH]->(p:MediationPath)
        RETURN p.id AS id, p.x AS x, p.m AS mediator, p.y AS y,
               p.path_type AS pathType,
               p.interpretation AS interpretation, p.strategy AS strategy
        ORDER BY p.id
        LIMIT $limit
        """,
        {"className": className, "schoolLevel": schoolLevel, "limit": safe_limit},
    )


@tool
async def get_factor_scores(className: str, schoolLevel: str) -> List[Dict[str, Any]]:
    """해당 유형 집단의 38개 요인 평균 T-Score 조회. (학생 개별 점수와 비교용)"""
    err = _validate_args(className, schoolLevel)
    if err: return [err]
    return await _execute_query(
        """
        MATCH (c:LPAClass {name: $className, school_level: $schoolLevel})
              -[r:GROUP_TSCORE]->(f:Factor)
        RETURN f.name AS factorName,
               f.factor_type AS factorType,
               f.need_score_direction AS needScoreDirection,
               r.t_score AS tScore,
               r.raw_mean AS rawMean
        ORDER BY f.name
        """,
        {"className": className, "schoolLevel": schoolLevel},
    )


@tool
async def get_lpa_overview(className: str, schoolLevel: str,
                           modPathLimit: int = 10, medPathLimit: int = 5) -> List[Dict[str, Any]]:
    """대화 초반 1회 호출로 유형 전반(설명+상위 조절·매개 경로+요인평균)을 일괄 조회."""
    err = _validate_args(className, schoolLevel)
    if err: return [err]
    return await _execute_query(
        """
        MATCH (c:LPAClass {name: $className, school_level: $schoolLevel})
        OPTIONAL MATCH (c)-[:HAS_MODERATION_PATH]->(mod:ModerationPath)
        WITH c, collect(DISTINCT {
          id: mod.id, pathType: mod.path_type, x: mod.x, z: mod.z, y: mod.y,
          keywordStrat: mod.keyword_strat, strategy: mod.strategy
        })[0..$modPathLimit] AS moderationPaths
        OPTIONAL MATCH (c)-[:HAS_MEDIATION_PATH]->(med:MediationPath)
        WITH c, moderationPaths, collect(DISTINCT {
          id: med.id, x: med.x, mediator: med.m, y: med.y, strategy: med.strategy
        })[0..$medPathLimit] AS mediationPaths
        OPTIONAL MATCH (c)-[r:GROUP_TSCORE]->(f:Factor)
        RETURN c.name AS className, c.school_level AS schoolLevel,
               c.description AS description,
               moderationPaths, mediationPaths,
               collect(DISTINCT {factorName: f.name, tScore: r.t_score}) AS factorScores
        """,
        {"className": className, "schoolLevel": schoolLevel,
         "modPathLimit": max(1, min(int(modPathLimit), MAX_LIMIT)),
         "medPathLimit": max(1, min(int(medPathLimit), MAX_LIMIT))},
    )


neo4j_tools_list = [
    get_lpa_class_info,
    get_moderation_paths,
    get_mediation_paths,
    get_factor_scores,
    get_lpa_overview,
]
```

### 5.2 `agent/main.py` Lifespan 강화

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up: Verifying Neo4j connection...")
    try:
        await Neo4jConnectionManager.verify()
        logger.info("Neo4j connectivity OK.")
    except Exception as e:
        # 운영 정책: Neo4j 연결 실패는 치명적이지 않음(텍스트 추론 가능)
        logger.warning(f"Neo4j unavailable at startup, will operate in degraded mode: {e}")
    yield
    logger.info("Shutting down: Closing Neo4j connection...")
    await Neo4jConnectionManager.close()
```

### 5.3 `agent/app/services/agent_service.py` 변경

**변경 1 — 시스템 프롬프트 재작성** (Tool 사용 가이드 강화):

```python
def _build_system_prompt(masked_context: dict | None) -> str:
    profile = (masked_context or {}).get("profile") or {}
    context_text = (masked_context or {}).get("context") or "No additional context provided."
    school_level = profile.get("schoolLevel")  # 'elementary' | 'middle' | None
    predicted_type = profile.get("predictedType")  # '자원소진형' 등 | None

    profile_block = ""
    if school_level and predicted_type:
        profile_block = (
            f"\n## 분석 대상 학생 식별자 (Tool 호출 인자로 그대로 사용)\n"
            f"- className: \"{predicted_type}\"\n"
            f"- schoolLevel: \"{school_level}\"\n"
        )
        tool_policy = (
            "필요 시 위 식별자로 Neo4j Tool을 호출하십시오. "
            "특히 학생의 강·약점 분석, 개입 전략, 집단 평균 비교가 필요할 때 적극 활용하세요. "
            "처음에는 `get_lpa_overview`를 1회 호출하여 전반을 파악하고, "
            "심화 정보가 필요하면 개별 Tool로 보강하십시오.\n"
        )
    else:
        tool_policy = (
            "현재 단일 학생 식별자가 없으므로 Neo4j Tool을 호출하지 마십시오. "
            "주어진 텍스트 컨텍스트만을 근거로 답변하십시오.\n"
        )

    return (
        "귀하는 Meta Dashboard의 학습심리 상담 보조 AI입니다.\n"
        "주어진 컨텍스트(학생의 38개 T점수, 4단계 진단 결과 등)를 기반으로 교사를 돕습니다.\n\n"
        f"{tool_policy}"
        f"{profile_block}"
        "\n## 학생 컨텍스트 (마크다운)\n"
        f"{context_text}"
    )
```

**변경 2 — `max_iterations = 8`** (4개 Tool 모두 호출 + 종합 응답 여유).

**변경 3 — Tool 호출 시 인자 정규화 후처리** (LLM이 잘못된 값을 넣어도 한 번 더 보호):

```python
def _normalize_tool_args(func_name: str, args: dict) -> dict:
    sl = args.get("schoolLevel")
    if isinstance(sl, str):
        s = sl.strip().lower()
        # 한글/약어/high → 정규화
        mapping = {"초등": "elementary", "elementary": "elementary", "e": "elementary",
                   "중등": "middle", "middle": "middle", "m": "middle",
                   "고등": "middle", "high": "middle", "h": "middle"}
        args["schoolLevel"] = mapping.get(s, sl)
    return args
```

**변경 4 — PII 강화**: `mask_pii_data`가 `context_data["context"]` 본문 문자열에도 작동하도록 별도 텍스트 정규식 마스킹 함수를 추가하거나, 프론트의 `aliasMap` 비활성화 정책을 재검토 (별도 티켓으로 분리 가능).

### 5.4 `agent/app/tools/__init__.py`

```python
from .neo4j_tools import Neo4jConnectionManager, neo4j_tools_list
__all__ = ["Neo4jConnectionManager", "neo4j_tools_list"]
```

(현재와 동일, 변경 없음)

### 5.5 `agent/requirements.txt`

`neo4j>=5.0.0,<6.0.0` 이미 포함됨. 추가 의존성 없음.

---

## 6. 환경 변수

```bash
# .env (Agent)
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=test1234
GRAPH_TOOL_TIMEOUT=5.0       # Tool당 쿼리 타임아웃(초)
NEO4J_VERIFY_AT_STARTUP=true # (옵션) lifespan 검증 활성/비활성
```

운영 환경 점검:
- Backend(`DGNSS_NEO4J_URI`)와 Agent(`NEO4J_URI`)가 **동일한 Neo4j 인스턴스**를 가리키는지 확인 (Helm/K8s ConfigMap).
- Agent 컨테이너에서 Neo4j Bolt 포트(7687) 네트워크 접근 가능 여부.

---

## 7. 테스트 계획

### 7.1 단위 테스트 (mock Neo4j)
**파일**: `agent/tests/test_neo4j_tools_unit.py`

- `_validate_args` — 6개 합법 조합 + 잘못된 schoolLevel + 잘못된 className 매트릭스
- 각 Tool의 Cypher 문자열 snapshot test (Property 이름 회귀 방지)
- `_normalize_tool_args` — 한글/약어/high → 영문 정규화

### 7.2 라이브 통합 테스트 (실제 Neo4j 필요)
**파일**: `agent/tests/test_neo4j_tools_live.py` (`pytest.mark.integration`)

각 Tool에 대해 6쌍(`schoolLevel`,`className`)을 모두 호출하여:
- `get_lpa_class_info`: `description` 비어있지 않음
- `get_moderation_paths`: 최소 1건 이상, 각 항목에 `interpretation`/`strategy` 존재
- `get_mediation_paths`: 최소 1건 이상
- `get_factor_scores`: **정확히 38건** (요인 누락 회귀 감지)
- `get_lpa_overview`: 한 번에 위 모든 데이터 포함 여부

### 7.3 End-to-End 시나리오 (기존 `test_api_integration.py` 확장)

```python
# 시나리오 1: 단일 학생 + Tool 호출 강제 시나리오
payload = {
    "text": "이 학생의 가장 큰 약점과 추천 개입 전략을 알려줘.",
    "session_id": "e2e_001",
    "context_data": {
        "mode": "student",
        "context": "### 김OO\n- schoolLevel: elementary\n- 유형: 자원소진형\n...",
        "profile": {"schoolLevel": "elementary", "predictedType": "자원소진형"}
    }
}
# 검증: 응답에 Neo4j ModerationPath의 strategy 키워드(예: "리듬", "의미감") 등장
```

```python
# 시나리오 2: schoolLevel 누락 → Tool 미호출 (graceful)
payload = {
    "text": "전체 학급의 동향을 분석해줘.",
    "session_id": "e2e_002",
    "context_data": {"mode": "all", "context": "..."}
}
# 검증: 응답이 텍스트 기반으로만 생성되며 에러 없이 정상 종료
```

```python
# 시나리오 2b: 단일 학생이지만 profile 없음(검사 미완료 등)
payload = {
    "text": "이 학생을 어떻게 지원하면 좋을까?",
    "session_id": "e2e_002b",
    "context_data": {
        "mode": "student",
        "context": "## 선택된 학생 분석 (1명)\n\n선택된 학생이 없습니다.",  # 또는 빈 요약
        # profile 키 생략 또는 "profile": null
    }
}
# 검증: Neo4j Tool 미호출 또는 빈 인자 거부; 텍스트만으로 안내, 500 없음
```

```python
# 시나리오 3: Neo4j 다운 → degraded 응답
# (docker compose에서 Neo4j stop 후 시나리오 1과 동일 호출)
# 검증: 응답에 "그래프 데이터를 조회할 수 없어" 류 안내 + 텍스트 기반 답변
```

### 7.4 부하 테스트
- 동시 요청 50개, 각 요청당 3 Tool Call → Neo4j 연결 풀(기본 100) 고갈 없는지 확인.
- 평균 응답 시간 측정 기준선 확보.

---

## 8. Phase별 실행 순서

### Phase 1 — 안전한 코어 교체 (30분)
1. `agent/app/tools/neo4j_tools.py` 전면 교체 (§5.1).
2. `agent/main.py` lifespan 강화 (§5.2).
3. 단위 테스트(`test_neo4j_tools_unit.py`) 작성·통과.

**완료 기준**: `pytest agent/tests/test_neo4j_tools_unit.py` 그린.

### Phase 2 — Frontend 컨텍스트 보강 (30분)
4. `frontend/src/features/ai-room/api/contextBuilder.ts`에 `schoolLevel` 명시 추가 (§4.1, 검사 없는 학생은 블록 생략 기존 동작 유지).
5. `frontend/src/features/ai-room/api/assistantService.ts`에 `profile` 동봉 (§4.2); `callAssistant`·`callAssistantStream` 동일 로직.
6. (선택, P2) `useConversations`: `temp-` → 서버 대화 ID 교체 시 `contextCacheRef` 항목 이관 (§4.0 항목 5).

**완료 기준**: 기존 e2e 시나리오(텍스트만 사용) 회귀 없음; 단일 학생·검사 있음 시 네트워크 페이로드에 `profile` 확인.

### Phase 3 — Agent 오케스트레이션 (25분)
6. `agent/app/services/agent_service.py` 시스템 프롬프트 재작성 (§5.3 변경 1).
7. `_normalize_tool_args` 추가 (§5.3 변경 3).
8. `max_iterations = 8` (§5.3 변경 2).

**완료 기준**: 시나리오 1·2 통과.

### Phase 4 — 라이브 검증 & 모니터링 (15분)
9. 라이브 통합 테스트(`test_neo4j_tools_live.py`) 6쌍 매트릭스 통과.
10. Neo4j 다운 시나리오 3 통과.
11. `agent_service.run_agent`/`run_agent_stream`에 Tool 호출 메트릭 로깅 (`tool_name`, `latency_ms`, `result_size`, `error_code`).

**완료 기준**: Datadog/CloudWatch에서 Tool 호출 카운트와 에러율 가시화.

### Phase 5 — 문서·롤아웃 (10분)
12. V1 (`NEO4J_TOOL_IMPLEMENTATION_PLAN.md`) 상단에 "**[DEPRECATED] V2를 참조하세요**" 헤더 추가. *(적용됨)*
13. `NEO4J_ANALYSIS.md` §3의 잘못된 Cypher 예시 정정 (§1 표 기반).
14. dev → stg → prod 순차 배포. 각 단계에서 시나리오 1·3 스모크.

---

## 9. 회귀 방지 체크리스트 (PR 머지 전)

- [ ] 4개(또는 5개) Tool의 Cypher가 `LPAClass {name: …, school_level: …}` 패턴으로 되어 있다.
- [ ] `Factor.name`, `r.t_score`(언더스코어 포함)를 사용한다.
- [ ] ModerationPath/MediationPath 반환에 `pathName`/`description`/`priority` 같은 존재하지 않는 키를 참조하지 않는다.
- [ ] `_validate_args`가 6쌍 합법 조합 외 입력을 거부한다.
- [ ] Frontend `contextBuilder.ts`가 `schoolLevel: elementary|middle`을 컨텍스트에 명시한다(class/all 모드 포함 §4.1).
- [ ] `assistantService.ts`가 `mode === 'student'` 단일 선택 시 검사 있을 때만 `profile`을 보낸다; 검사 없으면 `profile` 없음/`null`.
- [ ] `callAssistant`와 `callAssistantStream`의 `contextData` 구성이 동일하다.
- [ ] (선택) `contextCacheRef` 세션 ID 교체 시 캐시 이관 또는 재전송 허용 정책이 문서·코드와 일치한다.
- [ ] Lifespan에서 `verify_connectivity()` 호출 결과가 로그에 남는다.
- [ ] `max_iterations` 변경 후 4개 Tool 연쇄 호출 시 메시지 끊김 없다.
- [ ] 라이브 테스트가 38건의 GROUP_TSCORE를 검증한다.

---

## 10. 운영 가드레일

| 위협 | 완화책 |
|:---|:---|
| Neo4j 다운으로 Tool 모두 에러 | Tool 결과의 `error` 키를 LLM이 인지 → "그래프 정보를 가져올 수 없어 일반 지침으로 답변합니다" 폴백 문장. |
| LLM이 잘못된 className 입력 | `_validate_args` + 시스템 프롬프트에서 6개 옵션 명시 + `_normalize_tool_args` 후처리 3중 방어. |
| 학생 PII가 Tool 호출 인자로 유출 | Tool 인자는 `(className, schoolLevel)` 두 가지뿐. 학생 식별자 없음. |
| 마크다운 `context`에 실명 노출 | `contextBuilder`의 `createAliasMap`이 현재 `{}`(마스킹 비활성). PII 정책은 §5.3 변경 4·별도 티켓과 연계. |
| 세션 ID 변경으로 컨텍스트 재전송 | §4.0 항목 5 — 도구 정합성에는 보통 무해; 토큰 비용·정책상 문제 시 캐시 이관 패치. |
| 컨텍스트 토큰 폭증 | `get_lpa_overview`로 시작 → 필요 시에만 세부 Tool. `limit` 인자로 상한. |
| Backend Neo4j 스키마 변경 | 라이브 통합 테스트가 CI에서 매일 1회(nightly) 자동 실행되어 회귀 즉시 감지. |
| 동일 driver에 다중 요청 | `AsyncGraphDatabase.driver`는 connection pool 내장. 환경변수로 풀 크기 조정 가능 시 추후 노출. |

---

## 11. 부록 — Backend 정답 레퍼런스 코드 발췌

### 11.1 정확한 Cypher 패턴 (Backend)
```86:91:backend/src/main/java/com/vs/meta/api/dgnss/service/DgnssGraphService.java
String query = ""
        + "MATCH (c:LPAClass {name: $className}) "
        + "WHERE $schoolLevel = '' OR c.school_level = $schoolLevel "
        + "RETURN c.name AS className, c.school_level AS schoolLevel, c.class_num AS classNum, "
        + "       c.color AS color, c.description AS description "
        + "LIMIT 1";
```

```206:213:backend/src/main/java/com/vs/meta/api/dgnss/service/DgnssGraphService.java
String query = ""
        + "MATCH (c:LPAClass {name: $className})-[r:GROUP_TSCORE]->(f:Factor) "
        + "WHERE $schoolLevel = '' OR c.school_level = $schoolLevel "
        + "RETURN f.id AS factorId, f.name AS factorName, f.factor_type AS factorType, "
        + "       f.need_score_direction AS needScoreDirection, "
        + "       r.t_score AS tScore, r.raw_mean AS rawMean, r.school_level AS schoolLevel "
        + "ORDER BY factorName";
```

### 11.2 schoolLevel 매핑 정책 (Backend)
```273:294:backend/src/main/java/com/vs/meta/api/dgnss/service/DgnssLpaService.java
private String resolveModelSchoolLevel(String storedSchoolLevel) {
    if (StringUtils.equals(storedSchoolLevel, "elementary")) {
        return "elementary";
    }
    if (StringUtils.equals(storedSchoolLevel, "middle") || StringUtils.equals(storedSchoolLevel, "high")) {
        return "middle";
    }
    return "";
}
```

### 11.3 LPA 유형 ↔ classId 정의 (Backend)
```33:43:backend/src/main/java/com/vs/meta/api/dgnss/service/DgnssLpaService.java
private static final List<LpaClassInfo> ELEMENTARY_CLASSES = Arrays.asList(
        new LpaClassInfo("Class1", "자원소진형"),
        new LpaClassInfo("Class2", "안전 균형형"),
        new LpaClassInfo("Class3", "몰입자원 풍부형")
);

private static final List<LpaClassInfo> MIDDLE_CLASSES = Arrays.asList(
        new LpaClassInfo("Class4", "냉소적 무기력형"),
        new LpaClassInfo("Class5", "정서조절 취약형"),
        new LpaClassInfo("Class6", "자기주도 몰입형")
);
```

### 11.4 Frontend 학교급 매핑 (재사용 가능)
```635:644:frontend/src/shared/types/index.ts
export const SCHOOL_LEVEL_MAP: Record<SchoolLevelCode, SchoolLevel> = {
  elementary: '초등',
  middle: '중등',
  high: '중등', // 고등도 중등으로 처리 (검사 기준)
};

export const SCHOOL_LEVEL_REVERSE_MAP: Record<SchoolLevel, SchoolLevelCode> = {
  초등: 'elementary',
  중등: 'middle',
};
```

---

**Owner**: Agent Backend Squad
**Reviewer**: Backend(`DgnssGraphService` 보유 팀), Frontend(ai-room 보유 팀)
**Done Definition**:
- Phase 1~5 완료 + 회귀 체크리스트 전부 ✅
- 시나리오 1·2·3 e2e 통과
- prod 배포 후 24h 내 Tool 에러율 < 1%
