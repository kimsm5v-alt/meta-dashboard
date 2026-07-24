# 대화 메모리 정합성 개선 구현계획서 (Option A: DB 단일 정본)

> 대상: `agent`(FastAPI) + `frontend/features/ai-room`
> 목적: "예전 발화기록 리스팅이 실제와 100% 일치하지 않는다" 증상의 근본 원인 제거
> 전략: **백엔드 DB(`ai_conversation`/`ai_message`)를 대화 이력의 단일 정본(Single Source of Truth)으로 삼고, 에이전트는 매 요청마다 프론트가 재생(replay)한 이력으로 컨텍스트를 구성하는 "요청 단위 무상태(stateless)" 구조로 전환한다.**

---

## 0. 배경 — 왜 A인가

현재 대화 이력은 **두 곳에 독립적으로** 존재한다.

| 저장소 | 위치 | 특성 | 정본 여부 |
|---|---|---|---|
| `ai_conversation`/`ai_message` | 백엔드(Spring, MySQL) | 영속, 화면·재로그인에서 그대로 복원 | ✅ 사실상 정본 |
| `session_store` / `MemorySaver` | 에이전트 프로세스 메모리 | 휘발성, 프로세스 생존 중에만 유효 | ❌ 임시 |

에이전트가 답변에 쓰는 "기억"은 두 번째(휘발성) 저장소인데, 이것이 화면/DB와 어긋나면서 증상이 발생한다. 어긋나는 3대 원인:

1. **세션ID 불일치**: 신규 대화 첫 턴은 `session_id="temp-<ts>"`로 저장되고, 2턴부터는 실제 숫자 ID로 바뀌어 에이전트가 첫 턴을 잃음 ([useConversations.ts:315-437](../../frontend/src/features/ai-room/model/useConversations.ts)).
2. **휘발성**: 에이전트 재시작·재배포 시 전량 소실 ([agent_service.py:21-23](../app/services/agent_service.py#L21-L23)).
3. **쓰기 경로 이원화**: DB 저장은 프론트가 `addMessageApi`로 fire-and-forget, 에이전트 메모리는 자기가 따로 기록 → 부분 실패 시 divergence.

**Option A의 핵심 이점**: 에이전트가 프론트의 라이브 상태(=DB에서 hydrate된 값)로만 컨텍스트를 만들면, **"에이전트가 기억하는 내용 == 화면에 보이는 내용 == `ai_message`에 저장된 내용"** 이 구조적으로 항상 일치한다. 재시작이 나도 프론트가 매번 이력을 다시 실어 보내므로 연속성이 유지된다.

---

## 1. 확인된 DB 스키마 (2026-07-24 실측)

```sql
CREATE TABLE `ai_conversation` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `owner_user_no` bigint NOT NULL,
  `title` varchar(200) NOT NULL,
  `mode` varchar(20) NOT NULL COMMENT 'all|class|student',
  `context_label` varchar(255) NOT NULL,
  `context_data` json DEFAULT NULL COMMENT 'RAG 컨텍스트 (첫 메시지 시 저장)',
  `use_yn` char(1) NOT NULL DEFAULT 'Y',
  ... created/updated/last_message_at ...
  PRIMARY KEY (`id`)
);

CREATE TABLE `ai_message` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint NOT NULL,
  `role` varchar(20) NOT NULL COMMENT 'user|assistant|system',
  `content` text NOT NULL,
  `message_at` datetime NOT NULL,
  ...,
  KEY `idx_ai_message_conversation_id` (`conversation_id`,`id`),
  CONSTRAINT `fk_ai_message_conversation`
    FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversation`(`id`) ON DELETE CASCADE
);
```

- 현재 규모: 대화 **150개**, 메시지 **851개**(user 426 / assistant 425). 한 대화 최대 **50 메시지**, 최대 누적 **~32,000자**(≈ 8~10K 토큰). → 대부분 컨텍스트 한도 내지만, **윈도잉(최근 N턴 절단)은 안전장치로 포함**한다.
- `context_data`(json)에 RAG 컨텍스트가 이미 영속되므로, 이력뿐 아니라 시스템 프롬프트용 컨텍스트도 DB에서 복원 가능하다.
- **에이전트는 이 DB에 직접 접근하지 않는다.** 프론트가 이미 보유한 `messages` 상태(로드시 `ai_message`에서 hydrate)를 재생해 보내는 방식을 택한다(에이전트에 신규 DB 의존성/자격증명 추가 없음, 계층 경계 유지).

---

## 2. 목표 아키텍처

### 2.1 요청 흐름 (변경 후)

```
[프론트] 대화 열기
   └─ getMessages(convId)  →  messages 상태 = ai_message 복원   ← DB가 정본
[프론트] 메시지 전송 (매 턴)
   └─ POST /chat(/stream) {
        text,                  // 이번 사용자 발화
        session_id,            // 안정 ID (아래 3.1)
        context_data,          // 매 턴 전송 (더 이상 첫 턴 한정 아님)
        history: [{role,content}...]   // 직전까지의 대화 (프론트 라이브 상태)
      }
[에이전트] history + context_data 로 messages 구성 → LLM 호출
      (session_store / checkpointer 에 이력 누적하지 않음)
```

### 2.2 계약 변경 요약

| 영역 | 변경 |
|---|---|
| `agent/app/models/schemas.py` | `AgentQuery`에 `history: Optional[List[ChatMessage]]` 추가 (ChatMessage는 기존 정의 재사용) |
| `agent/main.py` | `/chat`, `/chat/stream`이 `query.history`를 서비스로 전달 |
| `agent/app/services/agent_service.py` | `_build_messages`가 `session_store` 대신 전달받은 `history`로 구성. 이력 append/저장 로직 제거 |
| `agent/app/core/agent_graph.py` | 요청마다 full history를 초기 messages로 주입, 요청별 ephemeral thread_id 사용(체크포인트 누적 방지) |
| `frontend/.../agentApiService.ts` | `AgentQuery.history` 필드 추가·전송 |
| `frontend/.../assistantService.ts` | `messages` → `history` 매핑, `context_data` 매 턴 전송 |
| `frontend/.../useConversations.ts` | (거의 그대로) 이미 `messages`를 넘기고 있음 — 매핑/윈도잉만 조정 |

> **하위호환**: `history`는 optional. 값이 오면 무상태 모드, 없으면 기존 인메모리 모드로 폴백 → **에이전트 먼저 배포 → 프론트 배포** 순의 무중단 롤아웃 가능.

---

## 3. 상세 설계

### 3.1 안정 session_id (선행 조건)

무상태 모드에서도 `session_id`는 트레이싱/로그 상관관계 및 폴백 모드를 위해 안정적이어야 한다. 두 방법 중 택1:

- **(권장) 대화방 선(先)생성**: 신규 대화의 첫 메시지 전송 *전에* `createConversationApi`를 호출해 숫자 ID를 먼저 확보하고, 그 ID를 처음부터 `session_id`로 사용. `temp-` 개념 제거.
- (대안) 프론트 생성 UUID를 별도 세션 키로 두고 대화방 ID와 분리.

Option A 자체는 이력을 프론트가 실어보내므로 첫 턴 유실이 원천 차단되지만, 선생성을 함께 적용하면 `temp-` 분기·고아 세션이 사라져 코드가 단순해진다. **본 계획은 "대화방 선생성"을 포함**한다.

기존 로직에서 `createConversationApi`는 첫 응답 이후의 `builtContext`를 함께 저장했는데([useConversations.ts:419-425](../../frontend/src/features/ai-room/model/useConversations.ts#L419-L425)), 선생성 시에는 `context_data`가 아직 없다. → 생성은 먼저 하고, 첫 응답에서 얻은 `builtContext`는 별도 갱신 API(또는 첫 `addMessage` 시 동봉)로 반영하거나, 프론트 캐시에만 두고 매 턴 전송한다(3.3).

### 3.2 에이전트 — `_build_messages` 무상태화 (legacy)

```python
# agent_service.py (개념 스케치)
def _build_messages(self, text, context_data, history=None, images=None):
    masked = mask_pii_data(context_data) if context_data else None
    system_prompt = self._build_system_prompt(masked)

    messages = [{"role": "system", "content": system_prompt}]
    for m in (history or []):
        if m.role in ("user", "assistant"):
            messages.append({"role": m.role, "content": m.content})

    if images:
        messages.append({"role": "user",
                         "content": [{"type":"text","text":text}] +
                                    [{"type":"image_url","image_url":{"url":i}} for i in images]})
    else:
        messages.append({"role": "user", "content": text})
    return messages
```

- `session_store` / `session_context_store` / `get_session_history` 제거(또는 폴백 전용으로 격리).
- `run_agent` / `run_agent_stream`에서 `history.add_user_message/ai_message` 저장 제거.
- `AgentResponse.history_count`는 `len(history)+2`로 계산해 필드 유지(프론트 계약 불변).
- `clear_session`은 no-op(True 반환)로 남겨 `DELETE /chat/{id}` 계약 유지 → 프론트 `agentResetSession` 무해.
- **PII 정합성**: `context_data`는 지금도 마스킹 후 프롬프트에 넣는다. 마스킹 재활성화 시 **history의 content도 프론트에서 동일 aliasMap으로 마스킹**해 보내야 프롬프트 전체가 일관됨(3.3의 매핑 지점에 명시).

### 3.3 프론트 — 이력·컨텍스트 매 턴 전송

`assistantService.ts`:
```ts
// history: 직전까지의 대화 (그리팅 id='1' 및 system 제외), 마스킹 파리티 적용
const history = request.messages
  .filter(m => m.id !== '1' && (m.role === 'user' || m.role === 'assistant'))
  .slice(-MAX_HISTORY_MESSAGES)              // ← 윈도잉 (예: 30)
  .map(m => ({ role: m.role, content: applyAliases(m.content, aliasMap) }));

// context_data: 첫 턴 한정 → 매 턴 전송으로 변경 (캐시 재사용, 무상태 에이전트 지원)
const contextData = { mode, context: ragContext, ...(profile ? { profile } : {}) };
```

- `useConversations.handleSend`는 이미 `messages: messages.filter(m => m.id !== '1')`를 넘기고 있고, 렌더 스코프의 `messages`는 **이번 사용자 발화가 append되기 전 값**이라 현재 발화 중복 없이 "직전까지 이력"만 담긴다(확인됨).
- `MAX_HISTORY_MESSAGES`(예: 30)로 절단. 필요 시 문자수/토큰 예산 기반으로 고도화.
- `agentApiService.ts`의 `AgentQuery`에 `history?: {role,content}[]` 추가 후 body에 포함.

### 3.4 LangGraph 경로 (`AGENT_BACKEND=langgraph`)

`add_messages` reducer + 체크포인터는 같은 thread_id로 full history를 재주입하면 **중복 누적**된다. 무상태화 방법:

- 요청마다 **ephemeral thread_id**(예: `uuid4()`) 사용 → 체크포인트가 턴 간에 병합되지 않음. 그래프 정의 자체는 불변.
- 초기 state: `messages = history_as_LC_messages + [HumanMessage(text)]`, `student_context = masked(context_data)`, `pending_images = images`.
- `MemorySaver`는 그대로 두되 사실상 단발 실행 캐시로만 쓰임(재시작 영향 없음). 추후 완전 제거 가능.

### 3.5 (권장) DB 쓰기 신뢰성 보강 — 내구성용

에이전트-화면 정합성은 A로 즉시 확보되지만, **재로그인/재로딩 후에도 동일하려면** `ai_message` 저장이 신뢰성 있어야 한다. 현재 `addMessageApi`는 await 없는 fire-and-forget이다([useConversations.ts:389-409](../../frontend/src/features/ai-room/model/useConversations.ts#L389-L409)).

- 최소: 실패 시 사용자 노출 토스트 + 재시도(1~2회).
- 권장: user·assistant 저장을 순차 보장(assistant는 user 저장 이후) 및 실패 로깅.
- 이 항목은 A의 필수는 아니나 "리스팅 정합성"을 재접속 후에도 보장하기 위해 함께 진행 권장.

---

## 4. 파일별 변경 목록 (체크리스트)

**에이전트**
- [ ] `app/models/schemas.py` — `AgentQuery.history: Optional[List[ChatMessage]]` 추가
- [ ] `main.py` — `/chat`, `/chat/stream`에서 `history=query.history` 전달
- [ ] `app/services/agent_service.py`
  - [ ] `_build_messages` 시그니처/구현 무상태화
  - [ ] `run_agent`/`run_agent_stream` 이력 저장 제거, `history_count` 재계산
  - [ ] `history` 미제공 시 기존 인메모리 폴백(하위호환) 유지
  - [ ] `clear_session` no-op화
- [ ] `app/core/agent_graph.py` — ephemeral thread_id + full history 주입 (langgraph 사용 시)

**프론트**
- [ ] `api/agentApiService.ts` — `AgentQuery.history` 추가/전송 (`agentChat`, `agentChatStream`)
- [ ] `api/assistantService.ts` — `messages→history` 매핑, `context_data` 매 턴 전송, 윈도잉
- [ ] `model/useConversations.ts` — 대화방 선생성으로 `temp-` 분기 제거, 매핑 조정
- [ ] (권장) `addMessageApi` 신뢰성 보강

---

## 5. 롤아웃 순서

1. **에이전트 배포** (`history` optional 폴백 포함) — 기존 프론트와 100% 호환.
2. **프론트 배포** (history/context 매 턴 전송 + 대화방 선생성).
3. 검증 후, 에이전트의 인메모리 폴백 코드 및 `session_store`/`MemorySaver` 잔재 제거(정리 커밋).

---

## 6. 테스트 계획

- **단위(에이전트)**: `_build_messages`가 `[system] + history + [user]` 순서/역할로 구성되는지, `history=None` 폴백.
- **통합(HTTP)**:
  - 턴1(history=[]) → 턴2(history=[턴1 u/a])에서 턴1 내용을 참조하는지.
  - "이전 대화 나열해줘" 쿼리가 전달된 history와 일치하는지.
  - **재시작 시나리오**: 턴1 후 에이전트 프로세스 재기동 → 턴2에서도 연속성 유지(프론트 history 덕분).
- **회귀**: 기존 `tests/test_api_integration.py` 블랙박스 스크립트 재활용.
- **프론트**: 신규 대화 첫 턴부터 안정 ID 사용, 50+ 메시지 대화에서 윈도잉 동작.

---

## 7. 리스크 & 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| history 미절단 시 토큰 폭증 | 장문 대화 컨텍스트 초과 | `MAX_HISTORY_MESSAGES` 윈도잉(3.3) |
| context_data 매 턴 전송 크기 증가 | 대역폭 | 프론트 캐시 재사용(이미 `contextCacheRef` 존재), 재빌드 회피 |
| 마스킹 재활성화 시 history 비마스킹 전송 | PII 유출/프롬프트 불일치 | history content에도 `applyAliases` 적용(3.2·3.3) |
| DB 저장 실패 시 재접속 후 이력 누락 | 내구성 저하(정합성은 세션 내 유지) | 쓰기 신뢰성 보강(3.5) |
| langgraph 경로 체크포인트 중복 | 메시지 중복 | ephemeral thread_id(3.4) |

---

## 8. 결론

Option A는 **에이전트를 "요청 단위 무상태"로 만들고 이력의 정본을 DB로 일원화**한다. 이로써 세션ID 불일치·휘발성·쓰기 이원화라는 3대 불일치 원인이 구조적으로 제거되며, 에이전트의 회상 내용이 화면/`ai_message`와 항상 일치하게 된다. 변경 범위는 계약(스키마) 1필드 추가 + 서비스 내부/프론트 매핑에 국한되고, optional 필드 기반 폴백으로 무중단 롤아웃이 가능하다.

---
**작성일**: 2026-07-24
**전제**: DB 스키마 실측 반영(`ai_conversation`/`ai_message`), 에이전트는 DB 직접 접근 없이 프론트 replay 방식 채택
