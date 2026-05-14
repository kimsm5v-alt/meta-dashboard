# QA 검수 도구 API Specification

> 최종 수정일: 2026-05-14

AI 응답 품질 검수 및 테스트 데이터 입력을 위한 통합 API 가이드입니다.

- Base URL: `http://{host}:8081`
- 인증: `Authorization: Bearer {accessToken}`

---

## 목차

1. [AI 버그 리포트](#1-ai-버그-리포트)
2. [DGNSS 응답값 일괄 입력](#2-dgnss-응답값-일괄-입력)

---

# 1. AI 버그 리포트

AI 대화 중 발생한 이상 응답(환각, 데이터 불일치 등)을 신고하고 관리하는 기능입니다.

## 1.1 데이터 모델

### BugReport

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | number | 버그 리포트 ID (자동 생성) |
| `conversationId` | number | 대화방 ID |
| `messageId` | number | 문제된 메시지 ID (선택) |
| `errorType` | string | 오류 유형 |
| `severity` | string | 심각도 |
| `description` | string | 상세 설명 |
| `screenshotUrl` | string | 스크린샷 URL |
| `status` | string | 처리 상태 |
| `reportedBy` | number | 신고자 user_no |
| `reportedAt` | string | 신고 일시 |
| `resolvedBy` | number | 처리자 user_no |
| `resolvedAt` | string | 처리 일시 |
| `resolutionNote` | string | 처리 메모 |

### 오류 유형 (errorType)

| 값 | 설명 |
|----|------|
| `hallucination` | 환각 - 사실과 다른 정보 생성 |
| `data_mismatch` | 데이터 불일치 - 제공된 데이터와 다른 응답 |
| `missing_info` | 정보 누락 - 필요한 정보를 제공하지 않음 |
| `sensitive` | 민감 정보 - 개인정보, 부적절한 내용 |
| `ui_bug` | UI 버그 - 화면 표시 오류 |
| `other` | 기타 |

### 심각도 (severity)

| 값 | 설명 |
|----|------|
| `critical` | 심각 - 즉시 대응 필요 |
| `high` | 높음 - 빠른 대응 필요 |
| `medium` | 보통 - 일반 대응 |
| `low` | 낮음 - 개선 사항 |

### 처리 상태 (status)

| 값 | 설명 |
|----|------|
| `pending` | 대기 - 신고 접수됨 |
| `reviewing` | 검토중 - 담당자 확인 중 |
| `resolved` | 해결 - 처리 완료 |
| `dismissed` | 기각 - 유효하지 않은 신고 |

## 1.2 API 목록

| Method | Endpoint | 설명 |
|--------|----------|------|
| `POST` | `/api/ai/bug-reports` | 버그 리포트 생성 |
| `GET` | `/api/ai/bug-reports` | 버그 리포트 목록 조회 |
| `GET` | `/api/ai/bug-reports/{id}` | 버그 리포트 상세 조회 |
| `PATCH` | `/api/ai/bug-reports/{id}/status` | 버그 리포트 상태 변경 |

## 1.3 API 상세

### POST `/api/ai/bug-reports`

버그 리포트 생성

**Content-Type**: `multipart/form-data`

**Request Parameters**:

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `conversationId` | number | O | 대화방 ID |
| `messageId` | number | X | 문제된 AI 메시지 ID (추적용) |
| `errorType` | string | O | 오류 유형 |
| `severity` | string | O | 심각도 |
| `description` | string | X | 상세 설명 |
| `screenshot` | file | X | 스크린샷 이미지 (jpg, png, gif, webp / 최대 10MB) |

**Request Example**:

```javascript
const formData = new FormData();
formData.append('conversationId', 101);
formData.append('messageId', 504);  // AI 응답 메시지의 id
formData.append('errorType', 'hallucination');
formData.append('severity', 'high');
formData.append('description', '학생 이름이 잘못 표시됨');
formData.append('screenshot', fileInput.files[0]);

fetch('/api/ai/bug-reports', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + accessToken },
  body: formData
});
```

**Response**:

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "버그리포트가 접수되었습니다",
  "resultData": {
    "id": 1,
    "conversationId": 101,
    "messageId": 504,
    "errorType": "hallucination",
    "severity": "high",
    "description": "학생 이름이 잘못 표시됨",
    "screenshotUrl": "https://con.aidtclass.com/files/dev/bug-report/20260514/abc123.png",
    "status": "pending",
    "reportedBy": 12345,
    "reportedAt": "2026-05-14 14:30:00"
  }
}
```

---

### GET `/api/ai/bug-reports`

버그 리포트 목록 조회 (관리자용)

**Query Parameters**:

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `page` | number | X | 페이지 번호 (기본 0) |
| `size` | number | X | 페이지 크기 (기본 20, 최대 100) |
| `status` | string | X | 상태 필터 |
| `errorType` | string | X | 오류 유형 필터 |
| `severity` | string | X | 심각도 필터 |

**Response**:

```json
{
  "success": true,
  "resultCode": 200,
  "resultData": {
    "items": [
      {
        "id": 1,
        "conversationId": 101,
        "messageId": 504,
        "conversationTitle": "전체 학급에서 특별히 관심이...",
        "errorType": "hallucination",
        "severity": "high",
        "status": "pending",
        "reportedAt": "2026-05-14 14:30:00",
        "reporterEmail": "teacher@example.com"
      }
    ],
    "page": 0,
    "size": 20,
    "totalCount": 1
  }
}
```

---

### GET `/api/ai/bug-reports/{id}`

버그 리포트 상세 조회

**Response**:

```json
{
  "success": true,
  "resultCode": 200,
  "resultData": {
    "id": 1,
    "conversationId": 101,
    "messageId": 504,
    "errorType": "hallucination",
    "severity": "high",
    "description": "학생 이름이 잘못 표시됨",
    "screenshotUrl": "https://...",
    "status": "pending",
    "reportedBy": 12345,
    "reportedAt": "2026-05-14 14:30:00",
    "conversation": {
      "id": 101,
      "title": "전체 학급에서 특별히 관심이...",
      "mode": "all",
      "contextLabel": "전체"
    },
    "message": {
      "id": 504,
      "role": "assistant",
      "content": "문제가 된 AI 응답 내용..."
    },
    "reporterEmail": "teacher@example.com"
  }
}
```

---

### PATCH `/api/ai/bug-reports/{id}/status`

버그 리포트 상태 변경 (관리자용)

**Request Body**:

```json
{
  "status": "resolved",
  "resolutionNote": "환각 현상 확인, 프롬프트 수정 예정"
}
```

**Response**:

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "버그리포트 상태가 변경되었습니다",
  "resultData": {
    "id": 1,
    "status": "resolved",
    "resolvedBy": 99999,
    "resolvedAt": "2026-05-14 15:00:00",
    "resolutionNote": "환각 현상 확인, 프롬프트 수정 예정"
  }
}
```

## 1.4 messageId 획득 방법

메시지 저장 API 응답에서 `id`를 획득하여 버그 리포트 시 `messageId`로 전달합니다.

```javascript
// POST /api/ai/conversations/{conversationId}/messages 응답
{
  "messages": [
    { "id": 503, "role": "user", "content": "질문..." },
    { "id": 504, "role": "assistant", "content": "AI 응답..." }
  ]
}

// 504가 AI 응답의 messageId → 버그 리포트 시 이 id를 전달
```

## 1.5 UI 구현 가이드

**버그 리포트 모달 예시**:

```
┌─────────────────────────────────────────┐
│  AI 응답 오류 신고                        │
├─────────────────────────────────────────┤
│                                         │
│  오류 유형 *                             │
│  ┌─────────────────────────────────┐   │
│  │ 환각 (사실과 다른 정보)      ▼   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  심각도 *                               │
│  ○ 심각  ○ 높음  ● 보통  ○ 낮음        │
│                                         │
│  상세 설명                               │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  스크린샷                                │
│  [파일 선택] screenshot.png             │
│                                         │
│           [취소]  [신고하기]             │
└─────────────────────────────────────────┘
```

---

# 2. DGNSS 응답값 일괄 입력

학습심리정서검사 응답값을 엑셀로 일괄 입력할 수 있는 검수용 기능입니다.

## 2.1 API 목록

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/api/dgnss/tc/sample-excel` | 샘플 엑셀 다운로드 |
| `POST` | `/api/dgnss/tc/upload-answers` | 응답값 일괄 업로드 |

## 2.2 API 상세

### GET `/api/dgnss/tc/sample-excel`

검사 응답 입력용 샘플 엑셀 다운로드

**Query Parameters**:

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `dgnssId` | number | O | 검사 ID |

**Request Example**:

```
GET /api/dgnss/tc/sample-excel?dgnssId=1088
```

**Response**:

- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- 파일명: `{그룹이름}_{회차}_샘플.xlsx`

**다운로드 예시 (JavaScript)**:

```javascript
const downloadSampleExcel = async (dgnssId) => {
  const response = await fetch(`/api/dgnss/tc/sample-excel?dgnssId=${dgnssId}`, {
    headers: { 'Authorization': 'Bearer ' + accessToken }
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  // Content-Disposition 헤더에서 파일명 추출
  const disposition = response.headers.get('Content-Disposition');
  const filename = disposition
    ? decodeURIComponent(disposition.split("filename*=UTF-8''")[1] || 'sample.xlsx')
    : 'sample.xlsx';

  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
```

---

### POST `/api/dgnss/tc/upload-answers`

엑셀 기반 응답값 일괄 업데이트

**Content-Type**: `multipart/form-data`

**Request Parameters**:

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `dgnssId` | number | O | 검사 ID |
| `file` | file | O | 작성된 엑셀 파일 (.xlsx) |

**Request Example**:

```javascript
const uploadAnswers = async (dgnssId, file) => {
  const formData = new FormData();
  formData.append('dgnssId', dgnssId);
  formData.append('file', file);

  const response = await fetch('/api/dgnss/tc/upload-answers', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + accessToken },
    body: formData
  });

  return await response.json();
};
```

**Success Response**:

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "응답값이 성공적으로 업데이트되었습니다",
  "resultData": {
    "updatedCount": 25,
    "totalRows": 25
  }
}
```

**Error Response (유효성 검증 실패)**:

```json
{
  "success": false,
  "resultCode": 400,
  "resultMessage": "유효성 검증 실패: 3건의 오류가 있습니다",
  "resultData": {
    "errors": [
      { "row": 5, "column": "OMR_IDX", "message": "존재하지 않는 OMR_IDX입니다 (99999)" },
      { "row": 8, "column": "15", "message": "응답값은 1~5 사이여야 합니다 (입력값: 7)" },
      { "row": 12, "column": "OMR_IDX", "message": "해당 검사에 속하지 않는 학생입니다 (12345)" }
    ]
  }
}
```

## 2.3 엑셀 파일 구조

### 컬럼 구성

| 컬럼 | 열 | 설명 | 편집 가능 |
|------|-----|------|----------|
| 번호 | A | 출석번호 | X (수정금지) |
| OMR_IDX | B | OMR 인덱스 (학생 식별자) | X (수정금지) |
| 닉네임 | C | 학생 닉네임 | X (수정금지) |
| 1~124 | D~DU | 응답값 (1~5) | O |

### 예시

| 번호 (수정금지) | OMR_IDX (수정금지) | 닉네임 (수정금지) | 1 | 2 | 3 | ... | 124 |
|----------------|-------------------|------------------|---|---|---|-----|-----|
| 1 | 5001 | 김철수 | 3 | 4 | 2 | ... | 5 |
| 2 | 5002 | 이영희 | 4 | 3 | 5 | ... | 2 |
| 3 | 5003 | 박민수 | 2 | 5 | 1 | ... | 4 |

### 주의 사항

- **A~C열은 수정하지 마세요** - 연한 빨간색 배경으로 표시됨
- **응답값은 1~5 사이의 정수**만 입력 가능
- **빈 셀은 무시됩니다** - 기존 값 유지
- **OMR_IDX 기준**으로 학생을 식별하므로 행 순서는 변경해도 됨

## 2.4 유효성 검증 규칙

| 검증 항목 | 설명 |
|----------|------|
| 파일 형식 | `.xlsx` 파일만 허용 |
| 헤더 행 | 첫 행에 헤더가 있어야 함 |
| OMR_IDX | 존재하는 OMR_IDX여야 함 |
| 검사 소속 | 해당 dgnssId에 속한 학생이어야 함 |
| 응답값 범위 | 1~5 사이의 정수 (빈 값 허용) |

**검증 실패 시 전체 롤백** - 하나라도 오류가 있으면 전체 업데이트가 취소됩니다.

## 2.5 UI 구현 가이드

**UI 흐름**:

```
1. [샘플 다운로드] 버튼 클릭
   ↓
2. 엑셀 파일 다운로드
   ↓
3. 로컬에서 응답값 입력 (D~DU열)
   ↓
4. [업로드] 버튼 클릭 → 파일 선택
   ↓
5. 성공 시 완료 메시지 / 실패 시 오류 목록 표시
```

**UI 예시**:

```
┌─────────────────────────────────────────────────┐
│  검수용 응답값 일괄 입력                          │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. 샘플 엑셀 다운로드                           │
│     [샘플 다운로드]                              │
│                                                 │
│  2. 응답값 입력 후 업로드                        │
│     ┌─────────────────────────────────┐        │
│     │ 파일을 여기에 드래그하거나      │        │
│     │ 클릭하여 선택하세요             │        │
│     └─────────────────────────────────┘        │
│                                                 │
│     선택된 파일: 수학반_1_샘플.xlsx              │
│                                                 │
│     [업로드 및 적용]                             │
│                                                 │
└─────────────────────────────────────────────────┘
```

**오류 표시 예시**:

```
┌─────────────────────────────────────────────────┐
│  업로드 실패 - 3건의 오류                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  행 5, OMR_IDX: 존재하지 않는 OMR_IDX입니다      │
│  행 8, 15번 문항: 응답값은 1~5 사이여야 합니다   │
│  행 12, OMR_IDX: 해당 검사에 속하지 않는 학생    │
│                                                 │
│  오류를 수정한 후 다시 업로드해 주세요            │
│                                                 │
│                              [닫기]              │
└─────────────────────────────────────────────────┘
```

---

# 3. 에러 코드

| 에러 | 설명 |
|------|------|
| 400 | 필수 파라미터 누락 또는 잘못된 값 |
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 500 | 서버 내부 오류 |

---

# 4. React 구현 예시

## 4.1 AI 버그 리포트 컴포넌트

```jsx
import React, { useState } from 'react';

const BugReportModal = ({ conversationId, messageId, onClose }) => {
  const [errorType, setErrorType] = useState('hallucination');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('conversationId', conversationId);
      if (messageId) formData.append('messageId', messageId);
      formData.append('errorType', errorType);
      formData.append('severity', severity);
      if (description) formData.append('description', description);
      if (screenshot) formData.append('screenshot', screenshot);

      const response = await fetch('/api/ai/bug-reports', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + getAccessToken() },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        alert('버그 리포트가 접수되었습니다.');
        onClose();
      } else {
        alert('오류: ' + result.resultMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <select value={errorType} onChange={(e) => setErrorType(e.target.value)}>
        <option value="hallucination">환각</option>
        <option value="data_mismatch">데이터 불일치</option>
        <option value="missing_info">정보 누락</option>
        <option value="sensitive">민감 정보</option>
        <option value="ui_bug">UI 버그</option>
        <option value="other">기타</option>
      </select>

      <div>
        {['critical', 'high', 'medium', 'low'].map((s) => (
          <label key={s}>
            <input type="radio" value={s} checked={severity === s}
              onChange={(e) => setSeverity(e.target.value)} /> {s}
          </label>
        ))}
      </div>

      <textarea value={description} onChange={(e) => setDescription(e.target.value)}
        placeholder="상세 설명" />

      <input type="file" accept="image/*"
        onChange={(e) => setScreenshot(e.target.files[0])} />

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? '전송 중...' : '신고하기'}
      </button>
    </div>
  );
};
```

## 4.2 DGNSS 엑셀 업로드 컴포넌트

```jsx
import React, { useState } from 'react';

const DgnssExcelUpload = ({ dgnssId }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleDownload = async () => {
    const response = await fetch(
      `/api/dgnss/tc/sample-excel?dgnssId=${dgnssId}`,
      { headers: { 'Authorization': 'Bearer ' + getAccessToken() } }
    );
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `검사_${dgnssId}_샘플.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) return alert('파일을 선택해주세요.');

    setLoading(true);
    setErrors([]);

    try {
      const formData = new FormData();
      formData.append('dgnssId', dgnssId);
      formData.append('file', file);

      const response = await fetch('/api/dgnss/tc/upload-answers', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + getAccessToken() },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        alert(`${result.resultData.updatedCount}건이 업데이트되었습니다.`);
        setFile(null);
      } else {
        setErrors(result.resultData?.errors || []);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleDownload}>샘플 다운로드</button>
      <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload} disabled={loading || !file}>
        {loading ? '업로드 중...' : '업로드 및 적용'}
      </button>

      {errors.length > 0 && (
        <div className="error-list">
          <h4>오류 목록</h4>
          {errors.map((err, idx) => (
            <p key={idx}>행 {err.row}, {err.column}: {err.message}</p>
          ))}
        </div>
      )}
    </div>
  );
};
```
