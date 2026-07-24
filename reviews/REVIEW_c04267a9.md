> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - c04267a9

## 코드 복잡도 분석

**분석된 파일**: 4개 / 변경된 파일: 4개


### 정상 범위 (NONE)


**`datahelperservice.ts`** (utility)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.008

- 청크 수: 34개


**권장사항:**

- 파일 크기가 큼 (34개 청크) - 파일 분리 검토


**`useapidata.ts`** (other)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.010

- 청크 수: 58개


**권장사항:**

- 파일 크기가 큼 (58개 청크) - 파일 분리 검토


**`aichatpanel.tsx`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.004

- 청크 수: 48개


**권장사항:**

- 파일 크기가 큼 (48개 청크) - 파일 분리 검토


**`studentdashboardpage.tsx`** (component)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.008

- 청크 수: 50개


**권장사항:**

- 파일 크기가 큼 (50개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 AI 어시스턴트(에이전트)가 MySQL/Neo4j 데이터베이스 도구를 직접 호출할 수 있도록 학생 프로필(context profile)에 DB 식별자 필드를 추가하는 변경입니다. 기존에는 `type-*` 질문에만 제한적으로 `schoolLevel`과 `predictedType`만 전달하던 profile을, 모든 질문에 대해 `stdtId`, `claId`, `tcId`, `schoolLevelCode`, `grade`, `classNumber`를 포함한 전체 프로필로 확장했습니다.

- **목적**: AI 에이전트의 Tool 호출 범위 확장 및 DB 기반 정밀 응답 가능
- **도메인**: 비즈니스 로직 (AI Agent 통합 / 데이터 계층)
- **변경 방향**: 제한적 profile 전달 -> 전체 식별자 기반 profile 전달

---

## [STATUS] 심각도별 이슈 요약

### Critical (즉시 수정 필요)
- 없음

### High (우선 수정 권장)
- 없음

### Medium (개선 권장)
1. **`dataHelperService.ts` - `SCHOOL_LEVEL_REVERSE_MAP` 불완전성**: 매핑되지 않은 `SchoolLevel` 값이 전달되면 `undefined` 반환 가능
2. **`dataHelperService.ts` - 회귀 가능성**: `stdtId`/`claId`가 없는 환경에서 기존 `type-*` 질문의 profile이 완전히 사라짐
3. **`useApiData.ts` - `Student` 타입 정의 일치 여부**: `schoolLevelCode` 필드가 `Student` 타입에 정의되어 있는지 확인 필요

### Low (참고 사항)
1. **`AiChatPanel.tsx` - `tcId` null/undefined 일관성**
2. **`dataHelperService.ts` - `buildProfile` null 반환 시 폴백 부재**

---

## 변경사항 요약

1. **`useApiData.ts`**: `useStudentAnalysis` 훅의 반환 타입과 학생 객체에 `schoolLevelCode` 필드 추가
2. **`dataHelperService.ts`**: `StudentData` 타입에 DB 식별자 필드 추가, `buildProfile` 함수 신규 작성, 모든 질문에 profile 전달로 변경
3. **`AiChatPanel.tsx`**: `user.tcId`를 `StudentData`에 주입
4. **`StudentDashboardPage.tsx`**: `StudentData` 객체 생성 시 신규 필드 전달

---

## 파일별 상세 분석

### 1. `frontend/src/features/api/useApiData.ts`

**변경 내용:**
- `SchoolLevelCode` 타입 import 추가
- `classInfo` 반환 타입에 `schoolLevelCode?: SchoolLevelCode` 필드 추가
- fallback 경로와 정상 경로 모두에서 `schoolLevelCode`를 `Student` 객체와 `classInfo`에 포함

**[GOOD] 잘된 점:**
- `schoolLevelCode`를 옵셔널(`?`)로 선언하여 기존 consumer와의 하위 호환성 유지
- `matchedGroup?.schoolLevel`을 통해 원본 SchoolLevelCode(고등 포함) 보존

**[PROBLEM] 발견된 문제:**

1. **[타입 안전성]**: `Student` 타입에 `schoolLevelCode` 필드가 정의되어 있는지 확인이 필요합니다.
   - **위치**: `useApiData.ts` 라인 154, 177
   - **기존 코드**:
   ```typescript
   // 라인 154 (fallback 경로)
   ? { ...fallbackStudent, name: studentName || fallbackStudent.name, schoolLevelCode }
   
   // 라인 177 (정상 경로)
   schoolLevelCode,
   ```
   - **해결 방안**: `Student` 타입 정의를 확인하여 `schoolLevelCode` 필드가 없다면, spread 연산자로 전달해도 타입 에러가 발생하거나 필드가 무시될 수 있습니다. 아래와 같이 별도 변수로 분리하는 것을 고려하세요.
   ```typescript
   const studentData = {
     ...fallbackStudent,
     name: studentName || fallbackStudent.name,
   };
   return {
     student: fallbackStudent ? studentData : undefined,
     classStudents: classData?.students ?? [],
     classInfo: { grade, classNumber, schoolLevel, schoolLevelCode },
     dgnssIds,
   };
   ```
   - **위험도**: Medium
   - **영향**: `Student` 타입에 `schoolLevelCode`가 정의되지 않았다면, `StudentDashboardPage.tsx`에서 `student.schoolLevelCode` 접근 시 타입 에러 발생 가능

---

### 2. `frontend/src/features/student-dashboard/api/dataHelperService.ts`

**변경 내용:**
- `SCHOOL_LEVEL_REVERSE_MAP`, `SchoolLevelCode` import 추가
- `StudentData` 타입에 `stdtId`, `claId`, `tcId`, `schoolLevelCode`, `grade`, `classNumber` 필드 추가
- `buildProfile` 함수 신규 작성
- 모든 질문에 profile 전달로 변경 (기존 type-* 조건부 로직 제거)

**[GOOD] 잘된 점:**
- `buildProfile` 함수가 `stdtId`/`claId`가 없으면 `null`을 반환하여 안전하게 폴백
- `SCHOOL_LEVEL_REVERSE_MAP`을 사용하여 한글 라벨을 영문 값으로 변환하는 로직 명확
- `tcId`를 `null` 허용으로 처리하여 교사 계정이 아닌 경우에도 대응 가능

**[PROBLEM] 발견된 문제:**

1. **[회귀 가능성]**: 기존에는 `type-*` 질문에만 profile을 전달했으나, 이제 모든 질문에 profile을 전달합니다. `stdtId`/`claId`가 없는 경우 `buildProfile`이 `null`을 반환하여 profile이 생략되므로, 기존 `type-*` 질문에서도 profile이 사라질 수 있습니다.
   - **위치**: `dataHelperService.ts` 라인 258-261, 284-287
   - **기존 코드**:
   ```typescript
   const contextData = {
     mode: 'student',
     context: `${SYSTEM_PROMPT_DATA_HELPER}\n\n---\n\n${studentContext}`,
     ...(profile !== null ? { profile } : {}),
   };
   ```
   - **해결 방안**: `buildProfile`이 `null`을 반환할 때, 기존처럼 최소한의 profile(`schoolLevel`, `predictedType`)이라도 전달할지 명시적인 결정이 필요합니다.
   ```typescript
   const profile = buildProfile(data);
   const fallbackProfile = data.schoolLevel && data.predictedType
     ? { schoolLevel: SCHOOL_LEVEL_REVERSE_MAP[data.schoolLevel], predictedType: data.predictedType }
     : null;
   const contextData = {
     mode: 'student',
     context: `${SYSTEM_PROMPT_DATA_HELPER}\n\n---\n\n${studentContext}`,
     ...(profile !== null ? { profile } : fallbackProfile !== null ? { profile: fallbackProfile } : {}),
   };
   ```
   - **위험도**: Medium
   - **영향**: `stdtId`/`claId`가 없는 환경(테스트, 특정 페이지)에서 `type-*` 질문에 대한 AI 응답 품질 저하 가능

2. **[SCHOOL_LEVEL_REVERSE_MAP 완전성]**: 모든 `SchoolLevel` 값에 대한 매핑이 존재하는지 확인이 필요합니다.
   - **위치**: `dataHelperService.ts` 라인 33
   - **기존 코드**:
   ```typescript
   schoolLevel: SCHOOL_LEVEL_REVERSE_MAP[data.schoolLevel],
   ```
   - **해결 방안**: 매핑되지 않은 값이 들어오면 `undefined`가 반환됩니다. 안전한 폴백 처리를 추가하세요.
   ```typescript
   schoolLevel: SCHOOL_LEVEL_REVERSE_MAP[data.schoolLevel] ?? data.schoolLevel,
   ```
   - **위험도**: Medium
   - **영향**: 매핑되지 않은 `SchoolLevel` 값이 전달되면 AI 에이전트가 학교급을 인식하지 못할 수 있음

---

### 3. `frontend/src/features/student-dashboard/ui/AiChatPanel.tsx`

**변경 내용:**
- `user.tcId`를 `StudentData`에 주입하여 `enrichedData` 생성
- `getDataHelperAnswer`와 `getDataHelperFreeAnswer` 호출 시 `data` 대신 `enrichedData` 전달

**[GOOD] 잘된 점:**
- `tcId`를 `null`로 초기화하여 `user?.tcId`가 `undefined`일 때도 일관된 타입 유지
- `enrichedData`를 별도 변수로 분리하여 원본 `data` prop을 변경하지 않고 안전하게 확장

**[PROBLEM] 발견된 문제:**

1. **[타입 일관성]**: `user?.tcId`가 `undefined`일 때 `null`로 변환되지만, `StudentData.tcId`의 타입이 `string | null | undefined`인지 확인이 필요합니다.
   - **위치**: `AiChatPanel.tsx` 라인 210
   - **기존 코드**:
   ```typescript
   const enrichedData: StudentData = { ...data, tcId: user?.tcId ?? null };
   ```
   - **해결 방안**: `StudentData.tcId` 타입이 `string | null`이라면 문제없습니다. 만약 `string | undefined`라면 `null` 대신 `undefined`를 사용해야 합니다.
   ```typescript
   const enrichedData: StudentData = { ...data, tcId: user?.tcId ?? undefined };
   ```
   - **위험도**: Low
   - **영향**: 타입 불일치 시 TypeScript 컴파일 에러 발생 가능

---

### 4. `frontend/src/pages/student-dashboard/StudentDashboardPage.tsx`

**변경 내용:**
- `StudentData` 객체 생성 시 `stdtId`, `claId`, `schoolLevelCode`, `grade`, `classNumber` 필드 추가

**[GOOD] 잘된 점:**
- `studentId`, `classId` 등 이미 존재하는 변수를 재사용하여 중복 없이 필드 구성
- `student.schoolLevelCode`와 `classInfo.grade`, `classInfo.classNumber`를 사용하여 데이터 일관성 유지

**[PROBLEM] 발견된 문제:**
- 특별한 문제가 발견되지 않았습니다.

---

## 보안 분석

**발견된 보안 취약점:** 없음

**보안 체크리스트:**
- [x] 인증/인가 검증 - `useAuth()`를 통해 인증된 사용자 정보 사용
- [x] 입력 검증 및 Sanitization - AI Agent 호출 시 구조화된 데이터 전달
- [x] 민감 정보 보호 - `stdtId`, `claId`, `tcId`는 DB 식별자로, 직접적인 PII는 아님
- [ ] HTTPS/암호화 사용 - 프론트엔드 레벨에서는 해당사항 없음

**참고**: `tcId`(교사 ID)가 AI Agent에 전달되는 것은 의도된 동작으로 보이나, 이 정보가 로그에 기록되거나 외부로 유출되지 않도록 백엔드에서 적절한 처리가 필요합니다.

---

## 버그 가능성 분석

**잠재적 버그:**

1. **[SCHOOL_LEVEL_REVERSE_MAP 불완전성]**: 매핑되지 않은 `SchoolLevel` 값이 전달되면 `undefined` 반환
   - **재현 조건**: `data.schoolLevel`이 `SCHOOL_LEVEL_REVERSE_MAP`에 없는 값일 때
   - **예상 결과**: AI Agent가 `schoolLevel: undefined`를 받아 학교급 인식 실패
   - **수정 방법**: `??` 연산자로 폴백 처리

2. **[회귀: type-* 질문에서 profile 누락]**: `stdtId`/`claId`가 없는 환경에서 `buildProfile`이 `null` 반환
   - **재현 조건**: `stdtId` 또는 `claId`가 `undefined`인 상태에서 `type-*` 질문 전송
   - **예상 결과**: AI Agent가 profile 없이 응답 생성 (기존보다 응답 품질 저하 가능)
   - **수정 방법**: 최소한의 폴백 profile 제공

**Edge Case 검증:**
- [x] Null/Undefined 처리 - `buildProfile`에서 `stdtId`/`claId` null 체크
- [ ] 빈 배열/객체 처리 - 해당사항 없음
- [ ] 경계값 (0, 음수, 최대값) - `grade`, `classNumber`가 0이나 음수일 경우 AI Agent 처리 불명확
- [ ] 동시성 문제 - 해당사항 없음

---

## 성능 분석

**성능 이슈:** 없음

변경된 코드는 단순한 데이터 구조 확장과 조건부 객체 전달 로직으로, 성능에 미치는 영향은 미미합니다.

**성능 체크리스트:**
- [x] 불필요한 연산 제거 - `buildProfile`은 필요할 때만 호출됨
- [x] 캐싱 활용 - 해당사항 없음
- [x] 비동기 처리 - 기존 비동기 흐름 유지
- [x] 메모리 효율성 - 객체 spread 연산자 사용으로 불필요한 복사 최소화

---

## 코드 품질 평가

- **가독성**: 8/10 - `buildProfile` 함수의 목적과 동작이 명확하게 주석으로 설명되어 있음. 다만 `SCHOOL_LEVEL_REVERSE_MAP`의 완전성에 대한 검증이 부족
- **유지보수성**: 7/10 - `buildProfile`이 별도 함수로 분리되어 있어 유지보수에 용이. 그러나 `StudentData` 타입이 여러 파일에 걸쳐 확장되어 추적이 어려울 수 있음
- **테스트 커버리지**: 평가 불가 - 테스트 파일이 Diff에 포함되지 않음. `buildProfile` 함수와 `schoolLevelCode` 전파 로직에 대한 단위 테스트가 필요
- **문서화**: 7/10 - 주요 변경 사항에 JSDoc 주석이 추가되어 있으나, `SCHOOL_LEVEL_REVERSE_MAP`의 전체 매핑 목록에 대한 문서가 부족

---

## 개선 제안 (우선순위별)

### 필수 (Must Fix)
1. **`SCHOOL_LEVEL_REVERSE_MAP` 폴백 처리**: `dataHelperService.ts` 라인 33에서 `SCHOOL_LEVEL_REVERSE_MAP[data.schoolLevel]`이 `undefined`를 반환할 경우를 대비한 폴백 처리 필요
2. **`Student` 타입 정의 확인**: `useApiData.ts`에서 `schoolLevelCode`를 `Student` 객체에 spread할 때 타입 정의와의 일치 여부 확인

### 권장 (Should Fix)
1. **회귀 방지 폴백 profile**: `buildProfile`이 `null`을 반환할 때, 기존 type-* 질문에 사용되던 최소 profile(`schoolLevel`, `predictedType`)을 폴백으로 제공하는 로직 추가 검토
2. **`tcId` 타입 일관성**: `AiChatPanel.tsx`에서 `user?.tcId ?? null` 대신 `user?.tcId ?? undefined` 사용 검토 (타입 정의에 따라)

### 선택 (Nice to Have)
1. **단위 테스트 추가**: `buildProfile` 함수에 대한 단위 테스트 케이스 추가 (정상 케이스, null 입력 케이스, 매핑되지 않은 schoolLevel 케이스)
2. **`SCHOOL_LEVEL_REVERSE_MAP` 완전성 검증**: 빌드 타임에 모든 `SchoolLevel` 값이 매핑되었는지 검증하는 유틸리티 추가

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - 문제 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - 경미한 이슈만 존재
- [x] [FIX] **수정 필요 (Changes Requested)** - 중요 이슈 수정 후 재검토
- [ ] [REJECT] **거부 (Rejected)** - 치명적 이슈로 인한 병합 불가

**핵심 코멘트:**
이 커밋은 AI Agent의 Tool 호출 범위를 확장하는 의미 있는 변경입니다. 전반적인 코드 품질은 양호하나, `SCHOOL_LEVEL_REVERSE_MAP`의 불완전성으로 인한 `undefined` 전달 가능성과, `stdtId`/`claId`가 없는 환경에서 기존 `type-*` 질문의 profile이 완전히 사라지는 회귀 가능성이 확인되었습니다. 이 두 가지 이슈는 실제 운영 환경에서 AI 응답 품질에 직접적인 영향을 줄 수 있으므로, 수정 후 재검토를 권장합니다.

**리뷰어 노트:**
- 검토 시간: 약 20분
- 우선 수정 항목:
  1. `SCHOOL_LEVEL_REVERSE_MAP[data.schoolLevel]` 폴백 처리 (`dataHelperService.ts` 라인 33)
  2. `buildProfile` null 반환 시 기존 type-* 질문 폴백 profile 제공 여부 결정 (`dataHelperService.ts` 라인 258-261, 284-287)
  3. `Student` 타입에 `schoolLevelCode` 필드 존재 여부 확인 (`useApiData.ts` 라인 154, 177)