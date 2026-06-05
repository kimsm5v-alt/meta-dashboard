> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - b8a6b9f7

## 코드 복잡도 분석

**분석된 파일**: 6개 / 변경된 파일: 6개


### 정상 범위 (NONE)


**`dashboardservice.ts`** (other)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.011

- 청크 수: 50개


**권장사항:**

- 파일 크기가 큼 (50개 청크) - 파일 분리 검토


**`useapidata.ts`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.010

- 청크 수: 38개


**권장사항:**

- 파일 크기가 큼 (38개 청크) - 파일 분리 검토


**`studentdashboardpage.tsx`** (component)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.008

- 청크 수: 43개


**권장사항:**

- 파일 크기가 큼 (43개 청크) - 파일 분리 검토


**`classdashboardwidget.tsx`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.009

- 청크 수: 105개


**권장사항:**

- 파일 크기가 큼 (105개 청크) - 파일 분리 검토


**`myresultpage.tsx`** (component)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.007

- 청크 수: 95개


**권장사항:**

- 파일 크기가 큼 (95개 청크) - 파일 분리 검토


**`pdfdownloadservice.ts`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.000

- 청크 수: 2개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 학생/교사 대시보드에서 PDF 다운로드 기능을 통합하고 개선하기 위한 변경입니다. 기존에는 1차/2차 각각 별도의 PDF 다운로드 버튼이 있었고, 에러 발생 시 `alert()`로 사용자 경험을 저해했으며, `fetchStudentFullAnalysis`에서 `answerIdx`를 잘못된 소스(`lpaTopEntry`)에서 가져오는 문제가 있었습니다.

- **목적**: PDF 다운로드 UX 개선 (alert 제거, 로딩/에러 상태 표시), answerIdx 데이터 소스 정정, downloadAllPdf API 호출 방식 변경
- **도메인**: UI / 비즈니스 로직 / API
- **변경 방향**: 사용자 경험 향상 (alert → 인라인 에러 메시지, 로딩 스피너), 데이터 정확성 개선 (answerIdx 출처 변경), API 호출 일관성 확보

---

## [GOOD] 잘된 점

1. **alert() 제거 및 인라인 에러 처리**: 기존 `console.error` + `alert()` 패턴을 `pdfError` 상태와 인라인 에러 메시지("다운로드 실패")로 대체하여 사용자 경험을 크게 개선했습니다. 4초 후 자동 소멸되는 타이머도 적절합니다.

2. **로딩 상태 시각화**: `SpinningLoader` 컴포넌트를 추가하여 다운로드 중임을 직관적으로 표시하고, 버튼을 `disabled` 처리하여 중복 요청을 방지했습니다.

3. **answerIdx 데이터 소스 수정**: `lpaTopEntry?.answerIdx`에서 `recEntry?.answerIdx`로 변경하여 올바른 데이터를 참조하도록 수정한 점이 정확합니다. `lpaTopEntry`는 LPA 유형 정보만 담고 있고, 실제 답변 인덱스는 `recommendationByOrd`의 `GraphRecommendation` 객체에 포함되어 있으므로 이 수정이 타당합니다.

4. **일관된 에러 처리 패턴**: `MyResultPage`, `StudentDashboardPage`, `ClassDashboardWidget` 세 곳 모두 동일한 패턴(`pdfError`/`downloadError` 상태 + 4초 타이머)으로 에러를 처리하여 일관성을 유지했습니다.

---

## 변경사항 요약

- `fetchStudentFullAnalysis` 호출에 `graphYn='Y'` 파라미터 추가 및 `answerIdx` 출처 변경
- `MyResultPage`에 PDF 다운로드 버튼 및 로딩/에러 UI 추가
- `StudentDashboardPage`에서 PDF 버튼을 헤더 영역으로 이동, 1차/2차 통합 버튼으로 변경
- `ClassDashboardWidget`에 `downloadAllPdf` 호출 에러 처리 추가
- `pdfDownloadService.ts`에서 `downloadAllPdf`를 POST→GET으로 변경, JWT 토큰을 URL 파라미터로 전달

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `downloadAllPdf`에서 JWT 토큰을 URL 쿼리 파라미터로 노출**

- **위치**: `frontend/src/shared/services/pdfDownloadService.ts`, 라인 14-18
- **기존 코드**:
```typescript
const jwtToken = getAuth().getAccessToken() ?? '';
const response = await axiosInstance.get('/api/dgnss/dgnss-download-all', {
  params: { dgnssId, type, jwtToken },
  responseType: 'blob',
  validateStatus: () => true,
});
```
- **문제점**: JWT 토큰이 URL 쿼리 파라미터(`?dgnssId=...&type=...&jwtToken=...`)로 노출됩니다. GET 요청이므로 서버 로그, 브라우저 히스토리, Referer 헤더 등을 통해 토큰이 유출될 가능성이 있습니다. 기존 POST 방식이 보안 측면에서 더 안전했습니다.
- **해결 방안**: POST 방식으로 복원하고 Authorization 헤더를 통해 토큰을 전달하는 방식으로 변경해야 합니다.
```typescript
const jwtToken = getAuth().getAccessToken() ?? '';
const response = await axiosInstance.post(
  '/api/dgnss/dgnss-download-all',
  { dgnssId, type },
  {
    headers: { Authorization: `Bearer ${jwtToken}` },
    responseType: 'blob',
    validateStatus: () => true,
  },
);
```
- **참고**: `downloadStudentPdf`는 POST + body 방식으로 토큰을 전달하지 않는데, 이는 쿠키 기반 인증을 사용하거나 서버에서 별도 인증을 처리하는 것으로 보입니다. `downloadAllPdf`만 GET+쿼리파라미터 방식으로 변경된 것은 일관성이 없습니다.

**2. `downloadAllPdf` 호출 시 `round` 파라미터 누락**

- **위치**: `frontend/src/widgets/class-dashboard/ClassDashboardWidget.tsx`, 라인 631
- **기존 코드**:
```typescript
const handleDownloadAll = async (round: 1 | 2) => {
  const dgnssId = round === 1 ? dgnssIds.round1 : dgnssIds.round2;
  if (!dgnssId) return;
  setDownloadError(false);
  try {
    await downloadAllPdf(dgnssId);  // 두 번째 인자 round 누락
  } catch {
    setDownloadError(true);
  }
};
```
- **문제점**: `downloadAllPdf` 함수의 두 번째 파라미터 `type`이 생략되어 기본값 `1`(상세 보고서)로 고정됩니다. 기존 코드(`downloadAllPdf(dgnssId, round)`)에서는 `round` 값을 전달했으나, 이제 항상 `type=1`로만 호출됩니다. 1차/2차 버튼이 각각 존재하지만, 두 버튼 모두 동일한 type(1)으로 ZIP을 생성하게 되어 의도한 동작이 아닐 수 있습니다.
- **해결 방안**: `round` 값을 `type` 파라미터로 전달해야 합니다.
```typescript
await downloadAllPdf(dgnssId, round);
```

### Medium (개선 권장)

**1. `pdfError` 4초 타이머 패턴의 중복**

`MyResultPage.tsx`, `StudentDashboardPage.tsx`, `ClassDashboardWidget.tsx` 세 곳에서 동일한 `useEffect` + `setTimeout` 패턴이 중복됩니다.
```typescript
useEffect(() => {
  if (!pdfError) return;
  const id = setTimeout(() => setPdfError(false), 4000);
  return () => clearTimeout(id);
}, [pdfError]);
```
커스텀 훅(`useAutoResetState` 등)으로 추출하여 재사용성을 높일 수 있습니다.

**2. `MyResultPage`의 IIFE 패턴**

`MyResultPage.tsx` 라인 598-635에서 JSX 내부에 IIFE(즉시 실행 함수)로 PDF 다운로드 로직을 포함시킨 것은 가독성을 떨어뜨립니다. 컴포넌트 외부로 분리하거나, 별도의 `renderPdfDownloadButton()` 함수로 추출하는 것이 좋습니다.

**3. `StudentDashboardPage`에서 변수 중복 계산**

`handleDownloadPdf` 함수 내부와 외부(`pdfRound`, `pdfDgnssId`, `pdfAssessment`)에서 동일한 로직(`viewMode === 'round2' ? 2 : 1`)이 두 번 등장합니다. `handleDownloadPdf`가 외부 변수를 참조하도록 통일하거나, 하나의 계산으로 통합할 수 있습니다.

---

## 주요 파일 분석

### `frontend/src/shared/services/pdfDownloadService.ts`

**변경 내용:** `downloadAllPdf`를 POST에서 GET으로 변경하고 JWT 토큰을 URL 파라미터로 전달

**개선 제안:**
1. **JWT 토큰 URL 노출 (High 이슈)** - 라인 14-18
   - POST 방식으로 변경하고 Authorization 헤더 사용
   - `downloadStudentPdf`와의 일관성 유지

### `frontend/src/widgets/class-dashboard/ClassDashboardWidget.tsx`

**변경 내용:** `downloadAllPdf` 호출 시 에러 처리 추가

**개선 제안:**
1. **`round` 파라미터 누락 (High 이슈)** - 라인 631
   - `await downloadAllPdf(dgnssId, round);`로 수정

### `frontend/src/shared/services/dashboardService.ts`

**변경 내용:** `answerIdx` 출처를 `lpaTopEntry`에서 `recEntry`로 변경

**개선 제안:**
- 특별한 이슈 없음. 데이터 정확성 측면에서 올바른 수정입니다.

### `frontend/src/features/student-exam/ui/MyResultPage.tsx`

**변경 내용:** PDF 다운로드 버튼 및 로딩/에러 UI 추가, `dgnssIds` 상태 관리 추가

**개선 제안:**
- IIFE 패턴을 별도 함수로 분리하여 가독성 개선 (Medium)

### `frontend/src/pages/student-dashboard/StudentDashboardPage.tsx`

**변경 내용:** PDF 버튼을 헤더 영역으로 이동, 1차/2차 통합 버튼으로 변경, alert → 인라인 에러 처리

**개선 제안:**
- `pdfRound`/`pdfDgnssId`/`pdfAssessment` 변수 중복 계산 통합 (Medium)

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)**
- [ ] [WARN] **조건부 승인 (Approved with Comments)**
- [X] [FIX] **수정 필요 (Changes Requested)** - High 이슈 2건 존재

**종합 의견:**

전반적으로 PDF 다운로드 UX 개선과 데이터 정확성 향상이라는 목표를 잘 달성하고 있습니다. `alert()` 제거, 로딩 스피너 추가, 인라인 에러 메시지 도입 등 사용자 경험 측면에서 의미 있는 개선이 이루어졌습니다. `answerIdx` 데이터 소스 수정도 정확한 판단입니다.

다만, 배포 전에 반드시 수정되어야 할 두 가지 High 이슈가 있습니다:

1. **JWT 토큰 URL 노출**: `downloadAllPdf`에서 JWT 토큰을 GET 요청의 URL 쿼리 파라미터로 전달하는 것은 보안 취약점입니다. POST 방식 + Authorization 헤더로 변경해야 합니다.

2. **`round` 파라미터 누락**: `ClassDashboardWidget`에서 `downloadAllPdf(dgnssId)` 호출 시 두 번째 인자 `round`가 누락되어 항상 `type=1`로만 동작합니다. `downloadAllPdf(dgnssId, round)`로 수정해야 합니다.

이 두 가지만 해결되면 승인 가능한 수준의 품질입니다.