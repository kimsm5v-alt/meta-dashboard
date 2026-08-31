# 코드 리뷰 - 8319d55a

## 코드 복잡도 분석

**분석된 파일**: 3개 / 변경된 파일: 3개


### 정상 범위 (NONE)


**`studentlearningstatusservice.ts`** (other)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.008

- 청크 수: 16개


**권장사항:**

- 복잡도 정상 범위


**`studentdashboardpage.tsx`** (component)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.009

- 청크 수: 76개


**권장사항:**

- 파일 크기가 큼 (76개 청크) - 파일 분리 검토


**`studenttrackingsection.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.010

- 청크 수: 115개


**권장사항:**

- 파일 크기가 큼 (115개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 학생 대시보드(StudentDashboardPage)에서 '차수 변화(compare)' 뷰모드를 제거하고, 학습현황 설문 응답 섹션을 실제 API 데이터(`useStudentLearningStatusQuery`)로 채우는 리팩토링입니다. 동시에 여러 화면(결과보기/변화추적)에서 중복되던 설문 라벨 상수를 `studentLearningStatusService.ts`로 공용 추출하여 단일 소스로 통합했습니다.

- **목적**: 차수 변화 기능 제거로 UI 단순화 + 학습현황 설문 응답을 실제 데이터로 표시 + 라벨 상수 중복 제거
- **도메인**: UI (프론트엔드 React)
- **변경 방향**: 중복 코드 제거를 통한 유지보수성 향상, 불필요한 기능(compare) 제거로 화면 단순화

## [GOOD] 잘된 점

- 라벨 상수(`LEVEL_LABELS`, `MOTIVATION_LABELS`, `STUDY_TIME_LABELS`, `COUNSELOR_LABELS`)를 공용 모듈로 추출하여 `StudentDashboardPage`와 `StudentTrackingSection` 양쪽에서 재사용함으로써 중복을 제거했습니다. 단일 소스 유지가 가능해져 라벨 변경 시 한 곳만 수정하면 됩니다.
- `StudentTrackingSection.tsx`에서 제거된 라벨 상수는 정확히 동일한 값으로 공용 모듈에 존재하므로, 동작 변화 없이 안전한 리팩토링입니다.
- 학습현황 설문 섹션이 하드코딩된 '응답 정보 없음' 대신 실제 응답 데이터를 표시하도록 개선되어 사용자 가치가 높아졌습니다.

## 변경사항 요약

1. `studentLearningStatusService.ts`에 4종의 라벨 상수를 공용으로 추가
2. `StudentDashboardPage.tsx`에서 compare 뷰모드 및 관련 로직(prevDomainData, isCompare) 제거, 학습현황 설문을 실제 데이터로 표시
3. `StudentTrackingSection.tsx`에서 중복 라벨 상수 제거 후 공용 상수 import로 대체

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

없음

### Medium (개선 권장)

1. **`learningStatusItems` 배열이 컴포넌트 렌더링마다 재생성됨**
   - `StudentDashboardPage.tsx`의 `learningStatusItems`는 `useMemo` 없이 컴포넌트 본문에서 매 렌더링마다 새 배열을 생성합니다. 이 배열은 JSX에서 `.map()`으로만 소비되므로 성능상 큰 문제는 아니지만, `useMemo`로 감싸면 불필요한 재생성과 GC 부담을 줄일 수 있습니다. 다만 `learningStatusQuery.data`가 변경될 때만 재계산되도록 의존성을 지정해야 합니다.

2. **라벨 조회 시 falsy 체크와 타입 안전성**
   - `learningStatusRound?.academicAchievement ? LEVEL_LABELS[...] : '응답 정보 없음'` 패턴은 값이 `null`일 때만 '응답 정보 없음'을 표시합니다. `academicAchievement`의 타입이 `LearningStatusLevel | null`이므로 `null` 체크로는 충분하지만, `0`이나 빈 문자열 같은 falsy 값이 들어올 가능성은 없어 현재 로직은 안전합니다. 다만 명시적으로 `!= null` 체크를 사용하면 의도가 더 분명해집니다.

3. **`learningStatusItems`의 라벨/값 구조가 `StudentTrackingSection`의 `getLearningStatusItems`와 형태가 달라 통일성 부족**
   - `StudentDashboardPage`는 `{label, value}` 단일 값 구조, `StudentTrackingSection`은 `{label, previous, current}` 비교 구조로 서로 다른 형태를 가집니다. 공용 상수는 추출했지만 아이템 생성 로직은 각 화면에 남아 있어, 향후 공용 헬퍼로 추출할 여지가 있습니다. 다만 두 화면의 표시 방식이 근본적으로 달라(단일 vs 비교) 현재 분리는 합리적입니다.

---

## 주요 파일 분석

### frontend/src/features/exam-tracking/api/studentLearningStatusService.ts

**변경 내용:**
4종의 라벨 상수(`LEVEL_LABELS`, `MOTIVATION_LABELS`, `STUDY_TIME_LABELS`, `COUNSELOR_LABELS`)를 공용으로 추가.

**개선 제안:**
1. 라벨 상수에 `as const`를 적용하면 타입 추론이 더 정확해집니다.
   - **위치 (라인 번호)**: 9~37
   - **기존 코드**:
```
export const LEVEL_LABELS: Record<LearningStatusLevel, string> = {
```
   - **해결 방안 (수정 코드)**:
```
export const LEVEL_LABELS: Record<LearningStatusLevel, string> = {
```
   - 현재 `Record<LearningStatusLevel, string>` 타입 명시로 이미 충분히 안전하므로, `as const`는 선택적 개선입니다. 타입 명시가 이미 되어 있어 굳이 변경할 필요는 없습니다.

### frontend/src/pages/student-dashboard/StudentDashboardPage.tsx

**변경 내용:**
compare 뷰모드 제거, 학습현황 설문을 실제 데이터로 표시.

**개선 제안:**
1. `learningStatusItems`를 `useMemo`로 감싸 불필요한 재생성 방지.
   - **위치 (라인 번호)**: 478~515
   - **기존 코드**:
```
  const learningStatusItems = [
    {
      label: '학업 성취도',
      value: learningStatusRound?.academicAchievement
        ? LEVEL_LABELS[learningStatusRound.academicAchievement]
        : '응답 정보 없음',
    },
    ...
  ];
```
   - **해결 방안 (수정 코드)**:
```
  const learningStatusItems = useMemo(
    () => [
      {
        label: '학업 성취도',
        value: learningStatusRound?.academicAchievement
          ? LEVEL_LABELS[learningStatusRound.academicAchievement]
          : '응답 정보 없음',
      },
      {
        label: '성적 만족도',
        value: learningStatusRound?.gradeSatisfaction
          ? LEVEL_LABELS[learningStatusRound.gradeSatisfaction]
          : '응답 정보 없음',
      },
      {
        label: '학습 동기',
        value: learningStatusRound?.learningMotivation
          ? MOTIVATION_LABELS[learningStatusRound.learningMotivation]
          : '응답 정보 없음',
      },
      {
        label: '혼자 공부 시간',
        value: learningStatusRound?.selfStudyTime
          ? STUDY_TIME_LABELS[learningStatusRound.selfStudyTime]
          : '응답 정보 없음',
      },
      {
        label: '학습 고민 상담',
        value: learningStatusRound?.learningCounselor
          ? COUNSELOR_LABELS[learningStatusRound.learningCounselor]
          : '응답 정보 없음',
      },
    ],
    [learningStatusRound],
  );
```
   - `learningStatusRound`가 변경될 때만 재계산되므로 안전합니다. 다만 이 배열은 `.map()`으로만 소비되어 성능 영향이 미미하므로, 이 개선은 선택적입니다.

### frontend/src/widgets/exam-tracking/StudentTrackingSection.tsx

**변경 내용:**
중복 라벨 상수 제거 후 공용 상수 import로 대체.

**개선 제안:**
1. 별도 개선 사항 없음. 중복 제거가 깔끔하게 수행되었습니다.

---

## 최종 평가

**결론**:
- [x] [OK] **승인 (Approved)** - Critical/High 이슈 없음

**종합 의견:**

이 커밋은 라벨 상수의 중복을 제거하고 불필요한 compare 기능을 정리하는 건전한 리팩토링입니다. 학습현황 설문을 실제 데이터로 표시하는 기능 개선도 사용자 가치가 높습니다. 제안된 개선 사항(useMemo 적용 등)은 모두 선택적이며, 현재 코드 품질은 실무에서 통용될 수 있는 수준으로 충분합니다. 승인합니다.