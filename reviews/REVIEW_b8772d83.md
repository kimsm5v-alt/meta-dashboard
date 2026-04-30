> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - b8772d83

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 1개


### 정상 범위 (NONE)


**`useapidata.ts`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.010

- 청크 수: 36개


**권장사항:**

- 파일 크기가 큼 (36개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 **교사용 학생 대시보드에서 학생 이동 인디게이터(학생 목록 네비게이션)가 비활성화되는 이슈**를 해결하기 위한 것입니다. 기존에는 `useStudentAnalysis` 훅이 `getClassById(classId)`를 통해 DataContext(로컬 캐시)에서 학생 목록을 가져왔으나, API 모드에서는 이 데이터가 비어있거나 불완전하여 학생 간 이동 UI가 동작하지 않는 문제가 있었습니다. 이를 해결하기 위해 API 모드에서 `fetchL2DashboardData`를 호출하여 서버로부터 실제 학생 목록을 받아오도록 변경하였습니다.

- **목적**: 학생 대시보드에서 학생 이동 인디게이터 비활성화 버그 수정
- **도메인**: 비즈니스 로직 (API 데이터 fetching)
- **변경 방향**: 로컬 캐시(`getClassById`) 의존에서 서버 API(`fetchL2DashboardData`) 기반 실제 데이터 사용으로 전환

## [GOOD] 잘된 점

1. **변수명 개선**: `group`을 `matchedGroup`으로 rename하여 find 결과가 그룹 객체임을 명확히 했습니다. 이는 가독성 향상에 기여합니다.

2. **불필요한 중복 호출 제거**: `completedR1` 변수를 `exams.find` 이후 상단으로 이동시켜, 이후 `if (completedR1)` 블록에서 중복 탐색하지 않도록 개선했습니다. 기존에는 `completedR1`이 `let studentName` 선언 이후에 위치하여, 실제 사용 전까지 변수가 선언만 되어 있었습니다.

3. **`refetch` 포맷팅 일관성**: 여러 훅(`useStudentAnalysis`, `useClassAnalysis`, `useClassStudents`, `useTeacherClasses`)에서 `refetch` 반환값의 포맷을 멀티라인으로 통일하여 코드 스타일 일관성을 높였습니다.

## 변경사항 요약

`useStudentAnalysis` 훅에서 API 모드일 때 `getClassById`로 로컬 캐시에서 학생 목록을 가져오던 방식을, `fetchL2DashboardData`를 호출하여 서버에서 실제 학생 데이터를 받아오도록 변경했습니다. 이에 따라 `classData` 변수와 `getClassById` 호출이 제거되고, `classStudents`가 `l2Data.students`로 대체되었습니다. 또한 `classInfo`도 그룹 데이터 기반으로 통일되어, API 모드와 fallback 모드 간 일관성이 향상되었습니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `fetchL2DashboardData` 호출로 인한 불필요한 중복 데이터 fetching**

`fetchL2DashboardData` 함수의 실제 구현을 확인한 결과, 이 함수는 내부적으로 다음과 같은 4개의 API를 병렬 호출하고, 이후 각 학생별로 `fetchStudentFullAnalysis`를 개별 호출합니다:

```typescript
// frontend/src/shared/services/dashboardService.ts (라인 652-670)
export async function fetchL2DashboardData(
  dgnssId: number,
  claId: string,
  schoolLevel: SchoolLevel,
  grade: number,
): Promise<L2DashboardData> {
  const [examDetail, studentInfoList, classTScores, needAttention] = await Promise.all([
    fetchExamDetail(dgnssId),
    fetchStudentInfoList(dgnssId, '1', 1),
    fetchClassAnalysis(claId, '1', 1),
    fetchNeedAttentionStudents(dgnssId, '1'),
  ]);

  const studentAnalysisPromises = studentInfoList.map(async (info) => {
    const fullAnalysis = await fetchStudentFullAnalysis(claId, info.stdtId, '1');
    return { info, fullAnalysis };
  });
  // ...
}
```

그런데 이 커밋에서는 이 함수의 반환값 중 `students` 필드만 사용하고 있습니다. 더군다나 `useStudentAnalysis` 훅은 같은 queryFn 내에서 이미 `fetchStudentFullAnalysis(classId, studentId, '1')`를 별도로 호출하고 있고, 이후 `fullAnalysis.round1` / `round2`를 각각 `convertToAssessment`로 변환합니다.

즉, `fetchL2DashboardData` 내부에서 **모든 학생**의 `fetchStudentFullAnalysis`를 호출하고, 외부에서도 **특정 학생**의 `fetchStudentFullAnalysis`를 다시 호출하는 **이중 호출 구조**가 발생합니다. 이는 불필요한 네트워크 비용과 서버 부하를 초래합니다.

- **위치 (라인 번호)**: 111번 라인
- **기존 코드**:
```typescript
      if (completedR1) {
        // L2 대시보드 데이터를 가져와서 학생 목록을 추출합니다.
        const l2Data = await fetchL2DashboardData(completedR1.dgnssId, classId, schoolLevel, grade);
        classStudents = l2Data.students; // 서버에서 받아온 실제 학생 목록
      }
```
- **해결 방안 (수정 코드)**: `fetchL2DashboardData` 대신 `fetchStudentInfoList`만 호출하여 학생 목록의 메타정보(id, 이름, 번호)만 가져오고, `students` 배열은 infoList로부터 직접 구성하는 것이 더 효율적입니다.

```typescript
      if (completedR1) {
        // 학생 목록만 서버에서 받아옵니다 (fetchL2DashboardData는 무거우므로 infoList만 사용)
        const infoList = await fetchStudentInfoList(completedR1.dgnssId, '1', 1);
        classStudents = infoList.map((info) => ({
          id: info.stdtId,
          classId,
          number: info.rowNum,
          name: info.stdtNm ?? info.nickname ?? `학생${info.rowNum}`,
          schoolLevel,
          grade,
          assessments: [],
        }));
      }
```

이렇게 수정하면 `fetchL2DashboardData` 내부의 4개 API 호출과 모든 학생에 대한 `fetchStudentFullAnalysis` 호출을 피할 수 있습니다. 학생 목록만 필요하다면 `fetchStudentInfoList` 하나로 충분합니다.

### Medium (개선 권장)

**1. `classStudents` null 병합 연산자 중복**

`classStudents` 변수는 `let classStudents: Student[] = [];`로 이미 빈 배열로 초기화된 후, `if (completedR1)` 블록에서만 값이 할당됩니다. 그런데 최종 반환문에서 `classStudents: classStudents ?? []`로 다시 null 병합을 하고 있습니다. TypeScript 컴파일러 입장에서 `classStudents`는 `Student[]` 타입이므로 `null`이나 `undefined`가 될 수 없습니다. 이는 불필요한 방어 코드입니다.

- **위치 (라인 번호)**: 160번 라인
- **기존 코드**:
```typescript
        classStudents: classStudents ?? [],
```
- **해결 방안 (수정 코드)**:
```typescript
        classStudents,
```

**2. fallback 시나리오에서 여전히 `getClassById`에 의존**

`fullAnalysis.round1`과 `round2`가 모두 없을 경우의 fallback 블록(130~137번 라인)에서는 여전히 `getClassById(classId)`를 호출하여 `classData?.students`를 사용합니다.

```typescript
      if (!fullAnalysis.round1 && !fullAnalysis.round2) {
        const classData = getClassById(classId);
        const fallbackStudent = getStudentById(classId, studentId);
        return {
          student: fallbackStudent
            ? { ...fallbackStudent, name: studentName || fallbackStudent.name }
            : undefined,
          classStudents: classData?.students ?? [],
          classInfo: { grade, classNumber, schoolLevel },
        };
      }
```

이 경우 `classStudents`는 `fetchL2DashboardData`로 얻은 값이 아니라 로컬 캐시 값이 사용됩니다. API 모드에서도 fallback 상황에서는 여전히 동일한 버그(학생 목록이 비어있을 가능성)가 재현될 수 있습니다. 다만 이는 기존 코드의 fallback 로직을 유지한 것으로, 이번 커밋의 범위를 벗어나므로 Medium으로 분류합니다.

---

## 주요 파일 분석

### `frontend/src/features/api/useApiData.ts`

**변경 내용:**
`useStudentAnalysis` 훅에서 학생 목록 조회 방식을 로컬 캐시(`getClassById`)에서 서버 API(`fetchL2DashboardData`)로 전환하고, `classInfo`를 그룹 데이터 기반으로 통일했습니다. 또한 `completedR1` 변수의 위치를 상단으로 이동하고, `group` 변수를 `matchedGroup`으로 rename했습니다.

**개선 제안:**

1. **`fetchL2DashboardData` 대신 `fetchStudentInfoList` 사용 (High)**
   - 위 High 섹션에서 상세 기술

2. **`classStudents` null 병합 제거 (Medium)**
   - 위 Medium 섹션에서 상세 기술

3. **fallback 시 `classStudents`도 서버 데이터 사용 고려 (Medium)**
   - 위 Medium 섹션에서 상세 기술

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

버그 수정의 방향성과 로직 변경 자체는 적절합니다. `getClassById` 의존성을 제거하고 서버 데이터를 사용하도록 변경한 것은 올바른 접근입니다.

다만 `fetchL2DashboardData`는 L2 대시보드 전체 데이터를 위한 무거운 API인 반면, 이 커밋에서는 `students` 필드 하나만 필요합니다. `fetchL2DashboardData`의 실제 구현을 보면 내부에서 `fetchExamDetail`, `fetchStudentInfoList`, `fetchClassAnalysis`, `fetchNeedAttentionStudents`를 병렬 호출하고, 이후 모든 학생에 대해 `fetchStudentFullAnalysis`를 개별 호출합니다. 이는 `useStudentAnalysis` 훅이 이미 외부에서 `fetchStudentFullAnalysis`를 호출하는 것과 중복됩니다.

`fetchStudentInfoList`만 호출하여 학생 목록을 직접 구성하는 방식으로 변경하면, 불필요한 API 호출을 제거하고 성능을 개선할 수 있습니다. 위 High 이슈를 수정한 후 승인을 권장합니다.