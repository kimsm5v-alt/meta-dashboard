> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 07b4bdb2

## 코드 복잡도 분석

변경된 파일의 복잡도 정보를 찾을 수 없습니다.
(인덱스가 생성되지 않았거나 새로운 파일일 수 있습니다)

---



## 변경 배경

이 커밋은 임시 대화(temp-*)의 첫 번째 턴에서 에이전트가 이전 대화 이력을 찾지 못하는 문제를 해결합니다. 기존에는 temp ID로 에이전트를 호출한 뒤 스트림 완료 후에야 서버 대화방을 생성했기 때문에, 에이전트가 temp 키로 컨텍스트를 저장했다가 두 번째 턴(서버 ID로 변경 후)에는 이를 찾지 못하는 문제가 있었습니다.

- **목적**: 임시 대화 첫 턴의 에이전트 세션 ID를 서버 대화방 ID로 사전 고정하여 에이전트의 이력/컨텍스트 연속성 보장
- **도메인**: 비즈니스 로직 (AI 어시스턴트 대화 세션 관리)
- **변경 방향**: "스트리밍 완료 후 대화방 생성" -> "에이전트 호출 전 대화방 생성 + RAG 컨텍스트 재사용"으로 순서 변경

## [GOOD] 잘된 점

1. **문제 인식과 해결 방향이 명확함**: temp ID로 인한 에이전트 이력 단절 문제를 정확히 진단하고, 에이전트 호출 전에 서버 대화방을 먼저 생성하는 방식으로 근본 원인을 해결했습니다. `prebuiltContext` 필드를 도입해 RAG 컨텍스트 중복 빌드를 방지한 점도 효율적입니다.

2. **폴백(fallback) 처리 유지**: 대화방 생성 실패 시 `serverConvId`가 null로 남고, `sessionId: serverConvId ?? convId`에서 기존 temp ID로 폴백되도록 설계되어 장애 내성(fault tolerance)을 확보했습니다.

3. **cachedContext와 prebuiltContext의 역할 구분이 명확함**: `cachedContext`는 "이미 에이전트에 전송된 컨텍스트(재전송 불필요)"이고, `prebuiltContext`는 "아직 전송되지 않은 컨텍스트(전송 필요)"라는 의미 차이를 주석과 로직(`contextData` 전송 조건)으로 명확히 구분했습니다.

## 변경사항 요약

- `assistantService.ts`: `AssistantRequest`에 `prebuiltContext` 필드 추가, RAG 컨텍스트 우선순위 로직을 `cachedContext ?? prebuiltContext`로 변경
- `useConversations.ts`: 임시 대화 시 에이전트 호출 전에 `buildRAGContext` -> `createConversationApi` 순서로 실행하여 세션 ID를 서버 ID로 고정, 스트림 완료 후 ID 교체 및 메시지 저장 로직을 단순화

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

1. **`prebuiltContext`로 대화방 생성 시 contextData 저장과 에이전트 context_data 전송이 이중으로 발생할 가능성**

   `useConversations.ts`에서 `createConversationApi(mode, getContextLabel(), convTitle, [], prebuiltContext)`를 호출하면 서버에 `contextData`가 저장됩니다. 이후 `callAssistantStream`에서 `prebuiltContext`가 `knownContext`로 선택되고, `cachedContext`가 null이므로 `contextData`가 다시 구성되어 에이전트에 전송됩니다. 이는 의도된 동작(첫 턴이므로 context_data 전송 필요)이지만, 동일한 RAG 컨텍스트가 서버 DB 저장과 에이전트 API 호출에 두 번 사용된다는 점을 인지하고 있어야 합니다. 현재는 문제가 없으나, 향후 contextData 저장 로직이 변경될 경우 이중 전송/저장의 일관성을 주의해야 합니다.

2. **`useConversations.ts`의 `mode` 변수 스코프 문제 - `handleSend` 함수 내에서 `mode`가 어디서 오는지 불명확**

   `handleSend` 함수 내에서 `mode`, `classes`, `selectedClass`, `selectedStudents`를 직접 참조하고 있으나, 이 변수들이 `useConversations` 훅의 파라미터인지, `useMemo`/`useState`로부터 파생된 것인지 Diff만으로는 확인이 어렵습니다. 다만 이는 기존 코드에서도 동일하게 사용되던 패턴이므로 이번 변경의 문제는 아닙니다.

### Medium (개선 권장)

1. **`prebuiltContext` 타입 단언(`as`) 사용 검토**

   `useConversations.ts`에서 `prebuiltContext`의 타입을 `NonNullable<AssistantResponse['builtContext']> | null`로 선언했습니다. `buildRAGContext`의 반환 타입이 `ContextBuildResult`(`{ context: string; aliasMap: StudentAliasMap }`)인데, 이를 `{ ragContext: string; aliasMap: StudentAliasMap }` 형태로 매핑하고 있습니다. 필드명(`context` -> `ragContext`)이 다르므로 타입 호환성에 문제는 없으나, `AssistantResponse['builtContext']`와 동일한 타입을 별도로 정의하거나 재사용하는 것이 더 명확할 수 있습니다.

   **위치**: `useConversations.ts` 라인 345
   **기존 코드**:
   ```typescript
   let prebuiltContext: NonNullable<AssistantResponse['builtContext']> | null = null;
   ```
   **해결 방안**:
   ```typescript
   // AssistantResponse의 builtContext 타입과 동일한 타입을 별도 정의하거나,
   // ContextBuildResult를 그대로 사용하는 방안 검토
   let prebuiltContext: { ragContext: string; aliasMap: StudentAliasMap } | null = null;
   ```
   > 단, 이는 프로젝트 컨벤션에 따라 조정 가능한 사항으로, 현재 방식도 기능적으로 문제는 없습니다.

---

## 주요 파일 분석

### `frontend/src/features/ai-room/api/assistantService.ts`

**변경 내용:**
`AssistantRequest` 인터페이스에 `prebuiltContext` 필드 추가, RAG 컨텍스트 선택 로직을 `cachedContext ?? prebuiltContext`로 변경, contextData 전송 조건 주석 보강

**개선 제안:**
1. **`knownContext` 변수명이 두 컨텍스트의 의미 차이를 충분히 전달하지 못함**
   - **위치**: `assistantService.ts` 라인 107, 168
   - **기존 코드**:
     ```typescript
     const knownContext = cachedContext ?? prebuiltContext;
     ```
   - **해결 방안**: `cachedContext`와 `prebuiltContext`는 "이미 전송됨" vs "아직 전송 안 됨"이라는 중요한 의미 차이가 있습니다. `knownContext`라는 이름은 이 차이를 드러내지 않습니다. `effectiveContext` 또는 `availableContext` 정도로 변경하거나, 주석으로 이 우선순위의 의미를 더 명확히 문서화하는 것을 검토하세요. 다만 이는 사소한 네이밍 선호도 영역이므로 현재 상태도 무방합니다.

### `frontend/src/features/ai-room/model/useConversations.ts`

**변경 내용:**
임시 대화 처리 로직을 에이전트 호출 전으로 이동, `buildRAGContext` -> `createConversationApi` -> `callAssistantStream` 순서로 재구성, 스트림 완료 후 ID 교체 및 메시지 저장 로직 단순화

**개선 제안:**
1. **`convTitle` 생성 로직이 `currentInput`을 직접 사용 - 입력이 비어있거나 공백만 있는 경우 처리 필요**
   - **위치**: `useConversations.ts` 라인 340
   - **기존 코드**:
     ```typescript
     const convTitle = currentInput.slice(0, 20) + (currentInput.length > 20 ? '...' : '');
     ```
   - **해결 방안**: `handleSend` 함수 시작 부분에서 `if (!input.trim() || isLoading) return;`으로 검증하지만, `currentInput`은 `const currentInput = input; setInput('');` 이후에 할당되므로 빈 문자열일 가능성은 낮습니다. 다만 `currentInput.slice(0, 20)`이 빈 문자열이면 제목이 빈 문자열이 됩니다. fallback 제목을 추가하는 것을 검토하세요.
     ```typescript
     const rawTitle = currentInput.slice(0, 20);
     const convTitle = rawTitle.trim() ? rawTitle + (currentInput.length > 20 ? '...' : '') : '새 대화';
     ```
     > **[수정 코드 제시 불가 - 문맥 파악 불충분]**: `createConversationApi`가 빈 제목을 어떻게 처리하는지 서버 로직을 확인할 수 없어, 현재 동작에 문제가 있다고 단정할 수 없습니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)**
- [x] [WARN] **조건부 승인 (Approved with Comments)**
- [ ] [FIX] **수정 필요 (Changes Requested)**

**종합 의견:**
이 커밋은 임시 대화의 세션 ID 불일치 문제를 정확히 진단하고, 에이전트 호출 전 대화방 생성 + RAG 컨텍스트 재사용이라는 깔끔한 해결책을 제시했습니다. `prebuiltContext`와 `cachedContext`의 역할 구분, 폴백 처리 등 설계가 전반적으로 견고합니다. Critical/High 이슈는 없으며, Medium 수준의 개선 제안(변수명 의미 전달력, 빈 제목 fallback)만 존재하므로 조건부 승인(WARN)으로 평가합니다.