> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - e435ed10

## 코드 복잡도 분석

**분석된 파일**: 6개 / 변경된 파일: 6개


### 정상 범위 (NONE)


**`pdfdownloadservice.ts`** (other)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.009

- 청크 수: 14개


**권장사항:**

- 복잡도 정상 범위


**`studentdashboardpage.tsx`** (component)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.008

- 청크 수: 52개


**권장사항:**

- 파일 크기가 큼 (52개 청크) - 파일 분리 검토


**`classdashboardwidget.tsx`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.009

- 청크 수: 126개


**권장사항:**

- 파일 크기가 큼 (126개 청크) - 파일 분리 검토


**`generalsection.tsx`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.000

- 청크 수: 45개


**권장사항:**

- 파일 크기가 큼 (45개 청크) - 파일 분리 검토


**`myresultpage.tsx`** (component)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.008

- 청크 수: 94개


**권장사항:**

- 파일 크기가 큼 (94개 청크) - 파일 분리 검토


**`svgicons.ts`** (other)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.000

- 청크 수: 1개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 PDF 보고서 다운로드 기능을 전면 개편합니다. 기존에는 프론트엔드에서 Blob 응답을 직접 처리하여 파일을 다운로드했으나, 이제는 서버에서 파일 URL을 응답으로 받아 게이트웨이를 통해 Blob을 스트리밍하는 방식으로 변경되었습니다. 또한 교사용 설명서 링크 버튼 추가, 학생 대시보드에서 PDF 다운로드 버튼을 상세/요약으로 분리, answerIdx 조회 방식을 `fetchPdfAnswerMap` API 호출로 변경하는 등 UI/UX 개선이 포함되어 있습니다.

- **목적**: PDF 다운로드 아키텍처 변경 (Blob 직접 처리 -> URL 기반 게이트웨이 스트리밍) 및 UI 개선
- **도메인**: API 통신 레이어 + UI (프론트엔드)
- **변경 방향**: 서버 응답 형식 변경에 대응하고, 사용자에게 상세/요약 보고서를 구분하여 제공하며, answerIdx를 별도 API로 조회하도록 개선

---

## [GOOD] 잘된 점

### 1. PDF 아이콘 중앙화 (Single Source of Truth)

`frontend/src/shared/assets/svgIcons.ts` 파일을 새로 생성하여 `PDF_ICON_SVG_URL` 상수로 관리함으로써, 여러 컴포넌트에 하드코딩되어 있던 SVG 데이터 URL을 단일 진실 공급원으로 통합했습니다.

**변경 전**: `ClassDashboardWidget.tsx`와 `TeacherReportButton` 스타일드 컴포넌트에 각각 인라인 SVG URL이 하드코딩되어 있었습니다.

**변경 후**: 모든 컴포넌트가 `@shared/assets/svgIcons`에서 `PDF_ICON_SVG_URL`을 임포트하여 사용합니다.

```typescript
// svgIcons.ts
export const PDF_ICON_SVG_URL = `url("data:image/svg+xml,%3Csvg ...")`;

// 사용처
import { PDF_ICON_SVG_URL } from '@shared/assets/svgIcons';

const ManualBtn = styled.a`
  &::before {
    content: '';
    background-image: ${PDF_ICON_SVG_URL};
    ...
  }
`;
```

이는 유지보수성과 일관성 측면에서 좋은 개선입니다. 아이콘 변경이 필요할 때 단일 파일만 수정하면 됩니다.

### 2. `fetchPdfAnswerMap` 도입으로 데이터 의존성 분리

기존에는 `student.assessments` 배열에서 `answerIdx`를 찾는 방식이었으나, 별도 API(`/api/dgnss/pdf/search`)로 answerIdx 맵을 조회하도록 변경했습니다.

```typescript
// pdfDownloadService.ts
export async function fetchPdfAnswerMap(
  dgnssId: number,
  teacherUserId: string,
): Promise<Map<string, number>> {
  const response = await axiosInstance.get<{
    resultData: { data: Array<{ userId: string; answerIdx: number }> };
  }>('/api/dgnss/pdf/search', {
    params: { dgnssId, userId: teacherUserId, userType: 'T' },
  });
  const map = new Map<string, number>();
  for (const item of response.data.resultData?.data ?? []) {
    map.set(item.userId, item.answerIdx);
  }
  return map;
}
```

이를 통해 `StudentDashboardPage`와 `ClassDashboardWidget`에서 더 이상 `student.assessments` 배열에 의존하지 않고, 서버에서 직접 answerIdx를 조회할 수 있게 되었습니다. 이는 서버 데이터 구조 변경에 유연하게 대응할 수 있게 합니다.

### 3. 조건부 렌더링 개선

`MyResultPage`에서 2차 결과가 없을 때 PDF 버튼을 아예 렌더링하지 않도록 변경했습니다.

```typescript
// 변경 전: 비활성화된 버튼이 항상 표시됨
<PDFButton disabled={...}>2차 PDF</PDFButton>

// 변경 후: 2차 결과가 있을 때만 버튼 표시
{r2 && (
  <PDFButton ...>2차 결과 다운로드</PDFButton>
)}
```

`ClassDashboardWidget`에서도 2차 결과가 없을 때 대시(-)를 표시하는 `DashPlaceholder`를 도입하여, 비활성화된 아이콘 버튼이 아닌 깔끔한 UI를 제공합니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

**없음**

### High (우선 수정 권장)

#### 1. JWT 토큰이 URL 쿼리 파라미터로 노출됨

**파일**: `frontend/src/shared/services/pdfDownloadService.ts`
**위치**: 28-29번째 줄

```typescript
async function openBlobFromUrl(fileUrl: string): Promise<void> {
  const jwtToken = getAuth().getAccessToken() ?? '';
  const downloadUrl = `${ENV.API_URL}/files/pfile-download?url=${fileUrl}&jwtToken=${jwtToken}&pionadaYn=Y`;
  // ...
}
```

**문제점**: JWT 토큰이 URL 쿼리 파라미터로 노출됩니다. 이 URL은 `console.log`로도 출력되고 있으며, 브라우저 히스토리, 서버 로그, Referer 헤더 등을 통해 토큰이 유출될 가능성이 있습니다. 보안 모범 사례에 따르면 Bearer 토큰은 Authorization 헤더를 통해서만 전달되어야 합니다.

**해결 방안**: 서버 측에서 JWT 토큰을 Authorization 헤더나 쿠키로만 처리하도록 변경하는 것이 가장 바람직합니다. 현재 아키텍처에서 불가피하다면 최소한 다음 조치가 필요합니다:
- `console.log`에서 URL 출력 제거
- `fileUrl`에 `encodeURIComponent` 적용
- 게이트웨이에서 쿠키 기반 인증으로 전환 검토

#### 2. `handleDownloadTeacherReport`와 `handleDownloadAll`의 일관성 부족

**파일**: `frontend/src/widgets/class-dashboard/ClassDashboardWidget.tsx`
**위치**: 730-746번째 줄 (handleDownloadTeacherReport), 850-864번째 줄 (handleDownloadAll 호출부)

`handleDownloadTeacherReport`는 `downloadAllPdf` 대신 `downloadTeacherReportPdf`를 호출하도록 변경되었습니다. 반면 `handleDownloadAll`은 여전히 `downloadAllPdf`를 호출하고 있습니다.

```typescript
// handleDownloadTeacherReport (변경됨)
const handleDownloadTeacherReport = async (round: 1 | 2) => {
  // ...
  await downloadTeacherReportPdf({ ... });  // POST /api/dgnss/pdf
};

// handleDownloadAll (변경 없음)
// 여전히 downloadAllPdf(dgnssId) 호출  // GET /api/dgnss/dgnss-download-all
```

이는 의도된 것일 수 있습니다(전체 다운로드는 ZIP, 교사용 보고서는 개별 PDF). 그러나 함수명과 실제 동작이 불일치하여 혼란을 줄 수 있습니다. `handleDownloadTeacherReport`가 실제로는 교사용 보고서를 다운로드하는 것이 맞다면 함수명은 적절하나, `handleDownloadAll`이 여전히 `downloadAllPdf`를 호출하는 것은 검토가 필요합니다.

### Medium (개선 권장)

#### 1. `GeneralSection.tsx`의 빈 URL 처리

**파일**: `frontend/src/features/assessment/ui/GeneralSection.tsx`
**위치**: 10-11번째 줄

```typescript
// TODO: URL 확정 후 채워넣기
const MANUAL_URL_COMPREHENSIVE = '';
const MANUAL_URL_SELF_REGULATED = '';
```

**문제점**: URL이 빈 문자열이면 `href=""`가 되어 현재 페이지로 이동하게 됩니다. `target='_blank'`와 함께 사용되면 빈 탭이 열리는 문제가 있습니다.

**해결 방안**: URL이 확정될 때까지 버튼 자체를 조건부 렌더링에서 제외하는 것이 좋습니다.

```typescript
{MANUAL_URL_COMPREHENSIVE && (
  <ManualBtn href={MANUAL_URL_COMPREHENSIVE} target='_blank' rel='noopener noreferrer'>
    학습종합검사 교사용 설명서
  </ManualBtn>
)}
```

#### 2. 운영 환경에 남아있는 `console.log`

**파일**: `frontend/src/shared/services/pdfDownloadService.ts`
**위치**: 72번째 줄, 86번째 줄

```typescript
console.log('[PDF] teacher report url:', fileUrl, response.data);
console.log('[PDF] student pdf url:', fileUrl, response.data);
```

**문제점**: 디버깅용 `console.log`가 운영 코드에 남아 있습니다. 특히 `response.data` 전체를 출력하는 것은 불필요한 정보 노출이며, 보안에 민감한 정보가 포함될 수 있습니다.

**해결 방안**: 개발 환경에서만 출력되도록 조건을 추가하거나, 배포 전에 제거해야 합니다.

#### 3. `PdfDownloadRequest` 인터페이스의 `answerIdx` optional 처리

**파일**: `frontend/src/shared/services/pdfDownloadService.ts`
**위치**: 20번째 줄

```typescript
interface PdfDownloadRequest {
  userId: string;
  userType: 'S' | 'T';
  dgnssId: number;
  answerIdx?: number;  // optional
  ordNo: number;
  type?: 1 | 2;
}
```

**문제점**: `answerIdx`가 optional이 되면서, 호출부에서 이 값이 누락되어도 컴파일 타임에 잡히지 않습니다. `downloadTeacherReportPdf` 호출 시 `answerIdx`를 전달하지 않는데, 이는 교사용 보고서의 경우 `answerIdx`가 필요 없기 때문으로 보입니다. 그러나 타입 시스템이 이를 강제하지 않아 실수로 누락될 가능성이 있습니다.

**해결 방안**: `PdfDownloadRequest`를 `StudentPdfDownloadRequest`(answerIdx 필수)와 `TeacherPdfDownloadRequest`(answerIdx 불필요)로 분리하거나, 유니온 타입을 사용하는 것이 더 안전합니다.

---

## 주요 파일 분석

### `frontend/src/shared/services/pdfDownloadService.ts`

**변경 내용**: PDF 다운로드 방식을 Blob 직접 처리에서 URL 기반 게이트웨이 스트리밍 방식으로 전면 개편하고, `fetchPdfAnswerMap` 함수를 추가했습니다.

**핵심 로직 흐름**:
1. `downloadStudentPdf` / `downloadTeacherReportPdf`가 POST `/api/dgnss/pdf`를 호출
2. 서버 응답에서 `extractFileUrl` 함수로 파일 URL 추출
3. `openBlobFromUrl` 함수가 게이트웨이 URL(`{API_URL}/files/pfile-download`)을 통해 Blob 스트리밍
4. Blob URL 생성 후 `a.click()`으로 다운로드 트리거

**개선 제안 요약**:
- JWT 토큰 URL 노출 문제 (High) - Authorization 헤더 방식으로 변경 권장
- `console.log` 제거 (Medium)
- `PdfDownloadRequest` 타입 분리 (Medium)

### `frontend/src/features/assessment/ui/GeneralSection.tsx`

**변경 내용**: 교사용 설명서 링크 버튼 2개를 추가했습니다.

**개선 제안 요약**:
- 빈 URL 조건부 렌더링 처리 (Medium)

### `frontend/src/widgets/class-dashboard/ClassDashboardWidget.tsx`

**변경 내용**: PDF 다운로드 UI를 테이블 헤더에 상세/요약 서브헤더를 추가하여 확장하고, answerIdx 조회 방식을 `fetchPdfAnswerMap`으로 변경했습니다.

**핵심 변경 사항**:
- 테이블 헤더에 `PdfAreaHeader`(colSpan=2)와 `PdfSubHeaderRow`(상세/요약) 추가
- 각 학생 행에 `PdfTableCell` 4개(1차 상세, 1차 요약, 2차 상세, 2차 요약) 추가
- `handleDownloadTeacherReport`가 `downloadTeacherReportPdf`를 호출하도록 변경
- `handleDownloadAll`은 여전히 `downloadAllPdf` 호출 (일관성 검토 필요)

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견**:

전반적으로 PDF 다운로드 아키텍처 개선과 UI 개편이 잘 이루어졌습니다. 특히 SVG 아이콘 중앙화와 `fetchPdfAnswerMap` 도입은 좋은 방향입니다. 다만 JWT 토큰이 URL 쿼리 파라미터로 노출되는 보안 이슈(High)와 운영 환경에 남아있는 `console.log`(Medium)는 배포 전에 반드시 수정되어야 합니다. 또한 빈 URL로 인한 사용자 경험 저하(Medium)도 함께 개선을 권장합니다.

위 High 이슈가 해결되면 승인 가능합니다. 특히 JWT 토큰 노출 문제는 보안 관점에서 반드시 선행되어야 할 수정 사항입니다.