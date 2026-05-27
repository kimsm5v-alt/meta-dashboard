> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 58d44ffa

## 코드 복잡도 분석

**분석된 파일**: 2개 / 변경된 파일: 4개


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

이 커밋은 AI Agent 시스템의 LLM 라우팅 아키텍처를 단일 프로바이더(Gemini)에서 **Primary-Fallback 이중 프로바이더 구조(OpenAI + Gemini)**로 전환하는 핵심 변경입니다.

- **목적**: OpenAI를 기본 모델로 사용하고, 장애 시 Gemini로 자동 폴백(fallback)되는 탄력적인 LLM 호출 구조 구현
- **도메인**: AI Agent 인프라 (LLM 오케스트레이션)
- **변경 방향**: 하드코딩된 단일 모델명 -> 동적 라우팅 + 자동 폴백 + 세분화된 예외 처리

---

## [GOOD] 잘된 점

**1. 모델명 상수화 및 중앙 관리**

기존에는 `agent_service.py`에서 `"meta-agent-service"`라는 하드코딩된 문자열을 직접 사용했습니다. 이번 변경으로 `llm_router.py`에서 `MODEL_NAME_PRIMARY = "meta-agent-primary"`, `MODEL_NAME_FALLBACK = "meta-agent-fallback"` 상수를 정의하고, `ROUTER_MODEL_NAME` 변수를 통해 AgentService가 단일 논리명만 바라보게 한 설계가 깔끔합니다. AgentService는 더 이상 어떤 프로바이더가 활성화되었는지 알 필요 없이 `ROUTER_MODEL_NAME`만 사용하면 됩니다.

```python
# llm_router.py (모듈 최하단)
_call_model = MODEL_NAME_PRIMARY if has_primary else MODEL_NAME_FALLBACK
ROUTER_MODEL_NAME = _call_model
```

```python
# agent_service.py
from app.core.llm_router import llm_router, ROUTER_MODEL_NAME

response = await self.router.acompletion(
    model=ROUTER_MODEL_NAME,  # 이전: "meta-agent-service"
    messages=messages,
    tools=self.tools
)
```

**2. LiteLLM fallbacks 정책 활용**

`Router(fallbacks=...)` 파라미터를 통해 OpenAI 호출 실패 시 Gemini로 자동 전환되는 구조를 LiteLLM 네이티브 기능으로 구현했습니다. 이는 수동 재시도 로직을 작성하는 것보다 훨씬 안정적이고 LiteLLM의 내부 재시도 메커니즘과도 자연스럽게 통합됩니다.

```python
_fallbacks = [{MODEL_NAME_PRIMARY: [MODEL_NAME_FALLBACK]}] if (has_primary and has_fallback) else []

llm_router = Router(
    model_list=model_list,
    fallbacks=_fallbacks,
    routing_strategy="least-busy",
    num_retries=3,
    set_verbose=False
)
```

**3. 세분화된 예외 처리**

`run_agent_stream()` 메서드에 `AuthenticationError`, `RateLimitError`, `Timeout`, `APIError` 등 구체적인 litellm 예외 타입별 처리와 사용자 친화적 메시지를 추가하여 장애 대응력을 향상시켰습니다. 특히 각 예외마다 `history.add_user_message()`와 `history.add_ai_message()`를 호출하여 세션 히스토리의 일관성을 유지한 점이 좋습니다.

---

## 변경사항 요약

OpenAI Primary + Gemini Fallback 구조로 LLM 라우터를 재설계하고, AgentService가 동적 모델명(`ROUTER_MODEL_NAME`)을 사용하도록 변경했습니다. 또한 스트리밍 메서드에 세분화된 예외 처리를 추가하고, litellm 버전을 `>=1.85.0`으로 고정했습니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

**없음**

### High (우선 수정 권장)

**없음**

초기 분석에서 `run_agent()` 메서드의 예외 처리 누락을 의심했으나, 실제 파일을 확인한 결과 이미 세분화된 예외 처리가 추가되어 있었습니다. 또한 `history` 중복 기록 문제도 실제 코드 흐름을 추적한 결과 정상 동작함을 확인했습니다.

### Medium (개선 권장)

**1. `gemini_model.replace('gemini/', '')` 방어 로직의 일관성 부재**

- **위치**: `agent/app/core/llm_router.py`, 라인 72
- **문제점**: Gemini 모델명에는 `gemini/` 접두사 중복을 방지하는 `replace('gemini/', '')` 방어 로직이 있습니다. 즉, 누군가 `GEMINI_MODEL=gemini/gemini-3.5-flash`로 설정해도 `f"gemini/{gemini_model}"`에서 `gemini/gemini/gemini-3.5-flash`가 되는 것을 방지합니다. 그러나 OpenAI 모델명(`openai_model`)에는 동일한 방어 로직이 없어 일관성이 떨어집니다.

- **기존 코드**:
```python
# Gemini (방어 로직 있음)
"model": f"gemini/{gemini_model.replace('gemini/', '')}",

# OpenAI (방어 로직 없음)
"model": f"openai/{openai_model}",
```

- **해결 방안**: 두 프로바이더에 동일한 방어 로직을 적용하는 공통 유틸리티 함수를 추출하는 것을 제안합니다.

```python
def _normalize_model_name(provider: str, model: str) -> str:
    """모델명에서 'provider/' 접두사 중복을 제거합니다."""
    prefix = f"{provider}/"
    return model[len(prefix):] if model.startswith(prefix) else model

# 사용 예:
# OpenAI: f"openai/{_normalize_model_name('openai', openai_model)}"
# Gemini: f"gemini/{_normalize_model_name('gemini', gemini_model)}"
```

> **수정 코드 제시 근거**: `read_file`로 `llm_router.py` 전체(117줄)를 읽었고, `_normalize_model_name` 함수는 기존 로직에 영향을 주지 않는 독립적인 유틸리티 함수이므로 부작용이 없음을 확인했습니다.

---

## 주요 파일 분석

### agent/app/core/llm_router.py

**변경 내용**: OpenAI Primary + Gemini Fallback 구조로 전환. `setup_model_list()` 반환값에 `(model_configs, has_primary, has_fallback)` 튜플 추가, LiteLLM Router에 `fallbacks` 정책 적용, `ROUTER_MODEL_NAME` 상수 노출.

**핵심 설계 결정 분석**:

1. **`setup_model_list()`의 반환값 확장**: 기존에는 단순히 `model_configs` 리스트만 반환했으나, 이제 `has_primary`와 `has_fallback` 불리언 값을 함께 반환합니다. 이를 통해 모듈 최상위 레벨에서 `_call_model`과 `_fallbacks`를 동적으로 결정할 수 있게 되었습니다.

2. **`_call_model` 결정 로직**: `has_primary`가 `True`면 `MODEL_NAME_PRIMARY`(OpenAI)를, `False`면 `MODEL_NAME_FALLBACK`(Gemini)를 사용합니다. 이는 OpenAI 키가 없을 때도 시스템이 정상 동작하도록 보장합니다.

3. **`_fallbacks` 조건부 설정**: `has_primary and has_fallback`이 모두 `True`일 때만 fallbacks를 설정합니다. 둘 중 하나라도 없으면 fallbacks는 빈 리스트가 되어 불필요한 폴백 시도를 방지합니다.

### agent/app/services/agent_service.py

**변경 내용**: 하드코딩된 `"meta-agent-service"`를 `ROUTER_MODEL_NAME`으로 대체. `run_agent_stream()`에 litellm 세부 예외 처리 4종 추가.

**예외 처리 계층 구조 분석**:

```python
try:
    while iterations < self.max_iterations:
        # ... 정상 실행 로직 ...
except litellm.exceptions.AuthenticationError as e:
    # API 키 인증 오류 -> 관리자 문구
except litellm.exceptions.RateLimitError as e:
    # Rate limit 초과 -> 서비스 제한 문구
except litellm.exceptions.Timeout as e:
    # 응답 시간 초과 -> 타임아웃 문구
except litellm.exceptions.APIError as e:
    # 일반 API 오류 -> 연동 오류 문구
except Exception as e:
    # 기타 예상치 못한 오류 -> fallback 메시지
```

각 예외 타입별로 구체적인 사용자 메시지를 제공하고, 모든 분기에서 `history.add_user_message()` + `history.add_ai_message()`를 호출하여 세션 히스토리 일관성을 유지합니다. 또한 `yield`를 통해 스트리밍 응답으로도 오류 메시지를 전달합니다.

### agent/.env.example

**변경 내용**: OpenAI 설정 활성화, Gemini 모델 버전 업데이트(`gemini-2.5-flash` -> `gemini-3.5-flash`), 다중 키 사용 예시 추가.

### agent/requirements.txt

**변경 내용**: `litellm` 버전을 `>=1.85.0`으로 고정. LiteLLM 1.85.0 이상에서 `fallbacks` 파라미터가 안정적으로 지원되므로, 이 버전 고정은 필수적입니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [x] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [ ] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견**:

전반적으로 잘 설계된 변경입니다. Primary-Fallback 구조 도입으로 장애 내성이 향상되었고, 모델명 상수화로 관심사 분리가 명확해졌습니다. `run_agent_stream()`에 추가된 세분화된 예외 처리는 프로덕션 환경에서의 장애 대응력을 크게 높여줍니다.

`gemini_model.replace('gemini/', '')` 방어 로직의 일관성 문제(Medium)는 실제 운영 환경에서 문제가 발생할 가능성은 낮지만, 코드 일관성 측면에서 개선을 권장합니다. 이 외에는 명백한 버그나 성능 저하 요소가 발견되지 않았으므로 조건부 승인합니다.