> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - caec0eb0

## 코드 복잡도 분석

**분석된 파일**: 12개 / 변경된 파일: 12개


### 정상 범위 (NONE)


**`homegreetingband.tsx`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.008

- 청크 수: 12개


**권장사항:**

- 복잡도 정상 범위


**`inprogresslessoncard.tsx`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.006

- 청크 수: 23개


**권장사항:**

- 파일 크기가 큼 (23개 청크) - 파일 분리 검토


**`lessonstatussection.tsx`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.009

- 청크 수: 21개


**권장사항:**

- 파일 크기가 큼 (21개 청크) - 파일 분리 검토


**`homepage.tsx`** (component)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.005

- 청크 수: 26개


**권장사항:**

- 파일 크기가 큼 (26개 청크) - 파일 분리 검토


**`activeexamscard.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.009

- 청크 수: 82개


**권장사항:**

- 파일 크기가 큼 (82개 청크) - 파일 분리 검토


**`examkpisection.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.002

- 청크 수: 28개


**권장사항:**

- 파일 크기가 큼 (28개 청크) - 파일 분리 검토


**`examstatussection.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.008

- 청크 수: 53개


**권장사항:**

- 파일 크기가 큼 (53개 청크) - 파일 분리 검토


**`learningcharacteristicssection.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.000

- 청크 수: 17개


**권장사항:**

- 복잡도 정상 범위


**`quicklinkscard.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.001

- 청크 수: 27개


**권장사항:**

- 파일 크기가 큼 (27개 청크) - 파일 분리 검토


**`selcompetencymatrixsection.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.002

- 청크 수: 32개


**권장사항:**

- 파일 크기가 큼 (32개 청크) - 파일 분리 검토


**`typedistributionsection.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.012

- 청크 수: 57개


**권장사항:**

- 파일 크기가 큼 (57개 청크) - 파일 분리 검토


**`index.ts`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.000

- 청크 수: 10개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

홈 대시보드를 검사/수업 탭 구조로 개편하고, 상단에 그리팅 밴드와 KPI 지표 카드를 추가한 UI 리팩토링 커밋입니다. 기존 단일 스크롤 구조에서 탭 기반 구조로 전환하여 검사와 수업 도메인을 분리하고, 진행 중 검사 카드에 응시율 진행바와 빈 상태(Empty State)를 추가했습니다.

- **목적**: 홈 대시보드 UX 개선 및 검사/수업 도메인 분리, 진행 중 검사 카드의 시각적 정보 강화
- **도메인**: UI (프론트엔드 React/Emotion)
- **변경 방향**: 단일 페이지 → 탭 기반 구조, KPI 요약 카드 분리(ExamKpiSection), 진행바/빈 상태 추가, 수업 관련 UI 셸(프로토타입) 신설

## [GOOD] 잘된 점

- **컴포넌트 분리가 명확함**: 기존 `ExamOverviewSection`을 `ExamKpiSection`(KPI 카드)과 `ExamStatusSection`(현황 테이블)으로 분리하여 단일 책임을 부여했습니다. `ExamKpiSection`은 4개 지표(관리 중인 반, 진행 중 검사, 결과 확인 가능, 미응시 학생)를 톤별로 시각화하고, `ExamStatusSection`은 반별 1/2차 응시율 테이블에 진행바를 추가했습니다.
- **빈 상태(Empty State) 처리 개선**: `ActiveExamsCard`에 진행 중 검사가 없을 때 안내 문구와 "검사 시작하기" CTA를 제공하여 사용자 온보딩 흐름을 개선했습니다. `useNavigate`를 통해 `/exam/management`로 이동하는 흐름이 자연스럽습니다.
- **수업 도메인 UI 셸의 명확한 경계**: `InProgressLessonCard`, `LessonStatusSection`, `SELCompetencyMatrixSection`에 타 팀 소관임을 주석으로 명시하고 실데이터 없이 프로토타입 상태만 제공하여, 미완성 기능임을 코드로 명확히 전달했습니다. 특히 `SELCompetencyMatrixSection`은 반 목록만 실데이터(`useHomeExamStats`의 `groups`)로 채우고 역량별 수업 횟수는 0회로 표시하는 전략이 합리적입니다.

## 변경사항 요약

홈 대시보드를 검사/수업 탭 구조로 개편하고, 그리팅 밴드와 KPI 카드를 추가했습니다. 진행 중 검사 카드에 응시율 진행바와 빈 상태를 추가했으며, 수업 관련 위젯은 실데이터 연동 전 UI 셸로 신설했습니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

- **`scrollToExamStatus`의 `setTimeout` 타이밍 의존성**: `HomePage.tsx`에서 탭 전환 후 100ms 지연으로 `scrollIntoView`를 호출합니다. 탭 전환 시 `ExamStatusSection`이 조건부 렌더링(`activeTab === 'exam'`)으로 마운트되는데, 100ms 고정 지연은 렌더링 완료 시점을 보장하지 못합니다. 네트워크/렌더링 지연이 길어지면 `getElementById('exam-status-section')`이 null이 되어 스크롤이 동작하지 않을 수 있습니다. `useEffect` + `requestAnimationFrame` 또는 `useLayoutEffect` 기반으로 전환하는 것이 더 안정적입니다.

### Medium (개선 권장)

- **`HomeGreetingBand`의 이모지 사용**: `안녕하세요, {user?.name ?? '선생님'} 선생님 👋`에서 이모지(👋)가 하드코딩되어 있습니다. 접근성 및 일관성 측면에서 제거하거나 아이콘 컴포넌트(lucide-react)로 대체하는 것이 좋습니다.
- **`ExamKpiSection`과 `ExamStatusSection`의 중복 데이터 호출**: 두 컴포넌트가 각각 `useHomeExamStats()`를 호출합니다. `HomePage`에서 이미 동일 훅을 사용하는 `ActiveExamsCard`와 `HomeGreetingBand`도 있어, 동일 데이터를 여러 번 fetch하는 구조입니다. React Query 캐시로 중복 네트워크 요청은 방지되지만, 컴포넌트 간 상태 공유를 위해 상위에서 훅을 한 번 호출해 props로 전달하는 구조를 고려할 수 있습니다.
- **`ActiveExamsCard`의 `items.slice(0, 3)`**: 진행 중 검사가 3건 초과일 때 나머지 항목이 잘리는데, "모두 보기" 링크가 `onViewAll`로 스크롤 이동만 수행합니다. 사용자가 나머지 항목을 확인하려면 스크롤 후 `ExamStatusSection`에서 확인해야 하는 흐름이므로, UX상 명확한 안내가 필요합니다.

---

## 주요 파일 분석

### HomePage.tsx

**변경 내용:**
검사/수업 탭 구조로 개편하고 그리팅 밴드, KPI 섹션, 탭 내비게이션을 추가했습니다.

**개선 제안:**

1. `scrollToExamStatus`의 고정 `setTimeout` 제거
   - **위치 (라인 번호)**: `scrollToExamStatus` 함수 내부
   - **기존 코드**:
```tsx
const scrollToExamStatus = () => {
  setActiveTab('exam');
  setTimeout(() => {
    document.getElementById('exam-status-section')?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
};
```
   - **해결 방안 (수정 코드)**: `useEffect`와 `requestAnimationFrame`을 조합하여 렌더링 완료 후 스크롤을 보장합니다.
```tsx
const [pendingScroll, setPendingScroll] = useState(false);

useEffect(() => {
  if (!pendingScroll) return;
  const raf = requestAnimationFrame(() => {
    document.getElementById('exam-status-section')?.scrollIntoView({ behavior: 'smooth' });
    setPendingScroll(false);
  });
  return () => cancelAnimationFrame(raf);
}, [pendingScroll, activeTab]);

const scrollToExamStatus = () => {
  setActiveTab('exam');
  setPendingScroll(true);
};
```
   > `useEffect`가 `activeTab` 변경 후 렌더링이 반영된 시점에 실행되므로, 고정 지연 없이 안정적으로 스크롤이 동작합니다.

### ActiveExamsCard.tsx

**변경 내용:**
진행 중 검사 카드에 진행바, 빈 상태, 단일 항목 전용 레이아웃을 추가하고 `onViewAll` prop을 도입했습니다. `buildInProgressItems`에서 `startDate`를 추가하고 응시율 오름차순으로 정렬하여, 가장 저조한 반이 상단에 노출되도록 개선했습니다.

**개선 제안:**

1. `items.slice(0, 3)`으로 잘린 항목에 대한 UX 안내 부재
   - **위치 (라인 번호)**: `items.length >= 2` 분기 내 `items.slice(0, 3)`
   - **기존 코드**:
```tsx
{items.slice(0, 3).map((item) => (
  <Row key={item.key}>
    ...
  </Row>
))}
```
   - **해결 방안 (수정 코드)**: 3건 초과 시 추가 항목 수를 표시하여 사용자에게 안내합니다.
```tsx
{items.slice(0, 3).map((item) => (
  <Row key={item.key}>
    ...
  </Row>
))}
{items.length > 3 && (
  <MoreLink onClick={onViewAll}>
    외 {items.length - 3}건 더 보기 →
  </MoreLink>
)}
```
   > `MoreLink`가 이미 존재하므로, 3건 초과 시 "외 N건 더 보기" 문구로 전환하면 사용자가 추가 항목의 존재를 인지할 수 있습니다.

### HomeGreetingBand.tsx

**변경 내용:**
상단 그리팅 밴드로 사용자 이름과 학습 현황 요약을 표시합니다. `useAuth`의 `user`와 `useHomeExamStats`의 `summary`를 조합하여 개인화된 인사말과 반 수 정보를 제공합니다.

**개선 제안:**

1. 하드코딩된 이모지 제거
   - **위치 (라인 번호)**: `Greeting` 텍스트 내 `👋`
   - **기존 코드**:
```tsx
<Greeting>안녕하세요, {user?.name ?? '선생님'} 선생님 👋</Greeting>
```
   - **해결 방안 (수정 코드)**: 이모지를 제거하고 텍스트만 유지합니다.
```tsx
<Greeting>안녕하세요, {user?.name ?? '선생님'} 선생님</Greeting>
```
   > 이모지는 플랫폼별 렌더링 차이가 있고 접근성(스크린리더) 문제가 있어, 텍스트만 사용하는 것이 안전합니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [x] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [ ] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**
홈 대시보드의 탭 구조 개편과 KPI/진행바/빈 상태 추가가 명확하고 잘 구성된 리팩토링입니다. `scrollToExamStatus`의 고정 `setTimeout` 타이밍 의존성만 안정화하면 승인 가능한 수준이며, 나머지는 선택적 개선 사항입니다. 특히 `ExamKpiSection` 분리와 `ActiveExamsCard`의 빈 상태 처리는 사용자 경험을 크게 개선한 부분입니다.