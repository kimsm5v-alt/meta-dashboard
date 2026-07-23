> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - d45b3521

## 코드 복잡도 분석

**분석된 파일**: 3개 / 변경된 파일: 5개


### 정상 범위 (NONE)


**`studentdashboardpage.tsx`** (component)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.008

- 청크 수: 50개


**권장사항:**

- 파일 크기가 큼 (50개 청크) - 파일 분리 검토


**`factorheatmapsection.tsx`** (component)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.012

- 청크 수: 65개


**권장사항:**

- 파일 크기가 큼 (65개 청크) - 파일 분리 검토


**`classdashboardv2widget.tsx`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.012

- 청크 수: 167개


**권장사항:**

- 파일 크기가 큼 (167개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 운영 환경(production)에서 발생한 데이터 이슈(HSJ-108)에 대한 핫픽스와 코드 품질 개선을 포함합니다.

- **목적**: 운영 서버에서 CoachingStrategy 컴포넌트의 데이터 오류로 인해 임시로 숨김 처리, 환경 변수(VITE_ENV) 추가를 통한 환경 구분 체계 도입, 클래스 대시보드의 프로필 데이터 매핑 오류 수정 및 UI 레이블 개선
- **도메인**: UI / 비즈니스 로직 / 인프라(환경 설정)
- **변경 방향**: 운영 환경(prod)에서 특정 기능을 조건부로 차단하고, 환경 변수 체계를 정비하여 개발/운영 환경을 명확히 구분. 프로필 아이템의 필드명(`subCategory` -> `definition`)을 실제 데이터 구조에 맞게 수정

## [GOOD] 잘된 점

1. **명확한 환경 구분 도입**: `VITE_ENV=dev` / `VITE_ENV=prod` 환경 변수를 추가하여 개발/운영 환경을 코드 레벨에서 명확히 구분할 수 있게 되었습니다. 기존 `VITE_QCH_ENV`와 별도로 범용 환경 변수를 둔 것은 확장성 측면에서 좋은 선택입니다.

2. **임시 조치의 투명한 문서화**: `StudentDashboardPage.tsx`에서 `import.meta.env.VITE_ENV !== 'prod'` 조건으로 CoachingStrategy를 숨기면서 주석에 "운영서버 데이터 이슈로 임시 숨김(HSJ-108)"이라고 명시하여, 이 코드가 영구적인 해결책이 아님을 분명히 했습니다. 임시 조치에는 이러한 문서화가 필수적입니다.

3. **프로필 필드 매핑 오류 수정**: `categoryScores` 계산 로직에서 `subCategory`를 `definition`으로 변경한 것은 `ClassProfileItem` 인터페이스의 실제 필드명과 일치시키는 올바른 수정입니다. `computeClassProfile` 함수가 반환하는 객체에는 `definition` 필드가 존재하며, `COMP_CATEGORY_ORDER`의 `name`과 매칭되는 필드가 `definition`임을 반영한 것입니다.

4. **UI 레이블 개선**: "강점 TOP 3" -> "우리 반의 강점 TOP 3", "관심 필요 TOP 3" -> "우리 반의 보완점 TOP 3"로 변경하여 사용자 경험을 개선했습니다. "관심 필요"보다 "보완점"이 교육적 맥락에서 더 적절한 표현입니다.

## 변경사항 요약

5개 파일이 변경되었습니다: 환경 변수 파일 2개(.env.development, .env.production), 학생 대시보드 페이지(CoachingStrategy 조건부 렌더링), FactorHeatmapSection(레이블 포맷팅 예외 처리 및 코드 포맷팅), ClassDashboardV2Widget(프로필 필드 매핑 수정, useMemo -> IIFE 변경, UI 레이블 개선, import 정리)

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `useMemo`를 IIFE로 변경하면서 의존성 배열이 제거되어 불필요한 재계산 발생 가능**

- **파일**: `frontend/src/widgets/class-dashboard/ClassDashboardV2Widget.tsx`
- **위치**: 2717~2801 라인
- **변경 내용**: `classData` 변수를 `useMemo`에서 IIFE `(() => { ... })()`로 변경하면서 의존성 배열이 완전히 제거되었습니다.

**분석**:
`classData`는 다음과 같은 여러 상태 변수에 의존하는 복잡한 파생 데이터입니다:
- `hasJwtToken`, `testId`, `apiStudents`, `classId`
- `l2Data`, `apiClassInfo`, `selfregRound1`, `selfregRound2`, `selfregDgnssIds`
- `baseClassData`

IIFE로 변경하면 컴포넌트가 리렌더링될 때마다 매번 이 복잡한 로직이 재실행됩니다. 이는 다음과 같은 문제를 유발할 수 있습니다:
- 불필요한 연산으로 인한 성능 저하
- `classData`를 의존성으로 사용하는 다른 `useMemo`/`useEffect` 훅들이 불필요하게 트리거됨
- `apiStudents.filter()`, `apiStudents.some()` 등 배열 메서드가 매 렌더링마다 실행됨

**해결 방안**:
```typescript
const classData: Class | undefined = useMemo(() => {
  // 종합검사 전용 분기 (자기조절검사는 제외)
  if (hasJwtToken && testId !== 'selfreg' && apiStudents.length > 0 && classId) {
    const schoolLevel = apiClassInfo?.schoolLevel ?? apiStudents[0]?.schoolLevel ?? '초등';
    const grade = apiClassInfo?.grade ?? apiStudents[0]?.grade ?? 1;
    const classNumber = apiClassInfo?.classNumber ?? 1;
    const assessedStudents = apiStudents.filter((s) => s.assessments.length > 0).length;
    const typeDistribution: Record<string, { count: number; percentage: number }> = {};
    for (const s of apiStudents) {
      const latest = s.assessments[s.assessments.length - 1];
      if (latest) {
        if (!typeDistribution[latest.predictedType])
          typeDistribution[latest.predictedType] = { count: 0, percentage: 0 };
        typeDistribution[latest.predictedType].count++;
      }
    }
    for (const type of Object.keys(typeDistribution)) {
      typeDistribution[type].percentage =
        assessedStudents > 0
          ? Math.round((typeDistribution[type].count / assessedStudents) * 100)
          : 0;
    }
    const needAttentionCount = apiStudents.filter((s) =>
      s.assessments.some((a) => a.attentionResult.needsAttention),
    ).length;
    const totalStudents = l2Data?.examDetail?.stTotalCnt ?? apiStudents.length;
    const submittedCount = l2Data?.examDetail?.stSubmCnt ?? apiStudents.length;
    return {
      id: classId,
      schoolLevel,
      grade,
      classNumber,
      teacherId: '',
      students: apiStudents,
      stats: {
        totalStudents,
        assessedStudents: submittedCount,
        typeDistribution,
        needAttentionCount,
        round1Completed: submittedCount > 0,
        round2Completed: apiStudents.some((s) => s.assessments.some((a) => a.round === 2)),
        examStatus: {
          round1: submittedCount > 0 ? '종료' : '시작전',
          round2: apiStudents.some((s) => s.assessments.some((a) => a.round === 2))
            ? '종료'
            : '시작전',
        },
        round2SubmittedCount: apiStudents.filter((s) => s.assessments.some((a) => a.round === 2))
          .length,
      },
    };
  }
  // selfreg 전용: 자기조절검사 학생 목록(paperIdx=2)을 apiStudents로 구성
  if (hasJwtToken && testId === 'selfreg' && apiClassInfo && classId) {
    const totalStudents = apiStudents.length || selfregDgnssIds.stTotalCnt || 0;
    const submittedCount = apiStudents.filter((s) => s.assessments.length > 0).length;
    const needAttentionCount = apiStudents.filter((s) =>
      s.assessments.some((a) => a.attentionResult.needsAttention),
    ).length;
    return {
      id: classId,
      schoolLevel: apiClassInfo.schoolLevel,
      grade: apiClassInfo.grade,
      classNumber: apiClassInfo.classNumber,
      teacherId: '',
      students: apiStudents,
      stats: {
        totalStudents,
        assessedStudents: submittedCount,
        typeDistribution: {},
        needAttentionCount,
        round1Completed: !!selfregRound1,
        round2Completed: !!selfregRound2,
        examStatus: {
          round1: selfregRound1 ? '종료' : '시작전',
          round2: selfregRound2 ? '종료' : '시작전',
        },
        round2SubmittedCount: apiStudents.filter((s) => s.assessments.some((a) => a.round === 2))
          .length,
      },
    };
  }
  return baseClassData;
}, [
  baseClassData,
  hasJwtToken,
  apiStudents,
  classId,
  l2Data,
  apiClassInfo,
  testId,
  selfregRound1,
  selfregRound2,
  selfregDgnssIds,
]);
```

**변경 사유**: `useMemo`로 복원하고 의존성 배열을 명시하여, 의존성이 변경될 때만 재계산되도록 해야 합니다. 이는 React 성능 최적화의 기본 원칙입니다.

**2. `VITE_ENV` 환경 변수 누락 시 예외 처리 부재**

- **파일**: `frontend/src/pages/student-dashboard/StudentDashboardPage.tsx`
- **위치**: 828 라인

**분석**:
`import.meta.env.VITE_ENV !== 'prod'` 조건에서 `VITE_ENV`가 정의되지 않은 환경(예: 로컬 개발에서 `.env` 파일 누락, CI/CD 파이프라인, 테스트 환경)에서는 `undefined !== 'prod'`가 항상 `true`가 되어 CoachingStrategy가 표시됩니다. 이는 의도된 동작일 수 있으나, 환경 변수 누락 시 예상치 못한 동작을 유발할 수 있습니다.

**해결 방안**:
```typescript
{(import.meta.env.VITE_ENV ?? 'dev') !== 'prod' &&
  student.schoolLevel !== '고등' &&
  current.predictedType !== '미지원' && (
    <CoachingStrategy ... />
  )}
```

**변경 사유**: 널 병합 연산자(`??`)를 사용하여 `VITE_ENV`가 `undefined` 또는 `null`인 경우 기본값 `'dev'`를 할당함으로써, 환경 변수 누락 시에도 예측 가능한 동작을 보장합니다. 개발 환경이 기본값이므로, `.env` 파일이 없는 로컬 개발 환경에서도 CoachingStrategy가 정상 표시됩니다.

### Medium (개선 권장)

**1. `formatFactorLabel`에 하드코딩된 예외 처리**

- **파일**: `frontend/src/shared/components/FactorHeatmapSection.tsx`
- **위치**: 118 라인

**분석**:
`'지지적 관계'`는 5자이므로 기존 로직에서 `name.length < 4` 조건에 걸리지 않습니다. `KNOWN_PREFIXES`에 `'지지적'`이 포함되어 있지 않아 `breakAt`이 `-1`로 남고, 이후 `Math.ceil(name.length / 2)`로 줄바꿈 위치가 결정됩니다. `'지지적 관계'`의 경우 `Math.ceil(5 / 2) = 3`이 되어 `'지지적\n관계'`로 줄바꿈되는데, 이는 의미 단위로 보면 `'지지'`와 `'적 관계'`로 나뉘어 부자연스럽습니다. 따라서 하드코딩 예외 처리는 불가피한 선택으로 보입니다.

**개선 제안**:
```typescript
const KNOWN_PREFIXES = [
  '스마트폰',
  '학업관계',
  '대인관계',
  '학업',
  '부모',
  '친구',
  '교사',
  '자기',
  '타인',
  '성장',
  '자아',
  '게임',
  '지지적',  // '지지적 관계' 처리를 위해 추가
];
```

**변경 사유**: 특정 문자열을 하드코딩하는 대신 `KNOWN_PREFIXES`에 `'지지적'`을 추가하면, `'지지적 관계'`뿐만 아니라 `'지지적 가족'` 등 유사한 패턴의 모든 문자열이 일관되게 처리됩니다. 이는 확장성과 유지보수성 측면에서 더 좋은 접근입니다.

**2. `StudentInfoItem` import 방식 일관성**

- **파일**: `frontend/src/widgets/class-dashboard/ClassDashboardV2Widget.tsx`
- **위치**: 35~38 라인

**분석**:
```typescript
import {
  fetchStudentInfoList,
  fetchTeacherExams,
  type StudentInfoItem,
} from '@shared/services/dashboardService';
```
`type` 키워드를 사용한 혼합 임포트는 TypeScript 4.5+에서 지원하는 `inline type import` 구문입니다. 이는 트리쉐이킹 측면에서 문제가 없으나, 일부 구형 툴체인이나 ESLint 규칙에서 경고를 발생시킬 수 있습니다.

**개선 제안**:
```typescript
import {
  fetchStudentInfoList,
  fetchTeacherExams,
} from '@shared/services/dashboardService';
import type { StudentInfoItem } from '@shared/services/dashboardService';
```

**변경 사유**: 타입 임포트를 별도 라인으로 분리하면 가독성이 향상되고, 모든 툴체인에서 호환됩니다. 이는 TypeScript 공식 스타일 가이드에서도 권장하는 방식입니다.

---

## 주요 파일 분석

### frontend/src/widgets/class-dashboard/ClassDashboardV2Widget.tsx

**변경 내용:**
프로필 아이템 필드 매핑 수정(`subCategory` -> `definition`), `classData`의 `useMemo`를 IIFE로 변경, UI 레이블 개선("강점 TOP 3" -> "우리 반의 강점 TOP 3"), `StudentInfoItem` import 방식 개선

**상세 분석:**

1. **프로필 필드 매핑 수정 (라인 1506~1507)**:
   - 변경 전: `profile.strengths.find((s) => s.subCategory === cat.name)`
   - 변경 후: `profile.strengths.find((s) => s.definition === cat.name)`
   - `useClassProfile.ts` 파일의 `ClassProfileItem` 인터페이스를 확인한 결과, `subCategory`와 `definition` 필드가 모두 존재합니다. `computeClassProfile` 함수는 `subCategory`에는 요인의 하위 카테고리명을, `definition`에는 운영적 정의(operational definition) 문자열을 할당합니다. `COMP_CATEGORY_ORDER`의 `name`은 하위 카테고리명이므로, `definition`보다는 `subCategory`가 더 적절해 보입니다. 다만, `COMP_CATEGORY_ORDER`의 `name` 값이 실제로 `definition` 필드와 매칭된다면 이는 데이터 구조에 따른 올바른 수정입니다. 이 부분은 `COMP_CATEGORY_ORDER`의 실제 데이터를 확인해야 정확한 판단이 가능합니다.

2. **`useMemo` -> IIFE 변경 (라인 2717~2801)**:
   - 이 변경은 **High 우선순위 이슈**로 분류됩니다. `classData`는 9개 이상의 상태/프롭스에 의존하는 복잡한 파생 데이터로, 매 렌더링마다 재계산할 경우 성능 저하가 발생합니다. 특히 `apiStudents.filter()`, `apiStudents.some()` 등 배열 메서드가 매번 실행되어 O(n) 연산이 반복됩니다.

3. **UI 레이블 개선 (라인 1956, 1981)**:
   - "강점 TOP 3" -> "우리 반의 강점 TOP 3"
   - "관심 필요 TOP 3" -> "우리 반의 보완점 TOP 3"
   - "관심 필요"보다 "보완점"이 교육적 맥락에서 더 적절한 표현입니다. "관심 필요"는 수동적인 느낌을 주는 반면, "보완점"은 개선 가능성을 암시하는 능동적인 표현입니다.

### frontend/src/pages/student-dashboard/StudentDashboardPage.tsx

**변경 내용:**
CoachingStrategy 컴포넌트를 운영 환경(prod)에서 숨기는 조건부 렌더링 추가

**상세 분석:**
- **라인 828**: `{import.meta.env.VITE_ENV !== 'prod' && ...}` 조건 추가
- 주석에 "운영서버 데이터 이슈로 임시 숨김(HSJ-108)"이라고 명시하여 임시 조치임을 문서화
- `VITE_ENV` 환경 변수가 `undefined`인 경우(환경 변수 누락)에도 CoachingStrategy가 표시됨
- **Medium 우선순위**: 널 병합 연산자(`??`)를 사용하여 기본값 처리 권장

### frontend/src/shared/components/FactorHeatmapSection.tsx

**변경 내용:**
`formatFactorLabel` 함수에 `'지지적 관계'` 예외 처리 추가, JSX 포맷팅 개선

**상세 분석:**
- **라인 118**: `if (name.length < 4 || name === '지지적 관계') return name;`
- `'지지적 관계'`는 5자이므로 기존 `name.length < 4` 조건에 걸리지 않음
- `KNOWN_PREFIXES`에 `'지지적'`이 없어 `breakAt`이 `-1`로 설정되고, 이후 `Math.ceil(5/2) = 3`으로 줄바꿈 위치가 결정됨
- 결과적으로 `'지지적\n관계'`로 줄바꿈되는데, 이는 의미 단위로 보면 부자연스러움
- **Medium 우선순위**: `KNOWN_PREFIXES`에 `'지지적'`을 추가하는 것이 더 확장성 있는 해결책

### frontend/.env.development / frontend/.env.production

**변경 내용:**
`VITE_ENV=dev` / `VITE_ENV=prod` 환경 변수 추가

**상세 분석:**
- 기존 `VITE_QCH_ENV`와 별도로 범용 환경 변수 `VITE_ENV`를 추가
- `VITE_QCH_ENV`는 QCH(퀴즈/챗봇 히스토리) 서비스 전용 환경 변수로, 용도가 제한적
- `VITE_ENV`는 애플리케이션 전반에서 환경 구분이 필요한 모든 곳에서 사용 가능
- 간결하고 명확한 네이밍으로 좋은 변경

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

전반적으로 실용적인 핫픽스 커밋입니다. 운영 환경 데이터 이슈에 대한 빠른 대응(CoachingStrategy 숨김 처리)과 프로필 필드 매핑 오류 수정은 적절하며, UI 레이블 개선과 import 정리도 긍정적인 변경입니다.

다만, `classData` 변수를 `useMemo`에서 IIFE로 변경한 부분은 **반드시 수정이 필요합니다**. 이 변경은 성능 저하와 불필요한 리렌더링을 유발할 수 있으며, React의 메모이제이션 원칙에 위배됩니다. `useMemo`로 복원하고 의존성 배열을 명시하는 것을 권장합니다.

또한 `VITE_ENV` 환경 변수에 대한 기본값 처리를 추가하여 환경 변수 누락 시에도 예측 가능한 동작을 보장하는 것이 좋습니다.

이 두 가지 High 이슈만 해결되면 승인 가능한 수준의 커밋입니다.