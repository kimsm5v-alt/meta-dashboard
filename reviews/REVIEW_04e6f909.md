> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 04e6f909

## 코드 복잡도 분석

**분석된 파일**: 2개 / 변경된 파일: 2개


### 정상 범위 (NONE)


**`agent_service.py`** (other)

- 평균 복잡도: **0.233**

- 최대 복잡도: 0.464

- 청크 수: 6개

- 평균 사용처: 9.3곳


**권장사항:**

- 복잡도 정상 범위


**`neo4j_tools.py`** (other)

- 평균 복잡도: **0.005**

- 최대 복잡도: 0.010

- 청크 수: 8개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 AI 에이전트 서비스의 **스트리밍 모드(`run_agent_stream`)와 비스트리밍 모드(`run_agent`)의 예외 처리 및 사용자 경험을 개선**하기 위한 것입니다.

- **목적**: 스트리밍 응답에서 content가 빈 값(null/empty)으로 도착할 때의 fallback 메시지 처리, 예외 발생 시에도 대화 히스토리에 사용자 메시지와 AI 응답을 기록하도록 보강, 그리고 Neo4j 쿼리 실행기의 타임아웃 처리 구조 단순화
- **도메인**: 비즈니스 로직 (AI Agent 서비스, 데이터베이스 연결)
- **변경 방향**: 기존에는 스트리밍 중 예외 발생 시 `yield`로만 에러 메시지를 전달하고 히스토리 저장이 누락되었으나, 이제 예외 상황에서도 `history.add_user_message()`와 `history.add_ai_message()`를 호출하여 세션 일관성을 유지. 또한 Neo4j 쿼리 실행기의 중첩 `asyncio.wait_for` 호출을 단일화하여 코드 간결화

## [GOOD] 잘된 점

1. **스트리밍 예외 처리의 일관성 확보**: `run_agent_stream`의 `except` 블록에서 `history.add_user_message(text)`와 `history.add_ai_message(fallback_message)`를 추가하여, 예외 발생 시에도 대화 히스토리가 누락되지 않도록 개선했습니다. 이는 사용자가 재시도할 때 이전 시도가 컨텍스트에 반영되도록 보장합니다.

2. **최대 반복 횟수 초과 시에도 히스토리 저장**: `iterations >= self.max_iterations` 조건에서도 동일하게 히스토리를 저장하도록 변경하여, 비정상 종료 상황에서도 세션 상태가 유실되지 않습니다.

3. **Neo4j 쿼리 실행기 리팩토링**: 중첩된 `asyncio.wait_for` 호출을 내부 함수 `_run()`으로 추출하고 단일 `wait_for`로 통합하여 코드 가독성을 높였습니다. 또한 `Optional` 타입 임포트를 제거하여 불필요한 의존성을 정리했습니다.

## 변경사항 요약

- `agent_service.py`: `_build_messages`에서 context_data 처리 로직 개선, `run_agent`에서 content null 체크 추가, `run_agent_stream`에서 예외/최대반복 시 히스토리 저장 및 fallback 메시지 처리 보강
- `neo4j_tools.py`: `_execute_query`의 타임아웃 처리 구조를 내부 함수로 단순화, 불필요한 `Optional` 타입 임포트 제거

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

없음

### Medium (개선 권장)

**1. `_build_messages` 실패 시 예외 처리 부재**

- **위치**: `agent/app/services/agent_service.py`, 라인 175-176 (`run_agent_stream` 메서드 시작부)
- **기존 코드**:
```python
        messages, history = self._build_messages(text, session_id, context_data)
        iterations = 0
        final_content = ""

        fallback_message = "응답을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요."
        try:
            while iterations < self.max_iterations:
```
- **문제점**: `_build_messages` 호출이 `try` 블록 밖에 위치하고 있습니다. `_build_messages` 내부에서 `mask_pii_data`나 `get_session_history` 호출 중 예외가 발생하면, `try-except` 블록이 이를 포착하지 못하고 예외가 그대로 상위 호출자로 전파됩니다. 사용자에게는 아무런 응답도 반환되지 않습니다.
- **해결 방안**: `_build_messages` 호출을 `try` 블록 내부로 이동하거나, 별도의 `try-except`로 감싸서 fallback 메시지를 생성할 수 있도록 개선을 검토하세요.

**2. `_build_messages`의 `context_str` 처리 로직에서 falsy 값 처리 모호성**

- **위치**: `agent/app/services/agent_service.py`, 라인 44-46
- **기존 코드**:
```python
        if masked_context:
            context_str = masked_context.get("context") or str(masked_context)
        else:
            context_str = "No additional context provided."
```
- **문제점**: `masked_context.get("context")`가 `None`이나 빈 문자열을 반환하면 `str(masked_context)`로 전체 dict가 문자열 변환되어 system prompt에 포함됩니다. `masked_context`에 `"context"` 키가 없거나 값이 falsy일 때, 의도치 않게 전체 PII 마스킹된 데이터가 노출될 수 있습니다.
- **해결 방안**: `masked_context.get("context")`의 결과가 유효한 문자열인지 명시적으로 확인하고, 그렇지 않을 경우 "No additional context provided."를 사용하는 것이 더 안전합니다.

**3. `neo4j_tools.py`의 `_execute_query`에서 `_run` 내부 함수 중복 정의**

- **위치**: `agent/app/tools/neo4j_tools.py`, 라인 50-53
- **기존 코드**:
```python
    async def _run():
        async with driver.session() as session:
            result = await session.run(query, parameters)
            return await result.data()

    try:
        return await asyncio.wait_for(_run(), timeout=timeout)
```
- **문제점**: `_run` 함수가 `_execute_query`가 호출될 때마다 새로 정의됩니다. 성능에 큰 영향을 주지는 않지만, 매 호출마다 함수 객체가 생성되어 메모리 할당이 발생합니다.
- **해결 방안**: `_run`을 모듈 레벨의 private 함수로 추출하거나, `async with` 블록을 직접 `try` 블록 내에 배치하는 방식도 고려할 수 있습니다. 다만 현재 구조도 충분히 가독성이 좋으므로 필수 변경 사항은 아닙니다.

---

## 주요 파일 분석

### agent/app/services/agent_service.py

**변경 내용:**
- `_build_messages`: `masked_context`가 있을 때 `masked_context.get("context")`를 우선 사용하고, 없으면 `str(masked_context)`로 fallback
- `run_agent`: `response_message.content`가 None일 때 "응답을 생성하지 못했습니다."로 fallback 처리
- `run_agent_stream`: 
  - `content_buffer`가 비어있을 때 `fallback_message` 사용
  - 최대 반복 횟수 초과 시 `history.add_user_message()`와 `history.add_ai_message()` 호출 추가
  - 예외 발생 시 `history.add_user_message()`와 `history.add_ai_message(fallback_message)` 호출 추가

**개선 제안:**
1. `_build_messages` 실패 시 예외 처리 부재 (Medium)
2. `context_str` 처리 로직에서 falsy 값 처리 명확화 (Medium)

### agent/app/tools/neo4j_tools.py

**변경 내용:**
- 중첩된 `asyncio.wait_for` 호출을 내부 함수 `_run()`으로 추출하고 단일 `wait_for`로 통합
- 불필요한 `Optional` 타입 임포트 제거

**개선 제안:**
1. `_run` 내부 함수를 모듈 레벨로 추출하거나 인라인화 검토 (Medium - 선택적)

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [x] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [ ] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

이 커밋은 전반적으로 안정성과 사용자 경험을 개선하는 방향성 있는 변경입니다. 특히 스트리밍 모드에서 예외 발생 시에도 히스토리를 보존하도록 한 점(`history.add_user_message` + `history.add_ai_message`), content가 null일 때 fallback 메시지를 제공하는 처리(`content_buffer or fallback_message`), 그리고 `run_agent`에서도 동일한 fallback 로직(`response_message.content or "응답을 생성하지 못했습니다."`)을 적용한 점이 돋보입니다.

Neo4j 쿼리 실행기의 리팩토링도 적절합니다. 기존의 중첩된 `asyncio.wait_for` 구조는 불필요하게 복잡했으며, 내부 함수 `_run()`으로 추출하고 단일 `wait_for`로 통합한 방식이 더 명확합니다.

지적된 Medium 수준의 이슈들은 현재 서비스 동작에 치명적이지 않으며, 향후 리팩토링 시 고려하면 충분한 수준입니다. `_build_messages` 실패 시의 예외 전파 문제는 현재 구조에서 실제 `NameError` 가능성은 낮지만(`_build_messages` 호출이 `try` 블록 밖에 있지만, `history` 변수 할당 자체는 `try` 진입 전에 완료되므로), 더 견고한 서비스를 위해 검토를 권장합니다.

**승인** 수준의 품질을 갖추고 있습니다.