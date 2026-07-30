> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 09dcb5b4

## 코드 복잡도 분석

**분석된 파일**: 3개 / 변경된 파일: 3개


### 정상 범위 (NONE)


**`useconversations.ts`** (other)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.010

- 청크 수: 68개


**권장사항:**

- 파일 크기가 큼 (68개 청크) - 파일 분리 검토


**`assistantservice.ts`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.009

- 청크 수: 14개


**권장사항:**

- 복잡도 정상 범위


**`airoompage.tsx`** (component)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.002

- 청크 수: 9개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 AI 어시스턴트의 컨텍스트 프로필(context_data.profile)에 포함되는 `tcId`(교사 식별자)의 신뢰성을 개선하기 위한 변경입니다. 기존에는 `Class.teacherId`만을 의존했으나, `buildClassFromAPI` 등 일부 데이터 경로에서 `teacherId`가 빈 문자열로 내려오는 문제가 있어, 로그인 인증 사용자의 id(`authTcId`)를 fallback 소스로 추가하여 `tcId`가 항상 채워지도록 보장합니다.

- **목적**: `Class.teacherId`가 빈 문자열로 내려오는 케이스에서도 `tcId`가 누락되지 않도록 보장
- **도메인**: 비즈니스 로직 (AI 어시스턴트 API 호출 레이어)
- **변경 방향**: 단일 소스 의존(`Class.teacherId`)에서 다중 소스 fallback(`Class.teacherId || authTcId || null`)으로 개선

---

## [STATUS] 심각도별 이슈 요약

### Critical (즉시 수정 필요)
- 없음

### High (우선 수정 권장)
- 없음

### Medium (개선 권장)
1. **`user.id`와 `tcId`의 의미적 정합성 미검증** — `User` 타입에 `id`와 `tcId`가 별도 필드로 존재하는데, `user.id`가 실제 교사 식별자(`tcId`)와 동일한 값인지 확인되지 않음

### Low (참고 사항)
- 없음

---

## 변경사항 요약

1. `assistantService.ts`: `AssistantRequest` 인터페이스에 `authTcId?: string | null` 필드 추가
2. `assistantService.ts`: `buildContextProfile` 함수가 `authTcId` 파라미터를 받아 `tcId` 결정 시 `Class.teacherId || authTcId || null` 로직 적용 (세 가지 모드 모두)
3. `assistantService.ts`: `callAssistant`와 `callAssistantStream`에서 `authTcId`를 구조 분해하여 `buildContextProfile`에 전달
4. `useConversations.ts`: `UseConversationsParams` 인터페이스에 `authTcId` 추가 및 `callAssistant`/`callAssistantStream` 호출 시 전달
5. `AIRoomPage.tsx`: `useTeacherClasses()`에서 `user`를 추출하여 `authTcId: user?.id ?? null`로 전달

---

## 파일별 상세 분석

### frontend/src/features/ai-room/api/assistantService.ts

**변경 내용:**
- `AssistantRequest` 인터페이스에 `authTcId?: string | null` 필드 추가 (라인 46)
- `buildContextProfile` 함수 시그니처에 `authTcId?: string | null` 파라미터 추가 (라인 104)
- `mode === 'student'` 분기: `tcId: cls?.teacherId ?? null` -> `tcId: cls?.teacherId || authTcId || null` (라인 127)
- `mode === 'class'` 분기: `tcId: selectedClass.teacherId || null` -> `tcId: selectedClass.teacherId || authTcId || null` (라인 140)
- `mode === 'all'` 분기: `const tcId = classes[0]?.teacherId || null` -> `const tcId = classes[0]?.teacherId || authTcId || null` (라인 143)
- `callAssistant`와 `callAssistantStream`에서 `authTcId` 구조 분해 및 `buildContextProfile`에 전달

**[PROBLEM] 발견된 문제:**

1. **[의미적 정합성 — `user.id`와 `tcId`의 관계 검증 필요]**
   - **위치 (라인 번호)**: AIRoomPage.tsx 라인 59 (`authTcId: user?.id ?? null`)
   - **기존 코드**:
   ```typescript
   authTcId: user?.id ?? null,
   ```
   - **해결 방안 (수정 코드)**:
   `User` 타입 정의(`frontend/src/shared/types/index.ts` 라인 256-268)를 확인한 결과, `User` 인터페이스에는 `id: string`(로그인 사용자 식별자)과 `tcId?: string`(교사 식별자)가 별도 필드로 존재합니다. `user.id`가 실제로 `tcId`(교사 ID)와 동일한 값인지 확인이 필요합니다. 만약 `user.id`가 `tcId`와 다른 식별 체계(예: SP 사용자 UUID)라면, AI 에이전트가 기대하는 `tcId`의 의미와 불일치할 수 있습니다.
   
   `user.tcId`가 존재한다면 `user.tcId`를 우선 사용하고, 없을 경우 `user.id`를 fallback으로 사용하는 것이 더 안전합니다:
   ```typescript
   authTcId: user?.tcId ?? user?.id ?? null,
   ```
   - **위험도**: Medium
   - **영향**: `user.id`가 `tcId`와 다른 값일 경우, AI 에이전트가 잘못된 교사 식별자를 받아 의도치 않은 동작(예: 다른 교사의 데이터 조회)을 할 수 있음

**[GOOD] 잘된 점:**
- `buildContextProfile` 함수의 세 가지 분기(`student`, `class`, `all`) 모두 일관되게 `authTcId` fallback 로직이 적용되어, 특정 모드에서만 누락되는 문제가 없음
- `buildContextProfile`이 `null`을 반환할 경우 호출부에서 `...(profile !== null ? { profile } : {})`로 안전하게 처리하여, `profile`이 없어도 `contextData`가 유효함
- `authTcId`를 `AssistantRequest` 인터페이스에 옵셔널(`?`)로 추가하여 기존 호출 코드의 하위 호환성을 유지함

---

### frontend/src/features/ai-room/model/useConversations.ts

**변경 내용:**
- `UseConversationsParams` 인터페이스에 `authTcId?: string | null` 필드 추가 (라인 104)
- `callAssistant`/`callAssistantStream` 호출 시 `authTcId`를 `request` 객체에 포함하여 전달 (라인 384)

**[PROBLEM] 발견된 문제:**
- 없음. 변경이 단순하고 명확하며, 기존 인터페이스와의 호환성이 유지됨

**[GOOD] 잘된 점:**
- `authTcId`를 단순히 전달(pass-through)하는 역할로만 사용하여 책임을 명확히 분리함
- `useConversations` 훅 자체는 `authTcId`의 출처나 유효성에 대해 알 필요가 없어 관심사 분리가 잘 되어 있음

---

### frontend/src/pages/ai-room/AIRoomPage.tsx

**변경 내용:**
- `useTeacherClasses()`에서 `user`를 추가로 구조 분해 (라인 15)
- `useConversations` 호출 시 `authTcId: user?.id ?? null` 전달 (라인 59)

**[PROBLEM] 발견된 문제:**

1. **[의미적 정합성 — `user?.id ?? null`에서 `user?.tcId` 우선 고려]**
   - **위치 (라인 번호)**: 라인 59
   - **기존 코드**:
   ```typescript
   authTcId: user?.id ?? null,
   ```
   - **해결 방안 (수정 코드)**: 위 `assistantService.ts` 섹션에서 이미 다루었으므로 동일한 제안을 적용합니다. `User` 타입에 `tcId` 필드가 별도로 존재하므로, `user.tcId`를 우선 사용하는 것이 의미적으로 더 정확합니다.
   ```typescript
   authTcId: user?.tcId ?? user?.id ?? null,
   ```
   - **위험도**: Medium
   - **영향**: `user.id`와 `user.tcId`가 다른 값일 경우, AI 에이전트가 잘못된 교사 식별자를 받을 수 있음

**[GOOD] 잘된 점:**
- `user?.id ?? null`로 `null` 병합 연산자(`??`)를 사용하여 `undefined`와 `null`을 안전하게 처리함
- `useTeacherClasses()`에서 이미 `user`를 제공하고 있어 추가 의존성 없이 `authTcId`를 얻을 수 있음

---

## 보안 분석

**발견된 보안 취약점:** 없음

**보안 체크리스트:**
- [x] 인증/인가 검증 — `authTcId`는 인증된 사용자(`useAuth()`의 `user`)에서 파생되므로 신뢰할 수 있음
- [x] 입력 검증 및 Sanitization — `authTcId`는 단순 문자열 식별자로, 별도 sanitization이 필요하지 않음
- [x] 민감 정보 보호 — `tcId`는 이미 AI 에이전트에 전송되던 필드로, 새로운 민감 정보 노출이 아님
- [x] HTTPS/암호화 사용 — 해당 없음 (API 호출 레벨)

---

## 버그 가능성 분석

**잠재적 버그:**

1. **`user.id`와 `tcId` 불일치로 인한 데이터 오염**
   - **재현 조건**: `user.id`(로그인 식별자)와 실제 교사 ID(`tcId`)가 다른 값을 가질 때, `mode === 'all'`에서 `classes[0]?.teacherId`가 빈 문자열이고 `authTcId`로 `user.id`가 전달되면, AI 에이전트가 잘못된 교사 식별자로 컨텍스트를 구성함
   - **예상 결과**: AI 에이전트가 다른 교사의 데이터나 권한으로 응답을 생성할 수 있음
   - **수정 방법**: `user.tcId`를 우선 사용하고, 없을 경우 `user.id`를 fallback으로 사용

2. **`mode === 'all'`에서 `tcId`가 `null`일 때 함수가 `null` 반환**
   - **재현 조건**: `classes` 배열이 비어있고(`[]`), `authTcId`도 `null`/`undefined`인 경우
   - **예상 결과**: `buildContextProfile`이 `null` 반환 -> `contextData`에 `profile` 필드 없이 AI 에이전트 호출 -> 에이전트가 교사 식별 없이 동작
   - **수정 방법**: 이는 이번 변경 이전에도 존재하던 동작이며, `authTcId` 도입으로 오히려 발생 가능성이 줄어들었음. 추가 조치 불필요

**Edge Case 검증:**
- [x] Null/Undefined 처리 — `user?.id ?? null`, `authTcId || null` 등으로 안전하게 처리됨
- [x] 빈 배열/객체 처리 — `classes[0]?.teacherId`로 안전하게 접근
- [ ] 경계값 (0, 음수, 최대값) — 해당 없음 (문자열 식별자)
- [ ] 동시성 문제 — 해당 없음 (단일 스레드)

---

## 성능 분석

**성능 이슈:** 없음

**성능 체크리스트:**
- [x] 불필요한 연산 제거 — `authTcId`는 단순 문자열 전달로 오버헤드 없음
- [x] 캐싱 활용 — 해당 없음
- [x] 비동기 처리 — 해당 없음
- [x] 메모리 효율성 — 영향 없음

---

## 코드 품질 평가

- **가독성**: 9/10 — 변경이 명확하고, 주석으로 의도가 잘 설명되어 있음
- **유지보수성**: 9/10 — `authTcId`가 단일 책임으로 전달되어 추적이 용이함
- **테스트 커버리지**: 평가 불가 — Diff만으로 테스트 코드 변경 여부를 확인할 수 없음
- **문서화**: 8/10 — JSDoc 주석과 인라인 주석으로 변경 의도가 잘 설명되어 있으나, `user.id`와 `tcId`의 관계에 대한 문서화는 부족함

---

## 개선 제안 (우선순위별)

### 필수 (Must Fix)
1. 없음

### 권장 (Should Fix)
1. **`user.tcId` 우선 사용 검토**: `AIRoomPage.tsx`에서 `authTcId: user?.id ?? null` 대신 `authTcId: user?.tcId ?? user?.id ?? null`로 변경하여 의미적 정합성 확보
   - `User` 타입에 `tcId?: string` 필드가 별도로 존재하므로, `user.tcId`가 존재한다면 이를 우선 사용하는 것이 더 안전함
   - 단, `user.tcId`가 항상 존재하는 것은 아니므로(`?` 옵셔널), `user.id`를 fallback으로 유지

### 선택 (Nice to Have)
1. **`buildContextProfile`의 `mode === 'all'` 분기에서 `tcId`가 `null`일 때의 동작 문서화**: 함수가 `null`을 반환하면 AI 에이전트에 `profile` 없이 요청이 전송된다는 점을 JSDoc에 명시

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - 문제 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - 경미한 이슈만 존재
- [x] [FIX] **수정 필요 (Changes Requested)** — 중요 이슈 수정 후 재검토
- [ ] [REJECT] **거부 (Rejected)** - 치명적 이슈로 인한 병합 불가

**핵심 코멘트:**

이 커밋은 `Class.teacherId`가 빈 문자열로 내려오는 문제에 대한 실용적인 해결책을 제공합니다. 변경 자체는 일관성 있고 안전하게 구현되었습니다. 세 가지 모드(`student`, `class`, `all`) 모두에 일관된 fallback 로직이 적용되었고, `authTcId`가 옵셔널로 추가되어 기존 코드의 하위 호환성이 유지되었습니다.

그러나 `user.id`와 `tcId`의 의미적 관계에 대한 검증이 필요합니다. `User` 타입(`frontend/src/shared/types/index.ts` 라인 256-268)을 확인한 결과, `User` 인터페이스에는 `id: string`(로그인 사용자 식별자)과 `tcId?: string`(교사 식별자)가 별도 필드로 존재합니다. `user.id`를 `authTcId`로 사용하는 것은 잠재적인 데이터 불일치를 초래할 수 있습니다.

**권장 수정 사항:**
`AIRoomPage.tsx` 라인 59에서 `authTcId: user?.id ?? null`을 `authTcId: user?.tcId ?? user?.id ?? null`로 변경하여, `user.tcId`가 존재하면 이를 우선 사용하고 없을 경우 `user.id`를 fallback으로 사용하는 것이 의미적으로 더 정확합니다.

**리뷰어 노트:**
- 검토 시간: 약 15분
- 우선 수정 항목:
  1. `AIRoomPage.tsx`에서 `authTcId: user?.tcId ?? user?.id ?? null`로 변경 검토
  2. `user.id`와 `tcId`의 관계에 대한 문서화 또는 단위 테스트 추가
  3. `buildContextProfile`의 `mode === 'all'` 분기에서 `null` 반환 시 영향 문서화