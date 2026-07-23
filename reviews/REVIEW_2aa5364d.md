> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 2aa5364d

## 코드 복잡도 분석

**분석된 파일**: 3개 / 변경된 파일: 3개


### 정상 범위 (NONE)


**`main.py`** (other)

- 평균 복잡도: **0.204**

- 최대 복잡도: 0.471

- 청크 수: 7개

- 평균 사용처: 6.9곳


**권장사항:**

- 복잡도 정상 범위


**`schemas.py`** (other)

- 평균 복잡도: **0.166**

- 최대 복잡도: 0.464

- 청크 수: 7개

- 평균 사용처: 5.0곳


**권장사항:**

- 복잡도 정상 범위


**`agent_service.py`** (other)

- 평균 복잡도: **0.080**

- 최대 복잡도: 0.464

- 청크 수: 18개

- 평균 사용처: 3.1곳


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 에이전트 서비스에 **요청 단위 무상태(stateless) 모드**를 도입하여, 대화 이력의 정본을 백엔드 DB가 관리하고 프론트엔드가 매 턴 이력을 replay하는 아키텍처로 전환하기 위한 변경입니다.

- **목적**: 인메모리 세션 저장소(`session_store`/`session_context_store`)에 의존하던 기존 구조에서 벗어나, 프론트가 이력을 직접 전달(`history` 필드)하면 DB가 정본 역할을 하는 무상태 모드를 지원
- **도메인**: API (비즈니스 로직), 에이전트 서비스 레이어
- **변경 방향**: 기존 인메모리 세션 모드를 레거시로 두고, `history` 파라미터가 주어지면 인메모리 저장소를 읽거나 쓰지 않는 새로운 코드 경로를 추가하는 점진적 마이그레이션

---

## [GOOD] 잘된 점

**1. 하위 호환성 완벽 유지**

`history=None`이면 기존 인메모리 모드로 완전히 동일하게 동작합니다. `_build_messages` 메서드에서 `if history is not None` 조건 하나로 두 모드를 분기하며, 레거시 코드 경로는 전혀 건드리지 않았습니다.

```python
# agent/app/services/agent_service.py, _build_messages 메서드
if history is not None:
    # --- 무상태 모드: 이력의 정본은 DB, 프론트가 매 턴 replay ---
    masked = mask_pii_data(context_data) if context_data else None
    system_prompt = self._build_system_prompt(masked)
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        ...
    return messages, None

# --- 레거시(in-memory) 모드 ---
session_history = get_session_history(session_id)
...
```

**2. 명확한 모드 분리와 문서화**

`_build_messages`의 docstring에 두 모드의 동작 방식, `context_data` 처리 차이, `images`의 휘발성 성격을 상세히 기술하여 유지보수성을 높였습니다. 특히 "무상태 모드에서는 `session_store`/`session_context_store`를 읽거나 쓰지 않는다"는 명시가 중요합니다.

**3. LangGraph ephemeral thread 안전장치**

`LangGraphAgentService`에서 무상태 모드로 생성된 임시 thread를 `finally` 블록에서 반드시 정리합니다. 이는 메모리 누수를 방지하는 중요한 설계 결정입니다.

```python
# agent/app/services/agent_service.py, LangGraphAgentService.run_agent
try:
    try:
        result = await self.graph.ainvoke(...)
    except GraphRecursionError:
        ...
finally:
    if ephemeral:
        self.graph.checkpointer.delete_thread(thread_id)
```

**4. 중복 코드 제거**

`_append_user_turn` 정적 메서드로 사용자 발화 추가 로직을 추출하고, `_persist` 클로저로 스트리밍 함수 내 이력 저장 로직을 일원화했습니다. 이전에는 `history.add_user_message(text)`와 `history.add_ai_message(...)`가 예외 핸들러마다 중복되어 있었는데, 이를 `_persist` 하나로 통합하여 유지보수성을 크게 개선했습니다.

---

## 변경사항 요약

| 파일 | 변경 내용 |
|------|----------|
| `agent/app/models/schemas.py` | `AgentQuery`에 `history: Optional[List[ChatMessage]]` 필드 추가 |
| `agent/app/services/agent_service.py` | `MetaAgentService._build_messages`에 무상태 모드 분기 도입, `LangGraphAgentService`에 ephemeral thread 기반 무상태 모드 추가, 헬퍼 메서드 4개 신규 작성 |
| `agent/main.py` | `/chat`과 `/chat_stream` 엔드포인트에서 `history=query.history` 파라미터 전달 |

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

**없음**

### High (우선 수정 권장)

**없음**

### Medium (개선 권장)

#### 1. `run_agent`에서 무상태 모드 `history_count`의 의미 차이 문서화

**파일**: `agent/app/services/agent_service.py`
**위치**: `run_agent` 메서드, `history_count` 계산 부분

**기존 코드**:
```python
# 무상태 모드(session_history is None)에서는 이력 정본이 DB이므로 여기서 저장하지 않는다.
if session_history is not None:
    session_history.add_user_message(text)
    session_history.add_ai_message(answer)
    history_count = len(session_history.messages)
else:
    # 전달받은 이력(직전 턴들) + 이번 사용자 발화 + 이번 답변
    history_count = len(history) + 2
```

**문제 분석**:
레거시 모드에서 `history_count`는 `session_history.messages`의 전체 길이로, 지금까지 누적된 모든 사용자/어시스턴트 메시지 쌍의 수를 의미합니다. 반면 무상태 모드에서 `history_count`는 `len(history) + 2`로, "이번 요청에서 전달받은 이력 + 현재 턴"을 의미합니다.

이 두 값은 의미가 다릅니다. 레거시는 "전체 누적 턴 수", 무상태는 "이번 요청 기준 턴 수"입니다. 클라이언트가 이 값을 비교하거나 누적합산할 때 혼란이 발생할 수 있습니다.

**해결 방안**:
`history_count`의 의미를 응답 스키마나 docstring에 명확히 문서화하는 것을 권장합니다. 예를 들어 "무상태 모드에서는 이번 요청에 포함된 전체 메시지 턴 수(전달받은 이력 + 현재 턴)"라는 설명을 추가할 수 있습니다. 현재 동작에 버그는 없으므로 필수 수정 사항은 아닙니다.

#### 2. `_persist` 클로저가 `text`를 외부 스코프에서 암묵적으로 캡처

**파일**: `agent/app/services/agent_service.py`
**위치**: `run_agent_stream` 메서드, `_persist` 정의 부분

**기존 코드**:
```python
def _persist(ai_text: str) -> None:
    """레거시 인메모리 모드에서만 이번 턴을 세션 이력에 저장한다.
    무상태 모드(session_history is None)에서는 이력 정본이 DB이므로 no-op."""
    if session_history is not None:
        session_history.add_user_message(text)
        session_history.add_ai_message(ai_text)
```

**문제 분석**:
`_persist`는 `session_history`와 `text`를 외부 함수 스코프(`run_agent_stream`의 파라미터)에서 캡처합니다. `text`는 이 함수 내에서 변경되지 않으므로 실제 문제는 없지만, 클로저가 캡처한 변수가 명시적으로 드러나지 않아 코드 리뷰 시 혼동을 줄 수 있습니다. 특히 `_persist`가 여러 예외 핸들러(총 6곳)에서 호출되므로, `text`가 어디서 오는지 추적하려면 클로저의 스코프 체인을 이해해야 합니다.

**해결 방안**:
`_persist`를 `text`도 명시적 파라미터로 받도록 수정하면 가독성이 향상됩니다.

```python
def _persist(user_text: str, ai_text: str) -> None:
    if session_history is not None:
        session_history.add_user_message(user_text)
        session_history.add_ai_message(ai_text)
```

그리고 호출부를 `_persist(text, final_content)` 형태로 변경합니다. 다만 이는 코드 스타일 선호도에 가까우므로, 현재 구현도 충분히 실용적입니다.

---

## 주요 파일 분석

### `agent/app/models/schemas.py`

**변경 내용**: `AgentQuery`에 `history: Optional[List[ChatMessage]]` 필드 추가

**분석**:
- `ChatMessage`는 `role: str`과 `content: str`만 있는 단순한 Pydantic 모델로, LangChain의 `HumanMessage`/`AIMessage`와 1:1 매핑됩니다.
- `description`이 상세하게 작성되어 있어 API 사용자가 무상태 모드의 동작 방식을 이해하는 데 도움이 됩니다. 특히 "현재 사용자 발화(text)는 포함하지 않는다"는 명시가 중요합니다.
- `session_id`의 description도 "대화 세션 ID (메모리 관리용)"에서 "대화 세션 ID (트레이싱/로그 상관관계용)"으로 변경되어, 무상태 모드에서 `session_id`의 역할이 트레이싱과 로그 상관관계로 축소되었음을 반영합니다.

**개선 제안**: 특별한 이슈 없음.

---

### `agent/app/services/agent_service.py`

**변경 내용**: `MetaAgentService`와 `LangGraphAgentService`에 무상태 모드 분기 추가

**분석**:

**MetaAgentService 변경 사항**:
1. `_append_user_turn` 정적 메서드 신규 작성: 이미지가 있을 때 멀티모달 메시지 블록을 구성하는 로직을 별도 메서드로 추출
2. `_build_messages`에 `history` 파라미터 추가 및 무상태 모드 분기 도입
3. `run_agent`/`run_agent_stream`에 `history` 파라미터 전달 및 이력 저장 조건부 처리
4. `_persist` 클로저 도입으로 스트리밍 함수 내 중복 이력 저장 코드 제거

**LangGraphAgentService 변경 사항**:
1. `_history_to_lc_messages` 정적 메서드: 프론트가 replay한 `ChatMessage` 리스트를 LangChain 메시지로 변환
2. `_prepare_invocation` 메서드: 무상태 모드에서 ephemeral thread_id 생성, 레거시 모드에서 기존 session_id 사용
3. `run_agent`/`run_agent_stream`에 `history` 파라미터 추가 및 ephemeral thread 정리 로직(`finally` 블록)

**핵심 설계 결정**:
- 무상태 모드에서 `context_data`는 매 턴 전달되어 시스템 프롬프트에 그대로 반영됩니다. 레거시 모드에서는 첫 턴에만 전달되어 `session_context_store`에 캐시됩니다.
- `images`는 두 모드 모두에서 휘발성 입력으로 처리되어 LLM 메시지에는 포함되지만 어떤 이력에도 저장되지 않습니다.
- `LangGraphAgentService`의 ephemeral thread는 `session_id:uuid` 형태의 복합 키를 사용하여, 동일 세션 내에서도 요청마다 다른 thread가 생성되도록 합니다.

**개선 제안**: 위 Medium 섹션에서 언급한 사항 외에 특별한 이슈 없음.

---

### `agent/main.py`

**변경 내용**: `/chat`과 `/chat_stream` 엔드포인트에서 `history=query.history` 파라미터 전달

**분석**:
- 단순 파라미터 포워딩으로, `AgentQuery`에서 받은 `history`를 서비스 레이어로 그대로 전달합니다.
- `validate_images` 호출 이후에 위치하여, 이미지 검증 실패 시 `history` 처리 자체가 이루어지지 않도록 보호됩니다.

**개선 제안**: 특별한 이슈 없음.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [x] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [ ] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견**:

이 커밋은 인메모리 세션에서 DB 기반 무상태 모드로의 전환을 위한 중요한 아키텍처 변경입니다. 하위 호환성을 완벽히 유지하면서 새로운 코드 경로를 추가한 점, ephemeral thread 정리 로직을 `finally`에 배치하여 메모리 누수를 방지한 점, 중복 코드를 헬퍼 메서드로 추출하여 가독성을 개선한 점 등 전반적으로 안정적이고 실용적인 설계를 보여줍니다.

`history_count`의 의미 차이에 대한 문서화 보강과 `_persist` 클로저의 명시적 파라미터화는 선택적 개선 사항이며, 현재 코드도 충분히 프로덕션에 머지 가능한 수준입니다. 특히 `_build_messages`의 docstring에 두 모드의 동작 방식을 상세히 기술한 점은 유지보수성을 크게 향상시켰습니다.

**핵심 메시지**: 점진적 마이그레이션 전략이 잘 설계되었고, 코드 품질도 우수합니다. Medium 수준의 제안 사항은 다음 리팩토링 주기에 반영해도 무방합니다.