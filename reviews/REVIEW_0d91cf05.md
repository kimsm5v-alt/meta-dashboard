> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 0d91cf05

## 코드 복잡도 분석

**분석된 파일**: 2개 / 변경된 파일: 2개


### 정상 범위 (NONE)


**`llm_router.py`** (other)

- 평균 복잡도: **0.238**

- 최대 복잡도: 0.469

- 청크 수: 2개

- 평균 사용처: 9.0곳


**권장사항:**

- 복잡도 정상 범위


**`agent_service.py`** (other)

- 평균 복잡도: **0.200**

- 최대 복잡도: 0.464

- 청크 수: 7개

- 평균 사용처: 8.0곳


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 LangSmith 트레이싱 인프라를 LiteLLM 레벨과 애플리케이션 레벨에 동시에 통합하기 위한 변경입니다.

- **목적**: LLM 호출(Tool Calling 포함)의 전체 실행 경로를 LangSmith에 기록하여 디버깅, 성능 분석, 비용 추적이 가능하도록 관측 가능성(Observability)을 확보
- **도메인**: 인프라 / 모니터링 (Observability)
- **변경 방향**: 기존에는 LangSmith SDK가 모듈 레벨(`tracing.py`)에서만 초기화되고 있었으나, 실제 LLM 호출과 Tool 실행을 LangSmith Run 계층 구조로 연결하지 못했음. 이번 변경으로 (1) LiteLLM의 success/failure 콜백에 LangSmith를 등록하고, (2) Tool 호출을 명시적인 자식 Run으로 래핑하며, (3) LiteLLM acompletion 호출 시 `metadata`에 부모 Run ID를 전달하여 전체 호출 체인이 하나의 Trace로 연결되도록 개선

---

## [GOOD] 잘된 점

1. **계층적 트레이싱 구조 설계**: `run_agent` / `run_agent_stream` (부모 Run) -> LiteLLM acompletion (자식 Run, LiteLLM 콜백 자동) -> Tool 호출 (`_invoke_tool_with_tracing`의 명시적 자식 Run)으로 이어지는 3계층 Trace 구조를 의도적으로 설계한 점이 명확합니다. 이는 LangSmith의 Run 트리 모델에 정확히 대응됩니다.

2. **중복 코드 제거 (DRY)**: 기존에는 `run_agent`와 `run_agent_stream` 두 메서드에서 Tool 호출 로직(`if func_name in self.tool_map: ... else: ...`)이 중복되어 있었습니다. `_invoke_tool_with_tracing` 메서드로 추출하여 중복을 제거하고, 동시에 트레이싱 기능을 추가한 것은 좋은 리팩토링입니다.

3. **조건부 활성화**: LangSmith 트레이싱이 환경 변수(`LANGSMITH_TRACING`, `LANGSMITH_API_KEY`)에 의해서만 활성화되도록 설계되어, 개발 환경에서는 부담 없이 사용하고 프로덕션에서도 필요 시 켤 수 있는 유연성을 확보했습니다.

---

## 변경사항 요약

- `llm_router.py`: 모듈 최상단에 `import litellm` 추가, `litellm.success_callback` / `failure_callback`에 "langsmith"를 조건부로 등록
- `agent_service.py`: `_invoke_tool_with_tracing` 메서드 신규 추가, `run_agent`와 `run_agent_stream`의 Tool 호출부를 이 메서드로 대체, LiteLLM acompletion 호출 시 `metadata`에 `parent_run_id`와 `trace_id` 전달

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

**없음**

### High (우선 수정 권장)

**1. `llm_router.py`의 LangSmith 콜백 등록 시점 문제**

- **위치**: `agent/app/core/llm_router.py`, 라인 108-119
- **문제**: `litellm.success_callback.append("langsmith")`가 모듈 로드 시점(import 시)에 실행됩니다. 그런데 `tracing.py`의 `initialize()` 함수는 `main.py`의 `lifespan`에서 호출됩니다. 즉, `llm_router.py`가 import되는 시점에는 `tracing.py`의 `setup_langsmith()`가 아직 실행되지 않았을 수 있습니다. `tracing.py`의 `setup_langsmith()`는 `LANGSMITH_TRACING`, `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT` 환경변수를 `os.environ`에 설정하는데, 이 설정이 완료되기 전에 `llm_router.py`가 실행되면 환경변수 읽기에 실패할 수 있습니다.

- **기존 코드**:
```python
# llm_router.py, 라인 108-119
_langsmith_tracing = os.getenv("LANGSMITH_TRACING", "false").lower() == "true"
_langsmith_api_key = os.getenv("LANGSMITH_API_KEY", "").strip()

if _langsmith_tracing and _langsmith_api_key:
    if "langsmith" not in litellm.success_callback:
        litellm.success_callback.append("langsmith")
    if "langsmith" not in litellm.failure_callback:
        litellm.failure_callback.append("langsmith")
    logger.info("LiteLLM LangSmith 콜백 등록 완료.")
```

- **해결 방안 (수정 코드)**: `llm_router.py`의 LangSmith 콜백 등록 로직을 모듈 레벨에서 제거하고, `tracing.py`의 `setup_langsmith()` 또는 `initialize()` 함수 내부로 이동하여 실행 순서를 보장하세요.

```python
# tracing.py, setup_langsmith() 함수 내부에 추가
import litellm

def setup_langsmith() -> bool:
    tracing_flag = os.getenv("LANGSMITH_TRACING", "false").lower()
    api_key = os.getenv("LANGSMITH_API_KEY", "").strip()

    if tracing_flag != "true" or not api_key:
        logger.info("LangSmith 트레이싱 비활성화 (LANGSMITH_TRACING != true 또는 API 키 미설정).")
        return False

    project_name = _build_project_name()
    os.environ["LANGSMITH_TRACING"] = "true"
    os.environ["LANGSMITH_API_KEY"] = api_key
    os.environ["LANGSMITH_PROJECT"] = project_name
    endpoint = os.getenv("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")
    os.environ["LANGSMITH_ENDPOINT"] = endpoint

    # LiteLLM LangSmith 콜백 등록 (환경변수 설정 후에 실행)
    if "langsmith" not in litellm.success_callback:
        litellm.success_callback.append("langsmith")
    if "langsmith" not in litellm.failure_callback:
        litellm.failure_callback.append("langsmith")
    logger.info("LiteLLM LangSmith 콜백 등록 완료.")

    logger.info(f"LangSmith 트레이싱 활성화: project={project_name}, endpoint={endpoint}")
    return True
```

그리고 `llm_router.py`에서는 해당 코드 블록을 제거하세요.

> **[수정 코드 제시 의무 절차 이행 확인]**
> 1. `read_file` 도구로 `llm_router.py` 전체(131줄)와 `tracing.py` 전체(77줄)를 읽었습니다.
> 2. `main.py`의 `lifespan`에서 `tracing.initialize()`가 호출되는 패턴을 확인했습니다. `llm_router.py`는 `agent_service.py`에서 `from app.core.llm_router import llm_router`로 import되므로, `initialize()` 호출보다 먼저 실행됩니다.
> 3. 수정 후 `litellm.success_callback` 등록이 `setup_langsmith()` 내부로 이동되므로, 환경변수 설정이 완료된 후에 콜백이 등록됩니다. `litellm` import는 `tracing.py` 최상단에 추가하면 되며, 다른 모듈에 부작용이 없음을 확인했습니다.

---

**2. `_invoke_tool_with_tracing`의 `child_run.end()` 호출 시점 문제**

- **위치**: `agent/app/services/agent_service.py`, 라인 67-70
- **문제**: `child_run.end()`가 `finally` 블록에서 호출되지만, `child_run`이 `None`인 경우(`langsmith_is_enabled()`가 False이거나 `run_tree`가 None인 경우)에도 `child_ctx.__exit__()`는 호출되지 않도록 보호되고 있습니다. 그러나 `child_run.end()` 호출 시 `error` 파라미터에 `error_msg`를 전달하는데, `error_msg`는 Tool이 정상 실행된 경우 `None`이고, Tool이 없거나 예외가 발생한 경우에만 문자열이 할당됩니다. 이는 LangSmith SDK의 `end()` 시그니처와 일치하므로 문제는 없습니다.

- **잠재적 이슈**: `child_ctx.__enter__()`가 성공했지만 `child_run`이 `None`인 경우는 LangSmith SDK에서 발생할 수 있는 드문 케이스입니다. 현재 코드는 `child_run is not None` 조건으로 보호하고 있으나, `child_ctx.__exit__()`는 `child_ctx is not None` 조건만으로 호출됩니다. 만약 `__enter__()`에서 예외가 발생하면 `child_run`이 할당되지 않은 상태에서 `child_ctx.__exit__()`가 호출될 수 있습니다.

- **기존 코드**:
```python
# agent_service.py, 라인 44-76
child_ctx = None
child_run = None

if langsmith_is_enabled() and run_tree is not None:
    child_ctx = langsmith.trace(
        name=f"tool:{func_name}",
        inputs={"arguments": arguments},
        tags=["tool"],
        parent=run_tree,
    )
    child_run = child_ctx.__enter__()

result_str = ""
error_msg = None
try:
    # ... tool 실행 ...
finally:
    if child_ctx is not None:
        if child_run is not None:
            child_run.end(
                outputs={"result": result_str},
                error=error_msg,
            )
        child_ctx.__exit__(None, None, None)
```

- **해결 방안 (수정 코드)**: `__enter__()` 호출을 try 블록 밖에서 명시적으로 처리하고, `__enter__()` 실패 시 `child_ctx`를 None으로 설정하여 `finally`에서 `__exit__()`이 호출되지 않도록 보호하세요.

```python
# agent_service.py, _invoke_tool_with_tracing 메서드
async def _invoke_tool_with_tracing(
    self, func_name: str, arguments: dict, run_tree=None
) -> str:
    child_ctx = None
    child_run = None

    if langsmith_is_enabled() and run_tree is not None:
        child_ctx = langsmith.trace(
            name=f"tool:{func_name}",
            inputs={"arguments": arguments},
            tags=["tool"],
            parent=run_tree,
        )
        try:
            child_run = child_ctx.__enter__()
        except Exception:
            child_ctx = None  # __enter__() 실패 시 __exit__() 호출 방지
            raise

    result_str = ""
    error_msg = None
    try:
        if func_name in self.tool_map:
            result = await self.tool_map[func_name].ainvoke(arguments)
            result_str = json.dumps(result, ensure_ascii=False)
        else:
            error_msg = f"Tool {func_name} not found"
            result_str = json.dumps({"error": error_msg})
    except Exception as e:
        logger.error(f"Tool error ({func_name}): {e}", exc_info=True)
        error_msg = str(e)
        result_str = json.dumps({"error": error_msg})
    finally:
        if child_ctx is not None:
            if child_run is not None:
                child_run.end(
                    outputs={"result": result_str},
                    error=error_msg,
                )
            child_ctx.__exit__(None, None, None)

    return result_str
```

> **[수정 코드 제시 의무 절차 이행 확인]**
> 1. `read_file` 도구로 `agent_service.py`의 `_invoke_tool_with_tracing` 메서드 전체(라인 30-76)를 읽었습니다.
> 2. `__enter__()` 호출이 try 블록 밖에 있고, 예외 발생 시 `child_run`이 할당되지 않은 상태에서 `finally` 블록이 실행되는 경로를 추적했습니다.
> 3. 수정 후 `__enter__()` 실패 시 `child_ctx`를 None으로 설정하여 `finally`에서 `__exit__()`이 호출되지 않도록 보호합니다. 이는 context manager 프로토콜의 안전한 사용 패턴입니다.

---

### Medium (개선 권장)

**1. `_ls_meta` 딕셔너리 중복 생성**

- **위치**: `agent_service.py`, 라인 220-226 (`run_agent`) 및 라인 345-351 (`run_agent_stream`)
- **문제**: `_ls_meta` 딕셔너리가 `run_agent`와 `run_agent_stream`에서 동일한 로직으로 중복 생성되고 있습니다. 또한 `langsmith_is_enabled()`와 `_run_tree is not None` 조건이 두 번 검사됩니다(한 번은 `_trace_ctx` 생성 시, 한 번은 `_ls_meta` 생성 시).

- **개선 제안**: `_ls_meta` 생성을 별도 메서드로 추출하거나, `_trace_ctx` 생성 직후에 `_run_tree`가 유효한 경우 바로 `_ls_meta`를 계산하여 저장하는 방식으로 중복을 제거할 수 있습니다. 단, 이는 사소한 중복이므로 현재 상태로도 무방합니다.

**2. `llm_router.py`의 `import litellm` 위치**

- **위치**: `llm_router.py`, 라인 3
- **문제**: `import litellm`이 추가되었는데, 기존에 `from litellm import Router`가 이미 있었습니다. `litellm` 모듈은 이미 `from litellm import Router`를 통해 간접적으로 import되어 있었으므로, `import litellm`을 별도로 추가한 것은 명시성을 높이기 위한 것으로 이해됩니다. 그러나 `litellm.success_callback`에 접근하기 위해 `import litellm`이 필요하므로, 이는 올바른 변경입니다.

---

## 주요 파일 분석

### `agent/app/core/llm_router.py`

**변경 내용:**
`import litellm` 추가 및 LangSmith 콜백 등록 로직 추가 (모듈 레벨)

**개선 제안:**
1. **LangSmith 콜백 등록 시점을 `tracing.py`의 `setup_langsmith()`로 이동** (위 High 이슈 #1 참조)
   - **위치**: 라인 108-119
   - **이유**: 모듈 import 시점과 `initialize()` 호출 시점 간의 실행 순서 불일치로 인해 환경변수가 올바르게 설정되지 않은 상태에서 콜백 등록이 시도될 수 있음

### `agent/app/services/agent_service.py`

**변경 내용:**
`_invoke_tool_with_tracing` 메서드 신규 추가, Tool 호출부 리팩토링, LiteLLM 호출 시 `metadata`에 부모 Run 정보 전달

**개선 제안:**
1. **`_invoke_tool_with_tracing`의 `__enter__()` 예외 처리 강화** (위 High 이슈 #2 참조)
   - **위치**: 라인 44-76
   - **이유**: `__enter__()` 실패 시 `finally` 블록에서 `__exit__()`이 호출되는 것을 방지

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**
전반적으로 LangSmith 트레이싱 통합을 위한 아키텍처 설계는 잘 되어 있습니다. 계층적 Run 구조, 조건부 활성화, 중복 코드 제거 등 좋은 결정들이 많습니다. 그러나 `llm_router.py`의 LangSmith 콜백 등록 시점 문제는 실제 운영 환경에서 트레이싱이 의도대로 동작하지 않을 수 있는 잠재적 버그입니다. `tracing.py`의 `setup_langsmith()`로 콜백 등록 로직을 이동하여 실행 순서를 보장하는 것을 권장합니다. 이 한 가지만 수정하면 바로 승인 가능한 수준입니다.