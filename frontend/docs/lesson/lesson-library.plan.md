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
| 프론트 FilterPanel | `features/lesson/ui/FilterPanel` | Emotion 스타일 적용 완료 (아래 §4.3) |
| feature / widget | `features/lesson`, `widgets/lesson` | Phase 1 UI·로컬 훅 배치됨 |

### 프로토타입 필터 축

- **퀵**: 학교급(`level`), 추천학년(`grade`)
- **상세(접기)**: 제공처(`provider`), SEL영역(`selArea`), 수업시간(`duration`), 검사요인(`factor`), 정렬(`sort`), 초기화

taxonomy 상수 원본: `prototype/.../mock-data.ts`의 `PROVIDERS`, `SEL_AREAS`, `LEVELS`, `GRADES`, `DURATIONS`, `FACTORS_SHORT`  
프론트 키: `casel` → `selArea`, `SortKey`는 `'popular' \| 'newest' \| 'saved'` (라벨은 `SORT_KEYS_LABELS`)

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

### 4.0 공통 후보 점검 결과 (적용)

| 후보 | 경로 | FilterPanel에 맞는지 | 결론 (적용) |
|------|------|----------------------|-------------|
| `MultiSelectButtonGroup` | `shared/ui/MultiSelectButtonGroup` | 폼용 라벨·힌트·solid fill | **미사용**. 패턴 참고만 |
| `Button` (`outline`/`ghost`, `size="sm"`) | `shared/ui/Button` | outline이 primary 테두리라 prototype(gray border)과 불일치 | **미사용**. feature 로컬 `PanelButton` |
| `Card` | `shared/ui/Card` | `padding.lg`(24px). prototype은 `p-4`(16px) | **미사용**. feature 로컬 `Panel` (`theme.spacing.md`) |
| `PageTitle` | `shared/ui/PageTitle` | 스케일 불일치 | **미사용**. 위젯 섹션 Title 유지 |
| `Badge` / `TypeBadge` / `LevelBadge` | `shared/ui/*` | 토글 버튼 아님 | **미사용** |

### 4.1 feature 로컬 styled (적용)

| styled | 역할 | 주요 theme / props |
|--------|------|-------------------|
| `Panel` | 외곽 카드 | `radius.xl`, `gray[200]` border, `background.paper`, `spacing.md` padding·하단 margin |
| `QuickFilters` | 퀵 행 | flex-wrap, align center, gap `6px` |
| `Divider` | 학교급↔학년 구분선 | 1×16px, `gray[200]`, `spacing.xs` 좌우 |
| `Details` | 상세 영역 | 상단 `gray[100]` border, `spacing.md`/`sm` |
| `DetailLastRow` | 정렬 + 초기화 | space-between, wrap |
| `Group` / `Label` / `Chips` | AxisRow (`FilterGroup`) | `$compact`: 퀵·정렬은 인라인, 상세는 라벨 고정폭 `64px` |
| `Chip` | 토글 칩 | `$active`, `radius.full`, primary / gray 토큰 |
| `PanelButton` | 상세 필터·초기화 | `$pushEnd`(퀵 행 우측), Lucide 14px |

칩을 `shared/ui`로 승격하는 것은 **같은 패턴이 2곳 이상**에서 필요할 때로 미룬다.

### 4.2 Emotion 규칙

- Transient props: `$active`, `$compact`, `$pushEnd` (`$` prefix)
- 색: `theme.colors.primary[500]` / `primary[50]` / `primary[600]`, `theme.colors.gray.*`, `theme.colors.background.paper`
- 제어 컴포넌트: `filters` / `onToggle` / `onClear` / `sort` / `onSort`
- 상세 열림만 내부 `useState(open)`
- ▴/▾/✕ → Lucide (`ChevronUp` / `ChevronDown` / `X`) (이모지 금지)
- import는 `@features/lesson` barrel이 아니라 `../../model/*` 상대 경로 (순환 import 방지)

### 4.3 Chip / PanelButton 상태 스펙 (적용)

**Chip**

| 상태 | border | background | color |
|------|--------|------------|-------|
| `$active` | `primary[500]` | `primary[50]` | `primary[600]` |
| 기본 | `gray[200]` | `background.paper` | `gray[600]` |
| hover(비활성) | `gray[300]` | (유지) | (유지) |

- padding `4px 10px`, `fontSize.xs`, `fontWeight.semibold`, `transitions.fast`

**PanelButton**

- transparent 배경, `gray[200]` border, `radius.lg`, hover `gray[50]`
- `$pushEnd`: `margin-left: auto` (퀵 행에서 상세 필터를 우측 정렬)

---

## 5. Phase 1 — UI만 (이번 작업)

### 5.1 타입 / 상수

`features/lesson/model`에 둔다. 목록 mock(`LIB`)은 **가져오지 않는다**.

```ts
// types.ts (적용)
export type FilterAxis = 'provider' | 'selArea' | 'level' | 'grade' | 'duration' | 'factor';
export type LibFilters = Record<FilterAxis, string[]>;
export type SortKey = 'popular' | 'newest' | 'saved';

export const EMPTY_FILTERS: LibFilters = {
  level: [], grade: [], provider: [], selArea: [], duration: [], factor: [],
};
```

### 5.2 `useLibraryFilters` (로컬 UI 상태)

`CLAUDE.md`: 모달/탭/선택 같은 화면 상호작용만 `useState`.

- `filters`, `sort`
- `toggle(axis, val)`, `clear()`, `setSort(s)`
- API 없음. 목록 필터링(`matchLibF`)도 Phase 1에서 **하지 않음**

### 5.3 `FilterPanel` 구현 순서 (CSS 적용 완료)

1. `shared/ui` 재확인 → `Button`/`Card`는 prototype 톤·padding 불일치로 **미사용** (§4.0)
2. feature 로컬 Emotion: `Panel`, `Chip`, `FilterGroup`(`Group`/`Label`/`Chips`), `PanelButton`, `Divider`, `Details` (§4.1·§4.3)
3. 프로토타입 동작 복제: 퀵(level|grade + 상세 토글) → 상세 펼침 → 정렬·초기화
4. 검증: `tsc -b --noEmit`, ESLint 통과

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

- [x] Header에서 Filter가 Title 위에 보임
- [x] 칩 토글 / 상세 펼침 / 정렬 / 초기화 UI 동작
- [x] Tailwind 없음, Emotion + theme만 (§4.3)
- [x] 공통 UI 점검 후 `Button`/`Card`는 톤·padding 불일치로 로컬 styled 사용 (§4.0)
- [x] page에 FilterPanel styled·필터 로직 없음
- [x] 경로가 `features/lesson`, `widgets/lesson`
- [x] `tsc -b` / ESLint 통과 (`any` 금지, `import type` 준수)
- [x] 목록·API 호출 없음 (Phase 2)

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

1. [x] `shared/ui` 공통 후보 재확인 → `Button`/`Card` 미사용 결정
2. [x] `features/lesson/model/types.ts` + `filterTaxonomy.ts`
3. [x] `features/lesson/model/useLibraryFilters.ts`
4. [x] `features/lesson/ui/FilterPanel` — Emotion CSS 적용 (§4.1·§4.3)
5. [x] `widgets/lesson/LessonLibraryHeader` (Filter 위 + Title/Description)
6. [x] `LessonLibraryPage`를 위젯 조합만 남기고 정리
7. [x] `features/lesson/index.ts`, `widgets/lesson/index.ts` public export
8. [ ] 시각·접근성 확인 (칩 클릭, 상세 토글) — 런타임 수동 확인 권장
9. [ ] Phase 2 목록 API 연동

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
**수정**: 2026-08-12 — FilterPanel Emotion CSS 적용 반영 (§4.0~4.3, Phase 1 체크리스트)  
**상태**: Phase 1 UI·CSS 적용 완료 / Phase 2(API) 미착수
