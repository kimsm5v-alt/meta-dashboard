# Lesson Library 구현 계획

> **도메인**: 전체 자료실 (`LessonLibraryPage`)  
> **준수**: `frontend/CLAUDE.md` (FSD Lite, Emotion, 서버/로컬 상태 분리)  
> **프로토타입 참조**: UI/동작만. 코드 구조·Tailwind 복제 금지

| 구분 | 내용 | 상태 |
|------|------|------|
| **추가계획1** | `FilterPanel` UI + 로컬 필터 상태 | Phase 1 완료 / API 미착수 |
| **추가계획2** | Contents Description 아래 자료 목록(`ResourceCardList`) + 필터 연동(목업) | Phase A 완료 / Phase B 대기 |
| **추가계획3** | `LessonMyPage` 나의 자료 목록 — `ResourceCardList` `variant="my"` + 목업 | 구현 완료 (Phase B API는 추가계획6·10) |
| **추가계획4** | `ResourceCard` 시작하기 버튼 → 활동 배포 페이지 (`DeployPage`) 라우트 연결 | 계획 수립 완료 / 구현 대기 |
| **추가계획5** | Editor/Viewer embed 독립 라우트 페이지 전환 + LessonEditorEmbed features 활성화 | 구현 완료 |
| **추가계획6** | `onSaved` → `POST /api/ref-set` 자동 등록 + `LessonMyPage` `GET /api/ref-set` 목록 연동 | 구현 완료 (ResourceCardList 연결은 추가계획10) |
| **추가계획7** | `ResourceCard` 수정하기 → `/lesson/editor/:slideId` 이동 (`item.id`) | 구현 완료 |
| **추가계획8** | 전체 자료실 CMS `GET /api/sets` 연동 + 필터 재조회/레이스 처리 + loading UI | 구현 완료 |
| **추가계획9** | `DeployPage` 실시간 수업 → Viewer + `ResourceCard`→deploy `state.item` + URL 직접 진입 시 item 재조회 | 구현 완료 |
| **추가계획10** | 나의 자료 실제 API 연동 (`mapRefSetToLibItem` 적용) + `ResourceCard` 삭제 → `DELETE /api/ref-set/{refSetId}` + 빈 상태/에러 분리 | 구현 완료 |
| **추가계획11** | DeployPage·저작툴 시작하기 — `POST /activities` + assignees(`spUserId`) + `publish` → `accessKey` + QR·참여링크 | Phase A·B 구현 완료 (2026-08-21) · assignees=`spUserId` 연동 완료 |
| **추가계획12** | 학생용 `/student/lesson/:accessKey` — `GET /entry` + `POST /participations` → `content.lcmsSetId` embed | Phase A·B 구현 완료 (2026-08-21) · 임시 `:setId` path 제거 · PATCH/submit/result는 후속 |
| **추가계획13** | 전체 자료실 CMS 목록 무한 스크롤(`pageSize=10`) + 나의 자료 `GET /api/v1/library-items` 페이지네이션 | Phase A 구현 완료 / Phase B 구현 완료 |
| **추가계획14** | 옛 LMS API(`/api/ref-set`) → 새 API(`/api/v1/library-items`) · `handleSaved` POST/PATCH · editor navigate `libraryItemId` state | **Phase 1 구현 완료** (2026-08-20) · Phase 2(페이지네이션) 구현 완료 |
| **추가계획15** | `LessonResultPage` 수업 결과보기 UI (StatusPanel + 필터 + 카드) | 구현 완료 (2026-08-26) |
| **추가계획16** | `LessonResultPage` API 연동 (`GET /api/v1/activities`) | 구현 완료 (2026-08-26) |
| **추가계획17** | `ReportCard` 리포트 버튼 → 리포트 상세 페이지 (`ReportDetail` UI) | 구현 완료 (2026-08-26) |
| **추가계획18** | `LessonReportDetailPage` 리포트 상세 API 연동 | 구현 완료 (2026-08-27) |
| **추가계획19** | 학생 `StudentLessonResultPage` — prototype `StudentResourcePage` UI/UX 동등 구현 | 구현 완료 (2026-08-26) |
| **구조** | `Page → FilterPanel + LessonLibraryContents` (`LessonLibraryHeader` 위젯 제거) | 적용됨 |
| **ui 레이아웃** | `features/lesson/ui/*.tsx` 평탄 구조 (`FilterPanel/FilterPanel.tsx` 중첩 제거) | 적용됨 |
| **목록 API** | CMS `GET .../api/sets` (`brandId=18`, `serviceType=131132`) | 추가계획8 스펙 확정 · 필터 매핑 미적용 |

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

프로토타입 `LibItem`(`prototype/.../types.ts` · `mock-data.ts` `LIB`)을 참고하되, API/FE는 영문·안정 키로 정리.

**프로토타입 → FE 필드 매핑**

| prototype | FE | 비고 |
| --- | --- | --- |
| `id` | `id` | CMS `setId` / 목업 id |
| — | `refSetId?` | 나의 자료(LMS ref-set) 전용. prototype `LIB`에는 없음 |
| `title` | `title` | |
| `thumb?` | `thumbnailUrl?` | 카드 썸네일 URL. 없으면 `colorGroup` 그라데이션 fallback |
| `src` | `src?` | prototype은 한글(`검증`…), FE는 `'verified' \| …` |
| `sel` | `selArea?` | |
| `g` | `colorGroup?` | `'g1'`…`'g6'` |
| `em` | (미이식) | 구 이모지 썸네일. 카드 미렌더 — FE에 두지 않음 |
| `views?` / `saves?` / `reason?` | 동명 optional | |
| `provider?` / `level?` / `grade?` / `duration?` / `factors?` | 동명 optional | LIB back-fill · taxonomy 필터용 |
| — | `createdAt?` | LMS/CMS 생성 시각. prototype `MyLesson.updated`(MM/DD) 대체 |

**필수(필요) 필드**: `id`, `refSetId?`(나의 자료 시), `title`, `thumbnailUrl?`  
**그 외**: 모두 선택. DTO/mapper가 채울 수 있을 때만 설정.

```ts
export type LibrarySrc = 'verified' | 'unverified' | 'external' | 'internal';
// 표시 라벨: 검증 / 비검증 / 외부 / 내부

export type LibraryColorGroup = 'g1' | 'g2' | 'g3' | 'g4' | 'g5' | 'g6';

export interface LibItem {
  // --- 필요 필드 (카드·연동 최소) ---
  id: string;
  refSetId?: string;       // 나의 자료(LMS ref-set). 자료실 CMS 목록에는 없음
  title: string;
  thumbnailUrl?: string;   // prototype: thumb. CMS/options 썸네일

  // --- 선택 (필터·배지·톤·통계) ---
  src?: LibrarySrc;        // prototype: src (한글 → 영문 코드)
  selArea?: string;        // prototype: sel
  colorGroup?: LibraryColorGroup; // prototype: g — thumb 없을 때 fallback
  views?: number;
  saves?: number;
  reason?: string;
  createdAt?: string;      // LMS/CMS 생성 시각 (ISO). UI는 필요 시 MM/DD 포맷
  provider?: string;
  level?: string[];
  grade?: string[];
  duration?: string;
  factors?: string[];
}
```

DTO가 확정되면 service mapper만 교체. Grid/Card props는 `LibItem[]` 유지.  
> **코드 반영**: `types.ts` / `ResourceCard` thumb 렌더 등은 별도 작업. 본 절은 계약 문서 갱신.

프로토타입 `LIB` 예시(참고):

```ts
{ id: 'l1', title: '언제나 처음은 낯설다', src: '검증', sel: '자기관리',
  views: 1240, saves: 328, g: 'g1', em: '🌱', thumb: '/lesson/theme-1/thumb.jpg' }
```

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
> **범위**: Phase A = UI + 목업. Phase B = 나의 자료 API 연동 (추가계획6·10에서 완료).  
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
| 카드 본문 | src/SEL 뱃지 (+ reason) | `수정 {createdAt}` (표시 시 MM/DD 포맷 가능) |
| 빈 상태 문구 | 조건에 맞는 콘텐츠가 없습니다. | 아직 만든 세트지가 없어요. … |
| 빈 상태 아이콘 | `SearchX` | `Inbox` |
| CTA | 수정하기 / 시작하기 (UI만) | 동일 + 썸네일 삭제 버튼(`onDelete`) |

```tsx
<ResourceCardList items={items} variant="my" />
// emptyMessage 로 문구 오버라이드 가능
```

- `LibItem.createdAt?: string` — my 모드 표시용 (LMS/CMS ISO). prototype `updated`(MM/DD) 대체
- 목업: `features/lesson/model/mockLibraryItems.ts` (`MOCK_LIBRARY_ITEMS`, `createdAt` 포함)

---

## 3. Phase

### Phase A — 목업 (완료)

1. [x] `ResourceCardVariant`, `LibItem.createdAt` (`updated` → `createdAt`)
2. [x] `ResourceCard` / `ResourceCardList`에 `variant`·`emptyMessage`
3. [x] `MOCK_LIBRARY_ITEMS`에 `createdAt` 통합 (별도 my 목업 파일 없음)
4. [x] `LessonMyPage` ContentsHeader 아래 목록 배치 (Toolbar·Embed 유지)
5. [x] barrel export
6. [x] `tsc` / ESLint

### Phase B — API (추가계획6·10에서 완료)

1. [x] 나의 자료 목록 API 확정 후 React Query 훅 — `useRefSetListQuery` (추가계획6)
2. [x] 목업 `useMemo`/상수 교체 — `mapRefSetToLibItem` → `ResourceCardList` (추가계획10)
3. [x] 카드 CTA → Editor / 배포 플로우 연결 — 추가계획4·7·9
4. [x] 삭제 API/목록 갱신 — `DELETE /api/ref-set/{refSetId}` (추가계획10)

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
| 목업 | `frontend/.../model/mockLibraryItems.ts` (`createdAt` 포함) |
| 페이지 | `frontend/.../pages/lesson/LessonMyPage.tsx` |

---

**작성일**: 2026-08-12  
**수정**: 2026-08-18 — Phase B(API)는 추가계획6·10과 동일 범위. 추가계획10에서 구현 완료로 확인  
**상태**: 구현 완료

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

---

# 추가계획5 — Editor / Viewer embed 독립 라우트 페이지 전환

> **참조**: [`lesson-everycanvas-lms-integration.plan.md §4`](./lesson-everycanvas-lms-integration.plan.md), 특히 **§4.3.3 features 플래그 지침**  
> **상태**: 구현 완료 (2026-08-13)

## 1. 현황 및 문제점

현재 `LessonMyPage`는 로컬 `mode` state로 embed 컴포넌트를 **인라인 렌더링**하고 있다.

```
LessonMyPage (GNB + LNB 있음)
└─ mode === 'editor' → <LessonEditorEmbed>  (position:fixed + z-index:9999 오버레이)
└─ mode === 'viewer' → <LessonViewerEmbed>  (position:fixed + z-index:9999 오버레이)
```

- GNB/LNB가 있는 Shell 레이아웃 위에 `z-index: 9999` fixed overlay로 가리는 방식 — 레이아웃 계층 의미상 부자연스럽고 포커스 트랩·접근성 문제 발생 가능
- embed 컴포넌트가 직접 full-viewport styled 요소를 갖고 있어 다른 맥락에서 재사용하기 어려움
- `TeacherFullscreenLayout`(GNB/LNB 없는 MinimalLayout)이 이미 존재하며, `LessonDeployPage` 등에서 활용 중

## 2. 목표

1. `LessonEditorEmbed` / `LessonViewerEmbed`를 **독립 route 페이지**로 분리 → `TeacherFullscreenLayout` 적용
2. `slideId` 유무에 따라 editor 라우트 경로를 분기, viewer는 `slideId` 필수로 URL에 포함
3. `LessonEditorEmbed`에 `features.showStartLesson`·`features.showExit` 활성화 (§4.3.3 지침 반영 — 독립 fullscreen 페이지에서는 Host UI 버튼 없으므로 iframe 내 버튼 노출이 적합)
4. `LessonMyPage`에서 inline embed 제거 → `navigate`로 라우트 전환

## 3. 라우트 설계

| 화면 | 경로 | slideId | 비고 |
|------|------|---------|------|
| Editor (신규) | `/lesson/editor` | 없음 | `editor/new` 라우트로 연결 |
| Editor (편집) | `/lesson/editor/:slideId` | 선택 | ID가 URL에 포함 |
| Viewer | `/lesson/viewer/:slideId` | **필수** | ID 없으면 404 or 목록으로 리다이렉트 |

> Editor는 `/lesson/editor`와 `/lesson/editor/:slideId` 두 경로를 같은 `LessonEditorPage`에 매핑한다. `useParams`로 `slideId` 존재 여부를 판단해 신규/편집 분기.

## 4. 신규 Page 컴포넌트

### 4.1 `pages/lesson/LessonEditorPage.tsx`

```
역할: SlideEditor 전용 fullscreen 페이지
- useParams<{ slideId?: string }>()로 slideId 읽기
- <LessonEditorEmbed slideId={slideId} … /> 마운트
```

| 이벤트 | Host 처리 |
|--------|-----------|
| `onExitRequested` | `navigate(-1)` — 이전 페이지(LessonMyPage)로 복귀 |
| `onSaved` | 신규 첫 저장 시 `slideId` 발급 → `navigate('/lesson/editor/' + p.slideId, { replace: true })`로 URL 교체 (뒤로가기 스택 오염 방지) |
| `onStartLesson` | 현재는 `console.log` 기록 후 no-op. 수업 화면 라우트 확정 후 `navigate('/lesson/viewer/' + p.lcmsSetId)` 등으로 교체 예정 |

### 4.2 `pages/lesson/LessonViewerPage.tsx`

```
역할: SlideViewer 전용 fullscreen 페이지
- useParams<{ slideId: string }>()로 slideId 읽기
- slideId 미확보 시 <Navigate to="/lesson/my" replace />
- <LessonViewerEmbed slideId={slideId} … /> 마운트
```

| 이벤트 | Host 처리 |
|--------|-----------|
| `onExitRequested` | `navigate(-1)` |
| `onCompleted` | 현재는 no-op (결과 페이지 연동은 후속 Phase) |

## 5. `app/router/routes.tsx` 변경

`TeacherFullscreenLayout` 블록에 다음 3개 Route를 추가한다.

```tsx
<Route element={<TeacherFullscreenLayout />}>
  <Route path='/lesson/deploy/:itemId' element={<LessonDeployPage />} />
  {/* 추가계획5 */}
  <Route path='/lesson/editor' element={<LessonEditorPage />} />
  <Route path='/lesson/editor/:slideId' element={<LessonEditorPage />} />
  <Route path='/lesson/viewer/:slideId' element={<LessonViewerPage />} />
</Route>
```

> `@pages/index` 또는 직접 import 방식은 기존 `LessonDeployPage` 패턴(`import LessonDeployPage from '@pages/lesson/LessonDeployPage'`)을 따른다.

## 6. `LessonMyPage.tsx` 변경

| 현재 | 변경 후 |
|------|---------|
| `const [mode, setMode] = useState<Mode>('idle')` | 제거 |
| `{mode === 'editor' && <LessonEditorEmbed />}` | 제거 |
| `{mode === 'viewer' && <LessonViewerEmbed slideId={SLIDE_ID} />}` | 제거 |
| `<Button onClick={() => setMode('editor')}>+ 새로 만들기</Button>` | `navigate('/lesson/editor')` |
| `<Button onClick={() => setMode('viewer')}>수업하기</Button>` | `navigate('/lesson/viewer/' + SLIDE_ID)` |

- `LessonEditorEmbed`, `LessonViewerEmbed` import 제거
- `useNavigate` 추가

## 7. `features/lesson/ui/LessonEditorEmbed.tsx` 변경 (요청 3)

독립 fullscreen 페이지 전환에 따라 **Host 외부 버튼이 없으므로** iframe 내 '수업하기'·'나가기' 버튼을 활성화한다. (§4.3.3 지침 — 소비 서비스 자체 버튼과 중복 아닐 때만 켤 것)

```tsx
options: {
  ...
  features: {
    showStartLesson: true,  // SDK 1.3.0 — '수업하기' 버튼 노출
    showExit: true,         // SDK 1.4.0 — '나가기' 버튼 노출
  },
}
```

또한, `LessonEditorEmbed`에 `onExitRequested` prop을 배선하여 iframe 내 '나가기' 버튼 클릭 시 이전 페이지로 복귀하도록 한다. Page 레이어(`LessonEditorPage`)에서 아래와 같이 처리한다.

```tsx
<LessonEditorEmbed
  slideId={slideId}
  onExitRequested={() => navigate(-1)}
  ...
/>
```

아울러, `EditorContainer`의 `position: fixed; z-index: 9999` 스타일은 **독립 라우트 페이지에서는 불필요**하다. `TeacherFullscreenLayout`이 이미 전체 화면을 제공하므로, styled 컴포넌트를 단순 `width:100%; height:100%` 레이아웃으로 교체한다. (`LessonViewerEmbed`도 동일하게 정리 필요)

## 8. `features/lesson/index.ts` 변경

새 타입 `StartLessonPayload`가 페이지 레이어에서 필요하므로 export 추가.

```ts
export type { ..., StartLessonPayload } from './lib/everyCanvasEmbedSdk';
```

## 9. 변경 파일 목록

| 파일 | 유형 | 핵심 변경 |
|------|------|-----------|
| `pages/lesson/LessonEditorPage.tsx` | **신규** | `useParams` → `LessonEditorEmbed` 마운트, 이벤트 → navigate |
| `pages/lesson/LessonViewerPage.tsx` | **신규** | `useParams` → `LessonViewerEmbed` 마운트, 이벤트 → navigate |
| `pages/lesson/LessonMyPage.tsx` | 수정 | `mode` state 제거, inline embed 제거, `useNavigate` 전환 |
| `app/router/routes.tsx` | 수정 | `TeacherFullscreenLayout` 블록에 editor/viewer 3개 Route 추가 |
| `features/lesson/ui/LessonEditorEmbed.tsx` | 수정 | `features.showStartLesson·showExit: true`, fixed overlay 스타일 제거 |
| `features/lesson/ui/LessonViewerEmbed.tsx` | 수정 | fixed overlay 스타일 제거 (EditorEmbed와 동일 정리) |
| `features/lesson/index.ts` | 수정 | `StartLessonPayload` export 추가 |

## 10. 완료 기준

- [x] `/lesson/editor` 접속 시 GNB/LNB 없는 전체 화면 Editor iframe 노출
- [x] `/lesson/editor/:slideId` 접속 시 해당 슬라이드 편집 Editor iframe 노출
- [x] `/lesson/viewer/:slideId` 접속 시 GNB/LNB 없는 전체 화면 Viewer iframe 노출
- [x] `LessonMyPage` '+ 새로 만들기' 클릭 → `/lesson/editor` 이동
- [x] `LessonMyPage` '수업하기' 클릭 → `/lesson/viewer/:slideId` 이동
- [x] Editor iframe 내 '나가기' 클릭 → 이전 페이지 복귀
- [x] Editor iframe 내 '수업하기' 클릭 → `onStartLesson` 콜백 실행 (현재 console.log)
- [ ] `npx tsc -b --noEmit`, eslint 통과

---

# 추가계획6 — LMS ref-set API 연동 (`onSaved` 자동 등록 + 목록 조회)

> **참조**: [`lesson-everycanvas-lms-integration.plan.md §3(나의 자료), §5.1, §5.3`](./lesson-everycanvas-lms-integration.plan.md)  
> **상태**: 구현 완료 (`ResourceCardList` 연결은 추가계획10에서 완료)  
> **2026-08-14 갱신**: LMS 참조-only 계약 반영 — `title`/`subjectCd`/`schoolLevelCd` 컬럼 제거, meta-dashboard `options`(`title` 필수 · `thumbnailUrl` 선택) store-and-echo. `LibItem`은 `id`·`title` 필수, 나머지 선택.  
> **2026-08-18 갱신**: 추가계획3 Phase B · 추가계획6 잔여(`ResourceCardList` 연결) · 추가계획10이 동일 범위임을 확인하고 구현 완료로 통일.

## 1. 현황 및 목표

### 현황

| 항목 | 현재 상태 |
|------|-----------|
| `LessonEditorPage.onSaved` | `lcmsSetId` + `title` 있을 때 `POST /api/ref-set` (`options` 포함) |
| `LessonMyPage` 목록 | `useRefSetListQuery` + `mapRefSetToLibItem` → `ResourceCardList` (추가계획10에서 연결 완료) |
| `features/lesson/api/` | `queryKeys` · `lmsRefSetService` · `queries` 구현 완료 |
| `shared/config/env.ts` | `VITE_SP_LMS_API_URL` / `ENV.SP_LMS_API_URL` 추가 완료 |

### 목표

1. `onSaved(p)` → `p.lcmsSetId` + `p.title` 있을 때 `POST /api/ref-set` 자동 등록 (중복 방지 포함)
2. `LessonMyPage`에서 `GET /api/ref-set` 실제 데이터 조회
   - `ResourceCardList` 연결(mapper 포함)은 추가계획10에서 완료 (§4.4 참조)
3. 기존 API 패턴(`queryKeys.ts` / service / `queries.ts`)에 맞는 구조로 구현

## 2. 연동 흐름

```
[저작 저장 흐름]
LessonEditorPage
  └─ onSaved(p: SavedPayload)
      ├─ p.lcmsSetId && p.title 있으면
      │   ├─ GET cache 에서 동일 lcmsSetId 존재 여부 확인 (중복 방지)
      │   ├─ 없으면 → registerRefSet({
      │   │       lcmsSetId,
      │   │       makeMethod,
      │   │       options: { title, thumbnailUrl? }   // thumbnail ← SavedPayload.thumbnail
      │   │     })
      │   │       └─ POST {ENV.SP_LMS_API_URL}/api/ref-set
      │   │           └─ 성공 → lessonKeys.refSets() invalidate → 목록 자동 갱신
      │   └─ 이미 있으면 → skip (중복 POST 방지)
      └─ !slideId && p.slideId 있으면
          └─ navigate(`/lesson/editor/${p.slideId}`, { replace: true }) (기존 로직 유지)

[목록 조회 흐름]
LessonMyPage (마운트)
  └─ useRefSetListQuery()
      └─ GET {ENV.SP_LMS_API_URL}/api/ref-set
          └─ resultData.list → mapRefSetToLibItem → ResourceCardList (추가계획10에서 연결 완료)
```

## 3. LMS 호출 경로 (확정)

**직접 LMS 호출** 사용.

| 항목 | 값 |
|------|----|
| LMS 도메인 | `http://t-gw.vschool.at/v1/lms` |
| GET 엔드포인트 | `{ENV.SP_LMS_API_URL}/api/ref-set` |
| POST 엔드포인트 | `{ENV.SP_LMS_API_URL}/api/ref-set` |
| 인증 | SSO Bearer JWT (`getAuth().authorizedFetch`) |
| env 변수 | `ENV.SP_LMS_API_URL` (기본값 `http://t-gw.vschool.at/v1/lms`) → **env.ts 추가 완료** |

> `apiClient`(meta-dashboard BE 전용, `ENV.API_URL` base)를 사용할 수 없으므로 `getAuth().authorizedFetch`로 직접 호출한다. 응답은 LMS envelope(`{ success, resultCode, resultData }`) 구조.

### API 계약 (LMS 코드·규격서 + meta-dashboard options)

**GET `/api/ref-set`** — Request 파라미터 없음. `resultData.list[]`:

| 필드 | 타입 | 설명 |
|------|------|------|
| `refSetId` | string | 보관함 참조 ID |
| `lcmsSetId` | string | CMS 세트 ID |
| `makeMethod` | number | 1~5 |
| `status` | number | 상태 |
| `options` | object \| null | store-and-echo. meta: `title`(필수), `thumbnailUrl`(선택) |
| `createdAt` | string | 등록 시각 |

**POST `/api/ref-set`** body:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `lcmsSetId` | string | ✅ | CMS 세트 ID |
| `makeMethod` | number |  | 미지정 시 3(자료실) |
| `options.title` | string | ✅ | 카드 제목 |
| `options.thumbnailUrl` | string |  | 카드 썸네일 URL |

> LMS 컬럼에 `title`/`subjectCd`/`schoolLevelCd` 없음. 카드 메타는 `options`에만 담는다.

## 4. 신규 파일

### 4.1 `features/lesson/api/queryKeys.ts`

기존 `assessmentKeys`, `groupKeys` 패턴과 동일한 factory 구조.

```ts
export const lessonKeys = {
  all: ['lesson'] as const,
  refSets: () => [...lessonKeys.all, 'ref-set'] as const,
};
```

### 4.2 `features/lesson/api/lmsRefSetService.ts`

```ts
import { getAuth } from '@shared/lib/authClient';
import { ENV } from '@shared/config/env';

const BASE = `${ENV.SP_LMS_API_URL}/api/ref-set`;

interface LmsEnvelope<T> {
  success: boolean;
  resultCode: number;
  resultMessage: string;
  resultData: T;
}

/** meta-dashboard options 계약 (LMS store-and-echo) */
export interface RefSetOptions {
  title: string;
  thumbnailUrl?: string;
}

/** GET /api/ref-set 응답 아이템 */
export interface RefSetItem {
  refSetId: string;
  lcmsSetId: string;
  makeMethod: number;
  status: number;
  options: RefSetOptions | null;
  createdAt: string;
}

export interface RefSetListData {
  totalCount: number;
  list: RefSetItem[];
}

/** POST /api/ref-set 요청 body */
export interface RegisterRefSetBody {
  lcmsSetId: string;
  /**
   * 1:신규직접 2:완성형가공 3:자료실 4:AI생성 5:AI가공
   * SavedPayload.lessonMeta.makeMethod 미전달 시 기본값 3(자료실) 사용
   */
  makeMethod?: number;
  options: RefSetOptions;
}

export interface RegisterRefSetResponse {
  refSetId: string;
}

async function lmsFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const auth = getAuth();
  const res = await auth.authorizedFetch(input, init);
  if (!res.ok) throw new Error(`LMS API 실패: ${res.status}`);
  const json = (await res.json()) as LmsEnvelope<T>;
  if (!json.success) throw new Error(json.resultMessage ?? 'LMS API Error');
  return json.resultData;
}

export async function getRefSetList(): Promise<RefSetListData> {
  return lmsFetch<RefSetListData>(BASE);
}

export async function registerRefSet(body: RegisterRefSetBody): Promise<RegisterRefSetResponse> {
  return lmsFetch<RegisterRefSetResponse>(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
```

### 4.3 `features/lesson/api/queries.ts`

중복 방지: mutation 호출 전 cache에서 동일 `lcmsSetId` 존재 여부를 확인하고, 이미 등록된 경우 skip한다.

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRefSetList, registerRefSet } from './lmsRefSetService';
import type { RegisterRefSetBody, RefSetListData } from './lmsRefSetService';
import { lessonKeys } from './queryKeys';

export function useRefSetListQuery() {
  return useQuery({
    queryKey: lessonKeys.refSets(),
    queryFn: getRefSetList,
  });
}

export function useRegisterRefSetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RegisterRefSetBody) => {
      // 중복 방지: cache에 동일 lcmsSetId 이미 있으면 skip
      const cached = queryClient.getQueryData<RefSetListData>(lessonKeys.refSets());
      const alreadyRegistered = cached?.list.some(
        (item) => item.lcmsSetId === body.lcmsSetId,
      );
      if (alreadyRegistered) return Promise.resolve({ refSetId: '' });
      return registerRefSet(body);
    },
    onSuccess: async (_data, variables) => {
      // skip 분기(refSetId 빈 값)도 invalidate해 목록 최신화
      if (variables.lcmsSetId) {
        await queryClient.invalidateQueries({ queryKey: lessonKeys.refSets() });
      }
    },
  });
}
```

> **cache miss 시**: `useRefSetListQuery`가 마운트 전이거나 아직 fetch 전이면 cached가 없어 중복 체크가 불가하다. 이 경우 POST가 실행되며, LMS가 같은 `lcmsSetId`로 중복 행을 허용하는지는 추가 확인 필요 (→ 미확정 항목 #2).

### 4.4 `features/lesson/model/mapRefSetToLibItem.ts` — **추가계획10에서 연결 완료**

`RefSetItem`(LMS `GET /api/ref-set`) → `LibItem`.  
매핑: `id←lcmsSetId`, `refSetId←refSetId`, `title←options.title`, `thumbnailUrl←options.thumbnailUrl`, `createdAt←createdAt`.  
`ResourceCardList` 연결은 추가계획10에서 완료.

```ts
import type { RefSetItem } from '../api/lmsRefSetService';
import type { LibItem, LibraryColorGroup } from './types';

const COLOR_GROUPS: LibraryColorGroup[] = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];

function pickColorGroup(id: string): LibraryColorGroup {
  const code = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLOR_GROUPS[code % COLOR_GROUPS.length];
}

export function mapRefSetToLibItem(item: RefSetItem): LibItem {
  return {
    id: item.lcmsSetId,
    refSetId: item.refSetId,
    title: item.options?.title ?? '',
    thumbnailUrl: item.options?.thumbnailUrl,
    createdAt: item.createdAt,
    src: 'internal',
    colorGroup: pickColorGroup(item.refSetId),
  };
}
```

### 4.5 `LibItem` (`features/lesson/model/types.ts`)

필수: `id`, `title`. `refSetId`는 나의 자료(ref-set) 연동 시 사용(선택).  
`src` / `selArea` / `colorGroup` 포함 그 외 필드는 모두 선택. (`updated` → `createdAt` 로 통일)

```ts
export interface LibItem {
  id: string;
  refSetId?: string;
  title: string;
  thumbnailUrl?: string;
  src?: LibrarySrc;
  selArea?: string;
  colorGroup?: LibraryColorGroup;
  views?: number;
  saves?: number;
  reason?: string;
  createdAt?: string;
  provider?: string;
  level?: string[];
  grade?: string[];
  duration?: string;
  factors?: string[];
}
```

## 5. 기존 파일 변경

### 5.1 `pages/lesson/LessonEditorPage.tsx`

`useRegisterRefSetMutation` 훅 추가, `onSaved`에서 `lcmsSetId` + `title` 있을 때 mutate 호출.

- `makeMethod`: `SavedPayload.lessonMeta.makeMethod`를 `Number()`로 변환. **미전달 시 기본값 `3`(자료실)**
- `options.title`: `p.title` (필수 — 없으면 POST skip)
- `options.thumbnailUrl`: `p.thumbnail` 있을 때만 포함

```tsx
import { useRegisterRefSetMutation } from '@features/lesson';

const { mutate: registerRefSet } = useRegisterRefSetMutation();

onSaved={(p: SavedPayload) => {
  if (p.lcmsSetId && p.title) {
    registerRefSet({
      lcmsSetId: p.lcmsSetId,
      makeMethod: p.lessonMeta?.makeMethod !== undefined
        ? Number(p.lessonMeta.makeMethod)
        : 3,  // 기본값: 3(자료실)
      options: {
        title: p.title,
        ...(p.thumbnail ? { thumbnailUrl: p.thumbnail } : {}),
      },
    });
  }
  if (!slideId && p.slideId) {
    navigate(`/lesson/editor/${p.slideId}`, { replace: true });
  }
}}
```

### 5.2 `pages/lesson/LessonMyPage.tsx` — GET 조회 + ResourceCardList 연결 (추가계획10)

`useRefSetListQuery()`로 조회한 `data.list`를 `mapRefSetToLibItem`으로 변환해 `ResourceCardList`에 전달.  
MOCK 경로는 주석으로 보존.

```tsx
import { useRefSetListQuery, mapRefSetToLibItem } from '@features/lesson';

const { data: refSetData, isPending, isError } = useRefSetListQuery();
const items = useMemo(() => (refSetData?.list ?? []).map(mapRefSetToLibItem), [refSetData]);
```

### 5.3 `features/lesson/index.ts`

신규 훅·타입·mapper export. `mapRefSetToLibItem`은 추가계획10에서 `ResourceCardList` 연동과 함께 export 완료.

```ts
export { useRefSetListQuery, useRegisterRefSetMutation } from './api/queries';
export type {
  RefSetItem,
  RegisterRefSetBody,
  RefSetListData,
  RefSetOptions,
} from './api/lmsRefSetService';
```

## 6. 변경 파일 목록

| 파일 | 유형 | 핵심 변경 |
|------|------|-----------|
| `shared/config/env.ts` | **수정 완료** | `SP_LMS_API_URL` 추가 |
| `features/lesson/api/queryKeys.ts` | **구현 완료** | `lessonKeys` factory |
| `features/lesson/api/lmsRefSetService.ts` | **수정 완료** | `RefSetOptions`·`options` 계약. `title`/`subjectCd`/`schoolLevelCd` 제거 |
| `features/lesson/api/queries.ts` | **구현 완료** | `useRefSetListQuery`, `useRegisterRefSetMutation` (cache 기반 중복 방지) |
| `features/lesson/model/mapRefSetToLibItem.ts` | **수정 완료** | `id←lcmsSetId`, `refSetId`, `title/thumbnailUrl←options`, `createdAt←createdAt` |
| `features/lesson/model/types.ts` | **수정 완료** | `LibItem`: `id`·`title` 필수, `updated`→`createdAt`, 나머지 선택 |
| `features/lesson/ui/ResourceCard.tsx` | **수정 완료** | optional `src`/`selArea`/`colorGroup` 가드 |
| `features/lesson/model/matchLibraryFilters.ts` | **수정 완료** | optional `selArea` 가드 |
| `pages/lesson/LessonEditorPage.tsx` | **수정 완료** | `options: { title, thumbnailUrl? }` POST |
| `pages/lesson/LessonMyPage.tsx` | **수정 완료** | `useRefSetListQuery` + `mapRefSetToLibItem` → `ResourceCardList` (추가계획10) |
| `features/lesson/index.ts` | **수정 완료** | 훅·타입·`mapRefSetToLibItem` export (`RefSetOptions` 포함) |

## 7. 확정·미확정 항목

| # | 항목 | 상태 | 내용 |
|---|------|------|------|
| 1 | **LMS 호출 경로** | **확정** | 직접 LMS. `ENV.SP_LMS_API_URL` + `getAuth().authorizedFetch` |
| 2 | **POST 중복 등록** | 중복 방지 포함 | cache 기반 중복 체크. cache miss 시 LMS 중복 허용 여부 추가 확인 필요 |
| 3 | **makeMethod 기본값** | **확정** | 미전달 시 `3`(자료실) |
| 4 | **options 계약** | **확정** | `title`(필수)·`thumbnailUrl`(선택). LMS 스키마 검증 없음(store-and-echo) |
| 5 | **subjectCd / schoolLevelCd** | **폐기** | LMS 컬럼 아님. POST body·GET 응답에서 제거 |
| 6 | **DELETE ref-set** | **완료** | 추가계획10 — `DELETE /api/ref-set/{refSetId}` |
| 7 | **ResourceCardList 연결** | **완료** | 추가계획10 — `mapRefSetToLibItem` → `ResourceCardList` |

## 8. 완료 기준

- [x] `shared/config/env.ts`: `ENV.SP_LMS_API_URL` 추가 확인
- [x] `LessonEditorPage`: `onSaved` + `lcmsSetId`/`title` → `POST /api/ref-set` (`options`) 호출
- [x] 동일 `lcmsSetId` 재저장 시 중복 POST 미발생 확인
- [x] `LessonMyPage`: `useRefSetListQuery` 마운트 → `GET /api/ref-set` 호출 확인
- [x] `POST` 성공 후 `lessonKeys.refSets()` invalidate → GET 자동 refetch 확인
- [x] `lessonKeys` factory 사용, 임의 문자열 query key 없음
- [x] DTO/`LibItem`을 options 계약·선택 필드에 맞춤
- [x] `npx tsc -b --noEmit`, eslint 통과
- [x] `refSetData.list` → `mapRefSetToLibItem` → `ResourceCardList` 연결 — 추가계획10에서 완료

---

**수정**: 2026-08-18 — `ResourceCardList` 연결·DELETE는 추가계획10에서 완료. 추가계획3 Phase B와 동일 범위.  
**상태**: 구현 완료

---

# 추가계획7 — ResourceCard 수정하기 → Editor 라우트 이동

> **상태**: 구현 완료  
> **범위**: `ResourceCard` '수정하기' 클릭 시 `/lesson/editor/:slideId` 이동. `slideId` = `item.id`

## 1. 현황

- `ResourceCard` '시작하기'는 이미 `/lesson/deploy/${item.id}` (+ `location.search`) navigate 연결됨
- '수정하기' 버튼(`ResourceCard.tsx` 57–60행)은 `onClick` 없음
- Editor 라우트는 추가계획5에서 `TeacherFullscreenLayout` 하위에 구성 완료
  - `/lesson/editor` — 신규
  - `/lesson/editor/:slideId` — 기존 세트 편집

## 2. 구현 방법

### 2.1 `features/lesson/ui/ResourceCard.tsx`

'수정하기' 버튼에 `onClick` 추가:

```tsx
<Button
  type='button'
  variant='outline'
  size='md'
  fullWidth
  onClick={() => navigate(`/lesson/editor/${item.id}`)}
>
  수정하기
</Button>
```

- `slideId`는 사용자 지시에 따라 **`item.id`** 사용
- `variant`(library / my) 구분 없이 동일 동작 (카드가 렌더되는 모든 화면에서 편집 진입)
- 배포 라우트와 달리 `location.search` 전달은 불필요 (Editor는 쿼리 의존 없음)

### 2.2 변경 파일

| 파일 | 유형 | 핵심 변경 |
|------|------|-----------|
| `features/lesson/ui/ResourceCard.tsx` | **수정 완료** | 수정하기 → `/lesson/editor/${item.id}` navigate |

### 2.3 완료 기준

- [x] library / my 카드 '수정하기' 클릭 시 `/lesson/editor/:slideId` 이동
- [x] URL의 `:slideId`가 `item.id`와 일치
- [x] GNB/LNB 없는 TeacherFullscreenLayout으로 Editor 노출

---

# 추가계획8 — 전체 자료실 CMS `GET /api/sets` 연동

> **상태**: 구현 완료 (2026-08-14 응답 페이지 객체 `{ list, pageNo, pageSize, totalCount }` 반영)  
> **범위**: `LessonLibraryContents` mock → CMS 세트 목록 API 교체. FilterPanel 값은 아직 API 파라미터에 매핑하지 않음(동일 쿼리 재호출). MOCK 코드는 주석으로 보존.  
> **비범위**: 필터 taxonomy ↔ CMS metaId 매핑, 무한 스크롤(페이지네이션 고도화 → 추가계획13), 썸네일 UI 렌더(타입만 추가)

## 1. 현황 및 목표

### 현황

| 항목 | 현재 상태 |
|------|-----------|
| `LessonLibraryContents` | `useCmsSetListQuery` → `data.list` → `mapCmsSetToLibItem` → `ResourceCardList` |
| `LessonLibraryPage` | `useLibraryFilters` + `FilterPanel` (로컬 상태만, API param 미매핑) |
| CMS sets API | `ENV.CMS_API_URL` + `getCmsSetList` → `CmsSetListData` |
| `LibItem` | `thumbnailUrl?` 포함. `id`/`title` 필수, 나머지 선택 |

### 목표

1. `GET {CMS}/api/sets` 로 전체 자료실 목록 조회 (마운트 시 1회 + 필터 조작 시마다 재조회)
2. FilterPanel 버튼은 **모두 동일한 request param**으로 호출 (필터→CMS 파라미터 매핑은 추후)
3. 연속 클릭 시 **마지막 요청 응답만** UI에 반영 (레이스 방지)
4. 조회 중 loading(레이지/스켈레톤) UI
5. CMS DTO → `LibItem` 최소 매핑 (`setId`/`title`/`thumbnailUrl`). 나머지 필드는 임시값 + **TO FIX** 표기
6. `MOCK_LIBRARY_ITEMS` 경로는 주석으로 남겨 즉시 복구 가능하게 유지

## 2. API 스펙

| 항목 | 값 |
|------|----|
| Base | `https://t2-public-cmsapi.vsaidt.com` → `ENV.CMS_API_URL` |
| Method / Path | `GET /api/sets` |
| 인증 | SSO Bearer JWT (`getAuth().authorizedFetch`) |
| 기본 고정 param | `pageNo=0`, `pageSize=10`, `brandId=18`, `serviceType=131132` |

### Query params

| param | 타입 | 설명 | 이번 Phase |
|-------|------|------|------------|
| `pageNo` | string | 페이지 번호(0부터) | 고정 `0` |
| `pageSize` | string | 페이지 크기 | 고정 `10` |
| `keyword` | string | 검색어 | 미사용 |
| `metaId` | string | 메타 ID | 미사용 |
| `brandId` | int64 | 브랜드 ID | 고정 `18` |
| `curriYear` | int64 | 교육과정 메타 ID | 미사용 |
| `curriSchool` | int64 | 학교급 메타 ID | 미사용 |
| `curriSubject` | int64 | 교과목 메타 ID | 미사용 |
| `curriBook` | int64 | 교과 메타 ID | 미사용 |
| `curriUnit1` | int64 | 교과과정 코드 | 미사용 |
| `serviceType` | int64 | 서비스 타입 메타 ID | 고정 `131132` |

### 성공 응답 (200)

페이지 객체 본문 (LMS envelope이 아님에 주의). 실측 응답(2026-08-14):

```json
{
  "list": [
    {
      "createdAt": "2026-08-13T10:29:58.000",
      "setId": "27042",
      "slideCount": 0,
      "thumbnailUrl": "upload/6/thumbnail/set-sample.png",
      "title": "일차함수 세트"
    },
    {
      "createdAt": "2026-08-13T16:21:43.000",
      "setId": "27047",
      "slideCount": 1,
      "thumbnailUrl": "upload/6/thumbnail/sample.png",
      "title": "정식 저장 세트 테스트(PUT)"
    }
  ],
  "pageNo": 0,
  "pageSize": 10,
  "totalCount": 23
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `list` | object[] | 세트 목록 |
| `list[].setId` | string | CMS 세트 ID |
| `list[].title` | string | 제목 |
| `list[].thumbnailUrl` | string | 썸네일 상대/절대 경로 (없을 수 있음) |
| `list[].slideCount` | number | 슬라이드 수 |
| `list[].createdAt` | string | 생성 시각 |
| `pageNo` | number | 현재 페이지 (0부터) |
| `pageSize` | number | 페이지 크기 |
| `totalCount` | number | 전체 건수 |

> 초기 스펙의 배열 본문·`metas[]` 형태와 다름. 실측 기준은 위 페이지 객체. FE는 `CmsSetListData`로 파싱 후 `list`를 매핑한다.

### 실패 응답 (400 / 500)

```json
{
  "timestamp": "...",
  "status": 400,
  "code": "INVALID_REQUEST",
  "message": "필수값 누락",
  "path": "/api/slides",
  "requestId": "...",
  "violations": [{ "field": "userId", "message": "필수값입니다." }]
}
```

> 스펙 문서상 500 예시 body가 400과 동일하게 적혀 있음. 구현은 `!res.ok` 시 status + message로 throw.

## 3. 필터 재조회 + 레이스 처리 — 가능 여부

**결론: 가능한 구조.** TanStack Query v5 + `AbortSignal`로 "마지막 요청만 반영"을 구현한다.

### 왜 동일 param인데 필터마다 호출하나?

- 이번 Phase는 FilterPanel ↔ CMS meta 매핑이 없어 **request query는 항상 동일**
- 그래도 UX상 "필터를 누를 때마다 목록을 다시 가져온다"가 요구이므로, **filters/sort 변경을 refetch 트리거**로 사용한다

### 권장 패턴

```ts
useQuery({
  // filters/sort를 key에 넣어 토글마다 새 fetch (값은 API에 안 넣음)
  queryKey: [...lessonKeys.cmsSets(), filters, sort],
  queryFn: ({ signal }) =>
    getCmsSetList(
      { pageNo: 0, pageSize: 10, brandId: 18, serviceType: 131132 },
      signal,
    ),
  placeholderData: keepPreviousData, // 로딩 중 이전 목록 유지(깜빡임 완화). 초기 마운트는 빈 상태 + loading
})
```

| 이슈 | 처리 |
|------|------|
| 연속 클릭 레이스 | `queryFn`의 `signal`을 `fetch`에 전달 → queryKey 변경 시 이전 요청 abort. 응답이 와도 stale 옵저버에 반영되지 않음 |
| 동일 param 캐시 | key에 filters가 포함되므로 조합별로 캐시. 데이터는 같아도 무방. 추후 실제 param 매핑 시 그대로 확장 |
| 마운트 시 조회 | `LessonLibraryPage` 진입 → Contents 마운트 → `useQuery` 자동 fetch |
| 안 되는 경우 | 고정 queryKey + `refetch()`만 쓰면 in-flight 여러 개가 겹칠 수 있음 → **이 패턴은 비권장**. signal 없는 raw fetch도 비권장 |

> FilterPanel의 `onToggle`/`onClear`/`onSort`는 기존 `useLibraryFilters` 유지. Contents가 filters/sort를 props로 받아 queryKey에 넣으면 Page 쪽 추가 로직 없이 재조회된다.

## 4. 연동 흐름

```
[마운트]
LessonLibraryPage
  └─ LessonLibraryContents(filters, sort)
      └─ useCmsSetListQuery(filters, sort)
          └─ GET {ENV.CMS_API_URL}/api/sets?pageNo=0&pageSize=10&brandId=18&serviceType=131132
              └─ mapCmsSetToLibItem[] → ResourceCardList

[필터/정렬 클릭]
FilterPanel onToggle/onClear/onSort
  └─ filters/sort state 변경
      └─ queryKey 변경 → 이전 fetch abort → 동일 param으로 새 GET
          └─ isFetching 중 loading UI
              └─ 마지막 성공 응답만 목록 반영

[MOCK 복구]
LessonLibraryContents 내 주석 처리된 MOCK 경로 주석 해제 + CMS 훅 비활성
```

## 5. 신규·수정 파일

### 5.1 `shared/config/env.ts`

```ts
/** public CMS API 기본 URL */
CMS_API_URL:
  (import.meta.env.VITE_CMS_API_URL as string | undefined) ??
  'https://t2-public-cmsapi.vsaidt.com',
```

### 5.2 `features/lesson/api/queryKeys.ts`

```ts
export const lessonKeys = {
  all: ['lesson'] as const,
  refSets: () => [...lessonKeys.all, 'ref-set'] as const,
  cmsSets: () => [...lessonKeys.all, 'cms-sets'] as const,
};
```

### 5.3 `features/lesson/api/cmsSetService.ts` (신규)

```ts
import { getAuth } from '@shared/lib/authClient';
import { ENV } from '@shared/config/env';

/** GET /api/sets list[] 아이템 (실측 2026-08-14) */
export interface CmsSetItem {
  setId: string;
  title: string;
  thumbnailUrl?: string;
  slideCount?: number;
  createdAt?: string;
}

/** GET /api/sets 페이지 응답 */
export interface CmsSetListData {
  list: CmsSetItem[];
  pageNo: number;
  pageSize: number;
  totalCount: number;
}

export interface CmsSetListParams {
  pageNo: number;
  pageSize: number;
  brandId: number;
  serviceType: number;
  keyword?: string;
  metaId?: string;
  curriYear?: number;
  curriSchool?: number;
  curriSubject?: number;
  curriBook?: number;
  curriUnit1?: number;
}

export async function getCmsSetList(
  params: CmsSetListParams,
  signal?: AbortSignal,
): Promise<CmsSetListData> {
  const qs = new URLSearchParams({
    pageNo: String(params.pageNo),
    pageSize: String(params.pageSize),
    brandId: String(params.brandId),
    serviceType: String(params.serviceType),
  });
  // optional params는 값이 있을 때만 append

  const auth = getAuth();
  const res = await auth.authorizedFetch(`${ENV.CMS_API_URL}/api/sets?${qs}`, {
    signal,
    headers: { accept: '*/*' },
  });
  if (!res.ok) {
    // 400/500 error body의 message 활용 시도
    throw new Error(`CMS sets 조회 실패: ${res.status}`);
  }
  return (await res.json()) as CmsSetListData;
}
```

### 5.4 `features/lesson/api/queries.ts` — `useCmsSetListQuery` 추가

```ts
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getCmsSetList } from './cmsSetService';
import type { LibFilters, SortKey } from '../model/types';

const CMS_SETS_DEFAULT = {
  pageNo: 0,
  pageSize: 10,
  brandId: 18,
  serviceType: 131132,
} as const;

/** filters/sort는 queryKey 트리거용. 이번 Phase에서는 API param에 매핑하지 않음 */
export function useCmsSetListQuery(filters: LibFilters, sort: SortKey) {
  return useQuery({
    queryKey: [...lessonKeys.cmsSets(), filters, sort],
    queryFn: ({ signal }) => getCmsSetList({ ...CMS_SETS_DEFAULT }, signal),
    placeholderData: keepPreviousData,
  });
}
```

### 5.5 `features/lesson/model/types.ts` — `thumbnailUrl` 추가

```ts
export interface LibItem {
  id: string;
  refSetId?: string;
  title: string;
  /** CMS 썸네일 URL — 선택. UI 반영은 추후 */
  thumbnailUrl?: string;
  src?: LibrarySrc;
  selArea?: string;
  colorGroup?: LibraryColorGroup;
  // ...기존 필드
}
```

### 5.6 `features/lesson/model/mapCmsSetToLibItem.ts` (신규)

```ts
import type { CmsSetItem } from '../api/cmsSetService';
import type { LibItem, LibraryColorGroup } from './types';

const COLOR_GROUPS: LibraryColorGroup[] = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];

function pickColorGroup(id: string): LibraryColorGroup {
  const code = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return COLOR_GROUPS[code % COLOR_GROUPS.length];
}

/**
 * CMS Set → LibItem 최소 매핑.
 * 호환 확정: setId→id, title→title, thumbnailUrl→thumbnailUrl
 * 그 외는 임시값 (**TO FIX**) — 실측 응답에 metas 없음
 */
export function mapCmsSetToLibItem(item: CmsSetItem): LibItem {
  return {
    id: item.setId,
    title: item.title,
    thumbnailUrl: item.thumbnailUrl,
    // ---- TO FIX: CMS 스펙/taxonomy 매핑 확정 전 임시값 ----
    src: 'verified', // TO FIX
    selArea: undefined, // TO FIX
    colorGroup: pickColorGroup(item.setId), // TO FIX (썸네일 없을 때 fallback용)
    // -------------------------------------------------------
  };
}
```

### 5.7 `widgets/lesson/LessonLibraryContents.tsx`

```tsx
export const LessonLibraryContents = ({ filters, sort }: LessonLibraryContentsProps) => {
  const { data, isPending, isFetching, isError, error } = useCmsSetListQuery(filters, sort);
  const items = useMemo(
    () => (data?.list ?? []).map(mapCmsSetToLibItem),
    [data],
  );

  // --- MOCK 경로 (필요 시 아래 주석 해제 + 위 CMS 훅 비활성) ---
  // const items = useMemo(
  //   () =>
  //     sortLibraryItems(
  //       MOCK_LIBRARY_ITEMS.filter((item) => matchLibraryItem(item, filters)),
  //       sort,
  //     ),
  //   [filters, sort],
  // );
  // -----------------------------------------------------------

  if (isError && items.length === 0) {
    return (
      <Contents>
        <ErrorText role='alert'>
          {error instanceof Error ? error.message : '세트 목록을 불러오지 못했습니다.'}
        </ErrorText>
      </Contents>
    );
  }

  return (
    <Contents>
      <ResourceCardList items={items} isLoading={isPending || isFetching} />
    </Contents>
  );
};
```

### 5.8 Loading(레이지) UI

- **의미**: 무한 스크롤이 아니라 **API 호출 중 로딩 표시**
- 초기 진입(`isPending`): 목록 영역 스켈레톤 또는 중앙 로딩
- 필터 재조회(`isFetching` + `keepPreviousData`): 이전 목록 유지 + 상단/오버레이 로딩 인디케이터
- 구현 위치: `ResourceCardList`에 optional `isLoading?: boolean` 추가하거나 Contents에서 분기
- 기존 shared Spinner/Skeleton 패턴이 있으면 재사용, 없으면 Contents 내 최소 로딩 마크업

### 5.9 `features/lesson/index.ts`

```ts
export { useCmsSetListQuery } from './api/queries';
export type { CmsSetItem, CmsSetListData, CmsSetListParams } from './api/cmsSetService';
export { mapCmsSetToLibItem } from './model/mapCmsSetToLibItem';
```

## 6. 변경 파일 목록

| 파일 | 유형 | 핵심 변경 |
|------|------|-----------|
| `shared/config/env.ts` | **수정 완료** | `CMS_API_URL` 추가 |
| `features/lesson/api/queryKeys.ts` | **수정 완료** | `cmsSets()` 추가 |
| `features/lesson/api/cmsSetService.ts` | **수정 완료** | `CmsSetListData` 페이지 응답 파싱 (`list`/`pageNo`/`pageSize`/`totalCount`) |
| `features/lesson/api/queries.ts` | **수정 완료** | `useCmsSetListQuery` (signal + keepPreviousData) |
| `features/lesson/model/types.ts` | **수정 완료** | `LibItem.thumbnailUrl?`, 선택 필드화 |
| `features/lesson/model/mapCmsSetToLibItem.ts` | **수정 완료** | 최소 매핑 + TO FIX (metas 제거) |
| `widgets/lesson/LessonLibraryContents.tsx` | **수정 완료** | `data.list` 매핑, MOCK 주석 보존, loading |
| `features/lesson/ui/ResourceCardList.tsx` | **수정 완료** | optional `isLoading` |
| `features/lesson/index.ts` | **수정 완료** | `CmsSetListData` export 포함 |
| `.env.development` | **수정 완료** | `VITE_CMS_API_URL` |

## 7. 확정·미확정

| # | 항목 | 상태 | 내용 |
|---|------|------|------|
| 1 | CMS base URL | 확정 | `https://t2-public-cmsapi.vsaidt.com` → env |
| 2 | 고정 query | 확정 | `pageNo=0&pageSize=10&brandId=18&serviceType=131132` |
| 3 | 응답 형태 | **확정(실측)** | `{ list, pageNo, pageSize, totalCount }` (배열·`metas` 아님) |
| 4 | 필터→API 매핑 | 미적용 | 모든 필터 클릭 = 동일 API 재호출. taxonomy/metaId 매핑은 추후 |
| 5 | 레이스 처리 | 확정 | queryKey(filters,sort) + fetch AbortSignal |
| 6 | LibItem 매핑 | 부분 | id/title/thumbnailUrl만 호환. src/selArea/colorGroup은 **TO FIX** |
| 7 | thumbnail UI | 보류 | 타입만 추가. `ResourceCard` Thumb에 이미지 렌더는 별도 |
| 8 | 페이지네이션 | 보류 → 추가계획13 | pageSize=10 고정. `totalCount`는 수신만. 무한스크롤은 추가계획13 |
| 9 | CORS / 인증 | **확정** | `getAuth().authorizedFetch`로 Bearer JWT 전달 |

## 8. 완료 기준

- [x] `LessonLibraryPage` 최초 진입 시 `GET /api/sets?...brandId=18&serviceType=131132` 호출
- [x] FilterPanel 토글/정렬/초기화 시마다 동일 param으로 재호출
- [x] 연속 클릭 시 이전 요청 abort 또는 무시 → 마지막 응답만 목록 반영
- [x] 로딩 중 UI 표시 (초기 + 재조회)
- [x] 응답 `list` → `setId`/`title`/`thumbnailUrl` 매핑, 나머지 임시값 + TO FIX
- [x] `CmsSetListData` 페이지 객체 파싱
- [x] MOCK 경로 주석으로 코드 보존
- [x] `npx tsc -b --noEmit`, eslint 통과

---

# 추가계획9 — DeployPage 실시간 수업 → Viewer 이동 + item 전달/재조회

> **상태**: 1차·2차 구현 완료  
> **범위**:  
> 1) `ResourceCard` 「시작하기」 → **DeployPage** (`/lesson/deploy/:setId` 또는 `/lesson/deploy/:setId/:refSetId`) + `state.item`  
> 2) 배포 완료 후 `deployed.isLive` → `/lesson/viewer/:setId` (1차 완료)  
> 3) URL 직접 진입(state 없음) 시 `refSetId`/`setId`로 item API 재조회 + 로딩/실패 UX  
> **비범위**: Viewer Platform `slideId` 매핑, 배포 API, `LessonMyPage` ResourceCardList API 연결(추가계획6 잔여 → 추가계획10에서 완료)

---

## 0. 문서 이력

| 차수 | 내용 |
|------|------|
| 1차 | 실시간 배포 → Viewer, `ResourceCard` `state.item` 전달. mock find / `!item` early return 주석 보류. URL 직접 진입은 title fallback만 |
| **2차** | param 명칭 `itemId` → `setId` 통일. library/my `LibItem` 형식 확인. URL 직접 진입 시 LMS/CMS 단건 조회. 조회 중 로딩, 실패 시 toast + 이전 페이지 — **구현 완료 (2026-08-17)** |

---

## 1. 목표

1. **카드 「시작하기」** → DeployPage. Viewer가 아니다.  
   - path: `/lesson/deploy/${setId}` 또는 `/lesson/deploy/${setId}/${refSetId}`  
   - `useParams` 키는 `setId` / `refSetId` (구 `itemId` 폐기)
2. **실시간 배포 완료 후 「수업 시작하기」** → Viewer `navigate(\`/lesson/viewer/${setId}\`)` (1차 유지)
3. DeployPage 미리보기용 `LibItem`  
   - **1순위** `location.state.item` (시작하기 버튼)  
   - **2순위** URL 직접 진입 시 API 단건 조회
4. 조회 실패·item 없음 → toast `'콘텐츠 조회에 실패했습니다'` 후 이전 페이지

---

## 2. 현황 (2차 구현 기준)

| 항목 | 현재 |
|------|------|
| 라우트 | `/lesson/deploy/:setId`, `/lesson/deploy/:setId/:refSetId` (`routes.tsx`) |
| `DeployPage` params | `useParams<{ setId; refSetId }>()` — 수신·재조회 연동 완료 |
| `ResourceCard` 시작하기 | `refSetId` 있으면 `/lesson/deploy/${id}/${refSetId}`, 없으면 `/lesson/deploy/${id}` + `state.item` |
| item 소스 | 1) `location.state.item` 2) LMS/CMS 단건 조회. mock find 주석 보류 |
| URL만 진입 | `GET /api/ref-set/{refSetId}` 또는 `GET /api/sets/{setId}` + 로딩/실패 UX |
| 실시간 Viewer | `navigate(\`/lesson/viewer/${setId}\`)` 구현됨 |
| 자료실 목록 | CMS `GET /api/sets` → `mapCmsSetToLibItem` |
| 나의 자료 목록 | LMS `GET /api/ref-set` → `mapRefSetToLibItem` (추가계획10) |
| LMS 단건 | `getRefSet(refSetId)` + `useRefSetQuery` |
| CMS 단건 | `getCmsSet(setId)` + `useCmsSetDetailQuery` |

---

## 3. 라우트 · 파라미터

기존 `itemId`는 폐기하고 CMS 세트 ID와 맞춘다. 라우트 path는 이미 `setId`다.

```
/lesson/deploy/:setId
/lesson/deploy/:setId/:refSetId
```

| param | 출처 | 필수 | 설명 |
|-------|------|------|------|
| `setId` | `LibItem.id` (= CMS `setId` / LMS `lcmsSetId`) | ✅ | CMS 세트 ID |
| `refSetId` | `LibItem.refSetId` (나의 자료·보관함) | 자료실 없음 / 나의 자료 있음 | LMS 보관함 참조 ID |

```tsx
const { setId, refSetId } = useParams<{ setId: string; refSetId: string }>();
```

Viewer는 변경 없음: `/lesson/viewer/:setId`.

---

## 4. ResourceCard 「시작하기」 → DeployPage

**진입은 DeployPage.** `/lesson/viewer/...` 로 바로 가지 않는다. Viewer는 배포 완료 후 실시간 분기다.

```tsx
const deployPath = item.refSetId
  ? `/lesson/deploy/${item.id}/${item.refSetId}`
  : `/lesson/deploy/${item.id}`;

navigate(`${deployPath}${location.search}`, {
  state: { item }, // DeployPageLocationState
});
```

| 출처 | path | state |
|------|------|-------|
| 자료실 `/lesson/library` | `/lesson/deploy/${item.id}` | `{ item }` |
| 나의 자료 `/lesson/my` (`refSetId` 있음) | `/lesson/deploy/${item.id}/${item.refSetId}` | `{ item }` |
| 나의 자료 mock (현재 `refSetId` 없음) | `/lesson/deploy/${item.id}` | `{ item }` |

`location.search` 유지 (LNB 반 프리셋 `?class=`).

---

## 5. library vs my `LibItem` 형식 확인 (1-1)

둘 다 **같은 컴포넌트** `features/lesson/ui/ResourceCard.tsx`, **같은 타입** `LibItem`. 컴포넌트가 두 개가 아니다. `variant`만 `'library' | 'my'`로 UI(삭제·수정일)가 갈린다.

### 5.1 공통 타입

```ts
interface LibItem {
  id: string;          // 필수. CMS setId (= LMS lcmsSetId)
  refSetId?: string;   // 선택. LMS 보관함 ID
  title: string;       // 필수
  thumbnailUrl?: string;
  createdAt?: string;
  // src, selArea, colorGroup, views, ... 카드 표시용 선택 필드
}
```

DeployPage가 쓰는 최소 필드: `id`, `title`, `thumbnailUrl`, `refSetId?`. 나머지는 미리보기에 불필요.

### 5.2 매퍼 비교

| 필드 | 자료실 `mapCmsSetToLibItem` | 나의 자료 `mapRefSetToLibItem` | 동일? |
|------|----------------------------|-------------------------------|-------|
| `id` | CMS `setId` | LMS `lcmsSetId` (CMS 세트 ID) | **의미 동일** (CMS setId) |
| `refSetId` | 없음 (`undefined`) | LMS `refSetId` | **다름** — my만 존재 |
| `title` | CMS `title` | `options.title` (없으면 `''`) | 소스만 다름, 타입 동일 |
| `thumbnailUrl` | CMS `thumbnailUrl` | `options.thumbnailUrl` | 동일 (optional) |
| `createdAt` | 목록 매퍼 미매핑 | LMS `createdAt` | my만 채움. Deploy 미리보기 비사용 |
| `src` | `'verified'` (TO FIX) | `'internal'` | 값만 다름. Deploy 비사용 |
| `colorGroup` | `setId` 해시 | `refSetId` 해시 | 알고리즘 동일, 시드만 다름 |

### 5.3 결론 — 처리가 필요한가?

- **타입·카드 props는 동일** → `state: { item }` 그대로 전달해도 DeployPage 타입 이슈 없음.
- **반드시 처리할 차이**: `refSetId` 유무.  
  - 있으면 path에 넣고, URL 재진입 시 LMS 단건 조회.  
  - 없으면 `setId`만으로 CMS 단건 조회.
- `stateItem.id === setId` 가드는 양쪽 모두 `id`가 CMS setId라 그대로 유효.
- **현재 나의 자료는 mock**이라 `refSetId`가 없다. 목록을 `mapRefSetToLibItem`에 연결하면(추가계획6 잔여) 시작하기 path에 `refSetId`가 붙는다. 이번 범위에서 목록 연결은 하지 않는다. ResourceCard는 `item.refSetId`가 있을 때만 path에 넣으면 된다.

---

## 6. DeployPage item 해석 우선순위

```
1) location.state.item 있고, item.id === setId (또는 setId 없음)
     → API 호출 없이 사용 (시작하기 버튼 진입)
2) state 없음(또는 id 불일치)
     2-a) refSetId 있음 → LMS GET /api/ref-set/{refSetId} → mapRefSetToLibItem
     2-b) refSetId 없음 + setId 있음 → CMS GET /api/sets/{setId} → LibItem 매핑
3) 조회 실패 / 매핑 결과 없음
     → toast + 이전 페이지. 화면을 빈 배포 UI로 그리지 않음
```

- mock `MOCK_LIBRARY_ITEMS.find` 는 계속 주석 보류. API가 대체한다.
- 1차의 `item?.title ?? setId` fallback은 **폐기**. 로딩이 끝나면 item이 있거나, 실패 시 이탈한다.
- state가 있어도 `id !== setId`이면 state를 버리고 2)로 간다 (URL 조작 방지).

React Query `enabled`:

```ts
const hasStateItem = Boolean(stateItem && (!setId || stateItem.id === setId));

useRefSetQuery(refSetId, { enabled: !hasStateItem && Boolean(refSetId) });
useCmsSetDetailQuery(setId, { enabled: !hasStateItem && Boolean(setId) && !refSetId });
```

두 훅이 동시에 돌지 않게 한다.

---

## 7. URL 직접 진입 — API 스펙

시작하기를 거치지 않고 주소창·새로고침·북마크로 `/lesson/deploy/...` 에 들어온 경우. `location.state`는 없다.

### 7.1 LMS `GET /api/ref-set/{refSetId}` — refSetId 있을 때

> 참조: `superplatform-lms/docs/03-API연동규격서/07-세트문항참조-LCMS연동/보관함-단건 (GET ref-set-{id}).md`

| 항목 | 값 |
|------|----|
| 서비스 | superplatform-lms |
| Method / URL | `GET {ENV.SP_LMS_API_URL}/api/ref-set/{refSetId}` |
| 인증 | Required (교사, 소유자만) — `getAuth().authorizedFetch` |
| 응답 | LMS envelope (`CustomBody`) |

**성공 `resultData` (기존 `RefSetItem`과 동일):**

```json
{
  "refSetId": "a2b3...",
  "lcmsSetId": "L-SET-123",
  "makeMethod": 3,
  "status": 1,
  "options": { "title": "...", "thumbnailUrl": "..." },
  "createdAt": "2026-07-21T09:00:00"
}
```

- 매핑: 기존 `mapRefSetToLibItem` 재사용 (`id←lcmsSetId`, `refSetId`, `title/thumbnailUrl←options`).
- CMS title/thumbnail은 LMS 컬럼이 아니다. `options`에 없으면 title이 `''`가 될 수 있다. 이번 Phase는 options 기준으로 미리보기하고, CMS 추가 로드는 하지 않는다.
- 없거나 내 것 아니면 404 → 실패 UX.
- LMS 실패 시 CMS `GET /api/sets/{setId}`로 **폴백하지 않는다**.

신규: `lmsRefSetService.getRefSet(refSetId)` — 기존 `lmsFetch` 재사용.

```ts
export async function getRefSet(refSetId: string): Promise<RefSetItem> {
  return lmsFetch<RefSetItem>(`${BASE}/${refSetId}`);
}
```

### 7.2 CMS `GET /api/sets/{setId}` — setId만 있을 때

| 항목 | 값 |
|------|----|
| 서비스 | CMS (`ENV.CMS_API_URL`) |
| Method / URL | `GET {ENV.CMS_API_URL}/api/sets/{setId}` |
| 인증 | SSO Bearer JWT (`getAuth().authorizedFetch`) |
| 응답 | LMS envelope **아님**. 본문이 곧 DTO (목록 API와 동일) |

**Path param**

| param | 타입 | 필수 | 설명 |
|-------|------|------|------|
| `setId` | string | ✅ | 세트 ID |

**성공 200**

```json
{
  "setId": "set-001",
  "title": "일차함수 세트",
  "description": "string",
  "thumbnailUrl": "string",
  "slides": [
    {
      "slideId": "slide-001",
      "title": "일차함수의 그래프",
      "order": 1,
      "article": {
        "articleId": "1",
        "title": "일차함수의 그래프",
        "contents": "string",
        "json": "string",
        "type": "123456"
      }
    }
  ],
  "metas": [
    {
      "id": 1101,
      "code": "MATH_M1_2022",
      "name": "curriBook",
      "val": "중학교 1학년 수학"
    }
  ],
  "createdAt": "2026-08-14T08:49:10.908Z",
  "updatedAt": "2026-08-14T08:49:10.908Z"
}
```

DeployPage `LibItem`에 쓰는 필드만 매핑한다. `slides` / `metas` / `description`은 이번 범위에서 미사용 (Viewer slideId 매핑은 후속).

| CMS 필드 | LibItem |
|----------|---------|
| `setId` | `id` |
| `title` | `title` |
| `thumbnailUrl` | `thumbnailUrl` |
| `createdAt` | `createdAt` |

목록 매퍼 `mapCmsSetToLibItem`과 최소 필드가 같다. 상세 DTO(`CmsSetDetail`)를 받도록 시그니처를 맞추거나, `{ setId, title, thumbnailUrl, createdAt? }` Pick으로 재사용한다. `colorGroup`은 기존과 같이 `setId` 해시(TO FIX).

**실패 400 (setId 누락) / 500 (세트 조회 실패)** — 둘 다 실패 UX.

```json
{
  "timestamp": "2026-08-14T08:49:10.911Z",
  "status": 400,
  "code": "INVALID_REQUEST",
  "message": "필수값 누락",
  "path": "/api/slides",
  "requestId": "7f4fd5f1d9d84e9a",
  "violations": [
    { "field": "userId", "message": "필수값입니다." }
  ]
}
```

신규: `cmsSetService.getCmsSet(setId, signal?)`. `!res.ok`면 `body.message` 또는 기본 메시지로 throw. 목록 API와 같은 에러 파싱 패턴.

### 7.3 queryKey

```ts
// queryKeys.ts
refSet: (refSetId: string) => [...lessonKeys.refSets(), refSetId] as const,
cmsSet: (setId: string) => [...lessonKeys.cmsSets(), setId] as const,
```

훅: `useRefSetQuery(refSetId)`, `useCmsSetDetailQuery(setId)`. `queryFn`에 `AbortSignal` 전달.

---

## 8. 로딩 · 실패 UX

### 8.1 로딩 (state 없이 API 조회 중)

- 의미: 무한 스크롤이 아니라 **단건 조회 중 페이지 로딩**.
- 조건: `!hasStateItem && (refSetQuery.isPending || cmsSetQuery.isPending)`
- UI: 기존 `@shared/ui/Loading`의 `PageLoading` (또는 `Loading` size=`md`) 재사용. 새 스피너 컴포넌트 만들지 않음.
- 조회가 끝날 때까지 배포 폼·미리보기를 그리지 않음. 헤더 뒤로가기는 로딩 중에도 둘 수 있다.

### 8.2 실패

조건 (하나라도):

- `setId` 없음 (비정상 진입)
- 해당 훅 `isError`
- 응답은 왔지만 매핑 결과가 없음 (`title` 등 최소 필드 불가 포함 — 구현 시 `!mapped`로 통일)
- `refSetId`도 `setId`도 없음

동작:

1. `toast.error('콘텐츠 조회에 실패했습니다')` — 기존 DeployPage `sonner` `toast` 사용
2. 이전 페이지로 이동: `navigate(-1)`
3. history가 없으면(새 탭 직접 진입) `navigate('/lesson/library', { replace: true })` 폴백
4. toast·navigate는 **1회만** (`useEffect` + 가드). 렌더 중 호출 금지
5. 1차 주석의 mock empty (`해당 콘텐츠를 찾을 수 없습니다`) UI는 쓰지 않음. 실패 시 페이지에 머물지 않음

---

## 9. 변경 파일 (2차 구현 완료)

| 파일 | 유형 | 핵심 변경 |
|------|------|-----------|
| `features/lesson/ui/ResourceCard.tsx` | 수정 | `item.refSetId` 있으면 `/lesson/deploy/:setId/:refSetId` |
| `features/lesson/ui/DeployPage.tsx` | 수정 | `refSetId` params, state 없을 때 단건 조회, 로딩/실패 UX. title fallback 폐기 |
| `features/lesson/api/lmsRefSetService.ts` | 수정 | `getRefSet(refSetId)` |
| `features/lesson/api/cmsSetService.ts` | 수정 | `CmsSetDetail` + `getCmsSet(setId)` |
| `features/lesson/api/queryKeys.ts` | 수정 | `refSet(id)`, `cmsSet(id)` |
| `features/lesson/api/queries.ts` | 수정 | `useRefSetQuery`, `useCmsSetDetailQuery` |
| `features/lesson/model/mapCmsSetToLibItem.ts` | 수정 | 상세 DTO 최소 필드 매핑 재사용 |
| `features/lesson/index.ts` | 수정 | 훅·타입 export |
| `app/router/routes.tsx` | 변경 없음 | path 이미 `setId`/`refSetId` |

`LessonMyPage` 목록 API 연결·`mapRefSetToLibItem` 목록 적용은 추가계획10에서 완료.

---

## 10. 하지 말 것

| 금지 | 이유 |
|------|------|
| 「시작하기」에서 `/lesson/viewer/:setId` 로 이동 | Viewer는 실시간 배포 완료 후 |
| LMS 실패 시 CMS 단건 폴백 | 소유/스코프가 다른 리소스 |
| state 있을 때 불필요한 단건 API | 카드에서 이미 LibItem 전달 |
| mock find 주석 해제 | API가 대체 |
| 실패 후 빈 DeployPage 잔류 | toast + 이탈이 요구사항 |
| 새 로딩 컴포넌트 추가 | `PageLoading` / `Loading` 재사용 |
| `slides`/`metas`로 Viewer 매핑 | 후속 |

---

## 11. 완료 기준

### 1차 (유지)

- [x] `deployed.isLive` → `/lesson/viewer/${setId}`
- [x] `ResourceCard` `state: { item }` 전달
- [x] `DeployPage` `location.state.item` 수신·미리보기 반영
- [x] mock find / early return 주석 보류
- [x] 라우트 param 명칭 `setId` (구 itemId)
- [x] `npx tsc -b --noEmit` 통과

### 2차 (구현 완료)

- [x] 「시작하기」는 DeployPage만. `refSetId` 있으면 path에 포함
- [x] library/my 모두 `LibItem` + 동일 `ResourceCard`. `refSetId`만 path 분기로 처리
- [x] URL 직접 진입 + `refSetId` → `GET /api/ref-set/{refSetId}` → `mapRefSetToLibItem`
- [x] URL 직접 진입 + `setId`만 → `GET /api/sets/{setId}` → LibItem 매핑
- [x] 조회 중 `PageLoading`(또는 동등 Loading)
- [x] 실패 시 toast `'콘텐츠 조회에 실패했습니다'` + `navigate(-1)` (history 없으면 `/lesson/library`)
- [x] state 진입 시 단건 API 미호출
- [x] `npx tsc -b --noEmit`, eslint 통과 (`no-unused-vars` 제외)

---

## 12. 후속 (이번 비범위)

- [ ] Viewer `slideId` ↔ CBS/setId 매핑 (`GET /api/sets/{setId}`의 `slides` 활용 가능)
- [x] `LessonMyPage` `refSetData.list` → `mapRefSetToLibItem` → `ResourceCardList` 연결 — 추가계획10에서 완료
- [ ] LMS `options.title` 공백일 때 CMS 단건으로 title 보강할지 여부
- [x] mock early return UI 복구 여부 — 2차에서 실패 이탈로 대체, 복구하지 않음

---

**2차 구현 완료일**: 2026-08-17  
**상태**: 1차·2차 구현 완료

---

# 추가계획10 — 나의 자료 실제 API 연동 + 삭제 기능

> **상태**: 구현 완료  
> **동일 범위**: 추가계획3 Phase B(API 대기) · 추가계획6 잔여(`ResourceCardList` 연결)와 동일. 본 계획에서 일괄 완료.  
> **범위**:  
> 1) `LessonMyPage` mock → LMS `GET /api/ref-set` 실제 목록 연동 (`mapRefSetToLibItem` 적용)  
> 2) `ResourceCard` 삭제 버튼 → LMS `DELETE /api/ref-set/{refSetId}` 호출 + 목록 갱신  
> 3) 로딩 UI (lazy loading), 빈 상태, API 실패 분리 표시

---

## 1. 현황 및 목표

### 현황

|| 항목 | 현재 상태 |
||------|-----------|
|| `LessonMyPage` 목록 | `useRefSetListQuery` + `mapRefSetToLibItem` 연동 완료. MOCK 경로 주석 보존 |
|| `ResourceCard` 삭제 | `variant="my"` 삭제 → `useDeleteRefSetMutation` → `DELETE /api/ref-set/{refSetId}` |
|| LMS ref-set API | `GET /api/ref-set` — 구현 완료 (추가계획6)<br>`DELETE /api/ref-set/{refSetId}` — 구현 완료 (추가계획10) |
|| `mapRefSetToLibItem` | `LessonMyPage` 목록 연동 완료 |
|| 빈 상태 / 에러 | 나의 자료·전체 자료실 모두 loading / 0건 / API 실패 분리 표시 |

### 목표

1. **나의 자료 목록 실제 연동**  
   - `MOCK_LIBRARY_ITEMS` → `useRefSetListQuery` + `mapRefSetToLibItem`  
   - MOCK 코드는 주석 처리로 보존 (언제든 복구 가능)
   - API 조회 중 loading UI (레이지 로딩)
   - 목록 0건: "아직 만든 자료가 없습니다" (기존 빈 상태 메시지 유지)

2. **ResourceCard 삭제 → LMS DELETE API**  
   - `variant="my"` 카드의 삭제 버튼 클릭 시 `DELETE /api/ref-set/{refSetId}` 호출
   - 성공 시 React Query 캐시 무효화(`lessonKeys.refSets()`) → 목록 자동 갱신
   - 기존 toast 메시지 유지

3. **전체 자료실 UX 개선** (보너스)  
   - 목록 0건(`items.length === 0` + `!isError`): "자료가 없습니다"
   - API 실패(`isError`): "자료 목록을 불러오지 못했습니다" (기존 유지)
   - 두 상태를 명확히 구분

---

## 2. LMS DELETE API 스펙

> 참조: `superplatform-lms/docs/03-API연동규격서/07-세트문항참조-LCMS연동/보관함-삭제 (DELETE ref-set-{id}).md`

|| 항목 | 값 |
||------|----|
|| 서비스 | superplatform-lms |
|| Method / URL | `DELETE {ENV.SP_LMS_API_URL}/api/ref-set/{refSetId}` |
|| 인증 | Required (교사, 소유자만) — `getAuth().authorizedFetch` |
|| 응답 | LMS envelope (`CustomBody`) |

### Path params

|| param | 타입 | 필수 | 설명 |
||-------|------|------|------|
|| `refSetId` | string | ✅ | 삭제할 보관함 참조 ID |

### 성공 200

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "삭제 성공",
  "resultData": null
}
```

### 실패 400 / 404 / 500

```json
{
  "success": false,
  "resultCode": 404,
  "resultMessage": "보관함 항목을 찾을 수 없습니다"
}
```

- 404: `refSetId` 없거나 소유자 아님
- 400: `refSetId` 형식 오류
- 500: 서버 에러

---

## 3. 구현 흐름

### 3.1 나의 자료 목록 연동

```
LessonMyPage (마운트)
  └─ useRefSetListQuery()
      └─ GET {ENV.SP_LMS_API_URL}/api/ref-set
          └─ resultData.list → mapRefSetToLibItem[] → setState(items)
              ├─ isPending → loading UI
              ├─ isError → "자료 목록을 불러오지 못했습니다"
              └─ items.length === 0 → "아직 만든 자료가 없습니다"
```

기존 `useState<LibItem[]>` 제거, `useRefSetListQuery`로 대체.  
MOCK 경로는 주석으로 보존:

```tsx
// --- MOCK 경로 (필요 시 아래 주석 해제 + 위 API 훅 비활성) ---
// const [items, setItems] = useState<LibItem[]>(MOCK_LIBRARY_ITEMS);
// -----------------------------------------------------------
```

### 3.2 ResourceCard 삭제

```
ResourceCard (variant="my") 삭제 버튼 클릭
  └─ onDelete(item.refSetId)  (페이지→카드로 props 전달)
      └─ useDeleteRefSetMutation().mutate(refSetId)
          └─ DELETE {ENV.SP_LMS_API_URL}/api/ref-set/{refSetId}
              ├─ onSuccess
              │   ├─ toast.message('삭제되었습니다')  (기존 스타일 유지)
              │   └─ queryClient.invalidateQueries(lessonKeys.refSets())
              │       → 목록 자동 refetch
              └─ onError
                  └─ toast.error('삭제에 실패했습니다')
```

`ResourceCard`에 `onDelete?: (refSetId: string) => void` props 추가 (variant="my"일 때만 전달).  
`LessonMyPage`에서 mutation 훅 호출 + `onDelete` 핸들러 전달.

---

## 4. 신규·수정 파일

### 4.1 `features/lesson/api/lmsRefSetService.ts` (수정)

```ts
export async function deleteRefSet(refSetId: string): Promise<void> {
  await lmsFetch<null>(`${BASE}/${refSetId}`, {
    method: 'DELETE',
  });
}
```

### 4.2 `features/lesson/api/queries.ts` (수정)

```ts
export function useDeleteRefSetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (refSetId: string) => deleteRefSet(refSetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonKeys.refSets() });
    },
  });
}
```

### 4.3 `pages/lesson/LessonMyPage.tsx` (수정)

```tsx
import { useRefSetListQuery, useDeleteRefSetMutation, mapRefSetToLibItem } from '@features/lesson';

export const LessonMyPage = () => {
  const { data, isPending, isError, error } = useRefSetListQuery();
  const { mutate: deleteRefSet } = useDeleteRefSetMutation();

  const items = useMemo(
    () => (data?.list ?? []).map(mapRefSetToLibItem),
    [data],
  );

  // --- MOCK 경로 (필요 시 아래 주석 해제 + 위 API 훅 비활성) ---
  // const [items, setItems] = useState<LibItem[]>(MOCK_LIBRARY_ITEMS);
  // -----------------------------------------------------------

  const handleDelete = (refSetId: string) => {
    if (!refSetId) return;
    deleteRefSet(refSetId, {
      onSuccess: () => {
        toast.message('삭제되었습니다', {
          position: 'bottom-center',
          unstyled: true,
          style: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9999px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
          },
        });
      },
      onError: () => {
        toast.error('삭제에 실패했습니다');
      },
    });
  };

  // Loading
  if (isPending) {
    return <div>로딩 중...</div>; // 또는 <PageLoading /> / Skeleton
  }

  // Error
  if (isError) {
    return (
      <ErrorContainer>
        <ErrorText role='alert'>
          {error instanceof Error ? error.message : '자료 목록을 불러오지 못했습니다.'}
        </ErrorText>
      </ErrorContainer>
    );
  }

  // Empty (목록 0건)
  if (items.length === 0) {
    return (
      <EmptyContainer>
        <EmptyText>아직 만든 자료가 없습니다</EmptyText>
      </EmptyContainer>
    );
  }

  return (
    <>
      <ResourceCardList items={items} variant="my" onDelete={handleDelete} />
      {/* ... 기존 Toolbar, Embed 등 */}
    </>
  );
};
```

### 4.4 `features/lesson/ui/ResourceCard.tsx` (수정)

```tsx
interface ResourceCardProps {
  item: LibItem;
  variant?: 'library' | 'my';
  onDelete?: (refSetId: string) => void;  // 신규
}

export const ResourceCard = ({ item, variant = 'library', onDelete }: ResourceCardProps) => {
  // ...기존 코드

  // variant="my" 삭제 버튼
  {variant === 'my' && item.refSetId && onDelete && (
    <DeleteButton
      onClick={(e) => {
        e.stopPropagation();
        onDelete(item.refSetId!);
      }}
      aria-label="삭제"
    >
      <X size={16} />
    </DeleteButton>
  )}
};
```

`onDelete`는 `variant="my"`이고 `refSetId`가 있을 때만 렌더. 삭제 버튼 위치·스타일은 프로토타입 `MyLessonCard` 참조 (우상단 X 버튼 등).

### 4.5 `features/lesson/ui/ResourceCardList.tsx` (수정)

```tsx
interface ResourceCardListProps {
  items: LibItem[];
  variant?: 'library' | 'my';
  emptyMessage?: string;
  isLoading?: boolean;
  onDelete?: (refSetId: string) => void;  // 신규
}

export const ResourceCardList = ({
  items,
  variant = 'library',
  emptyMessage,
  isLoading,
  onDelete,
}: ResourceCardListProps) => {
  // ...

  return (
    <Grid>
      {items.map((item) => (
        <ResourceCard
          key={item.id}
          item={item}
          variant={variant}
          onDelete={onDelete}  // 전달
        />
      ))}
    </Grid>
  );
};
```

### 4.6 `widgets/lesson/LessonLibraryContents.tsx` (수정)

전체 자료실도 빈 상태와 에러를 분리한다.

```tsx
export const LessonLibraryContents = ({ filters, sort }: LessonLibraryContentsProps) => {
  const { data, isPending, isFetching, isError, error } = useCmsSetListQuery(filters, sort);
  const items = useMemo(
    () => (data?.list ?? []).map(mapCmsSetToLibItem),
    [data],
  );

  // Error
  if (isError && items.length === 0) {
    return (
      <Contents>
        <ErrorText role='alert'>
          {error instanceof Error ? error.message : '자료 목록을 불러오지 못했습니다.'}
        </ErrorText>
      </Contents>
    );
  }

  return (
    <Contents>
      <ResourceCardList
        items={items}
        isLoading={isPending || isFetching}
        emptyMessage="자료가 없습니다"  // 0건일 때 표시
      />
    </Contents>
  );
};
```

`ResourceCardList`에서 `items.length === 0 && !isLoading` 일 때 `emptyMessage` 표시.

### 4.7 `features/lesson/index.ts` (수정)

```ts
export { useDeleteRefSetMutation } from './api/queries';
export { mapRefSetToLibItem } from './model/mapRefSetToLibItem';
```

---

## 5. 변경 파일 목록

|| 파일 | 유형 | 핵심 변경 |
||------|------|-----------|
|| `features/lesson/api/lmsRefSetService.ts` | 수정 | `deleteRefSet(refSetId)` |
|| `features/lesson/api/queries.ts` | 수정 | `useDeleteRefSetMutation` + invalidate |
|| `pages/lesson/LessonMyPage.tsx` | 수정 | `useRefSetListQuery` + `mapRefSetToLibItem` 적용, MOCK 주석, loading/error/empty, `handleDelete` → mutation |
|| `features/lesson/ui/ResourceCard.tsx` | 수정 | `onDelete` props, variant="my" 삭제 버튼 |
|| `features/lesson/ui/ResourceCardList.tsx` | 수정 | `onDelete` props 전달, `emptyMessage` 표시 |
|| `widgets/lesson/LessonLibraryContents.tsx` | 수정 | `emptyMessage="자료가 없습니다"` 전달 (0건 vs 에러 분리) |
|| `features/lesson/index.ts` | 수정 | `useDeleteRefSetMutation`, `mapRefSetToLibItem` export |

---

## 6. 하지 말 것

|| 금지 | 이유 |
||------|------|
|| MOCK 코드 완전 삭제 | 주석 처리만 (언제든 복구 가능) |
|| 삭제 전 확인 모달 | 이번 범위 외 (필요 시 후속) |
|| `variant="library"` 카드에 삭제 버튼 | 자료실은 삭제 불가 (나의 자료만) |
|| Page에 삭제 버튼 styled | `ResourceCard`에 이미 구현 (X 아이콘) |
|| 낙관적 업데이트 | invalidate로 충분. 복잡도↑ |

---

## 7. 완료 기준

- [x] `LessonMyPage` 진입 시 `GET /api/ref-set` 호출 → `mapRefSetToLibItem` 적용
- [x] MOCK 경로 주석 처리 (복구 가능)
- [x] API 조회 중 loading UI (레이지 로딩)
- [x] 목록 0건: "아직 만든 자료가 없습니다" 표시
- [x] API 실패: "자료 목록을 불러오지 못했습니다" 표시 (0건과 구분)
- [x] `ResourceCard` (variant="my") 삭제 버튼 클릭 → `DELETE /api/ref-set/{refSetId}`
- [x] 삭제 성공 → toast "삭제되었습니다" (기존 스타일) + 목록 자동 갱신
- [x] 삭제 실패 → toast "삭제에 실패했습니다"
- [x] 전체 자료실도 "자료가 없습니다" (0건) vs "자료 목록을 불러오지 못했습니다" (에러) 분리
- [x] `npx tsc -b --noEmit`, eslint 통과 (`no-unused-vars` 제외)

---

## 8. 참고 파일

|| 용도 | 경로 |
||------|------|
|| 프로토타입 삭제 UI | `prototype/.../my-lessons/MyLessonCard.tsx` |
|| LMS DELETE 규격서 | `superplatform-lms/docs/.../보관함-삭제 (DELETE ref-set-{id}).md` |
|| 나의 자료 페이지 | `frontend/src/pages/lesson/LessonMyPage.tsx` |
|| 카드 컴포넌트 | `frontend/src/features/lesson/ui/ResourceCard.tsx` |
|| 목록 컴포넌트 | `frontend/src/features/lesson/ui/ResourceCardList.tsx` |
|| 전체 자료실 위젯 | `frontend/src/widgets/lesson/LessonLibraryContents.tsx` |
|| 매퍼 | `frontend/src/features/lesson/model/mapRefSetToLibItem.ts` |
|| LMS 서비스 | `frontend/src/features/lesson/api/lmsRefSetService.ts` |

---

**작성일**: 2026-08-14  
**구현 완료일**: 2026-08-17  
**수정**: 2026-08-18 — 추가계획3 Phase B · 추가계획6 잔여(`ResourceCardList` 연결)와 동일 범위 확인  
**상태**: 구현 완료

---

# 추가계획11 — DeployPage·저작툴 활동 시작 → 참여키(`accessKey`)·QR·링크

> **상태**: Phase A·B 구현 완료 (2026-08-21) · `assigneeSubs` = `spUserId` 연동 완료  
> **선행**: 추가계획9 (DeployPage item·교사 Viewer 이동)  
> **후행**: 추가계획12 (학생 `/student/lesson/:accessKey`)  
> **범위**: 교사가 배포/시작 시 활동을 만들고, 학생에게 줄 **참여 링크·QR**을 FE에서 조립한다. 학생 화면·SDK는 추가계획12.

---

## 1. 한 줄 요약

교사 DeployPage에서 배포(시작하기) → `publish` 응답의 `accessKey`(`act-…`)로 `buildLessonJoinUrl(accessKey)` QR·복사 URL을 만든다.

```
{origin}/student/lesson/{accessKey}
```

학생 라우트 param 이름은 **`:accessKey`**. LMS 내부 UUID(`POST /activities` 응답 `activityId`)와 혼동하지 않는다.

---

## 2. 역할 분리 (11 vs 12)

| 담당 | 하는 일 | 안 하는 일 |
|------|---------|------------|
| **추가계획11 (교사 FE)** | `publish` 후 `buildLessonJoinUrl(accessKey)` QR·복사 | 학생 iframe, 참여 가능 여부 판정 |
| **추가계획12 (학생 FE)** | `/student/lesson/:accessKey` 진입, `entry` + `POST /participations` → embed | `POST /activities`, QR 생성, `GET /activities` |
| **LMS** | `publish` 시 `accessKey` 발급 | 완성된 URL 문자열 |
| **everyCanvas SDK** | 학생 화면 렌더 (`activity-join`) | 참여 링크 발급 |

링크에 SDK가 들어 있지 않다. 링크는 **추가계획12 페이지 주소**이고, 그 페이지가 embed를 마운트한다.

---

## 3. 식별자 가정

| 값 | 의미 | 비고 |
|----|------|------|
| `activityId` | `POST /api/v1/activities` 응답 UUID | LMS **내부** 식별자. assignees/publish path에 사용. **학생 URL에 넣지 않음** |
| `accessKey` | `publish` 응답 (`act-…`) | **학생 참여 키**. URL param·`buildLessonJoinUrl` 첫 인자 |
| `setId` / `lcmsSetId` | 콘텐츠(CBS 세트) | embed `slideId`. **학생 URL에 넣지 않음** (학생은 `POST /participations` → `content.lcmsSetId`) |
| `libraryItemId` | `POST /api/v1/library-items` 응답 | 보관함 ID. 활동 출제 시 `source.libraryItemId`로 전달 |
| 참여 링크 | `buildLessonJoinUrl(accessKey)` | `/student/lesson/:accessKey` 만 |

배포 결과 카드의 목업 `https://class.visang.co.kr/viewer/6ab0…` 는 제거한다.

---

## 4. 현황

| 항목 | 현재 |
|------|------|
| DeployPage `doDeploy` | `POST /activities` → assignees(`spUserId`) → `publish`. 실패 toast·재시도 |
| 결과 링크 | `buildLessonJoinUrl(result.accessKey)` → `/student/lesson/:accessKey` |
| QR | `QRCodeCanvas` (`qrcode.react`) — `joinUrl` 인코딩 |
| 실시간 「수업 시작하기」 | `navigate(\`/lesson/viewer/${setId}\`)` — **교사 Viewer**. 유지 |
| `LessonEditorPage.handleStartLesson` | `/lesson/deploy/${lcmsSetId}` 이동 (POST 없음) |

---

## 5. 이번 / 다음

### Phase A — API 없이 구현 (이번)

1. `buildLessonJoinUrl(accessKey)` — `features/lesson/lib/buildLessonJoinUrl.ts`
2. DeployPage 결과 카드: `activityId`가 있으면 실 URL + QR(`qrcode.react` `QRCodeCanvas`) + 복사
3. `createActivity` 서비스 **스켈레톤만** (함수·타입·주석). **실제 fetch 금지** — 경로/본문 미확정
4. 저작툴 `onStartLesson` → DeployPage 이동 (`/lesson/deploy/${lcmsSetId}`). 활동 생성은 DeployPage에서만
5. Phase A 개발 확인: `activityId` 자리에 **임시로 `setId`** 를 넣을 수 있다. 주석 `임시 — POST /activities 응답 activityId로 교체`. 프로덕션 분기처럼 숨기지 말 것

### Phase B — 스펙 수신 후 (이번 금지)

1. 요청 본문을 스펙 대로 구성한 뒤 `POST /api/v1/activities` 실호출 (draft 생성) → 응답 `activityId` 확보
2. (조건) `audienceType: 'ASSIGNED'`이면 `PUT /api/v1/activities/{id}/assignees` 로 배정 명단 준비
3. `POST /api/v1/activities/{id}/publish` 실호출 → 응답 `accessKey` 수신, 결과 카드·QR 갱신
4. 활동 종료는 `POST /api/v1/activities/{id}/close` (+ 필요 시 `reopen`)로 처리

---

## 6. 교사 흐름

```
자료실/나의 자료 「시작하기」  ──┐
저작툴 onStartLesson          ──┴─▶ /lesson/deploy/:setId[/:refSetId]
                                      │
                                      ▼
                               「배포하기」
                                      │
                    Phase B: POST /activities ──▶ activityId(draft) → publish ──▶ accessKey
                    Phase A: 임시 activityId = setId (개발용)
                                      │
                                      ▼
                    참여 URL = {origin}/student/lesson/{accessKey}
                    QR = 그 URL 인코딩
                                      │
                    실시간 모드 「수업 시작하기」
                      → 교사 /lesson/viewer/:setId   (추가계획9 유지)
                    기간 모드 「수업 결과보기로 이동」
                      → /lesson/result               (유지)
```

학생이 여는 주소와 교사가 여는 Viewer는 **입구가 다르다.**

---

## 7. LMS API 매핑 (새 API 스펙 기반)

> 출처: `superplatform-lms/docs/guide/api-spec.md`, `docs/aihelper/ai-연동-작업지침.md`

### 교사 배포 흐름에 사용할 API

| 순서 | 엔드포인트 | 역할 | 비고 |
|------|-----------|------|------|
| 1 | `POST /api/v1/activities` | **출제 (초안 생성)** — DRAFT 상태로 활동 생성 | `source.libraryItemId` 필수. items(문항) 스냅샷 포함 |
| 2 | `PUT /api/v1/activities/{id}/assignees` | 배정 명단 전체 교체 (선택) | `audienceType: 'ASSIGNED'`일 때만 |
| 3 | `POST /api/v1/activities/{id}/publish` | **발행** — `accessKey` 발급. PUBLISHED 상태 | **이 응답의 `accessKey`가 학생 참여 키** |
| — | `POST /api/v1/activities/{id}/close` | 마감 (Phase B) | 수업 종료 시 |
| — | `POST /api/v1/activities/{id}/reopen` | 마감 해제 (Phase B) | 교사가 다시 열 때 |

### `POST /api/v1/activities` 요청 본문 (스펙 확인됨)

```ts
// features/lesson/api/lmsActivityService.ts — Phase B 구현 시 사용
export type CreateActivityBody = {
  source:
    | { type: 'LIBRARY_ITEM'; libraryItemId: string } // 보관함(library-items)에 등록된 ID
    | { type: 'LCMS_SET'; lcmsSetId: string }; // (대체 케이스) CMS 세트 id
  items: Array<{
    lcmsArticleId: string;      // CMS 문항 ID (문자열)
    seq?: number;              // 1 이상. 전부 보내거나 전부 생략
    maxScore?: number;        // gradingPolicy != NONE 일 때만 필요
  }>;
  title: string; // 200자 제한
  audienceType: 'ASSIGNED' | 'OPEN';
  allowedIdentityTypes: Array<'MEMBER' | 'GUEST_TOKEN' | 'PARTICIPATION_HANDLE'>;
  openAt?: string;              // ISO 8601. 없으면 발행 시 즉시 OPEN
  closeAt?: string;             // ISO 8601. openAt ≤ closeAt
  maxAttempts?: number;         // 1 이상. 기본 1
  resultVisibility?: 'IMMEDIATE' | 'AFTER_CLOSE' | 'HIDDEN';
  gradingPolicy?: 'NONE' | 'CLIENT_ALLOWED' | 'TRUSTED_ONLY';
  labels?: string[];
  options?: Record<string, unknown>; // (선택) 서버는 해석하지 않음(64KB 이하)
};
```

### `POST /api/v1/activities/{id}/publish` 응답

```ts
export type PublishActivityResult = {
  accessKey: string;  // 학생 참여 키. 이걸로 join URL 조립
  // availability: 'OPEN' | 'NOT_STARTED' 등
};
```

> **핵심**: 학생 URL·QR에 넣는 값은 **`publish` 응답 `accessKey`** 이다. route param·`buildLessonJoinUrl` 인자 이름도 **`accessKey`**. LMS 내부 UUID `activityId`와 혼동하지 않는다.

### Phase A (현재) — 스켈레톤

```ts
export async function createActivity(_body: CreateActivityBody): Promise<{ activityId: string }> {
  throw new Error('POST /activities 스펙 대기 — 호출하지 말 것');
}
```

- `lmsFetch` 패턴은 `lmsRefSetService`와 같게 둔다 (base `ENV.SP_LMS_API_URL`).
- 현재 `lmsRefSetService`는 **옛 API**(`/api/ref-set`, 봉투 `resultData`)를 쓰고 있다. 추가계획14에서 새 API로 마이그레이션한다.
- TanStack Query mutation은 **Phase B**에서 `useCreateActivityMutation`으로 추가. Phase A에서 훅을 만들어 죽은 경로를 호출하지 말 것.
- DeployPage `doDeploy`는 Phase A에서 기존처럼 로컬 `setDeployed`를 유지하되, 결과 카드에 넣을 `activityId`를 상태로 둔다 (임시 = `setId`).

### Phase B 구현 순서

1. `POST /api/v1/activities` 실호출 (items·source 포함) → 응답 `activityId` 확보
2. (조건) `audienceType: 'ASSIGNED'`이면 `PUT /api/v1/activities/{activityId}/assignees` 로 배정 명단 준비
3. `POST /api/v1/activities/{activityId}/publish` → `accessKey` 수신
4. `buildLessonJoinUrl(accessKey)` — publish 응답 `accessKey`
5. 결과 카드·QR에 위 URL 표시
6. 활동 종료: `POST /api/v1/activities/{activityId}/close` (멱등: 이미 마감이어도 200)
7. (교사가 다시 열 때) `POST /api/v1/activities/{activityId}/reopen` — `closeAt` 바디 필요

> **경로 주의**: assignees/publish path param은 **`activityId`(출제 응답 id)** 이다.  
> `libraryItemId`가 아니다. (`/api/v1/activities/{activityId}/assignees`, `/api/v1/activities/{activityId}/publish`)

추가 구현 주의
  - `publish`는 멱등이며, 재발행해도 `accessKey`는 바뀌지 않습니다(200).
  - `gradingPolicy != NONE`이면 `maxScore` 등 필수 검증이 들어가므로, 화면에서 배점 계산 로직과 정책 값 매핑이 필요합니다.
  - 응답 헤더의 `ETag`는 `publish/close/reopen` 에서 `If-Match` 로 재사용하는 것을 권장합니다(서버 동시성/정책 검증 강화 대응).

### Phase B — 순차 호출 중도 실패 처리

`doDeploy`는 아래 3단계를 **순서대로** 호출한다. **한 단계라도 실패하면 이후 단계는 호출하지 않는다.**

| 단계 | API | 실패 toast (확정) |
|------|-----|-------------------|
| 1 출제 | `POST /api/v1/activities` | `출제 실패했습니다. [{status}]` 예: `출제 실패했습니다. [400]` |
| 2 배정 | `PUT /api/v1/activities/{activityId}/assignees` | `학생 배정에 실패했습니다. [{status}]` 예: `학생 배정에 실패했습니다. [400]` |
| 3 발행 | `POST /api/v1/activities/{activityId}/publish` | `문제 발행에 실패했습니다. [{status}]` 예: `문제 발행에 실패했습니다. [400]` |

규칙

1. toast는 `toast.error(...)`. `status`는 HTTP status code 숫자.
2. **성공 완료 전**에는 배포 결과 카드(QR·참여 링크)를 넣지 않는다. (`deployed`/`accessKey` 미설정)
3. 1단계(출제)에서 받은 `activityId`가 있어도 2·3이 실패하면 **성공 UI로 올리지 않는다.** (부분 성공 상태를 성공처럼 보이게 하지 않음)
4. 실패 후 교사가 다시 시도할 수 있어야 한다.
   - 실시간 모드 결과 영역 ActionButton 문구: **`다시 수업 시작하기`** (기존 `수업 시작하기` 재시도 표기)
   - 클릭 시 viewer navigate가 아니라 **동일 순차 API(`doDeploy`)를 재실행**한다.
   - 기간 모드도 동일하게 재시도 가능해야 하면, 버튼 문구는 `다시 배포하기` 등으로 맞춘다(실시간과 구분).
5. 재시도 시
   - 이전에 1단계만 성공했다면: 새 `POST /activities`를 다시 칠지, 기존 `activityId`로 assignees/publish만 재시도할지 정책이 필요하다.
   - **기본안(권장)**: 실패 시 `activityId`를 로컬에 남겨 두고, 재시도는 **실패한 단계부터** 이어간다.
     - 출제 실패 → 1부터
     - 배정 실패 → 같은 `activityId`로 2부터
     - 발행 실패 → 같은 `activityId`로 3부터
   - `publish`는 멱등이므로 3단계 재시도는 안전하다. assignees도 같은 명단 재전송은 자연 멱등이다.

### `PUT .../assignees` — `assigneeSubs` = `spUserId` (2026-08-21 확정)

> 출처: `superplatform-lms/docs/guide/api-spec.md` § `PUT /api/v1/activities/{activityId}/assignees`  
> README 예: `{ "assigneeSubs": ["user-1", "user-2", "user-3"] }`  
> FE 매핑 확정: **`assigneeSubs` = 선택한 반(들)의 `/group/detail` `memberList[].spUserId`**

| 항목 | 내용 |
|------|------|
| 필드 | `assigneeSubs: string[]` (필수) |
| 의미 | LMS 회원 Auth `sub`에 해당하는 값. **FE에서는 `spUserId`를 보낸다** |
| 제한 | 최대 1,000명 × 64자. `[]` = 전원 해제 |
| path | `{activityId}` (출제 응답 UUID). **`libraryItemId` 아님** · **`accessKey` 아님** |
| 동작 | **전체 교체(PUT)**. 안 보낸 사람은 명단에서 빠짐 |

#### FE 수집 경로 (구현 완료 · 2026-08-21)

DeployPage에서 선택한 그룹(`classes: string[]`, 드롭다운 `g.id`)마다:

1. `GET /group/detail?claId={groupId}&page=0&size=200` — `getGroupDetail(groupId, userId)` (`features/groups/api/groupService.ts`)
2. 응답 `resultData.memberList[]` → `toFrontendMember`의 **`spUserId`** 수집
3. 필터: `memberType === 'member'` · `status === 'active'` · `spUserId` 있음
4. 여러 반이면 **합집합** 후 **중복 제거** → `assigneeSubs: string[]`
5. `PUT /api/v1/activities/{activityId}/assignees` body: `{ assigneeSubs }`
6. `audienceType: 'ASSIGNED'` (`buildDeployActivityBody`)

```ts
// features/lesson/model/collectAssigneeSubsFromGroups.ts
export async function collectAssigneeSubsFromGroups(
  groupIds: string[],
  userId: string,
): Promise<string[]>;

// DeployPage.doDeploy
const assigneeSubs = await collectAssigneeSubsFromGroups(validClasses, user.id);
if (assigneeSubs.length === 0) {
  toast.error('배정할 학생이 없습니다');
  return;
}
await deployLessonActivity({ body, assigneeSubs, resume });
```

| 주의 | 내용 |
|------|------|
| `GroupMember.spUserId` | `shared/types` + `toFrontendMember` 매핑 **완료** |
| `stdtId` / `userNo` / 멤버 `id` | **쓰지 않음**. LMS `assigneeSubs`는 **`spUserId`만** |
| `spUserId` 없는 멤버 | 배열에서 제외 |
| 빈 명단 | FE에서 배포 전 차단 (`배정할 학생이 없습니다`) |
| `audienceType` | **`ASSIGNED`** (OPEN 임시 해제) |

---

## 8. 참여 링크 조립

```ts
/** accessKey = publish 응답. lcmsSetId: 임시 — Phase B에서 제거 */
export function buildLessonJoinUrl(accessKey: string, lcmsSetId?: string): string {
  const segments = [`/student/lesson/${encodeURIComponent(accessKey)}`];
  if (lcmsSetId?.trim()) segments.push(`/${encodeURIComponent(lcmsSetId.trim())}`);
  const path = segments.join('');
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}
```

| 규칙 | 내용 |
|------|------|
| origin | 현재 앱 origin. `class.visang.co.kr` 하드코딩 금지 |
| path | `/student/lesson/:accessKey` |
| QR | `qrcode.react` `QRCodeCanvas`에 **완성 URL** (`value={joinUrl}`) |
| 복사 | `navigator.clipboard.writeText(joinUrl)` 후 기존 toast `'링크가 복사되었습니다'` |

assessment `QRCodeModal`을 lesson에서 import하지 않는다 (FSD: feature 간 의존 금지). `qrcode.react`만 재사용한다.

---

## 9. DeployPage 변경

`doDeploy` 성공 후 `deployed`에 `activityId`·`accessKey`·`joinUrl`을 넣는다.

| UI | 내용 |
|----|------|
| 링크 input | `buildLessonJoinUrl(accessKey)` |
| QR | `QRCodeCanvas` `value={joinUrl}` |
| 복사 | 실 URL 클립보드 |
| 실시간 ActionButton | `/lesson/viewer/:setId` 유지. **중도 실패 후 재시도** 시 라벨을 `다시 수업 시작하기`로 바꾸고 `doDeploy` 재실행 |
| `POST /activities` 파이프라인 | `doDeploy`에서 순차 호출. 단계별 toast(§7 중도 실패). 전체 성공 전 결과 카드 비표시 |

배포 실패와 콘텐츠 조회 실패(추가계획9)를 구분한다. 조회 실패 문구는 바꾸지 않는다.

기간 모드도 같은 참여 링크를 만든다. 학생 join 입구는 `/student/lesson/:accessKey`.

---

## 10. 저작툴 `handleStartLesson`

활동 POST를 Editor에서 중복 호출하지 않는다. DeployPage와 **같은 배포 화면**으로 보낸다.

```ts
const handleStartLesson = (p: StartLessonPayload) => {
  const nextSetId = p.lcmsSetId;
  if (!nextSetId) {
    toast.error('콘텐츠 ID가 없습니다');
    return;
  }
  navigate(`/lesson/deploy/${nextSetId}`);
};
```

- URL 직접 진입과 같이 DeployPage가 CMS/LMS로 item을 재조회한다 (추가계획9).
- `p.lcmsSetId` 없음 → 이동하지 않음.
- 여기서 `createActivity` 호출 금지.

---

## 11. 하지 말 것

| 금지 | 이유 |
|------|------|
| 미확정 `POST /activities` 경로·본문으로 fetch | 잘못된 계약이 고정됨 |
| 학생 URL에 `setId`만 넣기 | 같은 세트 다중 활동과 키가 충돌. 이번 키는 publish `accessKey` |
| 학생 URL path에 `setId` 포함 | 학생 URL은 `accessKey`만. `lcmsSetId`는 `POST /participations`에서 취득 |
| 교사 `/lesson/viewer/:setId`를 학생 링크로 쓰기 | 교사 레이아웃·인증. 추가계획12와 분리 |
| LMS가 완성 URL을 준다는 가정 | 스펙상 키만 옴. URL은 FE 조립 |
| Editor에서 활동 생성 API 직접 호출 | DeployPage 단일 입구 |
| 활동 종료 API 이번 구현 | `POST /api/v1/activities/{id}/close` (+ 필요 시 `reopen`). Phase A에서는 호출하지 않음 |
| lesson → assessment `QRCodeModal` import | FSD feature 경계 |

---

## 12. 변경 파일 (Phase A·B)

| 파일 | 유형 | 핵심 변경 |
|------|------|-----------|
| `features/lesson/lib/buildLessonJoinUrl.ts` | 신규 | origin + `/student/lesson/:accessKey` |
| `features/lesson/model/buildDeployActivityBody.ts` | 신규 | DeployPage → `CreateActivityBody` 변환. `audienceType: 'ASSIGNED'` |
| `features/lesson/model/collectAssigneeSubsFromGroups.ts` | 신규 | 선택 반 → `getGroupDetail` → `spUserId[]` 합집합 |
| `features/lesson/api/lmsActivityService.ts` | 신규·구현 | `createActivity` · `putActivityAssignees` · `publishActivity` · `deployLessonActivity` |
| `features/lesson/ui/DeployPage.tsx` | 수정 | 순차 API · QR(`qrcode.react`) · 복사 · 중도 실패 toast · 재시도 |
| `pages/lesson/LessonEditorPage.tsx` | 수정 | `onStartLesson` → `/lesson/deploy/${lcmsSetId}` |
| `features/lesson/index.ts` | 수정 | `buildLessonJoinUrl` · activity service export |

`assigneeSubs`/`PUT assignees`: **연동 완료** — `collectAssigneeSubsFromGroups` → `spUserId[]` → `audienceType: 'ASSIGNED'`.

---

## 13. 확정·미확정

| # | 항목 | 상태 | 내용 |
|---|------|------|------|
| 1 | 학생 path | **확정** | `/student/lesson/:accessKey` |
| 2 | URL 조립 주체 | **확정** | 교사 FE (`buildLessonJoinUrl`) |
| 3 | 참여 키 | **확정** | publish `accessKey` |
| 4 | `POST /activities` | **확정** | 경로·본문 연동 완료 |
| 5 | 활동 종료 | **미확정** | close/reopen 시나리오 |
| 6 | `assigneeSubs` | **구현 완료** | `getGroupDetail` → `memberList[].spUserId` 합집합 → `PUT /assignees` |

---

## 14. 완료 기준

### Phase A (이번 구현 대상)

- [x] `buildLessonJoinUrl`이 현재 origin 기준 `/student/lesson/{accessKey}` 반환
- [x] DeployPage 배포 후 링크 input이 그 URL. 목업 도메인 없음
- [x] QR이 같은 URL을 인코딩. 복사 시 클립보드에 그 URL
- [x] Editor 「수업하기」→ `/lesson/deploy/{lcmsSetId}` (POST 없음)
- [x] `createActivity` 등 LMS activity 서비스 구현 (`lmsActivityService.ts`)
- [x] 실시간 「수업 시작하기」는 기존 교사 Viewer 유지
- [x] `npx tsc -b --noEmit`, eslint 통과 (`no-unused-vars` 제외)

### Phase B (스펙 수신 후)

- [x] `doDeploy` → `POST /activities` → `publish` → 응답 `accessKey`로 링크/QR 갱신
- [x] 단계별 중도 실패 toast (`출제 실패했습니다. [{status}]` / `학생 배정에 실패했습니다. [{status}]` / `문제 발행에 실패했습니다. [{status}]`)
- [x] 실패 시 결과 카드 비표시 + 재시도 UX (`다시 수업 시작하기` / `다시 배포하기`). 실패 단계부터 재개
- [x] `assigneeSubs` 값 = `/group/detail` `memberList[].spUserId` **스펙 확정** (2026-08-21)
- [x] 선택한 반 → `getGroupDetail` → `spUserId[]` 합집합 → `PUT /assignees` **코드 연동** (2026-08-21)
- [x] `audienceType: 'ASSIGNED'` 로 전환
- [x] `GroupMember.spUserId` + `toFrontendMember` 매핑 추가
- [ ] 활동 종료(및 필요 시 reopen) API 호출 시나리오 확정 후 적용

---

**작성일**: 2026-08-19  
**수정**: 2026-08-20 — Phase B 중도 실패 toast·재시도 UX · `assigneeSubs` 스펙 확인  
**수정**: 2026-08-21 — `assigneeSubs` = `getGroupDetail` `memberList[].spUserId` 확정 · 학생 path `:accessKey`  
**수정**: 2026-08-21 — assignees 코드 연동 완료 (`collectAssigneeSubsFromGroups`, `ASSIGNED`)  
**구현 완료일**: 2026-08-21 — Phase A·B (assignees 포함)  
**상태**: Phase A·B 구현 완료 · 활동 종료 API만 잔여

---

# 추가계획12 — 학생용 `/student/lesson/:accessKey` + activity-join embed

> **상태**: Phase A·B 구현 완료 (2026-08-21)  
> **선행**: 추가계획11의 **링크 계약** (`/student/lesson/:accessKey`). 교사 `publish` → `accessKey`를 URL에 넣는다  
> **범위**: 학생이 QR/링크로 들어와 참여 가능하면 `activity-join` SDK를 보여 준다. Viewer(`LessonViewerEmbed`)를 학생 입구로 재사용하지 않는다.  
> **학생 흐름 기준**: `superplatform-lms/docs/guide/README.md` — 「따라 해보기 (학생) — 들어가서 풀고 내기」  
> **Phase B (완료)**: `GET /entry` → `POST /participations` → `data.content.lcmsSetId`로 embed. 임시 `:setId` path 제거  
> **후속(별도 추가계획)**: `PATCH` 자동저장 · `submit` · `result` Host 연동  
> **명칭 (2026-08-21 정정)**: 학생 URL param은 **`accessKey`** (이전 문서의 `:activityId` 표기는 오표기). LMS 내부 UUID `activityId`와 구분.  
> **정정 (2026-08-21)**: 학생은 **`GET /activities/{activityId}`를 호출하지 않는다** (교사용). `lcmsSetId`는 `POST /participations` 응답 `data.content.lcmsSetId`.

---

## 1. 한 줄 요약

```
/student/lesson/:accessKey           ← publish accessKey (act-…)
  → GET /entry/{accessKey}           ← 인증 불필요. availability 분기 (문항 없음)
  → 불가: availability별 페이지 메시지 (embed 금지)
  → 가능(OPEN):
        POST /participations         ← Bearer. body { accessKey }. 참여 시작
        → data.content.lcmsSetId
        → LessonActivityJoinEmbed (mode: 'activity-join', slideId=lcmsSetId)
  → (후속) PATCH /participations/{id} → POST .../submit → GET .../result
```

문제 풀기 UI는 everyCanvas `activity-join`이다. Host는 라우트·권한 게이트·참여 시작·id 주입을 한다.  
문항·`lcmsSetId`는 **`/entry`가 주지 않는다** — `POST /participations` 이후에 나온다 (가이드와 동일).

**식별자 구분 (2026-08-21 확정)**:

| 이름 | 값 | 쓰임 |
|------|-----|------|
| `accessKey` | publish `act-…` | 학생 URL param · `GET /entry/{accessKey}` · `POST /participations` body · `buildLessonJoinUrl` |
| `activityId` | LMS UUID | **교사** `GET/PATCH /activities/{activityId}` · assignees/publish path. **학생 FE는 activities 단건 조회 금지** · embed prop은 everyCanvas 계약에 따름 |
| `participationId` | UUID | `POST /participations` 응답. 이후 PATCH/submit/result path |
| `lcmsSetId` | CMS 세트 ID | `POST /participations` → `data.content.lcmsSetId` → embed `slideId` |

---

## 2. 현황 및 왜 Viewer를 안 쓰나

| 화면 | 경로 | 레이아웃 | SDK mode | URL 키 |
|------|------|----------|----------|--------|
| 교사 Viewer (있음) | `/lesson/viewer/:setId` | `TeacherFullscreenLayout` | `viewer` | 콘텐츠 `setId` |
| 교사 Editor (있음) | `/lesson/editor/:setId` | 동일 | `editor` | `setId` |
| **학생 참여 (이번)** | `/student/lesson/:accessKey` | 학생 풀스크린 (신규) | **`activity-join`** | **publish `accessKey`** |

`LessonViewerEmbed`는 교사 미리보기/실시간 수업용이다. 학생 제출 계약은 everyCanvas `activity-join` (`/embed/activity/:activityId/join`). Editor/Viewer와 **같은 래퍼 패턴**으로 새 Embed를 만든다. Viewer를 학생 라우트에 마운트하지 않는다.

로컬 SDK 타입은 이미 `EmbedMode`에 `'activity-join'`이 있다. `CreateEmbedOptions.activityId`도 있다.

---

## 3. 이번 / 다음

### Phase A — API 없이 구현 (이번)

1. 라우트 `/student/lesson/:accessKey` + `LessonJoinPage`
2. 학생 인증 + **사이드바 없는** 풀스크린 레이아웃 (`StudentLayout` 사용 금지)
3. `LessonActivityJoinEmbed` — `LessonEditorEmbed` / `LessonViewerEmbed`와 동일 구조 (`useEveryCanvasEmbed`, `mode: 'activity-join'`)
4. 페이지 상태 머신: 로딩 / 참여불가 / 준비됨(embed) / 에러
5. 참여 가능·setId 조회는 **서비스 스켈레톤 + 페이지 분기 UI**. 실호출 금지
6. Phase A 개발 확인: 조회 API 전엔 embed `setId`를 URL에서 받거나 `accessKey` fallback (§3.1 임시 path)

### 3.1 임시 — URL path에 `setId` (**제거 완료** · 2026-08-21)

Phase B API 연동 전 embed 확인용 **단기 우회**였다. Phase B에서 제거 완료.

| 항목 | 임시(제거됨) | 현재 (Phase B) |
|------|--------------|----------------|
| 참여 URL | `{origin}/student/lesson/{accessKey}/{lcmsSetId}` | `{origin}/student/lesson/{accessKey}` **만** |
| `buildLessonJoinUrl` | `buildLessonJoinUrl(accessKey, lcmsSetId)` | `buildLessonJoinUrl(accessKey)` |
| 라우트 | `/student/lesson/:accessKey/:setId` | `/student/lesson/:accessKey` |
| `LessonJoinPage` | URL `:setId` / `accessKey` fallback | `POST /participations` → `data.content.lcmsSetId` |

**제거 체크리스트**:

- [x] `buildLessonJoinUrl`에서 `lcmsSetId` optional param 제거
- [x] `DeployPage` `buildLessonJoinUrl(result.accessKey)` 단일 인자로 복귀
- [x] `routes.tsx` `/student/lesson/:accessKey/:setId` Route 삭제
- [x] `LessonJoinPage` `setId` param·fallback 분기 삭제 → `POST /participations` 조회로 대체

### Phase B — LMS API 연동 (**구현 완료** · 2026-08-21)

가이드 순서: **들어가서** (`entry` → `POST /participations`) → embed. **풀고 내기**는 후속.

1. [x] `GET /api/v1/entry/{accessKey}` 실호출 — **인증 불필요**. `availability`별 페이지 메시지 (§5.1)
2. [x] `availability === 'OPEN'`일 때만 `POST /api/v1/participations` body `{ accessKey }` → `data.content.lcmsSetId` 취득 후 embed 마운트  
   (`201` 새 회차 · `200` 이어하기 — 본문으로 구분 불가. 상태 코드로만 구분)
3. [x] embed options: everyCanvas `slideId`(`content.lcmsSetId`) + `activityId`(현재 `accessKey` 전달 · everyCanvas 계약 확정 시 교체). **`getToken` 전달 안 함**
4. [x] **학생은 `GET /api/v1/activities/{activityId}`를 호출하지 않는다** (교사용)
5. `PATCH` 자동저장 · `submit` · `result` — **후속 추가계획**. 이번 Phase B 미포함
---

## 4. 라우트·레이아웃

`TeacherAuthGuard` 안에 두지 않는다. 교사가 열면 학생 경로 가드가 대시보드로 보낸다. QR은 학생용이다.

```tsx
// routes.tsx — Teacher 블록이 아님
<Route element={<StudentJoinLayout />}>
  <Route path='/student/lesson/:accessKey' element={<LessonJoinPage />} />
</Route>
```

`StudentJoinLayout` (이름 가칭):

| 요구 | 내용 |
|------|------|
| 인증 | 필요. 미인증 → `/login`. **가능하면** 로그인 후 `/student/lesson/:accessKey`로 복귀 (`location.pathname` 유지). 기존 가드가 `replace`만 하면 QR 진입이 끊기므로, join 레이아웃에서 redirect를 명시 |
| 역할 | `STUDENT`만. 교사는 기존처럼 교사 홈으로 |
| 레이아웃 | `MinimalLayout` (GNB/LNB/학생 사이드바 없음). Embed 전체 화면 |
| 게스트 | 기존 기획(게스트 제외) 유지. 게스트 라우트 부활 금지 |

`pages/index.ts`에 `LessonJoinPage` export. `FEATURES.IA_V2` 가드가 교사 lesson과 같다면 join도 동일 플래그 안에 둔다.

---

## 5. 페이지 흐름 (`LessonJoinPage`)

```
accessKey 없음 → 안내 (embed 금지)
        │
        ▼
GET /entry/{accessKey}  ← 인증 불필요 (문항·lcmsSetId 없음)
        │
        ├─ 로딩 → PageLoading
        ├─ 404/네트워크 → 「활동 정보를 불러오지 못했습니다」
        ├─ availability ≠ OPEN → §5.1 메시지 (embed 금지)
        └─ OPEN
              │
              ▼
         POST /participations  ← Bearer. body { accessKey }
              │
              ├─ 실패 → 「활동 정보를 불러오지 못했습니다」 (§7 errorCode UX는 후속 보강)
              └─ data.content.lcmsSetId 있음
                    → <LessonActivityJoinEmbed slideId={lcmsSetId} … />
```

Page는 얇게: params, 조회 훅(Phase B), 상태 분기, Embed 마운트. 스타일·SDK 옵션은 feature UI에 둔다.

불가·대기 메시지는 toast만 쓰지 않는다. 풀스크린에서 본문이 비면 학생이 이유를 못 본다. **페이지 중앙 문구**로 둔다.

### 5.1 `availability`별 화면 문구 (Phase B 확정)

| `availability` | 의미 | 화면 문구 | 보조 |
|----------------|------|-----------|------|
| `OPEN` | 참여 가능 | (embed 마운트) | — |
| `NOT_STARTED` | 발행됐으나 시작 시간 전 | `아직 활동을 시작할 수 없습니다.` | `openAt` 있으면 **활동 시작 시간** 표기 |
| `CLOSED` | 교사 마감 또는 마감 시간 경과 | `활동이 종료되었습니다.` | — |
| `NOT_AVAILABLE` | 아직 발행 전 | `활동이 시작되지 않았습니다.` | — |

공통:

- 조회 실패(404·네트워크·`POST /participations` 실패): `활동 정보를 불러오지 못했습니다` (§5.1 불가 문구와 구분)
- `accessKey` 없음: embed 없이 종료

Phase B: §5.1 + `POST /participations` → `content.lcmsSetId`. URL `:setId` path **제거 완료**.

---

## 6. Embed — `LessonActivityJoinEmbed`

`LessonViewerEmbed` / `LessonEditorEmbed` 복사 후 mode·id만 바꾼다.

```tsx
export type LessonActivityJoinEmbedProps = {
  activityId: string; // everyCanvas prop. Phase A 임시 = URL accessKey
  setId: string; // POST /participations → data.content.lcmsSetId. embed slideId로 전달
  onExitRequested?: (payload: { reason?: 'userClose' | 'done' }) => void;
  onSubmitted?: (payload: unknown) => void; // 후속 추가계획. Host 저장 API 연동 없음
  onError?: (error: EmbedError) => void;
  onReady?: () => void;
};

// useEveryCanvasEmbed
options: {
  embedBaseUrl: ENV.EVERYCLASS_EMBED_BASE_URL,
  mode: 'activity-join',
  activityId,
  slideId: setId, // content.lcmsSetId
  locale: 'ko-KR',
  theme: { '--ec-color-accent': appTheme.colors.primary[500] },
  // getToken: 전달 안 함 (2026-08-20 확정)
},
identity: [ENV.EVERYCLASS_EMBED_BASE_URL, activityId, setId],
```

| 규칙 | 내용 |
|------|------|
| `openSet` | **호출하지 않음.** `openSet`은 Editor(SDK 1.5)용. activity-join에서 slideId는 options로만 |
| `getSsoToken` | Viewer와 같이 이번 미사용. Editor만 유지 |
| `getToken` | **전달하지 않음.** 주석·자리 제거 (2026-08-20 확정) |
| 이벤트 | `exitRequested` → `navigate(-1)` 또는 빈 안내. `submitted` / `phaseChanged` / `progress`는 훅에 구독만, **Host 저장 API는 후속 추가계획** |

`useEveryCanvasEmbed`의 `KNOWN_EVENTS`에 activity-join용 `submitted`·`phaseChanged`·`progress`를 추가한다. 핸들러가 없으면 no-op. Editor/Viewer 기존 이벤트는 유지.

참여 시작(`POST /participations`) **전**에 Embed를 마운트하지 않는다. 불가인데 iframe이 뜨면 안 된다.

---

## 7. LMS API 매핑 (Phase B 확정 · 2026-08-21 정정)

> 출처: `superplatform-lms/docs/guide/README.md` — 따라 해보기 (학생) · `api-spec.md` § 진입·참여  
> 학생 순서: **들어가서** (`entry` → `POST /participations`) → **풀고** (`PATCH`) → **내기** (`submit` → `result`)

### Phase B에서 호출하는 API (embed 마운트까지)

| 순서 | 엔드포인트 | 역할 | 인증 |
|------|-----------|------|------|
| 1 | `GET /api/v1/entry/{accessKey}` | 진입 — `availability`·`openAt` 등. **문항·lcmsSetId 없음** | **불필요** (유일한 무인증 경로) |
| 2 | `POST /api/v1/participations` | 참여 시작 — `data.content.lcmsSetId` → embed `slideId` | **Bearer** (학생 JWT) |

> 학생 URL·entry·participations body는 **`accessKey`**.  
> 🚫 **`GET /api/v1/activities/{activityId}`는 교사용.** 학생이 `lcmsSetId`를 얻을 때 호출하지 않는다.

### 후속 추가계획 (풀고 내기 — 이번 Phase B 미포함)

| 엔드포인트 | 역할 |
|-----------|------|
| `GET /api/v1/participations/{id}` | 이어하기 (응답에 `responses[]`·`content` 포함) |
| `PATCH /api/v1/participations/{id}` | 자동저장 |
| `POST /api/v1/participations/{id}/submit` | 제출 |
| `GET /api/v1/participations/{id}/result` | 결과 |

### `GET /api/v1/entry/{accessKey}` 응답 (`Entry` 타입)

```ts
type Entry = {
  title: string | null;
  availability: 'NOT_AVAILABLE' | 'NOT_STARTED' | 'OPEN' | 'CLOSED';
  openAt: string | null;
  closeAt: string | null;
  allowedIdentityTypes: Array<'MEMBER' | 'GUEST_TOKEN' | 'PARTICIPATION_HANDLE'>;
  itemCount: number;
};
```

> **참여 가능 판단**: `availability === 'OPEN'`일 때만 `POST /participations`. 그 외는 §5.1 문구.  
> **문항이 없다.** `itemCount`만 온다.

### `POST /api/v1/participations` — 참여 시작 · embed용 `lcmsSetId`

```ts
// Request body
{ accessKey: string }

// Response data (ParticipationDetail) — embed에 필요한 필드만 요약
{
  participationId: string;
  attempt: number;
  status: 'IN_PROGRESS' | 'SUBMITTED';
  availability: 'OPEN' | /* … */;
  content: {
    title: string;
    lcmsSetId: string; // ← embed slideId (prop setId)
    gradingPolicy: string;
    items: Array<{ activityItemId: string; seq: number; lcmsArticleId: string; maxScore?: number }>;
  };
}
```

| 규칙 | 내용 |
|------|------|
| `lcmsSetId` | **`data.content.lcmsSetId`** 를 embed `slideId`(prop `setId`)로 전달 |
| `201` vs `200` | `201` 새 회차 · `200` 이어하기. **본문으로 구분 불가** — 상태 코드로만 |
| 교사 API 금지 | [`ActivityDetail`](#activitydetail) / `GET /activities/{id}`로 `lcmsSetId`를 가져오지 않음 |

### Phase A vs Phase B 매핑

| 기능 | Phase A | Phase B (현재) |
|------|---------|----------------|
| URL param | `:accessKey` · **임시** `:setId` | `:accessKey` **만** (`:setId` path **제거 완료**) |
| 진입 확인 | 임시 `OPEN` 가정 | `GET /entry/{accessKey}` → §5.1 분기 |
| 참여 시작 · `lcmsSetId` | **임시** URL `:setId` 또는 `accessKey` fallback | `POST /participations` → `data.content.lcmsSetId` |
| embed `activityId` | 임시 = URL `accessKey` | 현재 `accessKey` 전달 (everyCanvas 계약 확정 시 교체) |
| embed `slideId` | 임시 = URL `:setId` / fallback | `content.lcmsSetId` |
| `getToken` | 미전달 | **미전달 (확정)** |
| 자동저장·제출·결과 | `onSubmitted` 구독만 | **후속 추가계획** |

### Phase B service 시그니처 (**구현 완료**)

```ts
// features/lesson/api/lmsActivityService.ts

/** GET /entry/{accessKey} — 인증 불필요 */
export async function fetchActivityEntry(accessKey: string, signal?: AbortSignal): Promise<Entry>;

/** POST /participations — Bearer. body { accessKey }. content.lcmsSetId 포함 */
export async function startParticipation(accessKey: string): Promise<ParticipationDetail>;
```

훅: `useActivityEntryQuery` · `useStartParticipationQuery` (`features/lesson/api/queries.ts`).  
Phase A 스켈레톤(`getActivityJoinEligibility` / `getActivityJoinSetId`) **삭제**.  
~~`fetchActivityLcmsSetId` / `GET /activities/{activityId}`~~ — **학생 경로에서 사용하지 않음**.

### Phase B 구현 순서 (**완료**)

1. [x] `fetchActivityEntry(accessKey)` — `GET /entry/{accessKey}`. `availability` → §5.1 UI
2. [x] `OPEN`이면 `startParticipation(accessKey)` — `POST /participations` → `data.content.lcmsSetId`
3. [x] `LessonActivityJoinEmbed`에 `setId`(`content.lcmsSetId`) 전달. **`getToken` 없음**. embed `activityId`는 현재 `accessKey`
4. [x] 응답 봉투: `{ success, data, errorCode }` — `data`만 언랩

### API `errorCode` → UX (미확정)

`ACTIVITY_NOT_AVAILABLE`, `IDENTITY_NOT_ALLOWED`, `ATTEMPT_LIMIT_EXCEEDED`, `PARTICIPATION_LIMIT_REACHED`, `ACTIVITY_NOT_OPEN`, `ACTIVITY_CLOSED` 등 **어느 API·어떤 상황에서 내려오는지 FE에서 아직 확정 못 함**. Phase B 1차는 `entry`의 `availability` 분기 + `POST /participations` 실패 공통 문구만 구현. PATCH/submit/result 연동 시(후속) 재검토.

---

## 8. SDK에 넣는 값

| prop (embed options) | 출처 | Phase A | Phase B (현재) |
|------|------|---------|----------------|
| `activityId` | everyCanvas | URL `accessKey` | `accessKey` 전달 (계약 확정 시 교체) |
| `slideId` (`setId` prop) | embed 입력 | URL `:setId` · 없으면 `accessKey` | `POST /participations` → `data.content.lcmsSetId` |

`getToken`은 **전달하지 않음** (2026-08-20 확정).

---

## 9. 하지 말 것

| 금지 | 이유 |
|------|------|
| 학생 라우트에 `LessonViewerEmbed` | mode `viewer`, 교사 계약. 제출은 `activity-join` |
| `TeacherFullscreenLayout` 아래 join | 학생 QR이 교사 가드에 막힘 |
| `StudentLayout` 사이드바 | 풀스크린 embed |
| 참여 확인(`entry`)·참여 시작(`POST /participations`) 전에 embed 마운트 | 불가·대기 학생에게 iframe 노출 |
| 학생이 `GET /activities/{activityId}` 호출 | **교사용 API**. `lcmsSetId`는 `POST /participations` → `content.lcmsSetId` |
| `getToken` 전달 | 불필요 (확정). 주석·자리 제거 |
| 게스트 레이아웃 부활 | 기획 제외 |
| PATCH/submit/result Host 연동을 Phase B에 몰아넣기 | **후속 추가계획**. Phase B는 entry + 참여 시작 + embed까지 |
| join URL path에 `:setId` **영구** 유지 | **임시 dev용만**. Phase B에서 `POST /participations`로 대체 후 path·`buildLessonJoinUrl` 2번째 인자 **제거** |
| join URL에 `setId` **쿼리** 필수화 | query string 금지. (path segment 임시는 §3.1 — Phase B에서 제거) |

---

## 10. 변경 파일

### Phase A (구현 완료)

| 파일 | 유형 | 핵심 변경 |
|------|------|-----------|
| `pages/lesson/LessonJoinPage.tsx` | **신규 완료** | params, 로딩/불가/에러/embed 분기 |
| `features/lesson/ui/LessonActivityJoinEmbed.tsx` | **신규 완료** | `mode: 'activity-join'`, `activityId` + `setId` |
| `features/lesson/lib/useEveryCanvasEmbed.ts` | **수정 완료** | `submitted`·`phaseChanged`·`progress` 구독. `openSet`은 editor만 |
| `features/lesson/api/lmsActivityService.ts` | **신규 완료** | 교사 deploy API + (Phase A) eligibility 스켈레톤 |
| `app/router/routes.tsx` | **수정 완료** | `StudentFullscreenLayout` + `/student/lesson/:accessKey` |
| `pages/index.ts` | **수정 완료** | `LessonJoinPage` export |
| `features/lesson/index.ts` | **수정 완료** | `LessonActivityJoinEmbed` export |

### Phase B (구현 완료 · 2026-08-21)

| 파일 | 유형 | 핵심 변경 |
|------|------|-----------|
| `features/lesson/api/lmsActivityService.ts` | **수정** | `fetchActivityEntry` · `startParticipation`. 스켈레톤 삭제 |
| `features/lesson/api/queryKeys.ts` | **수정** | `activityEntry` · `participation` keys |
| `features/lesson/api/queries.ts` | **수정** | `useActivityEntryQuery` · `useStartParticipationQuery` |
| `pages/lesson/LessonJoinPage.tsx` | **수정** | entry → participations → §5.1 / embed. `:setId` 제거 |
| `features/lesson/lib/buildLessonJoinUrl.ts` | **수정** | `accessKey` 단일 인자 |
| `features/lesson/ui/DeployPage.tsx` | **수정** | `buildLessonJoinUrl(result.accessKey)` |
| `app/router/routes.tsx` | **수정** | `:setId` Route 삭제 |
| `features/lesson/ui/LessonActivityJoinEmbed.tsx` | **수정** | `setId` 주석 · `getToken` 없음 유지 |
| `features/lesson/index.ts` | **수정** | entry/participation export |

`useEveryCanvasEmbed`의 `openSet`: Editor만. `options.mode === 'editor'`일 때만 `openSet(setId)`. activity-join/viewer는 options의 `slideId`/`activityId`로 Frame이 연다.

---

## 11. 확정·미확정

| # | 항목 | 상태 | 내용 |
|---|------|------|------|
| 1 | 학생 path·param | **확정·구현** | `/student/lesson/:accessKey` (값 = publish `accessKey`). 임시 `/:setId` **제거 완료** |
| 2 | `accessKey` vs `activityId` | **확정** | URL·entry·participations body = `accessKey`. LMS UUID `activityId`는 **교사** activities path. 학생은 activities 단건 조회 금지 |
| 3 | 학생 SDK | **확정·구현** | `activity-join` Embed. Viewer 재사용 안 함 |
| 4 | 불가 UX | **확정·구현** | §5.1 `availability`별 페이지 메시지. embed 없음 |
| 5 | 진입 API | **확정·구현** | `GET /entry/{accessKey}`. **인증 불필요**. 문항·lcmsSetId 없음 |
| 6 | `lcmsSetId` 조회 | **확정·구현** | `POST /participations` → `data.content.lcmsSetId` |
| 7 | `getToken` | **확정·구현** | **전달 안 함** |
| 8 | 풀고 내기 (PATCH/submit/result) | **후속** | 가이드 순서상 맞으나 Host 연동은 별도 추가계획 |
| 9 | API `errorCode` UX | **미확정** | 1차는 §5.1 + participations 실패 공통 문구만 |
| 10 | 로그인 복귀 | **Phase A에서 가능한 한** | join URL이 로그인에 삼켜지지 않게 |
| 11 | URL `:setId` path | **제거 완료** | 2026-08-21 Phase B |
| 12 | embed `activityId` | **임시 유지** | 현재 `accessKey` 전달. everyCanvas 계약 확정 시 교체 |

---

## 12. 완료 기준

### Phase A (구현 완료)

- [x] `/student/lesson/:accessKey` 가 학생 풀스크린으로 열린다 (교사 가드·학생 사이드바 없음)
- [x] `StudentJoinLayout`: 학생 인증 + `MinimalLayout`, 미인증 시 `/login?redirect=...`
- [x] `LessonActivityJoinEmbed`가 `mode: 'activity-join'` + `activityId` + `setId`로 `createEmbed`
- [x] 참여 불가 분기 UI 골격 — Phase B에서 §5.1 문구로 교체 완료
- [x] 조회 실패 문구 (`활동 정보를 불러오지 못했습니다`)
- [x] Phase A: 미확정 API fetch 없음 (이후 Phase B에서 실호출)

### 임시 setId path (**제거 완료** · 2026-08-21)

- [x] `buildLessonJoinUrl(accessKey)` 단일 인자
- [x] 라우트 `/student/lesson/:accessKey` 만 유지 (`:setId` Route 삭제)
- [x] `LessonJoinPage` API `lcmsSetId` → embed `setId`
- [x] route param 명칭 `:accessKey` (2026-08-21)

### Phase B (LMS API 연동 — **구현 완료** · 2026-08-21)

- [x] §3.1 임시 URL `:setId` path **제거**
- [x] `GET /api/v1/entry/{accessKey}` 실호출 → §5.1 `availability` 분기 (`NOT_STARTED` 시 `openAt` 표기)
- [x] `POST /api/v1/participations` 실호출 → `data.content.lcmsSetId` → embed `slideId`
- [x] 학생이 `GET /api/v1/activities/{activityId}` **호출하지 않음**
- [x] `LessonJoinPage` React Query 훅 + 로딩/불가/에러/embed 분기
- [x] `LessonActivityJoinEmbed` — `getToken` 없음
- [x] 응답 봉투 `data` 언랩
- [x] `npx tsc -b --noEmit`, eslint 통과 (`no-unused-vars` 제외)

### Phase B 후속 (풀고 내기 — 별도 추가계획 · 이번 미포함)

- [ ] `PATCH /participations/{id}` 자동저장 · `POST .../submit` · `GET .../result`
- [ ] `GET /participations/{id}` 이어하기 (필요 시)
- [ ] API `errorCode`별 UX (`IDENTITY_NOT_ALLOWED`, `ATTEMPT_LIMIT_EXCEEDED`, `ACTIVITY_NOT_OPEN`, `ACTIVITY_CLOSED` 등 — 출처 확정 후)

---

**작성일**: 2026-08-19  
**수정**: 2026-08-20 — Phase B 스펙 확정: entry/activities API, availability 문구, `getToken` 제거, participations 후속  
**수정**: 2026-08-20 — **임시** URL `/student/lesson/:accessKey/:setId` (embed dev 확인용, Phase B **제거** 예정)  
**수정**: 2026-08-21 — 학생 path·param 명칭 `:activityId` → **`:accessKey`** 정정 (코드·문서)  
**수정**: 2026-08-21 — 학생 흐름 정정: 가이드(들어가서 풀고 내기) 기준으로 `GET /entry` → `POST /participations` → `content.lcmsSetId`. **`GET /activities` 학생 호출 제거** (교사용). PATCH/submit/result는 후속  
**수정**: 2026-08-21 — **Phase B 구현 완료**: entry + participations 실호출 · §5.1 UX · 임시 `:setId` path 제거  
**구현 완료일**: 2026-08-19 (Phase A) · 2026-08-20 (임시 setId URL) · 2026-08-21 (`:accessKey` rename · Phase B API)  
**상태**: Phase A·B 구현 완료 / 풀고 내기(PATCH·submit·result) 후속

---


# 추가계획13 — 전체 자료실 무한 스크롤 + 나의 자료 페이지네이션(예정)

> **상태**: Phase A 구현 완료 / Phase B API 대기  
> **선행**: 추가계획8 (CMS `GET /api/sets`), 추가계획10 (나의 자료 `GET /api/ref-set`)  
> **범위**:  
> 1) 전체 자료실 — `useCmsSetListQuery`를 `useInfiniteQuery`로 바꿔 `pageSize=10`씩 하단 스크롤 시 다음 페이지 추가. `totalCount`가 상한.  
> 2) `serviceType: 131132` 하드코딩은 **이번 미변경**. 추후 수정 필요.  
> 3) 나의 자료 — 동일 UX를 적용할 예정이지만 `GET /api/ref-set`에 `pageNo`/`pageSize`가 없어 **구현 예정만**.

---

## 1. 현황

| 항목 | 현재 상태 |
|------|-----------|
| CMS 목록 훅 | `useCmsSetListQuery` — `useInfiniteQuery`. `CMS_SETS_DEFAULT` 기반 `pageNo=0`부터 시작 |
| CMS 호출 위치 | `LessonLibraryContents` → `data.pages.flatMap` → `mapCmsSetToLibItem` → `ResourceCardList` |
| CMS 응답 | `{ list, pageNo, pageSize, totalCount }` (추가계획8 실측) |
| LMS 목록 훅 | `useRefSetListQuery` — `useQuery` 1회. `getRefSetList()` 쿼리 없음 |
| LMS 호출 위치 | `LessonMyPage` → `data.list` → `mapRefSetToLibItem` → `ResourceCardList` |
| LMS 응답 | `{ totalCount, list }` — `pageNo`/`pageSize` 없음 |
| 목록 UI | `ResourceCardList` — `onEndReached`/`hasMore`/`isFetchingMore` + 하단 센티널/추가 로딩 |
| 스크롤 컨테이너 | `MainLayoutV2` `MainContent`는 `overflow` 없음. 문서(viewport) 스크롤 |
| 기존 참고 구현 | 알림 `useInfiniteQuery` + `IntersectionObserver` (`NotificationList`). 학교검색은 `totalCount` 기준 `getNextPageParam` |

### 현재 CMS 고정 호출 (`queries.ts`)

```ts
const CMS_SETS_DEFAULT = {
  pageNo: 0,
  pageSize: 10,
  brandId: 18,
  serviceType: 131132, // 추후 수정 필요
} as const;

export function useCmsSetListQuery(filters: LibFilters, sort: SortKey) {
  return useQuery({
    queryKey: [...lessonKeys.cmsSets(), filters, sort],
    queryFn: ({ signal }) => getCmsSetList({ ...CMS_SETS_DEFAULT }, signal),
    placeholderData: keepPreviousData,
  });
}
```

`getCmsSetList`는 이미 `pageNo`/`pageSize`를 받으므로 서비스 함수 시그니처는 유지하고, 훅만 `pageParam`으로 `pageNo`를 넘기면 된다.

---

## 2. `serviceType: 131132` — 추후 수정 필요

이번 계획에서 **값을 바꾸거나 env로 빼지 않는다.** 무한 스크롤 구현 시에도 동일 상수를 그대로 둔다.

| 항목 | 내용 |
|------|------|
| 위치 | `features/lesson/api/queries.ts` `CMS_SETS_DEFAULT.serviceType` |
| 현재 값 | `131132` (추가계획8 고정 param) |
| 이번 계획 | 하드코딩 유지 |
| 후속 | **추후 수정 필요** — 출처(브랜드/서비스 설정, env, 로그인 컨텍스트 등) 미정. 확정 후 `CMS_SETS_DEFAULT`에서 분리 |

`brandId: 18`도 같은 상수에 하드코딩되어 있으나 이번 범위 밖. `serviceType`만 후속 수정 대상으로 명시한다.

구현 시 상수 옆에 주석만 추가한다.

```ts
serviceType: 131132, // 추후 수정 필요
```

---

## 3. Phase A — 전체 자료실 CMS 무한 스크롤 (이번 구현 대상)

### 3.1 목표

1. 최초: `GET /api/sets?pageNo=0&pageSize=10&brandId=18&serviceType=131132`
2. 목록 하단으로 스크롤하면 `pageNo=1, 2, …` 를 `pageSize=10`으로 **추가** 호출 (교체 아님)
3. 누적 `list.length >= totalCount` 이면 다음 요청 중단
4. 필터/정렬 변경 시 page 0부터 다시 조회 (기존 queryKey `filters`/`sort` 유지)
5. 초기 로딩 / 다음 페이지 로딩 / 필터 재조회 로딩을 구분

### 3.2 종료 조건 (`totalCount` 상한)

응답 `totalCount`가 전체 건수다. 누적 아이템 수가 이 값에 도달하면 `hasNextPage=false`.

```
loaded = pages.reduce(sum, page.list.length)
다음 pageNo = lastPage.pageNo + 1  (0-based)

hasNextPage = loaded < totalCount && lastPage.list.length > 0
```

| 예시 (`pageSize=10`) | 동작 |
|----------------------|------|
| `totalCount=0` | 첫 응답 후 중단. 빈 상태 |
| `totalCount=10` | page 0만. `loaded=10`으로 중단 |
| `totalCount=23` | page 0(10) → page 1(10) → page 2(3) 후 `loaded=23` 중단 |
| 마지막 페이지 `list=[]` | `totalCount` 미달이어도 중단 (무한 루프 방지) |

`pageNo`는 응답 값(`lastPage.pageNo + 1`)을 쓰고, `(pageNo+1)*pageSize`로 추정하지 않는다. 마지막 페이지가 10건 미만일 수 있다.

### 3.3 훅 — `useQuery` → `useInfiniteQuery`

TanStack Query v5. 프로젝트 기존 패턴: 알림(`useNotifications`) + 학교검색(`useSchoolSearch`의 `totalCount` 비교).

```ts
export function useCmsSetListQuery(filters: LibFilters, sort: SortKey) {
  return useInfiniteQuery({
    queryKey: [...lessonKeys.cmsSets(), filters, sort],
    queryFn: ({ pageParam, signal }) =>
      getCmsSetList({ ...CMS_SETS_DEFAULT, pageNo: pageParam }, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.list.length, 0);
      if (loaded >= lastPage.totalCount) return undefined;
      if (lastPage.list.length === 0) return undefined;
      return lastPage.pageNo + 1;
    },
    placeholderData: keepPreviousData,
  });
}
```

- `pageSize`/`brandId`/`serviceType`은 `CMS_SETS_DEFAULT` 유지. `pageNo`만 `pageParam`.
- `queryKey`에 `pageNo`를 넣지 않는다. infinite query가 `pageParams`로 관리한다.
- 필터 토글 시 key 변경 → page 0부터 새 시리즈. 이전 in-flight는 `signal` abort (추가계획8 레이스 처리 유지).
- `lessonKeys.cmsSets()` 팩토리 유지. 임의 문자열 key 금지.

`LessonLibraryContents` 소비:

```ts
const {
  data,
  isPending,
  isFetching,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  isError,
  error,
} = useCmsSetListQuery(filters, sort);

const items = useMemo(
  () => (data?.pages ?? []).flatMap((page) => page.list).map(mapCmsSetToLibItem),
  [data],
);
```

단일 `data.list` 가정은 깨진다. `pages.flatMap`이 필수.

### 3.4 스크롤 트리거

레이아웃은 viewport 스크롤이므로 `IntersectionObserver` 기본 `root`(viewport)면 충분하다. `ResourceCardList` 그리드 **아래 1px 센티널**을 관찰한다. 알림 `NotificationList`와 동일.

권장 props (`ResourceCardList`):

| prop | 역할 |
|------|------|
| `onEndReached?: () => void` | 센티널 교차 시. Contents에서 `hasNextPage && !isFetchingNextPage`일 때만 `fetchNextPage()` |
| `hasMore?: boolean` | `hasNextPage`. false면 센티널 미마운트 |
| `isFetchingMore?: boolean` | `isFetchingNextPage`. 하단 로딩만 |

- 훅/API는 `ResourceCardList`에 두지 않는다 (feature UI).
- Page는 얇게 유지. 조합은 기존대로 `LessonLibraryContents`.
- 내부 스크롤 컨테이너를 새로 만들지 않는다. 현재 `MainContent` 문서 스크롤을 쓴다.
- `threshold`는 알림과 같이 `1.0`이거나, 카드 그리드가 커서 조기 로드가 필요하면 `0` + `rootMargin: '200px'` — 구현 시 한 번만 확인.

### 3.5 로딩 UI 분리

지금은 Contents가 `isLoading={isPending || isFetching}`이라 다음 페이지 fetch에도 **목록 전체**가 "목록 갱신 중..."이 된다. 무한 스크롤과 맞지 않다.

| 상태 | 표시 |
|------|------|
| `isPending` (아이템 0) | 기존 중앙 `Loading` |
| `isFetchingNextPage` | 그리드 하단 작은 로딩. 기존 카드 유지 |
| 필터 재조회 (`isFetching && !isFetchingNextPage`) | 기존 `RefetchBar` 유지 가능 |
| 빈 목록 | 기존 `emptyMessage` |
| 에러 + 아이템 0 | 기존 에러 문구 |
| 에러 + 이미 일부 로드 | 기존 목록 유지. 다음 페이지 실패는 toast 또는 하단 문구 — 구현 시 기존 에러 패턴에 맞출 것 |

### 3.6 필터/정렬

추가계획8과 동일: FilterPanel 값은 API param에 매핑하지 않는다. `filters`/`sort`는 queryKey 트리거만.

필터 변경 → infinite cache 리셋 → `pageNo=0`만 다시 호출. 누적 목록을 이어 붙이지 않는다.

### 3.7 데이터 일관성 정책

| 상황 | 정책 |
|------|------|
| 같은 필터/정렬 + 스크롤 하강 | `pageNo=0,1,2...` 순서로 append |
| 필터/정렬 변경 | 예외 없이 `pageNo=0`부터 재조회 (결과 집합 변경) |
| 같은 필터 상태에서 신규 데이터 유입 | 즉시 0부터 강제 리셋하지 않음. 현재 스크롤 유지 |
| 신규 데이터 감지/배너 | **미적용** (필터가 항상 최신순이 아니어서 정확한 신규 판별이 어려움) |

- 정렬 기준이 고정 최신순이 아닐 수 있으므로 `새 항목 N개` 배너 정책은 적용하지 않는다.
- 대신 필터/정렬 변경 시에만 `pageNo=0`부터 재조회하고, 그 외에는 현재 스크롤 맥락을 유지한다.

---

## 4. Phase B — 나의 자료 LMS 페이지네이션 (구현 예정)

2와 같은 무한 스크롤을 `useRefSetListQuery` / `LessonMyPage`에 적용할 예정이다.

> **새 API에서는 `GET /api/v1/library-items`가 페이지네이션을 지원한다.** 추가계획14에서 옛 API를 마이그레이션한 뒤 이 Phase B를 진행한다.

### 4.1 현재 API (옛 API — 마이그레이션 대상)

```ts
export async function getRefSetList(): Promise<RefSetListData> {
  return lmsFetch<RefSetListData>(BASE); // GET /api/ref-set — 쿼리 없음
}
```

| 항목 | 상태 |
|------|------|
| `GET /api/ref-set` query | 없음 (`pageNo`/`pageSize` 미지원) |
| 응답 `totalCount` | 있음 (`RefSetListData.totalCount`) |

### 4.2 새 API — `GET /api/v1/library-items`

새 LMS API는 `hasNext` 기반 페이지네이션을 지원한다:

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `page` | int | 0부터 |
| `size` | number | 페이지 크기 (최대 100) |
| `keyword` | string | 검색어 |
| `labels` | string[] | 라벨 필터 (`subject:math` 등) |
| `withTotal` | boolean | `true`면 `totalElements`/`totalPages` 포함 |
| `sort` | string | 정렬 |

응답: `PageResponse<LibraryItem>` — `{ content, page, size, hasNext, totalElements?, totalPages? }`

> 추가계획14의 마이그레이션이 선행되어야 한다. 옛 API를 유지한 채 페이지네이션만 추가할 수 없다.
| 응답 `pageNo`/`pageSize` | 없음 |
| 호출 | 목록 전체를 한 번에 받는 것으로 가정 |

응답에 `totalCount`만 있고 요청에 페이지가 없으면, FE에서 10개씩 잘라 보여 주는 것은 **서버 페이징이 아니다.** 이번 계획에서 클라이언트 슬라이스는 하지 않는다.

### 4.2 LMS 스펙 수신 후 적용안 (구현 완료)

CMS와 대칭으로 맞춘다. 파라미터 이름·0-based 여부는 **LMS 스펙 확정 후**.

1. `getRefSetList({ pageNo, pageSize }, signal)` — `URLSearchParams` 추가
2. `RefSetListData`에 `pageNo`/`pageSize` 추가 (응답에 있으면). 없으면 요청값으로 `getNextPageParam` 계산
3. `useRefSetListQuery` → `useInfiniteQuery`, `pageSize=10`, `initialPageParam=0` (스펙이 1-based면 맞춤)
4. `getNextPageParam`: 누적 `list.length >= totalCount` 이면 `undefined`
5. `LessonMyPage`: `pages.flatMap` → `mapRefSetToLibItem` → `ResourceCardList`에 `onEndReached`/`hasMore`/`isFetchingMore`
6. 삭제·등록 후 `invalidateQueries({ queryKey: lessonKeys.refSets() })`는 prefix라 infinite여도 유효

**캐시 형태 주의**: 지금은 `useRegisterRefSetMutation`이 `getQueryData<RefSetListData>(lessonKeys.refSets())`로 `cached.list`를 본다. infinite로 바꾸면 `{ pages, pageParams }`가 되므로 중복 방지 로직을 `pages.flatMap(p => p.list)`로 함께 고쳐야 한다.

### 4.3 Phase B 완료 기준

- [x] `GET /api/v1/library-items` 기반 `useInfiniteQuery` (`page=0`, `size=10`, `hasNext`) 구현
- [x] `LessonMyPage` 하단 센티널 진입 시 다음 페이지 목록 append
- [x] 삭제/등록 후 infinite 캐시 형태에서도 중복 방지/일관성 유지

---

## 5. 하지 말 것

| 금지 | 이유 |
|------|------|
| 이번 작업에서 `serviceType` 값 변경/env 분리 | 추후 수정 필요. 출처 미정 |
| `GET /api/ref-set`에 임의 `pageNo` 쿼리 추가 | API 미지원. Phase B 대기 |
| 나의 자료 클라이언트 10건 슬라이스 | 서버 페이징이 아님. UX만 흉내 냄 |
| Page에 observer/infinite 로직 | FSD: Page는 조합만 |
| `ResourceCardList`에서 CMS/LMS fetch | feature UI. 훅은 Contents/MyPage |
| 목록을 내부 `overflow-y` 박스로 가두기 | 현재는 문서 스크롤. 레이아웃 변경은 비범위 |
| 필터 taxonomy ↔ CMS param 매핑 | 추가계획8 후속. 이번 비범위 |
| MOCK 경로 삭제 | 주석 보존 |

---

## 6. 변경 파일 (Phase A 완료)

| 파일 | 유형 | 핵심 변경 |
|------|------|-----------|
| `features/lesson/api/queries.ts` | **수정 완료** | `useCmsSetListQuery` → `useInfiniteQuery`. `pageNo=pageParam`. `serviceType` 주석(추후 수정 필요) |
| `features/lesson/api/cmsSetService.ts` | 유지 | `getCmsSetList` 시그니처 그대로 재사용 |
| `features/lesson/ui/ResourceCardList.tsx` | **수정 완료** | `onEndReached` / `hasMore` / `isFetchingMore` + 센티널 + 하단 로딩 |
| `widgets/lesson/LessonLibraryContents.tsx` | **수정 완료** | `pages.flatMap`, `fetchNextPage` 연결. `isFetching` 전체 로딩 제거 |
| `pages/lesson/LessonMyPage.tsx` | 유지 | Phase B까지 변경 없음 |
| `features/lesson/api/lmsRefSetService.ts` | 유지 | Phase B까지 쿼리 추가 없음 |

---

## 7. 확정·미확정

| # | 항목 | 상태 | 내용 |
|---|------|------|------|
| 1 | CMS `pageSize` | **확정** | `10` 유지. 하단 스크롤 시 다음 10건 |
| 2 | CMS `pageNo` | **확정** | 0부터. 스크롤마다 +1 |
| 3 | 상한 | **확정** | 누적 건수 `>= totalCount` 이면 중단 |
| 4 | `serviceType: 131132` | **추후 수정 필요** | 이번 하드코딩 유지 |
| 5 | `brandId: 18` | 유지 | 이번 범위 밖 |
| 6 | 스크롤 root | **확정(현재 레이아웃)** | viewport. `MainLayoutV2` 문서 스크롤 |
| 7 | LMS 페이지 파라미터 | **미수신** | Phase B. 임의 쿼리 금지 |
| 8 | 필터→CMS 매핑 | 미적용 | 추가계획8과 동일 |

---

## 8. 완료 기준

### Phase A (CMS — 구현 완료)

- [x] 자료실 진입 시 `pageNo=0&pageSize=10` 1회
- [x] 하단 도달 시 `pageNo=1` 추가 호출. 기존 카드 유지한 채 10건 append
- [x] 누적 건수가 `totalCount`에 도달하면 추가 호출 없음
- [x] 필터/정렬 변경 시 page 0부터 재조회 (이어 붙이지 않음)
- [x] 다음 페이지 로딩이 목록 전체를 스켈레톤/갱신바로 바꾸지 않음
- [x] `serviceType: 131132` 하드코딩 유지 + 추후 수정 필요 주석
- [x] `npx tsc -b --noEmit`, eslint 통과 (`no-unused-vars` 제외)

### Phase B (LMS — 스펙 대기)

- [x] 섹션 4.3. 추가계획13 Phase B: `GET /api/v1/library-items` 무한 스크롤 구현 완료

---

**작성일**: 2026-08-18  
**수정**: 2026-08-19 — Phase B LMS 새 API 정보 추가  
**상태**: Phase A 구현 완료 / Phase B 추가계획14 마이그레이션 후 진행

---


# 추가계획14 — 옛 LMS API(`/api/ref-set`) → 새 API(`/api/v1/library-items`) 마이그레이션

> **상태**: Phase 1 구현 완료 (2026-08-20) · Phase 2(페이지네이션) 구현 완료  
> **선행**: 없음 (독립)  
> **후행**: 추가계획13 Phase B (나의 자료 페이지네이션), 추가계획11 Phase B (활동 생성)  
> **범위**: `lmsRefSetService.ts`의 옛 API 호출을 새 API로 교체. **`LessonEditorPage.handleSaved`는 `libraryItemId` 알면 PATCH-only, 모르면 POST(201 끝 / 200→PATCH fallback).** 나의 자료 「수정하기」는 navigate state로 `libraryItemId` 전달.
> **출처**: `superplatform-lms/docs/aihelper/as-is-to-be.md`, `docs/guide/api-spec.md`

---

## 1. 한 줄 요약

`/api/ref-set` → `/api/v1/library-items`. 응답 봉투 `resultData` → `data`. ID `refSetId` → `libraryItemId`. **신규 담기는 `POST`, 제목·썸네일 갱신은 `PATCH`.** 에러는 `errorCode`로 분기.

---

## 2. 변경 대상 분석

### 현재 사용 중인 옛 API (`lmsRefSetService.ts`)

| 함수 | 옛 엔드포인트 | 사용 위치 |
|------|-------------|-----------|
| `getRefSetList()` | `GET /api/ref-set` | `LessonMyPage` 나의 자료 목록 |
| `getRefSet(refSetId)` | `GET /api/ref-set/{refSetId}` | `DeployPage` 아이템 재조회 |
| `registerRefSet(body)` | `POST /api/ref-set` | `LessonEditorPage` 저장 시 등록 |
| `deleteRefSet(refSetId)` | `DELETE /api/ref-set/{refSetId}` | `LessonMyPage` 카드 삭제 |

### 새 API 매핑

| 옛 | 새 | 주요 변경 |
|----|-----|----------|
| `GET /api/ref-set` | `GET /api/v1/library-items` | 페이지네이션(`page`/`size`/`hasNext`) 추가. 검색(`keyword`)/라벨 필터 지원 |
| `GET /api/ref-set/{refSetId}` | `GET /api/v1/library-items/{libraryItemId}` | ID명 변경 |
| `POST /api/ref-set` | `POST /api/v1/library-items` | `refSetId` → `libraryItemId`. body 필드 확인 필요 |
| `DELETE /api/ref-set/{refSetId}` | `DELETE /api/v1/library-items/{libraryItemId}` | 동일 |
| — (신규) | `PATCH /api/v1/library-items/{libraryItemId}` | `alias`·`labels`·`options` 수정. **`lcmsSetId` 변경 불가** |

### 2.1 POST vs PATCH — 역할 분리 (스펙 확정)

| 동작 | 메서드 | 언제 | 서버 동작 |
|------|--------|------|-----------|
| **담기(신규)** | `POST /api/v1/library-items` | 보관함에 해당 `lcmsSetId`가 **없을 때** | `201 Created` — 새 `LibraryItem` 반환 |
| **멱등 담기** | `POST` (동일 body) | 이미 **활성** 상태로 담긴 `lcmsSetId` | `200 OK` — **기존 값 그대로**. body의 `alias`·`labels`·`options` **무시** |
| **메타 갱신** | `PATCH /api/v1/library-items/{libraryItemId}` | 이미 담긴 항목의 제목·썸네일 등 변경 | `200 OK` — 수정된 `LibraryItem` 반환 |

> **핵심**: 저작툴에서 **저장할 때마다 POST만 호출하면**, 두 번째 저장부터는 제목·썸네일이 LMS 나의 자료에 반영되지 않는다.  
> `useRegisterRefSetMutation`의 cache skip(중복 POST 생략)도 같은 문제 — **갱신 경로가 없음**.

### 2.2 요청 body 필드 매핑 (옛 → 새)

| 옛 (`POST /api/ref-set`) | 새 | 비고 |
|--------------------------|-----|------|
| `lcmsSetId` | `lcmsSetId` | POST 필수. PATCH body에 넣으면 `400 UNKNOWN_PARAMETER` |
| `options.title` | **`alias`** | **최상위 필드로 이동**. `?keyword=` 검색 대상 |
| `options.thumbnailUrl` | `options.thumbnailUrl` | store-and-echo 유지 |
| `makeMethod` | **(없음)** | 새 API 코어 필드 아님. 필요 시 `options.makeMethod`로 echo만 (스펙 미정) |
| — | `labels` | 선택. Phase 1에서는 미전송 |

**POST 예시** (`api-spec.md`):

```jsonc
{
  "lcmsSetId": "set-456",
  "alias": "3단원 형성평가",
  "options": { "thumbnailUrl": "https://..." }
}
```

**PATCH 예시** — 보낸 필드만 교체. `options`는 **객체 전체 교체**:

```jsonc
{
  "alias": "새 이름",
  "options": { "thumbnailUrl": "https://..." }
}
```

---

## 3. 봉투·에러 변경

### 응답 봉투

| 항목 | 옛 (as-is) | 새 (to-be) |
|------|-----------|-----------|
| 봉투 타입 | `{ success, resultCode, resultMessage, resultData }` | `{ success, message, data, errorCode }` |
| 언랩 키 | `resultData` | `data` |
| 에러 분기 | `resultCode` / HTTP status | `errorCode` (26종) |

### 현재 `lmsFetch` (변경 필요)

```ts
// 현재 — 옛 봉투
interface LmsEnvelope<T> {
  success: boolean;
  resultCode: number;
  resultMessage: string;
  resultData: T;        // ← 변경 대상
}

async function lmsFetch<T>(input, init): Promise<T> {
  // ...
  const json = await res.json() as LmsEnvelope<T>;
  if (!json.success) throw new Error(json.resultMessage ?? 'LMS API Error');
  return json.resultData;   // ← 변경 대상
}
```

### 변경 후 `lmsFetch`

```ts
// 새 봉투
interface LmsApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  errorCode: string | null;
}

async function lmsFetch<T>(input, init): Promise<T> {
  // ...
  const json = await res.json() as LmsApiResponse<T>;
  if (!json.success) {
    const err = new Error(json.message ?? 'LMS API Error');
    (err as any).errorCode = json.errorCode;
    throw err;
  }
  return json.data;
}
```

---

## 4. ID 필드 변경

| 옛 | 새 | 영향 범위 |
|----|-----|----------|
| `refSetId` | `libraryItemId` | `RefSetItem` 타입, `mapRefSetToLibItem`, `LessonMyPage` 삭제, `DeployPage` 재조회 |
| `refSetId` (함수 인자) | `libraryItemId` | `getRefSet()`, `deleteRefSet()` |
| `POST` 응답 `refSetId` | `libraryItemId` | `RegisterRefSetResponse` → `registerRefSet` mutation `onSuccess` |

---

## 5. BASE URL 변경

```ts
// 현재
const BASE = `${ENV.SP_LMS_API_URL}/api/ref-set`;

// 변경 후
const BASE = `${ENV.SP_LMS_API_URL}/api/v1/library-items`;
```

---

## 6. 구현 계획

### Phase 1 — `lmsFetch` 봉투 교체 + 경로 변경

1. `LmsEnvelope` → `LmsApiResponse` (봉투 타입)
2. `resultData` → `data`, `resultMessage` → `message` + `errorCode`
3. BASE 경로 `/api/ref-set` → `/api/v1/library-items`
4. ID 필드명 `refSetId` → `libraryItemId` (타입·함수·사용처)

### Phase 2 — 페이지네이션 적용 (추가계획13 Phase B와 합류)

1. `getRefSetList()` → `getLibraryItems({ page, size, keyword, labels })`
2. `useRefSetListQuery` → `useLibraryItemListQuery` (useInfiniteQuery)
3. `LessonMyPage` 무한 스크롤 적용

### Phase 1b — `handleSaved` POST/PATCH upsert (Phase 1과 동시 착수)

1. `createLibraryItem(body)` — POST
2. `updateLibraryItem(libraryItemId, body)` — PATCH
3. `useSyncLibraryItemOnSaveMutation()` — 저장 시 upsert (§11 참조)
4. `LessonEditorPage.handleSaved` — mutation 교체 + `libraryItemId` 상태 보관

### Phase 3 — 부가 기능 (선택)

1. 검색(`keyword`), 라벨 필터 적용
2. `makeMethod`를 `options`에 echo할지 여부 결정

---

## 7. 영향 파일

| 파일 | 변경 내용 |
|------|----------|
| `features/lesson/api/lmsLibraryItemService.ts` | **구현 완료** — 봉투·경로·ID·POST/PATCH/DELETE |
| `features/lesson/api/queries.ts` | **구현 완료** — `useSyncLibraryItemOnSaveMutation` upsert |
| `features/lesson/index.ts` | **구현 완료** — export 갱신 |
| `pages/lesson/LessonMyPage.tsx` | **구현 완료** — `libraryItemId` 사용처 |
| `pages/lesson/LessonDeployPage.tsx` | **구현 완료** — `getLibraryItem` / `useLibraryItemQuery` |
| `pages/lesson/LessonEditorPage.tsx` | **구현 완료** — `useSyncLibraryItemOnSaveMutation` (POST/PATCH 분기, §11) |

---

## 8. 절대 규칙 (새 API 연동 시)

> `superplatform-lms/docs/aihelper/ai-연동-작업지침.md` § 1 참조

1. **참조-only**: LMS는 정답·문항 본문을 저장하지 않는다. CMS 키(`lcmsSetId`)만 참조
2. **CMS 키는 문자열**: 숫자 auto-increment PK를 `lcmsSetId`로 쓰지 않는다
3. **신원은 토큰에서만**: `sub`·`client_id`를 body로 보내지 않는다
4. **응답 봉투 언랩**: `data`만 꺼낸다
5. **스펙에 없는 파라미터 = 400**: 필드를 지어내지 않는다
6. **서비스 고유 값은 `options` JSON**: 코어 필드로 올리지 않는다

---

## 9. 확정·미확정

| # | 항목 | 상태 | 내용 |
|---|------|------|------|
| 1 | 새 경로 | **확정** | `/api/v1/library-items` |
| 2 | 새 봉투 | **확정** | `{ success, message, data, errorCode }` |
| 3 | ID명 | **확정** | `libraryItemId` |
| 4 | 페이지네이션 | **확정** | `page`/`size`/`hasNext` |
| 5 | 에러코드 | **확정** | 26종 `errorCode` |
| 6 | POST body | **확정** | `lcmsSetId`(필수), `alias`, `labels`, `options` |
| 7 | PATCH body | **확정** | `alias`, `labels`, `options` — `lcmsSetId` 금지 |
| 8 | POST 멱등 | **확정** | 이미 있으면 `200` + 기존값. **덮어쓰지 않음** → 갱신은 PATCH |
| 9 | `makeMethod` | **미확정** | 새 API 코어 필드 없음. `options` echo 여부는 product 결정 |
| 10 | editor navigate state | **확정** | `{ libraryItemId }` — PATCH-only 진입. 없으면 POST fallback |

---

## 10. 완료 기준

- [x] `lmsRefSetService.ts` → `lmsLibraryItemService.ts` 새 경로·봉투·ID 교체 완료
- [x] 기존 기능(목록 조회, 단건 조회, 등록, 삭제) 정상 동작
- [x] **`handleSaved`: `libraryItemId` 있으면 PATCH-only, 없으면 POST → 200 시 PATCH fallback**
- [x] **나의 자료 → 수정하기: navigate state `{ libraryItemId }` 전달**
- [x] **신규 저장 후 replace navigate: `onSuccess`에서 state에 `libraryItemId` 포함**
- [x] 응답 `data` 언랩 확인 (`LmsApiResponse` → `json.data`)
- [x] 에러 발생 시 `errorCode` 전달 (`LmsApiError`)
- [x] `npx tsc -b --noEmit`, eslint 통과 (`no-unused-vars` 제외)
- [x] (Phase 2) 페이지네이션 적용 → 추가계획13 Phase B와 합류

---

## 12. 구현 결과 (2026-08-20)

### 12.1 변경 파일

| 파일 | 내용 |
|------|------|
| `api/lmsLibraryItemService.ts` | GET/POST/PATCH/DELETE. `createLibraryItem` → `{ item, created }` (HTTP 201/200 구분) |
| `api/lmsRefSetService.ts` | **삭제** |
| `api/queries.ts` | `useSyncLibraryItemOnSaveMutation` — PATCH-only / POST fallback |
| `api/queryKeys.ts` | `libraryItems` / `libraryItem` 키 |
| `model/mapLibraryItemToLibItem.ts` | `alias`→title, `libraryItemId` |
| `model/types.ts` | `LibItem.libraryItemId`, `LessonEditorPageLocationState`, `DeployPageLocationState` |
| `pages/lesson/LessonEditorPage.tsx` | `location.state.libraryItemId` 초기화 · `onSuccess` replace navigate |
| `pages/lesson/LessonMyPage.tsx` | 새 훅·mapper 연동 |
| `ui/ResourceCard.tsx` | 수정하기 navigate 시 `{ libraryItemId }` state 전달 |
| `ui/DeployPage.tsx` | `useLibraryItemQuery`, route param `libraryItemId` |
| `app/router/routes.tsx` | `/lesson/deploy/:setId/:libraryItemId` |
| `features/lesson/index.ts` | export 갱신 |

### 12.2 `libraryItemId` 확보 — navigate state (1차)

**타입** (`model/types.ts`):

```ts
export type LessonEditorPageLocationState = {
  libraryItemId?: string;
};
```

**ResourceCard 「수정하기」** — `libraryItemId`가 있으면 state로 전달:

```ts
navigate(`/lesson/editor/${item.id}${location.search}`, {
  state: item.libraryItemId ? { libraryItemId: item.libraryItemId } : undefined,
});
```

**LessonEditorPage** — 마운트 시 state에서 초기화:

```ts
const [libraryItemId, setLibraryItemId] = useState<string | null>(() => {
  const state = location.state as LessonEditorPageLocationState | null;
  return state?.libraryItemId ?? null;
});
```

| 진입 경로 | navigate state | 첫 저장 API |
|-----------|----------------|-------------|
| 나의 자료 → 수정하기 | `{ libraryItemId }` | **PATCH만** |
| `/lesson/editor` 신규 | 없음 | POST |
| URL 직접 접근 / 새로고침 | **유실** | POST (fallback) |

> Route param `:setId`는 **CMS `lcmsSetId`**. `libraryItemId`(UUID)는 **state 또는 page state**로만 전달한다.

### 12.3 `useSyncLibraryItemOnSaveMutation` 동작

**`libraryItemId` lookup 우선순위** (GET 호출 없음):

1. mutation input `libraryItemId` — page state (navigate state 또는 이전 저장 `onSuccess`)
2. React Query cache — `lessonKeys.libraryItems()` 목록에서 `lcmsSetId` 매칭 (보조)

```
libraryItemId 알고 있음?
  └─ YES → PATCH { alias, labels?, options }

  └─ NO  → POST { lcmsSetId, alias, labels?, options }
             ├─ 201 (created) → 끝 (body 반영됨)
             └─ 200 (이미 담김) → PATCH { alias, labels?, options }  ← URL 직접 접근 fallback
```

성공 시 `lessonKeys.libraryItems()` invalidate.

### 12.4 신규 저장 후 URL 변경 — state 유지

`/lesson/editor` → `/lesson/editor/:lcmsSetId` 는 **서로 다른 Route**라 컴ponent **리마운트**된다.  
`replace` navigate를 **`onSuccess` 안**에서 실행하고, 응답 `libraryItemId`를 state에 실어 보낸다:

```ts
onSuccess: (item) => {
  setLibraryItemId(item.libraryItemId);
  if (!routeSetId && p.lcmsSetId) {
    navigate(`/lesson/editor/${p.lcmsSetId}${location.search}`, {
      replace: true,
      state: { libraryItemId: item.libraryItemId },
    });
  }
},
```

이후 저장은 POST 없이 **PATCH-only**.

### 12.5 Phase 2 구현 결과

- (완료) `getLibraryItemList` → `useInfiniteQuery` (page 기반 infinite)
- (완료) `LessonMyPage` `hasMore` / `onEndReached` 연동

---

## 11. `LessonEditorPage.handleSaved` 개선 분석

> **상태**: 구현 완료 (2026-08-20)  
> **대상**: `pages/lesson/LessonEditorPage.tsx`, `features/lesson/api/queries.ts`, `ui/ResourceCard.tsx`

### 11.1 AS-IS (마이그레이션 전 — 참고용)

옛 구현은 POST만 사용 + cache skip으로 두 번째 저장부터 LMS 메타가 stale해지는 문제가 있었다. (상세는 초안 §11.2)

### 11.2 TO-BE 흐름 (구현됨)

```
[진입]
ResourceCard 수정하기 ── state: { libraryItemId? } ──▶ LessonEditorPage
  └─ useState(() => location.state?.libraryItemId ?? null)

[저장 onSaved(p)]
  guard: !p.lcmsSetId || !p.title → return
  syncLibraryItem({ lcmsSetId, alias, labels?, options: { thumbnailUrl? }, libraryItemId })
    ├─ libraryItemId 있음 (state / cache) → PATCH
    └─ libraryItemId 없음 → POST
          ├─ 201 → 끝
          └─ 200 → PATCH (fallback)
  onSuccess:
    setLibraryItemId(item.libraryItemId)
    !routeSetId → replace navigate + state: { libraryItemId }
    manual trigger → savedOpen 모달
```

### 11.3 `libraryItemId` lookup (확정 — GET 없음)

| 우선순위 | 출처 | 용도 |
|---------|------|------|
| 1 | navigate `location.state.libraryItemId` | 나의 자료 → 수정하기 |
| 2 | page `libraryItemId` state | 동일 세션 2번째 저장 이후 |
| 3 | React Query cache (`libraryItems` 목록) | state 없어도 목록 cache hit 시 PATCH-only |
| — | POST 응답 `item.libraryItemId` | **fallback** — URL 직접 접근·새로고침 |

~~GET `/library-items?lcmsSetIds=`~~ — **사용하지 않음**. POST가 membership + id 확보를 담당.

### 11.4 구현 코드 (현행)

**Mutation** (`queries.ts`):

```ts
const knownId = resolveKnownLibraryItemId(queryClient, input.lcmsSetId, input.libraryItemId);
if (knownId) return updateLibraryItem(knownId, { alias, labels?, options });

const { item, created } = await createLibraryItem({ lcmsSetId, alias, labels?, options });
if (created) return item; // 201
return updateLibraryItem(item.libraryItemId, { alias, labels?, options }); // 200 fallback
```

**Page** (`LessonEditorPage.tsx`):

```ts
const [libraryItemId, setLibraryItemId] = useState<string | null>(() =>
  (location.state as LessonEditorPageLocationState | null)?.libraryItemId ?? null,
);

syncLibraryItem({ lcmsSetId, alias, labels?, options: { thumbnailUrl? }, libraryItemId }, {
  onSuccess: (item) => {
    setLibraryItemId(item.libraryItemId);
    if (p.trigger === 'manual') setSavedOpen(true);
    if (!routeSetId && p.lcmsSetId) {
      navigate(`/lesson/editor/${p.lcmsSetId}${location.search}`, {
        replace: true,
        state: { libraryItemId: item.libraryItemId },
      });
    }
  },
});
```

**ResourceCard**:

```ts
navigate(`/lesson/editor/${item.id}${location.search}`, {
  state: item.libraryItemId ? { libraryItemId: item.libraryItemId } : undefined,
});
```

### 11.5 `mapRefSetToLibItem` 연동

| 옛 | 새 |
|----|-----|
| `options?.title` | `item.alias ?? ''` |
| `refSetId` | `libraryItemId` |
| `makeMethod` | 제거 또는 `options?.makeMethod` |

### 11.6 `trigger`별 UX

| `trigger` | LMS 동작 | UI |
|-----------|----------|-----|
| `auto` | POST 또는 PATCH (동일 upsert) | 모달 없음 |
| `manual` | POST 또는 PATCH (동일 upsert) | 성공 시 `savedOpen` 모달 |

자동·수동 저장 모두 **메타 동기화**는 동일. 차이는 모달 표시뿐.

### 11.7 엣지 케이스

| 케이스 | 처리 |
|--------|------|
| 나의 자료 → 수정하기 | navigate state `{ libraryItemId }` → **PATCH-only** (POST 생략) |
| `/lesson/editor` 신규 첫 저장 | POST **201** → `onSuccess`에서 replace navigate + state |
| URL 직접 접근 / 새로고침 | state 유실 → POST. **200**이면 응답 id로 PATCH (fallback) |
| 신규 저장 후 리마운트 | `onSuccess` replace navigate에 `state: { libraryItemId }` → PATCH-only 유지 |
| 나의 자료에서 삭제 후 재저장 | POST **201** (복원) |
| `options` PATCH | **전체 교체** — 현재 `LessonEditorPage`에서 `options.thumbnailUrl`만 채움 |

---

**작성일**: 2026-08-19 (초안) · **갱신**: 2026-08-20 (Phase 1 + navigate state PATCH-only)  
**상태**: Phase 1 구현 완료 · Phase 2(페이지네이션) 구현 완료

---

# 추가계획15 — LessonResultPage 수업 결과보기 UI 구현

> **준수**: `frontend/AGENTS.md` (FSD Lite, Emotion, 서버/로컬 상태 분리)  
> **프로토타입 참조**: UI/동작만. 코드 구조·Tailwind 복제 금지

## 1. 목표

`prototype/src/features/resources/components/report/ResultsView.tsx`의 화면 구성을  
`frontend/src/pages/lesson/LessonResultPage.tsx`의 `ContentsHeader` 아래에 동등하게 구현한다.

구현 대상은 `ResultsView` 중 **현황 + 목록 화면** (`rdReport`가 없는 경우의 브랜치):

```
ContentsHeader (기존 — 제목 + 설명 문구)
├── StatusPanel   ← 학습현황 패널 (숫자 타일 3개 + 미제출 학생 목록)
├── ReportFilterChips ← 상태 필터 칩 (전체 / 진행중 / 진행예정 / 완료)
└── ReportCardGrid    ← 리포트 카드 그리드
```

> `ReportDetail` (rdReport 상세 화면) 은 이번 범위에서 제외한다. **→ 추가계획17**.

## 2. 현황

`LessonResultPage.tsx`에 `ContentsHeader`(제목·설명)만 존재하며, 그 아래에 아무것도 없다.

## 3. 프로토타입 → frontend 변환 기준

| prototype | frontend 변환 방향 |
|-----------|-------------------|
| Tailwind 클래스로 스타일 | Emotion `styled` 또는 인라인 `css` prop |
| `useResources()` Context (scope, rsFilter 등) | API 준비 전이므로 로컬 상태(`useState`)로 대체. 추후 API 연동 시 React Query로 전환 |
| `scopedReports(scope)` 목업 데이터 | 빈 배열(`[]`) 또는 목업 타입만 정의. 실제 API 연동은 후속 계획으로 분리 |
| `lucide-react` 아이콘 | 기존 프로젝트에서 사용 중이면 그대로 사용, 아니면 동등한 공통 아이콘 대체 |
| Tailwind 색상 토큰(`primary-*`, `amber-*` 등) | `app/styles/theme.ts` 토큰 우선. 없는 토큰은 가장 가까운 기존 토큰으로 대응 |

## 4. FSD 배치

```text
pages/lesson/LessonResultPage.tsx         ← 라우트 조합 (ContentsHeader + 3개 섹션 조합)
widgets/lesson-result/
  ├── StatusPanel.tsx                     ← 학습현황 패널 (숫자 타일 + 미제출 학생)
  ├── ReportFilterChips.tsx               ← 상태 필터 칩
  └── ReportCardGrid.tsx                  ← 카드 그리드 + 빈 상태
features/lesson-result/                   ← (향후 API 연동 시 query/model 위치)
```

`AGENTS.md` 아키텍처 규칙에 따라:
- `pages`는 조합만 담당하고 styled component를 최소화한다.
- 복잡한 UI 조각은 `widgets/lesson-result/` 아래에 위치시킨다.

## 5. UI 스펙 (프로토타입 동등)

### 5.1 StatusPanel

- 최상단에 `TrendingUp` 아이콘 + "전체 학습현황" 제목 (향후 반 선택 시 "{반} 학습현황")
- 숫자 타일 3개 균등 배치:
  - 이번 주 진행 N건
  - 진행 중 활동 N건 (강조색 배경)
  - 미제출 N건
- 하단 미제출 학생 태그 목록 (높이 고정, 넘치면 내부 스크롤)
  - 학생 태그 클릭 시 선택/해제 토글
  - 선택 시 `ReportFilterChips`를 "진행중"으로 자동 전환
  - 학생 태그 선택 상태는 `LessonResultPage`에서 `highlightStudent` 로컬 상태로 소유

### 5.2 ReportFilterChips

- 필터 값: `전체` / `진행중` / `진행예정` / `완료`
- 각 칩에 해당 상태 활동 수 뱃지 표시
- 건수가 0이고 `전체`가 아니면 `disabled`
- 활성 칩은 primary 색상, 비활성은 기본 border 스타일

### 5.3 ReportCardGrid

- 빈 상태: 점선 테두리 박스 + "해당 상태의 수업 결과가 없습니다." 문구
- 데이터 있을 때: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` (반응형)
- 각 카드(`ReportCard`)에는:
  - 썸네일
  - 제목 (1줄 말줄임)
  - 상태 뱃지 (`진행중` / `진행예정` / `완료`) + 반 뱃지
  - 날짜 범위 + 참여 N/배정 N명 (진행예정이면 "시작 전")
  - "리포트" 버튼 (향후 상세 화면 진입)
  - `highlightStudent`가 미제출인 카드에 amber 테두리 강조

## 6. 상태 관리 방침

`AGENTS.md` 상태 배치 우선순위에 따라:

| 상태 | 배치 | 이유 |
|------|------|------|
| `highlightStudent` | `LessonResultPage` 로컬 상태 | StatusPanel ↔ ReportCardGrid가 공유, API 상태 아님 |
| `rsFilter` (필터 선택) | `LessonResultPage` 로컬 상태 | 단일 페이지 내 UI 상태, URL 상태는 추후 고려 |
| 리포트 목록 데이터 | React Query (추후 API 연동 시) | 현재는 빈 배열 목업으로 대체 |

> `useResources()` Context는 prototype 전용이며 frontend에 가져오지 않는다.  
> 필요한 상태는 props로 전달하거나, 추후 API 연동 시 React Query로 대체한다.

## 7. 타입 정의

API 연동 전까지 임시 타입을 `widgets/lesson-result/types.ts` 또는 인라인으로 정의한다.

```ts
export type RsFilter = '전체' | '진행중' | '진행예정' | '완료';

export interface ReportItem {
  id: string;
  title: string;
  rstatus: '진행중' | '진행예정' | '완료';
  cls: string;        // 반 이름
  start: string;      // ISO 날짜
  end: string;        // ISO 날짜
  thumb?: string;
  students: Array<{
    studentId: string;
    studentName: string;
    statusCd: number; // 2: 미제출, 3: 제출, 5: 완료
  }>;
}
```

## 8. 하지 말 것

- prototype의 `useResources()` Context나 `scopedReports()` 유틸을 그대로 복사하지 않는다.
- Tailwind 클래스를 frontend에 사용하지 않는다 (`className="mt-5 grid-cols-3 ..."` 금지).
- 임의 hex 색상(`#F59E0B` 등)을 흩뿌리지 않고 `theme.ts` 토큰을 우선 사용한다.
- `ReportDetail` (상세 화면)은 이번 구현 범위에 포함하지 않는다. **→ 추가계획17**.
- `any` 타입을 사용하지 않는다.
- 요청과 무관한 기존 코드를 리팩터링하지 않는다.

## 9. 구현 순서 (체크리스트)

- [x] `widgets/lesson-result/` 디렉터리 생성 및 타입 정의
- [x] `StatusPanel.tsx` — 숫자 타일 + 미제출 학생 태그 (Emotion)
- [x] `ReportFilterChips.tsx` — 필터 칩 (Emotion)
- [x] `ReportCard.tsx` — 단일 카드 (Emotion)
- [x] `ReportCardGrid.tsx` — 그리드 + 빈 상태 (Emotion)
- [x] `LessonResultPage.tsx` — `highlightStudent` / `rsFilter` 상태 추가, 위젯 조합
- [x] `npx tsc -b --noEmit` + `npx eslint <변경 파일>` 통과 확인

## 10. 완료 기준

- `LessonResultPage` 진입 시 `ContentsHeader` 아래에 StatusPanel → ReportFilterChips → ReportCardGrid 순으로 렌더된다.
- 빈 데이터 상태에서 각 섹션이 정상적으로 렌더된다 (빈 상태 메시지 표시).
- TypeScript 에러 없음, ESLint 에러 없음.
- prototype 화면과 레이아웃·문구·상호작용이 동등함을 육안으로 확인한다.

## 11. 참고 파일

| 역할 | 경로 |
|------|------|
| 프로토타입 결과보기 뷰 | `prototype/src/features/resources/components/report/ResultsView.tsx` |
| 프로토타입 StatusPanel | `prototype/src/features/resources/components/report/StatusPanel.tsx` |
| 프로토타입 ReportFilterChips | `prototype/src/features/resources/components/report/ReportFilterChips.tsx` |
| 프로토타입 ReportCardGrid | `prototype/src/features/resources/components/report/ReportCardGrid.tsx` |
| 프로토타입 ReportCard | `prototype/src/features/resources/components/report/ReportCard.tsx` |
| 구현 대상 페이지 | `frontend/src/pages/lesson/LessonResultPage.tsx` |
| 아키텍처 지침 | `frontend/AGENTS.md` |
| 테마 토큰 | `frontend/src/app/styles/theme.ts` |

---

**작성일**: 2026-08-26  
**상태**: 구현 완료 (2026-08-26)

## 12. 구현 결과 (2026-08-26)

### 신규 파일

| 파일 | 역할 |
|------|------|
| `src/widgets/lesson-result/types.ts` | `RsFilter`, `ReportStatus`, `ReportStudent`, `ReportItem` 타입 |
| `src/widgets/lesson-result/StatusPanel.tsx` | 학습현황 패널 (숫자 타일 3개 + 미제출 학생 태그) |
| `src/widgets/lesson-result/ReportFilterChips.tsx` | 상태 필터 칩 (전체/진행중/진행예정/완료) |
| `src/widgets/lesson-result/ReportCard.tsx` | 리포트 카드 (썸네일·뱃지·날짜·버튼) |
| `src/widgets/lesson-result/ReportCardGrid.tsx` | 반응형 카드 그리드 + 빈 상태 |
| `src/widgets/lesson-result/index.ts` | 위젯 barrel export |

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/lesson/LessonResultPage.tsx` | `highlightStudent` / `rsFilter` 로컬 상태 추가, 3개 위젯 조합 |

### 검증 결과

- `npx tsc -b --noEmit` — 에러 없음
- `npx eslint` — 에러 없음 (Prettier 포맷팅 `--fix` 적용)

### 비고

- 현재 `EMPTY_REPORTS = []`로 빈 데이터 상태. 추후 API 연동 시 React Query 훅으로 교체.
- `ReportDetail` (상세 화면) 은 이번 범위에서 제외됨. **→ 추가계획17**.

---

# 추가계획16 — LessonResultPage API 연동 (StatusPanel + ReportCardList)

> **선행**: 추가계획15 (LessonResultPage UI 구현) 완료 후 진행  
> **준수**: `frontend/AGENTS.md` (FSD Lite, Emotion, React Query, 서버/로컬 상태 분리)  
> **API 참조**: `GET /api/v1/activities` (superplatform-lms)

---

## 1. 목표

추가계획15에서 빈 배열(`EMPTY_REPORTS = []`)로 구현된 `StatusPanel`과 `ReportCardList`(현재 `ReportCardGrid`)를  
`GET /api/v1/activities` API와 연동해 실제 데이터를 표시한다.

---

## 2. API 분석 — `GET /api/v1/activities`

### 2.1 사용 가능한 Query Parameters

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `keyword` | string | 제목 부분 일치, 대소문자 무시 |
| `lifecycleStatus` | enum | `DRAFT` / `PUBLISHED` / `CLOSED` (저장된 상태) |
| `availability` | enum | `NOT_AVAILABLE` / `NOT_STARTED` / `OPEN` / `CLOSED` (계산된 상태, 매 요청마다 서버 계산) |
| `from` | ISO-8601 | 만든 시각 기준 `[from, to)`. 참여 가능 기간이 아님 |
| `to` | ISO-8601 | 만든 시각 기준 `[from, to)`. 참여 가능 기간이 아님 |
| `openFrom` | ISO-8601 | 참여 가능 기간이 이 구간과 겹치는 활동 |
| `openTo` | ISO-8601 | 참여 가능 기간이 이 구간과 겹치는 활동 |
| `lcmsSetIds` | string | 반복 파라미터, OR 매칭 |
| `labels` | string[] | 반복 파라미터, AND 매칭 |
| `page` | int | 0부터 (기본 `0`) |
| `size` | int | 최대 100 (기본 `20`) |
| `sort` | string | `createdAt` / `updatedAt` / `title` / `id` + `,asc\|desc` |
| `withTotal` | boolean | `true`일 때만 `totalElements`·`totalPages` 포함 |

### 2.2 응답 타입

```ts
// PageResponse<ActivitySummary>
interface PageResponse<T> {
  content: T[];
  page: number;        // 0-based
  size: number;
  hasNext: boolean;    // 다음 페이지 존재 여부
  totalElements?: number; // withTotal=true일 때만
  totalPages?: number;    // withTotal=true일 때만
}

interface ActivitySummary {
  // id, title, lifecycleStatus, availability, openAt, closeAt, createdAt 등
  // items[] 는 없음 (목록 최적화)
  availability: 'NOT_AVAILABLE' | 'NOT_STARTED' | 'OPEN' | 'CLOSED';
  // ... 기타 필드
}
```

> **주의**: 목록 응답에는 `items[]`(문항 목록)가 없다. 문항이 필요하면 단건 조회를 사용한다.  
> **주의**: `availability`는 계산값이라 저장되지 않는다. 시간이 지나면 저절로 바뀐다.

---

## 3. StatusPanel API 연동 분석

### 3.1 이번 주 진행 (이번 주 배포 건수)

**API 호출**

```
GET /api/v1/activities?openFrom=<주_시작_ISO>&openTo=<주_끝_ISO>&withTotal=true&size=1
```

- `openFrom`: 이번 주 월요일 00:00:00 (UTC 변환)
- `openTo`: 다음 주 월요일 00:00:00 (UTC 변환, exclusive)
- `withTotal=true`: `totalElements` 포함
- `size=1`: 건수만 필요하므로 실제 데이터는 최소화

**응답에서 사용할 값**: `totalElements`

> `openFrom`/`openTo`는 "참여 가능 기간이 이 구간과 겹치는 활동"을 필터링한다.  
> `from`/`to`(생성 시각 기준)와 달리, 이번 주에 실제로 배포되어 참여 가능한 활동 수를 조회할 수 있다.

**주 범위 계산 (프론트엔드)**

```ts
const getThisWeekRange = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=일, 1=월, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  return {
    openFrom: monday.toISOString(),
    openTo: nextMonday.toISOString(),
  };
};
```

### 3.2 진행 중 활동

**API 호출**

```
GET /api/v1/activities?availability=OPEN&withTotal=true&size=1
```

**응답에서 사용할 값**: `totalElements`

- `size=1`: 건수만 필요
- ReportCardList의 "진행중" 탭과 데이터는 공유하지 않는다 (ReportCardList는 별도 무한스크롤 쿼리)

### 3.3 미제출 / 미제출 학생 목록 — 보류

**미제출 학생 수**를 구하려면 각 OPEN 활동마다 `GET /api/v1/activities/{id}/progress`를 별도 호출해야 한다.

- `ActivityProgress.rows`에서 `status !== 'SUBMITTED'` 인 학생이 미제출에 해당
- `assignedCount`는 `ASSIGNED` 활동에만 존재하며 `OPEN` 활동에는 아예 없음 → 모집단 파악 불가
- 진행중 활동 N개 × 1회 API 호출 → 성능 이슈

**결론**: 단일 API로 미제출 학생 수를 집계하는 방법이 없으므로 **구현 보류**.  
`StatusPanel`의 "미제출 N건" 타일과 "미제출 학생" 태그 목록은 API 연동 전까지 현행(목업/빈 상태) 유지.

---

## 4. ReportCardList API 연동 분석

### 4.1 필터 매핑

| UI 필터 (`RsFilter`) | API `availability` 파라미터 |
|---|---|
| `'전체'` | 파라미터 미지정 (전체 조회) |
| `'진행중'` | `availability=OPEN` |
| `'진행예정'` | `availability=NOT_STARTED` |
| `'완료'` | `availability=CLOSED` |

### 4.2 클라이언트 필터링 vs. 서버 필터링 — 효율 판단

**옵션 A: 서버 필터링 (필터별 API 호출)**  
필터 탭 전환 시 `availability` query param을 달리해서 API를 새로 호출한다.

| 항목 | 내용 |
|---|---|
| 무한스크롤 호환성 | 탭별로 독립적인 `page` 기준을 유지할 수 있어 자연스럽게 호환됨 |
| 데이터 정확성 | 각 필터에 해당하는 항목만 정확히 가져옴 |
| 탭 전환 비용 | 탭 전환마다 API 호출. React Query 캐싱으로 재전환 시 빠름 |
| 탭별 카운트 표시 | `withTotal=true` 추가 시 가능하나 쿼리 비용 증가 |

**옵션 B: 클라이언트 필터링 (한 번에 전체 조회 후 `availability` 필드로 분기)**  
한 번에 전체를 가져와서 `content[].availability` 값으로 클라이언트에서 분기한다.

| 항목 | 내용 |
|---|---|
| 무한스크롤 호환성 | **충돌함.** 예: `size=20`으로 가져왔을 때 진행중 0건이어도 다음 페이지에는 있을 수 있음 → 빈 탭인데 실제 데이터가 있는 상황 발생 |
| 데이터 정확성 | 현재 페이지 범위 내에서만 필터링되어 부정확 |
| 구현 단순성 | 쿼리 하나로 단순하나 페이지네이션과 조합이 복잡해짐 |

**결론: 옵션 A (서버 필터링)** 채택.  
무한스크롤(추가계획13 패턴)과 호환성이 필수적이므로, 필터별 `availability` query param을 달리해서 API를 호출한다.  
React Query의 `queryKey`에 필터값을 포함시켜 필터 전환 시 독립적인 캐시로 관리한다.

### 4.3 무한스크롤 (추가계획13 패턴 동일 적용)

`useInfiniteQuery` 기반. 추가계획13의 `useCmsSetListQuery` 구현과 동일한 패턴을 사용한다.

**종료 조건**: `PageResponse.hasNext === false`

```ts
// 개념 코드 (실제 구현 시 features/lesson-result/ 하위에 위치)
export function useActivityListQuery(filter: RsFilter) {
  const availability = filterToAvailability(filter); // filter → availability enum 변환

  return useInfiniteQuery({
    queryKey: ['activities', filter],
    queryFn: ({ pageParam, signal }) =>
      getActivities({ availability, page: pageParam, size: 20 }, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    placeholderData: keepPreviousData,
  });
}
```

**스크롤 센티널**: `IntersectionObserver` + 하단 센티널 엘리먼트. 추가계획13 `ResourceCardList` 구현 참조.

**필터 변경 시**: `queryKey`에 `filter`가 포함되어 있으므로 자동으로 page 0부터 재조회됨.

---

## 5. 타입 변경 계획

현재 `ReportItem` 타입은 목업용으로 정의되어 있다. API 연동 후에는 `ActivitySummary`로 교체한다.

```ts
// 현재 목업 타입 (widgets/lesson-result/types.ts)
export interface ReportItem {
  id: string;
  title: string;
  rstatus: '진행중' | '진행예정' | '완료';
  cls: string;
  start: string;
  end: string;
  thumb?: string;
  students: Array<{ studentId: string; studentName: string; statusCd: number }>;
}

// API 연동 후 대체 타입 (ActivitySummary 기반, 실제 필드는 API 응답 확인 후 결정)
export interface ActivitySummaryItem {
  id: string;
  title: string;
  availability: 'NOT_AVAILABLE' | 'NOT_STARTED' | 'OPEN' | 'CLOSED';
  openAt?: string;
  closeAt?: string;
  createdAt: string;
  // ... API 응답의 실제 필드
}
```

`ReportCard.tsx`도 `ActivitySummaryItem` 기반으로 수정 필요. 상세 필드는 실제 API 응답을 확인 후 결정한다.

---

## 6. FSD 배치

```text
features/lesson-result/
  ├── api/
  │   ├── queries.ts       ← useActivityListQuery, useThisWeekCountQuery, useRunningCountQuery
  │   ├── service.ts       ← getActivities() axios 호출
  │   └── types.ts         ← ActivitySummaryItem, ActivitiesParams 등 API 타입
widgets/lesson-result/
  ├── StatusPanel.tsx      ← useThisWeekCountQuery, useRunningCountQuery 연결
  ├── ReportCardList.tsx   ← useActivityListQuery + 무한스크롤 연결
  └── types.ts             ← 목업 타입 → API 타입으로 교체
```

---

## 7. 구현 순서 (체크리스트)

- [x] `features/lesson-result/api/types.ts` — `ActivitySummaryItem`, `ActivitiesParams`, `ActivitiesResponse` 타입 정의
- [x] `features/lesson-result/api/service.ts` — `getActivities()` 서비스 함수
- [x] `features/lesson-result/api/queryKeys.ts` — `lessonResultKeys` 정의
- [x] `features/lesson-result/api/queries.ts` — `useThisWeekCountQuery`, `useRunningCountQuery`, `useActivityListQuery`
- [x] `features/lesson-result/index.ts` — barrel export
- [x] `widgets/lesson-result/types.ts` — `ReportItem` 제거, `RsFilter`만 유지
- [x] `widgets/lesson-result/ReportCard.tsx` — `ActivitySummaryItem` 기반 재작성, 썸네일 fallback 구현
- [x] `widgets/lesson-result/StatusPanel.tsx` — `reports` prop 제거, `useThisWeekCountQuery`·`useRunningCountQuery` 연결. 미제출 타일/학생 태그는 빈 상태 유지(보류)
- [x] `widgets/lesson-result/ReportFilterChips.tsx` — `reports` prop 제거, 탭별 건수 배지 제거
- [x] `widgets/lesson-result/ReportCardList.tsx` — `useActivityListQuery` + 무한스크롤(IntersectionObserver) 연결
- [x] `widgets/lesson-result/index.ts` — exports 업데이트
- [x] `pages/lesson/LessonResultPage.tsx` — `EMPTY_REPORTS` 제거, `reports` prop 전달 제거
- [x] `npx tsc -b --noEmit` + `npx eslint --fix` 통과 확인

---

## 8. 미결 사항

| 항목 | 내용 |
|---|---|
| 미제출 학생 | `GET /activities/{id}/progress` N회 호출 이슈. 집계 API 추가 또는 보류 유지 |
| `ActivitySummary` 실제 필드 | API 응답 실측 후 `ActivitySummaryItem` 타입 확정 필요 |
| 탭별 카운트 배지 | `ReportFilterChips`에 탭별 건수 표시 시 `withTotal=true` 추가 쿼리 필요 (현재 범위 외) |

---

**작성일**: 2026-08-26  
**상태**: 구현 완료 (2026-08-26)

## 9. 구현 결과 (2026-08-26)

### 신규 파일

| 파일 | 역할 |
|------|------|
| `src/features/lesson-result/api/types.ts` | `ActivitySummaryItem`, `ActivityAvailability`, `ActivitiesPageResponse`, `GetActivitiesParams` 타입 |
| `src/features/lesson-result/api/service.ts` | `getActivities()` — `GET /api/v1/activities` fetch 래퍼 |
| `src/features/lesson-result/api/queryKeys.ts` | `lessonResultKeys` 쿼리 키 팩토리 |
| `src/features/lesson-result/api/queries.ts` | `useThisWeekCountQuery`, `useRunningCountQuery`, `useActivityListQuery` |
| `src/features/lesson-result/index.ts` | features barrel export |

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/widgets/lesson-result/types.ts` | `ReportItem`·`ReportStudent`·`ReportStatus` 제거. `RsFilter`만 유지 |
| `src/widgets/lesson-result/ReportCard.tsx` | `ActivitySummaryItem` 기반 재작성. 썸네일 `imgFailed` fallback, availability → 상태 뱃지 매핑 |
| `src/widgets/lesson-result/StatusPanel.tsx` | `reports` prop 제거. `useThisWeekCountQuery`·`useRunningCountQuery` 내부 사용. 미제출은 빈 상태 유지 |
| `src/widgets/lesson-result/ReportFilterChips.tsx` | `reports` prop 제거. 탭별 건수 배지 제거 (보류) |
| `src/widgets/lesson-result/ReportCardList.tsx` | `useActivityListQuery` + `IntersectionObserver` 무한스크롤 연결. `Loading` 컴포넌트 로딩·갱신·추가 로딩 상태 표시 |
| `src/widgets/lesson-result/index.ts` | `ReportItem` export 제거 |
| `src/pages/lesson/LessonResultPage.tsx` | `EMPTY_REPORTS` 제거. `reports` prop 전달 제거 |

### 검증 결과

- `npx tsc -b --noEmit` — 에러 없음
- `npx eslint --fix` — 에러 없음 (Prettier 포맷팅 자동 수정)

---

# 추가계획17 — 리포트 상세 페이지 (`ReportDetail` UI)

> **선행**: 추가계획15 (목록 UI), 추가계획16 (`ReportCard` + `ActivitySummaryItem`)  
> **준수**: `frontend/AGENTS.md`, `frontend/CLAUDE.md` (FSD Lite, Emotion, 서버/로컬 상태 분리)  
> **프로토타입 참조**: UI/동작만. 코드 구조·Tailwind 복제 금지 (`lesson-library.plan.md` 상단 준수 문구와 동일)  
> **범위**: `ReportCard` 리포트 버튼 → 독립 상세 **페이지** 진입 + 프로토타입 `ReportDetail` 화면의 UI/UX 동등 구현. **API 연동 없음**.  
> **경로**: 위젯은 `widgets/lesson/result/`, 타입·목업은 `features/lesson/model/` (중첩 슬라이스 `lesson-result` 없음)

---

## 1. 목표

`widgets/lesson/result/ReportCard.tsx`의 **리포트** 버튼 클릭 시 리포트 상세 페이지로 이동한다.

프로토타입 `prototype/src/features/resources/components/report/ReportDetail.tsx`의 화면 구성·문구·탭·빈 상태를  
`frontend`에 FSD Lite + Emotion으로 동등하게 구현한다.

프로토타입 `ReportDetail` 구성:

```
돌아가기 ("수업 결과보기로 돌아가기")
├── ReportSummary     ← 좌: 썸네일·상태·제목·배포기간·SEL / 우: 참여 인원 · 평균 정답률
├── RdTabBar          ← 학생별 보기 | 페이지별 보기
└── StudentTab | PageTab
```

---

## 2. 현황

| 구분 | 위치 | 비고 |
|------|------|------|
| 목록 페이지 | `pages/lesson/LessonResultPage.tsx` | `/lesson/result`. StatusPanel + 필터 + `ReportCardList` |
| 리포트 버튼 | `widgets/lesson/result/ReportCard.tsx` | `/lesson/result/{activityId}` + `location.search` 유지 |
| 상세 라우트 | `app/router/routes.tsx` | `/lesson/result` + `/lesson/result/:activityId` |
| 상세 페이지 | `pages/lesson/LessonReportDetailPage.tsx` | 얇은 조합. `ReportDetail` 위젯 |
| 프로토타입 전환 | `ResultsView` + `useResources().rdReport` | 같은 뷰에서 목록↔상세 **인라인 교체**. Context |
| 프로토타입 상세 | `report/ReportDetail.tsx` | 돌아가기 + 요약 + 탭 + `PageTab`/`StudentTab` |
| 상세 API | — | 추가계획16에서 목록만 연동. progress/응답 상세는 보류 |

---

## 3. 프로토타입과의 구조 차이 (의도적)

`AGENTS.md` / 본 문서 상단: prototype은 **UI·동작 기준**. 코드 구조·Context·Tailwind는 가져오지 않는다.

| 프로토타입 | frontend (이번 계획) | 이유 |
|------------|----------------------|------|
| `rdReport`가 있으면 `ResultsView`가 `ReportDetail`로 교체 | **독립 라우트 페이지** | 사용자 요구: 리포트 버튼 클릭 시 **상세 페이지로 진입**. 추가계획4(오버레이→페이지)와 동일 패턴 |
| `useResources()` (`rdReport`, `rdTab`, `rdStu`, `rdSlide`) | 페이지/위젯 **로컬 상태** 또는 `useParams` | Context/Zustand 전역 상태 금지 (로컬·URL로 해결 가능) |
| `REPORTS.find` 목업 | 목록에서 넘긴 `ActivitySummaryItem` + 상세용 **로컬 목업** | `mock-data.ts` 복사 금지. API는 후속 |
| Tailwind | Emotion `styled` + `theme.*` | CLAUDE.md / 본 문서 준수 |
| `CaptureOverlay` (채점 뷰어) | **이번 비범위** | `ReportDetail.tsx` 밖(`ResourceListPage`)에서 마운트. 타일 클릭은 no-op |

같은 대시보드 레이아웃(사이드바 있는 교사 셸)을 쓴다. `TeacherFullscreenLayout`에 넣지 않는다.

---

## 4. URL · 진입 · 나가기

### 4.0 라우트 추가 (`routes.tsx`)

IA_V2 블록, **기존 `/lesson/result`와 같은 부모 레이아웃** 아래에 상세 라우트를 추가한다.

```
목록  /lesson/result
상세  /lesson/result/{activityId}
```

```tsx
<Route path='/lesson/result' element={<LessonResultPage />} />
<Route path='/lesson/result/:activityId' element={<LessonReportDetailPage />} />
```

- `{activityId}` = `ReportCardList`가 `items.map`으로 넘기는 `activity.activityId`  
  (`widgets/lesson/result/ReportCardList.tsx` → `<ReportCard activity={activity} />`)
- `TeacherFullscreenLayout`에 넣지 않는다
- 쿼리스트링은 path가 아니라 **그대로 유지**한다 (아래 4.1·4.2)

### 4.1 리포트 버튼 (목록 → 상세)

`ReportCard` 리포트 버튼. 목록 URL의 query string이 있으면 상세 URL에도 **동일하게 붙인다**.

```ts
// 목록이 /lesson/result?class=xxx 이면
// 상세는 /lesson/result/{activityId}?class=xxx
navigate(`/lesson/result/${activity.activityId}${location.search}`, {
  state: { activity },
});
```

| 목록 URL | 이동할 상세 URL |
|----------|-----------------|
| `/lesson/result` | `/lesson/result/{activityId}` |
| `/lesson/result?class=abc` | `/lesson/result/{activityId}?class=abc` |

- `activity.activityId`는 `ReportCardList`의 `activity`와 동일 객체
- `location.search`는 `DeployPage` `goToReports`·`ResourceCard`와 같은 방식 (`${path}${location.search}`)
- query가 없으면 `location.search`는 `''` → path만 사용
- `state.activity`는 요약 헤더용. **직접 URL 진입 시 없어도 화면은 렌더** (제목 fallback, 지표는 `–`)
- 이번 범위에서 단건 API 재조회 없음

### 4.2 돌아가기 (상세 → 목록)

프로토타입 문구 그대로: `‹ 수업 결과보기로 돌아가기`

상세 URL에 붙어 있던 query string을 목록으로 **그대로 옮긴다**. `navigate(-1)`은 쓰지 않는다 (직접 진입 시 앱 밖으로 나갈 수 있음).

```ts
// 상세가 /lesson/result/{activityId}?class=xxx 이면
// 목록은 /lesson/result?class=xxx
navigate(`/lesson/result${location.search}`);
```

| 상세 URL | 돌아갈 목록 URL |
|----------|-----------------|
| `/lesson/result/{activityId}` | `/lesson/result` |
| `/lesson/result/{activityId}?class=abc` | `/lesson/result?class=abc` |

프로토타입 `closeReport()` Context는 사용하지 않는다.

### 4.3 페이지가 바꾸지 않는 것

상세 페이지에는 목록의 `ContentsHeader` / `StatusPanel` / `ReportFilterChips` / `ReportCardList`를 **렌더하지 않는다**.  
프로토타입이 상세일 때 목록을 통째로 교체하는 동작과 동등하다.

---

## 5. FSD 배치

`pages → widgets → features → shared` 단방향.  
**Pages는 얇게** — `useParams` + 위젯 조합만. styled·탭 로직을 page에 두지 않는다.

```text
pages/lesson/LessonReportDetailPage.tsx    ← 라우트 진입. params/state 전달만
pages/index.ts
app/router/routes.tsx                     ← /lesson/result + /lesson/result/:activityId (search 유지)

widgets/lesson/result/                     ← 수업 결과보기 섹션 (목록 + 상세)
  ReportCard.tsx                          ← 기존. 리포트 버튼 → navigate
  ReportDetail.tsx                        ← 돌아가기 + 요약 + 탭바 + 탭 본문 조합
  ReportSummary.tsx                       ← 상단 요약 카드
  ReportDetailTabBar.tsx                  ← 학생별 / 페이지별
  StudentTab.tsx                          ← 좌 학생 리스트 + 우 학습요약·페이지 격자
  PageTab.tsx                             ← 빈 상태 또는 좌 페이지 목록 + 우 본문
  PageList.tsx
  PageContent.tsx
  SummaryStrip.tsx                        ← 페이지별 보기 상단 제출/정오 strip
  ResponseGrid.tsx                        ← 응답 타일 격자
  reportBadges.tsx                        ← NatureBadge / StatusBadge / ErrataBadge (위젯 로컬)
  index.ts                                ← @widgets/lesson 에서 re-export

features/lesson/model/                     ← 상세 뷰 타입 + 로컬 목업 (API 훅 없음, 중첩 슬라이스 금지)
  reportDetailTypes.ts
  reportDetailMock.ts                     ← frontend 타입 목업. prototype mock-data 복사 금지
```

위젯이 features의 목업/타입만 import한다. features가 widgets를 import하지 않는다.

---

## 6. 프로토타입 → frontend 변환 기준

| 프로토타입 | frontend 처리 |
|------------|---------------|
| Tailwind | Emotion `styled` 또는 `css`. `className="mt-5 grid-cols-..."` 금지 |
| `useResources()` | 사용 금지. 탭/`selectedStudentId`/`selectedPageIndex`는 `ReportDetail` 또는 해당 탭 위젯 로컬 `useState` |
| `REPORTS` / `scopedReports` | 복사 금지. `activity` (navigate state) + `reportDetailMock` |
| 색상 (`primary-*`, `emerald-*`, `amber-*`) | `app/styles/theme.ts` 토큰 우선. 없는 값은 가장 가까운 기존 토큰 |
| lucide (`Calendar`, `FileText`, `User`, `Clock`, `Image`, `Play`, `Maximize2`) | 프로젝트에서 사용 중이면 그대로 |
| 이모지 | 넣지 않음 (프로토타입 빈 상태의 장식 이모지도 복제하지 않음) |
| `CaptureOverlay` / `openCapture` / `setGrade` | 비범위. `ResponseGrid` 타일 `onOpen`은 no-op 또는 생략 |
| 학생용 `StudentDetailReport.tsx` | **비범위** (교사 리포트 상세와 다른 화면) |

### 6.1 공통 UI 재사용 (선행 점검)

새 styled 전에 `shared/ui` 확인. FilterPanel·추가계획15와 같은 방침.

| 후보 | 결론 |
|------|------|
| `Button` | 돌아가기는 텍스트+호버 링크형. outline/primary와 불일치 → **위젯 로컬** |
| `Card` | padding/radius가 프로토타입(`p-5`, `rounded-2xl`)과 다를 수 있음 → **위젯 로컬** |
| `Badge` / `TypeBadge` / `LevelBadge` | 성격·정오·제출상태 토큰이 다름 → **`reportBadges.tsx` 로컬** |
| `PageTitle` | 상세는 돌아가기+요약이지 페이지 타이틀이 아님 → **미사용** |

같은 배지가 2곳 이상에서 필요할 때만 `shared` 승격을 검토한다. 이번은 상세 화면 내부 재사용으로 충분하다.

---

## 7. UI 스펙 (프로토타입 동등)

문구·탭 순서·빈 상태 문장은 프로토타입을 기준으로 한다. 없는 칩/버튼을 만들지 않는다.

### 7.1 돌아가기

- `text-sm` / semibold / gray 텍스트. hover 시 더 진한 gray
- 좌측 `‹` (또는 lucide `ChevronLeft`) + `수업 결과보기로 돌아가기`

### 7.2 ReportSummary

한 카드, `md` 이상 2열.

**좌 — 콘텐츠 요약**

- 썸네일 (가로 고정, 세로 stretch, radius). 없으면 기존 `ReportCard`와 같이 제목 fallback
- 상태 뱃지: 목록과 동일 매핑 (`OPEN`→진행중, `NOT_STARTED`→진행예정, `CLOSED`/`NOT_AVAILABLE`→완료)
- 반 뱃지: 프로토타입에 있음. **값이 있을 때만** 표시. 목록 API에 `cls`가 없으면 **렌더하지 않음** (가짜 반 이름 금지)
- 제목 (lg, extrabold)
- `Calendar` + `배포 {start} ~ {end} · {N}개 페이지`
- SEL 칩: 값이 있을 때만. 없으면 행 생략

**우 — 핵심 지표 2칸** (`gray[50]` 배경, 세로 구분선)

- 참여 인원: `{p}/{assigned}명 · {pct}%` — 목업 또는 `–`
- 평균 정답률: 숫자+`%` 또는 `–` (정답 문항 없으면 `–`)

### 7.3 ReportDetailTabBar

- 기본 탭: **학생별 보기** (`student`). 프로토타입 store 초기값·`OPEN_REPORT`와 동일
- 탭 순서: **학생별 보기** → **페이지별 보기** (아이콘 `User` / `FileText`)
- 활성: 하단 2px primary + primary 텍스트. 비활성: transparent + gray, hover 시 진한 gray
- 탭 id는 UI 라벨과 분리해도 된다 (`student` / `slide`). 라벨은 한글로 고정

### 7.4 StudentTab (학생별 보기)

참여 0이면 빈 상태:

- 점선 테두리 + `gray[50]` + `Clock` 아이콘
- 문구: **아직 참여한 학생이 없습니다.**

데이터 있으면 `md: 260px | 1fr` 2열.

**좌 — 학생 리스트** (max-height + 내부 스크롤)

- 헤더: `참여 학생 (제출수/전체)`
- 행: 번호 · 이름(말줄임) · 점수(`N점` 또는 `–`) · 제출 상태 뱃지
- 선택 행: `primary` 연한 배경
- 기본 선택: 완료(5) 또는 제출(3) 학생 우선. 없으면 첫 학생. 프로토타입 `StudentTab`과 동일

**우 — 학생 상세**

- 카드1: `{번호}. {이름}` + 상태 뱃지. 타일 2개 — `활동 페이지` `{submitted}/{total} p`, `정답률 / 맞춘 문제` (`{pct}%` + `{correct}/{graded}개`, 채점 문항 없으면 `–`)
- 카드2: `페이지별 상세 ({N})` + `ResponseGrid` (`showSummary={false}` — 성격·채점 상태만, 본문은 캡처 뷰어 몫)

### 7.5 PageTab (페이지별 보기)

참여 0이면 빈 상태:

- 동일 점선 박스 + `Clock`
- 문구: **아직 제출된 응답이 없습니다.** (학생별 문구와 **다름**)

데이터 있으면 `md: 300px | 1fr`.

**PageList**

- 헤더: `페이지 (N)`
- 행: 순번 사각 뱃지 · `NatureBadge` · 제목 · `응답 {resp}/{assigned}`
- 선택: 행 배경 + 순번 뱃지 primary

**PageContent**

- 순번 · 제목 · `NatureBadge` · (있으면) 페이지 SEL 칩
- `SummaryStrip`: 문항+정답 있으면 정답/오답/부분 + 제출 n/N. 그 외 `조회` 또는 `제출` n/N명. 수동 채점 대상이면 `채점 n/N`
- `학생별 응답 (N)` + `ResponseGrid` (`showSummary` 기본 true)

### 7.6 ResponseGrid

- 반응형 그리드 (1 / sm 2 / lg 3 / 2xl 4)
- 타일: 16:9 캡처(없으면 `미제출`) + 주라벨 + (옵션) 성격 뱃지 + 정오/채점 슬롯
- 제출된 타일만 클릭 가능. **이번 구현에서는 클릭 동작 없음** (캡처 오버레이 후속)
- 학생별 보기: 타일 = 페이지(`{order}. {title}`), `showNature`
- 페이지별 보기: 타일 = 학생(`{no}. {name}`), 성격 숨김

상태 뱃지 라벨 (프로토타입 `StatusBadge`): 완료 / 진행중 / 제출 / 미제출.  
성격: 개념 / 활동 / 문항.  
정오: O / X / △ / –.

---

## 8. 상태 관리

`AGENTS.md` 우선순위: 서버 상태(React Query) → 필요 시 URL → 로컬. Zustand/Context는 최후.

| 상태 | 배치 | 이유 |
|------|------|------|
| `activityId` | URL `useParams` | `ReportCardList`의 `activity.activityId` |
| 목록 query string | URL `location.search` | 상세 진입·돌아가기 때 path에 붙여 그대로 유지 |
| 목록에서 넘긴 `activity` | `location.state` (선택) | 요약 헤더. 새로고침 시 없어도 UI는 유지 |
| `rdTab` (`student` \| `slide`) | `ReportDetail` 로컬 `useState`, 기본 `'student'` | 단일 페이지 UI. URL 쿼리는 이번 필수 아님 |
| `selectedStudentId` | `StudentTab` 로컬 | 탭 안에서만 사용 |
| `selectedPageIndex` | `PageTab` / `PageList` 로컬 | 탭 안에서만 사용 |
| 학생·페이지·응답 데이터 | 로컬 목업 상수 | API 없음. React Query 훅 신설 금지 |
| 채점(`grades`) / overlay | **없음** | CaptureOverlay 비범위 |

서버 응답을 `useState`에 복사하지 않는다. `useEffect`로 목업을 fetch하지 않는다.

---

## 9. 목업 · 타입 (API 전)

백엔드 상세/progress가 없으므로 프로토타입 목업을 **frontend 타입으로 재구성**한다.  
`prototype/.../mock-data.ts`의 `REPORTS` 배열을 복사하지 않는다.

```ts
export type ReportDetailTab = 'student' | 'slide';
export type ArticleNature = '개념' | '활동' | '문항';
export type StudentStatusCd = 2 | 3 | 4 | 5; // 미제출 / 제출 / 진행중 / 완료
export type ErrataCd = 1 | 2 | 3 | 4;        // O / X / △ / –

export interface ReportDetailStudent {
  studentId: string;
  no: number;
  studentName: string;
  statusCd: StudentStatusCd;
  score: number | null;
}

export interface ReportDetailArticle {
  id: string;
  order: number;
  title: string;
  nature: ArticleNature;
  selFactor?: string;
  correctAnswer?: string | null;
  gradingType?: number;
}

export interface ReportDetailResponse {
  articleId: string;
  studentId: string;
  submitAnswer?: string;
  errata?: ErrataCd | null;
  captureImage?: string;
  mediaSec?: number;
}

export interface ReportDetailView {
  activityId: string;
  pageCount: number;
  participantCount: number;
  assignedCount: number;
  avgCorrectRate: number | null;
  selFactors: string[];
  className?: string;
  students: ReportDetailStudent[];
  articles: ReportDetailArticle[];
  responses: ReportDetailResponse[];
}
```

- `activityId`가 목업에 없으면: 요약은 `location.state`/`activityId` fallback, 탭 본문은 **해당 탭 빈 상태** (가짜 학생을 모든 id에 붙이지 않음)
- 목업이 있는 경우에만 리스트·격자 레이아웃을 프로토타입과 동등하게 확인한다
- `participantCount === 0` 분기는 반드시 구현한다

---

## 10. 하지 말 것

- `prototype` 파일·폴더 구조, `useResources()`, `ResourcesContext` 복사
- Tailwind 클래스, 임의 hex 남발 (`theme.ts` 우선)
- `CaptureOverlay` · 교사 채점 mutation · 키보드 순회
- `GET /api/v1/activities/{id}`, `GET .../progress`, 응답/캡처 API
- 빈 React Query 훅 (`useEffect` fetch 포함)
- 학생 화면 `StudentDetailReport` 구현
- `any`, 요청과 무관한 리팩터링, 목록 페이지(`LessonResultPage`) 레이아웃 변경
- 기준에 없는 문구·버튼·탭·아이콘 추가
- 주석/UI에 이모지

---

## 11. 구현 순서 (체크리스트)

- [x] `features/lesson/model/reportDetailTypes.ts` · `reportDetailMock.ts`
- [x] `widgets/lesson/result/reportBadges.tsx`
- [x] `ReportSummary.tsx` / `ReportDetailTabBar.tsx` (`widgets/lesson/result/`)
- [x] `ResponseGrid.tsx` / `SummaryStrip.tsx`
- [x] `StudentTab.tsx` / `PageList.tsx` + `PageContent.tsx` / `PageTab.tsx`
- [x] `ReportDetail.tsx` — 돌아가기 + 조합, 탭 로컬 상태
- [x] `pages/lesson/LessonReportDetailPage.tsx` — `useParams` + `useLocation` + `<ReportDetail />`만
- [x] `pages/index.ts` export, `routes.tsx`에 `/lesson/result/:activityId` (목록과 동일 레이아웃)
- [x] `widgets/lesson/result/ReportCard.tsx` 리포트 버튼 → `navigate(\`/lesson/result/${activity.activityId}${location.search}\`)` + `state.activity`
- [x] 돌아가기 → `navigate(\`/lesson/result${location.search}\`)` (query 없으면 `/lesson/result`)
- [x] `widgets/lesson/result/index.ts` 및 `widgets/lesson/index.ts` export
- [x] `npx tsc -b --noEmit` + `npx eslint <변경 파일>` (`AGENTS.md` 검증)

---

## 12. 완료 기준

- 수업 결과보기 카드에서 **리포트**를 누르면 `/lesson/result/{activityId}`로 이동한다. `activityId`는 `ReportCardList`의 `activity.activityId`
- 목록에 query string이 있으면 상세 URL에도 동일하게 붙는다 (`/lesson/result/{activityId}?…`)
- 돌아가기 시 `/lesson/result` + **같은 query string**으로 복귀한다. query가 없으면 `/lesson/result`
- 프로토타입 `ReportDetail`과 동등한 레이아웃이 보인다 (StatusPanel·필터·카드는 상세에 없음)
- 기본 탭은 학생별 보기, 탭 전환 시 페이지별 보기가 렌더된다
- 참여 0 / 목업 있음 두 경로의 빈 상태·리스트 레이아웃이 프로토타입 문구와 맞다
- Tailwind·Context 없음. page에 styled/탭 로직 없음
- TypeScript · ESLint 에러 없음
- 육안: 요약 2열, 탭 바, 학생별 2열, 페이지별 2열, 응답 격자

캡처 확대·채점·progress API는 완료 조건이 아니다.

---

## 13. 후속 (이번 비범위)

| 항목 | 내용 |
|------|------|
| 활동 단건 / progress / 문항·응답 API | **추가계획18**에서 스펙 확정 |
| `CaptureOverlay` | 제출 캡처 확대 + 수동 채점. 프로토타입 `report/CaptureOverlay.tsx` |
| 반 배지 | 추가계획18에서도 보류 |
| `PageTab` API | 추가계획18에서도 보류 |
| 탭 URL (`?tab=`) | 필요하면 그때. 이번은 로컬 상태 |

---

## 14. 참고 파일

| 역할 | 경로 |
|------|------|
| 프로토타입 상세 루트 | `prototype/src/features/resources/components/report/ReportDetail.tsx` |
| 프로토타입 요약 | `.../report/ReportSummary.tsx` |
| 프로토타입 탭 바 | `.../report/RdTabBar.tsx` |
| 프로토타입 학생별 | `.../report/StudentTab.tsx` |
| 프로토타입 페이지별 | `.../report/PageTab.tsx`, `PageList.tsx`, `PageContent.tsx` |
| 프로토타입 격자·strip | `.../report/detail/ResponseGrid.tsx`, `SummaryStrip.tsx` |
| 프로토타입 배지 | `.../report/badges.tsx` |
| 프로토타입 목록→상세 | `.../report/ReportCard.tsx` (`openReport`), `ResultsView.tsx` |
| 리포트 버튼 (구현 대상) | `frontend/src/widgets/lesson/result/ReportCard.tsx` |
| activityId 출처 | `frontend/src/widgets/lesson/result/ReportCardList.tsx` (`activity.activityId`) |
| query 유지 참고 | `frontend/src/features/lesson/ui/DeployPage.tsx`의 `goToReports` (`/lesson/result` + `location.search`) |
| 목록 페이지 | `frontend/src/pages/lesson/LessonResultPage.tsx` |
| 라우트 | `frontend/src/app/router/routes.tsx` |
| 아키텍처 | `frontend/AGENTS.md`, `frontend/CLAUDE.md` |
| 테마 | `frontend/src/app/styles/theme.ts` |

---

**작성일**: 2026-08-26  
**상태**: 구현 완료 (2026-08-26)

## 15. 구현 결과 (2026-08-26)

### 신규 파일

| 파일 | 역할 |
|------|------|
| `src/features/lesson/model/reportDetailTypes.ts` | 상세 뷰 타입 (`ReportDetailView`, 탭, 배지, `CellInfo`) |
| `src/features/lesson/model/reportDetailUtils.ts` | 날짜·비율·응답 셀·학생 요약 파생 |
| `src/features/lesson/model/reportDetailMock.ts` | `mock-report-detail` 전용 목업. 그 외 activityId는 빈 뷰 |
| `src/widgets/lesson/result/reportBadges.tsx` | 활동상태·반·성격·정오·제출상태 뱃지 |
| `src/widgets/lesson/result/ReportSummary.tsx` | 상단 요약 2열 |
| `src/widgets/lesson/result/ReportDetailTabBar.tsx` | 학생별 / 페이지별 탭 (기본 학생별) |
| `src/widgets/lesson/result/ResponseGrid.tsx` | 응답 타일 격자 (클릭 no-op) |
| `src/widgets/lesson/result/SummaryStrip.tsx` | 페이지별 제출/정오 strip |
| `src/widgets/lesson/result/PageList.tsx` | 페이지 목록 |
| `src/widgets/lesson/result/PageContent.tsx` | 페이지 본문 + 학생별 응답 |
| `src/widgets/lesson/result/PageTab.tsx` | 페이지별 보기 (빈 상태 문구 포함) |
| `src/widgets/lesson/result/StudentTab.tsx` | 학생별 보기 (빈 상태 문구 포함) |
| `src/widgets/lesson/result/ReportDetail.tsx` | 돌아가기 + 요약 + 탭 조합 |
| `src/pages/lesson/LessonReportDetailPage.tsx` | 라우트 페이지. params/state만 전달 |

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/widgets/lesson/result/ReportCard.tsx` | 리포트 버튼 → `/lesson/result/{activityId}` + `location.search` |
| `src/widgets/lesson/result/index.ts` | `ReportDetail` export |
| `src/widgets/lesson/index.ts` | `ReportDetail` re-export |
| `src/features/lesson/index.ts` | 상세 타입·목업·유틸 export |
| `src/pages/index.ts` | `LessonReportDetailPage` export |
| `src/app/router/routes.tsx` | `/lesson/result/:activityId` (목록과 동일 레이아웃) |

### 라우트

- 목록: `/lesson/result`
- 상세: `/lesson/result/:activityId` (`activityId` = `ReportCardList`의 `activity.activityId`)
- query string은 진입·돌아가기 모두 `location.search`로 유지
- 돌아가기: `/lesson/result${location.search}` (`navigate(-1)` 미사용)

### 검증 결과

- `npx tsc -b --noEmit` — 에러 없음
- `npx eslint --fix` — 에러 없음
- `npx vite build` — 성공

### 비고

- 실제 활동 id에는 목업 학생을 붙이지 않음. 탭 본문은 빈 상태 (`아직 참여한 학생이 없습니다.` / `아직 제출된 응답이 없습니다.`)
- 레이아웃 확인용 목업: `/lesson/result/mock-report-detail`
- `CaptureOverlay`·progress API는 후속

---

# 추가계획18 — `LessonReportDetailPage` 리포트 상세 API 연동

> **선행**: **추가계획17** (리포트 상세 페이지 UI). 이미 구현됨.  
> **준수**: `frontend/AGENTS.md`, `frontend/CLAUDE.md` (FSD Lite, Emotion, 서버/로컬 상태 분리)  
> **LMS 스펙**: `superplatform-lms/docs/guide/api-spec.md`  
> **대상**: `LessonReportDetailPage` → `widgets/lesson/result/ReportDetail.tsx` 및 하위  
> **범위**: 교사 리포트 상세에 **실제 API를 연결**. UI/라우트/돌아가기 계약(17)은 유지.  
> **비범위**: `PageTab` API, 반 배지, 학생 리스트의 점수·진행상태, `CaptureOverlay`·수동 채점, 학생 결과보기(19)

---

## 0. FSD (구현 중 원칙)

코드가 `pages → widgets → features → shared` 단방향에 맞지 않으면 **구현하면서 구조를 맞춘다.**  
기존 `ReportDetailView` 목업 타입에 API를 억지로 끼워 넣지 않는다. 타입이 응답과 다르면 features 모델을 바꾼다.

| 해야 함 | 하지 말 것 |
|---------|------------|
| fetch·React Query는 `features/lesson/api/` | `pages/` 에서 fetch, `useEffect`로 API 호출 |
| 매퍼·집계는 `features/lesson/model/` | 위젯에 응답 필드 하드코딩 남발 |
| 위젯은 훅 소비 또는 props로 결과만 표시 | 빈 React Query 훅을 미리 만들어 두기 |
| LMS는 `ENV.SP_LMS_API_URL`, CMS는 `ENV.CMS_API_URL` | LMS 클라이언트에 CMS 경로를 섞기 |
| 기존 `lmsActivityService.ts` / `cmsSetService.ts`(또는 article 서비스) 확장 | `widgets/` 에서 `authorizedFetch` 직접 호출 |

페이지(`LessonReportDetailPage`)는 계속 얇게: `activityId` + `state.activity`만 넘긴다.

---

## 1. 목표

`ReportDetail` 진입 시 목업(`getReportDetailView`) 대신 LMS·CMS를 조회해 요약·학생 탭·응답 격자를 채운다.

지금: `location.state.activity` + `getReportDetailView(activityId)`.  
이후: 아래 확정 API. 서버 단건이 있으면 **state보다 서버 값 우선**.

---

## 2. 선행·현황

| 항목 | 위치 | 현재 |
|------|------|------|
| 목록 → 상세 | `ReportCard` → `/lesson/result/:activityId` | 구현됨 |
| 페이지 | `LessonReportDetailPage.tsx` | params/state만 |
| 상세 UI | `ReportDetail.tsx` 및 하위 | 요약 + 탭 + 빈 상태 |
| LMS 서비스 | `lmsActivityService.ts` | 단건/progress/statistics/GET assignees/교사 참여 결과 추가됨 |
| CMS | `cmsSetService.ts` | `GET /api/articles/{articleId}` (`getCmsArticle`) |
| 이름 조회 | `resolveAssigneeNamesFromGroups.ts` | 그룹 멤버 역방향 (임시) |
| 목업 | `reportDetailMock.ts` | 실제 activityId 경로에서 미사용. `PageTab`만 빈 뷰 |

실제 UUID 경로에서는 목업 학생을 쓰지 않는다.

---

## 3. API 원본

LMS 필드·옵셔널 규칙·에러 코드는 `superplatform-lms/docs/guide/api-spec.md`를 따른다.  
없는 키는 `null`이 아니라 **키 없음**. 옵셔널로 선언한다.

인증: 회원 토큰. 남의 활동은 **404 `NOT_FOUND`**.

| 화면 | Method | Path | `data` 타입 | 호출 시점 |
|------|--------|------|-------------|-----------|
| 요약 메타 | GET | `/api/v1/activities/{activityId}` | `ActivityDetail` | `ReportDetail` 마운트 |
| 참여 인원 | GET | `/api/v1/activities/{activityId}/progress` | `ActivityProgress` | 마운트 (참여율 + `participationId`) |
| 평균 점수 슬롯 | GET | `/api/v1/activities/{activityId}/statistics` | `ActivityStatistics` | 마운트 |
| 학생 명단 | GET | `/api/v1/activities/{activityId}/assignees` | `string[]` (`sub` = `spUserId`) | 학생별 탭 |
| 학생 1명 상세 | GET | `/api/v1/activities/{activityId}/participations/{participationId}` | `ParticipationResult` | 선택한 학생에 `participationId`가 있을 때 |
| 격자 문항 목록 | GET | `/api/v1/activities/{activityId}` | `ActivityDetail.items` | 단건과 동일. **사람 축(progress)이 아님** |
| 격자 제목·성격 | GET | `{CMS_API_URL}/api/articles/{articleId}` | ArticleInfo (아래 사용 필드만) | `items[].lcmsArticleId`로 조회 |

`participationId`는 progress `rows[]`에서 고른다. 학생 본인용 `GET /api/v1/participations/{id}/result`를 교사 화면에 쓰지 않는다.

---

## 4. `ReportSummary` — 활동 단건

**API**: `GET /api/v1/activities/{activityId}`  
**파일**: `ReportSummary.tsx`

`ActivityDetail.items`는 **단건에만** 있다. 목록 `ActivitySummary`에는 없다.

### 4.1 메타 (194–211)

| UI | 소스 | 표기 |
|----|------|------|
| 상태 배지 (196) | `availability` | 기존 `ActivityStatusBadge` |
| 반 배지 (197) | — | **보류.** `ClassBadge`를 API로 채우지 않음. 목업 `view.className`도 실제 id에 쓰지 않음 |
| 제목 (199) | `title` | 단건 `title`. 로딩 중만 state/activityId fallback |
| 날짜 행 (200–203) | `openAt`, `closeAt`, `items.length` | `배포 {openAt} ~ {closeAt} · {items.length}개 페이지` |
| 칩 행 (204–210) | `labels` | 배열 원소를 칩으로. 빈 배열이면 행 숨김. SEL 매핑 추정 금지 |

날짜 포맷은 기존 `fmtDotDate`. `openAt`/`closeAt`이 없으면 그 구간은 생략한다. 둘 다 없으면 `배포` 범위 없이 `{n}개 페이지`만.

### 4.2 참여 인원 (215–228)

**API**: `GET /api/v1/activities/{activityId}/progress`

```
{startedCount}/{assignedCount}명 · {startedCount / assignedCount * 100}%
```

- 비율은 기존 `pct` (분모 0이면 0, 그 외 반올림 정수).
- **`assignedCount`는 `ASSIGNED`만.** `OPEN`에는 키가 없다. **0으로 채우지 않는다.** 키 없거나 분모 0이면 `–`.
- `startedCount`만 있고 분모가 없으면 비율을 만들지 않는다.

### 4.3 평균 정답률 슬롯 (229–241)

**API**: `GET /api/v1/activities/{activityId}/statistics`  
값: **`averageScore`**.

- 레이블은 현행 「평균 정답률」 유지.
- LMS `averageScore`는 **채점된 총점의 평균**이지 0–100 정답률이 아니다. `* 100` 하거나 `%`를 붙이지 않는다.
- 키 없음(채점 없는 활동 등)이면 `–`.

---

## 5. `StudentTab` — 명단

**API**: `GET /api/v1/activities/{activityId}/assignees`  
**파일**: `StudentTab.tsx` (234–257)  
**응답**: `string[]` — 배정된 회원 `sub` (`spUserId`). `OPEN`이면 `[]`.

### 5.1 이름 (임시)

LMS는 회원 이름을 주지 않는다. `DeployPage`의 `collectAssigneeSubsFromGroups` **역방향**으로 맞춘다.

1. 교사 그룹 목록 (`useMyGroupsQuery` / `getMyGroups`)
2. 그룹마다 `getGroupDetail` → `members[].spUserId` ↔ `name`(`nickname`), `memberNo`
3. assignees의 `sub`로 조회해 리스트에 표시

이름 해석 범위·API는 **추후 변경될 수 있음.** 이번은 배포와 같은 그룹 멤버 소스를 임시로 쓴다. 활동에 반 id가 없으므로(반 배지 보류) 교사의 그룹을 순회한다. 매칭 실패 시 이름을 지어내지 않는다(빈 이름 또는 `sub` 일부). 학심정 미동의 마스킹은 그룹 멤버 기존 규칙을 따른다.

구현 위치: `features/lesson/model/` (예: `resolveAssigneeNamesFromGroups`). `features/groups`의 `getGroupDetail` 재사용. 위젯에서 그룹 API를 직접 돌리지 않는다.

### 5.2 보류 (같은 234–257)

| UI | 이번 |
|----|------|
| 점수 (`s.score`) | 보류. `–` 또는 슬롯 유지하고 값만 비움 |
| 진행상태 (`StudentStatusBadge`) | 보류. progress `rows[].status`가 있어도 **연결하지 않음** |
| 헤더 `({submittedCount}/{students.length})` | 보류. 명단 길이만 쓰거나 괄호를 빼도 됨. 제출 수를 추측하지 않음 |
| 상세 헤더의 상태 배지 | 동일하게 보류 |

빈 명단(`[]`)이면 기존 빈 상태 「아직 참여한 학생이 없습니다.」

---

## 6. `StudentTab` — 선택 학생 상세

리스트(234–257)가 아니라 **오른쪽 상세**(266–280)다.

**API**: `GET /api/v1/activities/{activityId}/participations/{participationId}`  
**`data`**: `ParticipationResult` (학생 결과와 같은 타입)

### 6.1 `participationId`

progress `rows[]`에서 `participant === 선택한 sub`인 행의 `participationId`.

- 키 없음(`NOT_STARTED`): **호출하지 않음.** 상세 타일 `–`, 격자 빈 상태.
- 호출했는데 409 `NOT_SUBMITTED`: 에러 토스트로 화면을 깨지 않음. 미제출로 취급.

### 6.2 활동 페이지 (266–271)

스펙 필드명은 `answers`가 아니라 **`answer`** (단수, 답을 냈을 때만 키 존재).

```
{ items 중 answer 키가 있는 개수 } / { items.length } p
```

### 6.3 정답률 / 맞춘 문제 (272–280)

분모·분자는 `errata`가 `CORRECT` | `INCORRECT` | `PARTIAL` 인 항목만.  
`UNGRADABLE`·키 없음(미채점)은 **넣지 않는다.** 미채점을 오답으로 세지 말라는 LMS 규칙과 같다.

```
채점집합 = errata ∈ {CORRECT, INCORRECT, PARTIAL}
정답률 = (CORRECT 개수 / 채점집합 개수) * 100   → 기존 pct
맞춘 문제 = CORRECT 개수 / 채점집합 개수
```

채점집합이 비면 `–` (현행 `graded` 분기와 동일).

---

## 7. `ResponseGrid` — 문항 목록 (활동 단건 `items`)

**파일**: `ResponseGrid.tsx`

격자는 **문항(페이지) 목록**이다. 사람 축인 `GET .../progress`가 아니라  
**`GET /api/v1/activities/{activityId}`의 `items[]`** 를 기준으로 칸을 만든다.

| LMS (단건) | 용도 |
|------------|------|
| `items[].seq` | 타일 번호 |
| `items[].lcmsArticleId` | CMS 아티클 조회 키 |
| `items[].activityItemId` | 선택 학생의 참여 결과와 짝맞출 때 (있으면) |

제목·성격은 CMS `GET {CMS_API_URL}/api/articles/{articleId}` (`articleId` = `lcmsArticleId`).  
호출·캐시는 `features/lesson/api/`. 위젯에서 CMS URL을 직접 치지 않는다.  
중복 id는 React Query 캐시 + `useQueries`(또는 동등)로 묶는다. 실패 한 건이 격자 전체를 막지 않는다.

이번 화면에서 **쓰는 필드만**:

| CMS 필드 | 용도 |
|----------|------|
| `name` | 타일 제목 |
| `articleType` | 성격 배지 (아래 매핑) |

그 외(`description`, `url`, `metaMap`, 교육과정 메타 등)는 이 계획에서 표시하지 않는다. 전체 ArticleInfo 스키마를 프론트 타입에 복사하지 말고, 사용 필드만 선언한다.

### 7.1 제목·번호 (250–253)

| UI | 소스 |
|----|------|
| 제목 | CMS `name` (`items[].lcmsArticleId`로 조회) |
| 번호 | `GET /api/v1/activities/{activityId}` 의 **`items[].seq`** (1부터) |

Emotion 컴포넌트명 **`Primary` → `Title`**.  
현재 `primary`에 `"{order}. {title}"`로 합쳐져 있다. 번호=`seq`, 제목=`name`으로 나눈다. 한 줄 유지 시 `{seq}. {name}`도 허용. `GridItem.primary` 이름도 맞춰 바꿔도 된다.

문항 목록·순서는 **활동 단건 `items`만** 쓴다. `GET .../progress`에는 `items[]`가 없고 사람 축이라 격자에 쓰지 않는다. 배열 인덱스로 번호를 만들지 않는다 (`seq` 사용).

### 7.2 성격 배지 (254–258)

CMS `articleType` → 기존 `NatureBadge` (`ArticleNature`):

| `articleType` | 표시 |
|---------------|------|
| 20 | 개념 |
| 21 | 문항 |
| 22 | 활동 |

그 외·없음: 배지 숨김 (`showNature=false`). 값을 추측하지 않는다.

> CMS OpenAPI 예시는 `articleType: 3001`처럼 메타 PK를 쓰기도 한다. **이 화면의 계약은 20/21/22.** 실응답이 다르면 계획을 고친 뒤 구현한다.

### 7.3 격자에서 이번 안 하는 것

- 캡처 이미지·`CaptureOverlay` (LMS에 캡처 필드 없음)
- `PageTab`용 격자 API

학생 결과 `errata`가 있으면 타일 `Mark`에 매핑할 수 있다. 없으면 숨김. LMS `errata`는 문자열 enum이다. 목업 `ErrataCd`(1–4)에 억지로 맞추지 말고 필요하면 타입을 바꾼다.

---

## 8. `PageTab` — 보류

`PageTab.tsx` / `PageList` / `PageContent` / `SummaryStrip` API **없음**. 추가 예정.  
빈 상태 또는 17 목업 레이아웃만. 이번 작업에서 페이지별 보기용 조회를 넣지 않는다.

---

## 9. FSD 배치 (예상)

구현 중 레이어가 어긋나면 이 표보다 **FSD를 우선**해 옮긴다.

```text
pages/lesson/LessonReportDetailPage.tsx     ← 변경 최소. fetch 없음

widgets/lesson/result/
  ReportDetail.tsx      ← activityId로 훅 연결, 목업 제거
  ReportSummary.tsx     ← 단건 + progress + statistics
  StudentTab.tsx        ← assignees + 이름맵 + 선택 시 participation
  ResponseGrid.tsx      ← 단건 items[] 목록. Primary→Title, seq, CMS name/articleType
  PageTab.tsx           ← API 없음 (보류)

features/lesson/api/
  lmsActivityService.ts ← getActivity, getActivityProgress, getActivityStatistics,
                          getActivityAssignees, getTeacherParticipationResult
                          + ActivityDetail/Progress/Statistics/ParticipationResult 타입 확장
  cmsSetService.ts 또는 cmsArticleService.ts
                        ← getCmsArticle(articleId)  (ENV.CMS_API_URL)
  queries.ts            ← 위 GET들의 useQuery / useQueries
  queryKeys.ts          ← activity, progress, statistics, assignees,
                          participation, cmsArticle

features/lesson/model/
  collectAssigneeSubsFromGroups.ts 기존 (배포)
  (신규) 역방향: spUserId[] → 이름/출석번호
  (신규) participation items → 활동페이지/정답률 집계
  (신규) articleType 20/21/22 → ArticleNature
  reportDetailTypes.ts  ← API에 맞게 수정 허용. 목업 전용 필드 제거 가능
  reportDetailMock.ts   ← 실제 UUID 경로에서 사용 금지
```

`lessonKeys` 예:

- `['lesson','activities', activityId]`
- `[..., 'progress' | 'statistics' | 'assignees']`
- `[..., 'participations', participationId]`
- `['lesson','cms-article', articleId]`

훅 `enabled`: 유효 `activityId`. 참여 결과는 `participationId`가 있을 때만.

그룹 상세 N회 호출은 임시 이름 해석 비용이다. 캐시(`useMyGroupsQuery` 등)를 재사용한다.

---

## 10. 로딩·에러

`frontend/AGENTS.md`: 로딩, 중복 방지, 실패 피드백.

| 상황 | 처리 |
|------|------|
| 단건 로딩 | 요약 스켈레톤/플레이스홀더. 빈 목업 학생을 넣지 않음 |
| 단건 404 | 없거나 내 활동 아님. 안내 문구. 가짜 데이터 없음 |
| progress/statistics/assignees 실패 | 해당 슬롯 `–` 또는 탭 에러. 다른 슬롯은 유지 |
| CMS 아티클 실패 | 제목 fallback(id 또는 빈 문자열). 배지 숨김 |
| 참여 결과 409 `NOT_SUBMITTED` | 미제출. 화면 throw 금지 |
| 중복 클릭 | React Query. 동일 key 재요청 남발 금지 |

`state.activity`는 단건 성공 전 제목/썸네일 힌트만. 성공 후 덮어쓴다.

---

## 11. 하지 말 것

- 페이지에 fetch / `useEffect` API
- 빈 React Query 훅만 추가
- `OPEN`의 `assignedCount` 없음 → 0
- 미채점(`errata` 없음)·`UNGRADABLE`을 오답으로 세기
- 반 배지·학생 점수/상태·`PageTab` API를 이번 범위에서 추정 구현
- 교사 화면에 학생 `GET /participations/{id}/result` 사용
- CMS ArticleInfo 전체 스키마 복사, 사용하지 않는 메타 표시
- prototype 구조·Tailwind 복제, 주석 이모지
- `CaptureOverlay`·채점 PATCH
- 추가계획19 학생 화면과 한 작업으로 섞기
- 실제 activityId에 `getReportDetailView` 목업 학생 연결
- `ResponseGrid` 문항 목록을 `GET .../progress`나 `ParticipationResult.items`로 만들기 (단건 `items[]`만)

---

## 12. 구현 체크리스트

- [x] `ActivityDetail`에 `openAt`/`closeAt`/`labels`/`items`(seq, lcmsArticleId) 등 스펙 필드 반영
- [x] LMS GET 5종 서비스 + React Query (단건, progress, statistics, assignees, participation)
- [x] CMS `GET /api/articles/{articleId}` + 캐시
- [x] `ReportDetail` 마운트 시 단건 호출. 목업 뷰 제거
- [x] `ReportSummary` 매핑 (반 배지 제외)
- [x] 참여 인원: `startedCount`/`assignedCount` + %. `assignedCount` 없으면 `–`
- [x] 평균 슬롯: `averageScore` (퍼센트 변환 없음)
- [x] assignees → 그룹 멤버 역조회 이름 (임시) . 점수·상태 미연결
- [x] 선택 학생: progress의 `participationId`로 교사 참여 결과
- [x] 활동 페이지·정답률/맞춘 문제 집계 (answer / CORRECT·INCORRECT·PARTIAL)
- [x] `ResponseGrid`: 단건 `items[]`로 칸 생성. `Title` 이름 변경, CMS `name`, `items[].seq`, articleType 20/21/22
- [x] `PageTab` API 없음
- [x] 로딩·404·부분 실패 UI
- [x] FSD 어긋난 import/fetch 정리
- [x] `tsc` / eslint (`no-unused-vars` 제외)

---

## 13. 완료 기준

- `/lesson/result/{activityId}` 진입 시 단건·progress·statistics가 호출되고 요약이 스펙대로 채워진다.
- 학생 탭에 assignees 명단이 이름과 함께 나오고, 선택 시 참여 결과로 활동 페이지·정답률이 계산된다.
- 격자가 단건 `items[]` 문항 목록이고, CMS 제목·`seq`·articleType 성격이 나온다.
- 보류 항목(반, 리스트 점수/상태, PageTab API)이 가짜 데이터로 채워지지 않는다.
- 페이지는 얇고, 조회는 features API 훅이다.

---

## 14. 참고 파일

| 역할 | 경로 |
|------|------|
| LMS 스펙 | `superplatform-lms/docs/guide/api-spec.md` (`ActivityDetail`, `ActivityProgress`, `ActivityStatistics`, `ParticipationResult`, assignees) |
| 상세 조합 | `frontend/src/widgets/lesson/result/ReportDetail.tsx` |
| 요약 | `frontend/src/widgets/lesson/result/ReportSummary.tsx` |
| 학생 탭 | `frontend/src/widgets/lesson/result/StudentTab.tsx` |
| 격자 | `frontend/src/widgets/lesson/result/ResponseGrid.tsx` |
| 페이지별 탭 (보류) | `frontend/src/widgets/lesson/result/PageTab.tsx` |
| LMS 서비스 | `frontend/src/features/lesson/api/lmsActivityService.ts` |
| CMS 패턴 | `frontend/src/features/lesson/api/cmsSetService.ts` (`ENV.CMS_API_URL`) |
| 배포 시 반→sub | `frontend/src/features/lesson/model/collectAssigneeSubsFromGroups.ts`, `DeployPage.tsx` |
| 그룹 멤버 | `frontend/src/features/groups/api/groupService.ts` (`getGroupDetail`, `spUserId`) |
| 목업 (실제 id 금지) | `frontend/src/features/lesson/model/reportDetailMock.ts` |

---

**작성일**: 2026-08-26 (스텁)  
**갱신**: 2026-08-27 (API 매핑 확정 · 구현 완료)  
**상태**: 구현 완료 (2026-08-27)

---

## 15. 구현 결과 (2026-08-27)

페이지는 얇게 유지. 조회는 `features/lesson/api` React Query. 위젯이 훅을 소비한다.

### 신규

| 파일 | 역할 |
|------|------|
| `features/lesson/model/resolveAssigneeNamesFromGroups.ts` | 교사 그룹 멤버 `spUserId` → 이름/출석번호 (임시) |
| `features/lesson/model/mapReportDetail.ts` | articleType 20/21/22, LMS errata, 참여 결과 집계 |

### 수정

| 파일 | 역할 |
|------|------|
| `lmsActivityService.ts` | `ActivityDetail` 확장. GET 단건/progress/statistics/assignees/교사 참여 결과 |
| `cmsSetService.ts` | `getCmsArticle` |
| `queryKeys.ts` / `queries.ts` | 상세 훅 + CMS article `useQueries` + 이름 디렉터리 |
| `ReportDetail.tsx` | 단건·progress·statistics 훅. 목업 제거. 로딩/404 |
| `ReportSummary.tsx` | 단건/progress/statistics 매핑. 반 배지 없음. `averageScore`에 `%` 없음 |
| `StudentTab.tsx` | assignees + 이름. 점수/상태 보류. 선택 시 참여 결과 |
| `ResponseGrid.tsx` | `Primary` → `Title`. 단건 `items[]` + CMS name/`seq`/성격 |
| `LessonReportDetailPage.tsx` | debug `console.log` 제거. fetch 없음 |
| `PageTab.tsx` | API 없음. 빈 뷰만 |

### 검증

- `npx tsc -b` 성공
- 변경 파일 eslint `--fix` 후 통과
- 로그인 교사 브라우저 클릭스루는 이 세션에서 도구가 없어 미실시

### 보류 (계획과 동일)

반 배지, 학생 리스트 점수·진행상태, `PageTab` API, `CaptureOverlay`

---



# 추가계획19 — 학생 수업 결과보기 (`StudentLessonResultPage`) UI/UX

> **목표**: prototype `StudentResourcePage`의 화면 구성·문구·상호작용을  
> `frontend/src/pages/student-lesson/StudentLessonResultPage.tsx`에 **동등하게** 구현한다.  
> **준수**: `frontend/AGENTS.md`, `frontend/CLAUDE.md` (FSD Lite, Emotion, 서버/로컬 상태 분리)  
> **프로토타입 참조**: UI/동작만. 코드 구조·Tailwind·Context 복제 금지  
> **범위**: **UI + 로컬 목업**. API 연동 없음.  
> **비범위**: 교사 `ReportDetail`(추가계획17), 상세 API(추가계획18), `StudentView`/`StudentTaskList`(이 페이지에 없음)

---

## 1. 목표

학생 레이아웃 LNB **수업 결과보기** (`/student/lesson/result`)에, 프로토타입 학생 자료실(화면5)과 같은 UX를 넣는다.

구현 기준 화면:

`prototype/src/features/student-resources/pages/StudentResourcePage.tsx`

구성(프로토타입 `StudentResourceInner`):

```
breadcrumb    "수업 › 수업 결과보기"
└─ (목록일 때)
    ├─ StudentBanner           ← 진행 중 수업 + 참여하기
    └─ StudentReportDashboard  ← "나의 수업 결과" 리스트
└─ (상세일 때)
    └─ StudentDetailReport     ← 돌아가기 + 요약 타일 + 페이지별 내 활동
(+ 토스트)
```

교사 `LessonResultPage`(StatusPanel + 필터 + 카드 그리드)와 **다른 화면**이다. 교사 위젯을 재배치해서 만들지 않는다.

---

## 2. 현황

| 구분 | 위치 | 비고 |
|------|------|------|
| 학생 페이지 | `pages/student-lesson/StudentLessonResultPage.tsx` | `Page` 안에 문구 `"학생 결과보기 페이지"`만 있음 |
| 라우트 | `app/router/routes.tsx` | `StudentProtectedLayout` 아래 `/student/lesson/result` |
| LNB | `widgets/layout/StudentLayout.tsx` | `"수업 결과보기"` → `/student/lesson/result` |
| 참여 풀스크린 | `/student/lesson/:accessKey` (`LessonJoinPage`) | `StudentFullscreenLayout`. 추가계획12. **이번 페이지와 레이아웃이 다름** |
| 교사 결과 목록 | `/lesson/result` | 추가계획15·16 |
| 교사 결과 상세 | `/lesson/result/:activityId` | 추가계획17. 학생 상세와 다름 |
| 프로토타입 진입 | `StudentResourcePage` | Provider + Inner + Toast. `detailId` 로컬 state로 목록↔상세 |
| 프로토타입 목록 | `StudentBanner` + `StudentReportDashboard` | 완료+상세 있는 행만 상세 진입 |
| 프로토타입 상세 | `StudentDetailReport` | 본인 요약 + 페이지별 내 답/정답/정오/보기 |

`pages/index.ts`에 `StudentLessonResultPage` export는 아직 없다. routes가 페이지 파일을 직접 import한다.

---

## 3. 프로토타입 화면 동작 (구현해야 할 UX)

### 3.1 공통 셸

- 콘텐츠 최대 너비 **896px** (`max-w-4xl` 동등), 가로 중앙
- 상단 breadcrumb: `수업 › 수업 결과보기` (작은 글씨, gray)
- breadcrumb **아래** `gap`이 있는 세로 스택. breadcrumb은 목록/상세 **모두** 유지
- 교사 결과보기처럼 큰 페이지 타이틀+설명 문단을 **추가하지 않음** (프로토타입에 없음)

### 3.2 진행 중 배너 (`StudentBanner`)

한 줄 카드.

- 좌: pulse 점 (success/emerald)
- 중: 제목 **수업이 진행 중이에요** / 부제 **감정 체크인 활동 · 김민지 선생님** (목업 문구 그대로)
- 우: **참여하기** 버튼 (success 배경, 흰 글자)

클릭: 프로토타입은 Context toast `'활동 뷰어 접속 (QR/링크 · SSO 자동식별)'`.  
frontend는 **sonner**로 동등 메시지. 이번 범위에서 `LessonJoinPage`로 가지 않음 (accessKey 목업을 만들지 않음). 실제 이동은 API 후속.

목업 단계에서는 배너를 **항상** 보여 준다. 진행 중 활동이 없을 때 숨기는 분기는 API 후속.

### 3.3 목록 (`StudentReportDashboard`)

- 섹션 제목: **나의 수업 결과**
- **세로 리스트** (교사 카드 그리드 아님). 행 사이 좁은 gap
- 각 행은 왼쪽 정렬 버튼/카드:

| 요소 | 동작 |
|------|------|
| 제목 | 1줄 말줄임, bold |
| 상태 뱃지 | `완료` / `진행중` / `미제출` / `대기` |
| `Calendar` + `마감 {MM/DD}` | 목업 `due` |
| 정답률 | `status === '완료'` 이고 `correctRate`가 숫자일 때만 `정답률 {n}%` (emerald/success) |
| `정답 없는 활동` | 완료인데 `correctRate == null` |
| `ChevronRight` | **상세가 있는 행만** |

클릭:

- 상세 목업이 **있으면** 상세로 이동
- **없으면** toast **아직 제출하지 않은 활동이에요.** (제출 전·대기 행)
- 상세 없는 행: hover 강조 약하게, `opacity`로 비활성에 가깝게 (프로토타입 `opacity-80`)

### 3.4 상세 (`StudentDetailReport`)

교사 `ReportDetail`(학생별/페이지별 탭, 반 전체)과 **다른 화면**. 탭 바를 넣지 않는다.

**돌아가기**

- `ChevronLeft` + **나의 수업 결과로 돌아가기**
- 목록으로 복귀. `navigate(-1)` 사용 금지 (직접 URL 진입 대비)

**요약 카드**

- 활동 제목 (lg, extrabold)
- 타일 가로 균등 (`tiles.length`열):

| 타일 | 값 | 서브 |
|------|-----|------|
| 활동 페이지 | `{pages}/{totalPages} p` | 없음 |
| 정답률 / 맞춘 문제 | `{rate}%` | `{correctN}/{gradedN}개` — **채점 문항 있을 때만** (`gradedN > 0`) |
| 활동 시간 / 제출 | `{n}분 {ss}초` (`durationSec`) | `submittedAt` 또는 **미제출** |

**페이지별 내 활동**

섹션 제목: **페이지별 내 활동**

각 행:

- 좌: 캡처 placeholder (`Image` 아이콘, gray 박스). 실제 이미지 없음
- 중: 순번 · `NatureBadge`(개념/활동/문항) · 제목
- 문항 + 응답 있음: `내 답 {submitAnswer \|\| '—'}` · 정답 있으면 `정답 {correctAnswer}`
- 그 외: 개념은 **조회함**, 아니면 `submitAnswer` 또는 **제출함**
- 우: 정오 + 보기
  - 문항이고 정답이 있고 응답 있음 → `ErrataBadge` (1=O, 2=X, 3=△, 4=–)
  - 아니면 회색 **–** (정오 대상 아님)
  - 응답 있음 → **보기** 활성. 클릭 시 toast `{제목} 캡처 보기 (목업)`
  - 응답 없음 → **보기** disabled

캡처 확대 오버레이는 **비범위** (추가계획17과 동일).

### 3.5 토스트

프로토타입 `StudentResourceProvider` + 하단 고정 Toast는 **가져오지 않는다**.  
프로젝트 기존 `sonner` (`toast.message` / `toast.info`)를 쓴다.

대상 메시지:

- 상세 없는 행 클릭: `아직 제출하지 않은 활동이에요.`
- 참여하기: `활동 뷰어 접속 (QR/링크 · SSO 자동식별)`
- 보기: `{페이지 제목} 캡처 보기 (목업)`

---

## 4. 프로토타입과의 구조 차이 (의도적)

`AGENTS.md`: prototype은 UI·동작 기준. 구조·Context·Tailwind는 가져오지 않는다.  
목록↔상세 전환은 추가계획17과 같은 **독립 라우트**로 한다.

| 프로토타입 | frontend (이번 계획) | 이유 |
|------------|----------------------|------|
| `detailId` state로 같은 페이지에서 교체 | 목록 `/student/lesson/result`, 상세 `/student/lesson/result/:activityId` | URL·새로고침·뒤로가기. 추가계획17과 동일 패턴 |
| `StudentResourceProvider` (toast만) | 없음. sonner | Context 금지, 기존 토스트 재사용 |
| Tailwind | Emotion `styled` + `theme.*` | CLAUDE.md |
| `STUDENT_REPORTS` / `STUDENT_REPORT_DETAILS` 직접 import | `features/lesson/model` 목업 | prototype `mock-data.ts` 복사 금지 |
| `StudentView` + `StudentTaskList` | **비범위** | `StudentResourcePage`가 렌더하지 않음 |

레이아웃은 **학생 사이드바** (`StudentProtectedLayout`)를 유지한다.  
`StudentFullscreenLayout` / `LessonJoinPage`에 넣지 않는다.

상세 URL에서도 breadcrumb는 보이고, 배너·목록은 **렌더하지 않는다** (프로토타입이 상세일 때 목록을 통째로 바꾸는 것과 동등).

---

## 5. URL · 진입 · 나가기

### 5.0 라우트 (`routes.tsx`)

`StudentProtectedLayout` 블록, 기존 목록과 **같은 부모** 아래.

```
목록  /student/lesson/result
상세  /student/lesson/result/:activityId
```

```tsx
<Route path='/student/lesson/result' element={<StudentLessonResultPage />} />
<Route path='/student/lesson/result/:activityId' element={<StudentLessonResultDetailPage />} />
```

주의:

- `/student/lesson/:accessKey`는 **다른 레이아웃 트리** (`StudentFullscreenLayout`). 상세 라우트를 그 트리에 넣으면 사이드바가 사라진다
- `activityId` 세그먼트 `result`와 accessKey가 섞이지 않도록, 결과보기 경로는 지금처럼 `Protected` 쪽에만 둔다
- LNB `pathname.startsWith('/student/lesson/result')`라 상세에서도 **수업 결과보기**가 활성으로 남는다 (유지)

### 5.1 목록 → 상세

```ts
navigate(`/student/lesson/result/${item.id}`);
```

- `{activityId}` = 목록 목업 항목 `id` (프로토타입 `sr-1` 등)
- 이번 범위에서 query string 유지 요구 없음 (교사 목록 필터가 없음)
- `state`에 목록 항목을 넘겨 상세 제목 fallback에 쓸 수 있다. 없어도 화면은 렌더 (목업 없으며 상세 `null`에 가깝게 처리 — 아래 §8)

### 5.2 상세 → 목록

문구: `‹ 나의 수업 결과로 돌아가기`

```ts
navigate('/student/lesson/result');
```

`navigate(-1)` 금지.

---

## 6. FSD 배치

`pages → widgets → features → shared` 단방향.  
**Pages는 얇게** — 목록/상세 마크업·목업 조회를 page에 두지 않는다.

교사 결과 위젯(`widgets/lesson/result/`)과 섞지 않도록 **학생 전용 폴더**를 둔다.

```text
pages/student-lesson/
  StudentLessonResultPage.tsx          ← 목록 조합 (셸 + 배너 + 대시보드)
  StudentLessonResultDetailPage.tsx    ← 상세 조합 (셸 + 상세 위젯). params만 전달
pages/index.ts                         ← 두 페이지 export

app/router/routes.tsx                  ← 목록 + 상세 (StudentProtectedLayout)

widgets/lesson/student-result/
  StudentLessonResultShell.tsx         ← max-width + breadcrumb + 세로 gap
  StudentLessonBanner.tsx              ← 진행 중 배너
  StudentReportDashboard.tsx           ← "나의 수업 결과" 리스트
  StudentReportRow.tsx                 ← 한 행 (Dashboard 내부에 둬도 됨)
  StudentDetailReport.tsx              ← 돌아가기 + 요약 + 페이지별 내 활동
  studentResultBadges.tsx              ← 목록 상태 뱃지 (완료/진행중/미제출/대기)
  index.ts

widgets/lesson/index.ts                ← student-result re-export

features/lesson/model/
  studentReportTypes.ts                ← 목록/상세 타입 (아래 §8)
  studentReportMock.ts                 ← frontend 목업. prototype 파일 복사 금지
features/lesson/index.ts               ← 타입·목업·getter export
```

위젯이 features 목업/타입만 import한다. features가 widgets를 import하지 않는다.

`pages/student-lesson`에 styled를 두지 않는다. 지금 파일의 `Page` styled는 셸 위젯으로 옮기거나 제거한다.

---

## 7. 프로토타입 → frontend 변환 기준

| 프로토타입 | frontend 처리 |
|------------|---------------|
| Tailwind | Emotion `styled` 또는 `css`. `className="max-w-4xl"` 금지. 너비는 `896px` |
| `useStudentResource()` | 사용 금지 |
| `STUDENT_ME` / `STUDENT_TASKS` | 이 화면 비사용. 목업에 넣지 않음 |
| 색상 (`emerald-*`, `primary-*`, `gray-*`) | `theme.ts` 토큰 우선 (success / primary / gray). 없는 값은 가장 가까운 기존 토큰 |
| lucide (`Calendar`, `ChevronRight`, `ChevronLeft`, `Image`, `Play`) | 프로젝트에서 사용 중이면 그대로 |
| 이모지 | 넣지 않음 |
| 하단 커스텀 Toast | sonner |
| 교사 `ReportCard` / `ReportDetail` / `StudentTab` | **재사용 금지** (다른 IA) |

### 7.1 뱃지 재사용

| 뱃지 | 처리 |
|------|------|
| `NatureBadge` (개념/활동/문항) | 추가계획17 `widgets/lesson/result/reportBadges.tsx` **재사용** |
| `ErrataBadge` (O/X/△/–) | 동일 파일 **재사용** |
| 목록 상태 `완료`/`진행중`/`미제출`/`대기` | 교사 `StudentStatusBadge`는 `statusCd`(2·3·4·5, 라벨에 `제출` 있음)라 **값이 다름** → `studentResultBadges.tsx`에 학생 목록 전용 |
| 교사 `ActivityStatusBadge` (OPEN/…) | 사용 금지. 학생 목록은 제출 상태이지 활동 availability가 아님 |

`@widgets/lesson`에서 `NatureBadge`/`ErrataBadge`를 export해 학생 위젯이 쓰게 한다. features로 승격은 아직 하지 않는다.

### 7.2 공통 UI 선행 점검

| 후보 | 결론 |
|------|------|
| `Button` | 참여하기는 success fill, 돌아가기·보기는 링크/작은 outline. 공용 Button과 불일치 → **위젯 로컬** |
| `Card` | padding/radius가 `p-4`/`p-5`, `rounded-2xl`과 다를 수 있음 → **위젯 로컬** |
| `PageTitle` | 이 화면은 breadcrumb + 섹션 h2 → **미사용** |
| `Badge` / `TypeBadge` | 상태·성격 토큰이 다름 → **로컬/기존 reportBadges** |

---

## 8. 타입 · 목업

프로토타입 `types.ts`를 frontend 이름으로 재구성한다. `mock-data.ts`를 복사하지 않는다.

```ts
export type StudentResultStatus = '완료' | '진행중' | '미제출' | '대기';

export interface StudentReportListItem {
  id: string;
  title: string;
  status: StudentResultStatus;
  due: string; // 'MM/DD'
  correctRate?: number | null;
}

export interface StudentReportDetailView {
  id: string;
  title: string;
  summary: {
    pages: number;
    totalPages: number;
    correctN: number;
    gradedN: number;
    durationSec: number;
    submittedAt?: string;
  };
  articles: Array<{
    id: string;
    order: number;
    nature: ArticleNature; // 기존 features/lesson 타입 재사용
    itemType: string;
    title: string;
    correctAnswer?: string;
  }>;
  responses: Array<{
    articleId: string;
    submitAnswer: string;
    errata: ErrataCd; // 기존 1\|2\|3\|4
    captureImage?: string;
  }>;
}
```

목업 데이터는 프로토타입과 **같은 시나리오**로 구성한다 (문구·건수를 맞춰 UI 비교 가능하게).

| id | 목록 | 상세 |
|----|------|------|
| `sr-1` | 갈등 해결 시나리오 / 완료 / 마감 07/22 / 정답률 100 | 있음 (페이지 6, 채점 2/2) |
| `sr-2` | 자기인식 워크시트 / 미제출 / 07/24 | 없음 → toast |
| `sr-3` | 자기관리 목표 세우기 / 대기 / 07/27 | 없음 → toast |
| `sr-4` | 정서 안정 호흡 활동 / 완료 / 07/03 / `correctRate: null` | 있음 (정답 없는 활동, 채점 타일 없음) |

getter:

- `getStudentReportList(): StudentReportListItem[]`
- `getStudentReportDetail(id: string): StudentReportDetailView | undefined`

상세 페이지에서 목업이 없으면 **빈 화면(`null`)** 이 아니라, 돌아가기만 있는 안전한 빈 상태 또는 목록으로 되돌리기를 택한다. 가짜 상세를 모든 id에 붙이지 않는다. 빈 상태 **새 문구는 만들지 않음** — 프로토타입도 `if (!d) return null`. 직접 URL로 없는 id면 돌아가기만 보이게 한다.

시간 표시: `durationSec` → `{floor(sec/60)}분 {pad2(sec%60)}초` (프로토타입 `fmt`와 동일).

---

## 9. 페이지 조합

### 9.1 `StudentLessonResultPage`

```tsx
<StudentLessonResultShell>
  <StudentLessonBanner />
  <StudentReportDashboard />
</StudentLessonResultShell>
```

### 9.2 `StudentLessonResultDetailPage`

```tsx
const { activityId } = useParams();
if (!activityId) return null;
return (
  <StudentLessonResultShell>
    <StudentDetailReport activityId={activityId} />
  </StudentLessonResultShell>
);
```

`StudentDetailReport`가 getter로 상세를 읽고, 돌아가기에서 `navigate('/student/lesson/result')`.

---

## 10. 하지 말 것

- `prototype` 폴더 구조, `StudentResourceContext`, Tailwind 복사
- 교사 `LessonResultPage` / `ReportCard` / `ReportDetail` / `StudentTab` / `PageTab` 재사용
- `StudentView`, `StudentTaskList`, `StudentTaskCard`, `STUDENT_TASKS` (이 페이지 UI 아님)
- 실제 활동 목록/상세/progress API, 빈 React Query 훅, `useEffect` fetch
- `참여하기` → `/student/lesson/:accessKey` 이동 (accessKey 없이 가짜 키 생성 금지)
- `CaptureOverlay`, 캡처 이미지 실제 표시, 그리기/녹음 플레이어
- 추가계획18(교사 상세 API)과 학생 화면을 한 작업으로 섞기
- 기준에 없는 문구·버튼·탭·필터 칩 추가 (교사식 StatusPanel/필터 금지)
- 주석/UI 이모지
- `any`, 요청과 무관한 리팩터링

---

## 11. 구현 순서 (체크리스트)

- [x] `features/lesson/model/studentReportTypes.ts` · `studentReportMock.ts` · barrel export
- [x] `widgets/lesson/student-result/StudentLessonResultShell.tsx` (896px + breadcrumb)
- [x] `studentResultBadges.tsx` (목록 상태 4종)
- [x] `StudentLessonBanner.tsx` (목업 문구 + 참여하기 toast)
- [x] `StudentReportDashboard.tsx` (+ 행 UI)
- [x] `StudentDetailReport.tsx` (요약 타일 + 페이지별 내 활동)
- [x] `pages/student-lesson/StudentLessonResultPage.tsx` 조합으로 교체
- [x] `pages/student-lesson/StudentLessonResultDetailPage.tsx` 추가
- [x] `pages/index.ts` export, `routes.tsx`에 `/student/lesson/result/:activityId`
- [x] `widgets/lesson/student-result/index.ts` 및 `widgets/lesson/index.ts`
- [x] `NatureBadge` / `ErrataBadge`를 학생 상세에서 re-export로 사용
- [x] `npx tsc -b --noEmit` + `npx eslint <변경 파일>` (`AGENTS.md` 검증)

---

## 12. 완료 기준

- `/student/lesson/result`에서 breadcrumb + 배너 + **나의 수업 결과** 리스트가 프로토타입과 동등하게 보인다
- 완료+상세 있는 행(sr-1, sr-4) 클릭 시 `/student/lesson/result/{id}`로 이동하고, 배너·목록 없이 상세가 보인다
- 상세 없는 행 클릭 시 페이지 이동 없이 toast `아직 제출하지 않은 활동이에요.`
- 완료+`correctRate: null` 행에 **정답 없는 활동**이 보이고, 상세에서는 정답률 타일이 없다
- 돌아가기 시 `/student/lesson/result`로 복귀한다
- 보기(활성) / 참여하기는 toast만. 캡처 오버레이·참여 embed 없음
- Tailwind·StudentResource Context 없음. page에 목록/상세 마크업 없음
- 학생 사이드바가 목록·상세 모두 유지된다
- TypeScript · ESLint 에러 없음 (`no-unused-vars` 제외 규칙은 기존 eslint 설정)

---

## 13. 후속 (이번 비범위)

- 학생 배정 활동 목록 API · 본인 리포트 상세 API
- 배너: 실제 진행 중 활동이 없으면 숨김, **참여하기** → `/student/lesson/:accessKey`
- 캡처 보기 실데이터
- 추가계획18(교사 상세 API)과 응답 스키마를 맞출지 여부는 API 스펙 확정 때 판단

---

## 14. 참고 파일

| 역할 | 경로 |
|------|------|
| 프로토타입 페이지 (기준) | `prototype/src/features/student-resources/pages/StudentResourcePage.tsx` |
| 프로토타입 배너 | `.../components/StudentBanner.tsx` |
| 프로토타입 목록 | `.../components/StudentReportDashboard.tsx` |
| 프로토타입 상세 | `.../components/StudentDetailReport.tsx` |
| 프로토타입 뱃지 | `.../components/badges.tsx` |
| 프로토타입 타입·목업 | `.../types.ts`, `.../mock-data.ts` |
| 구현 대상 목록 페이지 | `frontend/src/pages/student-lesson/StudentLessonResultPage.tsx` |
| 학생 레이아웃·LNB | `frontend/src/widgets/layout/StudentLayout.tsx` |
| 라우트 | `frontend/src/app/router/routes.tsx` |
| 성격·정오 뱃지 (재사용) | `frontend/src/widgets/lesson/result/reportBadges.tsx` |
| 교사 상세 (재사용 금지, 대조) | `frontend/src/pages/lesson/LessonReportDetailPage.tsx` |
| 학생 참여 (배너 후속) | `frontend/src/pages/lesson/LessonJoinPage.tsx` |
| 아키텍처 | `frontend/AGENTS.md`, `frontend/CLAUDE.md` |
| 테마 | `frontend/src/app/styles/theme.ts` |

---

**작성일**: 2026-08-26  
**상태**: 구현 완료 (2026-08-26)

## 15. 구현 결과 (2026-08-26)

### 신규 파일

| 파일 | 역할 |
|------|------|
| `src/features/lesson/model/studentReportTypes.ts` | 학생 목록/상세 타입 |
| `src/features/lesson/model/studentReportMock.ts` | 목록·상세 목업 + getter (`sr-1`·`sr-4`만 상세) |
| `src/widgets/lesson/student-result/StudentLessonResultShell.tsx` | 896px + breadcrumb |
| `src/widgets/lesson/student-result/StudentLessonBanner.tsx` | 진행 중 배너 + 참여하기 toast |
| `src/widgets/lesson/student-result/StudentReportDashboard.tsx` | 나의 수업 결과 리스트 |
| `src/widgets/lesson/student-result/StudentDetailReport.tsx` | 돌아가기 + 요약 타일 + 페이지별 내 활동 |
| `src/widgets/lesson/student-result/studentResultBadges.tsx` | 목록 상태 뱃지 (완료/진행중/미제출/대기) |
| `src/widgets/lesson/student-result/index.ts` | barrel |
| `src/pages/student-lesson/StudentLessonResultDetailPage.tsx` | 상세 라우트 페이지. params만 전달 |

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/student-lesson/StudentLessonResultPage.tsx` | 셸 + 배너 + 대시보드 조합 |
| `src/pages/index.ts` | 목록·상세 페이지 export |
| `src/app/router/routes.tsx` | `/student/lesson/result/:activityId` (`StudentProtectedLayout`) |
| `src/features/lesson/index.ts` | 학생 리포트 타입·getter export |
| `src/widgets/lesson/result/index.ts` | `NatureBadge` / `ErrataBadge` export |
| `src/widgets/lesson/index.ts` | student-result · Nature/Errata re-export |

### 라우트

- 목록: `/student/lesson/result`
- 상세: `/student/lesson/result/:activityId` (`sr-1`, `sr-4`)
- 돌아가기: `/student/lesson/result` (`navigate(-1)` 미사용)
- 레이아웃: 목록·상세 모두 `StudentProtectedLayout` (사이드바 유지)

### 검증 결과

- `npx tsc -b --noEmit` — 에러 없음
- `npx eslint --fix` (변경 파일) — 에러 없음
- `npx vite build` — 성공

### 비고

- API 없음. 목업 getter만 사용
- 상세 없는 행(sr-2, sr-3)은 toast `아직 제출하지 않은 활동이에요.`
- 참여하기·보기(활성)는 sonner toast만. 캡처 오버레이·`LessonJoinPage` 이동 없음
- 없는 `activityId`로 직접 진입하면 돌아가기만 표시

