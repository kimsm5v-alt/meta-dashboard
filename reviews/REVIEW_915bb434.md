> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 915bb434

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 1개


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

이 커밋은 LangSmith 트레이싱 시스템에 오류 정보를 정확히 전달하기 위한 observability 개선입니다. 기존에는 `_run_tree.outputs` 속성에 직접 할당하는 방식으로 트레이스에 응답만 기록했으나, 예외 발생 시 오류 정보가 LangSmith에 전달되지 않아 장애 대응과 모니터링에 사각지대가 있었습니다.

- **목적**: LangSmith 트레이스에 예외 타입별 오류 정보를 포함시켜 observability(관측 가능성) 향상
- **도메인**: Observability / 모니터링 인프라 (LangSmith 트레이싱)
- **변경 방향**: `_run_tree.outputs` 속성 직접 할당 방식에서 `_run_tree.end(outputs=..., error=...)` 메서드 호출 방식으로 전환하고, `sys.exc_info()` 의존성을 제거하여 LangSmith SDK의 정식 API를 사용

---

## [GOOD] 잘된 점

**1. LangSmith SDK 정식 API 사용**

`_run_tree.outputs = ...` (속성 직접 할당)에서 `_run_tree.end(outputs=..., error=...)` (메서드 호출)로 변경하여 SDK의 공식 인터페이스를 사용하게 되었습니다. 속성에 직접 값을 할당하는 방식은 SDK 내부 구현에 의존하는 비공식적인 방법으로, SDK 버전 업그레이드 시 속성명이 변경되거나 제거될 경우 호환성 문제가 발생할 수 있습니다. `end()` 메서드는 SDK가 공식적으로 제공하는 인터페이스이므로 향후 호환성이 보장됩니다.

**2. 예외 타입별 오류 메시지 구조화**

`_langsmith_error` 변수에 `f"AuthenticationError: {e}"` 형태로 예외 타입명을 prefix로 포함시킨 점이 좋습니다. LangSmith 대시보드에서 오류 유형별로 필터링하거나 집계할 때 예외 타입명이 prefix로 포함되어 있으면 문자열 검색만으로도 손쉽게 분류할 수 있습니다. 예를 들어 `"AuthenticationError"`로 검색하면 모든 인증 오류를 한 번에 조회할 수 있습니다.

**3. `sys.exc_info()` 의존성 제거**

`finally` 블록에서 `sys.exc_info()`를 호출하던 방식을 `__exit__(None, None, None)`으로 변경하여 불필요한 모듈 임포트(`import sys`)를 제거했습니다. `sys.exc_info()`는 현재 스레드에서 처리 중인 예외 정보를 반환하는데, `finally` 블록에서 예외가 없을 때는 항상 `(None, None, None)`을 반환합니다. 따라서 `__exit__(None, None, None)`은 동등한 동작을 보장하면서도 더 명시적이고 가독성이 좋습니다.

---

## 변경사항 요약

- `run_agent`와 `run_agent_stream` 두 메서드 모두에 `_langsmith_error: str | None = None` 변수를 도입
- 각 예외 처리 블록(`AuthenticationError`, `RateLimitError`, `Timeout`, `APIError`, `Exception`)에서 `_langsmith_error`에 오류 정보 저장
- `finally` 블록에서 `_run_tree.outputs = {"response": answer}` → `_run_tree.end(outputs={"response": answer}, error=_langsmith_error)`로 변경
- `_trace_ctx.__exit__(*sys.exc_info())` → `_trace_ctx.__exit__(None, None, None)`로 변경하고 `import sys` 제거

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `run_agent_stream`의 `except BaseException` 블록에서 `_langsmith_error`가 None일 가능성**

- **위치**: `agent/app/services/agent_service.py`, 라인 418-427
- **심각도**: High
- **영향 범위**: `GeneratorExit`, `KeyboardInterrupt`, `SystemExit` 등 일반 `Exception`을 상속하지 않는 예외가 발생할 경우 LangSmith에 오류 정보가 기록되지 않음

**문제 분석**:

`run_agent_stream` 메서드는 다음과 같은 예외 처리 구조를 가집니다:

```
try:                          # 외부 try (라인 289)
    try:                      # 내부 try (라인 296)
        ...                   # 정상 실행 로직
    except litellm.exceptions.AuthenticationError:  # 내부 except 블록들
        _langsmith_error = "AuthenticationError: ..."
    except Exception:
        _langsmith_error = "UnexpectedError: ..."
except BaseException:         # 외부 except (라인 418)
    _run_tree.end(error=_langsmith_error)
    raise
finally:                      # finally (라인 428)
    _run_tree.end(error=_langsmith_error)
```

문제는 `except BaseException` 블록입니다. `BaseException`은 Python의 모든 내장 예외의 최상위 클래스로, `GeneratorExit`(제너레이터가 `close()`로 종료될 때), `KeyboardInterrupt`(Ctrl+C), `SystemExit`(`sys.exit()`) 등을 포함합니다. 이러한 예외가 발생하면 내부 `try-except` 블록을 거치지 않고 곧바로 외부 `except BaseException` 블록으로 진입합니다.

이 경우 `_langsmith_error`는 초기값 `None`인 상태로 `_run_tree.end(error=None)`이 호출됩니다. 즉, 오류가 발생했음에도 LangSmith에는 오류 정보가 전혀 기록되지 않습니다.

**해결 방안**:

`except BaseException` 블록에서 `_langsmith_error`가 None이면 현재 예외 객체를 활용하여 오류 문자열을 생성합니다.

```python
        except BaseException as be:
            if _trace_ctx is not None:
                if _run_tree is not None:
                    _run_tree.end(
                        outputs={"response": _stream_output or "응답을 생성하지 못했습니다."},
                        error=_langsmith_error or f"BaseException: {be}",
                    )
                _trace_ctx.__exit__(None, None, None)
                _trace_ctx = None
            raise
```

변경 사항:
1. `except BaseException:` → `except BaseException as be:` : 예외 객체를 변수에 바인딩
2. `error=_langsmith_error` → `error=_langsmith_error or f"BaseException: {be}"` : `_langsmith_error`가 None이면 현재 예외로 대체

`_langsmith_error or ...` 패턴을 사용하면 기존에 설정된 값이 있으면 우선 사용하고, 없으면 현재 예외로 대체하므로 기존 동작을 전혀 침해하지 않습니다.

### Medium (개선 권장)

없음. 현재 구현은 목적에 부합하며, 위 High 이슈만 해결하면 충분한 품질을 확보합니다.

---

## 주요 파일 분석

### `agent/app/services/agent_service.py`

**변경 내용**:
LangSmith 트레이싱에 오류 정보를 포함시키기 위해 `_langsmith_error` 변수 도입 및 `_run_tree.end()` 메서드 사용으로 전환

**변경 전후 비교**:

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 오류 정보 저장 | 없음 | `_langsmith_error` 변수에 예외 타입별 메시지 저장 |
| 트레이스 종료 | `_run_tree.outputs = {"response": answer}` | `_run_tree.end(outputs={"response": answer}, error=_langsmith_error)` |
| 컨텍스트 종료 | `_trace_ctx.__exit__(*sys.exc_info())` | `_trace_ctx.__exit__(None, None, None)` |
| 모듈 임포트 | `import sys` | 제거됨 |

**개선 제안**:

1. **`except BaseException` 블록에서 `_langsmith_error` fallback 처리 (High)**
   - **위치 (라인 번호)**: 418-427
   - **기존 코드**:
   ```python
           except BaseException:
               if _trace_ctx is not None:
                   if _run_tree is not None:
                       _run_tree.end(
                           outputs={"response": _stream_output or "응답을 생성하지 못했습니다."},
                           error=_langsmith_error,
                       )
                   _trace_ctx.__exit__(None, None, None)
                   _trace_ctx = None
               raise
   ```
   - **해결 방안 (수정 코드)**:
   ```python
           except BaseException as be:
               if _trace_ctx is not None:
                   if _run_tree is not None:
                       _run_tree.end(
                           outputs={"response": _stream_output or "응답을 생성하지 못했습니다."},
                           error=_langsmith_error or f"BaseException: {be}",
                       )
                   _trace_ctx.__exit__(None, None, None)
                   _trace_ctx = None
               raise
   ```

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견**:

전반적으로 LangSmith 트레이싱의 오류 전달을 개선한 좋은 변경입니다. `import sys` 제거와 SDK 정식 API 사용으로 코드 품질이 향상되었고, 예외 타입별 오류 메시지를 구조화하여 모니터링 효율을 높였습니다.

다만 `except BaseException` 블록에서 `_langsmith_error`가 None인 경우를 대비한 fallback 처리가 필요합니다. `GeneratorExit`이나 `KeyboardInterrupt` 같은 예외가 발생하면 내부 try-except 블록을 거치지 않고 바로 `except BaseException`으로 진입하기 때문에, 현재 구현에서는 해당 오류가 LangSmith에 기록되지 않습니다. 위에서 제안한 간단한 수정(예외 객체 `be`를 `as be`로 바인딩하고 `_langsmith_error or f"BaseException: {be}"`로 fallback)으로 이 문제를 해결할 수 있습니다. 이 수정은 단 2줄만 변경하면 되며, 기존 로직에 전혀 영향을 주지 않습니다.