# Lesson Library 구현 계획

> **도메인**: 전체 자료실 (`LessonLibraryPage`)  
> **준수**: `frontend/CLAUDE.md` (FSD Lite, Emotion, 서버/로컬 상태 분리)  
> **프로토타입 참조**: UI/동작만. 코드 구조·Tailwind 복제 금지

| 구분 | 내용 | 상태 |
|------|------|------|
| **추가계획1** | `FilterPanel` UI + 로컬 필터 상태 | Phase 1 완료 / API 미착수 |
| **추가계획2** | Contents Description 아래 자료 목록(`ResourceCardList`) + 필터 연동(목업) | Phase A 완료 / Phase B 대기 |
| **추가계획3** | `LessonMyPage` 나의 자료 목록 — `ResourceCardList` `variant="my"` + 목업 | Phase A 완료 / API 대기 |
| **추가계획4** | `ResourceCard` 시작하기 버튼 → 활동 배포 페이지 (`DeployPage`) 라우트 연결 | 계획 수립 완료 / 구현 대기 |
| **구조** | `Page → FilterPanel + LessonLibraryContents` (`LessonLibraryHeader` 위젯 제거) | 적용됨 |
| **ui 레이아웃** | `features/lesson/ui/*.tsx` 평탄 구조 (`FilterPanel/FilterPanel.tsx` 중첩 제거) | 적용됨 |
| **목록 API** | CMS `POST .../api/contents/setSearch` (임시 스펙) | 초안 수신 · 확정 전 |

---

# 추가계획1 — Lesson Library FilterPanel 추가 계획

> **목표**: 프로토타입 `FilterPanel` UI를 `LessonLibraryPage` Header 내 Title **위**에 배치한다.  
> **범위**: UI + 로컬 필터 상태만. 목록 API 연동은 후속 Phase(추가계획2 이후 또는 병행).  
> **준수**: `frontend/CLAUDE.md` (FSD Lite, Emotion, 서버/로컬 상태 분리)

---

## 1. 현황 요약

| 구분 | 위치 | 비고 |
|------|------|------|
| 프로토타입 UI | `prototype/.../library/FilterPanel.tsx` | Tailwind. **디자인 참조만** (`CLAUDE.md`: prototype은 구조 참고 금지) |
| 프로토타입 상태 | `LibraryView`의 `useState` | `filters` / `sort` / `toggle` / `clear` |
| 프론트 FilterPanel | `features/lesson/ui/FilterPanel.tsx` | Emotion 스타일 적용 완료 (아래 §4.3) |
| feature / widget | `features/lesson`, `widgets/lesson` | Phase 1 UI·로컬 훅 배치됨 |

### 프로토타입 필터 축

- **퀵**: 학교급(`level`), 추천학년(`grade`)
- **상세(접기)**: 제공처(`provider`), SEL영역(`selArea`), 수업시간(`duration`), 검사요인(`factor`), 정렬(`sort`), 초기화

taxonomy 상수 원본: `prototype/.../mock-data.ts`의 `PROVIDERS`, `SEL_AREAS`, `LEVELS`, `GRADES`, `DURATIONS`, `FACTORS_SHORT`  
프론트 키: `casel` → `selArea`, `SortKey`는 `'popular' \| 'newest' \| 'saved'` (라벨은 `SORT_KEYS_LABELS`)

---

## 2. 배치 (레이아웃)

프로토타입 순서: Filter → Title → Description → (목록).

```
LessonLibraryPage
├─ FilterPanel                 ← features (page에서 직접 조합)
└─ LessonLibraryContents       ← widgets (Title + Description [+ 목록])
    ├─ Title                   "전체 자료실"
    ├─ Description             "검증 · 비검증 · ..."
    └─ ResourceCardList        ← 추가계획2
```

> **구조 결정 (2026-08-12)**: `LessonLibraryHeader` 위젯은 FilterPanel만 감싸는 얇은 래퍼라 제거.  
> `pages → features` import는 FSD Lite에서 허용. page는 훅·조합만 두고 styled/목록 로직은 두지 않음.  
> 필터↔목록 공유: page의 `useLibraryFilters()` 결과를 Contents(추가계획2)에 props로 전달.  
> **ui 평탄화 (2026-08-12)**: `ui/FilterPanel/FilterPanel.tsx` 중첩 폴더 제거 → `ui/FilterPanel.tsx` 등 파일 단위로 배치.  
> **이름 (2026-08-12)**: `ResourceGrid` → `ResourceCardList`.

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
│   ├── FilterPanel.tsx       # Emotion 제어 컴포넌트 (평탄 구조)
│   ├── ResourceCard.tsx
│   ├── ResourceCardList.tsx
│   ├── LessonEditorEmbed.tsx
│   └── LessonViewerEmbed.tsx
└── index.ts                  # public export

widgets/lesson/
├── LessonLibraryContents.tsx   # Title + Description (+ ResourceCardList)
└── index.ts

pages/lesson/
└── LessonLibraryPage.tsx       # useLibraryFilters + FilterPanel + Contents 조합
```

### 레이어별 역할

| 레이어 | 담당 | 금지 |
|--------|------|------|
| `features/lesson` | 필터 타입·taxonomy·FilterPanel UI·로컬 훅 | page/widget import, Tailwind |
| `widgets/lesson` | Contents 섹션(Title/Description/ResourceCardList) | API fetch, page 전용 라우트 로직 |
| `pages/lesson` | `useLibraryFilters` + `<FilterPanel />` + `<LessonLibraryContents />` 조합 | styled, match/sort·목업·목록 마크업 |

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

### 5.4 페이지 조합 (적용)

```tsx
// LessonLibraryPage.tsx
import { FilterPanel, useLibraryFilters } from '@features/lesson';
import { LessonLibraryContents } from '@widgets/lesson';

export const LessonLibraryPage = () => {
  const { filters, sort, onToggle, onClear, onSort } = useLibraryFilters();
  return (
    <>
      <FilterPanel filters={filters} sort={sort} onToggle={onToggle} onClear={onClear} onSort={onSort} />
      <LessonLibraryContents />
    </>
  );
};
```

`LessonLibraryHeader` 위젯은 제거됨. Title/Description은 Contents 위젯.

### 5.5 Phase 1 완료 기준

- [x] Page에서 Filter가 Contents(Title) 위에 보임
- [x] 칩 토글 / 상세 펼침 / 정렬 / 초기화 UI 동작
- [x] Tailwind 없음, Emotion + theme만 (§4.3)
- [x] 공통 UI 점검 후 `Button`/`Card`는 톤·padding 불일치로 로컬 styled 사용 (§4.0)
- [x] page에 FilterPanel styled·목록 로직 없음 (훅·조합만)
- [x] `LessonLibraryHeader` 제거, `Page → FilterPanel + Contents`
- [x] 경로가 `features/lesson`, `widgets/lesson`
- [x] `tsc -b` / ESLint 통과 (`any` 금지, `import type` 준수)
- [x] 목록·API 호출 없음 (Phase 2)

---

## 6. Phase 2 — API 연동 (후속)

> **추가계획2와 관계**: 목록 UI·목업은 추가계획2 Phase A.  
> 실제 연동은 추가계획2 **Phase B** + 아래 임시 스펙(`setSearch`)을 따른다.  
> **주의**: 스펙은 임시라 필드·매핑이 언제든 바뀔 수 있다. 확정 전 하드코딩·과도한 타입 고정 지양.

필터 상태는 **그대로 로컬**, 목록만 React Query.

```
features/lesson/
├── api/
│   ├── queryKeys.ts          # key factory (filters, sort 포함)
│   ├── lessonLibraryService.ts  # setSearch 호출 + DTO→LibItem 매핑
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

임시 request/response·필드 매핑 초안: **추가계획2 §7 Phase B / §7.1**.  
FilterPanel taxonomy ↔ `metaMap`/정렬 컬럼 매핑은 API 확정 후 service에서 처리.

---

## 7. 하지 말 것

| 금지 | 이유 |
|------|------|
| Tailwind / prototype 클래스 복사 | frontend는 Emotion |
| 공통 UI 미확인 후 styled 남발 | `shared/ui` 재사용 우선 |
| page에 FilterPanel styled / match·목록 로직 | Pages는 훅·조합만 |
| `features/resources`, `widgets/lesson-library` 등 다른 경로 | 도메인은 `lesson`으로 통일 |
| Phase 1에서 `LIB` mock 필터링 이식 | 목록/API는 후속 |
| Phase 1에서 빈 React Query 훅 | 서버 상태 없이 query 금지 |
| feature 간 cross-import | 같은 레이어 cross-import 금지 |

---

## 8. 구현 순서 (체크리스트)

1. [x] `shared/ui` 공통 후보 재확인 → `Button`/`Card` 미사용 결정
2. [x] `features/lesson/model/types.ts` + `filterTaxonomy.ts`
3. [x] `features/lesson/model/useLibraryFilters.ts`
4. [x] `features/lesson/ui/FilterPanel.tsx` — Emotion CSS 적용 (§4.1·§4.3)
5. [x] `LessonLibraryPage` → `FilterPanel` + `LessonLibraryContents` (`Header` 위젯 제거)
6. [x] `features/lesson/index.ts`, `widgets/lesson/index.ts` public export
7. [ ] 시각·접근성 확인 (칩 클릭, 상세 토글) — 런타임 수동 확인 권장
8. [ ] Phase 2 목록 API 연동

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
**수정**: 2026-08-12 — `LessonLibraryHeader` 제거, `Page → FilterPanel + LessonLibraryContents`  
**수정**: 2026-08-12 — `ui` 평탄화 + `ResourceGrid` → `ResourceCardList`  
**상태**: Phase 1 UI·CSS·구조 적용 완료 / Phase 2(API) 미착수

---

# 추가계획2 — ResourceCardList(자료 목록) 추가 계획

> **목표**: 프로토타입 `LibraryView`의 `<ResourceGrid items={items} />`에 해당하는 목록 UI를  
> `LessonLibraryContents`의 Description **아래**에 배치하고, `FilterPanel` 조건과 연결한다.  
> **프론트 컴포넌트명**: `ResourceCardList` (프로토타입 `ResourceGrid`에 대응).  
> **범위**: Phase A = 목록/카드 UI + 필터↔목록 연결 + **목업**. Phase B = CMS `setSearch` 연동(임시 스펙 수신).  
> **준수**: `frontend/CLAUDE.md` (FSD Lite, Emotion, Pages 얇게, React Query는 Phase B)

---

## 1. 현황·갭 분석

### 프로토타입 (`LibraryView`)

```
FilterPanel (filters/sort 소유)
Title / Description
ResourceGrid ← useMemo(LIB.filter(matchLibF) + sortItems)   # 프로토타입 컴포넌트명
  └─ ResourceCard × N
```

- 필터 변경 → 클라이언트 `matchLibF` + `sortItems`로 `LIB` 목업 필터링
- 0건이면 점선 보더 빈 상태 ("조건에 맞는 콘텐츠가 없습니다.")
- 카드: 썸네일(`CardThumb`) + src/SEL 뱃지 + (선택) reason + 수정하기/시작하기

### 프론트 현재

```
LessonLibraryPage
├─ FilterPanel              → useLibraryFilters() (page 소유)
└─ LessonLibraryContents    → Title + Description + ResourceCardList (목업 필터)
```

| 갭 | 설명 |
|----|------|
| Phase A | 목록/카드 UI + 목업 필터·정렬 연동 **완료** |
| 데이터 소스 | Phase A는 목업. Phase B는 임시 `setSearch` (§7.1) |
| CTA | 수정하기/시작하기 UI만 (라우트·Embed 미연결) |
| 최종 목표 | FilterPanel 조건 → `setSearch` → `vo[]`를 카드 모델로 매핑 → 목록 |

---

## 2. 목표 레이아웃

```
LessonLibraryPage
├─ FilterPanel                 ← features (추가계획1)
└─ LessonLibraryContents       ← widgets
    ├─ Title                   "전체 자료실"
    ├─ Description             "검증 · 비검증 · ..."
    └─ ResourceCardList        ← 추가계획2
        └─ ResourceCard × N
```

프로토타입과 시각 순서 동일: Filter → Title/Description → 목록.

---

## 3. 필터 ↔ 목록 연결 (핵심)

### 최종(API) 흐름

1. `useLibraryFilters()` → `filters`, `sort`
2. `useLibraryResources({ filters, sort })` — queryKey에 조건 포함
3. 응답 `items`를 `ResourceCardList`에 전달
4. 로딩/에러/빈 상태 UI

### 이번 작업(목업) 흐름

API가 없으므로 **동일 인터페이스**를 목업으로 흉내 낸다.

1. `filters` / `sort`는 로컬 훅 유지 (추가계획1 재사용)
2. 목업 목록 + 클라이언트 `matchLibF` / `sortItems` (또는 mock service가 동일 시그니처로 반환)
3. Contents가 `items`를 받아 `ResourceCardList` 렌더
4. 이후 API 교체 시 목록 UI·위젯 props는 유지하고 데이터 소스만 React Query로 교체

### 상태 소유 (적용됨)

page가 `useLibraryFilters`를 한 번만 소유하고 FilterPanel·Contents에 전달한다.

```
LessonLibraryPage
  const { filters, sort, onToggle, onClear, onSort } = useLibraryFilters()
  ├─ <FilterPanel filters sort onToggle onClear onSort />
  └─ <LessonLibraryContents filters={filters} sort={sort} />   // Grid 연동 시
```

| 선택지 | 결론 |
|--------|------|
| A. Page에서 훅 + feature/widget 조합 | **채택**. Header 위젯 불필요, FSD `pages → features` 허용 |
| B. `LessonLibrarySection` 위젯 | 미채택. 훅·목업이 page를 비대하게 만들면 그때 검토 |

Contents는 그리드 연동 시 **제어형**으로 `filters`/`sort`(또는 `items`)를 받는다. Contents 안에서 `useLibraryFilters`를 다시 호출하지 않는다.

---

## 4. FSD 배치

```
features/lesson/
├── model/
│   ├── types.ts                 # (+ LibItem, Src 등 목록 타입)
│   ├── filterTaxonomy.ts        # 기존
│   ├── useLibraryFilters.ts     # 기존 (상태 끌어올리기만)
│   ├── matchLibraryFilters.ts   # 목업용 matchLibF / sortItems (API 전용 임시)
│   └── mockLibraryItems.ts      # LIB 상당 목업 (API 전 임시)
├── ui/                          # 평탄 구조 (중첩 폴더·index.ts 없음)
│   ├── FilterPanel.tsx
│   ├── ResourceCard.tsx
│   ├── ResourceCardList.tsx     # 구 ResourceGrid
│   ├── LessonEditorEmbed.tsx
│   └── LessonViewerEmbed.tsx
└── index.ts

widgets/lesson/
├── LessonLibraryContents.tsx    # Title/Description + ResourceCardList
└── index.ts

pages/lesson/
└── LessonLibraryPage.tsx        # useLibraryFilters + FilterPanel + Contents
```

### 레이어별 역할

| 레이어 | 담당 | 금지 |
|--------|------|------|
| `features/lesson` | `LibItem` 타입, 목업, match/sort, Card/List UI | page import, Tailwind, 이모지 빈 상태 |
| `widgets/lesson` | Contents 섹션 조합, 목업 필터 결과→ResourceCardList 전달 | 실제 HTTP fetch |
| `pages/lesson` | 훅 + FilterPanel + Contents 조합 | styled, match/sort·목업·목록 마크업 |

도메인 경로는 계속 `lesson` (resources 경로 사용 금지).

---

## 5. UI 스펙 (프로토타입 동등)

### 5.0 공통 UI 선행 점검

| 후보 | 경로 | 그리드/카드에 맞는지 | 결론 |
|------|------|----------------------|------|
| `Card` | `shared/ui/Card` | padding·구조가 썸네일+바디 카드와 다름 | **미사용** 또는 셸만 참고. feature 로컬 shell 우선 |
| `Button` | `shared/ui/Button` | outline/primary로 수정·시작 버튼 가능하면 재사용 | **재사용 검토**. 톤 불일치 시 feature 로컬 |
| `Badge` 계열 | `shared/ui/*` | src/SEL 칩과 유사하면 재사용 | **재사용 검토** |

FilterPanel과 동일: 공통 불일치 시 feature 로컬 Emotion.

### 5.1 `ResourceCardList`

- 반응형 그리드: 1 → 2 → 3 → 4열 (`theme` breakpoint / media query)
- gap: `theme.spacing.md` 수준
- `items.length === 0` → 빈 상태
  - 점선 border, 중앙 정렬, 안내 문구
  - **이모지 금지** (프로토타입 빈 상태 이모지는 사용하지 않음). Lucide 아이콘 선택 가능(예: `Inbox` / `SearchX`) 또는 텍스트만

### 5.2 `ResourceCard`

프로토타입 `ResourceCard` UI 동등 (구조 복사 금지, Emotion 재구현).

| 영역 | 내용 |
|------|------|
| 썸네일 | 16:9, 파스텔/그룹 배경 + 제목. 프로토타입 `em` 이모지는 **가능하면 아이콘/이니셜로 대체** (주석·UI 이모지 금지 규칙) |
| 뱃지 | `src`(검증/비검증/외부/내부), `sel`(SEL 영역) |
| reason | 있으면 보조 텍스트 (추천 근거). 이모지 prefix 금지 |
| CTA | `수정하기` / `시작하기` — 이번 Phase는 UI만 또는 기존 Embed 라우트로 연결(확정 시). 오버레이 Context 이식 금지 |

색: `theme.colors` 토큰. src별 톤은 emerald/amber/blue/gray에 대응하는 theme 토큰 매핑.

### 5.3 Emotion 규칙

- Transient props: `$src`, `$active` 등 `$` prefix
- Tailwind / prototype 클래스 문자열 복사 금지
- import는 feature 내부 상대 경로 우선 (barrel 순환 방지)

---

## 6. 데이터·타입 (목업)

### 6.1 `LibItem` (프론트 모델)

프로토타입 필드를 참고하되 API 대비 영문/안정 키로 정리.

```ts
export type LibrarySrc = 'verified' | 'unverified' | 'external' | 'internal';
// 표시 라벨: 검증 / 비검증 / 외부 / 내부

export interface LibItem {
  id: string;
  title: string;
  src: LibrarySrc;
  selArea: string;       // prototype: sel
  colorGroup?: string;   // 썸네일 톤
  views?: number;
  saves?: number;
  reason?: string;
  provider?: string;
  level?: string[];
  grade?: string[];
  duration?: string;
  factors?: string[];
}
```

DTO가 확정되면 service mapper만 교체. Grid/Card props는 `LibItem[]` 유지.

### 6.2 목업 데이터

- `features/lesson/model/mockLibraryItems.ts`
- 프로토타입 `LIB`(+ back-fill)을 frontend 타입으로 변환한 소량 샘플
- taxonomy value와 축 값이 맞아야 칩 토글 시 필터가 동작함

### 6.3 목업 필터/정렬

프로토타입 `matchLibF` / `sortItems`를 `matchLibraryFilters.ts`로 이식 (키는 `selArea` 등 frontend 축에 맞춤).

```ts
matchLibraryItem(item, filters): boolean
sortLibraryItems(items, sort): LibItem[]
```

위젯 또는 얇은 헬퍼에서:

```ts
const items = useMemo(
  () => sortLibraryItems(MOCK_LIB.filter((d) => matchLibraryItem(d, filters)), sort),
  [filters, sort],
);
```

`useEffect` fetch 금지. React Query는 **실제 API 전까지 도입하지 않음** (빈 query 훅 금지 — 추가계획1 §7과 동일).

---

## 7. Phase 구분

### Phase A — UI + 목업 연동 (API 제외) — 완료

1. [x] `LibItem` 타입 + mock + match/sort
2. [x] `ResourceCard` / `ResourceCardList` Emotion UI
3. [x] page → Contents로 `filters`/`sort` props 전달 (상태 소유는 page에 이미 적용)
4. [x] `LessonLibraryContents`: Description 아래 ResourceCardList
5. [ ] 칩 토글·정렬·초기화 시 목록 건수/내용 변경 — 런타임 수동 확인 권장
6. [ ] 빈 상태·반응형 — 런타임 수동 확인 권장
7. [x] `tsc -b --noEmit` / ESLint

**구현 메모 (2026-08-12)**

- `features/lesson/model`: `LibItem`, `MOCK_LIBRARY_ITEMS`, `matchLibraryItem` / `sortLibraryItems`
- `features/lesson/ui`: 평탄 구조 — `ResourceCard.tsx`, `ResourceCardList.tsx`(구 ResourceGrid, 빈 상태 `SearchX`), `FilterPanel.tsx` 등
- `LessonLibraryContents`: `filters`/`sort` → 목업 필터 → `ResourceCardList`
- `LessonLibraryPage`: `<LessonLibraryContents filters={filters} sort={sort} />`
- 공통 `Button` 재사용. `Card`/`Badge`는 톤·구조 불일치로 feature 로컬 styled
- React Query / `setSearch` 호출 없음 (Phase B)
- **후속 정리**: `ResourceGrid` → `ResourceCardList` 이름 변경, `ui/*/Component.tsx` 중첩 제거

### Phase B — 실제 API (후속, 추가계획1 §6과 통합)

> **임시 스펙**: 아래 §7.1. 필드·의미·필터 매핑은 언제든 변경될 수 있음.  
> Phase A UI/`LibItem` 카드 모델은 유지하고, service mapper만 교체할 수 있게 둔다.

1. `api/queryKeys.ts`, `lessonLibraryService.ts` (`POST setSearch`), `queries.ts`
2. `useLibraryResources({ filters, sort, page })`로 목업 `useMemo` 교체
3. response `vo[]` → 카드용 `LibItem`(또는 동등 view model) 매핑
4. mock / matchLibraryFilters는 제거 또는 Story용으로만 유지
5. loading / error / 페이지네이션(`limit_page`, `full_count`) UI
6. 카드 CTA → Embed(Editor/Viewer) 라우트·플로우 확정 후 연결
7. FilterPanel 축 ↔ request(`metaMap`, `orderby_*` 등) 매핑 확정 반영

### 7.1 임시 API 계약 — `setSearch` (2026-08-12 수신)

> **변경 가능**: 말 그대로 임시. request/response shape, 필수 필드, 필터 표현이 바뀔 수 있다.  
> 구현 시 타입·매퍼를 한곳에 모아 교체 비용을 낮춘다. 확정본이 오면 이 절을 갱신한다.

| 항목 | 값 |
|------|-----|
| Method | `POST` |
| URL | `https://t2-cmsapi.vsaidt.com/api/contents/setSearch` |
| 비고 | 호스트/베이스 URL은 env로 분리 예정 (`ENV.*`). 경로 `/api/contents/setSearch` |

#### Request (임시 예시)

```json
{
  "loginUserId": "devyunjg1",
  "brand_id": 1,
  "searchField": "name",
  "metaMap": [],
  "orderby_col": "id",
  "orderby_dir": "desc",
  "limit_page": 1,
  "limit_pageItemCnt": 10,
  "excludingGameSetCategory": true,
  "detail": true,
  "is_active": true,
  "is_deleted": false
}
```

| 필드 | 추정 역할 (임시) | 비고 |
|------|------------------|------|
| `loginUserId` | 호출 사용자 | SSO/세션 사용자와 연결 방식 미정 |
| `brand_id` | 브랜드 | 고정값 가능성 — 확정 필요 |
| `searchField` | 검색 대상 필드 | 예: `"name"` |
| `metaMap` | 메타 필터 조건 | FilterPanel 축과의 매핑 **미정**. 빈 배열 = 미적용으로 보임 |
| `orderby_col` / `orderby_dir` | 정렬 | FilterPanel `SortKey`(popular/newest/saved) ↔ 컬럼 매핑 **미정** |
| `limit_page` / `limit_pageItemCnt` | 페이지네이션 | 그리드 페이지 UI는 Phase B |
| `excludingGameSetCategory` | 게임 세트 제외 | 자료실 기본값일 수 있음 |
| `detail` | 상세 포함 | `true` 시 `metaMap`/`articles` 포함으로 보임 |
| `is_active` / `is_deleted` | 활성·삭제 여부 | 목록 기본 필터 |

#### Response (임시 예시 — 항목 2건 요약)

최상위:

| 필드 | 예시/타입 | 비고 |
|------|-----------|------|
| `errorMessage` | `null` \| string | |
| `errCd` | `null` \| … | |
| `vo` | `SetSearchItem[]` | 목록 본체 |
| `hash` | string | |
| `stime` / `etime` | string | 서버 처리 시각 |

`vo[]` 항목에서 카드/목록에 당장 쓸 만한 필드 (초안):

| API 필드 | 카드/목록 활용 (초안) |
|----------|----------------------|
| `id` / `gen_id` | 콘텐츠 ID (CTA·키) |
| `name` | 제목 |
| `description` | 보조 설명 (nullable) |
| `thumbnail` | 썸네일 상대 경로 (`upload/...`) — CDN/베이스 URL 규칙 미정 |
| `creator_name` / `creator` | 제공·작성자 표시 후보 |
| `regdate` / `updatedate` | 최신순 정렬·표시 |
| `open_count` / `full_count` | 인기·전체 건수 후보 (`full_count`는 페이지 총건으로도 쓰인 듯) |
| `is_publicOpen` / `is_editable` / `is_publish` / `is_temp` | 상태 뱃지 후보 |
| `metaMap[]` | `name`+`val` (예: difficulty=하, curriBook=초등 수학 3-1, setCategory=과제) → SEL/학교급 등 **FilterPanel 축과 1:1 아님** |
| `articles[]` | 세트 구성 문항 요약 (그리드에는 보통 불필요) |
| `setCategory` / `curriBook` / `curriUnit*` / `difficulty` | meta id 참조. 라벨은 `metaMap`의 `val` |

#### FilterPanel ↔ Request 매핑 (미정 · TODO)

| FilterPanel | 후보 API 필드 | 상태 |
|-------------|---------------|------|
| `level` / `grade` | `metaMap`(curriBook 등) | 미정 |
| `provider` | creator / brand / 별도 meta | 미정 |
| `selArea` | 해당 meta 코드 없음(현재 샘플) | 미정 · SEL 전용 메타 추가 여부 확인 |
| `duration` / `factor` | 샘플에 대응 필드 없음 | 미정 |
| `sort: newest` | `orderby_col=regdate` 또는 `id` + `desc` | 추정 |
| `sort: popular` | `open_count` 등 | 미정 |
| `sort: saved` | 저장 수 필드 샘플에 없음 | 미정 |

#### 구현 시 주의

- Phase A는 계속 목업. 이 스펙으로 Phase A를 막지 않음.
- `thumbnail`은 상대 경로 → 절대 URL 조합 규칙 확인 후 카드에 적용.
- response가 크므로(`metaMap`, `articles`) 목록용 DTO를 좁혀 두거나 mapper에서 필요한 필드만 추출.
- `loginUserId`·인증 헤더·CORS/프록시(frontend → cmsapi)는 env·`shared/api` 패턴에 맞게 Phase B에서 결정.
- 타입이 바뀌어도 Grid/Card props(`LibItem` 등)는 안정적으로 유지.

---

## 8. 하지 말 것

| 금지 | 이유 |
|------|------|
| Phase A에서 임시 `setSearch`를 필수 의존 | 스펙 변경 큼. UI는 목업으로 진행 |
| 임시 response 전체를 카드 props에 그대로 바인딩 | 교체 비용↑. mapper로 view model 고정 |
| Page·Contents 각각 `useLibraryFilters` | 상태 이중화 |
| `LessonLibraryHeader` / `LessonLibrarySection` 재도입(불필요 시) | Filter만 감싸는 위젯은 과함 |
| Tailwind / prototype 클래스·이모지 빈 상태 복사 | Emotion + 이모지 금지 |
| `features/resources` 경로 신설 | 도메인 `lesson` 통일 |
| Phase A에서 React Query 빈 껍데기 | 서버 상태 없이 query 금지 |
| ResourcesContext / openOverlay 이식 | frontend 라우트·Embed 패턴 따름 |
| page에 Grid styled·match/sort 방치 | Pages는 훅·조합만 |

---

## 9. 구현 순서 (체크리스트)

1. [x] `LibItem` / `LibrarySrc` 타입을 `features/lesson/model/types.ts`에 추가
2. [x] `mockLibraryItems.ts` + `matchLibraryFilters.ts` (목업)
3. [x] `shared/ui` 재확인 후 `ResourceCard` Emotion 구현 (`Button` 재사용)
4. [x] `ResourceCardList` (빈 상태 포함, 이모지 없음) — 구 `ResourceGrid`
5. [x] 필터 상태 page 소유 — `Page → FilterPanel + Contents` (`Header` 제거)
6. [x] Contents에 `filters`/`sort` props + Description 아래 ResourceCardList
7. [x] barrel export (`features/lesson`, `widgets/lesson`)
8. [ ] 필터 토글 ↔ 목록 반영 수동 확인
9. [x] `tsc -b` / ESLint
10. [x] Phase B용 임시 `setSearch` 스펙 문서화 (§7.1) — **확정 전**
11. [x] `ui` 평탄화 + `ResourceGrid` → `ResourceCardList` 이름 변경
12. [ ] (후속) Phase B: service + React Query + DTO 매핑 + 필터 매핑 확정

---

## 10. 참고 파일

| 용도 | 경로 |
|------|------|
| 프로토타입 조합 | `prototype/.../library/LibraryView.tsx` |
| 프로토타입 그리드 | `prototype/.../library/ResourceGrid.tsx` |
| 프로토타입 카드 | `prototype/.../library/ResourceCard.tsx` |
| 프로토타입 썸네일 | `prototype/.../common/CardThumb.tsx` |
| 목업 | `frontend/.../model/mockLibraryItems.ts` |
| 목업 필터 | `frontend/.../model/matchLibraryFilters.ts` |
| 목록/카드 | `frontend/.../ui/ResourceCardList.tsx`, `ResourceCard.tsx` |
| 필터(기구현) | `frontend/.../ui/FilterPanel.tsx`, `useLibraryFilters` |
| 배치 대상 | `frontend/.../LessonLibraryContents.tsx` |
| 페이지 | `frontend/.../LessonLibraryPage.tsx` |
| Embed(후속 CTA) | `features/lesson/ui/LessonEditorEmbed.tsx`, `LessonViewerEmbed.tsx` |
| 목록 API(임시) | `POST https://t2-cmsapi.vsaidt.com/api/contents/setSearch` (§7.1) |

---

**작성일**: 2026-08-12  
**수정**: 2026-08-12 — `Page → FilterPanel + LessonLibraryContents` 구조 확정·적용  
**수정**: 2026-08-12 — Phase B 임시 API `setSearch` request/response 초안 추가 (§7.1)  
**수정**: 2026-08-12 — Phase A 구현 완료 (ResourceCardList/Card + 목업 필터 연동)  
**수정**: 2026-08-12 — `ResourceGrid` → `ResourceCardList`, `features/lesson/ui` 평탄 구조  
**상태**: Phase A 완료 / Phase B 스펙 초안(변경 가능)·미착수

---

# 추가계획3 — LessonMyPage 나의 자료 목록 (`ResourceCardList` 재사용)

> **목표**: 프로토타입 `MyDataView`의 세트지 그리드(24–36행)를 `LessonMyPage`의 `ContentsHeader` **바로 아래**에 배치한다.  
> **재사용**: 자료실과 동일 UI인 `ResourceCardList` / `ResourceCard`에 `variant` props로 모드 분기.  
> **범위**: Phase A = UI + 목업. Phase B = 나의 자료 API(미정) 연동.  
> **준수**: Emotion, 이모지 금지, FSD (`pages → features`)

---

## 1. 현황·갭

### 프로토타입 (`MyDataView`)

```
헤더 (나의 자료 + 새로 만들기)
└─ myLessons.length
     ? grid → MyLessonCard × N
     : 빈 상태 ("아직 만든 세트지가 없어요…")
```

`MyLessonCard`: 썸네일 + `수정 MM/DD` + [수정하기][시작하기] (src/SEL 뱃지 없음)

### 프론트 (적용 후)

```
LessonMyPage
├─ ContentsHeader (Title/Description + 새로 만들기)  ← 기존 유지
├─ ResourceCardList variant="my" items={MOCK_LIBRARY_ITEMS}
├─ Toolbar (수업하기)                                 ← 기존 유지
└─ Embed (editor/viewer)                              ← 기존 유지
```

---

## 2. 공통 컴포넌트 확장

| props | 자료실 (`library`) | 나의 자료 (`my`) |
|-------|-------------------|------------------|
| `variant` | `'library'` (기본) | `'my'` |
| 카드 본문 | src/SEL 뱃지 (+ reason) | `수정 {updated}` |
| 빈 상태 문구 | 조건에 맞는 콘텐츠가 없습니다. | 아직 만든 세트지가 없어요. … |
| 빈 상태 아이콘 | `SearchX` | `Inbox` |
| CTA | 수정하기 / 시작하기 (UI만) | 동일 + 썸네일 삭제 버튼(`onDelete`) |

```tsx
<ResourceCardList items={items} variant="my" />
// emptyMessage 로 문구 오버라이드 가능
```

- `LibItem.updated?: string` — my 모드 표시용
- 목업: `features/lesson/model/mockLibraryItems.ts` (`MOCK_LIBRARY_ITEMS`, `updated` 포함)

---

## 3. Phase

### Phase A — 목업 (완료)

1. [x] `ResourceCardVariant`, `LibItem.updated`
2. [x] `ResourceCard` / `ResourceCardList`에 `variant`·`emptyMessage`
3. [x] `MOCK_LIBRARY_ITEMS`에 `updated` 통합 (별도 my 목업 파일 없음)
4. [x] `LessonMyPage` ContentsHeader 아래 목록 배치 (Toolbar·Embed 유지)
5. [x] barrel export
6. [x] `tsc` / ESLint

### Phase B — API (후속)

1. 나의 자료 목록 API 확정 후 React Query 훅
2. 목업 `useMemo`/상수 교체
3. 카드 CTA → Editor Embed / 배포 플로우 연결
4. 삭제 버튼 UI는 `variant=my`에 포함. API/목록 갱신은 Phase B

---

## 4. 하지 말 것

| 금지 | 이유 |
|------|------|
| MyLessonCard 별도 복제 | `ResourceCard` variant로 충분 |
| 빈 상태 이모지 | Lucide만 |
| Phase A에서 실제 API | 스펙 미정·목업 우선 |
| page에 카드 styled 중복 | feature UI 재사용 |

---

## 5. 참고 파일

| 용도 | 경로 |
|------|------|
| 프로토타입 | `prototype/.../my-lessons/MyDataView.tsx`, `MyLessonCard.tsx` |
| 목업 원본 | `prototype/.../mock-data.ts` (`MY`) |
| 공통 목록 | `frontend/.../ui/ResourceCardList.tsx`, `ResourceCard.tsx` |
| 목업 | `frontend/.../model/mockLibraryItems.ts` (`updated` 포함) |
| 페이지 | `frontend/.../pages/lesson/LessonMyPage.tsx` |

---

**작성일**: 2026-08-12  
**상태**: Phase A(목업) 완료 / Phase B(API) 대기

---

# 추가계획4 — 활동 배포 페이지 (DeployPage) 연결

> **목표**: `ResourceCard`의 시작하기 버튼 클릭 시 활동 배포 전용 페이지(`DeployPage`)가 열리도록 라우트를 구성하고, 프로토타입 `DeployOverlay.tsx`를 `frontend` FSD 구조로 구현한다.
> **범위**: 라우트 추가 + 페이지 컴포넌트 + 기능 UI 컴포넌트. 실제 API 연동·배포 실행은 후속 Phase.
> **준수**: `frontend/AGENTS.md` (FSD Lite, Emotion, 서버/로컬 상태 분리)

---

## 1. 현황 요약

| 구분 | 위치 | 비고 |
|------|------|------|
| 프로토타입 기준 | `prototype/.../deploy/DeployOverlay.tsx` | Tailwind. UI 구성·문구·상태 기준. 코드 복사 금지 |
| 시작하기 버튼 | `features/lesson/ui/ResourceCard.tsx` (60~62번 줄) | 현재 `onClick` 없음 |
| 기존 자료 라우트 | `/lesson/library`, `/lesson/my`, `/lesson/result` | `routes.tsx` IA_V2 블록 내 |
| 카드 모델 | `features/lesson/model/types.ts` — `LibItem.id: string` | itemId 기준 URL 구성 |

---

## 2. URL 구조

```
/lesson/deploy/:itemId
```

- `:itemId` = `LibItem.id` (카드 단위 고유 식별자)
- `ResourceCard`의 시작하기 버튼이 `useNavigate('/lesson/deploy/${item.id}')` 로 이동
- 추후 API 연동 시 이 `itemId`를 기준으로 콘텐츠 상세 조회

---

## 3. FSD 배치

```
pages/lesson/LessonDeployPage.tsx          (신규 — 라우트 진입점, 레이아웃 조합만)
features/lesson/ui/DeployPage.tsx          (신규 — 활동 배포 UI 전체 구현)
features/lesson/ui/index.ts               (기존 — DeployPage barrel export 추가)
pages/index.ts                            (기존 — LessonDeployPage barrel export 추가)
app/router/routes.tsx                     (기존 — /lesson/deploy/:itemId 라우트 추가)
features/lesson/ui/ResourceCard.tsx       (기존 — 시작하기 버튼에 useNavigate 연결)
```

- `pages/lesson/LessonDeployPage.tsx`는 얇게 유지. styled component·로직 없음
- `features/lesson/ui/DeployPage.tsx`가 실질적인 UI·상태를 담당

---

## 4. 프로토타입 → frontend 변환 기준

| 프로토타입 요소 | frontend 처리 방침 |
|------|------|
| `overlay`, `closeOverlay`, `openOverlay` (Context) | 불필요. 독립 페이지이므로 `useNavigate(-1)`로 뒤로 이동 |
| `fromEditor` 분기 (저작툴 브레드크럼) | Phase4 범위 외. 뒤로가기 버튼 단일 처리 |
| `GROUP_BG`, `CLASSES`, `MY`, `findContent` (목업 임포트) | `useParams`로 `itemId` 획득 후 `MOCK_LIBRARY_ITEMS`에서 `item` 조회 |
| Tailwind 클래스 | Emotion styled-component 또는 인라인 Emotion css로 재구현 |
| `toast()` | `sonner`의 `toast` 또는 프로젝트 공통 토스트 방식 사용 |
| `startLive` (`openOverlay({ kind: 'live' })`) | `() => {}` 로 남김 (SlideViewer 추후 구현) |
| `goToReports` | `/lesson/result`로 `navigate` |
| `doDeploy` | 로컬 상태만 변경 (목업). 실제 배포 API는 Phase B |

---

## 5. 뒤로가기 동작

프로토타입 `DeployOverlay`의 `closeOverlay` / `backToEditor` 분기를 단순화한다.

- 헤더 좌측 뒤로가기 버튼 클릭 → `navigate(-1)` (React Router)
- 직접 URL 진입 시에도 브라우저 뒤로가기로 자연스럽게 이전 화면 복귀

---

## 6. 수업 시작하기 버튼 처리

프로토타입 167~174번 줄의 `startLive` 호출 부분:

```tsx
// SlideViewer 연결은 추후 구현
onClick={() => {}}
```

- 배포 완료 후 `deployed.isLive === true`인 경우 표시되는 버튼
- 현재는 빈 핸들러로 남기고, 추후 SlideViewer 라우트 확정 시 연결

---

## 7. 상태 관리

| 상태 | 종류 | 이유 |
|------|------|------|
| `itemId` 기반 아이템 조회 | 로컬 상수 (목업 단계) / React Query (API 단계) | 서버 상태로 전환 예정 |
| `classes` (대상 반) | `useState` | 페이지 로컬 UI 상태 |
| `dropOpen` | `useState` | 드롭다운 열림 여부 |
| `mode` (period / live) | `useState` | 배포 방식 선택 |
| `start`, `end` (기간) | `useState` | 날짜 선택 |
| `deployed` (배포 결과) | `useState` | 배포 완료 후 결과 표시 |

- 배포 반 목록(`CLASSES` 해당)은 목업 단계에서 상수로 관리

---

## 8. 구현 Phase

### Phase A — 목업 (다음 구현 대상)

1. `features/lesson/ui/DeployPage.tsx` 신규 작성 (Emotion, 프로토타입 UI 동등 구현)
2. `pages/lesson/LessonDeployPage.tsx` 신규 작성 (얇은 페이지)
3. `app/router/routes.tsx` — `/lesson/deploy/:itemId` 라우트 추가 (IA_V2 블록 내)
4. `pages/index.ts` — `LessonDeployPage` barrel export 추가
5. `features/lesson/ui/index.ts` — `DeployPage` barrel export 추가
6. `features/lesson/ui/ResourceCard.tsx` — 시작하기 버튼에 `useNavigate` 연결
7. `tsc` / ESLint 검증

### Phase B — API (후속)

1. 콘텐츠 상세 API (`GET /lesson/contents/:itemId`) 연동 → React Query
2. 배포 실행 API (`POST /lesson/deploy`) 연동 → useMutation
3. 실제 반 목록 API 연동
4. 수업 시작하기 버튼 → SlideViewer 라우트 연결

---

## 9. 하지 말 것

| 금지 | 이유 |
|------|------|
| `fromEditor` 분기 구현 | 저작툴 연동 범위 외 |
| Tailwind 클래스 그대로 복사 | `frontend`는 Emotion 사용 |
| `overlay` Context 재현 | 독립 페이지로 설계 변경됨 |
| 수업 시작하기에 임시 경로 연결 | SlideViewer 스펙 미확정 |
| Phase A에서 실제 배포 API | 스펙 미정·목업 우선 |

---

## 10. 참고 파일

| 용도 | 경로 |
|------|------|
| 프로토타입 기준 | `prototype/src/features/resources/components/deploy/DeployOverlay.tsx` |
| 카드 모델 | `frontend/src/features/lesson/model/types.ts` |
| 목업 데이터 | `frontend/src/features/lesson/model/mockLibraryItems.ts` |
| 라우트 | `frontend/src/app/router/routes.tsx` |
| 기존 자료실 페이지 | `frontend/src/pages/lesson/LessonLibraryPage.tsx` |

---

## 11. 추가 구현 계획 — 실제 반 목록 API 연동 + LNB 선택 반 프리셋

> **목표**: DeployPage의 MOCK_CLASSES를 실제 API 반 목록으로 교체하고, LNB에서 반이 선택된 채로 시작하기를 누르면 해당 반이 배포 대상으로 자동 선택된 상태로 진입한다.

### 11-A. 실제 반 목록 API 연동

**현황**

`DeployPage.tsx`의 `MOCK_CLASSES`는 `['1반', '2반', '3반', '4반']` 문자열 상수다.
실제 반 목록은 `useMyGroupsQuery`(`@features/api`)가 반환하는 `Group[]`를 사용한다.

`Group` 타입 (`shared/types/index.ts`):

```ts
interface Group {
  id: string;       // claId (= URL의 ?class= 값)
  name: string;     // 반 이름 (표시용)
  grade: number;
  classNumber: number;
  schoolName?: string;
  // ...
}
```

**구현 방식**

- `DeployPage` 마운트 시 `useMyGroupsQuery`를 호출한다.
  - `refetch`도 함께 구조분해한다(`refetch: refetchGroups`).
  - 이 훅은 이미 React Query 캐시(`groupKeys.myGroups(userId)`)를 사용하므로, ScopeTree·AssessmentPage 등이 먼저 호출한 경우 네트워크 요청 없이 캐시에서 즉시 반환된다.
  - `select`(드롭다운) 펼칠 때마다 API를 재호출하지 않는다. 훅 호출은 마운트 1회에 그친다.
- 드롭다운 항목: `groups`를 순회하여 `g.id`(값) / `g.name`(표시) 기반으로 렌더링한다.
- `classes` state는 `string[]`로 유지하되, 값은 `Group.id`(= `claId`)를 저장한다.
- 드롭다운 상태별 표시:
  - 로딩 중(`groupsLoading`): "반 목록 불러오는 중…"
  - 오류(`groupsError`): "반 목록을 불러오지 못했습니다" + **다시 시도** 버튼 → `refetchGroups()` 호출
  - 빈 목록(`groups.length === 0`): "반이 없습니다"
  - 정상: `groups` 항목 렌더링

**변경 파일**

| 파일 | 변경 |
|------|------|
| `features/lesson/ui/DeployPage.tsx` | `MOCK_CLASSES` 상수 제거, `useMyGroupsQuery` 훅 추가, 드롭다운 항목 Group 기반으로 교체 |

---

### 11-B. LNB 선택 반 → DeployPage 프리셋

**현황**

- LNB(ScopeTree)에서 반을 선택하면 현재 페이지 URL에 `?class={claId}` 쿼리 파라미터가 붙는다.
  예: `/lesson/library?class=abc-123`
- `ResourceCard`의 시작하기 버튼은 현재 `navigate('/lesson/deploy/${item.id}')` 로 이동하며, `?class=` 정보를 전달하지 않는다.

**구현 방식**

#### Step 1 — ResourceCard: `?class=` 파라미터 전달

`ResourceCard`에서 `useLocation`(react-router-dom)으로 현재 URL의 `search` 문자열을 그대로 읽어, 배포 페이지 이동 시 쿼리 파라미터 전체를 보존한다.

```tsx
const location = useLocation();

// 시작하기 버튼 onClick
navigate(`/lesson/deploy/${item.id}${location.search}`);
```

- `location.search`는 `?class=abc&student=xyz` 등 현재 URL의 쿼리 문자열 전체를 그대로 포함한다.
- 쿼리 파라미터가 없는 경우(`location.search === ''`) 배포 페이지 URL에 쿼리 없이 이동한다.
- `class`, `student` 파라미터를 개별적으로 처리하지 않으므로 향후 파라미터가 추가되어도 자동으로 전달된다.

#### Step 2 — DeployPage: URL `?class=` 값으로 초기 선택 상태 구성

`DeployPage` 마운트 시 `useSearchParams`로 `class` 파라미터를 읽고, 이를 `classes` state의 초기값으로 사용한다.

```tsx
const [searchParams] = useSearchParams();
const presetClassId = searchParams.get('class') ?? '';

const [classes, setClasses] = useState<string[]>(
  presetClassId ? [presetClassId] : []
);
```

- `useState` 초기값은 마운트 시 1회만 평가되므로 `useEffect` 없이 URL 파라미터를 반영할 수 있다.
- 이 방식은 서버 상태가 아닌 UI 초기 선택값을 URL에서 가져오는 것이므로 AGENTS.md의 "effect로 만들지 않는다" 원칙과 충돌하지 않는다.
- **`validClasses` 파생 계산**: `classes` state를 그대로 사용하지 않고, 렌더 시점에 `groups`에 실제 존재하는 항목만 필터링한 `validClasses`를 파생한다.
  ```tsx
  const validClasses = groupsLoading
    ? classes               // 로딩 중에는 프리셋 유지
    : classes.filter((id) => groups.some((g) => g.id === id));
  ```
  - 로딩 중에는 프리셋을 그대로 유지하여 UX 단절 없음.
  - 로딩 완료 후 `groups`에 없는 ID(권한 없는 반 등)는 트리거 표시·배포 실행 모두에서 제외.
- 드롭다운 트리거 텍스트, `$hasValue` 판정, `doDeploy` 검증·classesStr 모두 `validClasses` 기준으로 처리한다.
- 사용자가 드롭다운에서 추가/제거하면 `classes` state가 일반적인 방식으로 업데이트된다.

**변경 파일**

| 파일 | 변경 |
|------|------|
| `features/lesson/ui/ResourceCard.tsx` | `useSearchParams` 추가, `navigate` 호출 시 `?class=` 파라미터 전달 |
| `features/lesson/ui/DeployPage.tsx` | `useSearchParams` 추가, `classes` 초기값 URL 파라미터 기반으로 변경 |

---

**작성일**: 2026-08-13  
**최종 수정**: 2026-08-13 (11-A·11-B 구현 완료, validClasses 파생 검증 로직 추가)  
**상태**: Phase A(목업) 완료 / 11-A·11-B 구현 완료
