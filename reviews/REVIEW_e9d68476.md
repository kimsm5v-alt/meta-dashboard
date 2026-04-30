> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - e9d68476

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 7개


### 정상 범위 (NONE)


**`index.ts`** (other)

- 평균 복잡도: **0.462**

- 최대 복잡도: 0.462

- 청크 수: 1개

- 평균 사용처: 49.0곳


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 학생 개인 및 학급 단위의 진단 결과 PDF 다운로드 기능을 초기 구현한 것입니다. 기존에는 웹 UI에서만 결과를 확인할 수 있었으나, 이번 변경으로 교사가 학생별 개별 PDF와 학급 전체 ZIP 파일을 다운로드할 수 있게 되었습니다.

- **목적**: 학생 진단 결과 PDF 다운로드 기능 구현 (개별 + 학급 일괄)
- **도메인**: API (PDF 다운로드 서비스), UI (다운로드 버튼), 비즈니스 로직 (dgnssIds 전파)
- **변경 방향**: 기존 `useStudentAnalysis` / `useClassStudents` 훅에 `dgnssIds` 필드를 추가하여 PDF 다운로드에 필요한 진단 ID를 하위 컴포넌트로 전달

## [GOOD] 잘된 점

1. **PDF 다운로드 서비스의 이중 응답 처리**: `downloadStudentPdf`에서 `content-type`에 따라 blob 다운로드와 URL 리다이렉트를 분기 처리한 점이 현실적인 API 대응 전략입니다. `validateStatus: () => true`로 HTTP 에러도 직접 처리하는 방식도 실용적입니다.

2. **dgnssIds 전파 구조**: `useStudentAnalysis`와 `useClassStudents` 훅에서 `dgnssIds`를 일관된 인터페이스로 반환하고, Mock 모드에서는 빈 객체를 반환하여 하위 호환성을 유지한 점이 좋습니다. 특히 `fetchTeacherExams`에서 `ordNo === 1`과 `ordNo === 2`를 각각 찾아 `round1`/`round2`로 매핑한 구조가 명확합니다.

3. **UI 상태 관리**: `isPdfDownloading` 상태로 다운로드 중 중복 클릭을 방지하고, `disabled` 조건에 `dgnssIds`와 `answerIdx`를 모두 체크하여 버튼을 비활성화한 점이 사용자 경험을 고려한 설계입니다.

## 변경사항 요약

PDF 다운로드 서비스(`pdfDownloadService.ts`) 신규 생성, `useStudentAnalysis`/`useClassStudents` 훅에 `dgnssIds` 필드 추가, 학생 대시보드와 학급 대시보드에 PDF 다운로드 버튼 UI 추가, `Assessment` 타입에 `answerIdx` 필드 추가.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `downloadAllPdf` 함수의 JWT 토큰 URL 노출**

`downloadAllPdf` 함수에서 JWT 토큰을 URL 쿼리 파라미터로 전달하고 있습니다. 이는 브라우저 히스토리, 서버 로그, Referer 헤더 등을 통해 토큰이 노출될 수 있는 보안 취약점입니다.

- **위치**: `frontend/src/shared/services/pdfDownloadService.ts`, 라인 14-16
- **기존 코드**:
```typescript
const url = `/api/dgnss/dgnss-download-all?jwtToken=${encodeURIComponent(jwtToken)}&dgnssId=${dgnssId}&type=${type}`;
window.open(url, '_blank');
```

- **문제 분석**: `window.open`으로 새 창을 열면 URL이 브라우저 주소창에 그대로 노출되고, 브라우저 히스토리에도 남습니다. 또한 서버 측 access log에도 JWT 토큰이 평문으로 기록됩니다. JWT는 탈취 시 계정 전체가 노출될 수 있는 민감한 정보입니다.

- **해결 방안**: `window.open` 대신 `axiosInstance`로 POST 요청을 보내고 blob으로 응답받아 처리하는 방식으로 변경하는 것이 가장 안전합니다. `downloadStudentPdf`와 동일한 패턴을 사용하면 일관성도 유지됩니다. 만약 새 창 열기가 서버 측 요구사항(ZIP 스트리밍 등)이라면, 서버에서 단기 유효(pre-signed) URL을 발급받아 리다이렉트하는 방식으로 개선해야 합니다.

  > **[수정 코드 제시 불가 -- 문맥 파악 불충분]**: `window.open` 방식이 서버 측 요구사항(새 창에서 ZIP 스트리밍)일 가능성이 있어, 서버 API 명세를 확인한 후에만 수정 방향을 결정할 수 있습니다. 백엔드 팀과 협의하여 세션/쿠키 기반 인증으로 전환하거나, POST + blob 방식으로 변경하는 것을 권장합니다.

### Medium (개선 권장)

**1. `downloadStudentPdf`의 에러 처리 부재**

`downloadStudentPdf` 함수에서 `try/catch` 없이 `axiosInstance.post`를 호출하고 있습니다. 네트워크 오류나 서버 500 에러 발생 시 `downloadStudentPdf`를 호출한 `handleDownloadPdf`의 `try` 블록에서 잡히긴 하지만, `finally` 블록에서 `setIsPdfDownloading(false)`만 실행되고 사용자에게 에러 피드백이 없습니다.

- **위치**: `frontend/src/shared/services/pdfDownloadService.ts`, 라인 28-57
- **개선 제안**: `downloadStudentPdf` 내부에서도 에러를 적절히 처리하거나, 최소한 콘솔 에러 로깅을 추가하는 것이 좋습니다. 또한 호출부(`handleDownloadPdf`)에서 `catch` 블록에 사용자 알림(토스트 등)을 추가하는 것을 고려하세요.

**2. `downloadAllPdf`의 `type` 파라미터 기본값 문서화 부족**

`downloadAllPdf`의 `type: 1 | 2 | 3 = 3`에서 `type=3`이 무엇을 의미하는지 주석이나 문서가 없습니다. 매직 넘버보다는 명시적인 enum이나 상수를 사용하는 것이 가독성에 좋습니다.

- **위치**: `frontend/src/shared/services/pdfDownloadService.ts`, 라인 12
- **개선 제안**:
```typescript
const DOWNLOAD_TYPE = { STUDENT: 1, CLASS: 2, ALL: 3 } as const;
// ...
type: 1 | 2 | 3 = DOWNLOAD_TYPE.ALL,
```

---

## 주요 파일 분석

### `frontend/src/shared/services/pdfDownloadService.ts` (신규)

**변경 내용:**
PDF 다운로드를 위한 두 개의 함수(`downloadAllPdf`, `downloadStudentPdf`)를 제공하는 서비스 파일 신규 생성.

**분석:**
- `downloadStudentPdf`는 POST 요청으로 blob을 받아와 `URL.createObjectURL`로 다운로드 링크를 생성하는 표준 패턴을 따릅니다. `content-type`이 `application/pdf`나 `octet-stream`이 아닌 경우 JSON으로 파싱하여 `fileUrl`로 리다이렉트하는 fallback 로직도 포함되어 있어 다양한 API 응답에 대응 가능합니다.
- `downloadAllPdf`는 `window.open`으로 새 창을 열어 ZIP 파일을 다운로드합니다. 이 방식은 브라우저의 팝업 차단에 걸릴 수 있고, JWT 토큰이 URL에 노출되는 보안 문제가 있습니다.

**개선 제안:**
1. `downloadAllPdf`의 JWT 토큰 URL 노출 이슈 (High 항목 참조)
2. `downloadStudentPdf`의 에러 처리 보강 (Medium 항목 참조)

### `frontend/src/features/api/useApiData.ts`

**변경 내용:**
`useStudentAnalysis`와 `useClassStudents` 훅의 반환 타입에 `dgnssIds` 필드 추가. API 모드에서는 `fetchTeacherExams` 결과에서 `dgnssId`를 추출하고, Mock 모드에서는 빈 객체 반환.

**분석:**
- `useStudentAnalysis`에서는 `completedR1`과 `completedR2`를 각각 찾아 `dgnssIds` 객체를 구성합니다. `completedR1`이 없어도 `completedR2`는 별도로 찾으므로, 1차 미완료 상태에서도 2차 `dgnssId`를 가져올 수 있습니다.
- `useClassStudents`에서도 동일한 패턴으로 `classDgnssIds`를 구성합니다. 다만 `completedRound1`이 없으면 early return에서도 `dgnssIds: classDgnssIds`를 반환하므로, 1차 미완료 상태에서도 2차 `dgnssId`가 있다면 전달됩니다.
- Mock 모드에서는 `dgnssIds: {}`를 반환하여 PDF 다운로드 버튼이 비활성화되도록 합니다.

**개선 제안:**
없음. 일관성 있게 구현되었습니다.

### `frontend/src/pages/student-dashboard/StudentDashboardPage.tsx`

**변경 내용:**
`StudentDashboardContent`에 `dgnssIds` prop 추가, PDF 다운로드 버튼 UI 추가, `handleDownloadPdf` 핸들러 구현.

**분석:**
- `handleDownloadPdf`는 `ordNo`에 따라 `dgnssIds.round1` 또는 `dgnssIds.round2`를 선택하고, `student.assessments`에서 해당 회차의 `answerIdx`를 찾아 `downloadStudentPdf`를 호출합니다.
- `disabled` 조건은 `isPdfDownloading || !dgnssIds.round1 || !r1?.answerIdx`로, 다운로드 중이거나 진단 ID가 없거나 답안 인덱스가 없으면 버튼이 비활성화됩니다.
- 2차 PDF 버튼은 `r2`가 존재할 때만 렌더링되므로, 2차 검사가 완료되지 않은 학생에게는 2차 PDF 버튼이 아예 표시되지 않습니다.

**개선 제안:**
1. `handleDownloadPdf`의 `catch` 블록에서 사용자 피드백 부재 (Medium 항목 참조)

### `frontend/src/widgets/class-dashboard/ClassDashboardWidget.tsx`

**변경 내용:**
학급 대시보드 헤더에 1차/2차 전체 PDF 다운로드 버튼 추가, `handleDownloadAll` 핸들러 구현.

**분석:**
- `handleDownloadAll`은 `getAuth().getAccessToken()`으로 JWT 토큰을 가져와 `downloadAllPdf`에 전달합니다.
- `hasJwtToken`이 `true`일 때만 `DownloadButtons` 영역이 렌더링되므로, Mock 모드에서는 버튼이 표시되지 않습니다.
- `disabled` 조건은 `!dgnssIds.round1` / `!dgnssIds.round2`로, 해당 회차의 진단 ID가 없으면 버튼이 비활성화됩니다.

**개선 제안:**
1. `getAuth()` 호출 최적화 (Medium 항목 참조)

### `frontend/src/shared/services/dashboardService.ts`

**변경 내용:**
`LpaTopData` 인터페이스와 `fetchStudentFullAnalysis` 반환 타입에 `answerIdx` 필드 추가, `convertToAssessment`에서 `answerIdx` 전달.

**분석:**
- `fetchStudentFullAnalysis`의 `parseRound` 내부에서 `lpaTopEntry?.answerIdx ?? null`로 `answerIdx`를 추출합니다. `lpaTopMap`에서 해당 회차의 `LpaTopData`를 찾아 `answerIdx`를 가져오는 구조입니다.
- `convertToAssessment`에서 `answerIdx: data?.answerIdx ?? null`로 `Assessment` 객체에 전달합니다. 이 값은 `StudentDashboardPage`의 `handleDownloadPdf`에서 `assessment.answerIdx`로 사용됩니다.

**개선 제안:**
없음. 데이터 흐름이 명확하고 일관성 있게 변경되었습니다.

### `frontend/src/shared/types/index.ts`

**변경 내용:**
`Assessment` 인터페이스에 `answerIdx?: number | null` 필드 추가.

**분석:**
- `answerIdx`는 선택적 필드(`?`)로 선언되어 있어, 기존 코드에서 `Assessment`를 사용하는 모든 곳에 영향을 주지 않습니다.
- `number | null` 타입으로, 값이 없을 때 `null`을 명시적으로 표현할 수 있습니다.

**개선 제안:**
없음. 타입 정의가 명확합니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [x] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

전반적으로 PDF 다운로드 기능이 체계적으로 구현되었습니다. `dgnssIds`를 훅 레벨에서 관리하여 하위 컴포넌트로 전달하는 구조와 blob/URL 이중 응답 처리 전략이 인상적입니다. `useStudentAnalysis`와 `useClassStudents` 두 훅에서 동일한 패턴으로 `dgnssIds`를 추출하고 전달하는 일관성도 좋습니다.

다만 `downloadAllPdf`에서 JWT 토큰을 URL 쿼리 파라미터로 노출하는 보안 이슈(High)는 배포 전에 반드시 검토가 필요합니다. 서버 측에서 세션 기반 인증을 지원한다면 해당 파라미터를 제거하고, 그렇지 않다면 `downloadStudentPdf`와 동일한 POST + blob 방식으로 통일하는 것을 권장합니다.

이 한 가지 이슈만 해결되면 바로 승인 가능한 수준의 코드입니다. 수고하셨습니다.