> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 3728f0f1

## 코드 복잡도 분석

**분석된 파일**: 7개 / 변경된 파일: 7개


### 정상 범위 (NONE)


**`theme.ts`** (other)

- 평균 복잡도: **0.111**

- 최대 복잡도: 0.221

- 청크 수: 2개

- 평균 사용처: 2.0곳


**권장사항:**

- 복잡도 정상 범위


**`examservice.ts`** (other)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.011

- 청크 수: 38개


**권장사항:**

- 파일 크기가 큼 (38개 청크) - 파일 분리 검토


**`exampage.tsx`** (component)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.013

- 청크 수: 40개


**권장사항:**

- 파일 크기가 큼 (40개 청크) - 파일 분리 검토


**`datahelperchatbot.tsx`** (utility)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.008

- 청크 수: 19개


**권장사항:**

- 복잡도 정상 범위


**`studentdashboardpage.tsx`** (component)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.008

- 청크 수: 49개


**권장사항:**

- 파일 크기가 큼 (49개 청크) - 파일 분리 검토


**`examguidestep.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.009

- 청크 수: 106개


**권장사항:**

- 파일 크기가 큼 (106개 청크) - 파일 분리 검토


**`aichatpanel.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.004

- 청크 수: 47개


**권장사항:**

- 파일 크기가 큼 (47개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 진단검사(학습종합/자기조절검사) 시작 플로우에서 **학생 기본 정보(학교명, 학년, 반, 성별)를 최초 API 호출 시 백엔드로 함께 전송**하는 기능을 추가하고, 이에 맞춰 **검사 시작 준비 UI(ExamGuideStep)를 전면 리디자인**한 변경입니다.

- **목적**: 검사 시작 시 학생 정보를 백엔드에 전달하여 데이터 정합성 확보, UI/UX 개선을 통한 사용자 경험 향상
- **도메인**: API (examService) + UI (ExamGuideStep, ExamPage)
- **변경 방향**: 기존 GET 방식의 단순 페이지네이션에서 POST 방식으로 전환하며 학생 정보 페이로드 포함, UI는 정보 확인/입력 영역을 LockedField(자동)와 EditableField(수동)로 분리하여 맥락에 따른 유연한 입력 지원

## [GOOD] 잘된 점

1. **StudentInfoForStart 인터페이스 분리**: `StudentInfo`(UI 폼용)와 `StudentInfoForStart`(API 전송용)를 명확히 분리하여 타입 안전성을 확보했습니다. `StudentInfoForStart`의 `grade`와 `classNumber`가 `number` 타입으로 정의되어 API 스펙과 일치합니다.

2. **LockedField + AutoBadge 패턴**: 컨텍스트에서 제공된 정보(학교명, 학교급, 학년, 반)는 읽기 전용 LockedField로 표시하고, 누락된 필드만 입력 가능하게 하는 UX 패턴이 직관적이고 실용적입니다. `AutoBadge` 컴포넌트에 `Lock` 아이콘과 "자동" 레이블을 함께 표시하여 사용자가 자동 입력된 정보임을 인지할 수 있게 한 점이 좋습니다.

3. **renderTextWithBold 유틸리티**: 가이드라인 텍스트에서 강조할 부분을 `boldParts` 배열로 선언적으로 관리하여 유지보수성을 향상시켰습니다. `GUIDELINES` 배열이 객체 배열로 변경되면서 각 가이드라인의 의미 구조가 명확해졌습니다.

4. **QR/게스트 플로우에서 studentInfo 전달 전략**: `ExamPage.tsx`의 `handleGuideStart`에서 최초 호출에만 `studentInfoForStart`를 포함하고, 페이지 이동 시(이어하기)에는 제외하는 설계가 합리적입니다. 이는 백엔드가 최초 요청에서만 학생 정보를 처리한다는 요구사항을 정확히 반영한 것입니다.

## 변경사항 요약

- `examService.ts`: `fetchQuestions`에 `StudentInfoForStart` 파라미터 추가, POST 요청 페이로드에 학생 정보 포함
- `ExamGuideStep.tsx`: UI 전면 리디자인 (레이아웃 변경, LockedField/EditableField 분리, 가이드라인 구조화, 예시 문제 영역 개선)
- `ExamPage.tsx`: `handleGuideStart`에서 `StudentInfo`를 `StudentInfoForStart`로 변환하여 `fetchQuestions`에 전달
- `theme.ts`: primary 컬러 팔레트에 `1000: '#009f88'` 추가
- `AiChatPanel.tsx`: `min-height`를 `500px`에서 `50vh`로 변경 (반응형 개선)
- `DataHelperChatbot.tsx`: 코드 포맷팅 정리 (불필요한 import 제거, 들여쓰기 정리)

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

#### 1. `resetExam` 호출 시 `studentInfo` 미전달 (ExamPage.tsx, 라인 598)

**문제 분석:**
`isStudentFlow` + `isRestartMode` 조건에서 `resetExam`을 호출할 때 `studentInfoForStart`를 전달하지 않고 있습니다.

```typescript
// ExamPage.tsx, 라인 596-600
const result = isRestartMode
  ? await resetExam(state.dgnssResultId, 0, 20, examPaperIdx)
  : await fetchQuestions(state.dgnssResultId, 0, 20, examPaperIdx, studentInfoForStart);
```

`resetExam` 함수(라인 323)는 내부적으로 `GET /api/dgnss/st/new`를 호출한 후 다시 `POST /api/dgnss/st/start`를 호출합니다. 그런데 `resetExam`의 `POST /api/dgnss/st/start` 호출에는 학생 정보가 포함되어 있지 않습니다.

```typescript
// examService.ts, 라인 323-362
export async function resetExam(
  dgnssResultId: number,
  page: number = 0,
  _size: number = 20,
  paperIdx: string = '1',
): Promise<FetchQuestionsResponse> {
  // ... GET /api/dgnss/st/new 호출 ...
  const startRes = await apiClient.post<QuestionsResponseData>(
    '/api/dgnss/st/start',
    { dgnssResultId, paperIdx: Number(paperIdx), page: 0, size: 20 },  // studentInfo 없음
  );
  // ...
}
```

**영향**: 재시작(reset) 시 학생 정보가 백엔드에 전달되지 않아, 최초 등록된 학생 정보가 유실되거나 덮어쓰기되지 않을 수 있습니다.

**해결 방안**: `resetExam` 함수 시그니처에 `studentInfo?: StudentInfoForStart` 파라미터를 추가하고, 내부의 `POST /api/dgnss/st/start` 호출 시 해당 정보를 포함하도록 변경하세요.

**[수정 코드 제시 불가 — 문맥 파악 불충분]**
`resetExam` 함수의 내부 로직과 백엔드 API의 요구사항을 정확히 알 수 없어 완전한 수정 코드를 제시하기 어렵습니다. 다만, `resetExam` 함수 시그니처에 `studentInfo?: StudentInfoForStart` 파라미터를 추가하고, 내부의 `POST /api/dgnss/st/start` 호출 시 해당 정보를 포함하도록 변경하는 방향을 검토하시기 바랍니다.

#### 2. `renderTextWithBold`의 XSS 위험 (ExamGuideStep.tsx, 라인 543-551)

**문제 분석:**
`dangerouslySetInnerHTML`을 사용하여 사용자 입력(또는 외부 데이터)을 그대로 렌더링할 가능성이 있는 유틸리티 함수가 추가되었습니다.

```typescript
// ExamGuideStep.tsx, 라인 543-551
const renderTextWithBold = (text: string, boldParts: string[]) => {
  let result = text;
  boldParts.forEach((part) => {
    result = result.replace(
      part,
      `<strong style="font-weight: 600; color: #111827;">${part}</strong>`,
    );
  });
  return <span dangerouslySetInnerHTML={{ __html: result }} />;
};
```

현재 `GUIDELINES` 배열의 `boldParts`는 하드코딩된 문자열이므로 실제 위험은 없습니다. 그러나 `boldParts`의 각 `part`가 `text` 문자열 내에서 `String.prototype.replace`로 치환될 때, 만약 `boldParts`에 HTML 특수문자(`<`, `>`, `&` 등)가 포함되면 예상치 못한 DOM 파싱이 발생할 수 있습니다. 또한 향후 이 함수가 외부 데이터(API 응답 등)에 사용될 경우 XSS 취약점이 될 수 있습니다.

**영향**: 잠재적 XSS 취약점. 현재는 위험이 없지만, 향후 외부 데이터가 유입될 경우 심각한 보안 문제로 발전할 수 있습니다.

**해결 방안 (수정 코드):**
`text`를 먼저 HTML 이스케이프한 후 `boldParts`를 `<strong>`으로 감싸는 방식을 사용하세요.

```typescript
const renderTextWithBold = (text: string, boldParts: string[]) => {
  // text를 먼저 HTML 이스케이프
  const escapeHtml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  let result = escapeHtml(text);
  boldParts.forEach((part) => {
    const escapedPart = escapeHtml(part);
    result = result.replace(
      escapedPart,
      `<strong style="font-weight: 600; color: #111827;">${escapedPart}</strong>`,
    );
  });
  return <span dangerouslySetInnerHTML={{ __html: result }} />;
};
```

### Medium (개선 권장)

#### 3. `studentInfo` 조건부 필드 설정의 중복 코드 (examService.ts, 라인 218-226, 264-272)

**문제 분석:**
`fetchQuestions` 함수 내에서 `paperIdx !== '1'` 분기와 `paperIdx === '1'` 분기 양쪽에 동일한 8줄의 조건문이 반복됩니다.

```typescript
// 첫 번째 분기 (라인 218-226)
if (studentInfo) {
  if (studentInfo.schoolName) payload.schoolName = studentInfo.schoolName;
  if (studentInfo.grade !== undefined) payload.grade = studentInfo.grade;
  if (studentInfo.classNumber !== undefined) payload.classNumber = studentInfo.classNumber;
  if (studentInfo.gender) payload.gender = studentInfo.gender;
}

// 두 번째 분기 (라인 264-272) - 완전히 동일한 코드
if (studentInfo) {
  if (studentInfo.schoolName) payload.schoolName = studentInfo.schoolName;
  if (studentInfo.grade !== undefined) payload.grade = studentInfo.grade;
  if (studentInfo.classNumber !== undefined) payload.classNumber = studentInfo.classNumber;
  if (studentInfo.gender) payload.gender = studentInfo.gender;
}
```

**영향**: 유지보수 시 한쪽만 수정되는 실수를 유발할 수 있습니다. 예를 들어, 새로운 필드가 추가되면 두 곳 모두 수정해야 합니다.

**해결 방안 (수정 코드):**
유틸리티 함수로 추출하여 중복을 제거하세요.

```typescript
/** StudentInfoForStart의 정의된 필드를 payload에 병합 */
function applyStudentInfo(payload: Record<string, unknown>, studentInfo: StudentInfoForStart): void {
  if (studentInfo.schoolName) payload.schoolName = studentInfo.schoolName;
  if (studentInfo.grade !== undefined) payload.grade = studentInfo.grade;
  if (studentInfo.classNumber !== undefined) payload.classNumber = studentInfo.classNumber;
  if (studentInfo.gender) payload.gender = studentInfo.gender;
}
```

그리고 각 분기에서 `if (studentInfo) { applyStudentInfo(payload, studentInfo); }`로 호출합니다.

#### 4. `ExamBadge`의 `background`가 `#009f8815`로 하드코딩됨 (ExamGuideStep.tsx, 라인 44)

**문제 분석:**
`ExamBadge`는 `$color` prop을 받고 있지만, `background`는 `#009f8815`로 고정되어 있습니다. `EXAM_COLOR` 함수가 두 가지 색상(`#009F88` / `#9D53E1`)을 반환하는데, `background`가 항상 `#009f8815`로 고정되면 보라색 계열(`#9D53E1`) 검사에서 배지 배경색이 어색할 수 있습니다.

```typescript
const ExamBadge = styled.span<{ $color: string }>`
  ...
  color: ${({ $color }) => $color};
  background: #009f8815;  // $color와 무관하게 고정
  ...
`;
```

**영향**: 보라색 계열 검사에서 배지의 배경색이 텍스트 색상과 일치하지 않아 시각적 일관성이 떨어집니다.

**해결 방안 (수정 코드):**
`background`도 `$color` 기반으로 동적 계산하도록 변경하세요.

```typescript
const ExamBadge = styled.span<{ $color: string }>`
  ...
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}15`};
  ...
`;
```

#### 5. `GradeSelect`의 `min-width: 436px` 고정값 (ExamGuideStep.tsx, 라인 305)

**문제 분석:**
`GradeSelect`에 `min-width: 436px`이 추가되었습니다. `TwoColumnGrid`가 `768px` 이하에서 1열로 변경될 때, `436px` min-width가 컨테이너를 넘칠 수 있습니다.

```typescript
const GradeSelect = styled.select<{ $hasError?: boolean }>`
  ...
  min-height: 3rem;
  min-width: 436px;  // 반응형 레이아웃에서 문제 발생 가능
  ...
`;
```

**영향**: 모바일 화면(768px 이하)에서 `GradeSelect`가 부모 컨테이너를 넘쳐 레이아웃이 깨질 수 있습니다.

**해결 방안 (수정 코드):**
`min-width`를 `100%`로 변경하여 부모 컨테이너에 맞게 유연하게 조정되도록 하세요.

```typescript
const GradeSelect = styled.select<{ $hasError?: boolean }>`
  ...
  min-height: 3rem;
  min-width: 100%;
  ...
`;
```

#### 6. 주석 처리된 테스트 코드 (ExamGuideStep.tsx, 라인 597-605)

**문제 분석:**
프로덕션 코드에 테스트용 주석이 남아 있습니다.

```typescript
// ExamGuideStep.tsx, 라인 597-605
  // 🔴 TEST: 모든 필드를 입력 가능하게 만들기 위해 빈 context로 강제 설정
  // studentExamContext = {
  //   ordNo: 1,
  //   examName: examName,
  //   schoolName: undefined,
  //   schoolLevel: undefined,
  //   grade: undefined,
  //   classNumber: undefined,
  //   prefilledName: '고우진',
  //   prefilledStudentNumber: '1',
  // }
```

**영향**: 코드 가독성을 저하시키고, 향후 이 주석을 해제하여 테스트한 코드가 그대로 배포될 위험이 있습니다.

**해결 방안**: 불필요한 테스트 주석을 제거하세요.

---

## 주요 파일 분석

### frontend/src/features/exam/api/examService.ts

**변경 내용:** `fetchQuestions`에 `StudentInfoForStart` 파라미터 추가, POST 요청 페이로드에 학생 정보 포함

**핵심 로직 분석:**
1. `paperIdx !== '1'` (자기조절학습검사): 단순 페이징, 백엔드 응답 그대로 사용
2. `paperIdx === '1'` (학습종합검사): 7페이지 구조 + 120-124번 mock 문항 처리
3. 두 분기 모두 `studentInfo`가 전달되면 `schoolName`, `grade`, `classNumber`, `gender`를 payload에 조건부로 추가

**개선 제안:**
- `studentInfo` 조건부 필드 설정 중복 (Medium) - 위 Medium #3 참조
- `_size` 파라미터가 `@param _size 사용하지 않음 (하위 호환성 유지)`라고 명시되어 있지만, 실제로는 `size: 20`으로 하드코딩되어 있습니다. `_size` 파라미터를 완전히 제거하거나, `@deprecated` 태그를 추가하는 것이 좋습니다.

### frontend/src/features/exam/ui/ExamGuideStep.tsx

**변경 내용:** UI 전면 리디자인 (레이아웃 변경, LockedField/EditableField 분리, 가이드라인 구조화)

**핵심 로직 분석:**
1. `studentExamContext`가 존재하면 "검사 시작 준비" 모드로 진입
2. 컨텍스트에서 제공된 필드(`schoolName`, `schoolLevel`, `grade`, `classNumber`)는 LockedField로 표시
3. 누락된 필드는 EditableField로 표시하여 사용자 입력 가능
4. `handleStart`에서 컨텍스트 값과 editable 값을 조합하여 최종 `StudentInfo` 생성
5. `isStartEnabled`는 모든 필수 필드가 채워졌는지 동적으로 검사

**개선 제안:**
- `renderTextWithBold` XSS 위험 (High) - 위 High #2 참조
- `ExamBadge` background 하드코딩 (Medium) - 위 Medium #4 참조
- `GradeSelect` min-width 고정값 (Medium) - 위 Medium #5 참조
- 주석 처리된 테스트 코드 제거 (Medium) - 위 Medium #6 참조

### frontend/src/pages/exam/ExamPage.tsx

**변경 내용:** `handleGuideStart`에서 `StudentInfo`를 `StudentInfoForStart`로 변환하여 `fetchQuestions`에 전달

**핵심 로직 분석:**
1. `StudentInfo`(UI 폼 데이터)를 `StudentInfoForStart`(API 전송용)로 변환
   - `grade`: 문자열에서 숫자 추출 (`parseInt(info.grade.replace(/[^0-9]/g, ''), 10)`)
   - `classNumber`: 문자열을 정수로 변환 (`parseInt(info.classNumber, 10)`)
   - `gender`: 'M' 또는 'F'만 허용, 그 외는 `undefined`
2. 학생 플로우(`isStudentFlow`): `isRestartMode`에 따라 `resetExam` 또는 `fetchQuestions` 호출
3. QR/게스트 플로우: 최초 호출에만 `studentInfoForStart` 포함, 페이지 이동 시 제외

**개선 제안:**
- `resetExam` 호출 시 `studentInfo` 미전달 (High) - 위 High #1 참조
- `StudentInfoForStart` 변환 로직의 중복 가능성: `info.grade`에서 숫자 추출하는 로직이 `ExamGuideStep`의 `handleStart`에서 `String(grade)`로 변환하는 것과 역관계에 있습니다. 이 변환 체인이 양쪽에서 일관되게 유지되어야 합니다. 변환 유틸리티 함수로 추출하는 것을 고려하세요.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

전반적으로 변경의 방향성과 코드 품질은 양호합니다. 특히 `StudentInfoForStart` 인터페이스 분리와 LockedField/EditableField 패턴은 실용적인 설계이며, QR/게스트 플로우에서 최초 호출에만 학생 정보를 포함하는 전략도 합리적입니다.

다만 두 가지 High 이슈가 확인되어 수정을 권장합니다:

1. **`resetExam` 호출 시 `studentInfo` 누락**: 재시작(reset) 시 학생 정보가 백엔드에 전달되지 않아 데이터 정합성 문제가 발생할 수 있습니다. `resetExam` 함수에 `studentInfo` 파라미터를 추가하거나, `resetExam` 호출 후 `fetchQuestions`로 재조회하는 방식을 검토하세요.

2. **`renderTextWithBold`의 XSS 위험**: `dangerouslySetInnerHTML` 사용 시 HTML 이스케이프 처리가 누락되어 잠재적 XSS 취약점이 있습니다. 현재는 하드코딩된 데이터만 사용하므로 실제 위험은 없지만, 향후 외부 데이터 유입 시 보안 문제로 발전할 수 있으므로 조치를 권장합니다.

이 두 이슈를 해소한 후 승인하시는 것을 권장합니다.