> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 6c4a9e54

## 코드 복잡도 분석

**분석된 파일**: 2개 / 변경된 파일: 5개


### 정상 범위 (NONE)


**`agent_service.py`** (other)

- 평균 복잡도: **0.110**

- 최대 복잡도: 0.464

- 청크 수: 13개

- 평균 사용처: 4.3곳


**권장사항:**

- 복잡도 정상 범위


**`agent_graph.py`** (other)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.007

- 청크 수: 5개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 `agent/app/services/agent_service.py`의 수작업 ReAct 루프(while 반복 제어, litellm 예외 처리 4종 중복, 스트림 tool_call 버퍼링 중복)를 LangGraph `StateGraph` 기반 오케스트레이션으로 대체하는 마이그레이션입니다.

- **목적**: LangGraph 도입을 통해 반복 제어, 메시지 누적, 체크포인트, 트레이싱 등 프레임워크가 표준 제공하는 기능으로 대체하여 중복 코드 제거 및 유지보수성 향상
- **도메인**: AI Agent 오케스트레이션 (백엔드 서비스 레이어)
- **변경 방향**: `MetaAgentService`(레거시)와 동일한 인터페이스를 제공하는 `LangGraphAgentService`를 병행 추가하고, `AGENT_BACKEND` 환경변수로 전환 가능한 feature flag 구조 채택

---

## [GOOD] 잘된 점

**1. 병행 운영 전략의 체계적 설계**

`AGENT_BACKEND=legacy|langgraph` 플래그로 두 구현을 동시에 배치하고, `main.py` 수정 없이 서비스 레벨에서만 분기하여 리스크를 최소화한 점이 우수합니다. 마이그레이션 계획서(`LANGGRAPH_MIGRATION_PLAN.md`)에 검증 체크리스트와 전환 절차까지 상세히 문서화되어 있어 실무적으로 매우 성숙한 접근법입니다.

실제 구현을 보면 `agent_service.py` 하단에서 다음과 같이 모듈 로드 시점에 1회 평가되어 인스턴스가 결정됩니다:

```python
AGENT_BACKEND = os.getenv("AGENT_BACKEND", "legacy").strip().lower()

if AGENT_BACKEND == "langgraph":
    logger.info("AGENT_BACKEND=langgraph: LangGraph 기반 MetaAgentService 사용")
    meta_agent_service = LangGraphAgentService()
else:
    logger.info("AGENT_BACKEND=legacy: 기존 수작업 ReAct 루프 기반 MetaAgentService 사용")
    meta_agent_service = MetaAgentService()
```

이 구조 덕분에 `services/__init__.py`에서 `from .agent_service import meta_agent_service`로 가져오는 모든 호출부(`main.py` 등)가 전혀 수정되지 않습니다.

**2. 기존 자산 최대 재사용**

`llm_router`(LiteLLM Router, 멀티키 로테이션 + 폴백), `neo4j_tools_list`(5개 @tool), `mask_pii_data`, `_build_system_prompt`, `_normalize_tool_args` 등 기존 도메인 로직을 전부 그대로 재사용하면서 LangGraph 노드 함수 안으로 이식한 점이 효율적입니다.

특히 `prebuilt create_react_agent`를 사용하지 않고 커스텀 노드로 구성한 결정이 타당합니다. `llm_router.py`를 보면 `litellm.Router`를 직접 사용하여 OpenAI 멀티키 로테이션 + Gemini 폴백을 구현하고 있는데, 이를 LangChain `ChatModel` 바인딩으로 대체하면 이 로직이 소실되기 때문입니다. `call_model_node`에서 `llm_router.acompletion()`을 직접 호출함으로써 이 정책이 그대로 유지됩니다.

**3. GraphRecursionError 복구 로직의 철저함**

`_recover_from_recursion_limit`에서 `aupdate_state`로 체크포인트를 "완료" 상태로 되돌리는 처리는, 단순 예외 처리만으로는 해결되지 않는 "다음 턴이 중단 지점에 멈추는" 문제를 정확히 인지하고 해결한 고급 패턴입니다.

```python
async def _recover_from_recursion_limit(self, session_id: str) -> None:
    config = {"configurable": {"thread_id": session_id}}
    await self.graph.aupdate_state(
        config,
        {"messages": [AIMessage(content=MAX_ITERATIONS_FALLBACK_MESSAGE)]},
        as_node="call_model",
    )
```

`as_node="call_model"`로 지정하여 폴백 메시지를 `call_model` 노드의 출력인 것처럼 체크포인트에 기록함으로써, `tools_condition`이 `tool_calls` 없는 메시지를 보고 자동으로 `END`로 라우팅하게 만드는 설계가 정교합니다.

---

## 변경사항 요약

| 파일 | 변경 유형 | 설명 |
|---|---|---|
| `agent/app/core/agent_graph.py` | 신규 생성 | StateGraph 정의, call_model/tools 노드, 시스템 프롬프트, LiteLLM 스트리밍 래퍼 |
| `agent/app/services/agent_service.py` | 수정 | LangGraphAgentService 클래스 추가, AGENT_BACKEND 플래그 기반 분기 |
| `agent/.env.example` | 수정 | AGENT_BACKEND 환경변수 추가 (기본값 legacy) |
| `agent/requirements.txt` | 수정 | langgraph>=1.0.5,<2.0.0 의존성 추가 |
| `agent/docs/LANGGRAPH_MIGRATION_PLAN.md` | 신규 생성 | 마이그레이션 계획서 (239줄, 검증 체크리스트 포함) |

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

**없음.** 명백한 버그나 보안 취약점, 데이터 손실 가능성은 발견되지 않았습니다.

---

### High (우선 수정 권장)

**1. `LangGraphAgentService.clear_session`에서 `get_tuple`/`delete_thread` API 시그니처 불일치 가능성**

- **파일**: `agent/app/services/agent_service.py`
- **위치 (라인 번호)**: 577-578

**분석**: `clear_session` 메서드에서 `self.graph.checkpointer.get_tuple(config)`를 호출할 때 `config`는 `{"configurable": {"thread_id": session_id}}` 형태의 dict입니다. 그런데 LangGraph의 `BaseCheckpointSaver` 인터페이스에서 `get_tuple` 메서드가 `config`(RunnableConfig 타입의 dict)를 받는지, 아니면 `thread_id` 문자열을 직접 받는지 확인이 필요합니다.

또한 `self.graph.checkpointer.delete_thread(session_id)`에서 `session_id`가 문자열인데, `MemorySaver.delete_thread`의 시그니처가 문자열을 받는지, 아니면 `config` dict를 요구하는지도 확인이 필요합니다.

**영향**: API 시그니처가 맞지 않으면 `TypeError`가 발생하여 `clear_session` 호출 시 HTTP 500 오류로 이어질 수 있습니다. 세션 초기화가 실패하면 사용자가 대화를 새로 시작할 수 없게 됩니다.

**해결 방안**: LangGraph `MemorySaver`의 실제 소스 코드(`langgraph/checkpoint/memory.py`)를 확인하여 `get_tuple`과 `delete_thread`의 시그니처를 검증한 후 수정이 필요합니다. 만약 `get_tuple`이 `config` dict를 받는다면 현재 코드는 정상이며, `delete_thread`가 `thread_id` 문자열을 받는다면 현재 코드는 정상입니다. 반대로 두 메서드가 다른 형식을 요구한다면 수정이 필요합니다.

---

**2. `GraphRecursionError` 복구 후 `aget_state` 호출 시 config 일관성**

- **파일**: `agent/app/services/agent_service.py`
- **위치 (라인 번호)**: 549-550

**분석**: `run_agent` 메서드에서 `GraphRecursionError` 발생 시 `_recover_from_recursion_limit`을 호출한 후, `aget_state`를 다시 호출할 때 `config`에 `recursion_limit`이 포함되어 있지 않습니다.

```python
config = {"configurable": {"thread_id": session_id}, "recursion_limit": RECURSION_LIMIT}  # 상단 정의

try:
    result = await self.graph.ainvoke(..., config=config)
except GraphRecursionError:
    await self._recover_from_recursion_limit(session_id)
    answer = MAX_ITERATIONS_FALLBACK_MESSAGE
    snapshot = await self.graph.aget_state({"configurable": {"thread_id": session_id}})  # recursion_limit 누락
```

`aget_state`는 `recursion_limit`이 필요 없을 수 있지만, 동일한 `config` 변수를 재사용하지 않고 새로 생성함으로써 일관성이 깨집니다. 향후 `config`에 다른 설정이 추가될 경우 이 부분이 누락될 위험이 있습니다.

**해결 방안**: 상단에서 정의한 `config` 변수를 재사용하는 것이 더 안전하고 일관성 있습니다.

```python
except GraphRecursionError:
    logger.warning(f"Recursion limit reached for session {session_id}")
    await self._recover_from_recursion_limit(session_id)
    answer = MAX_ITERATIONS_FALLBACK_MESSAGE
    snapshot = await self.graph.aget_state(config)  # config 변수 재사용
    messages_for_count = snapshot.values["messages"]
```

---

### Medium (개선 권장)

**1. `_stream_llm_call`의 `@traceable` 데코레이터와 async generator 예외 처리**

- **파일**: `agent/app/core/agent_graph.py`
- **위치 (라인 번호)**: 140-155

**분석**: `@traceable(run_type="llm", name="LiteLLM")` 데코레이터가 async generator 함수에 적용되었습니다. 문서에 `langsmith>=0.7`에서 async generator 지원을 확인했다고 명시되어 있으나, `call_model_node`에서 `_stream_llm_call`를 순회하다가 litellm 예외가 발생하면 generator가 완전히 소진되지 않은 채 `except` 블록으로 빠집니다. 이때 `@traceable`이 생성한 span이 정상적으로 종료(finished with error)되는지가 중요합니다.

```python
try:
    async for chunk in _stream_llm_call(openai_messages, _TOOL_SCHEMAS):
        # ... 토큰 처리 ...
except Exception as e:
    # 예외 발생 시 _stream_llm_call의 generator가 중단됨
    # @traceable span이 정상 종료되는가?
```

**개선 제안**: `_stream_llm_call` 호출부를 별도의 try/except로 감싸서 예외 발생 시에도 trace span이 정상 종료되도록 보장하는 것이 안전합니다. 또는 `@traceable` 대신 수동으로 `langsmith.trace()` 컨텍스트 매니저를 사용하는 방안도 고려할 수 있습니다. 다만, 문서에 이미 런타임 검증을 완료했다고 명시되어 있으므로, 실제 LangSmith API 키로 대시보드에서 span 계층 구조를 확인하는 것이 최종 검증입니다.

---

**2. `_normalize_tool_args` 함수 중복 정의**

- **파일**: `agent/app/core/agent_graph.py` (라인 82-91), `agent/app/services/agent_service.py` (라인 140-152)

**분석**: `_normalize_tool_args` 함수가 `agent_graph.py`와 `agent_service.py`(레거시 MetaAgentService)에 동일한 로직으로 중복 정의되어 있습니다. DRY 원칙에 위배되며, 향후 schoolLevel 매핑이 변경될 때 두 곳을 모두 수정해야 하는 유지보수 위험이 있습니다.

**개선 제안**: 이 함수를 공통 유틸리티 모듈(예: `app/utils/tool_utils.py`)로 추출하고 두 곳에서 import하여 사용하는 것이 좋습니다. 다만, 이는 레거시 코드가 완전히 제거될 때까지 임시로 유지되는 중복이므로, 마이그레이션 완료 후 레거시 코드 제거 시 자연스럽게 해소될 문제입니다. 따라서 현재 단계에서는 우선순위를 낮게 두어도 무방합니다.

---

**3. `LangGraphAgentService.run_agent_stream`에서 불필요한 `return` 문**

- **파일**: `agent/app/services/agent_service.py`
- **위치 (라인 번호)**: 565-566

**분석**: `run_agent_stream`은 async generator 함수입니다. `GraphRecursionError` 예외 처리 블록에서 `yield MAX_ITERATIONS_FALLBACK_MESSAGE` 후 `return`으로 함수를 종료하는데, async generator에서 `return`은 `StopAsyncIteration`을 발생시켜 정상 종료됩니다. 동작에는 문제가 없으나, `return` 뒤에 값이 없으므로 암묵적으로 `StopAsyncIteration`이 발생하며, 이는 함수 끝에 도달할 때와 동일한 동작입니다.

```python
except GraphRecursionError:
    logger.warning(f"Recursion limit reached for session {session_id} (stream)")
    await self._recover_from_recursion_limit(session_id)
    yield MAX_ITERATIONS_FALLBACK_MESSAGE
    return  # 불필요 - generator는 함수 끝에서 자동 종료
```

**개선 제안**: `return`을 제거해도 generator는 함수 끝에 도달하면 자동으로 `StopAsyncIteration`을 발생시키므로, `return`은 불필요합니다.

```python
except GraphRecursionError:
    logger.warning(f"Recursion limit reached for session {session_id} (stream)")
    await self._recover_from_recursion_limit(session_id)
    yield MAX_ITERATIONS_FALLBACK_MESSAGE
    # return 불필요 - generator는 함수 끝에서 자동 종료
```

---

## 주요 파일 분석

### `agent/app/core/agent_graph.py` (신규, 226줄)

**변경 내용**: LangGraph StateGraph 기반 Agent 오케스트레이션 코어 모듈 신규 생성.

**핵심 설계 결정**:
1. **커스텀 State 정의**: `AgentState(TypedDict)`에 `messages`(add_messages reducer)와 `student_context`(커스텀 `_keep_or_update` reducer)를 정의하여, 레거시의 `session_store` + `session_context_store` 분리 관리 정책을 단일 State로 통합했습니다.
2. **2개 노드 구성**: `call_model`(LiteLLM Router 직접 호출) + `tools`(ToolNode)로 최소 구성. `prepare` 노드는 PII 마스킹을 서비스 레이어에서 처리하도록 하여 제거했습니다.
3. **스트리밍 방식**: `get_stream_writer()`를 통한 커스텀 스트림(`stream_mode="custom"`)을 사용하여, LangChain ChatModel이 아닌 LiteLLM Router의 스트리밍 응답을 SSE로 전달합니다.
4. **recursion_limit**: `MAX_ITERATIONS(8) * 2 = 16`으로 설정하여 레거시와 동등한 Tool 호출 허용 범위를 보장합니다.

**개선 제안**:
1. `_stream_llm_call`의 `@traceable` 데코레이터가 async generator 예외 상황에서도 정상 동작하는지 실제 LangSmith 키로 검증 필요 (Medium)
2. `_normalize_tool_args`가 `agent_service.py`와 중복 정의됨 (Medium, 마이그레이션 완료 후 해소 예정)

---

### `agent/app/services/agent_service.py` (수정, +102줄)

**변경 내용**: `LangGraphAgentService` 클래스 추가 및 `AGENT_BACKEND` 플래그 기반 인스턴스 분기.

**핵심 설계 결정**:
1. **인터페이스 호환성**: `run_agent`, `run_agent_stream`, `clear_session` 세 메서드가 레거시 `MetaAgentService`와 완전히 동일한 시그니처와 반환값을 가집니다.
2. **PII 마스킹 위치**: 그래프 진입 전 서비스 레이어에서 1회 수행하여, 마스킹되지 않은 원본 PII가 Checkpointer에 저장될 여지를 원천 차단했습니다.
3. **history_count 계산**: `_history_count` 정적 메서드에서 tool-call 중간 AIMessage를 제외하고 사용자 턴 + 최종 답변 턴만 카운트하여 레거시와 동일한 의미를 유지했습니다.

**개선 제안**:
1. `clear_session`의 `get_tuple`/`delete_thread` API 시그니처 확인 필요 (High)
2. `GraphRecursionError` 복구 후 `aget_state` 호출 시 config 일관성 (High)
3. `run_agent_stream`의 불필요한 `return` 문 제거 (Medium)

---

### `agent/docs/LANGGRAPH_MIGRATION_PLAN.md` (신규, 239줄)

**변경 내용**: 마이그레이션 계획서 신규 작성.

**핵심 내용**:
1. **변화 범위 명확화**: `main.py`, `schemas.py`, `neo4j_tools.py`, `pii_filter.py`, `llm_router.py`는 변경 없음을 명시하여 리뷰어의 인지 부하를 줄였습니다.
2. **검증 체크리스트**: 16개 항목의 상세 검증 체크리스트를 제공하여, 전환 전 확인해야 할 사항을 체계화했습니다. 각 항목에 `[x]`(목 테스트 검증 완료) / `[ ]`(미실행) 상태를 표시하여 진행 상황을 투명하게 공개했습니다.
3. **리스크 및 완화책**: 6개 리스크 항목을 식별하고 각각에 대한 완화책을 제시했습니다. 특히 `recursion_limit` 의미 차이와 `GraphRecursionError` 복구 로직은 이미 해결 완료로 표시되어 있습니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [x] [FIX] **수정 필요 (Changes Requested)** - High 이슈 존재

**종합 의견**: 전반적으로 매우 체계적이고 성숙한 마이그레이션입니다. 병행 운영 전략, 기존 자산 재사용, 문서화 수준이 모두 우수하며, `GraphRecursionError` 복구 로직과 `student_context` reducer 설계는 특히 인상적입니다. 다만 `clear_session`의 `get_tuple`/`delete_thread` API 시그니처 불일치 가능성(High)과 `GraphRecursionError` 복구 후 `aget_state` config 일관성(High)은 실제 운영 환경에서 세션 관리 오류로 이어질 수 있는 잠재적 버그이므로, 실제 `MemorySaver` API 시그니처를 확인하여 수정 후 머지하는 것을 권장합니다. 이 두 이슈는 모두 확인 후 간단히 수정 가능한 수준이므로, 수정 후에는 즉시 승인 가능합니다.