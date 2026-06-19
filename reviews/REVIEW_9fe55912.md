> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 9fe55912

## 코드 복잡도 분석

**분석된 파일**: 2개 / 변경된 파일: 2개


### 정상 범위 (NONE)


**`pdfdownloadservice.ts`** (other)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.009

- 청크 수: 15개


**권장사항:**

- 복잡도 정상 범위


**`classdashboardwidget.tsx`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.009

- 청크 수: 137개


**권장사항:**

- 파일 크기가 큼 (137개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 학급 전체 PDF 일괄 다운로드 기능을 개선하기 위한 것입니다. 기존에는 단일 API 호출(`dgnss-download-all`)로 ZIP 파일을 바로 다운로드했으나, PDF가 미리 생성되지 않은 학생이 있을 경우 빈 파일이 포함될 수 있었습니다. 이를 해결하기 위해 **3단계 프로세스**로 변경했습니다: (1) 미생성 학생 조회, (2) 학생별 PDF 생성 요청, (3) ZIP 일괄 다운로드. 또한 진행 상황을 시각적으로 표시하는 오버레이 UI를 추가했습니다.

- **목적**: 학급 전체 PDF 일괄 다운로드 시 PDF 미생성 학생에 대한 사전 생성 처리 및 진행률 피드백 제공
- **도메인**: 비즈니스 로직 (PDF 생성/다운로드) + UI (진행률 오버레이)
- **변경 방향**: 단일 API 호출 방식에서 다단계 사전 생성 프로세스 도입, 사용자 피드백 강화

## [GOOD] 잘된 점

1. **진행률 오버레이 UX 설계가 적절함**: `PdfProgressOverlay`가 `position: fixed; inset: 0; z-index: 1000`으로 전체 화면을 덮어 PDF 생성 중 사용자의 추가 조작을 차단합니다. `finally` 블록에서 항상 `null`로 초기화되어 정상/오류 케이스 모두 모달이 안전하게 종료됩니다.

2. **`validateStatus: () => true`로 에러 내성 처리**: Step 2의 학생별 PDF 생성 POST 요청에서 모든 HTTP 상태 코드를 허용하여, 특정 학생의 PDF 생성이 실패해도 전체 프로세스가 중단되지 않도록 한 점이 실무적으로 적절합니다.

3. **`console.log` 제거**: 기존 `downloadTeacherReportPdf`와 `downloadStudentPdf`에 남아있던 디버깅용 `console.log`를 제거하여 프로덕션 코드를 깔끔하게 유지했습니다.

## 변경사항 요약

- `pdfDownloadService.ts`: `downloadAllPdf` 함수를 3단계(미생성 조회 -> 생성 요청 -> ZIP 다운로드)로 재설계하고, `teacherUserId`, `ordNo`, `onProgress` 파라미터 추가
- `ClassDashboardWidget.tsx`: `allPdfProgress` 상태와 진행률 오버레이 UI 컴포넌트 추가, `handleDownloadAll`에서 진행률 콜백 전달

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `jwtToken`을 URL 쿼리 파라미터로 전달하는 방식 (보안)**

- **파일**: `frontend/src/shared/services/pdfDownloadService.ts`
- **위치 (라인 번호)**: 112-115
- **기존 코드**:
```typescript
  const jwtToken = getAuth().getAccessToken() ?? '';
  const response = await axiosInstance.get('/api/dgnss/dgnss-download-all', {
    params: { dgnssId, type, jwtToken },
    responseType: 'blob',
  });
```
- **문제점**: JWT 토큰이 URL 쿼리 파라미터로 전달됩니다. 이는 (a) 서버 로그에 토큰이 평문으로 기록될 수 있고, (b) 브라우저 히스토리에 노출되며, (c) Referer 헤더를 통해 타사로 유출될 가능성이 있습니다. `axiosInstance`가 이미 인터셉터 등을 통해 Authorization 헤더를 설정하고 있을 가능성이 높으므로, `jwtToken` 파라미터를 제거하고 헤더 기반 인증으로 통일하는 것이 바람직합니다.
- **해결 방안 (수정 코드)**:
```typescript
  const response = await axiosInstance.get('/api/dgnss/dgnss-download-all', {
    params: { dgnssId, type },
    responseType: 'blob',
  });
```
  > **참고**: 만약 서버 측에서 해당 엔드포인트가 쿼리 파라미터 방식의 토큰만 지원한다면, 서버와 협의하여 Authorization 헤더 기반으로 변경한 후 프론트엔드 코드를 수정해야 합니다. 현재 `axiosInstance`의 인터셉터 설정을 먼저 확인하세요.

**2. `students` 배열이 비어있을 때 불필요한 ZIP 다운로드 요청 발생**

- **파일**: `frontend/src/shared/services/pdfDownloadService.ts`
- **위치 (라인 번호)**: 109-117
- **기존 코드**:
```typescript
  const students = searchRes.data.resultData?.data ?? [];

  // Step 2: 학생별 PDF 생성 요청 (URL 무시, 생성만)
  for (let i = 0; i < students.length; i++) {
    ...
  }

  // Step 3: 전체 ZIP 다운로드
  const jwtToken = getAuth().getAccessToken() ?? '';
  const response = await axiosInstance.get('/api/dgnss/dgnss-download-all', ...);
```
- **문제점**: `pdf/search` API가 빈 배열을 반환했는데도(모든 학생의 PDF가 이미 생성된 상태) Step 3의 ZIP 다운로드를 무조건 수행합니다. 이는 불필요한 네트워크 요청입니다. `students.length === 0`인 경우 ZIP 다운로드 API 호출을 생략하거나, 사용자에게 "모든 PDF가 이미 생성되었습니다"라는 메시지를 표시하는 것이 좋습니다.
- **해결 방안 (수정 코드)**:
```typescript
  const students = searchRes.data.resultData?.data ?? [];

  if (students.length === 0) {
    // 모든 PDF가 이미 생성된 상태 → 바로 ZIP 다운로드
    const jwtToken = getAuth().getAccessToken() ?? '';
    const response = await axiosInstance.get('/api/dgnss/dgnss-download-all', {
      params: { dgnssId, type, jwtToken },
      responseType: 'blob',
    });
    downloadBlob(response.data as Blob, `학습심리정서검사_${dgnssId}.zip`);
    return;
  }

  // Step 2: 학생별 PDF 생성 요청
  for (let i = 0; i < students.length; i++) {
    ...
  }

  // Step 3: 전체 ZIP 다운로드
  ...
```
  > 또는 `students.length === 0`일 때 `onProgress?.(0, 0)`을 호출하여 진행률을 0/0으로 표시하고 early return하는 방식도 가능합니다.

### Medium (개선 권장)

**1. `fetchPdfAnswerMap`과 `downloadAllPdf`의 중복 API 호출**

- **파일**: `frontend/src/widgets/class-dashboard/ClassDashboardWidget.tsx` + `frontend/src/shared/services/pdfDownloadService.ts`
- **위치**: `ClassDashboardWidget.tsx` 551-556번 라인 (`useEffect`의 `fetchPdfAnswerMap` 호출) + `pdfDownloadService.ts` 93-97번 라인 (`downloadAllPdf`의 Step 1)
- **문제점**: `useEffect`에서 이미 `fetchPdfAnswerMap`을 통해 `/api/dgnss/pdf/search`를 호출하여 `answerIdx` 맵을 구성해 놓습니다. 그런데 `downloadAllPdf`가 호출되면 Step 1에서 동일한 엔드포인트를 다시 호출합니다. `pdfAnswerMap` 상태에 이미 필요한 데이터가 있으므로, `downloadAllPdf`가 `pdfAnswerMap`을 파라미터로 받아 Step 1을 생략하도록 리팩토링하면 불필요한 네트워크 요청을 줄일 수 있습니다.
- **해결 방안**: `downloadAllPdf` 함수 시그니처에 `students?: Array<{ userId: string; userType: 'S' | 'T'; answerIdx: number }>` 선택적 파라미터를 추가하고, 전달되면 Step 1을 건너뛰도록 합니다.

**2. `PdfProgressOverlay`에 취소(닫기) 기능 부재**

- **파일**: `frontend/src/widgets/class-dashboard/ClassDashboardWidget.tsx`
- **위치**: 826-842번 라인
- **문제점**: PDF 생성 과정이 오래 걸릴 경우 사용자가 강제로 취소할 수 있는 방법이 없습니다. `PdfProgressOverlay`가 `z-index: 1000`으로 전체 화면을 덮고 있어 뒤로 가기 버튼 등 모든 조작이 차단됩니다. 사용자가 실수로 다운로드를 시작했거나 네트워크가 느린 경우 페이지를 강제로 새로고침해야 합니다.
- **해결 방안**: `AbortController`를 도입하여 진행률 오버레이에 "취소" 버튼을 추가하고, 클릭 시 진행 중인 모든 API 요청을 중단(abort)하도록 구현하는 것을 고려하세요.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견**: 전반적으로 기능 개선 방향과 코드 품질이 양호합니다. 다만 **JWT 토큰을 URL 쿼리 파라미터로 전달하는 방식**은 보안 측면에서 반드시 개선이 필요합니다. 또한 `students` 배열이 비어있을 때 불필요한 ZIP 다운로드 API 호출이 발생하는 점도 함께 수정하는 것을 권장합니다. 위 두 가지 High 이슈만 해결되면 바로 승인 가능한 수준입니다.