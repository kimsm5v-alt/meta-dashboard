> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 1d8f068d

## 코드 복잡도 분석

**분석된 파일**: 4개 / 변경된 파일: 4개


### 정상 범위 (NONE)


**`dashboardservice.ts`** (other)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.009

- 청크 수: 49개


**권장사항:**

- 파일 크기가 큼 (49개 청크) - 파일 분리 검토


**`index.ts`** (other)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.010

- 청크 수: 93개


**권장사항:**

- 파일 크기가 큼 (93개 청크) - 파일 분리 검토


**`assistantservice.ts`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.006

- 청크 수: 10개


**권장사항:**

- 복잡도 정상 범위


**`useapidata.ts`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.010

- 청크 수: 38개


**권장사항:**

- 파일 크기가 큼 (38개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 AI 어시스턴트(에이전트)가 학생/학급/전체 모드에 따라 적절한 DB 식별자(stdtId, claId, tcId)와 원본 학교급 코드(schoolLevelCode)를 전달받을 수 있도록 profile 빌드 로직을 확장한 변경입니다.

- **목적**: 기존 `buildStudentProfile`이 student 모드 + 단일 학생에만 동작하던 것을, class 모드와 all 모드까지 지원하도록 확장하고, AI 에이전트가 MySQL Tool(Neo4j/MySQL)을 호출할 때 필요한 실제 DB 식별자(stdtId, claId, tcId)를 profile에 포함시킴
- **도메인**: 비즈니스 로직 (AI 에이전트 연동, 데이터 파이프라인)
- **변경 방향**: 단일 학생 전용 프로필 -> mode 기반 멀티 컨텍스트 프로필로 확장, 원본 SchoolLevelCode('elementary'|'middle'|'high')를 보존하여 'high'가 '중등'으로 뭉개지는 정보 손실 문제 해결

---

## [STATUS] 심각도별 이슈 요약

### Critical (즉시 수정 필요)
없음

### High (우선 수정 권장)
없음

### Medium (개선 권장)
1. **`buildContextProfile`의 `mode === 'all'` 분기에서 `classes[0]` 접근 방식이 불안정함** - classes 배열이 비어있거나 teacherId가 일관되지 않은 경우 예상치 못한 동작 발생 가능
2. **`buildContextProfile` 반환 타입이 `Record<string, unknown>`으로 지나치게 느슨함** - profile 구조가 mode별로 달라 호출부에서 타입 안전성 보장 불가

### Low (참고 사항)
1. **`buildClassFromAPI`의 `schoolLevelCode` 파라미터가 optional이지만, `useApiData.ts` 호출부에서는 항상 전달하고 있음** - 일관성은 좋으나 추후 누락 시 사이드 이펙트 발생 가능
2. **`mode === 'all'`에서 `tcId`가 `classes[0]?.teacherId`로 결정되는 방식이 암시적임** - 복수 학급에서 첫 번째 학급의 teacherId가 대표값임을 문서화할 필요 있음

---

## 변경사항 요약

1. `buildStudentProfile` -> `buildContextProfile`로 함수명 변경 및 mode(student/class/all)별 분기 처리 추가
2. profile에 `stdtId`, `claId`, `tcId` DB 식별자 필드 추가
3. `Class`와 `Student` 타입에 `schoolLevelCode?: SchoolLevelCode` 필드 추가
4. `buildClassFromAPI` 함수에 `schoolLevelCode` 파라미터 추가 및 전파
5. `useApiData.ts`에서 `group.schoolLevel`(원본 SchoolLevelCode)을 `schoolLevelCode`로 전달

---

## 파일별 상세 분석

### 1. frontend/src/shared/types/index.ts

**변경 내용:**
- `Class` 인터페이스에 `schoolLevelCode?: SchoolLevelCode` 필드 추가
- `Student` 인터페이스에 `schoolLevelCode?: SchoolLevelCode` 필드 추가
- JSDoc 주석으로 원본 코드 보존의 필요성 설명

**잘된 점:**
- `schoolLevelCode`를 optional(`?`)로 선언하여 기존 코드와의 하위 호환성을 유지함
- JSDoc에 `'high'를 '중등'으로 뭉개서 저장하므로`라는 구체적인 이유를 명시하여 유지보수성을 높임
- `SchoolLevelCode` 타입(`'elementary' | 'middle' | 'high'`)이 이미 정의되어 있어 일관된 타입 사용

**핵심 코드 분석:**
```typescript
// SCHOOL_LEVEL_MAP: SchoolLevelCode -> SchoolLevel 변환
// 'high'가 '중등'으로 뭉개지는 것이 이 매핑의 핵심
export const SCHOOL_LEVEL_MAP: Record<SchoolLevelCode, SchoolLevel> = {
  elementary: '초등',
  middle: '중등',
  high: '중등', // 고등도 중등으로 처리 (검사 기준)
};

// SCHOOL_LEVEL_REVERSE_MAP: SchoolLevel -> SchoolLevelCode 역변환
// '중등' -> 'middle'로만 매핑되므로 'high' 정보는 복원 불가
export const SCHOOL_LEVEL_REVERSE_MAP: Record<SchoolLevel, SchoolLevelCode> = {
  초등: 'elementary',
  중등: 'middle',
};
```

이 매핑 구조 때문에 `schoolLevel`만으로는 'high'(고등)와 'middle'(중등)을 구분할 수 없습니다. 이 커밋은 `schoolLevelCode` 필드를 추가하여 이 정보 손실 문제를 해결합니다.

---

### 2. frontend/src/shared/services/dashboardService.ts

**변경 내용:**
- `buildClassFromAPI` 함수 시그니처에 `schoolLevelCode?: SchoolLevelCode` 파라미터 추가 (7번째 파라미터)
- 반환되는 `Class` 객체와 `Student` 객체에 `schoolLevelCode` 필드 전파

**잘된 점:**
- `schoolLevelCode`를 optional로 선언하여 기존 호출자(caller)에 영향을 주지 않음
- `Student` 객체 생성 시점(`students.map` 내부)에서 `schoolLevelCode`를 각 학생에 일괄 할당하여 일관성 유지

**핵심 코드 분석:**
```typescript
// buildClassFromAPI 함수 시그니처 (라인 574-580)
export async function buildClassFromAPI(
  claId: string,
  grade: number,
  classNumber: number,
  schoolLevel: SchoolLevel,
  dgnssId: number,
  round2DgnssId?: number,
  schoolLevelCode?: SchoolLevelCode,  // 새로 추가된 7번째 파라미터
): Promise<import('@shared/types').Class | null> {

// Student 객체 생성 시 schoolLevelCode 전파 (라인 614-620)
return {
  id: info.stdtId,
  classId: claId,
  number: info.rowNum,
  name: info.stdtNm ?? info.nickname ?? `학생${info.rowNum}`,
  schoolLevel,
  schoolLevelCode,  // API에서 받은 원본 코드를 그대로 전달
  grade,
  assessments,
};

// Class 객체 생성 시 schoolLevelCode 전파 (라인 647-652)
return {
  id: claId,
  schoolLevel,
  schoolLevelCode,  // 학급 레벨에도 동일하게 전달
  grade,
  classNumber,
  teacherId: '',
  students,
  stats: { ... },
};
```

**발견된 문제 (Low):**
`buildClassFromAPI`의 반환 타입이 `Promise<import('@shared/types').Class | null>`로 인라인 타입 참조를 사용하고 있습니다. 파일 상단에 이미 `import type { SchoolLevel, SchoolLevelCode, StudentType } from '@shared/types';`가 있으므로 `Class`도 import하여 사용하는 것이 코드 일관성 측면에서 좋습니다. 기능적 문제는 없습니다.

---

### 3. frontend/src/features/api/useApiData.ts

**변경 내용:**
- `buildClassFromAPI` 호출 시 7번째 인자로 `group.schoolLevel` 전달
- `simpleClass` 객체 생성 시 `schoolLevelCode: group.schoolLevel` 할당
- 주석으로 `group.schoolLevel`이 원본 SchoolLevelCode임을 명시

**잘된 점:**
- `group.schoolLevel`이 `SchoolLevelCode` 타입임을 주석으로 명확히 표기
- `SCHOOL_LEVEL_MAP[group.schoolLevel]`으로 변환되기 전 원본 값을 그대로 흘려보내는 설계가 명확함

**핵심 코드 분석:**
```typescript
// useApiData.ts의 useTeacherClasses 훅 내부 (라인 420-442)
const schoolLevel: SchoolLevel = SCHOOL_LEVEL_MAP[group.schoolLevel] ?? credSchoolLevel;
// group.schoolLevel(SchoolLevelCode)은 위에서 '중등'으로 뭉개지기 전의 원본 값('high' 포함)이다.
// AI 에이전트 등 다운스트림이 실제 학교급을 알 수 있도록 그대로 흘려보낸다.

if (primaryDgnssId) {
  return buildClassFromAPI(
    group.claId,
    group.grade,
    group.classNumber,
    schoolLevel,          // '초등' 또는 '중등' (뭉개진 값)
    primaryDgnssId,
    round2?.dgnssId,
    group.schoolLevel,    // 원본 SchoolLevelCode ('elementary'|'middle'|'high')
  );
}

// 검사 데이터가 없는 경우에도 schoolLevelCode 전달
const simpleClass: Class = {
  id: group.claId,
  schoolLevel,
  schoolLevelCode: group.schoolLevel,  // 원본 코드 보존
  grade: group.grade,
  classNumber: group.classNumber,
  teacherId: user.id,
  students: [],
  stats: activeExam ? { ... } : undefined,
};
```

---

### 4. frontend/src/features/ai-room/api/assistantService.ts (핵심 변경 파일)

**변경 내용:**
- `buildStudentProfile` -> `buildContextProfile`로 함수명 변경
- mode(student/class/all)별 분기 처리 추가
- 각 mode별로 필요한 DB 식별자(stdtId, claId, tcId)를 profile에 포함
- `schoolLevelCode` 필드를 profile에 추가하여 원본 학교급 정보 보존
- `callAssistant`와 `callAssistantStream`에서 `buildContextProfile` 호출 시 `selectedClass` 인자 추가

**잘된 점:**
- mode별로 반환되는 profile 구조가 명확히 분리되어 있어 가독성이 좋음
- `schoolLevelCode`를 `student.schoolLevelCode ?? cls?.schoolLevelCode ?? null`로 3단계 fallback 처리하여 최대한 정보를 보존하려는 설계
- `tcId`를 `cls?.teacherId ?? null`로 안전하게 처리 (student 모드)
- JSDoc 주석이 상세하여 함수의 의도와 mode별 동작 차이를 이해하기 쉬움

**핵심 코드 분석:**

```typescript
// buildContextProfile 함수 (라인 66-110)
const buildContextProfile = (
  mode: ContextMode,
  selectedStudents: Student[],
  classes: Class[],
  selectedClass: Class | null,
): Record<string, unknown> | null => {

  // [mode: student] - 학생 1명 + 검사 데이터 있을 때만
  if (mode === 'student') {
    if (selectedStudents.length !== 1) return null;
    const student = selectedStudents[0];
    const assessment = getLatestAssessment(student);
    if (!assessment) return null;
    const cls = classes.find((c) => c.id === student.classId);

    return {
      schoolLevel: SCHOOL_LEVEL_REVERSE_MAP[student.schoolLevel],
      schoolLevelCode: student.schoolLevelCode ?? cls?.schoolLevelCode ?? null,
      predictedType: assessment.predictedType,
      grade: student.grade,
      classNumber: cls?.classNumber ?? null,
      stdtId: student.id,        // MySQL Tool용 DB 식별자
      claId: student.classId,    // MySQL Tool용 DB 식별자
      tcId: cls?.teacherId ?? null,  // MySQL Tool용 DB 식별자
    };
  }

  // [mode: class] - 학급 선택 시
  if (mode === 'class') {
    if (!selectedClass) return null;
    return {
      schoolLevel: SCHOOL_LEVEL_REVERSE_MAP[selectedClass.schoolLevel],
      schoolLevelCode: selectedClass.schoolLevelCode ?? null,
      grade: selectedClass.grade,
      classNumber: selectedClass.classNumber,
      claId: selectedClass.id,
      tcId: selectedClass.teacherId || null,  // 주의: || 사용
    };
  }

  // [mode: all] - 특정 학급/학생 없이 담당 교사 ID만 전달
  const tcId = classes[0]?.teacherId || null;
  if (!tcId) return null;
  return { tcId };
};
```

**발견된 문제 1 (Medium) - `mode === 'all'` 분기에서 `classes[0]` 접근 방식이 불안정함:**

`classes[0]?.teacherId`로 teacherId를 결정하는 방식은 다음과 같은 문제가 있습니다:

1. `classes` 배열이 비어있는 경우(`[]`): `classes[0]`은 `undefined`, `tcId`는 `null` -> 함수가 `null` 반환 -> profile 없이 요청 전송. 이는 의도된 동작일 수 있으나, 에러 로깅 없이 조용히 실패(silent failure)함
2. 복수 학급을 가진 교사의 경우: `classes[0]`의 `teacherId`가 모든 학급의 교사와 동일하다는 보장이 없음. 다른 교사가 담당하는 학급이 섞여 있다면 잘못된 `tcId`가 전달될 수 있음
3. `classes` 배열의 정렬 순서에 의존: `classes[0]`이 어떤 학급인지는 배열의 정렬 순서에 따라 달라지며, 이는 예측 불가능함

**수정 제안:**
```typescript
// mode === 'all': 특정 학급/학생 없이 담당 교사 ID만 전달
// 모든 학급의 teacherId가 동일한지 검증하여 일관성 확보
const uniqueTeacherIds = [...new Set(classes.map((c) => c.teacherId).filter(Boolean))];
if (uniqueTeacherIds.length === 0) {
  console.warn('[buildContextProfile] mode=all: 유효한 teacherId가 없습니다.');
  return null;
}
if (uniqueTeacherIds.length > 1) {
  console.warn(
    `[buildContextProfile] mode=all: 여러 teacherId 발견됨 (${uniqueTeacherIds.join(', ')}). 첫 번째 사용.`,
  );
}
return { tcId: uniqueTeacherIds[0] };
```

**발견된 문제 2 (Medium) - `buildContextProfile` 반환 타입이 `Record<string, unknown>`으로 느슨함:**

mode별로 반환되는 profile의 구조가 다름에도 `Record<string, unknown>`으로 선언되어 있어, 호출부에서 profile 객체의 특정 필드에 접근할 때 타입 검증이 불가능합니다. 향후 profile 구조가 변경되거나 새로운 mode가 추가될 때 컴파일 타임에 오류를 잡을 수 없습니다.

**수정 제안:**
```typescript
// mode별 profile 구조를 discriminated union으로 정의
type StudentProfile = {
  schoolLevel: SchoolLevelCode;
  schoolLevelCode: SchoolLevelCode | null;
  predictedType: StudentType;
  grade: number;
  classNumber: number | null;
  stdtId: string;
  claId: string;
  tcId: string | null;
};

type ClassProfile = {
  schoolLevel: SchoolLevelCode;
  schoolLevelCode: SchoolLevelCode | null;
  grade: number;
  classNumber: number;
  claId: string;
  tcId: string | null;
};

type AllProfile = {
  tcId: string;
};

type ContextProfile = StudentProfile | ClassProfile | AllProfile;
```

**발견된 문제 3 (Low) - `||`와 `??` 연산자 일관성:**

`mode === 'class'` 분기에서 `tcId`를 `selectedClass.teacherId || null`로 처리하는 반면, `mode === 'student'` 분기에서는 `cls?.teacherId ?? null`로 처리합니다. `??` (nullish coalescing)와 `||` (logical OR)의 차이는 다음과 같습니다:
- `??`: `null` 또는 `undefined`일 때만 fallback
- `||`: falsy 값(`''`, `0`, `false`, `null`, `undefined`) 모두 fallback

`Class.teacherId`의 타입이 `string`(필수)이므로 빈 문자열이 들어올 가능성이 있습니다. 일관된 연산자 사용을 위해 class 모드도 `??`를 사용하는 것이 좋습니다.

---

## 보안 분석

**발견된 보안 취약점:** 없음

**보안 체크리스트:**
- 인증/인가 검증: profile에 포함된 `tcId`는 AI 에이전트의 Tool 호출 범위 결정에만 사용되며, 실제 데이터 접근 권한은 백엔드에서 별도 검증한다고 가정
- 입력 검증 및 Sanitization: `buildContextProfile`이 외부 입력(selectedStudents, classes)을 그대로 profile에 포함시키므로, AI 에이전트가 이 값을 신뢰하는지 확인 필요
- 민감 정보 보호: profile에 학생 이름 등 PII는 포함되지 않음 (id만 전달)
- HTTPS/암호화 사용: 통신 계층은 별도 검토 대상

---

## 버그 가능성 분석

**잠재적 버그:**

1. **`mode === 'all'`에서 `classes` 배열이 비어있을 때 `null` 반환 후 profile 누락**
   - 재현 조건: `mode === 'all'`이고 `classes` 배열이 빈 배열(`[]`)인 경우
   - 예상 결과: `buildContextProfile`이 `null` 반환 -> `contextData`에 profile이 포함되지 않음 -> AI 에이전트가 교사 컨텍스트 없이 응답 생성
   - 수정 방법: 위에서 제안한 `uniqueTeacherIds` 검증 로직 적용 또는 최소한 `console.warn` 로깅 추가

2. **`mode === 'student'`에서 `student.schoolLevelCode`가 `undefined`이고 `cls?.schoolLevelCode`도 `undefined`인 경우**
   - 재현 조건: `Student` 객체에 `schoolLevelCode` 필드가 없고(`undefined`), 해당 학생의 학급을 `classes`에서 찾을 수 없는 경우
   - 예상 결과: `schoolLevelCode`가 `null`로 설정됨 -> AI 에이전트가 학교급을 정확히 알 수 없음
   - 수정 방법: 현재 3단계 fallback(`student.schoolLevelCode ?? cls?.schoolLevelCode ?? null`)이 최선의 방어책이며, `SCHOOL_LEVEL_REVERSE_MAP[student.schoolLevel]`에서 역변환한 값을 4단계 fallback으로 추가 고려 가능

**Edge Case 검증:**
- Null/Undefined 처리: optional chaining(`?.`)과 nullish coalescing(`??`)을 적절히 사용
- 빈 배열/객체 처리: `classes[0]` 접근 시 `?.`로 보호, `selectedStudents.length !== 1` 체크
- 경계값 (0, 음수, 최대값): 해당 없음 (문자열/객체 기반 로직)
- 동시성 문제: 해당 없음 (동기 함수)

---

## 성능 분석

**성능 이슈:** 없음

**성능 체크리스트:**
- 불필요한 연산 제거: `classes.find()`는 student 모드에서 한 번만 호출
- 캐싱 활용: profile은 첫 메시지에서만 생성되고 이후 `cachedContext`로 캐싱됨
- 비동기 처리: 해당 없음 (동기 함수)
- 메모리 효율성: profile 객체가 작고 일시적이므로 문제 없음

---

## 코드 품질 평가

- **가독성**: 8/10 - mode별 분기가 명확하고 JSDoc 주석이 상세하나, `Record<string, unknown>` 반환 타입이 아쉬움
- **유지보수성**: 7/10 - mode별 profile 구조가 명확히 분리되어 있으나, 새로운 mode 추가 시 타입 시스템의 도움을 받을 수 없음
- **테스트 커버리지**: 평가 불가 - 테스트 파일이 Diff에 포함되지 않음
- **문서화**: 9/10 - JSDoc 주석이 매우 상세하고, mode별 동작 차이와 각 필드의 의미가 잘 설명되어 있음

---

## 개선 제안 (우선순위별)

### 권장 (Should Fix)
1. **`mode === 'all'` 분기의 `classes[0]?.teacherId` 접근 방식 개선** - `uniqueTeacherIds`를 수집하여 일관성 검증 후 사용하거나, `useApiData` 레벨에서 현재 사용자의 `teacherId`를 직접 전달하는 방식으로 변경
2. **`buildContextProfile` 반환 타입을 discriminated union으로 변경** - mode별 profile 구조를 타입 시스템으로 보장

### 선택 (Nice to Have)
1. **`||`와 `??` 연산자 일관성 통일** - class 모드의 `selectedClass.teacherId || null`를 `selectedClass.teacherId ?? null`로 변경
2. **`buildClassFromAPI`의 반환 타입을 인라인 `import()` 대신 상단 import로 변경** - 코드 일관성 향상

---

## 최종 평가

**결론**: [WARN] **조건부 승인 (Approved with Comments)** - 경미한 이슈만 존재

**핵심 코멘트:**

이 커밋은 전반적으로 잘 설계된 변경입니다. `buildStudentProfile`에서 `buildContextProfile`로의 확장은 mode별로 필요한 DB 식별자와 원본 SchoolLevelCode를 보존하는 방향으로 명확하게 이루어졌습니다. JSDoc 주석이 상세하여 유지보수성이 높고, 하위 호환성(optional 필드/파라미터)도 잘 고려되었습니다.

특히 `SCHOOL_LEVEL_MAP`에서 'high'가 '중등'으로 뭉개지는 정보 손실 문제를 `schoolLevelCode` 필드 추가로 해결한 점은, AI 에이전트가 고등학생을 중등으로 오인하는 버그를 근본적으로 방지하는 좋은 설계입니다.

다만, `mode === 'all'` 분기에서 `classes[0]?.teacherId`로 teacherId를 결정하는 방식은 다중 학급/다중 교사 환경에서 불안정할 수 있으므로, `uniqueTeacherIds` 검증 로직을 추가하거나 더 명시적인 teacherId 전달 방식을 고려하는 것이 좋습니다. 또한 `Record<string, unknown>` 반환 타입은 mode별 profile 구조가 다른 만큼 discriminated union으로 개선하면 타입 안전성이 크게 향상될 것입니다.

**리뷰어 노트:**
- 검토 시간: 약 20분
- 우선 수정 항목:
  1. `mode === 'all'` 분기의 `classes[0]?.teacherId` 접근 방식 개선 (Medium)
  2. `buildContextProfile` 반환 타입을 discriminated union으로 변경 (Medium)
  3. `||` -> `??` 연산자 일관성 통일 (Low)