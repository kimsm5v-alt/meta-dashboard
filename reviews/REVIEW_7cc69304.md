> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 7cc69304

## 코드 복잡도 분석

**분석된 파일**: 3개 / 변경된 파일: 3개


### 정상 범위 (NONE)


**`usecontextmode.ts`** (other)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.005

- 청크 수: 14개


**권장사항:**

- 복잡도 정상 범위


**`useconversations.ts`** (other)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.010

- 청크 수: 69개


**권장사항:**

- 파일 크기가 큼 (69개 청크) - 파일 분리 검토


**`airoompage.tsx`** (component)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.008

- 청크 수: 9개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 AI룸에서 대화를 전환할 때 이전 대화에서 사용했던 컨텍스트 선택(모드/반/학생)이 그대로 남아 있어, 헤더 표시와 AI 답변 대상이 어긋나는 문제를 해결합니다. 대화 전환 시 해당 대화의 컨텍스트 선택 상태를 캐시에서 조회하여 복원하고, 캐시 시그니처(signature) 기반 유효성 검증을 추가하여 대화 중 선택 변경 시 낡은 컨텍스트로 답변하는 버그도 함께 방지합니다.

- **목적**: 대화 전환 시 컨텍스트 선택 상태 복원 및 캐시 무효화 로직 개선
- **도메인**: 비즈니스 로직 (AI룸 대화 관리)
- **변경 방향**: 캐시에 선택 상태(selection)와 시그니처(signature)를 함께 저장하여, 대화 전환 시 복원하고 캐시 유효성 검증에 활용

## [GOOD] 잘된 점

1. **시그니처 기반 캐시 무효화 설계가 적절함**: `mode|classId|studentIds` 조합으로 시그니처를 만들어 캐시 유효성을 검증하는 방식은 간결하면서도 실용적입니다. 대화 중간에 컨텍스트 선택이 바뀌었을 때 낡은 컨텍스트로 답변하는 버그를 효과적으로 방지합니다.

2. **`restoreSelections`와 `handleModeChange`의 역할 분리가 명확함**: `handleModeChange`는 드롭다운/모달을 여는 UI 동작을 포함하는 반면, `restoreSelections`는 순수 상태 복원만 수행합니다. 주석(`// handleModeChange와 달리 드롭다운/모달을 열지 않고 상태만 복원한다`)으로 의도를 명확히 표현한 점이 좋습니다.

3. **`cacheContext` 헬퍼 함수로 중복 제거**: 임시 대화와 기존 대화 모두에서 동일한 캐시 저장 로직을 사용하도록 헬퍼로 추출하여 코드 중복을 줄였습니다.

## 변경사항 요약

- `useContextMode.ts`: `restoreSelections` 함수 추가 (모달/드롭다운 없이 상태만 복원)
- `useConversations.ts`: `CachedConversationContext` 인터페이스에 `signature`와 `selection` 필드 추가, `getConversationSelection` 함수 추가, `cacheContext` 헬퍼 도입, 캐시 조회 시 시그니처 비교 로직 추가
- `AIRoomPage.tsx`: `handleSelectConversation`에서 캐시된 selection 복원 로직 추가

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

없음

### Medium (개선 권장)

**1. `restoreSelections` 호출 후 `getConversationMode` fallback이 mode만 복원하고 class/students는 초기화하지 않음**

- **위치 (라인 번호)**: `AIRoomPage.tsx` 72-82번째 줄
- **기존 코드**:
```typescript
const selection = getConversationSelection(convId);
if (selection) {
  contextMode.restoreSelections(
    selection.mode,
    selection.selectedClass,
    selection.selectedStudents,
  );
  return;
}

const convMode = getConversationMode(convId);
if (convMode) contextMode.setMode(convMode);
```

`getConversationSelection`은 `contextCacheRef`에서 조회합니다. 그런데 `contextCacheRef`는 `handleSend`가 실행될 때만 저장됩니다. 즉, **메시지를 한 번도 보내지 않은 대화**로 전환할 때는 `selection`이 `undefined`여서 `getConversationMode`로 fallback 됩니다.

이 fallback 경로에서는 `setMode(convMode)`만 호출합니다. 이때 `selectedClass`와 `selectedStudents`는 이전 대화의 값이 그대로 남아 있습니다. 예를 들어, 대화 A에서 'student' 모드로 특정 학생을 선택한 상태에서, 메시지를 보낸 적 없는 대화 B로 전환하면 mode는 `'all'`로 바뀌지만 `selectedStudents`는 대화 A의 값이 남아 `isPromptDisabled` 계산에 영향을 줄 수 있습니다.

다만, 주석에서 "이후 전송 시 시그니처 불일치로 현재 선택 기준 컨텍스트가 재빌드"된다고 명시하고 있고, 실제로 `handleSend`에서 `selectionSignature`를 현재 선택 기준으로 새로 계산하므로 기능상 문제는 없습니다. UX 측면에서 헤더에 이전 대화의 학생 목록이 잠시 보일 수 있다는 점만 고려하면 됩니다.

**개선 제안**: fallback 경로에서도 `resetSelections`를 호출하거나, `restoreSelections`에 mode만 전달하는 방식으로 변경할 수 있습니다.

```typescript
const convMode = getConversationMode(convId);
if (convMode) {
  contextMode.restoreSelections(convMode, null, []);
}
```

---

## 주요 파일 분석

### `useContextMode.ts`

**변경 내용:** `restoreSelections` 함수 추가 (3줄)

```typescript
const restoreSelections = (newMode: ContextMode, cls: Class | null, students: Student[]) => {
  setMode(newMode);
  setSelectedClass(cls);
  setSelectedStudents(students);
};
```

**분석**: `handleModeChange`와 달리 드롭다운/모달을 열지 않고 상태만 복원합니다. 함수명과 주석이 명확하고, `handleModeChange`와의 역할 분리가 잘 되어 있습니다. 특별한 이슈 없음.

### `useConversations.ts`

**변경 내용:** `CachedConversationContext` 인터페이스 확장, `getConversationSelection` 추가, `cacheContext` 헬퍼 도입, 캐시 조회 시 시그니처 비교 로직 추가

**핵심 로직 분석**:

1. **시그니처 생성** (`handleSend` 내부):
```typescript
const selectionSignature = [
  mode,
  selectedClass?.id ?? '',
  selectedStudents
    .map((s) => s.id)
    .sort()
    .join(','),
].join('|');
```
`studentIds`를 정렬하여 조인함으로써, 동일한 학생 집합이면 항상 동일한 시그니처가 생성되도록 보장합니다.

2. **캐시 저장 헬퍼**:
```typescript
const cacheContext = (id: string, built: NonNullable<AssistantResponse['builtContext']>) => {
  contextCacheRef.current.set(id, {
    ...built,
    signature: selectionSignature,
    selection: { mode, selectedClass, selectedStudents },
  });
};
```
`...built`로 `ragContext`와 `aliasMap`을 확산시키고, `signature`와 `selection`을 추가합니다.

3. **캐시 조회 시 시그니처 검증**:
```typescript
const cached = contextCacheRef.current.get(convId);
const cachedContext =
  cached && cached.signature === selectionSignature
    ? { ragContext: cached.ragContext, aliasMap: cached.aliasMap }
    : null;
```
시그니처가 일치할 때만 캐시를 재사용하고, 일치하지 않으면 `null`을 반환하여 컨텍스트 재빌드를 유도합니다.

**개선 제안**: 특별한 이슈 없음. `getConversationSelection`의 반환 타입이 인터페이스에 명시된 대로 `| undefined`를 포함하고 있으며, 실제 구현에서도 `Map.get()`의 `?.` 체이닝으로 정확히 동일한 타입을 반환합니다.

### `AIRoomPage.tsx`

**변경 내용:** `handleSelectConversation`에서 캐시된 selection 복원 로직 추가

```typescript
const handleSelectConversation = (convId: string) => {
  rawHandleSelectConversation(convId);

  const selection = getConversationSelection(convId);
  if (selection) {
    contextMode.restoreSelections(
      selection.mode,
      selection.selectedClass,
      selection.selectedStudents,
    );
    return;
  }

  const convMode = getConversationMode(convId);
  if (convMode) contextMode.setMode(convMode);
};
```

**분석**: `rawHandleSelectConversation`(useConversations 내부의 `handleSelectConversation`)가 먼저 `setActiveConversationId`를 호출한 후, 캐시된 selection을 조회하여 복원합니다. 캐시가 없으면 `getConversationMode`로 mode만 fallback 복원합니다. 위 Medium 항목에서 언급한 fallback 경로의 `selectedClass`/`selectedStudents` 잔류 문제 외에는 특별한 이슈 없음.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [x] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [ ] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

이 커밋은 대화 전환 시 컨텍스트 선택 상태를 복원하는 기능과 캐시 시그니처 기반 무효화 로직을 잘 구현했습니다. 시그니처를 `mode|classId|studentIds` 조합으로 단순화한 점, `restoreSelections`와 `handleModeChange`의 역할을 명확히 분리한 점, `cacheContext` 헬퍼로 중복을 제거한 점이 인상적입니다. fallback 경로에서 `selectedClass`/`selectedStudents`가 초기화되지 않는 점은 주석으로 의도가 설명되어 있고 기능상 문제가 없으므로, 현재 상태로도 충분히 실무에 통용될 수 있는 품질입니다. 조건부 승인하며, Medium 제안은 선택적으로 반영하시면 됩니다.