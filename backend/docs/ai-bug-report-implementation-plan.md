# AI 버그리포트 기능 구현 계획

> 작성일: 2026-05-13
> 상태: 진행 중

---

## 완료된 작업

### 1. NCP Object Storage 연동
- [x] AWS S3 SDK 의존성 추가 (`build.gradle`)
- [x] `NcpObjectStorageConfig.java` - S3 클라이언트 빈 설정
- [x] `NcpStorageService.java` - 이미지 업로드/삭제 서비스 (기본 구현)
- [x] `application.yml` - NCP 환경변수 설정 (vlms-extra와 동일)

### 2. DDL 작성
- [x] `ai_conversation` 테이블에 `context_data` 컬럼 추가
- [x] `ai_bug_report` 테이블 생성
- [x] DDL 파일: `backend/docs/ai_bug_report_ddl.sql`

---

## 남은 작업

### 3. Backend - NcpStorageService 공통 메서드 확장
- [ ] `uploadImage()` - 범용 이미지 업로드 메서드
  - 파라미터: `MultipartFile file`, `String pathPrefix` (예: "bug-report", "profile", "counseling")
  - 반환: 업로드된 파일 URL
  - 내부적으로 경로 생성: `{basePath}/{pathPrefix}/YYYYMMDD/{uuid}.ext`
- [ ] 기존 `uploadBugReportImage()` → `uploadImage("bug-report", file)` 호출로 변경
- [ ] 추후 다른 기능에서도 `uploadImage("profile", file)` 형태로 재사용 가능

### 4. Backend - Domain/DTO 생성
- [ ] `AiBugReport.java` - 엔티티 클래스
- [ ] `AiBugReportDto.java` - 요청/응답 DTO

### 5. Backend - Mapper 구현
- [ ] `AiBugReportMapper.java` - 인터페이스
- [ ] `AiBugReportMapper.xml` - MyBatis XML
  - `insertBugReport` - 버그리포트 생성
  - `selectBugReportById` - 상세 조회
  - `selectBugReportList` - 목록 조회 (페이징)
  - `updateBugReportStatus` - 상태 변경 (관리자)
  - `countBugReports` - 목록 카운트

### 6. Backend - Service 구현
- [ ] `AiBugReportService.java`
  - `createBugReport()` - 버그리포트 생성 (공통 `uploadImage()` 메서드 사용)
  - `getBugReport()` - 상세 조회
  - `getBugReportList()` - 목록 조회
  - `updateStatus()` - 상태 변경

### 7. Backend - Controller 구현
- [ ] `AiBugReportController.java`
  - `POST /api/ai/bug-reports` - 버그리포트 생성 (multipart/form-data)
  - `GET /api/ai/bug-reports` - 목록 조회
  - `GET /api/ai/bug-reports/{id}` - 상세 조회
  - `PATCH /api/ai/bug-reports/{id}/status` - 상태 변경 (관리자)

### 8. Backend - ai_conversation context_data 저장
- [ ] 기존 `AiConversationMapper` 수정 - context_data 저장 로직 추가
- [ ] 대화 생성 시 context_data 함께 저장

### 9. Frontend - AI Room 버그리포트 UI
- [ ] 버그리포트 버튼 추가 (대화 중 신고 가능)
- [ ] 버그리포트 모달
  - 오류 유형 선택 (드롭다운)
  - 심각도 선택 (라디오 버튼)
  - 설명 입력 (텍스트 영역)
  - 스크린샷 업로드 (이미지 선택)
- [ ] API 연동 (FormData로 multipart 전송)

### 10. Frontend - context_data 저장 연동
- [ ] 대화 생성 API 호출 시 context_data 포함

### 11. (선택) Admin - 버그리포트 관리 페이지
- [ ] 버그리포트 목록 조회
- [ ] 상세 보기 (대화 내용 + 컨텍스트 확인)
- [ ] 상태 변경 (처리/기각)

---

## API 명세 (예정)

### POST /api/ai/bug-reports
버그리포트 생성

**Request** (multipart/form-data):
```
conversationId: number (필수)
errorType: string (필수) - hallucination|data_mismatch|missing_info|sensitive|ui_bug|other
severity: string (필수) - critical|high|medium|low
description: string (선택)
screenshot: file (선택) - 이미지 파일
```

**Response**:
```json
{
  "success": true,
  "resultData": {
    "id": 1,
    "conversationId": 101,
    "errorType": "hallucination",
    "severity": "high",
    "description": "학생 이름이 잘못 표시됨",
    "screenshotUrl": "https://con.aidtclass.com/files/dev/bug-report/20260513/abc123.png",
    "status": "pending",
    "reportedAt": "2026-05-13 14:30:00"
  }
}
```

### GET /api/ai/bug-reports
버그리포트 목록 조회 (관리자)

**Query**:
- `page`: 페이지 번호 (기본 0)
- `size`: 페이지 크기 (기본 20)
- `status`: 상태 필터 (선택)
- `errorType`: 오류유형 필터 (선택)
- `severity`: 심각도 필터 (선택)

### GET /api/ai/bug-reports/{id}
버그리포트 상세 조회

**Response**: 버그리포트 정보 + 대화 내용 + context_data

### PATCH /api/ai/bug-reports/{id}/status
상태 변경 (관리자)

**Request**:
```json
{
  "status": "resolved",
  "resolutionNote": "환각 현상 확인, 프롬프트 수정 예정"
}
```

---

## 파일 구조 (예정)

```
backend/src/main/java/com/vs/meta/
├── api/ai/
│   ├── controller/
│   │   └── AiBugReportController.java
│   ├── service/
│   │   └── AiBugReportService.java
│   ├── mapper/
│   │   └── AiBugReportMapper.java
│   └── dto/
│       └── AiBugReportDto.java
└── domain/
    └── AiBugReport.java

backend/src/main/resources/mapper/ai/
└── AiBugReportMapper.xml
```

---

## 환경변수 (이미 설정됨)

```bash
# NCP Object Storage (vlms-extra와 동일)
VLMSAPI_CLOUD_AWS_S3_BUCKET=vsaidt-dev-contents
VLMSAPI_CLOUD_AWS_S3_ENDPOINT=https://kr.object.gov-ncloudstorage.com
VLMSAPI_CLOUD_AWS_S3_URL=https://con.aidtclass.com
VLMSAPI_CLOUD_AWS_S3_PATH=/files/dev/
VLMSAPI_CLOUD_AWS_REGION_STATIC=ap-northeast-2
VLMSAPI_CLOUD_AWS_CREDENTIALS_ACCESSKEY=<access-key>
VLMSAPI_CLOUD_AWS_CREDENTIALS_SECRETKEY=<secret-key>
```

---

## 참고 파일

- DDL: `backend/docs/ai_bug_report_ddl.sql`
- 기존 AI Chat DDL: `backend/docs/ai_chat_ddl.sql`
- 기존 AI Chat API 명세: `backend/docs/ai-chat-api-spec.md`
- NCP Storage 설정: `common/config/NcpObjectStorageConfig.java`
- NCP Storage 서비스: `common/service/NcpStorageService.java`
