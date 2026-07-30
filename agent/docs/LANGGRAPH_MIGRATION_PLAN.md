# LangGraph 마이그레이션 구현계획서

> 대상: `agent/app/services/agent_service.py` (MetaAgentService)
> 목적: 수작업 ReAct 루프 → LangGraph `StateGraph` 기반 오케스트레이션 전환
> 결정된 전제조건 (사용자 확정):
> - Checkpointer 백엔드: **MemorySaver(인메모리) 유지** — 재시작 시 세션 소실은 현재와 동일. 추후 Redis/Postgres 교체 가능하도록 인터페이스만 추상화.
> - 전환 전략: **병행 운영 후 전환** — feature flag로 레거시/LangGraph 두 구현을 동시에 배치하고, 검증 후 레거시 제거.

> **[검증 완료]** 실제 설치된 `langgraph 1.0.5` / `langchain-core 1.2.24` / `langsmith 0.7.24` 가상환경에서 아래 API를 런타임 import로 직접 확인함: `StateGraph`/`END`/`add_messages`(`langgraph.graph`), `MemorySaver`(`langgraph.checkpoint.memory`), `ToolNode`/`tools_condition`(`langgraph.prebuilt`), `get_stream_writer`(`langgraph.config`), `convert_to_openai_messages`(`langchain_core.messages.utils`). 이 과정에서 최초 초안의 설계 2곳을 아래와 같이 정정함.
>
> 1. **`prepare` 노드 제거** — PII 마스킹은 그래프 진입 "전" 서비스 레이어에서 1회만 수행하고(현재 `_build_messages`와 동일 타이밍), 마스킹된 결과만 `student_context` state에 입력값으로 전달한다. 그래프 안에 별도 노드를 둘 필요가 없고, 마스킹 안 된 원본 PII가 Checkpointer에 저장될 여지도 원천 차단된다.
> 2. **스트리밍 방식 정정** — `call_model` 노드가 LangChain `ChatModel` Runnable이 아니라 `litellm.Router.acompletion()`을 직접 호출하므로, `astream_events`의 `on_chat_model_stream` 이벤트는 **자동으로 발생하지 않는다**. 대신 노드 내부에서 `get_stream_writer()`로 토큰을 직접 push하고, 호출부는 `stream_mode="custom"`으로 소비한다 (3.5 참고). 스트리밍 LLM 호출의 LangSmith "개별 nested span" 추적도 LangGraph 전환만으로는 자동 해결되지 않아, `@traceable(run_type="llm")`로 감싼 `_stream_llm_call()` 헬퍼를 별도 구현함 — **[구현 완료, 3.6 참고]**.

---

## 1. 결론 먼저: 변화 범위

**외부 계약은 전혀 바뀌지 않는다.**

| 영역 | 변경 여부 |
|---|---|
| `main.py` (엔드포인트 4개, 요청/응답 포맷) | **변경 없음** |
| `app/models/schemas.py` (`AgentQuery`, `AgentResponse`) | **변경 없음** |
| SSE 스트리밍 청크 포맷 (`{"text":.., "is_final":..}`) | **변경 없음** |
| `app/tools/neo4j_tools.py` (5개 Tool) | **변경 없음** — 이미 `@tool` 데코레이터 기반 LangChain Tool이라 LangGraph `ToolNode`에 그대로 재사용 가능 |
| `app/utils/pii_filter.py` | **변경 없음** — 그래프 진입 전 전처리 단계에서 그대로 호출 |
| `app/core/llm_router.py` (LiteLLM Router, 멀티키/폴백) | **변경 없음** — 그대로 감싸서 재사용 (아래 3.1 참고) |
| `app/services/agent_service.py` | **대규모 재작성** — while 루프, 예외처리 중복, 스트림 버퍼링 로직 제거 |
| 신규 `app/core/agent_graph.py` | **신규 파일** — StateGraph 정의 (~150~250줄 예상) |
| `requirements.txt` | **1줄 추가** — `langgraph` 명시 (현재 `langchain`의 전이 의존성으로 이미 `1.0.5`가 설치돼 있으나 버전 고정 안 됨) |

즉 변화는 **`agent_service.py` 내부 구현에 국한**되고, 병행 운영 전략 덕분에 위험 없이 단계적으로 진행할 수 있다.

---

## 2. 현재 구조 분석 요약

### 2.1 확인된 사실
- `langgraph 1.0.5`가 이미 가상환경에 설치돼 있음(`langchain` 패키지의 전이 의존성). 신규 대형 의존성 도입이 아니라 **명시적으로 선언만 하면 되는 상태**.
- `neo4j_tools_list`의 5개 Tool은 이미 `@tool` async 함수라 `langgraph.prebuilt.ToolNode`와 100% 호환.
- LLM 호출은 LangChain 모델 객체가 아니라 **`litellm.Router.acompletion()`을 직접 호출**하는 구조([llm_router.py:115-121](../app/core/llm_router.py#L115-L121)). Router는 다음을 담당:
  - OpenAI 멀티 API 키 로테이션 (`least-busy`)
  - OpenAI 실패 시 Gemini로 자동 폴백
  - `num_retries=3`
  - 이 로직은 LangGraph의 표준 `ChatOpenAI` 바인딩으로 대체하면 **소실**되므로, LangGraph의 "모델 노드"를 커스텀 함수로 만들어 기존 Router를 그대로 호출해야 함 (prebuilt `create_react_agent`는 사용 불가, `StateGraph`를 직접 구성).
- 세션 상태가 `session_store`/`session_context_store` 두 개의 모듈 전역 dict로 분리 관리되고 있고, `context_data`는 **첫 메시지에만 전달되고 이후 턴에는 세션에 저장된 값을 재사용**하는 특이한 정책이 있음([agent_service.py:157-162](../app/services/agent_service.py#L157-L162)). 이 정책을 State/Checkpointer로 정확히 재현해야 함(3.3 참고).
- `run_agent`(비스트림)와 `run_agent_stream`(스트림)이 동일한 while 루프(최대 8회 반복, `max_iterations`)를 각각 손으로 구현하고 있고, litellm 예외 4종(`AuthenticationError`/`RateLimitError`/`Timeout`/`APIError`) 처리 블록도 두 메서드에 중복 존재.
- 스트리밍 경로는 tool_call 델타를 `tool_call_buffer` 딕셔너리로 수동 누적([agent_service.py:353-374](../app/services/agent_service.py#L353-L374)) — 프레임워크가 대신 처리해줄 수 있는 로직.
- LangSmith 트레이싱은 `langsmith.trace()` 컨텍스트 매니저를 try/finally로 4곳에서 열고 닫는 방식이며, 스트리밍 LLM 호출은 개별 추적이 안 된다는 한계가 코드에 주석으로 명시돼 있음([agent_service.py:308](../app/services/agent_service.py#L308)).
- 통합 테스트(`tests/test_api_integration.py`)는 **실행 중인 서버에 대한 블랙박스 HTTP 테스트**(pytest 자동 수집 대상 아님, `__main__`으로 수동 실행)이므로 API 계약만 유지하면 그대로 재사용 가능 — 오히려 회귀 검증 스크립트로 병행 운영 단계에 활용 가치가 높음.

### 2.2 핵심 통찰
> 지금 아키텍처가 "레이어가 잘못 나뉘어서" 복잡한 게 아니라, **LangGraph가 표준으로 제공하는 기능(반복 제어, 메시지 누적, 체크포인트, 트레이싱)을 수작업으로 재구현**하고 있어서 중복이 생긴 것. 도메인 로직(시스템 프롬프트 구성, PII 마스킹, Neo4j Tool, LiteLLM Router 폴백 정책)은 전부 재사용 가능하며 그래프의 "노드 함수" 안으로 옮기기만 하면 된다.

---

## 3. 목표 아키텍처

### 3.1 State 정의 (`app/core/agent_graph.py`)

```python
from typing import Annotated, Any, Optional
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]       # 대화 이력 (자동 누적)
    student_context: Optional[dict]                # 마스킹된 context_data (세션 단위 유지)
    iterations: int                                 # max_iterations 대체용 카운터(선택)
```

- `student_context`에 **커스텀 reducer**를 적용해 "새 값이 오면 덮어쓰고, 없으면 이전 값 유지"라는 현재 `session_context_store` 정책을 그대로 재현한다.
  ```python
  def _keep_or_update(old, new):
      return new if new is not None else old

  student_context: Annotated[Optional[dict], _keep_or_update]
  ```

### 3.2 노드 구성

그래프는 2개 노드로 구성한다(당초 초안의 `prepare` 노드는 제거 — 위 검증 노트 참고).

| 노드 | 역할 | 대응하는 기존 코드 |
|---|---|---|
| `call_model` | `state["student_context"]`로 시스템 프롬프트 조립 → `state["messages"]`(영속 turn)를 `convert_to_openai_messages`로 OpenAI dict 변환 → `llm_router.acompletion()` 직접 호출(기존 Router 로직 100% 재사용) → 응답을 `AIMessage(tool_calls=..)`로 변환 후 반환 | `_call_llm_once`, `_build_system_prompt`, `_build_messages` |
| `tools` | `langgraph.prebuilt.ToolNode(neo4j_tools_list)` 그대로 사용. `AIMessage.tool_calls[i]["args"]`에는 `call_model` 노드에서 미리 `_normalize_tool_args` 적용 | `_invoke_tool_with_tracing`, `_normalize_tool_args` |
| conditional edge | `tools_condition`(prebuilt, 수정 없이 재사용) — 마지막 메시지에 `tool_calls`가 있으면 `tools`로, 없으면 `END` | while 루프의 `if not tool_calls: break` |

- `student_context`는 서비스 레이어가 매 호출 시 마스킹까지 마친 뒤 그래프 입력(`invoke`/`stream`의 `student_context` 키)으로 전달한다. `_keep_or_update` reducer가 "이번 턴에 값이 없으면 이전 턴 값 유지" 정책을 담당하므로, 별도 `prepare` 노드 없이도 `session_context_store`의 동작을 그대로 재현한다.
- system prompt 자체는 `state["messages"]`에 영속되지 않는다(오늘 코드의 `history`가 system prompt를 담지 않는 것과 동일). 매 `call_model` 호출 시 `student_context`로부터 새로 조립해 LLM에 보낼 메시지 리스트 맨 앞에만 붙인다.

### 3.3 그래프 컴파일

```python
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import ToolNode, tools_condition

graph = StateGraph(AgentState)
graph.add_node("call_model", call_model_node)
graph.add_node("tools", ToolNode(neo4j_tools_list))
graph.set_entry_point("call_model")
graph.add_conditional_edges("call_model", tools_condition)  # {"tools": "tools", "__end__": END} 기본값 그대로 사용
graph.add_edge("tools", "call_model")

compiled_graph = graph.compile(checkpointer=MemorySaver())
```

- `thread_id = session_id`로 매핑 → `session_store` 전역 dict가 사라지고 Checkpointer가 대화 이력 + `student_context`를 함께 영속화(프로세스 생존 기간 한정, 현재와 동일 제약).
- `max_iterations=8` → `config={"recursion_limit": N}`으로 대체.
- **[실측 완료 · 정정]** LangGraph의 recursion_limit은 super-step(노드 실행) 단위 카운트이며, 이 그래프는 왕복 1회당 `call_model` + `tools` = 2 super-step을 소비함을 목 테스트로 직접 확인함. `RECURSION_LIMIT = MAX_ITERATIONS(8) * 2 = 16`으로 [agent_graph.py](../app/core/agent_graph.py)에 상수화.
- **[중요 · 하위 호환성 버그, 수정 완료]** 초과 시 레거시는 항상 정상 응답으로 "에이전트가 최대 허용 횟수..." 메시지를 반환하지만, LangGraph는 기본적으로 **`GraphRecursionError` 예외를 던진다**. 초기 구현에서 이를 잡지 않아 `/chat`이 HTTP 500으로, `/chat/stream`이 `is_final` 없는 비정상 SSE로 응답하는 회귀가 있었음. `LangGraphAgentService`에서 `GraphRecursionError`를 캐치해 ①레거시와 동일한 메시지를 반환하고 ②`graph.aupdate_state(config, {"messages":[...]}, as_node="call_model")`로 체크포인트를 "완료" 상태로 되돌려 다음 턴이 중단 지점(tools 재실행 대기)에 멈추지 않고 정상적으로 새로 시작되도록 수정함. 목 테스트로 재현·수정·회귀(다음 턴 정상 동작) 모두 검증 완료.

### 3.4 비스트리밍 (`/chat`) 실행

```python
result = await compiled_graph.ainvoke(
    {"messages": [HumanMessage(content=text)], "student_context": masked_context},
    config={"configurable": {"thread_id": session_id}, "recursion_limit": 20},
)
answer = result["messages"][-1].content
```
- `messages` 입력에는 **이번 턴의 신규 메시지만** 넣는다. 과거 이력은 `thread_id` 체크포인트에서 자동으로 로드되어 `add_messages` reducer가 이어 붙인다(기존 `history.messages` 순회 조립 로직 불필요).
- `masked_context`는 `mask_pii_data(context_data)` 결과. `context_data`가 없는 턴이면 `None`을 넘겨 reducer가 이전 턴 값을 유지하게 한다.

### 3.5 스트리밍 (`/chat/stream`) 실행

`call_model` 노드가 LangChain `ChatModel`이 아닌 `litellm.Router`를 직접 호출하므로 `astream_events`의 `on_chat_model_stream`은 발생하지 않는다(검증 노트 참고). 대신 **커스텀 스트림**을 사용한다.

```python
# agent_graph.py — call_model 노드 내부
from langgraph.config import get_stream_writer

async def call_model_node(state: AgentState) -> dict:
    writer = get_stream_writer()
    ...
    response = await llm_router.acompletion(..., stream=True)
    content_buffer = ""
    tool_call_buffer = {}
    async for chunk in response:
        delta = chunk.choices[0].delta
        if delta.content:
            content_buffer += delta.content
            writer({"type": "token", "text": delta.content})   # SSE로 전달할 토큰
        if delta.tool_calls:
            ...  # 기존과 동일한 인덱스 기반 누적 (call_model 노드 내부로 캡슐화됨, 완전 제거는 아님)
    ...
    return {"messages": [ai_message]}
```

```python
# agent_service.py — 소비부
async for chunk in compiled_graph.astream(
    {"messages": [HumanMessage(content=text)], "student_context": masked_context},
    config={"configurable": {"thread_id": session_id}},
    stream_mode="custom",
):
    if chunk.get("type") == "token":
        yield chunk["text"]
```
- **정정**: `tool_call_buffer` 인덱스 누적 로직은 완전히 사라지는 게 아니라 `call_model` 노드 내부로 옮겨간다(오늘은 `run_agent_stream` 메서드 레벨에 노출돼 있음). 다만 **while 루프/반복 제어, tool 실행, 히스토리 관리는 여전히 그래프가 담당**하므로 순수 오케스트레이션 중복은 제거된다.
- 기존 SSE 포맷(`{"text":.., "is_final":..}`)은 `main.py`의 `event_generator`가 그대로 감싸므로 **`main.py` 수정 불필요**.

### 3.6 LangSmith 트레이싱 — **구현 완료**
- `langsmith.trace()` 수동 컨텍스트 매니저(`agent_service.py` 내 4곳)는 LangGraph 경로에서 불필요 — `LANGSMITH_TRACING=true`만으로 그래프 최상위 실행 + 각 노드(`call_model`, `tools`) 단위 span이 자동 기록된다.
- 스트리밍 LLM 호출의 nested span은 [agent_graph.py](../app/core/agent_graph.py)의 `_stream_llm_call()`(`@traceable(run_type="llm", name="LiteLLM")`로 감싼 async generator)이 담당한다. `call_model_node`는 `llm_router.acompletion()`을 직접 호출하지 않고 이 함수를 순회하며 토큰을 `get_stream_writer()`로 흘려보낸다. `langsmith>=0.7`이 async generator 함수에 대한 `@traceable`을 지원함을 런타임으로 확인 후 적용함. 레거시의 "스트림 LLM 호출은 개별 추적 불가" 한계가 해소됨.
- **검증한 것**: ① 트레이싱 비활성화 상태(API 키 없음)에서 `@traceable`이 완전한 no-op으로 동작(에러 없음, 목 테스트 통과) ② `LANGSMITH_TRACING=true` + 유효하지 않은 API 키로 실행해도 그래프 응답이 0.05초 내로 정상 완료되고, 전송 실패는 백그라운드에서 경고 로그만 남길 뿐 요청 흐름을 막지 않음(비동기 배치 전송 구조 확인).
- **검증 못한 것**: 실제 유효한 LangSmith API 키로 대시보드에 span이 계층 구조(그래프 run → `call_model`/`tools` 노드 → `LiteLLM` nested run)로 정확히 표시되는지는 이 환경에서 확인 불가. 실 배포 전 반드시 실제 키로 1회 확인 필요.
- `tracing.py`의 프로젝트명 규칙(`meta-dashboard-agent-{env}`)은 그대로 유지, `initialize()` 호출부만 유지.

---

## 4. 병행 운영(A/B) 설계

### 4.1 Feature Flag
```python
# app/services/agent_service.py
AGENT_BACKEND = os.getenv("AGENT_BACKEND", "legacy")  # "legacy" | "langgraph"
```
- `MetaAgentService.run_agent` / `run_agent_stream` 진입부에서 분기, 또는 `main.py`에서 서비스 인스턴스 자체를 분기(권장: 서비스 레벨 분기가 더 깔끔).
- 레거시 코드(`_call_llm_once`, while 루프 등)는 **삭제하지 않고 그대로 유지**한 채 신규 `LangGraphAgentService`를 병렬로 추가.
- LangSmith 태그에 `backend:legacy` / `backend:langgraph`를 추가해 동일 세션·유사 질의에 대한 응답 품질/지연시간/Tool 호출 정확도를 트레이스 대시보드에서 직접 비교.

### 4.2 검증 체크리스트 (전환 전 필수 확인)
- [ ] `tests/test_api_integration.py` 4개 시나리오 (health / context 대화 / 메모리 지속성 / 세션 리셋) 두 backend 모두 통과 — **실제 서버 기동 필요, 미실행**
- [x] `recursion_limit` 값이 기존 `max_iterations=8` 대비 동등한 Tool 호출 허용 범위를 보장하는지 실측 — `RECURSION_LIMIT=16`, 초과 시 `GraphRecursionError` 캐치 후 레거시 동일 메시지로 복구 (목 테스트 검증 완료)
- [x] `student_context` reducer가 "첫 메시지 context_data → 이후 턴 유지 → 재전달 시 override" 정책을 정확히 재현하는지 멀티턴 시나리오로 확인 (목 테스트 검증 완료)
- [x] 세션 격리 확인 — 서로 다른 `session_id`(thread_id) 간 대화/컨텍스트가 섞이지 않음 (목 테스트 검증 완료)
- [x] `clear_session` 이후 동일 `session_id`로 재대화 시 이전 이력이 남지 않고 완전히 새로 시작되는지 확인 (목 테스트 검증 완료)
- [x] 병렬 tool_calls(한 응답에 여러 Tool 동시 호출) 처리 확인 (목 테스트 검증 완료, ToolMessage 개수 일치)
- [x] LLM이 존재하지 않는 Tool 이름을 호출(환각)하거나 인자를 잘못된 JSON으로 생성해도 그래프가 크래시하지 않고 graceful하게 복구되는지 확인 — `ToolNode`의 내장 `_validate_tool_call`/`handle_tool_errors`가 legacy의 수동 try/except와 동등한 역할을 함 (목 테스트 검증 완료). **단, 에러 메시지 문구 자체는 legacy와 다름** — LLM에게 전달되는 내부 tool-result이므로 사용자 노출 문구는 아니라 기능적으로는 문제 없음.
- [x] 완전히 빈 LLM 응답(content/tool_calls 둘 다 없음) 시 비스트림·스트림 양쪽 모두 정확한 폴백 문구 반환 확인 (목 테스트 검증 완료)
- [x] 한 턴 안에서 Tool 왕복이 여러 번 발생해도 `history_count`가 legacy와 동일 의미(사용자 턴 + 최종 답변 턴)로 계산되는지 확인 (목 테스트 검증 완료)
- [x] PII 마스킹이 서비스 레이어에서 매 요청(context_data 존재 시)마다 정상 호출되는지 확인 — reducer 기반 세션 유지/override 테스트로 간접 검증 완료
- [x] litellm 예외(Auth/RateLimit/Timeout/APIError) 4종 전부 사용자 메시지가 legacy와 정확히 동일하게 매핑되는지, 비스트림·스트림 양쪽 + 실패 후 이력 영속(human+ai=2)까지 확인 (목 테스트 12건 전부 검증 완료)
- [ ] 스트리밍 SSE 응답이 기존 클라이언트(`frontend`)와 포맷 호환되는지 실제 브라우저 연동 테스트 — **미실행, 실제 서버/브라우저 필요**
- [ ] 실제 유효한 OpenAI/Gemini API 키로 진짜 LLM 응답 확인 — **미실행**
- [ ] 실제 Neo4j 인스턴스로 Tool 조회 결과 확인(현재는 연결 실패 시 graceful degradation 경로만 확인됨) — **미실행**
- [ ] 실제 LangSmith API 키로 대시보드에 span 계층 구조가 올바르게 표시되는지 확인 — **미실행** (3.6 참고)

### 4.3 전환 및 정리
- 병행 기간 동안 이슈 없으면 `AGENT_BACKEND` 기본값을 `langgraph`로 변경.
- 안정화 후(권장: 최소 1~2주 프로덕션 관찰) 레거시 코드(`_call_llm_once`, `_invoke_tool_with_tracing`, while 루프, 수동 langsmith trace 블록, `session_store`/`session_context_store`) 및 flag 완전 제거.

---

## 5. 단계별 실행 계획

| Phase | 작업 | 산출물 |
|---|---|---|
| 0. 준비 | `requirements.txt`에 `langgraph>=1.0.5,<2.0.0` 명시, 브랜치 생성 | requirements.txt diff |
| 1. Graph 스켈레톤 | `app/core/agent_graph.py` 신규 작성 — State(`messages`, `student_context`), `call_model`/`tools` 노드, `tools_condition` conditional edge, `MemorySaver` compile | 신규 파일 |
| 2. 프롬프트/PII 이식 | `_build_system_prompt`를 `call_model` 노드로, `mask_pii_data`는 서비스 레이어(그래프 호출 직전)로, `_normalize_tool_args`는 `call_model`에서 tool_calls 생성 시점에 이식 | agent_graph.py 내 함수 |
| 3. 비스트림 전환 | `LangGraphAgentService.run_agent` 구현, feature flag 배치 | agent_service.py 수정 |
| 4. 스트림 전환 | `astream_events` 기반 `run_agent_stream` 구현, SSE 포맷 검증 | agent_service.py 수정 |
| 5. 트레이싱 검증 | LangSmith 대시보드에서 스트리밍 LLM 호출 개별 추적 확인 | 검증 로그 |
| 6. 병행 검증 | 체크리스트(4.2) 수행, 두 backend 응답/지연 비교 | 비교 리포트 |
| 7. 전환 및 정리 | 기본 flag `langgraph`로 전환 → 관찰 → 레거시 코드/flag 제거 | agent_service.py 대폭 축소 |

---

## 6. 리스크 및 완화책

| 리스크 | 완화책 |
|---|---|
| ~~`recursion_limit`이 기존 `max_iterations`와 의미가 달라 동작 차이 발생~~ | **[해결됨]** 3.3 참고 — `RECURSION_LIMIT=16`으로 상수화 + `GraphRecursionError`를 캐치해 레거시와 동일한 폴백 응답/세션 복구 로직 구현·검증 완료 |
| LiteLLM Router의 멀티키 폴백 로직을 커스텀 노드로 옮기며 누락 가능 | `call_model` 노드는 기존 `_call_llm_once` 바디를 거의 그대로 복사 — 신규 로직 작성 최소화 |
| `student_context` 세션 정책(첫 메시지만 반영) 재현 실패 | 커스텀 reducer 단위 테스트 추가 (3.1) |
| MemorySaver는 프로세스 재시작 시 세션 소실 (기존과 동일 제약, 개선 아님) | 사용자 확정 사항 — 추후 Redis 전환 시 `checkpointer=MemorySaver()` → `RedisSaver(...)` 한 줄 교체만으로 가능하도록 인터페이스 추상화해둘 것 |
| 회귀 테스트가 수동 스크립트뿐 | 병행 운영 기간에 `test_api_integration.py`를 자동화(pytest fixture로 서버 기동)하는 것을 권장 — 이번 마이그레이션 부수 과제로 제안 |

---

## 7. 요약

- **API 계약 변경 없음**: `main.py`, `schemas.py`, 프론트엔드 연동 지점 모두 무변경.
- **재사용 가능한 자산이 많음**: Neo4j Tool, PII 마스킹, 시스템 프롬프트 구성, LiteLLM Router 폴백 정책 — 전부 그대로 노드 함수 안으로 이식.
- **실제 변화는 `agent_service.py`의 "루프 제어 + 스트림 버퍼링 + 트레이싱 보일러플레이트"에 집중** — 이 부분이 LangGraph의 표준 기능으로 대체되며 코드량이 크게 줄어들 것으로 예상.
- 병행 운영(feature flag) 전략으로 리스크를 낮추고, 검증 후 레거시를 제거하는 방식으로 진행.
