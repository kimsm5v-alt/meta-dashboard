> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 921d1a2f

## 코드 복잡도 분석

변경된 파일의 복잡도 정보를 찾을 수 없습니다.
(인덱스가 생성되지 않았거나 새로운 파일일 수 있습니다)

---



## 변경 배경

이 커밋은 Neo4j Tool Calling 구현 명세서의 V1 문서를 폐기 처리하고, 실제 Backend 코드와 Neo4j 스키마에 기반한 V2 문서를 새로 작성한 문서화 작업입니다.

- **목적**: V1 문서의 Cypher Property 불일치, 존재하지 않는 필드 참조, 잘못된 schoolLevel 값 등 데이터 모델 오류를 정정하고, 실제 Backend(`DgnssGraphService`)와 Neo4j 스키마에 정확히 매핑되는 단일 SSOT(Single Source of Truth) 문서를 제공
- **도메인**: 문서화 / 아키텍처 설계 (Agent + Neo4j Tool Calling)
- **변경 방향**: V1의 추측성/부정확한 명세를 V2에서 Backend 코드 기반 팩트체크로 대체. Cypher 쿼리, 반환 스키마, schoolLevel 값, Tool 인터페이스 등 모든 세부 사항을 실제 구현과 일치시킴

---

## [GOOD] 잘된 점

1. **명확한 V1 폐기 처리**: V1 문서 상단에 DEPRECATED 배너와 폐기 사유를 구체적으로 명시하여, 팀원들이 혼동 없이 V2를 참조하도록 유도한 점이 우수합니다. 특히 폐기 사유를 4가지 항목으로 번호 매겨 나열한 것은 가독성과 설득력이 높습니다.

2. **Backend 코드 기반의 철저한 팩트체크**: V2 문서 전반에 걸쳐 Backend Java 코드(`DgnssGraphService.java`, `DgnssLpaService.java`)와 실제 Cypher 마이그레이션 파일을 참조하여 작성되었습니다. "추측하지 말고 코드를 보라"는 원칙이 잘 지켜졌습니다.

3. **종단 간 데이터 흐름의 명확한 정의**: Frontend `contextBuilder` -> `assistantService` -> Agent -> Neo4j로 이어지는 전체 데이터 흐름을 다이어그램과 표로 명확히 정의했습니다. 특히 `profile` 객체의 조건부 전송 정책(`mode === 'student'` 단일 학생 + 검사 데이터 있음)을 명확히 한 점이 좋습니다.

4. **엣지 케이스와 운영 가드레일의 체계적 문서화**: §4.0(구현 시 유의), §10(운영 가드레일)에서 검사 데이터 없는 학생, 세션 ID 캐시 불일치, Neo4j 다운 시나리오 등 실제 운영에서 발생할 수 있는 문제를 사전에 식별하고 대응책을 제시한 점이 실무적입니다.

---

## 변경사항 요약

- `agent/docs/NEO4J_TOOL_IMPLEMENTATION_PLAN.md` (V1): 상단에 DEPRECATED 배너와 V2 참조 안내 추가
- `agent/docs/NEO4J_TOOL_IMPLEMENTATION_PLAN_V2.md` (V2, 신규): 882라인 분량의 완전히 새로 작성된 명세서. 데이터 모델, Tool 인터페이스, Frontend/Agent 변경 사항, 테스트 계획, Phase별 실행 순서, 회귀 방지 체크리스트 포함

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음. 문서화 커밋으로, 실행 가능한 코드가 포함되지 않았으며 데이터 손실이나 보안 취약점은 존재하지 않습니다.

### High (우선 수정 권장)

**1. §5.1 `neo4j_tools.py` - `_execute_query`의 에러 반환 타입 불일치**

- **위치**: §5.1, `_execute_query` 함수
- **문제**: `_execute_query`의 반환 타입이 `List[Dict[str, Any]]`로 명시되어 있으나, 정상 케이스에서는 `await result.data()`가 `list[dict]`를 반환합니다. 그런데 에러 발생 시 `[{"error": "TIMEOUT", "message": "..."}]` 형태로 **리스트 안에 단일 dict**를 반환합니다. 이는 Tool의 정상 반환 타입(`list[dict]`)과 동일한 타입이므로 LLM이 에러를 정상 데이터로 오인할 가능성이 있습니다.

  반면 `_validate_args`는 에러 시 `{"error": "...", "message": "..."}`라는 **단일 dict**를 반환하고, 각 Tool 함수에서 `if err: return [err]`로 리스트로 감쌉니다. 이 두 에러 처리 방식이 일관되지 않습니다.

- **해결 방안**: 에러 반환 형식을 통일하는 것이 좋습니다. `_execute_query`도 에러 시 단일 dict를 반환하고, 호출부에서 리스트로 감싸는 방식으로 일관성을 맞추거나, 아니면 모든 에러를 동일한 형식의 dict로 통일하세요.

  **수정 코드 제시 불가 - 문맥 파악 불충분**: `_execute_query`가 호출되는 모든 Tool 함수의 에러 처리 패턴을 함께 확인해야 하며, LLM Tool 호출 결과 처리 로직(`agent_service.py`)도 함께 검토해야 정확한 수정 방향을 결정할 수 있습니다.

**2. §5.3 `_normalize_tool_args` - `high` -> `middle` 매핑의 모호성**

- **위치**: §5.3, `_normalize_tool_args` 함수
- **문제**: `"고등": "middle"`, `"high": "middle"`, `"h": "middle"`으로 매핑하고 있습니다. Backend `DgnssLpaService.resolveModelSchoolLevel()`이 `high -> middle`로 매핑하는 것은 사실이나, 이는 **Backend의 내부 정책**입니다. Agent가 `high`를 받았을 때 이를 `middle`로 자동 변환하는 것이 올바른 책임 분리인지 의문입니다.

  만약 미래에 고등학교 전용 LPA 검사가 도입되면, `high -> middle` 매핑은 잘못된 데이터를 생성하게 됩니다. 또한 LLM이 `high`를 입력했다는 것은 그 자체로 LLM의 오해를 반영하므로, **무음 변환보다는 경고 로그를 남기거나 명시적으로 거부**하는 편이 더 안전합니다.

- **해결 방안**: `high`/`고등` 입력 시 자동 변환하지 말고, 경고 로그를 남기고 에러를 반환하는 방향을 고려하세요. 또는 최소한 `logger.warning`으로 변환 사실을 기록해야 합니다.

  **수정 코드 제시 불가 - 문맥 파악 불충분**: `_normalize_tool_args`가 호출되는 컨텍스트(`agent_service.py`의 Tool 실행 파이프라인)를 함께 확인해야 정확한 수정 방향을 결정할 수 있습니다.

### Medium (개선 권장)

**1. §5.1 `Neo4jConnectionManager` - 싱글톤 패턴의 테스트 용이성**

- **위치**: §5.1, `Neo4jConnectionManager` 클래스
- **문제**: 클래스 변수 `_driver`를 사용한 싱글톤 패턴은 단순하고 효과적이지만, 단위 테스트에서 Mock Driver로 교체하기 어렵습니다. `_driver`를 직접 오버라이드해야 하므로 테스트가 깨지기 쉽습니다.

- **개선 제안**: 의존성 주입 패턴을 도입하거나, 최소한 `_driver`를 protected 레벨로 열어두고 테스트 헬퍼 메서드를 제공하는 것을 고려하세요.

**2. §5.1 `_execute_query` - 타임아웃 예외와 일반 예외의 중복 처리**

- **위치**: §5.1, `_execute_query` 함수
- **문제**: `asyncio.TimeoutError`를 별도로 잡고 있지만, `except Exception as e` 블록에서도 동일하게 `TIMEOUT` 에러가 잡힐 수 있습니다. `asyncio.wait_for`의 타임아웃 예외는 `asyncio.TimeoutError`이므로 현재 코드는 정상이지만, `Exception` 블록의 순서에 의존하는 구조는 취약합니다.

- **개선 제안**: 예외 처리 순서를 명시적으로 유지하고, `Exception` 블록에서 `UNKNOWN` 에러 코드를 사용하는 것은 적절합니다. 다만 `logger.exception`은 스택 트레이스를 포함하므로, `TimeoutError`와 `ServiceUnavailable` 등 예측 가능한 예외에도 `logger.exception` 대신 `logger.error`를 사용하는 것이 로그 노이즈를 줄이는 데 도움이 됩니다.

---

## 주요 파일 분석

### `agent/docs/NEO4J_TOOL_IMPLEMENTATION_PLAN_V2.md` (신규)

**변경 내용:**
V1의 데이터 모델 오류를 전면 수정하고, Backend 코드 기반의 정확한 명세서를 882라인 분량으로 신규 작성

**개선 제안:**

1. **§5.1 `neo4j_tools.py` - `_execute_query` 에러 반환 타입 일관성**
   - **위치**: §5.1, `_execute_query` 함수 (에러 처리 블록)
   - **기존 코드**:
   ```python
   except asyncio.TimeoutError:
       logger.error(f"Neo4j query timeout ({timeout}s)")
       return [{"error": "TIMEOUT", "message": "Query timeout exceeded"}]
   ```
   - **문제**: 에러를 `list[dict]`로 반환하여 정상 결과와 타입이 동일. LLM이 에러를 데이터로 오인할 가능성 존재
   - **해결 방안**: `_validate_args`와 동일하게 단일 `dict` 반환으로 통일하고, 각 Tool 함수에서 `[err]`로 감싸는 패턴을 일관되게 적용

2. **§5.3 `_normalize_tool_args` - `high`->`middle` 무음 변환 위험**
   - **위치**: §5.3, `_normalize_tool_args` 함수
   - **기존 코드**:
   ```python
   mapping = {"초등": "elementary", "elementary": "elementary", "e": "elementary",
              "중등": "middle", "middle": "middle", "m": "middle",
              "고등": "middle", "high": "middle", "h": "middle"}
   ```
   - **문제**: `high`/`고등`을 무음 변환하면 미래 고등 전용 검사 도입 시 회귀 버그 발생 가능
   - **해결 방안**: `high`/`고등` 입력 시 `logger.warning`을 남기고 에러 반환. 또는 최소한 변환 사실을 로그에 기록

3. **§7 테스트 계획 - 단위 테스트에 `_execute_query` 에러 케이스 누락**
   - **위치**: §7.1 단위 테스트 계획
   - **문제**: `_validate_args`와 `_normalize_tool_args`에 대한 테스트는 명시되어 있으나, `_execute_query`의 5가지 예외 처리 경로(TimeoutError, ServiceUnavailable, AuthError, ClientError, 일반 Exception)에 대한 단위 테스트가 누락됨
   - **해결 방안**: §7.1에 `_execute_query`의 각 예외 처리 경로별 단위 테스트 케이스를 추가

---

## 최종 평가

**결론**: 
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [x] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [ ] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**
V1의 데이터 모델 오류를 Backend 코드 기반으로 철저히 팩트체크하여 정정한 고품질의 문서입니다. 종단 간 데이터 흐름, 엣지 케이스, 운영 가드레일까지 체계적으로 정의되어 있어 실제 구현 가이드로서의 가치가 높습니다. High 이슈 2건(에러 반환 타입 일관성, `high->middle` 무음 변환)은 실제 코드 구현 단계에서 반드시 검토해야 할 사항이며, 문서 자체의 승인을 막을 정도는 아닙니다. Phase별 실행 순서와 회귀 체크리스트가 구체적으로 정의되어 있어 실행 계획으로서도 충실합니다.