> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - cdfb89f4

## 코드 복잡도 분석

**분석된 파일**: 4개 / 변경된 파일: 4개


### 정상 범위 (NONE)


**`pdfdownloadservice.ts`** (other)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.004

- 청크 수: 8개


**권장사항:**

- 복잡도 정상 범위


**`studentdashboardpage.tsx`** (component)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.008

- 청크 수: 43개


**권장사항:**

- 파일 크기가 큼 (43개 청크) - 파일 분리 검토


**`classdashboardwidget.tsx`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.009

- 청크 수: 116개


**권장사항:**

- 파일 크기가 큼 (116개 청크) - 파일 분리 검토


**`myresultpage.tsx`** (component)

- 평균 복잡도: **0.000**

- 최대 복잡도: 0.008

- 청크 수: 96개


**권장사항:**

- 파일 크기가 큼 (96개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 PDF 다운로드 기능을 1차/2차로 분리하여 사용자가 각 차수별로 개별 다운로드할 수 있도록 개선하고, 교사용 대시보드에서 학생별 개인 PDF(상세/요약)를 다운로드할 수 있는 기능을 추가합니다. 또한 `pdfDownloadService.ts`를 리팩토링하여 공통 응답 처리 로직(`handleFileResponse`)을 추출하고, `PdfDownloadRequest` 인터페이스를 도입하여 타입 안정성을 높였습니다.

- **목적**: PDF 다운로드 UI 개선 (차수별 분리) + 교사용 학급 대시보드에 학생별 PDF 다운로드 기능 추가 + 서비스 코드 리팩토링
- **도메인**: UI (React 컴포넌트) / 비즈니스 로직 (PDF 다운로드 서비스)
- **변경 방향**: 단일 PDF 다운로드 버튼에서 1차/2차 개별 버튼으로 분리, 교사 화면에 학생별 PDF 아이콘 버튼 추가, 서비스 레이어 공통화

---

## [GOOD] 잘된 점

**1. 타입 안정성 향상**

`isPdfDownloading` 상태를 `boolean`에서 `1 | 2 | null`로 변경한 것은 매우 적절한 개선입니다. 이전에는 `true`/`false`만으로 어떤 차수의 다운로드가 진행 중인지 알 수 없어서, 두 버튼이 동시에 비활성화되거나 로딩 스피너가 두 버튼 모두에 표시되는 문제가 있었습니다. 이제 각 차수별로 정확한 로딩 상태를 표시할 수 있습니다.

```typescript
// MyResultPage.tsx - 396라인
const [isPdfDownloading, setIsPdfDownloading] = useState<1 | 2 | null>(null);

// 사용 예시 - 626라인
{isPdfDownloading === 1 ? <SpinningLoader /> : <Download />}
{isPdfDownloading === 2 ? <SpinningLoader /> : <Download />}
```

**2. 서비스 레이어 리팩토링**

`pdfDownloadService.ts`에서 `handleFileResponse` 공통 함수를 추출하고 `PdfDownloadRequest` 인터페이스를 정의한 점이 좋습니다. 이전에는 `downloadStudentPdf` 함수 내부에 파일 응답 처리 로직이 중복되어 있었고, `params` 객체의 타입이 인라인으로 정의되어 있었습니다. 이제 `downloadStudentPdf`와 `downloadTeacherReportPdf`가 동일한 시그니처를 공유하게 되어 유지보수성이 향상되었습니다.

```typescript
// pdfDownloadService.ts
interface PdfDownloadRequest {
  userId: string;
  userType: 'S' | 'T';
  dgnssId: number;
  answerIdx: number;
  ordNo: number;
  type?: 1 | 2; // 1: 상세, 2: 요약
}

// 공통 응답 처리 함수
async function handleFileResponse(response: any, defaultFileName: string) {
  // Content-Type에 따라 Blob 다운로드 또는 URL 오픈 처리
}
```

**3. IIFE 제거로 가독성 개선**

`MyResultPage.tsx`에서 즉시 실행 함수(IIFE)로 감싸져 있던 PDF 버튼 렌더링 로직을 컴포넌트 레벨의 `handleDownloadPdf` 함수로 분리했습니다. 이전 코드는 JSX 내부에 IIFE가 중첩되어 있어 가독성이 낮았고, `pdfRound`, `pdfDgnssId`, `pdfAssessment` 등의 지역 변수가 IIFE 스코프에 갇혀 있었습니다. 이제 `handleDownloadPdf(round: 1 | 2)` 형태로 깔끔하게 분리되었습니다.

---

## 변경사항 요약

4개 파일이 변경되었습니다:
- `MyResultPage.tsx`와 `StudentDashboardPage.tsx`: PDF 버튼을 1차/2차로 분리하고 IIFE 제거
- `ClassDashboardWidget.tsx`: 학생별 PDF 다운로드 아이콘 컬럼 추가, 교사용 보고서 버튼 추가, 테이블 행 클릭 영역 개선
- `pdfDownloadService.ts`: 공통 응답 처리 함수 추출, `PdfDownloadRequest` 인터페이스 도입, `downloadTeacherReportPdf` 함수 추가

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `ClassDashboardWidget.tsx` - `handleDownloadTeacherReport` 호출 시 인자 오류**

`TeacherReportButton`의 `onClick`에서 `handleDownloadTeacherReport(dgnssIds)`를 호출하고 있으나, 함수 시그니처는 `(round: 1 | 2)`로 선언되어 있습니다.

```typescript
// 함수 선언 (718라인)
const handleDownloadTeacherReport = async (round: 1 | 2) => {
    const dgnssId = round === 1 ? dgnssIds.round1 : dgnssIds.round2;
    // ...
};

// 호출부 (776라인)
<TeacherReportButton
    onClick={() => void handleDownloadTeacherReport(dgnssIds)}
    // ...
>
```

`dgnssIds`는 `{ round1?: number; round2?: number }` 타입의 객체입니다. 이 객체가 `round` 파라미터로 전달되면 `round === 1` 조건은 항상 `false`가 되어, 함수 내부에서 항상 `dgnssIds.round2`를 참조하게 됩니다. 즉, round1만 존재하는 상황에서도 `dgnssIds.round2`가 `undefined`가 되어 `if (!dgnssId) return;`에 걸려 아무 동작도 하지 않게 됩니다.

**해결 방안**: `handleDownloadTeacherReport` 함수의 시그니처와 호출부를 일치시켜야 합니다. 교사용 보고서가 1차/2차 중 어떤 것을 대상으로 하는지 비즈니스 요구사항을 확인해야 정확한 수정이 가능합니다. 두 가지 가능한 수정 방향은 다음과 같습니다:

- 방안 A: `handleDownloadTeacherReport(1)` 또는 `handleDownloadTeacherReport(2)`로 호출하여 특정 차수 선택
- 방안 B: 함수 시그니처를 `(dgnssIds: { round1?: number; round2?: number })`로 변경하고 내부에서 두 차수를 모두 처리

> **[수정 코드 제시 불가 -- 문맥 파악 불충분]** 교사용 보고서가 1차/2차 중 어떤 것을 대상으로 하는지, 또는 두 차수를 모두 포함하는 단일 보고서인지 비즈니스 요구사항을 확인해야 정확한 수정이 가능합니다.

### Medium (개선 권장)

**1. `pdfDownloadService.ts` - `downloadAllPdf` 기본 파라미터 변경 (`1` -> `3`)**

`downloadAllPdf` 함수의 `type` 기본값이 기존 `1`(상세 보고서)에서 `3`(상세+요약)으로 변경되었습니다.

```typescript
// pdfDownloadService.ts - 85라인
export async function downloadAllPdf(dgnssId: number, type: 1 | 2 | 3 = 3): Promise<void> {
```

이는 `handleDownloadTeacherReport`에서 `downloadAllPdf(dgnssId)`를 호출할 때 type을 지정하지 않으면 상세+요약이 모두 포함된 ZIP이 다운로드된다는 의미입니다. 또한 `handleDownloadAll` 함수에서도 동일하게 기본값 `3`이 적용되므로, 1차/2차 전체 다운로드 버튼이 예상과 다른 결과물(상세+요약 통합 ZIP)을 생성할 수 있습니다. 의도된 변경이라면 문제없으나, 기존 동작(상세 보고서만 다운로드)에 의존하는 코드가 있다면 영향을 받을 수 있습니다.

**2. `ClassDashboardWidget.tsx` - 디버깅용 `console.log` 잔재**

`handleDownloadTeacherReport` 함수 내부에 디버깅용 `console.log`가 남아 있습니다.

```typescript
// ClassDashboardWidget.tsx - 720라인
const handleDownloadTeacherReport = async (round: 1 | 2) => {
    const dgnssId = round === 1 ? dgnssIds.round1 : dgnssIds.round2;
    console.log(user?.id, dgnssIds, round);  // 디버깅 코드 제거 필요
    if (!dgnssId) return;
```

프로덕션 코드에서는 제거하는 것이 좋습니다.

**3. `ClassDashboardWidget.tsx` - 테이블 행 클릭 이벤트 중복**

각 `TableCell`에 개별적으로 `onClick`과 `style={{ cursor: 'pointer' }}`를 적용하는 대신, `TableRow`에 한 번만 적용하는 것이 더 효율적입니다. 현재는 5개의 `TableCell` 각각에 동일한 `onClick` 핸들러와 스타일이 중복되어 있습니다.

```typescript
// 현재: 각 TableCell마다 중복
<TableCell onClick={() => navigate(...)} style={{ cursor: 'pointer' }}>
<TableCell onClick={() => navigate(...)} style={{ cursor: 'pointer' }}>
<TableCell onClick={() => navigate(...)} style={{ cursor: 'pointer' }}>
// ...

// 개선 제안: TableRow에 한 번만 적용
<TableRow onClick={() => navigate(...)} style={{ cursor: 'pointer' }}>
    <TableCell>...</TableCell>
    <TableCell>...</TableCell>
    // ...
</TableRow>
```

단, `PdfIconsCell`이 포함된 `TableCell`은 `e.stopPropagation()`을 사용하므로, `TableRow` 레벨의 `onClick`과 충돌하지 않습니다. 이는 이미 잘 처리되어 있습니다.

---

## 주요 파일 분석

### `frontend/src/widgets/class-dashboard/ClassDashboardWidget.tsx`

**변경 내용:**
학생 테이블에 PDF 다운로드 아이콘 컬럼 추가, 교사용 보고서 버튼 추가, 테이블 행 클릭 영역 개선

**개선 제안:**
1. **`handleDownloadTeacherReport` 호출 인자 불일치 (High)**
   - 함수 시그니처 `(round: 1 | 2)`와 호출부 `handleDownloadTeacherReport(dgnssIds)` 불일치
   - `dgnssIds` 객체가 `round` 파라미터로 전달되어 `round === 1` 조건이 항상 `false`

2. **디버깅 console.log 잔재 (Medium)**
   - `console.log(user?.id, dgnssIds, round)` 제거 필요

3. **테이블 행 클릭 이벤트 중복 (Medium)**
   - 5개 `TableCell`에 중복된 `onClick`/`style` 대신 `TableRow`에 한 번만 적용 가능

### `frontend/src/shared/services/pdfDownloadService.ts`

**변경 내용:**
공통 응답 처리 함수 `handleFileResponse` 추출, `PdfDownloadRequest` 인터페이스 도입, `downloadTeacherReportPdf` 함수 추가

**개선 제안:**
1. **`downloadAllPdf` 기본 type 변경 (Medium)**
   - 기본값이 `1`(상세)에서 `3`(상세+요약)으로 변경됨
   - `handleDownloadAll`에서 type 없이 호출 시 영향 확인 필요

### `frontend/src/features/student-exam/ui/MyResultPage.tsx` & `frontend/src/pages/student-dashboard/StudentDashboardPage.tsx`

**변경 내용:**
PDF 버튼을 1차/2차로 분리하고 IIFE 제거, `isPdfDownloading` 상태 타입을 `1 | 2 | null`로 변경

**개선 제안:**
특별한 이슈 없음. 리팩토링이 잘 이루어졌습니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**

전반적으로 PDF 다운로드 기능의 UX 개선과 서비스 레이어 리팩토링이 잘 이루어졌습니다. 특히 `isPdfDownloading` 상태 타입을 `1 | 2 | null`로 변경하여 차수별 로딩 상태를 정확히 추적할 수 있게 된 점, `handleFileResponse` 공통 함수를 추출하여 코드 중복을 제거한 점은 긍정적으로 평가됩니다.

다만 `ClassDashboardWidget.tsx`에서 `handleDownloadTeacherReport(dgnssIds)` 호출 시 인자 타입 불일치가 발견되었습니다. 함수 시그니처는 `(round: 1 | 2)`이나 객체(`dgnssIds`)를 전달하고 있어, 의도한 대로 동작하지 않을 가능성이 높습니다. 이 부분만 수정되면 바로 승인 가능한 수준의 퀄리티입니다.