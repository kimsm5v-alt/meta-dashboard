# Lesson Library FilterPanel 추가 계획

> **목표**: 프로토타입 `FilterPanel` UI를 `LessonLibraryPage` Header 내 Title **위**에 배치한다.  
> **범위**: UI + 로컬 필터 상태만. 목록 API 연동은 후속 Phase.  
> **준수**: `frontend/CLAUDE.md` (FSD Lite, Emotion, 서버/로컬 상태 분리)

---

## 1. 현황 요약

| 구분 | 위치 | 비고 |
|------|------|------|
| 프로토타입 UI | `prototype/.../library/FilterPanel.tsx` | Tailwind. **디자인 참조만** (`CLAUDE.md`: prototype은 구조 참고 금지) |
| 프로토타입 상태 | `LibraryView`의 `useState` | `filters` / `sort` / `toggle` / `clear` |
| 프론트 페이지 | `frontend/src/pages/lesson/LessonLibraryPage.tsx` | Title + Description만. styled가 page에 있음 → FSD 위반 상태 |
| feature / widget | `features/lesson`, `widgets/lesson` | 아직 없음 → 신규 생성 |

### 프로토타입 필터 축

- **퀵**: 학교급(`level`), 추천학년(`grade`)
- **상세(접기)**: 제공처(`provider`), SEL영역(`casel`), 수업시간(`duration`), 검사요인(`factor`), 정렬(`sort`), 초기화

taxonomy 상수 원본: `prototype/.../mock-data.ts`의 `PROVIDERS`, `SEL_AREAS`, `LEVELS`, `GRADES`, `DURATIONS`, `FACTORS_SHORT`

---

## 2. 배치 (레이아웃)

사용자 의도: Header 안, Title **위**.

```
Page
└─ Header (LessonLibraryHeader 위젯)
   ├─ FilterPanel          ← 추가
   ├─ Title                "전체 자료실"
   └─ Description          "검증 · 비검증 · ..."
```

프로토타입(`FilterPanel` → 그 아래 Title)과 순서는 동일.  
간격은 Header 내 `gap`으로 맞춤 (예: `theme.spacing.md`).

---

## 3. FSD 배치 (필수)

`pages → widgets → features → shared` 단방향.  
**Pages는 얇게** — styled / 필터 로직을 page에 두지 않는다.

**도메인 경로**: `features/lesson`, `widgets/lesson` (resources 경로 사용 금지).

```
features/lesson/
├── model/
│   ├── types.ts              # FilterAxis, LibFilters, SortKey, EMPTY_FILTERS
│   ├── filterTaxonomy.ts     # 칩 옵션 상수 (API 무관 taxonomy)
│   └── useLibraryFilters.ts  # 로컬 UI 상태 훅 (toggle/clear/setSort)
├── ui/
│   └── FilterPanel/
│       ├── FilterPanel.tsx   # Emotion 제어 컴포넌트
│       └── index.ts
└── index.ts                  # public export

widgets/lesson/
├── LessonLibraryHeader.tsx   # FilterPanel + Title + Description 조합
└── index.ts

pages/lesson/
└── LessonLibraryPage.tsx     # 위젯만 렌더 (조합만)
```

### 레이어별 역할

| 레이어 | 담당 | 금지 |
|--------|------|------|
| `features/lesson` | 필터 타입·taxonomy·FilterPanel UI·로컬 훅 | page/widget import, Tailwind |
| `widgets/lesson` | Header 섹션 조합, 훅 연결 | API fetch, page 전용 라우트 로직 |
| `pages/lesson` | `<LessonLibraryHeader />` 등 조합만 | styled, useState, 필터 로직 |

`features/resources`는 기존 스텁으로 두고, 이번 작업에서 확장하지 않는다.

---

## 4. Emotion + 공통 UI 재사용 (필수 선행)

**규칙**: Tailwind 금지. Emotion `styled` + `theme.*`만 사용.  
**선행**: 새 styled 태그를 만들기 전에 `shared/ui` (및 필요 시 `shared/components`)에 동일/유사 컴포넌트가 있는지 확인한다.

### 4.0 공통 후보 점검 결과 (구현 전 재확인)

| 후보 | 경로 | FilterPanel에 맞는지 | 결론 |
|------|------|----------------------|------|
| `MultiSelectButtonGroup` | `shared/ui/MultiSelectButtonGroup` | 복수 선택 칩과 가장 유사. 다만 폼용 라벨·`(복수 선택)` 힌트·세로 레이아웃·선택 시 solid fill | **직접 재사용은 부적합**. 칩 토글 패턴·`$selected` 스타일 참고만 |
| `Button` (`outline`/`ghost`, `size="sm"`) | `shared/ui/Button` | 상세 필터 / 필터 초기화 버튼 | **재사용 우선** |
| `Card` | `shared/ui/Card` | 패널 외곽(흰 배경·border·radius) | **재사용 검토**. padding이 크면 FilterPanel용 wrapper만 두고 Card 생략 가능 |
| `PageTitle` | `shared/ui/PageTitle` | Title+subtitle | **보류**. `3xl`/`lg`라 자료실 Header(`lg`/`sm`)와 스케일 불일치 → 위젯에서 섹션 Title 유지하거나 공통 확장 후 사용 |
| `Badge` / `TypeBadge` / `LevelBadge` | `shared/ui/*` | 표시용 badge, 토글 버튼 아님 | **사용 안 함** |

### 4.1 새 styled를 만들어도 되는 것

공통으로 대체 불가능한 UI만 feature 로컬 styled로 둔다.

- 필터 **칩** (`$active` 토글, border 스타일 — prototype 칩과 동일 UX)
- `AxisRow` (좌측 축 라벨 + 칩 줄)
- 퀵/상세 레이아웃 컨테이너, divider

칩을 `shared/ui`로 승격하는 것은 **같은 패턴이 2곳 이상**에서 필요할 때로 미룬다.

### 4.2 Emotion 규칙

- Transient props: `$active`, `$open` 등 (`$` prefix)
- 색: `theme.colors.primary[500]` / `primary[50]`, `theme.colors.gray.*`, `theme.colors.text.*`
- 제어 컴포넌트: `filters` / `onToggle` / `onClear` / `sort` / `onSort`
- 상세 열림만 내부 `useState(open)`
- ▴/▾/✕ → Lucide (`ChevronUp` / `ChevronDown` / `X`) 권장 (이모지 금지)

---

## 5. Phase 1 — UI만 (이번 작업)

### 5.1 타입 / 상수

`features/lesson/model`에 둔다. 목록 mock(`LIB`)은 **가져오지 않는다**.

```ts
// types.ts (스케치)
export type FilterAxis = 'provider' | 'casel' | 'level' | 'grade' | 'duration' | 'factor';
export type LibFilters = Record<FilterAxis, string[]>;
export type SortKey = '인기순' | '최신순' | '저장순';

export const EMPTY_FILTERS: LibFilters = {
  provider: [], casel: [], level: [], grade: [], duration: [], factor: [],
};
```

### 5.2 `useLibraryFilters` (로컬 UI 상태)

`CLAUDE.md`: 모달/탭/선택 같은 화면 상호작용만 `useState`.

- `filters`, `sort`
- `toggle(axis, val)`, `clear()`, `setSort(s)`
- API 없음. 목록 필터링(`matchLibF`)도 Phase 1에서 **하지 않음**

### 5.3 `FilterPanel` 구현 순서

1. `shared/ui` 재확인 (위 표)
2. `Button`(및 필요 시 `Card`) import
3. 부족한 칩/`AxisRow`/레이아웃만 Emotion으로 feature 내 작성
4. 프로토타입 동작 복제 (퀵 → 상세 토글 → 정렬·초기화)

### 5.4 위젯 + 페이지

```tsx
// LessonLibraryPage.tsx — 목표 형태
import { LessonLibraryHeader } from '@widgets/lesson';

export const LessonLibraryPage = () => (
  <LessonLibraryHeader />
);
```

위젯: `useLibraryFilters()` → `FilterPanel` → Title/Description.

### 5.5 Phase 1 완료 기준

- [ ] Header에서 Filter가 Title 위에 보임
- [ ] 칩 토글 / 상세 펼침 / 정렬 / 초기화 UI 동작
- [ ] Tailwind 없음, Emotion + theme만
- [ ] 공통 UI 점검 후, 가능하면 `Button`(등) 재사용
- [ ] page에 styled·필터 로직 없음
- [ ] 경로가 `features/lesson`, `widgets/lesson`
- [ ] `tsc -b` / ESLint 통과 (`any` 금지, `import type` 준수)
- [ ] 목록·API 호출 없음

---

## 6. Phase 2 — API 연동 (후속)

필터 상태는 **그대로 로컬**, 목록만 React Query.

```
features/lesson/
├── api/
│   ├── queryKeys.ts          # key factory (filters, sort 포함)
│   ├── lessonLibraryService.ts
│   └── queries.ts            # useLibraryResources(filters, sort)
```

### 권장 패턴

1. `useLibraryFilters()` → `filters`, `sort`
2. `useLibraryResources({ filters, sort })` — `queryKey`에 filters/sort 포함
3. 그리드 위젯이 `data` / `isLoading` / `isError` 소비
4. `useEffect` fetch 금지. query key factory 사용

```ts
lessonKeys.library({ filters, sort })
// → ['lesson', 'library', { filters, sort }]
```

백엔드 DTO 확정 후 service에서 쿼리 파라미터 매핑. Phase 1 taxonomy·칩 UI 재사용.

---

## 7. 하지 말 것

| 금지 | 이유 |
|------|------|
| Tailwind / prototype 클래스 복사 | frontend는 Emotion |
| 공통 UI 미확인 후 styled 남발 | `shared/ui` 재사용 우선 |
| page에 FilterPanel styled / useState | Pages는 얇게 |
| `features/resources`, `widgets/lesson-library` 등 다른 경로 | 도메인은 `lesson`으로 통일 |
| Phase 1에서 `LIB` mock 필터링 이식 | 목록/API는 후속 |
| Phase 1에서 빈 React Query 훅 | 서버 상태 없이 query 금지 |
| feature 간 cross-import | 같은 레이어 cross-import 금지 |

---

## 8. 구현 순서 (체크리스트)

1. `shared/ui` 공통 후보 재확인 (`Button`, `Card`, `MultiSelectButtonGroup`, `PageTitle`)
2. `features/lesson/model/types.ts` + `filterTaxonomy.ts`
3. `features/lesson/model/useLibraryFilters.ts`
4. `features/lesson/ui/FilterPanel` — 공통 재사용 + 부족분만 Emotion
5. `widgets/lesson/LessonLibraryHeader` (Filter 위 + Title/Description)
6. `LessonLibraryPage`를 위젯 조합만 남기고 정리
7. `features/lesson/index.ts`, `widgets/lesson/index.ts` public export
8. 시각·접근성 확인 (칩 클릭, 상세 토글)

---

## 9. 참고 파일

- UI 참조: `prototype/src/features/resources/components/library/FilterPanel.tsx`
- 사용처 참조: `prototype/.../LibraryView.tsx` (상태 소유 패턴만)
- taxonomy: `prototype/src/features/resources/mock-data.ts` (상수 구간만)
- 대상 페이지: `frontend/src/pages/lesson/LessonLibraryPage.tsx`
- 공통 UI: `frontend/src/shared/ui/` (`Button`, `Card`, `MultiSelectButtonGroup`, `PageTitle`)
- 가이드: `frontend/CLAUDE.md` — FSD, Emotion `$` props, 로컬 vs React Query

---

**작성일**: 2026-08-06  
**수정**: 2026-08-06 — Emotion 전용 + 공통 UI 선행 점검, 경로를 `features/lesson` / `widgets/lesson`로 변경  
**상태**: 계획만 (구현 미착수)
