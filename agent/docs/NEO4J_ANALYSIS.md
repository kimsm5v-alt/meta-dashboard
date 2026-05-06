# Backend Neo4j 심층 분석

> **대상 프로젝트**: `backend` (Java Spring Boot 2.7.17)  
> **최초 작성**: 2026-05-06 | **현행화**: 2026-05-06 (Neo4j Tool Calling 설계 변경 반영)  
> **Neo4j Driver**: `org.neo4j.driver:neo4j-java-driver:5.28.5` (Backend) / `neo4j` Python Driver (Agent)

---

## 1. 접속 정보 (Connection Configuration)

### 1.1 Backend 환경변수

| 설정 키 | 환경변수 | 기본값 (로컬) | 비고 |
|:---|:---|:---|:---|
| `neo4j.uri` | `DGNSS_NEO4J_URI` | `bolt://localhost:7687` | Bolt 프로토콜 사용 |
| `neo4j.username` | `DGNSS_NEO4J_USERNAME` | `neo4j` | |
| `neo4j.password` | `DGNSS_NEO4J_PASSWORD` | `test1234` | 로컬 개발용 기본값 |

```yaml
# backend/src/main/resources/application.yml (line 173-176)
neo4j:
  uri: ${DGNSS_NEO4J_URI:bolt://localhost:7687}
  username: ${DGNSS_NEO4J_USERNAME:neo4j}
  password: ${DGNSS_NEO4J_PASSWORD:test1234}
```

### 1.2 Agent 환경변수 (Neo4j Tool 연동)

Agent는 Neo4j에 직접 Bolt 연결을 수행하여 LLM의 Tool(함수)로 동작합니다. `.env`에 아래 항목이 필요합니다.

| 환경변수 | 기본값 | 비고 |
|:---|:---|:---|
| `NEO4J_URI` | `bolt://localhost:7687` | Backend `DGNSS_NEO4J_URI`와 동일 엔드포인트 |
| `NEO4J_USERNAME` | `neo4j` | |
| `NEO4J_PASSWORD` | `test1234` | |
| `BACKEND_BASE_URL` | `http://localhost:8081` | answerIdx → typeName 해석 시에만 사용 |
| `GRAPH_TOOL_TIMEOUT` | `5.0` | Tool 쿼리 타임아웃(초) |
| `GRAPH_TOOL_ENABLED` | `true` | Neo4j Tool On/Off Feature Flag |

### 1.3 Backend 드라이버 설정 클래스

**파일**: `backend/src/main/java/com/vs/meta/common/config/Neo4jDriverConfig.java`

```java
@Bean
public Driver neo4jDriver(
    @Value("${neo4j.uri}") String uri,
    @Value("${neo4j.username}") String username,
    @Value("${neo4j.password}") String password
) {
    Driver driver = GraphDatabase.driver(uri, AuthTokens.basic(username, password));
    driver.verifyConnectivity();  // 기동 시 연결 검증 — 실패 시 예외 throw
    return driver;
}
```

**설계 특징**:
- Spring Data Neo4j (ORM) 미사용 — Native Java Driver API 직접 사용
- `@Node`, `@RelationshipProperties` 엔티티 클래스 없음
- Repository 인터페이스(`Neo4jRepository`) 없음
- 모든 쿼리 결과를 `Map<String, Object>` / `LinkedHashMap`으로 수동 매핑

---

## 2. 그래프 데이터 모델

### 2.1 노드(Node) 타입

#### `LPAClass` — LPA 분류 유형

| 속성명 | 타입 | 설명 |
|:---|:---|:---|
| `name` | String | 유형 식별자 (ex. `"Class1"`, `"자원소진형"`) |
| `school_level` | String | 학교급 (`elementary` / `middle`) |
| `class_num` | Int | 유형 번호 |
| `color` | String | UI 표시용 색상 코드 |
| `description` | String | 유형 설명 텍스트 |

#### `ModerationPath` — 조절 경로 (개입 전략)

| 속성명 | 타입 | 설명 |
|:---|:---|:---|
| `id` | String | 경로 ID |
| `path_type` | String | 경로 유형 |
| `path_color` | String | 색상 코드 |
| `x` | String | 독립변수 |
| `y` | String | 종속변수 |
| `z` | String | 매개/조절변수 |
| `keyword_interp` | String | 해석 키워드 |
| `keyword_strat` | String | 전략 키워드 |
| `interpretation` | String | 전체 해석 텍스트 |
| `strategy` | String | 전략 텍스트 |

#### `MediationPath` — 매개 경로 (지지 전략)

| 속성명 | 타입 | 설명 |
|:---|:---|:---|
| `id` | String | 경로 ID |
| `x` | String | 독립변수 |
| `m` | String | 매개변수 (mediator) |
| `y` | String | 종속변수 |
| `interpretation` | String | 해석 텍스트 |
| `strategy` | String | 전략 텍스트 |

#### `Factor` — 심리/행동 요인

| 속성명 | 타입 | 설명 |
|:---|:---|:---|
| `id` | String | 요인 ID |
| `name` | String | 요인명 (ex. `"자아존중감"`, `"고갈"`) |
| `factor_type` | String | 요인 유형 분류 |
| `need_score_direction` | String | 점수 해석 방향 (높을수록 긍정/부정) |

### 2.2 관계(Relationship) 타입

```
(LPAClass)-[:HAS_MODERATION_PATH]->(ModerationPath)
(LPAClass)-[:HAS_MEDIATION_PATH]->(MediationPath)
(LPAClass)-[r:GROUP_TSCORE]->(Factor)
```

#### `GROUP_TSCORE` 관계 속성

| 속성명 | 타입 | 설명 |
|:---|:---|:---|
| `t_score` | Double | T-점수 |
| `raw_mean` | Double | 원점수 평균 |
| `school_level` | String | 학교급 |

### 2.3 그래프 구조 다이어그램

```
      ┌─────────────────────┐
      │      LPAClass       │
      │  name, school_level │
      │  class_num, color   │
      │  description        │
      └──────┬──────┬───────┘
             │      │
   [:HAS_MODERATION_PATH]  [:HAS_MEDIATION_PATH]
             │      │
   ┌─────────▼──┐  ┌▼──────────────┐
   │Moderation  │  │  Mediation    │
   │   Path     │  │    Path       │
   │x, y, z    │  │x, m(mediator) │
   │interp.    │  │y, interp.     │
   │strategy   │  │strategy       │
   └────────────┘  └───────────────┘
             │
   [:GROUP_TSCORE {t_score, raw_mean, school_level}]
             │
      ┌──────▼──────┐
      │   Factor    │
      │ name, type  │
      │ direction   │
      └─────────────┘
```

---

## 3. Cypher 쿼리 전체 목록

Backend(`DgnssGraphService.java`)와 Agent(`graph_context_service.py`) 양쪽에서 동일한 Cypher를 사용합니다.

### 쿼리 1: LPAClass 정보 조회

```cypher
MATCH (c:LPAClass {name: $className})
WHERE $schoolLevel = '' OR c.school_level = $schoolLevel
RETURN c.name        AS className,
       c.school_level AS schoolLevel,
       c.class_num   AS classNum,
       c.color       AS color,
       c.description AS description
LIMIT 1
```

- **파라미터**: `className` (String), `schoolLevel` (String, 빈 문자열이면 전체)
- **반환**: LPAClass 노드 단일 레코드

### 쿼리 2: ModerationPath 조회

```cypher
MATCH (c:LPAClass {name: $className})-[:HAS_MODERATION_PATH]->(m:ModerationPath)
WHERE $schoolLevel = '' OR c.school_level = $schoolLevel
RETURN m.id             AS id,
       m.path_type      AS pathType,
       m.path_color     AS pathColor,
       m.x              AS x,
       m.z              AS z,
       m.y              AS y,
       m.keyword_interp AS keywordInterp,
       m.keyword_strat  AS keywordStrat,
       m.interpretation AS interpretation,
       m.strategy       AS strategy
ORDER BY m.id
LIMIT $limit
```

- **파라미터**: `className`, `schoolLevel`, `limit` (기본 20, 최대 100)
- **반환**: ModerationPath 목록 (정렬: `m.id` ASC)

### 쿼리 3: MediationPath 조회

```cypher
MATCH (c:LPAClass {name: $className})-[:HAS_MEDIATION_PATH]->(m:MediationPath)
WHERE $schoolLevel = '' OR c.school_level = $schoolLevel
RETURN m.id             AS id,
       m.x              AS x,
       m.m              AS mediator,
       m.y              AS y,
       m.interpretation AS interpretation,
       m.strategy       AS strategy
ORDER BY m.id
LIMIT $limit
```

- **파라미터**: `className`, `schoolLevel`, `limit`
- **반환**: MediationPath 목록

### 쿼리 4: Factor T-Score 조회

```cypher
MATCH (c:LPAClass {name: $className})-[r:GROUP_TSCORE]->(f:Factor)
WHERE $schoolLevel = '' OR c.school_level = $schoolLevel
RETURN f.id                   AS factorId,
       f.name                 AS factorName,
       f.factor_type          AS factorType,
       f.need_score_direction AS needScoreDirection,
       r.t_score              AS tScore,
       r.raw_mean             AS rawMean,
       r.school_level         AS schoolLevel
ORDER BY f.name
```

- **파라미터**: `className`, `schoolLevel`
- **반환**: Factor + 관계 속성 전체 (limit 없음)

---

## 4. 서비스 레이어 구조

### 4.1 DgnssGraphService (Backend)

**파일**: `backend/src/main/java/com/vs/meta/api/dgnss/service/DgnssGraphService.java`

```
selectModerationPathsByClass(className, schoolLevel, limit)
  → {className, schoolLevel, count, moderationPaths[]}

selectRecommendationByType(schoolLevel, typeName, limit)
  → {classInfo, moderationPathCount, mediationPathCount, factorScoreCount,
     moderationPaths[], mediationPaths[], factorScores[]}

selectRecommendationByAnswerIdx(answerIdx, limit)
  → dgnssMapper.selectLpaResultByAnswerIdx() [MySQL]
  → {answerIdx, lpa{typeName, schoolLevel, confidence, classId, status}, recommendationCount, moderationPaths[]}
```

### 4.2 DgnssLpaService (Backend — LPA 분류)

**파일**: `backend/src/main/java/com/vs/meta/api/dgnss/service/DgnssLpaService.java`

**알고리즘**: Gaussian Naive Bayes
```
1. MySQL: 38개 요인 T-점수 로드 (selectLpaFactorScores)
2. lpa-model-params.json: 학교급별 모델 파라미터 선택
3. 로그-사후확률: log P(class|x) = log P(class) + Σ log N(xi; μi, σi²)
4. Softmax 정규화 → 최고 확률 클래스 선택
5. MySQL: 분류 결과 저장 (upsertDgnssLpaResult)
```

**LPA 유형 정의**:

| 학교급 | 클래스 ID | 유형명 |
|:---|:---|:---|
| `elementary` | `Class1` | 자원소진형 |
| `elementary` | `Class2` | 안전 균형형 |
| `elementary` | `Class3` | 몰입자원 풍부형 |
| `middle` | `Class4` | 냉소적 무기력형 |
| `middle` | `Class5` | 정서조절 취약형 |
| `middle` | `Class6` | 자기주도 몰입형 |

**학교급 코드 매핑**:

| `SCH_GRADE` 코드 | 저장 학교급 | 모델 학교급 |
|:---|:---|:---|
| `CMM13001` | `elementary` | `elementary` |
| `CMM13002` | `middle` | `middle` |
| `CMM13003` | `high` | `middle` (동일 모델 공유) |

**38개 입력 피처**:

| 영역 | 피처명 | Section ID |
|:---|:---|:---|
| 자기이해 | 자아존중감 | `10-22-01-01-01-0` |
| | 자기효능감 | `10-22-01-01-02-0` |
| | 성장마인드셋 | `10-22-01-01-03-0` |
| 정서조절 | 자기정서인식 | `10-22-01-02-01-0` |
| | 자기정서조절 | `10-22-01-02-02-0` |
| | 타인정서인식 | `10-22-01-02-03-0` |
| | 타인공감능력 | `10-22-01-02-04-0` |
| 자기조절 | 계획능력 | `10-22-02-01-01-0` |
| | 점검능력 | `10-22-02-01-02-0` |
| | 조절능력 | `10-22-02-01-03-0` |
| 학습전략 | 공부환경 | `10-22-02-02-01-0` |
| | 시간관리 | `10-22-02-02-02-0` |
| | 수업태도 | `10-22-02-02-03-0` |
| | 노트하기 | `10-22-02-02-04-0` |
| | 시험준비 | `10-22-02-02-05-0` |
| 사회적지지 | 부모 의사소통 | `10-22-02-03-01-0` |
| | 부모 학업지지 | `10-22-02-03-02-0` |
| | 친구 정서지지 | `10-22-02-03-03-0` |
| | 교사 정서지지 | `10-22-02-03-04-0` |
| 학업적 웰빙 | 활기 | `10-22-04-01-01-0` |
| | 몰두 | `10-22-04-01-02-0` |
| | 의미감 | `10-22-04-01-03-0` |
| | 자율성 | `10-22-04-02-01-0` |
| | 유능성 | `10-22-04-02-02-0` |
| | 관계성 | `10-22-04-02-03-0` |
| 학업 스트레스 | 성적부담 | `10-22-03-01-01-0` |
| | 공부부담 | `10-22-03-01-02-0` |
| | 수업부담 | `10-22-03-01-03-0` |
| | 부모 성적압력 | `10-22-03-02-01-0` |
| | 부모 공부부담 | `10-22-03-02-02-0` |
| | 친구 공부비교 | `10-22-03-02-03-0` |
| | 교사 성적압력 | `10-22-03-02-04-0` |
| | 교사 수업부담 | `10-22-03-02-05-0` |
| | 스마트폰 의존 | `10-22-03-03-01-0` |
| | 게임 과몰입 | `10-22-03-03-02-0` |
| 번아웃 | 고갈 | `10-22-05-01-01-0` |
| | 무능감 | `10-22-05-01-02-0` |
| | 반감-냉소 | `10-22-05-01-03-0` |

---

## 5. Backend REST API 엔드포인트

**컨트롤러**: `backend/src/main/java/com/vs/meta/api/dgnss/controller/DgnssController.java`  
**보안**: `/api/dgnss/graph/**` 경로 전체 `permitAll` (인증 불필요)

> **Agent에서의 사용 범위**: `answerIdx` 기반 요청에서 `by-answer` 엔드포인트로 typeName 해석 시에만 경유.  
> 이후 실제 그래프 데이터는 Neo4j Bolt 직접 연결로 처리.

### GET `/api/dgnss/graph/recommendation/by-answer/{answerIdx}`

```
Path Variables:
  answerIdx (required, > 0)

Query Params:
  limit (optional, default: 5, max: 100)
```

**처리 흐름**: MySQL → LPA 결과 조회 → typeName/schoolLevel 추출 → Neo4j ModerationPath 조회  
**Agent 활용**: `resultData.lpa.typeName` + `resultData.lpa.schoolLevel` 추출 후 Neo4j 직접 쿼리로 전체 데이터 재조회

```json
{
  "success": true,
  "resultCode": 200,
  "resultData": {
    "answerIdx": 12345,
    "lpa": {
      "typeName": "자원소진형",
      "schoolLevel": "elementary",
      "classId": "Class1",
      "confidence": 87.42,
      "status": "COMPLETED"
    },
    "recommendationCount": 5,
    "moderationPaths": [...]
  }
}
```

### GET `/api/dgnss/graph/recommendation/by-type`

```
Query Params:
  schoolLevel (required), typeName (required), limit (optional, default: 20, max: 100)
```

**Agent에서 직접 사용하지 않음** — Neo4j Bolt 직접 쿼리로 대체.

```json
{
  "success": true,
  "resultCode": 200,
  "resultData": {
    "classInfo": { "className": "...", "schoolLevel": "...", "classNum": 1, "color": "...", "description": "..." },
    "moderationPathCount": 5,
    "mediationPathCount": 3,
    "factorScoreCount": 38,
    "moderationPaths": [...],
    "mediationPaths": [...],
    "factorScores": [...]
  }
}
```

### GET `/api/dgnss/graph/classes/{className}/moderation-paths`

**Agent에서 직접 사용하지 않음** — Neo4j Bolt 직접 쿼리로 대체.

---

## 6. Frontend - Backend - Agent 데이터 연동 심층 분석 (Dual-Usage Architecture)

본 프로젝트는 Neo4j 지식 그래프를 두 가지 상이한 패턴(Dual-Usage)으로 활용합니다. 프론트엔드는 시각적 컴포넌트 렌더링을 위해 Backend REST API를 호출하는 반면, AI Agent는 상담 대화 생성을 위해 Tool Calling을 통해 Neo4j를 직접 쿼리합니다.

### 6.1 Frontend의 컨텍스트 생성 로직 (`contextBuilder.ts`)

프론트엔드의 `buildRAGContext` 함수는 Agent로 보낼 `context_data`를 생성합니다.
- `context_data`는 `{ mode, context }` 형태로 전송됩니다.
- `context` 문자열 안에는 학생의 **실제 T-점수 (38개 요인)**, **4단계 진단 결과**, 그리고 **예측된 유형명(`predictedType`, ex: "자원소진형")** 등이 마크다운 텍스트 형태로 모두 포함되어 있습니다.
- **중요**: `answerIdx`나 구조화된 `typeName` 객체는 `context_data`에 직접 포함되어 Agent로 전송되지 않습니다. 

### 6.2 Frontend의 직접 Neo4j 호출 (`useCoachingStrategy.ts`)

프론트엔드는 AI Room 내부에서 "코칭 전략 모달" 등을 띄우기 위해 Agent를 거치지 않고 Backend를 직접 호출합니다.
- 학생 대시보드 API 호출 시 `graphYn='Y'` 파라미터를 추가하여 Backend의 `/api/dgnss/st/analysis`를 호출합니다.
- Backend(`DgnssGraphService`)는 Neo4j를 조회하여 조절 경로(Moderation Path) 등의 전략 데이터를 프론트엔드로 반환하여 모달 UI에 렌더링합니다.

### 6.3 Agent Tool Calling의 역할 및 데이터 융합

Agent는 프론트엔드가 주입한 방대한 `ragContext` 텍스트에서 학생의 **유형명(`predictedType`)**을 인식합니다.
LLM이 상담 전략을 수립하거나 깊이 있는 분석이 필요할 때 다음과 같이 동작합니다:
1. LLM은 자율적으로 Tool(`get_moderation_paths`, `get_factor_scores` 등)을 호출하며, 파라미터로 텍스트에서 파악한 `className="자원소진형"`을 전달합니다.
2. Tool은 Neo4j에서 **해당 유형의 조절 경로(전략)** 및 **집단 평균 T-점수**를 가져옵니다.
3. LLM은 프론트엔드 컨텍스트에 있는 **학생의 실제 T-점수**와 Tool에서 가져온 **집단의 평균 T-점수 및 전략**을 결합(비교/대조)하여 고도화된 입체적 추론을 수행합니다.

```
[교사 질문] POST /chat { text, session_id, context_data: { mode, context: "...유형: 자원소진형... T-점수..." } }
      │
      ▼
[Agent Service] 
      │ (context_data의 텍스트가 System Prompt의 일부로 주입됨)
      ▼
[LLM 추론 엔진 (Gemini 2.5 Flash)]
      │
      ├─ "학생의 T-점수와 유형의 전략을 결합해보자" (지식 그래프 필요성 판단)
      ▼
[Tool Calling Request: get_moderation_paths(className="자원소진형")]
      │
      ▼
[Neo4jTools (agent/app/tools/neo4j_tools.py)]
      │
      ├─ Neo4j Bolt 직접 연결 → Cypher 쿼리 실행
      │
      ▼
[Tool Response (JSON 결과 반환 - 조절 변수, 해석, 전략 등)]
      │
      ▼
[LLM 응답 생성 (학생의 실제 데이터 + Neo4j 집단 전략의 융합)]
      │
      ▼
[교사에게 응답]
```

---

## 7. Agent Neo4j Tool 연동 구현

### 7.1 드라이버 생명주기 및 Tool 관리

**파일**: `agent/app/tools/neo4j_tools.py`

```python
from neo4j import AsyncGraphDatabase, AsyncDriver

class GraphContextService:
    def __init__(self):
        self._driver: AsyncDriver | None = None  # Lazy init

    async def _get_driver(self) -> AsyncDriver:
        if self._driver is None:
            self._driver = AsyncGraphDatabase.driver(
                NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD)
            )
        return self._driver

    async def close(self):
        """main.py lifespan 종료 시 호출."""
        if self._driver:
            await self._driver.close()
            self._driver = None
```

### 7.2 Cypher 실행 패턴 (Python Async)

```python
async with driver.session() as session:
    # 단일 레코드
    result = await session.run(query, className=name, schoolLevel=level)
    record = await result.single()       # Record | None
    data = dict(record) if record else None

    # 복수 레코드
    result = await session.run(query, className=name, schoolLevel=level, limit=20)
    rows = await result.data()           # list[dict] — 키는 RETURN 절 AS 별칭
```

### 7.3 확장 가능한 쿼리 패턴

| 목적 | 쿼리 패턴 |
|:---|:---|
| 강점 요인 파악 | `GROUP_TSCORE`에서 `r.t_score > 50` 필터 |
| 취약 요인 기반 전략 추출 | `r.t_score < 45` + 연결된 `ModerationPath.strategy` |
| 학교급별 유형 비교 | `school_level` 파라미터로 분기 |
| Factor 영역별 평균 | `f.factor_type`으로 그룹핑 + `avg(r.t_score)` |

### 7.4 모델 파라미터 파일

```
backend/src/main/resources/data/lpa-model-params.json
```
- 버전: `lpa-bayes-v2` (프로필 날짜: 2026-03-23)
- 구조: `{ feature_order[], elementary: { means, variances, priors }, middle: { means, variances, priors } }`

---

## 8. 주의 사항

1. **Python Driver 비동기 전용**: `AsyncGraphDatabase` 사용. 동기 `GraphDatabase`는 FastAPI async 컨텍스트에서 이벤트 루프 블로킹 발생.

2. **학교급 필터 옵셔널**: `$schoolLevel = ''` 조건으로 전체 조회 가능. 동명 LPAClass가 여러 학교급에 존재할 경우 `LIMIT 1`로 인해 임의 레코드 반환 가능성 있음.

3. **`high` 학교급 미지원**: 고등학교(`CMM13003`)는 분류 모델이 없어 `middle` 모델로 처리. Neo4j에 `school_level: high` LPAClass 노드 없음.
   > **TODO**: Agent 코드(`agent/app/tools/neo4j_tools.py` 등)에서 `context_data.context`의 `schoolLevel` 값이 `"high"`인 경우, Neo4j 쿼리 파라미터로 `"middle"`을 전달하는 매핑 로직을 반드시 구현해야 함. Backend의 `DgnssLpaService`에서 이미 동일 정책(`SCH_GRADE` 코드 매핑)으로 구현되어 있으므로 참고.

4. **PII 마스킹**: Neo4j 데이터 자체에 PII 없음. `context_data`의 학생 정보는 `pii_filter.mask_pii_data()`로 마스킹 후 LLM 전달.

5. **answerIdx 흐름의 Backend 의존**: `answerIdx → typeName` 해석은 MySQL 필요 → Backend REST 경유. Backend 다운 시 이 경로만 영향. `typeName` 직접 전달 시 Neo4j만 살아있으면 정상 동작.

6. **Backend 응답 Envelope**: 실제 데이터 키는 `resultData` (`CustomBody` 레코드 필드). `data` 키는 존재하지 않음.
