# 코드 리뷰 - 57641c7c

## 코드 복잡도 분석

**분석된 파일**: 2개 / 변경된 파일: 2개


### 정상 범위 (NONE)


**`useapidata.ts`** (other)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.010

- 청크 수: 59개


**권장사항:**

- 파일 크기가 큼 (59개 청크) - 파일 분리 검토


**`coachingindividualpage.tsx`** (component)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.002

- 청크 수: 9개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 두 가지 문제를 해결합니다. 첫째, 검사 미완료 학생의 fallback 데이터가 `student`를 `undefined`로 반환하여 위젯이 "학생 없음" 분기로 처리되던 문제를, 실데이터 기반의 `student` 객체를 반환하여 "검사 미완료" 분기로 처리되도록 수정합니다. 둘째, Coaching 개인 페이지에서 LNB가 전달하는 `scope.studentId`가 `GroupMember.id`인 반면 검사 분석 API는 `GroupMember.stdtId`를 요구하는 불일치를 해소합니다.

- **목적**: 검사 미완료 학생의 대시보드 표시 개선 및 Coaching 페이지의 학생 ID 매핑 오류 수정
- **도메인**: 비즈니스 로직 (프론트엔드 데이터 계층)
- **변경 방향**: fallback 데이터의 정확성 향상, 기존 `TeacherDashboardPage.tsx`의 매핑 패턴을 Coaching 페이지에도 일관 적용

---

## [GOOD] 잘된 점

1. **기존 패턴의 일관된 재사용**: `CoachingIndividualPage.tsx`에서 `members.find((member) => member.id === scope.studentId)?.stdtId` 매핑은 `TeacherDashboardPage.tsx`(라인 125)에 이미 존재하는 패턴을 그대로 따르고 있어, 프로젝트 내 ID 매핑 컨벤션이 통일되었습니다.
2. **의도가 명확한 주석**: `useApiData.ts`의 fallback 분기에 "아직 검사를 완료하지 않은 학생 — student/classInfo는 실데이터로 채우고 assessments만 비워서, 위젯이 '검사 미완료' 분기(학생 없음 아님)로 처리하게 한다"는 주석이 변경 의도를 정확히 전달합니다.
3. **렌더링 조건과 데이터 흐름의 일관성**: `CoachingIndividualPage`의 `scope.classId && stdtId` 조건과 `useStudentAnalysis`의 `enabled: !!classId && !!studentId` 조건이 정확히 일치하여, stdtId가 없으면 Overview로 폴백하는 흐름이 자연스럽게 연결됩니다.

---

## 변경사항 요약

- `useApiData.ts`: 검사 미완료 학생의 fallback 반환값을 `student: undefined`에서 실데이터 기반 객체로 변경
- `CoachingIndividualPage.tsx`: `useGroupMembersQuery`와 `useAuth`를 도입하여 `scope.studentId`(GroupMember.id)를 `stdtId`로 변환 후 `IndividualCoachingSection`에 전달

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

없음

### Medium (개선 권장)

1. **`useGroupMembersQuery`의 `scope.classId` null 처리 명시화**
   - **위치**: `CoachingIndividualPage.tsx` 라인 16
   - **기존 코드**:
     ```tsx
     const { data: members = [] } = useGroupMembersQuery(scope.classId ?? null, user?.id);
     ```
   - **분석**: `scope.classId`가 null일 때 `null`을 첫 번째 인자로 전달합니다. `useGroupMembersQuery`의 구현(`frontend/src/features/groups/api/queries.ts` 라인 6)이 null을 어떻게 처리하는지(쿼리 비활성화 여부) 확인이 필요하지만, `TeacherDashboardPage.tsx`(라인 82)에서도 동일한 패턴(`scope.classId ?? null`)을 사용하므로 프로젝트 컨벤션에 부합합니다. 다만 `user?.id`가 undefined일 때 쿼리가 어떻게 동작하는지가 명시적으로 보장되지 않으므로, `enabled` 옵션을 추가하면 더 명확해집니다.
   - **해결 방안 (수정 코드)**:
     ```tsx
     const { data: members = [] } = useGroupMembersQuery(scope.classId ?? null, user?.id, {
       enabled: !!scope.classId && !!user?.id,
     });
     ```
     > 단, `useGroupMembersQuery`의 시그니처가 옵션 객체를 지원하는지 확인이 필요합니다. 지원하지 않는다면 **[수정 코드 제시 불가 — 문맥 파악 불충분]** 으로 처리하는 것이 안전합니다.

2. **`key` prop의 undefined 가능성**
   - **위치**: `CoachingIndividualPage.tsx` 라인 22
   - **기존 코드**:
     ```tsx
     <IndividualCoachingSection key={stdtId} classId={scope.classId} studentId={stdtId} />
     ```
   - **분석**: `stdtId`가 undefined일 때 `key`가 undefined가 되지만, 렌더링 조건(`scope.classId && stdtId`)이 이를 방지하므로 실질적 문제는 없습니다. 다만 `key`에 undefined가 전달되는 것을 방지하기 위해 조건부 렌더링을 유지하는 현재 구조가 적절합니다. 추가 개선이 필요하지 않습니다.

---

## 주요 파일 분석

### frontend/src/features/api/useApiData.ts

**변경 내용:**
검사 미완료 학생의 fallback 반환값을 `student: undefined`에서 실데이터 기반 객체로 변경하여, 위젯이 "검사 미완료" 분기로 처리하도록 개선.

**개선 제안:**
1. `classStudents`가 `completedR1`이 없을 때 빈 배열(`[]`)로 유지되는데, 이는 의도된 동작입니다. 다만 `classStudents ?? []`의 null 병합 연산자는 `classStudents`가 이미 `[]`로 초기화되어 있어 불필요하지만, 안전장치로서 유효합니다.
   - **위치**: `useApiData.ts` 라인 169
   - **기존 코드**:
     ```tsx
     classStudents: classStudents ?? [],
     ```
   - **분석**: `classStudents`는 `let classStudents: Student[] = []`로 초기화되고 `completedR1`이 있을 때만 재할당되므로, null이 될 가능성이 없습니다. 하지만 방어적 코딩으로서 유지해도 무방합니다.
   - **해결 방안**: 변경 불필요 (현재 코드가 안전)

### frontend/src/pages/coaching/CoachingIndividualPage.tsx

**변경 내용:**
`useGroupMembersQuery`와 `useAuth`를 도입하여 `scope.studentId`(GroupMember.id)를 `stdtId`로 변환 후 `IndividualCoachingSection`에 전달.

**개선 제안:**
1. `useGroupMembersQuery`의 `enabled` 옵션 명시화 (위 Medium 1번에서 제안)
   - **위치**: `CoachingIndividualPage.tsx` 라인 16
   - **기존 코드**:
     ```tsx
     const { data: members = [] } = useGroupMembersQuery(scope.classId ?? null, user?.id);
     ```
   - **해결 방안**: `useGroupMembersQuery`의 시그니처 확인 후 `enabled` 옵션 추가 여부 결정. 시그니처가 옵션 객체를 지원하지 않는다면 현재 코드가 프로젝트 컨벤션에 부합하므로 변경 불필요.

---

## 최종 평가

**결론**:
- [x] [OK] **승인 (Approved)** - Critical/High 이슈 없음

**종합 의견:**
이 커밋은 검사 미완료 학생의 대시보드 표시를 개선하고, Coaching 페이지의 ID 매핑 불일치를 기존 `TeacherDashboardPage.tsx` 패턴을 따라 일관되게 해결한 좋은 변경입니다. 주석을 통해 변경 의도가 명확히 전달되고, 렌더링 조건과 데이터 흐름이 일관성을 유지하고 있습니다. Medium 수준의 제안(쿼리 `enabled` 옵션 명시화)은 선택적 개선 사항이며, 현재 코드는 실무에서 충분히 통용될 수 있는 품질을 갖추고 있습니다.