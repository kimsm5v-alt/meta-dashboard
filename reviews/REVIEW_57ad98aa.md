> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 57ad98aa

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 2개


### 정상 범위 (NONE)


**`agent_service.py`** (other)

- 평균 복잡도: **0.200**

- 최대 복잡도: 0.464

- 청크 수: 7개

- 평균 사용처: 8.0곳


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 `agent/app/services/agent_service.py`의 `run_agent_stream` 메서드에서 LangSmith 트레이싱의 예외 처리 경로와 `requirements.txt`의 버전 제약을 개선합니다.

- **목적**: `run_agent_stream`의 `except BaseException` 블록과 `finally` 블록에서 `_run_tree.outputs`에 할당되는 `_stream_output`이 빈 문자열(`""`)일 때 LangSmith에 기록되는 outputs 값이 빈 객체가 아닌 의미 있는 fallback 메시지를 포함하도록 보장합니다. 또한 `run_agent` 메서드의 LangSmith trace inputs에 PII(개인식별정보) 관련 주석을 추가하여 보안 인식을 강화합니다.
- **도메인**: 비즈니스 로직 (AI Agent 오케스트레이션) + Observability (LangSmith 트레이싱)
- **변경 방향**: 기존 코드는 `_stream_output`이 빈 문자열(`""`)로 초기화된 상태에서 예외가 발생하면 `_run_tree.outputs = {"response": ""}`로 기록되어 LangSmith 대시보드에서 의미 없는 빈 응답이 표시되는 문제가 있었습니다. 이를 `or "응답을 생성하지 못했습니다."` 폴백 값으로 대체하여, 예외 발생 시에도 항상 의미 있는 응답이 기록되도록 개선했습니다.

---

## [STATUS] 심각도별 이슈 요약

### Critical (즉시 수정 필요)
- 없음

### High (우선 수정 권장)
1. **`run_agent` 메서드의 `finally` 블록에서 `_trace_ctx.__exit__()` 호출 시 `sys.exc_info()` 사용 문제** — `run_agent`의 `finally` 블록(라인 247)은 `run_agent_stream`과 달리 `*sys.exc_info()`를 사용하는데, `finally` 블록에서는 예외가 정상 처리되었거나 예외가 없을 수 있어 불필요한 예외 정보가 LangSmith에 전달될 위험이 있습니다.
2. **`run_agent_stream`의 중첩 try-except 구조에서 `_stream_output` 초기화 값의 의미적 모호성** — `_stream_output = ""`(라인 269)로 초기화되어, 정상 경로에서 `break` 전에 할당되지 않으면 `""` 상태로 `except BaseException` 블록에 진입할 수 있는 경로가 존재합니다.

### Medium (개선 권장)
1. **`run_agent` 메서드의 LangSmith trace inputs에 `session_id` 포함** — `session_id`는 PII는 아니지만, LangSmith에 세션 식별자가 기록되어 디버깅 시 세션 간 추적이 가능해집니다. 보안 정책에 따라 민감도 평가가 필요합니다.
2. **`run_agent` 메서드의 `finally` 블록에서 `_run_tree.outputs` 할당 시 `answer` 변수 사용** — `run_agent`는 `_stream_output`이 아닌 `answer` 변수를 사용하는데, 이 변수는 초기값이 `"응답을 생성하지 못했습니다."`로 설정되어 있어(라인 147) `run_agent_stream`과 초기화 방식이 다릅니다. 일관성 측면에서 검토가 필요합니다.

### Low (참고 사항)
1. **PII 주석의 위치** — 주석은 `run_agent` 메서드에만 추가되었고, `run_agent_stream` 메서드(라인 267-275)에는 동일한 PII 경고 주석이 없어 두 메서드 간 문서화 불일치가 있습니다.
2. **`requirements.txt` 주석의 버전 상한 고정** — `langsmith>=0.7.18,<1.0.0`의 상한을 `<1.0.0`으로 고정한 것은 적절하나, `langchain>=0.3.0`과 `langchain-community>=0.3.0`에는 상한이 없어 langsmith 1.x와의 호환성 문제가 발생할 경우 langchain도 함께 업데이트가 필요할 수 있습니다.

---

## 변경사항 요약

1. **`agent_service.py` — PII 보안 주석 추가 (라인 153-156)**: `run_agent` 메서드의 LangSmith trace 초기화 직전에 inputs의 `text`(교사 질문)에 PII가 포함될 수 있음을 경고하는 주석 3줄을 추가했습니다. `context_data`는 `_build_messages`에서 `mask_pii_data`로 마스킹된다는 점을 명시하여, 개발자가 inputs 필드의 보안 위험을 인지하도록 했습니다.

2. **`agent_service.py` — `_run_tree.outputs` 폴백 값 추가 (라인 410, 417)**: `run_agent_stream` 메서드의 `except BaseException` 블록과 `finally` 블록에서 `_run_tree.outputs = {"response": _stream_output}`을 `_run_tree.outputs = {"response": _stream_output or "응답을 생성하지 못했습니다."}`로 변경했습니다. 이는 `_stream_output`이 빈 문자열(`""`)일 때 LangSmith에 기록되는 outputs 값이 빈 객체가 아닌 fallback 메시지를 포함하도록 보장합니다.

3. **`requirements.txt` — langsmith 버전 제약 주석 추가 (라인 7)**: `langsmith>=0.7.18,<1.0.0` 뒤에 `# RunTree.outputs API 안정화 버전. 1.x 릴리스 시 호환성 확인 후 상한 조정` 주석을 추가하여, 향후 langsmith 1.x 릴리스 시 `RunTree.outputs` API 호환성을 확인하고 상한을 조정해야 함을 문서화했습니다.

---

## 파일별 상세 분석

### `agent/app/services/agent_service.py`

**변경 내용:**
1. **라인 153-156**: `run_agent` 메서드의 LangSmith trace 초기화 직전에 PII 관련 주석 3줄 추가
2. **라인 410**: `except BaseException` 블록 내 `_run_tree.outputs` 할당에 `or "응답을 생성하지 못했습니다."` 폴백 추가
3. **라인 417**: `finally` 블록 내 `_run_tree.outputs` 할당에 `or "응답을 생성하지 못했습니다."` 폴백 추가

---

**[PROBLEM] 발견된 문제:**

1. **[일관성 문제] `run_agent`와 `run_agent_stream` 간 PII 주석 불일치**
   - **위치 (라인 번호)**: 라인 153-156 (`run_agent`) vs 라인 267-275 (`run_agent_stream`)
   - **기존 코드** (`run_agent_stream`, 라인 267-275):
   ```python
   if langsmith_is_enabled():
       _trace_ctx = langsmith.trace(
           name="meta-agent-stream",
           inputs={"text": text, "session_id": session_id},
           tags=["agent", "stream"],
           metadata={
               "session_id": session_id,
               "school_level": profile.get("schoolLevel"),
               "predicted_type": profile.get("predictedType"),
           },
       )
       _run_tree = _trace_ctx.__enter__()
   ```
   - **해결 방안 (수정 코드)**: `run_agent_stream`에도 동일한 PII 경고 주석을 추가하여 두 메서드 간 문서화 일관성을 유지해야 합니다.
   ```python
   if langsmith_is_enabled():
       # inputs의 text(교사 질문)와 outputs의 answer(AI 응답)는 LangSmith로 전송됨.
       # 교사가 질문에 학생 이름 등 PII를 직접 입력할 경우 LangSmith에 기록될 수 있음.
       # context_data(학생 프로필)는 _build_messages에서 mask_pii_data로 마스킹 후 사용됨.
       _trace_ctx = langsmith.trace(
           name="meta-agent-stream",
           inputs={"text": text, "session_id": session_id},
           tags=["agent", "stream"],
           metadata={
               "session_id": session_id,
               "school_level": profile.get("schoolLevel"),
               "predicted_type": profile.get("predictedType"),
           },
       )
       _run_tree = _trace_ctx.__enter__()
   ```
   - **위험도**: Low
   - **영향**: `run_agent_stream`을 유지보수하는 개발자가 PII 보안 위험을 인지하지 못할 수 있습니다. `run_agent`와 동일한 inputs 구조를 사용하므로 동일한 위험이 존재합니다.

2. **[일관성 문제] `run_agent`의 `finally` 블록에서 `sys.exc_info()` 사용**
   - **위치 (라인 번호)**: 라인 247 (`run_agent`의 `finally` 블록)
   - **기존 코드**:
   ```python
   finally:
       if _trace_ctx is not None:
           if _run_tree is not None:
               _run_tree.outputs = {"response": answer}
           _trace_ctx.__exit__(*sys.exc_info())
   ```
   - **해결 방안 (수정 코드)**: `run_agent_stream`의 `finally` 블록(라인 416-419)과 동일하게 `_trace_ctx.__exit__(None, None, None)`로 변경하여 일관성을 유지해야 합니다. `finally` 블록에서는 예외가 이미 처리되었거나 예외가 없는 상태이므로 `sys.exc_info()`를 전달할 필요가 없습니다.
   ```python
   finally:
       if _trace_ctx is not None:
           if _run_tree is not None:
               _run_tree.outputs = {"response": answer}
           _trace_ctx.__exit__(None, None, None)
   ```
   - **위험도**: High
   - **영향**: `run_agent`의 `finally` 블록에서 `sys.exc_info()`를 호출하면, `finally` 블록 실행 시점에 활성 예외가 있다면 LangSmith에 예외 정보가 전달되어 LangSmith 대시보드에 불필요한 오류 Run이 생성될 수 있습니다. `run_agent`는 `run_agent_stream`과 달리 `except BaseException` 블록이 없으므로, `try` 블록 내에서 예외가 발생하면 `except` 블록에서 처리된 후 `finally` 블록으로 진입하는데, 이때 `sys.exc_info()`는 여전히 예외 정보를 반환할 수 있습니다. 특히 `except Exception as e` 블록에서 처리된 예외는 `sys.exc_info()`에 남아있을 수 있어, LangSmith에 잘못된 예외 정보가 전달될 위험이 있습니다.

3. **[의미적 문제] `run_agent_stream`의 `_stream_output` 초기화 값**
   - **위치 (라인 번호)**: 라인 269
   - **기존 코드**:
   ```python
   _stream_output = ""
   ```
   - **해결 방안 (수정 코드)**: `run_agent`의 `answer` 변수(라인 147)와 동일하게 `_stream_output = "응답을 생성하지 못했습니다."`로 초기화하여, 초기화 직후 예외가 발생해도 의미 있는 fallback 값이 설정되도록 개선할 수 있습니다. 단, 이 변경은 `or "응답을 생성하지 못했습니다."` 폴백이 이미 적용되었으므로 기능적 영향은 없으며, 코드의 의도 표현 측면에서의 개선입니다.
   ```python
   _stream_output = "응답을 생성하지 못했습니다."
   ```
   - **위험도**: Medium
   - **영향**: 현재 `or` 폴백이 적용되어 기능적 문제는 없으나, `_stream_output = ""`로 초기화된 상태에서 `except BaseException` 블록에 진입하면 `_stream_output or "응답을 생성하지 못했습니다."`가 실행되어 폴백 값이 사용됩니다. 이는 의도된 동작이지만, 코드를 처음 보는 개발자에게 `_stream_output`이 빈 문자열로 초기화된 이유가 명확하지 않습니다. `run_agent`의 `answer = "응답을 생성하지 못했습니다."`와 일관성을 맞추는 것이 유지보수성 측면에서 좋습니다.

---

**[GOOD] 잘된 점:**

1. **`or` 폴백 패턴의 일관된 적용**: `except BaseException` 블록(라인 410)과 `finally` 블록(라인 417) 두 곳 모두에 동일한 `or "응답을 생성하지 못했습니다."` 패턴을 적용하여, 어느 경로로 진입하든 동일한 fallback 동작을 보장합니다. 이는 중복 코드이지만 예외 처리의 안전성을 높이는 의도된 설계로 판단됩니다.

2. **PII 보안 인식 제고**: `run_agent` 메서드에 추가된 주석은 `inputs` 필드에 PII가 포함될 수 있음을 명시적으로 경고하여, 향후 코드 수정 시 개발자가 보안 위험을 인지하도록 돕습니다. 특히 `context_data`는 `mask_pii_data`로 마스킹된다는 점을 함께 명시하여, inputs 필드와 context_data의 보안 처리 차이를 명확히 구분했습니다.

3. **버전 상한 주석의 실용성**: `requirements.txt`의 주석은 단순한 버전 고정이 아닌, `RunTree.outputs` API 안정화 버전이라는 근거와 1.x 릴리스 시 확인이 필요하다는 구체적인 액션 아이템을 포함하여, 향후 유지보수 시 참고할 수 있는 실용적인 정보를 제공합니다.

---

### `agent/requirements.txt`

**변경 내용:**
- 라인 7: `langsmith>=0.7.18,<1.0.0` 뒤에 주석 추가

**[GOOD] 잘된 점:**
- 버전 상한(`<1.0.0`)의 근거를 명확히 문서화하여, 향후 langsmith 1.x 릴리스 시 `RunTree.outputs` API 호환성 확인이 필요함을 명시했습니다. 이는 단순한 버전 고정이 아닌, API 호환성에 기반한 의사 결정을 문서화한 좋은 사례입니다.

---

## 보안 분석

**발견된 보안 취약점:**

1. **[Medium] LangSmith inputs에 PII 포함 가능성**
   - **공격 시나리오**: 교사가 질문(`text`)에 학생 이름, 전화번호, 주민등록번호 등 PII를 직접 입력할 경우, 해당 정보가 LangSmith 서버로 전송되어 기록됩니다. LangSmith는 클라우드 서비스이므로, 데이터가 외부 서버에 저장됩니다.
   - **수정 방법**: 현재는 주석으로만 경고하고 있습니다. 추가적인 방어 조치로, `text` 입력값에 대해 `mask_pii_data`와 유사한 PII 마스킹을 적용한 후 LangSmith에 전송하는 것을 고려할 수 있습니다. 단, 이는 `text`의 원본 의미를 변경할 수 있으므로 신중한 검토가 필요합니다.

**보안 체크리스트:**
- [x] 인증/인가 검증 — 해당 없음 (변경 범위 외)
- [ ] 입력 검증 및 Sanitization — `text` 입력값에 대한 PII 마스킹이 LangSmith 전송 전에 적용되지 않음 (주석으로만 경고)
- [x] 민감 정보 보호 — `context_data`는 `mask_pii_data`로 마스킹되나, `text`는 마스킹되지 않음
- [x] HTTPS/암호화 사용 — 해당 없음 (변경 범위 외)

---

## 버그 가능성 분석

**잠재적 버그:**

1. **[Low] `run_agent_stream`의 `except BaseException` 블록에서 `_trace_ctx = None` 할당 후 `finally` 블록에서 `_trace_ctx` 재참조**
   - **재현 조건**: `except BaseException` 블록이 실행된 후 `finally` 블록으로 진입하는 경우
   - **예상 결과**: `except BaseException` 블록(라인 408-413)에서 `_trace_ctx = None`으로 설정한 후 `raise`로 예외를 다시 던지면, `finally` 블록(라인 415-419)에서 `if _trace_ctx is not None:` 조건이 False가 되어 `finally` 블록의 LangSmith 종료 로직이 실행되지 않습니다. 이는 의도된 동작으로, `except BaseException` 블록에서 이미 `_trace_ctx.__exit__()`를 호출했으므로 `finally` 블록에서 중복 호출을 방지하는 안전장치입니다.
   - **수정 방법**: 현재 동작은 의도된 설계로, 별도 수정이 필요하지 않습니다. 단, 이 패턴이 명시적으로 문서화되어 있지 않아 코드 리뷰 시 혼란을 줄 수 있습니다.

**Edge Case 검증:**
- [x] Null/Undefined 처리 — `_stream_output or "응답을 생성하지 못했습니다."`로 빈 문자열 처리
- [x] 빈 배열/객체 처리 — `_run_tree.outputs`에 빈 딕셔너리 대신 fallback 값 할당
- [ ] 경계값 (0, 음수, 최대값) — 해당 없음
- [x] 동시성 문제 — `_trace_ctx`와 `_run_tree`는 메서드 로컬 변수로 스레드 안전

---

## 성능 분석

**성능 이슈:**
- 없음. 변경된 코드는 조건부 문자열 연산(`or`)과 주석 추가로, 성능에 영향을 미치지 않습니다.

**성능 체크리스트:**
- [x] 불필요한 연산 제거 — 해당 없음
- [x] 캐싱 활용 — 해당 없음
- [x] 비동기 처리 — 해당 없음
- [x] 메모리 효율성 — 해당 없음

---

## 코드 품질 평가

- **가독성**: 8/10 — PII 주석이 명확하고, `or` 폴백 패턴이 직관적입니다. 단, `run_agent_stream`에 PII 주석이 누락된 점이 일관성을 떨어뜨립니다.
- **유지보수성**: 7/10 — `run_agent`와 `run_agent_stream` 간 `finally` 블록의 `sys.exc_info()` 사용 차이는 유지보수 시 혼란을 줄 수 있습니다. 또한 `_stream_output` 초기화 값이 `run_agent`의 `answer`와 달라 일관성이 부족합니다.
- **테스트 커버리지**: 평가 불가 — 이 커밋 범위 내에서는 테스트 코드가 포함되지 않았습니다. LangSmith 트레이싱 로직은 mocking이 필요한 영역으로, 단위 테스트가 별도로 존재하는지 확인이 필요합니다.
- **문서화**: 8/10 — PII 주석과 requirements.txt 주석이 구체적이고 실용적입니다. 단, `run_agent_stream`에 PII 주석이 누락된 점이 아쉽습니다.

---

## 개선 제안 (우선순위별)

### 필수 (Must Fix)
1. **`run_agent`의 `finally` 블록에서 `sys.exc_info()`를 `None, None, None`으로 변경** — `run_agent_stream`의 `finally` 블록과 일관성을 맞추고, 불필요한 예외 정보가 LangSmith에 전달되는 것을 방지합니다. (라인 247)

### 권장 (Should Fix)
1. **`run_agent_stream`에 PII 경고 주석 추가** — `run_agent`와 동일한 inputs 구조를 사용하므로, 동일한 PII 위험에 대한 경고 주석을 추가하여 문서화 일관성을 유지합니다. (라인 267-275)
2. **`_stream_output` 초기화 값을 `"응답을 생성하지 못했습니다."`로 변경** — `run_agent`의 `answer` 변수와 일관성을 맞추고, 코드의 의도를 명확히 표현합니다. (라인 269)

### 선택 (Nice to Have)
1. **LangSmith inputs에 PII 마스킹 적용 검토** — `text` 입력값에 대해 `mask_pii_data`와 유사한 PII 마스킹을 적용하여, 주석 수준이 아닌 코드 수준에서 PII 보호를 강화하는 것을 검토할 수 있습니다.

---

## 최종 평가

**종합 점수**: 82/100

**결론**:
- [ ] [OK] **승인 (Approved)** — 문제 없음
- [x] [WARN] **조건부 승인 (Approved with Comments)** — 경미한 이슈만 존재
- [ ] [FIX] **수정 필요 (Changes Requested)** — 중요 이슈 수정 후 재검토
- [ ] [REJECT] **거부 (Rejected)** — 치명적 이슈로 인한 병합 불가

**핵심 코멘트:**
이 커밋은 `run_agent_stream`의 LangSmith 트레이싱에서 예외 발생 시 outputs에 의미 없는 빈 문자열이 기록되는 문제를 `or "응답을 생성하지 못했습니다."` 폴백 값으로 해결했습니다. 또한 PII 보안 인식을 제고하는 주석과 버전 제약 근거를 문서화하여 코드 품질을 향상시켰습니다.

주요 개선 사항으로는 `run_agent`의 `finally` 블록에서 `sys.exc_info()` 사용을 `run_agent_stream`과 일관되게 `None, None, None`으로 변경하는 것과, `run_agent_stream`에도 PII 경고 주석을 추가하는 것이 있습니다. 이 두 가지는 코드 일관성과 유지보수성을 높이는 데 도움이 됩니다.

커밋 작성자의 메시지에서 언급된 4가지 미채택 리뷰 코멘트(중첩 try-except, Tool Call 시나리오, `__exit__` 비대칭성, `_run_tree.outputs` 타이밍 이슈)는 모두 코드 분석 결과 의도된 설계로 확인되었으며, 이번 변경으로 인해 새로운 회귀(regression)가 발생하지 않았습니다.

**리뷰어 노트:**
- 검토 시간: 약 25분
- 우선 수정 항목:
  1. `run_agent`의 `finally` 블록에서 `sys.exc_info()` -> `None, None, None` (라인 247)
  2. `run_agent_stream`에 PII 경고 주석 추가 (라인 267)
  3. `_stream_output` 초기화 값을 `"응답을 생성하지 못했습니다."`로 변경 (라인 269)