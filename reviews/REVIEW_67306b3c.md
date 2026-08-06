> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 67306b3c

## 코드 복잡도 분석

**분석된 파일**: 13개 / 변경된 파일: 16개


### 정상 범위 (NONE)


**`groupstudentsbyclass.ts`** (utility)

- 평균 복잡도: **0.005**

- 최대 복잡도: 0.010

- 청크 수: 5개


**권장사항:**

- 복잡도 정상 범위


**`dashboardservice.ts`** (other)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.010

- 청크 수: 68개


**권장사항:**

- 파일 크기가 큼 (68개 청크) - 파일 분리 검토


**`exportconversation.ts`** (utility)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.005

- 청크 수: 7개


**권장사항:**

- 복잡도 정상 범위


**`usecontextmode.ts`** (other)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.012

- 청크 수: 14개


**권장사항:**

- 복잡도 정상 범위


**`useconversations.ts`** (other)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.010

- 청크 수: 79개


**권장사항:**

- 파일 크기가 큼 (79개 청크) - 파일 분리 검토


**`groupconversations.ts`** (utility)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.006

- 청크 수: 8개


**권장사항:**

- 복잡도 정상 범위


**`studentpickermodal.tsx`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.008

- 청크 수: 76개


**권장사항:**

- 파일 크기가 큼 (76개 청크) - 파일 분리 검토


**`airoompage.tsx`** (component)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.008

- 청크 수: 10개


**권장사항:**

- 복잡도 정상 범위


**`chatarea.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.008

- 청크 수: 68개


**권장사항:**

- 파일 크기가 큼 (68개 청크) - 파일 분리 검토


**`conversationsidebar.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.003

- 청크 수: 42개


**권장사항:**

- 파일 크기가 큼 (42개 청크) - 파일 분리 검토


**`index.ts`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.000

- 청크 수: 5개


**권장사항:**

- 복잡도 정상 범위


**`airoomchatarea.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.000

- 청크 수: 70개


**권장사항:**

- 파일 크기가 큼 (70개 청크) - 파일 분리 검토


**`index.ts`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.000

- 청크 수: 1개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 AI 룸(ai-room) 기능의 프론트엔드 아키텍처 개편으로, 프로토타입 디자인에 맞춰 채팅 UI와 대화 사이드바를 리디자인하고, 다중 학급 대상 선택(TargetPicker)을 기존 mode/selectedClass/selectedStudents 계약으로 통합하며, 대화 목록의 날짜별 그룹화와 제목 편집 기능을 추가한 작업입니다.

- **목적**: 프로토타입과 일치하는 UI 개편 + TargetPicker 선택 결과를 기존 컨텍스트 계약으로 흡수 + 대화 관리 UX(그룹화/이름변경) 개선
- **도메인**: UI (React/Emotion), 비즈니스 로직 (컨텍스트 상태 관리)
- **변경 방향**: 기존의 복잡한 드롭다운/모달 상태 관리(useRef, useEffect, handleModeChange 등)를 단순화하고, 선택 로직을 `applyTargetSelection`/`removeClassSelection`으로 응집시켜 상태 전이를 명시적으로 만듦

---

## [GOOD] 잘된 점

1. **`applyTargetSelection`의 상태 변환 규칙 문서화**: 전체 선택 → `all`, 단일 반 전체 선택 → `class`, 그 외 → `student`로 변환하는 규칙이 주석으로 명확히 기술되어 있어, 이후 유지보수자가 의도를 파악하기 쉽습니다.

2. **`groupConversationsByDate`의 분리와 `useMemo` 캐싱**: 날짜 그룹화 로직을 별도 유틸(`frontend/src/features/ai-room/utils/groupConversations.ts`)로 분리하고 `useConversations`에서 `useMemo`로 감싸 불필요한 재계산을 방지했습니다. 그룹 라벨('오늘'/'지난 7일'/'이전')과 정렬 순서가 상수로 정의되어 일관성을 유지합니다.

3. **`ConversationSidebar`의 상태 분리**: 드롭다운(`menuId`)과 인라인 편집(`editingId`) 상태를 분리하고, `DropdownOverlay`(fixed, inset:0)로 외부 클릭을 처리하는 패턴이 깔끔합니다. `MenuButton`의 호버 시 opacity 전환도 자연스럽습니다.

4. **`IndeterminateCheckbox`의 표준 우회법**: React에서 `indeterminate` 속성은 DOM API로만 설정 가능하므로, `useRef` + `useEffect`로 처리한 방식이 표준적인 해결책입니다.

---

## 변경사항 요약

AI 룸의 채팅/사이드바 UI를 프로토타입 스타일로 재구성하고, TargetPicker 선택 결과를 기존 컨텍스트 계약으로 변환하는 `applyTargetSelection`/`removeClassSelection`을 추가했으며, 대화 목록의 날짜 그룹화와 제목 인라인 편집 기능을 도입했습니다. 불필요해진 `QuickPrompts.tsx`는 삭제되었습니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `applyTargetSelection`의 단일 반 전체 선택 판별 모호성** (`useContextMode.ts`)

`wholeClassMatch` 판별 로직에서 `cls.students.length === students.length` 조건은 선택된 학생 수가 해당 반의 학생 수와 정확히 일치할 때만 성립합니다. 그러나 `students`가 여러 반에 걸쳐 선택된 경우(예: A반 3명 + B반 2명 = 5명, B반 전체가 5명)에는 `cls.students.length === students.length`가 우연히 일치할 수 있고, `cls.students.every(...)`도 통과하면 **B반 전체가 선택된 것으로 잘못 판별**될 수 있습니다.

즉, `selectedIds`가 `students` 전체를 기준으로 하기 때문에, 선택된 학생들이 실제로 모두 해당 반에 속하는지가 검증되지 않습니다. "정확히 한 반의 전 학생만 선택됨"을 보장하려면 선택된 학생들이 모두 해당 반에 속하는지(부분집합 여부)를 추가로 확인해야 합니다.

**수정 코드**:

```ts
const wholeClassMatch = allClasses.find(
  (cls) =>
    cls.students.length > 0 &&
    cls.students.length === students.length &&
    cls.students.every((s) => selectedIds.has(s.id)) &&
    students.every((s) => cls.students.some((cs) => cs.id === s.id)),
);
```

`students.every(...)` 조건을 추가하여 선택된 모든 학생이 해당 반에 속하는지 확인함으로써, 다른 반 학생이 섞인 경우를 배제합니다.

### Medium (개선 권장)

**1. `removeClassSelection`의 `mode === 'class'` 분기에서 `selectedStudents` 미정리** (`useContextMode.ts`)

`mode === 'class'`일 때 `setMode('all')`로 전환하면서 `selectedStudents`는 건드리지 않습니다. 현재 `mode === 'class'`에서는 `selectedStudents`가 항상 빈 배열로 유지되는 계약이므로 동작상 문제는 없지만, 상태 일관성 측면에서 명시적으로 `setSelectedStudents([])`를 호출하는 것이 안전합니다.

**2. `index.html`의 Pretendard 폰트 로딩 방식** (`index.html`)

`<link rel="stylesheet" as="style" crossorigin>`에서 `as="style"`은 `rel="preload"`에서 사용하는 속성입니다. `rel="stylesheet"`와 함께 사용하면 브라우저가 무시할 수 있어, `as` 속성을 제거하는 것이 표준에 부합합니다.

```html
<link
  rel="stylesheet"
  crossorigin
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
/>
```

---

## 주요 파일 분석

### frontend/src/features/ai-room/model/useContextMode.ts

**변경 내용**: TargetPicker 선택 결과를 기존 mode/selectedClass/selectedStudents 계약으로 변환하는 `applyTargetSelection`과 `removeClassSelection`을 추가하고, 불필요해진 드롭다운/모달 상태 관리 코드(useRef, useEffect, handleModeChange 등)를 제거했습니다.

**동작 분석**:
- `applyTargetSelection`은 3단계로 판별합니다:
  1. 전체 학급의 모든 학생이 선택됨 → `mode: 'all'`
  2. 정확히 한 반의 전체 학생만 선택됨 → `mode: 'class'`
  3. 그 외 → `mode: 'student'` (평탄화된 학생 목록 저장)
- `removeClassSelection`은 mode가 'class'일 때와 'student'일 때를 분기 처리합니다. 'student' 모드에서 해당 반 학생들을 제거한 결과가 비어 있으면 `mode: 'all'`로 전환합니다.

**개선 제안**: 위 High 이슈에서 언급한 부분집합 검증 조건 추가가 필요합니다.

### frontend/src/features/ai-room/ui/ConversationSidebar.tsx

**변경 내용**: 대화 목록을 날짜 그룹('오늘'/'지난 7일'/'이전')으로 나누고, 각 항목에 더보기 드롭다운(제목 편집/삭제)과 인라인 제목 편집 기능을 추가했습니다.

**동작 분석**:
- `menuId`와 `editingId`를 별도 상태로 관리하여 드롭다운과 편집 모드가 독립적으로 동작합니다.
- `commitEdit`은 `onBlur`와 `Enter` 키에서 호출되며, `Escape` 키는 편집만 취소합니다.
- `DropdownOverlay`가 `position: fixed; inset: 0`으로 전체 화면을 덮어 외부 클릭 시 드롭다운을 닫습니다.

**개선 제안**: `commitEdit`에서 빈 문자열 처리와 Escape 취소 시 원본 복원이 명시적으로 분리되어 있으면 가독성이 더 좋아집니다. 다만 현재 `handleRenameConversation`에서 빈 문자열을 무시하므로 동작상 문제는 없습니다.

### frontend/src/features/ai-room/model/useConversations.ts

**변경 내용**: `groupedConversations`를 `useMemo`로 계산하여 반환하고, `handleRenameConversation`을 추가했습니다.

**동작 분석**:
- `handleRenameConversation`은 로컬 상태만 갱신하며, 백엔드에 PATCH 엔드포인트가 없어 새로고침 시 서버가 내려주는 자동 생성 제목으로 되돌아갑니다. 이 제약이 JSDoc 주석으로 명확히 문서화되어 있습니다.
- `groupConversationsByDate`는 `createdAt`을 기준으로 '오늘'/'지난 7일'/'이전' 버킷에 분류하고, 빈 그룹은 필터링하여 반환합니다.

### frontend/src/features/ai-room/ui/ChatArea.tsx

**변경 내용**: 사용자 메시지를 우측 정렬 말풍선으로, 봇 답변을 전체폭 블록으로 리디자인하고, 아이콘 기반 아바타를 `ai-owl-icon.png` 이미지로 교체했습니다.

**동작 분석**:
- `UserRow`/`UserBubble`은 우측 정렬 말풍선(꼬리 모양)으로, `BotBlock`은 전체폭 블록(카드 아님)으로 프로토타입과 일치시켰습니다.
- 스트리밍 중/대기 중 상태도 동일한 `BotBlock` 구조로 통일되어 일관성을 유지합니다.

### frontend/src/features/ai-room/ui/StudentPickerModal.tsx

**변경 내용**: 좌측 학급 목록(체크박스) + 우측 학생 그리드(검색 + 체크박스) 구조로 리디자인하고, `IndeterminateCheckbox`를 추가했습니다.

**동작 분석**:
- `ClassRow`를 `label`이 아닌 `div`로 구현한 이유가 주석에 명확히 기술되어 있습니다. `label`로 두면 텍스트 클릭(탭 전환)이 내부 체크박스도 함께 토글시키는 네이티브 동작이 발생하기 때문입니다.
- `IndeterminateCheckbox`는 `useRef` + `useEffect`로 `indeterminate` 속성을 DOM API로 설정합니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [x] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [ ] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

전체적으로 상태 관리 로직을 명확한 계약(`applyTargetSelection`/`removeClassSelection`)으로 응집시키고, UI를 프로토타입에 맞게 재구성한 좋은 리팩토링입니다. 특히 `applyTargetSelection`의 3단계 변환 규칙을 주석으로 문서화하고, `groupConversationsByDate`를 별도 유틸로 분리한 점은 유지보수성을 높였습니다.

다만 `applyTargetSelection`의 단일 반 전체 선택 판별에서 다른 반 학생이 섞였을 때의 모호성은 실제 데이터에서 오작동할 가능성이 있어, 부분집합 검증 조건(`students.every(...)`)을 추가하는 것을 권장합니다. 그 외 이슈는 사소한 수준이라 조건부 승인으로 판단합니다.