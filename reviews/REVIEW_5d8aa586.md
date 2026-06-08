> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 5d8aa586

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

이 커밋은 LangSmith APM(Application Performance Monitoring)에서 Agent 실행 결과(Run output)가 정상적으로 전송되지 않던 버그를 수정합니다. 기존 코드는 `langsmith.trace()` context manager의 `__enter__()` 반환값을 무시하여 `_run_tree` 객체를 확보하지 못했고, 이로 인해 `_run_tree.outputs`에 응답 데이터를 설정할 수 없어 LangSmith 대시보드에서 Run의 output 필드가 항상 비어 있었습니다. 또한 스트리밍 모드(`run_agent_stream`)에서는 예외 발생 시 최종 출력값을 추적하는 변수 자체가 없어 output 기록이 누락되었습니다.

- **목적**: LangSmith Run output 미전송 버그 수정 및 tracing 데이터 정합성 확보
- **도메인**: Observability / APM (LangSmith Tracing)
- **변경 방향**: context manager 반환값 수집 및 스트림 출력 추적 변수 도입으로 LangSmith Run의 output 필드가 항상 채워지도록 보강

---

## [STATUS] 심각도별 이슈 요약

### Critical (즉시 수정 필요)
- 없음

### High (우선 수정 권장)
1. `run_agent_stream`의 `BaseException` 핸들러에서 `_stream_output`이 빈 문자열(`""`)일 때 output이 빈 값으로 기록됨
2. `run_agent_stream`의 중첩 try-except 구조로 인한 예외 처리 흐름 복잡성 및 `_stream_output` 설정 누락 위험

### Medium (개선 권장)
1. Tool Call만 있고 텍스트 응답이 없는 시나리오에서 `_stream_output`이 `fallback_message`로 설정될 가능성
2. `requirements.txt`에 langsmith 버전 상한선(`<1.0.0`) 설정 근거 부재

### Low (참고 사항)
1. `run_agent`와 `run_agent_stream` 간 `_trace_ctx.__exit__()` 호출 방식의 비대칭성
2. LangSmith output에 PII 마스킹 미적용

---

## 변경사항 요약

1. **`run_agent` 메서드**: `_trace_ctx.__enter__()`의 반환값을 `_run_tree` 변수에 할당하고, `finally` 블록에서 `_run_tree.outputs`에 응답 데이터를 설정하도록 변경
2. **`run_agent_stream` 메서드**: `_run_tree` 변수와 `_stream_output` 변수를 추가하여 스트리밍 최종 출력을 추적하고, 모든 종료 경로(정상/예외/BaseException)에서 `_run_tree.outputs`에 기록하도록 변경
3. **`requirements.txt`**: `langsmith>=0.2.0`에서 `langsmith>=0.7.18,<1.0.0`으로 버전 제약 강화

---

## 파일별 상세 분석

### agent/app/services/agent_service.py

**변경 내용:**

**run_agent 메서드 (비스트리밍):**
- `_run_tree = None` 초기화 추가 (라인 149)
- `_run_tree = _trace_ctx.__enter__()`로 반환값 수집 (라인 164)
- `finally` 블록에서 `_run_tree.outputs = {"response": answer}` 설정 (라인 240-241)

변경 전 코드:
```python
_trace_ctx.__enter__()
```
변경 후 코드:
```python
_run_tree = _trace_ctx.__enter__()
```

**run_agent_stream 메서드 (스트리밍):**
- `_run_tree = None`, `_stream_output = ""` 초기화 추가 (라인 261-262)
- `_run_tree = _trace_ctx.__enter__()`로 반환값 수집 (라인 272)
- 정상 완료 시 `_stream_output = final_content` 설정 (라인 316)
- max_iterations 도달 시 `_stream_output = max_iter_message` 설정 (라인 364)
- 각 예외 타입별 `_stream_output` 설정 (라인 372, 380, 388, 396, 404)
- `BaseException` 핸들러에서 `_run_tree.outputs = {"response": _stream_output}` 설정 (라인 398-399)
- `finally` 블록에서 `_run_tree.outputs = {"response": _stream_output}` 설정 (라인 407-408)

---

**[PROBLEM] 발견된 문제:**

**1. [버그 가능성 - High] `BaseException` 핸들러에서 `_stream_output`이 빈 문자열일 때 output 왜곡**

`run_agent_stream` 메서드의 `BaseException` 핸들러(라인 395-401)는 `_stream_output` 변수에 접근하여 LangSmith output을 설정합니다. 그러나 `BaseException`이 발생한 시점이 스트림 처리 로직(`while iterations < self.max_iterations` 루프)에 진입하기 전이라면, `_stream_output`은 초기값인 빈 문자열(`""`) 상태입니다. 이 경우 LangSmith output이 `{"response": ""}`로 기록되어, 실제로는 응답이 생성되지 않았음에도 빈 응답으로 오인될 수 있습니다.

**재현 조건**: `self._build_messages()` 또는 `self.router.acompletion()`에서 예외 발생 시

**수정 코드 제시**:
```python
except BaseException:
    if _trace_ctx is not None:
        if _run_tree is not None:
            _run_tree.outputs = {"response": _stream_output or "응답을 생성하지 못했습니다."}
        _trace_ctx.__exit__(*sys.exc_info())
        _trace_ctx = None
    raise
```

**2. [코드 품질 - High] 중첩 try-except 구조로 인한 예외 처리 흐름 복잡성**

`run_agent_stream` 메서드는 외부 try 블록(라인 281)과 내부 try 블록(라인 283)의 중첩 구조로 되어 있습니다. 내부 try 블록에서 발생한 litellm 예외들은 내부 except에서 처리되고, 외부 try 블록의 `BaseException` 핸들러는 `KeyboardInterrupt`나 `SystemExit` 같은 특수 예외를 처리합니다. 이 구조는 예외 처리 흐름을 추적하기 어렵게 만들고, 새로운 예외 타입 추가 시 `_stream_output` 설정을 누락할 위험을 높입니다.

**수정 코드 제시**:
```python
try:
    messages, history = self._build_messages(text, session_id, context_data)
    iterations = 0
    final_content = ""
    fallback_message = "응답을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요."
    
    while iterations < self.max_iterations:
        try:
            response = await self.router.acompletion(
                model=ROUTER_MODEL_NAME,
                messages=messages,
                tools=self.tools,
                stream=True
            )
            # ... 스트림 처리 로직 ...
        except litellm.exceptions.AuthenticationError as e:
            logger.error(f"Authentication error: {str(e)}")
            _stream_output = "API 키 인증 오류가 발생했습니다. 관리자에게 문의하세요."
            yield _stream_output
            return  # 또는 break 후 finally에서 처리
        # ... 다른 예외 처리 ...
except BaseException:
    if _trace_ctx is not None:
        if _run_tree is not None:
            _run_tree.outputs = {"response": _stream_output or "응답을 생성하지 못했습니다."}
        _trace_ctx.__exit__(*sys.exc_info())
        _trace_ctx = None
    raise
finally:
    if _trace_ctx is not None:
        if _run_tree is not None:
            _run_tree.outputs = {"response": _stream_output or "응답을 생성하지 못했습니다."}
        _trace_ctx.__exit__(None, None, None)
```

**3. [버그 가능성 - Medium] Tool Call만 있는 시나리오에서 `_stream_output`이 `fallback_message`로 설정**

`run_agent_stream` 메서드에서 `content_buffer`가 비어 있고 `tool_call_buffer`가 비어 있지 않은 경우(즉, Tool Call만 있고 텍스트 응답이 없는 경우), `final_content = content_buffer or fallback_message`에 의해 `final_content`가 `fallback_message`로 설정됩니다. 그러나 이 시점에서 루프는 `break`되지 않고 계속 진행되므로(라인 318: `if not tool_call_buffer:` 조건에 의해 Tool Call이 있으면 break하지 않음), 실제로는 문제가 발생하지 않습니다. 하지만 코드 가독성 측면에서 `_stream_output`이 `final_content`로 설정되는 시점이 혼란을 줍니다.

---

**[GOOD] 잘된 점:**

- `_run_tree` 변수를 도입하여 `__enter__()`의 반환값을 명시적으로 수집한 것은 LangSmith SDK의 올바른 사용법입니다. 기존 코드는 반환값을 무시하여 output 설정이 아예 불가능했던 점을 고려하면, 이번 수정은 근본적인 버그를 해결했습니다.
- `run_agent_stream`에서 모든 예외 처리 경로(6개의 litellm 예외 + 일반 Exception)에 대해 `_stream_output`을 설정한 것은 철저한 접근 방식입니다. 예외 발생 시에도 LangSmith에 의미 있는 output이 기록되도록 보장합니다.
- `BaseException` 핸들러에서 `_trace_ctx.__exit__()` 호출 후 `_trace_ctx = None`으로 설정하여 `finally` 블록에서의 중복 호출을 방지한 것은 좋은 방어 패턴입니다.

---

### agent/requirements.txt

**변경 내용:**
- `langsmith>=0.2.0`에서 `langsmith>=0.7.18,<1.0.0`으로 버전 제약 변경

---

**[PROBLEM] 발견된 문제:**

**1. [의존성 관리 - Medium] 버전 상한선 설정 근거 부재**

langsmith 버전 상한선을 `<1.0.0`으로 설정한 근거가 코드나 커밋 메시지에 명시되어 있지 않습니다. `_run_tree.outputs` API는 langsmith 0.7.x에서 도입된 기능으로 보이는데, 상한선을 1.0.0 미만으로 설정한 것은 Semantic Versioning 관점에서 타당해 보이나, 향후 langsmith 1.0.0이 릴리스될 경우 호환성 문제로 업그레이드가 차단됩니다.

**수정 코드 제시**:
```
langsmith>=0.7.18,<1.0.0  # _run_tree.outputs API 필요 (0.7.x). 1.x 호환성 확인 후 상한 조정 필요
```

---

**[GOOD] 잘된 점:**
- 하한선을 `>=0.2.0`에서 `>=0.7.18`로 상향 조정한 것은 `_run_tree.outputs` API가 0.7.x에서 도입되었을 가능성을 고려할 때 적절합니다. 또한 상한선을 설정하여 예기치 않은 API 변경으로부터 보호합니다.

---

## 보안 분석

**발견된 보안 취약점:**

1. **민감 정보 노출 가능성 (Medium)**: `_run_tree.outputs = {"response": answer}`에서 `answer` 변수에는 사용자 질문에 대한 AI 응답이 포함됩니다. 이 데이터가 LangSmith(외부 SaaS)로 전송되므로, 응답에 PII(개인식별정보)가 포함될 경우 데이터 유출로 이어질 수 있습니다.

   **공격 시나리오**: 사용자가 질문에 개인정보(학생 이름, 학교명, 학번 등)를 포함하면, AI 응답에도 해당 정보가 반영될 수 있으며, 이 데이터가 LangSmith 대시보드에 기록되어 제3자(Visang 내부 개발자/관리자)가 열람 가능합니다.

   **수정 방법**: `mask_pii_data` 유틸리티를 사용하여 LangSmith output에 기록하기 전에 PII를 마스킹하거나, output 데이터를 최소화(예: 응답 길이만 기록)하는 옵션을 고려해야 합니다.

**보안 체크리스트:**
- [x] 인증/인가 검증 - LangSmith API 키 기반 인증
- [ ] 입력 검증 및 Sanitization - PII 마스킹 누락 가능성
- [x] 민감 정보 보호 - 부분적 (PII 필터는 `_build_messages`에서만 사용)
- [ ] HTTPS/암호화 사용 - LangSmith SDK가 처리

---

## 버그 가능성 분석

**잠재적 버그:**

1. **`run_agent_stream`의 `_stream_output` 초기값 문제 (High)**: `_stream_output = ""`으로 초기화되어 있으나, 스트림 처리 로직 진입 전에 `BaseException`이 발생하면 빈 문자열이 output으로 기록됩니다. 이는 정상 응답과 구분이 불가능합니다.

2. **`run_agent`의 `finally` 블록에서 `_run_tree.outputs` 설정 시점 (Low)**: `_trace_ctx.__exit__()` 호출 전에 `_run_tree.outputs`를 설정하지만, LangSmith SDK가 `__exit__()` 시점에 output을 읽어갈지, 아니면 설정 시점에 즉시 반영하는지에 따라 동작이 달라질 수 있습니다. LangSmith SDK 문서 확인이 필요합니다.

**Edge Case 검증:**
- [x] Null/Undefined 처리 - `_run_tree is not None` 체크로 방어
- [ ] 빈 배열/객체 처리 - `_stream_output`이 빈 문자열일 때 처리 누락
- [ ] 경계값 (0, 음수, 최대값) - 해당 없음
- [x] 동시성 문제 - `_stream_output`이 단일 스레드 async 컨텍스트에서만 사용되므로 안전

---

## 성능 분석

**성능 이슈:**
1. **불필요한 객체 할당 (Low)**: `_run_tree.outputs = {"response": answer}`는 매 요청마다 새로운 딕셔너리를 생성합니다. 이는 성능에 큰 영향을 주지 않으나, 고빈도 호출 시 미미한 GC 부하를 유발할 수 있습니다.

**성능 체크리스트:**
- [x] 불필요한 연산 제거 - 최소한의 변경으로 목적 달성
- [ ] 캐싱 활용 - 해당 없음
- [x] 비동기 처리 - 기존 async 패턴 유지
- [x] 메모리 효율성 - 영향 없음

---

## 코드 품질 평가
- **가독성**: 7/10 - 중첩 try-except 구조로 인해 예외 처리 흐름 파악이 어려움
- **유지보수성**: 6/10 - `run_agent_stream`의 중첩 예외 처리 구조와 `_stream_output` 설정의 중복 코드가 유지보수를 어렵게 함
- **테스트 커버리지**: 평가 불가 - 테스트 코드가 제공되지 않음
- **문서화**: 8/10 - 커밋 메시지와 주석이 변경 목적을 명확히 설명

---

## 개선 제안 (우선순위별)

### 필수 (Must Fix)
1. **`run_agent_stream`의 `BaseException` 핸들러에서 `_stream_output`이 빈 문자열일 때 방어 로직 추가** - `_stream_output or "응답을 생성하지 못했습니다."` 패턴으로 빈 문자열 방어
2. **`run_agent_stream`의 중첩 try-except 구조 리팩토링** - 예외 처리 흐름 단순화 및 `_stream_output` 설정 누락 방지

### 권장 (Should Fix)
1. **LangSmith output에 PII 마스킹 적용** - `mask_pii_data`를 활용하여 output 데이터 보호
2. **`requirements.txt`에 버전 제약 근거 주석 추가** - 향후 유지보수성을 위한 문서화

### 선택 (Nice to Have)
1. **`run_agent`와 `run_agent_stream` 간 output 설정 패턴 통일** - 일관된 코드 스타일 유지
2. **`_stream_output` 초기값을 의미 있는 기본 메시지로 변경** - 예외 발생 시에도 의미 있는 output 보장

---

## 최종 평가

**종합 점수**: 72/100

**결론**:
- [ ] [OK] **승인 (Approved)** - 문제 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - 경미한 이슈만 존재
- [x] [FIX] **수정 필요 (Changes Requested)** - 중요 이슈 수정 후 재검토
- [ ] [REJECT] **거부 (Rejected)** - 치명적 이슈로 인한 병합 불가

**핵심 코멘트:**

이 커밋은 LangSmith Run output 미전송이라는 실제 버그를 해결하는 유효한 수정입니다. `_run_tree` 변수 도입과 `_stream_output` 추적은 올바른 방향의 개선입니다. 특히 기존 코드가 `__enter__()`의 반환값을 완전히 무시하고 있었다는 점을 고려하면, 이번 수정은 LangSmith tracing의 핵심 기능을 정상화하는 중요한 변경입니다.

그러나 다음과 같은 문제들이 발견되어 **수정 필요(Changes Requested)** 상태로 판정합니다:

1. **`run_agent_stream`의 `BaseException` 핸들러에서 `_stream_output`이 빈 문자열일 때 output이 왜곡되는 문제**는 즉시 수정이 필요합니다. `_stream_output or "응답을 생성하지 못했습니다."` 패턴으로 방어 로직을 추가해야 합니다.

2. **중첩 try-except 구조**는 예외 처리 흐름을 복잡하게 만들어 유지보수성을 저하시킵니다. 내부 예외 처리에서 `_stream_output` 설정 후 `return` 또는 `break`로 빠져나오는 방식으로 리팩토링하는 것이 좋습니다.

3. **LangSmith가 외부 SaaS임을 고려할 때**, output 데이터에 PII가 포함되지 않도록 마스킹 처리를 적용하는 것이 보안 측면에서 권장됩니다. 현재 `_build_messages` 메서드에서만 `mask_pii_data`를 사용하고 있어, LangSmith output에는 원본 데이터가 그대로 전송될 위험이 있습니다.

**리뷰어 노트:**
- 검토 시간: 약 20분
- 우선 수정 항목:
  1. `run_agent_stream`의 `BaseException` 핸들러에서 `_stream_output` 빈 문자열 방어 로직 추가
  2. `run_agent_stream`의 중첩 try-except 구조 리팩토링 (예외 처리 흐름 단순화)
  3. LangSmith output PII 마스킹 적용 검토