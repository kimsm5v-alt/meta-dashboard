> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 6bcef856

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 4개


### 정상 범위 (NONE)


**`main.py`** (other)

- 평균 복잡도: **0.159**

- 최대 복잡도: 0.471

- 청크 수: 9개

- 평균 사용처: 5.3곳


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 Meta Dashboard AI Agent의 Neo4j 그래프 데이터베이스 연동 아키텍처를 리팩토링하고, 관련 문서를 실제 구현과 동기화한 것입니다.

- **목적**: Neo4j 연결 관리 방식을 인스턴스 기반(`GraphContextService`)에서 클래스 메서드 기반 싱글톤(`Neo4jConnectionManager`)으로 전환하고, Cypher 쿼리를 단순화하여 LLM Tool 함수에 최적화. 또한 사용하지 않는 의존성 제거 및 불필요한 import 정리.
- **도메인**: 인프라 / 데이터베이스 연동 (Neo4j Graph DB), Agent Tool 아키텍처
- **변경 방향**:
  - 연결 관리: 인스턴스 기반 -> 클래스 메서드 기반 싱글톤 (전역에서 단일 드라이버 인스턴스 공유)
  - 쿼리 패턴: 조건절(`WHERE $schoolLevel = '' OR ...`) 제거, 정확한 매칭(`{className: $className, schoolLevel: $schoolLevel}`)으로 단순화
  - 공통 실행기 도입: `_execute_query()`로 타임아웃 및 예외 처리 중앙화
  - 의존성 정리: `sqlalchemy`, `psycopg2-binary`, `streamlit`, `langchain-openai` 제거

## [GOOD] 잘된 점

1. **공통 쿼리 실행기(`_execute_query`) 도입**: 타임아웃 처리와 4가지 Neo4j 예외(`ServiceUnavailable`, `AuthError`, `ClientError`, 일반 `Exception`)에 대한 세분화된 Graceful Degradation을 중앙에서 처리하여, 각 Tool 함수의 중복 코드를 제거하고 일관된 에러 응답 형식을 보장합니다. 특히 `asyncio.wait_for`를 활용한 타임아웃 처리는 비동기 환경에서 블로킹을 방지하는 적절한 설계입니다.

2. **클래스 메서드 기반 싱글톤 패턴**: `Neo4jConnectionManager`를 `@classmethod` 기반으로 설계하여 `main.py`의 `lifespan`에서 명시적으로 초기화/종료를 제어할 수 있게 했습니다. `_driver = None` 클래스 변수 하나로 상태를 관리하므로 복잡한 인스턴스 관리가 필요 없고, `main.py`의 `lifespan` startup/shutdown에서 생명주기를 명확히 제어할 수 있습니다.

3. **불필요한 의존성 정리**: `sqlalchemy`, `psycopg2-binary`, `streamlit`, `langchain-openai` 등 Neo4j 전환 후 사용하지 않는 패키지를 `requirements.txt`에서 제거하여 배포 이미지 크기와 의존성 복잡도를 줄였습니다. 특히 `streamlit`은 Agent 서비스와 무관한 프론트엔드 도구이므로 제거가 적절합니다.

## 변경사항 요약

- `agent/app/tools/neo4j_tools.py`: `GraphContextService` -> `Neo4jConnectionManager` 리팩토링, `_execute_query()` 공통 실행기 도입, Cypher 쿼리 단순화
- `agent/main.py`: 불필요한 `Depends` import 제거
- `agent/requirements.txt`: 미사용 패키지 4종 제거
- `agent/docs/NEO4J_ANALYSIS.md`, `NEO4J_TOOL_IMPLEMENTATION_PLAN.md`: 실제 코드 변경사항과 문서 동기화

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `_execute_query()`에서 `asyncio.wait_for` 적용 범위가 불완전함**

- **위치**: `agent/app/tools/neo4j_tools.py`, 라인 47-53
- **기존 코드**:
```python
async with driver.session() as session:
    result = await asyncio.wait_for(
        session.run(query, parameters),
        timeout=timeout
    )
    records = await asyncio.wait_for(
        result.data(),
        timeout=timeout
    )
    return records
```
- **문제점**: `session.run()`과 `result.data()` 각각에 개별 타임아웃을 적용했지만, `async with driver.session()` 컨텍스트 매니저의 진입 자체와 `session` 객체 생성에도 시간이 소요될 수 있습니다. 특히 Neo4j 서버가 불안정한 상황에서 `session()` 생성이 블로킹되면 타임아웃이 적용되지 않습니다. 또한 `asyncio.wait_for`가 두 번 중첩되어 첫 번째 호출이 타임아웃되면 `asyncio.TimeoutError`가 발생하지만, 두 번째 호출의 타임아웃은 첫 번째 호출이 성공한 후에만 의미가 있어 실제로는 전체 실행 시간이 `timeout * 2`까지 허용됩니다. 문서(`NEO4J_ANALYSIS.md` 7.2절)에는 내부 코루틴 `_run()`으로 전체를 감싸는 패턴이 명시되어 있으나 실제 구현과 차이가 있습니다.
- **해결 방안 (수정 코드)**:
```python
async def _execute_query(query: str, parameters: dict) -> List[Dict[str, Any]]:
    driver = Neo4jConnectionManager.get_driver()
    if driver is None:
        logger.error("Neo4j 드라이버가 초기화되지 않아 쿼리를 수행할 수 없습니다.")
        return [{"error": "Database connection failed"}]
    
    timeout = float(os.getenv("GRAPH_TOOL_TIMEOUT", "5.0"))
    
    async def _run():
        async with driver.session() as session:
            result = await session.run(query, parameters)
            return await result.data()
    
    try:
        return await asyncio.wait_for(_run(), timeout=timeout)
    except asyncio.TimeoutError:
        logger.error(f"Neo4j 쿼리 타임아웃 초과 ({timeout}s)")
        return [{"error": "Query timeout exceeded"}]
    except neo4j_exceptions.ServiceUnavailable as e:
        logger.error(f"Neo4j 서비스를 사용할 수 없음: {e}")
        return [{"error": "Database service unavailable"}]
    except neo4j_exceptions.AuthError as e:
        logger.error(f"Neo4j 인증 실패: {e}")
        return [{"error": "Database authentication failed"}]
    except neo4j_exceptions.ClientError as e:
        logger.error(f"Neo4j 클라이언트 오류 (Cypher 문법 등): {e}")
        return [{"error": f"Database client error: {str(e)}"}]
    except Exception as e:
        logger.error(f"Neo4j 쿼리 실행 중 알 수 없는 오류 발생: {e}")
        return [{"error": f"Query execution failed: {str(e)}"}]
```
  - **이유**: 내부 코루틴 `_run()` 하나로 `session()` 생성부터 `result.data()`까지 전체를 감싸면, 전체 실행 시간이 `timeout`을 초과할 때만 타임아웃이 발생하여 예측 가능한 동작을 보장합니다. 문서와 실제 구현을 일치시키는 효과도 있습니다.

**2. `get_driver()` 초기화 실패 시 로그만 남기고 `None` 반환 — 호출부에서 재시도 불가**

- **위치**: `agent/app/tools/neo4j_tools.py`, 라인 18-24
- **기존 코드**:
```python
@classmethod
def get_driver(cls):
    if cls._driver is None:
        uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        user = os.getenv("NEO4J_USERNAME", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "test1234")
        try:
            cls._driver = AsyncGraphDatabase.driver(uri, auth=(user, password))
        except Exception as e:
            logger.error(f"Neo4j 드라이버 초기화 실패: {e}")
    return cls._driver
```
- **문제점**: 초기화 실패 시 `cls._driver`는 `None`으로 남고, 로그만 출력됩니다. 이후 `_execute_query()`에서 `driver is None` 체크 후 `[{"error": "Database connection failed"}]`를 반환하지만, `lifespan` startup에서 `get_driver()`를 호출해도 예외가 발생하지 않으므로 서비스는 정상 기동된 것으로 간주됩니다. 실제로는 모든 Tool 호출이 실패하는 무음성 실패(silent failure) 상황이 발생합니다.
- **해결 방안 (수정 코드)**:
```python
@classmethod
def get_driver(cls):
    if cls._driver is None:
        uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        user = os.getenv("NEO4J_USERNAME", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "test1234")
        try:
            cls._driver = AsyncGraphDatabase.driver(uri, auth=(user, password))
        except Exception as e:
            logger.error(f"Neo4j 드라이버 초기화 실패: {e}")
            raise  # 예외를 전파하여 lifespan startup에서 감지 가능하도록
    return cls._driver
```
  - **이유**: `lifespan` startup에서 예외를 전파하면 FastAPI가 서비스 기동을 중단하거나, 헬스체크에서 실패를 감지할 수 있습니다. 최소한 `_init_failed` 같은 클래스 플래그를 두어 `_execute_query()`에서 더 명확한 에러 메시지를 반환하는 방법도 고려할 수 있습니다.

### Medium (개선 권장)

**1. `requirements.txt`에 버전 미명시 패키지 다수 존재**

- **위치**: `agent/requirements.txt`
- **내용**: `fastapi`, `uvicorn`, `gunicorn`, `litellm`, `python-dotenv`, `pydantic`, `tiktoken`, `requests`, `pytest` — 모두 버전 미명시
- **제안**: `langchain>=0.3.0`, `neo4j>=5.0.0,<6.0.0`처럼 주요 패키지에 대해 상/하한 버전을 명시하는 것이 좋습니다. 특히 `litellm`은 자주 변경되는 라이브러리이므로 최소 버전을 지정하는 것이 재현 가능한 빌드에 도움이 됩니다. `pydantic`은 FastAPI와 함께 자주 업데이트되므로 `pydantic>=2.0.0` 정도의 하한선을 권장합니다.

**2. Tool 함수 docstring에 반환값 구조 명시 필요**

- **위치**: `agent/app/tools/neo4j_tools.py`, `get_moderation_paths()`, `get_mediation_paths()`, `get_factor_scores()`
- **내용**: 각 Tool 함수의 docstring에는 파라미터 설명만 있고 반환값 구조에 대한 설명이 누락되어 있습니다. LLM이 Tool을 선택할 때 docstring을 참조하므로, 반환값의 키와 의미를 명시하면 Tool Calling 정확도가 향상됩니다.
- **예시** (`get_moderation_paths`의 docstring 개선):
```python
@tool
async def get_moderation_paths(className: str, schoolLevel: str) -> List[Dict[str, Any]]:
    """
    해당 유형(className)의 성취를 위한 조절 효과 경로(HAS_MODERATION_PATH) 전략을 조회합니다.
    Args:
        className: 유형명 (예: "자원소진형")
        schoolLevel: 학교급 (예: "E", "M", "H")
    Returns:
        각 항목은 다음 키를 포함하는 딕셔너리입니다:
        - pathName: 경로명 (str)
        - description: 경로 설명 (str)
        - priority: 우선순위 (int, 낮을수록 우선)
    """
```

---

## 주요 파일 분석

### `agent/app/tools/neo4j_tools.py`

**변경 내용:**
`GraphContextService` 인스턴스 클래스를 `Neo4jConnectionManager` 클래스 메서드 기반 싱글톤으로 전환하고, `_execute_query()` 공통 실행기 도입, Cypher 쿼리 단순화.

**개선 제안:**
1. (High) `asyncio.wait_for` 적용 범위를 내부 코루틴 전체로 확장
2. (High) `get_driver()` 초기화 실패 시 예외 전파 또는 상태 플래그 도입
3. (Medium) Tool 함수 docstring에 반환값 구조 명시

### `agent/requirements.txt`

**변경 내용:**
`sqlalchemy`, `psycopg2-binary`, `streamlit`, `langchain-openai` 4종 제거.

**개선 제안:**
1. (Medium) 주요 패키지에 버전 범위 명시 권장

### `agent/main.py`

**변경 내용:**
`Depends` import 제거 (1줄).

**개선 제안:**
없음. 단순하고 명확한 변경입니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**
전반적으로 아키텍처 개선 방향(공통 실행기 도입, 싱글톤 전환, 의존성 정리)은 적절하며 코드 품질도 양호합니다. Cypher 쿼리를 단순화하고 조건절을 제거한 점은 LLM Tool 함수에 최적화된 결정입니다. 다만 `_execute_query()`의 `asyncio.wait_for` 적용 범위가 불완전하여 실제 타임아웃 동작이 문서와 다르고, `get_driver()` 초기화 실패 시 무음성 실패(silent failure)가 발생할 수 있는 점이 우려됩니다. 위 2가지 High 이슈만 수정되면 바로 승인 가능한 수준입니다.