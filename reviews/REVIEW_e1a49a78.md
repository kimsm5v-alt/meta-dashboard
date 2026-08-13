> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - e1a49a78

## 코드 복잡도 분석

**분석된 파일**: 8개 / 변경된 파일: 9개


### 정상 범위 (NONE)


**`routes.tsx`** (other)

- 평균 복잡도: **0.054**

- 최대 복잡도: 0.463

- 청크 수: 23개

- 평균 사용처: 2.4곳


**권장사항:**

- 파일 크기가 큼 (23개 청크) - 파일 분리 검토


**`lessonlibrarycontents.tsx`** (utility)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.006

- 청크 수: 10개


**권장사항:**

- 복잡도 정상 범위


**`index.ts`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.005

- 청크 수: 16개


**권장사항:**

- 복잡도 정상 범위


**`lessondeploypage.tsx`** (component)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.001

- 청크 수: 3개


**권장사항:**

- 복잡도 정상 범위


**`lessonlibrarypage.tsx`** (utility)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.008

- 청크 수: 14개


**권장사항:**

- 복잡도 정상 범위


**`lessonresultpage.tsx`** (component)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.005

- 청크 수: 13개


**권장사항:**

- 복잡도 정상 범위


**`deploypage.tsx`** (component)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.005

- 청크 수: 204개


**권장사항:**

- 파일 크기가 큼 (204개 청크) - 파일 분리 검토


**`resourcecard.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.010

- 청크 수: 47개


**권장사항:**

- 파일 크기가 큼 (47개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 자료실(`LessonLibrary`)에서 `ResourceCard`의 "시작하기" 버튼을 클릭했을 때 활동 배포 전용 페이지(`DeployPage`)로 이동하는 라우트를 구성하고, 프로토타입 `DeployOverlay.tsx`를 frontend FSD 구조로 재구현한 Phase A(목업) 작업입니다.

- **목적**: 활동 배포 페이지(`/lesson/deploy/:itemId`) 신규 라우트 추가 및 UI 구현, `ResourceCard` 시작하기 버튼 라우트 연결, 자료실/결과 페이지 헤더 구조 정리
- **도메인**: UI / 라우팅 (프론트엔드)
- **변경 방향**: 프로토타입의 `overlay` Context 기반 구조를 독립 페이지로 전환하고, Tailwind 클래스를 Emotion styled-component로 재구현. 실제 API 연동은 Phase B로 분리하여 목업 단계에서 UI·상태 관리에 집중

---

## [GOOD] 잘된 점

1. **FSD 구조 준수 및 얇은 페이지 유지**: `pages/lesson/LessonDeployPage.tsx`는 5줄로 유지하고 실질 UI는 `features/lesson/ui/DeployPage.tsx`에 위임하여 계층 책임이 명확합니다.
2. **`validClasses` 파생 로직의 우아한 처리**: `groupsLoading` 중에는 프리셋을 유지하고, 로딩 완료 후 실제 `groups`에 존재하지 않는 ID(권한 없는 반 등)를 필터링하는 방식은 UX 단절 없이 데이터 정합성을 확보합니다.
3. **쿼리 파라미터 보존 설계**: `ResourceCard`에서 `location.search`를 그대로 이어붙여 `?class=` 뿐 아니라 향후 추가될 파라미터도 자동으로 전달되도록 한 점이 확장성 측면에서 좋습니다.
4. **`useMyGroupsQuery` 캐시 공유 활용**: 기존 `groupKeys.myGroups(userId)` 캐시를 재사용하여 ScopeTree·AssessmentPage 등에서 이미 호출된 경우 네트워크 요청 없이 즉시 반환되는 구조를 채택했습니다.

---

## 변경사항 요약

- `DeployPage.tsx` 신규 작성 (847줄) — 대상 반 선택 드롭다운, 시작 방식(기간/실시간), 배포 결과 카드 UI
- `routes.tsx`에 `/lesson/deploy/:itemId` 라우트 추가
- `ResourceCard.tsx` 시작하기 버튼에 `useNavigate` + `location.search` 연결
- `LessonLibraryPage` / `LessonResultPage`에 헤더(Title + Description) 추가, `LessonLibraryContents`에서 중복 헤더 제거

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

1. **`formatDate`/`today`/`nextWeek` 모듈 최상위 평가로 인한 날짜 고정 문제**
   - **위치**: `DeployPage.tsx` 30~33번 줄
   - **기존 코드**:
     ```ts
     const formatDate = (d: Date) => d.toISOString().slice(0, 10);
     const today = new Date();
     const nextWeek = new Date(today);
     nextWeek.setDate(today.getDate() + 7);
     ```
   - **문제**: `today`와 `nextWeek`가 모듈 로드 시점에 1회만 평가됩니다. 페이지를 다음 날 열어도 `start`/`end` 초기값이 이전 날짜로 고정되어, 자정이 지난 후 접속한 사용자에게 과거 날짜가 기본 선택됩니다. `useState` 초기값은 마운트 시점에 평가되므로 `useState(formatDate(today))`로 전달해도 이미 고정된 상수값이 사용됩니다.
   - **해결 방안**:
     ```ts
     const formatDate = (d: Date) => d.toISOString().slice(0, 10);

     export const DeployPage = () => {
       // ...
       const today = new Date();
       const nextWeek = new Date(today);
       nextWeek.setDate(today.getDate() + 7);

       const [start, setStart] = useState(formatDate(today));
       const [end, setEnd] = useState(formatDate(nextWeek));
       // ...
     };
     ```
     컴포넌트 내부로 이동하면 마운트 시점의 날짜가 반영됩니다.

2. **`variant="my"` 카드에서도 시작하기 버튼이 배포 페이지로 이동하는 문제**
   - **위치**: `ResourceCard.tsx` 61~66번 줄
   - **기존 코드**:
     ```tsx
     <Button
       type='button'
       variant='primary'
       size='md'
       fullWidth
       onClick={() => navigate(`/lesson/deploy/${item.id}${location.search}`)}
     >
       시작하기
     </Button>
     ```
   - **문제**: `variant`가 `'my'`인 나의 자료 카드에서도 동일하게 배포 페이지로 이동합니다. 나의 자료는 수정/삭제가 주 기능이며, 배포는 자료실(`library`) 카드에서만 가능해야 하는 요구사항일 가능성이 높습니다. `variant`에 따라 동작을 분기하거나, `my`에서는 시작하기 버튼을 숨기는 것이 적절합니다.
   - **해결 방안**:
     ```tsx
     {variant === 'library' && (
       <Button
         type='button'
         variant='primary'
         size='md'
         fullWidth
         onClick={() => navigate(`/lesson/deploy/${item.id}${location.search}`)}
       >
         시작하기
       </Button>
     )}
     ```

### Medium (개선 권장)

1. **`DeployPage`의 `validClasses` 오류 상태 처리 개선**
   - **위치**: `DeployPage.tsx` 55~59번 줄
   - **기존 코드**:
     ```ts
     const validClasses = groupsLoading
       ? classes
       : groupsError
         ? []
         : classes.filter((id) => groups.some((g) => g.id === id));
     ```
   - **문제**: `groupsError`일 때 `validClasses`가 `[]`가 되어 `selectedLabel`이 "반을 선택하세요"로 표시되지만, `classes` state에는 여전히 프리셋 값이 남아 있습니다. 사용자가 드롭다운을 열어 "다시 시도"로 성공하면 `classes`에 남아있던 프리셋이 다시 유효해집니다. 이는 의도된 동작일 수 있으나, 오류 상태에서 `classes`를 초기화할지 여부를 명시적으로 결정하는 것이 좋습니다.

2. **`DeployPage`의 `LinkInput` 하드코딩 URL**
   - **위치**: `DeployPage.tsx` 330번 줄
   - **기존 코드**:
     ```tsx
     <LinkInput readOnly value='https://class.visang.co.kr/viewer/6ab0…' aria-label='참여 링크' />
     ```
   - **문제**: 목업 단계임을 감안하더라도, 하드코딩된 URL이 추후 API 연동 시 누락될 가능성이 있습니다. `deployed` state에 `link` 필드를 추가하고 Phase B에서 실제 URL로 교체할 수 있도록 구조를 미리 잡아두는 것이 좋습니다.

3. **`LessonLibraryContents`에서 `GridWrap` 제거로 인한 레이아웃 변화**
   - **위치**: `LessonLibraryContents.tsx`
   - **기존 코드**:
     ```tsx
     <Contents>
       <ResourceCardList items={items} />
     </Contents>
     ```
   - **문제**: 기존 `GridWrap`의 `margin-top: ${({ theme }) => theme.spacing.md}`가 제거되어 헤더와 카드 그리드 사이 간격이 사라졌습니다. `Contents`의 `margin-bottom`만으로는 상단 여백이 확보되지 않을 수 있습니다. `ResourceCardList` 내부에 이미 상단 여백이 있는지 확인이 필요합니다.

---

## 주요 파일 분석

### `frontend/src/features/lesson/ui/DeployPage.tsx` (신규, 847줄)

**변경 내용:**
활동 배포 UI 전체 구현 — 대상 반 선택 드롭다운, 시작 방식(기간/실시간) 선택, 배포 결과 카드.

**개선 제안:**

1. **날짜 초기값 모듈 레벨 고정 문제** (High 이슈 1 참조)
   - **위치**: 30~33번 줄
   - **기존 코드**:
     ```ts
     const today = new Date();
     const nextWeek = new Date(today);
     nextWeek.setDate(today.getDate() + 7);
     ```
   - **해결 방안**: 컴포넌트 내부로 이동하여 마운트 시점 날짜 반영

2. **`resolveGroupName`의 fallback 처리**
   - **위치**: 52번 줄
   - **기존 코드**:
     ```ts
     const resolveGroupName = (id: string) => groups.find((g) => g.id === id)?.name ?? id;
     ```
   - **문제**: `validClasses`가 `groups`에 존재하는 ID만 필터링하므로 `resolveGroupName`이 `id`를 그대로 반환하는 경우는 사실상 없습니다. 다만 `groupsError` 상태에서 `validClasses`가 `[]`가 되므로 안전합니다. 이 코드는 방어적으로 잘 작성되었습니다.

3. **`doDeploy`의 `start`/`end` 검증 부재**
   - **위치**: 67~80번 줄
   - **기존 코드**:
     ```ts
     const doDeploy = () => {
       if (validClasses.length === 0) {
         toast.error('대상 반을 선택하세요');
         return;
       }
       // ...
     };
     ```
   - **문제**: `mode === 'period'`일 때 `start`가 `end`보다 늦은 날짜인 경우를 검증하지 않습니다. 사용자가 종료일을 시작일보다 앞서 선택하면 잘못된 기간으로 배포됩니다. Phase B에서 서버 검증이 추가되겠지만, 목업 단계에서도 간단한 클라이언트 검증을 추가하는 것이 좋습니다.
   - **해결 방안**:
     ```ts
     if (mode === 'period' && start > end) {
       toast.error('종료일이 시작일보다 빠릅니다');
       return;
     }
     ```

### `frontend/src/features/lesson/ui/ResourceCard.tsx`

**변경 내용:**
시작하기 버튼에 `useNavigate` + `location.search` 연결로 배포 페이지 이동 추가.

**개선 제안:**

1. **`variant="my"` 분기 처리** (High 이슈 2 참조)
   - **위치**: 61~66번 줄
   - **기존 코드**:
     ```tsx
     <Button
       type='button'
       variant='primary'
       size='md'
       fullWidth
       onClick={() => navigate(`/lesson/deploy/${item.id}${location.search}`)}
     >
       시작하기
     </Button>
     ```
   - **해결 방안**: `variant === 'library'` 조건으로 감싸기

2. **`location.search` 사용 시 주의점**
   - `location.search`는 현재 URL의 쿼리 문자열 전체를 포함하므로, `?class=abc&student=xyz` 형태가 그대로 배포 페이지 URL에 전달됩니다. 이는 의도된 설계이며, 향후 파라미터 추가 시 자동으로 전달되는 장점이 있습니다. 다만 `?class=` 값이 URL 인코딩이 필요한 특수문자를 포함할 경우 `navigate`가 자동으로 처리하므로 문제없습니다.

### `frontend/src/pages/lesson/LessonLibraryPage.tsx` / `LessonResultPage.tsx`

**변경 내용:**
각 페이지에 `ContentsHeader`(Title + Description) 추가, `LessonLibraryContents`에서 중복 헤더 제거.

**개선 제안:**

1. **중복 코드 패턴**: `LessonLibraryPage`와 `LessonResultPage`에 동일한 `ContentsHeader`/`Title`/`Description` styled-component가 중복 정의되었습니다. 공통 컴포넌트(`@shared/ui/PageHeader`)로 추출하면 유지보수성이 향상됩니다.

### `frontend/src/app/router/routes.tsx`

**변경 내용:**
`/lesson/deploy/:itemId` 라우트 추가.

**개선 제안:**

1. **라우트 순서**: `/lesson/deploy/:itemId`가 `/lesson/library`, `/lesson/my`, `/lesson/result` 뒤에 추가되었습니다. React Router v6는 라우트 매칭 시 순서보다는 점수(static > dynamic)로 판단하므로 문제없습니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [x] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

전체적으로 FSD 구조를 잘 지키고, 목업 단계에서 API 연동 지점을 명확히 분리한 좋은 구현입니다. `validClasses` 파생 로직과 쿼리 파라미터 보존 설계는 특히 인상적입니다. 다만 두 가지 High 이슈(날짜 초기값 모듈 레벨 고정, `variant="my"` 카드의 배포 이동)는 사용자 경험에 직접 영향을 주는 문제이므로 수정을 권장합니다. 특히 날짜 고정 문제는 자정 이후 접속 시 과거 날짜가 기본 선택되는 명백한 버그로, 컴포넌트 내부로 이동하는 간단한 수정으로 해결됩니다. 수정 후 승인 가능한 수준입니다.