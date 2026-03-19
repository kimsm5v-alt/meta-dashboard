# Meta Backend API 명세서

> **Base URL**: `http://{host}:8081`
> **인증**: `Authorization: Bearer {accessToken}` (JWT)
> **공통 응답**:
> ```json
> { "success": true, "resultCode": 200, "resultMessage": "...", "resultData": { ... } }
> ```
> **상태**: ✅ 구현 완료 · ⚠️ 수정 필요 · 🔲 프론트 미연동 (백엔드 완료) · ❌ 백엔드 미구현

---

## 전체 API 목록

| # | 영역 | Method | URL | 설명 | 상태 | 비고 | 상세 |
|---|------|--------|-----|------|------|------|------|
| | **회원 인증** | | | | | *프론트: Mock → 전환 필요* | |
| 1 | 회원 | POST | `/member/signup` | 회원가입 | 🔲 | | [이동](#api-1) |
| 2 | 회원 | POST | `/member/login` | 로그인 (JWT 발급) | 🔲 | | [이동](#api-2) |
| 3 | 회원 | POST | `/member/token/refresh` | Access Token 갱신 | 🔲 | | [이동](#api-3) |
| 4 | 회원 | POST | `/member/logout` | 로그아웃 | 🔲 | | [이동](#api-4) |
| 5 | 회원 | GET | `/member/info` | 내 정보 조회 | 🔲 | | [이동](#api-5) |
| | **이메일 인증** | | | | | | |
| 6 | 이메일 | POST | `/member/send-code` | 인증코드 발송 | 🔲 | 5분 유효, 1분 재발송 제한 | [이동](#api-6) |
| 7 | 이메일 | POST | `/member/verify-code` | 인증코드 확인 | 🔲 | | [이동](#api-7) |
| | **관찰 메모** | | | | | *연동 완료* | |
| 8 | 메모 | GET | `/api/memos/student/{studentId}` | 학생별 메모 조회 | ✅ | | [이동](#api-8) |
| 9 | 메모 | POST | `/api/memos` | 메모 생성 | ✅ | | [이동](#api-9) |
| 10 | 메모 | PATCH | `/api/memos/{id}` | 메모 수정 | ✅ | 본인 건만 | [이동](#api-10) |
| 11 | 메모 | DELETE | `/api/memos/{id}` | 메모 삭제 | ✅ | 본인 건만 | [이동](#api-11) |
| | **상담 관리** | | | | | *경로 `unified-counseling` → `counseling` 변경* | |
| 12 | 상담 | GET | `/api/counseling` | 전체 상담 조회 | ⚠️ | 경로 변경, 본인 건만 | [이동](#api-12) |
| 13 | 상담 | GET | `/api/counseling/{id}` | 단일 상담 조회 | ⚠️ | 경로 변경 | [이동](#api-13) |
| 14 | 상담 | GET | `/api/counseling/student/{studentId}` | 학생별 상담 조회 | ⚠️ | 경로 변경 | [이동](#api-14) |
| 15 | 상담 | GET | `/api/counseling/class/{classId}` | 학급별 상담 조회 | ⚠️ | 경로 변경 | [이동](#api-15) |
| 16 | 상담 | GET | `/api/counseling/status/{status}` | 상태별 상담 조회 | ⚠️ | 경로 변경 | [이동](#api-16) |
| 17 | 상담 | POST | `/api/counseling` | 상담 생성 | ⚠️ | 경로 변경 | [이동](#api-17) |
| 18 | 상담 | PATCH | `/api/counseling/{id}` | 상담 수정 | ⚠️ | 경로 변경, 본인 건만 | [이동](#api-18) |
| 19 | 상담 | POST | `/api/counseling/{id}/complete` | 상담 완료 처리 | ⚠️ | 경로 변경 | [이동](#api-19) |
| 20 | 상담 | POST | `/api/counseling/{id}/cancel` | 상담 취소 | ⚠️ | 경로 변경 | [이동](#api-20) |
| 21 | 상담 | DELETE | `/api/counseling/{id}` | 상담 삭제 | ⚠️ | 경로 변경 | [이동](#api-21) |
| | **그룹 관리** | | | | | *프론트: Mock + 필드명 불일치* | |
| 22 | 그룹 | POST | `/group/create` | 그룹 생성 | ⚠️ | 필드명 매핑 필요 | [이동](#api-22) |
| 23 | 그룹 | POST | `/group/join` | 회원 참가 (초대코드) | ⚠️ | | [이동](#api-23) |
| 24 | 그룹 | POST | `/group/join-guest` | 게스트 참가 | ⚠️ | | [이동](#api-24) |
| 25 | 그룹 | GET | `/group/list` | 내 그룹 목록 | ⚠️ | 전체 목록 반환 (페이징 없음) | [이동](#api-25) |
| 26 | 그룹 | GET | `/group/detail` | 그룹 상세 + 멤버 | ⚠️ | ?claId=xxx | [이동](#api-26) |
| 27 | 그룹 | GET | `/group/invite` | 초대코드로 그룹 조회 | ⚠️ | ?code=ABC123 | [이동](#api-27) |
| 28 | 그룹 | PUT | `/group/update` | 그룹 수정 (방장) | ⚠️ | | [이동](#api-28) |
| 29 | 그룹 | POST | `/group/member/leave` | 그룹 탈퇴 | ⚠️ | | [이동](#api-29) |
| 30 | 그룹 | POST | `/group/member/kick` | 멤버 강퇴 (방장) | ⚠️ | | [이동](#api-30) |
| 31 | 그룹 | DELETE | `/group/delete` | 그룹 삭제 (방장) | ⚠️ | ?claId=xxx | [이동](#api-31) |
| | **게스트 전환** | | | | | | |
| 32 | 게스트 | GET | `/guest/check` | 게스트 기록 조회 | 🔲 | ?email=xxx | [이동](#api-32) |
| 33 | 게스트 | POST | `/guest/convert` | 게스트→회원 전환 | 🔲 | | [이동](#api-33) |
| | **학교 관리** | | | | | | |
| 34 | 학교 | POST | `/school/import` | 학교 CSV 업로드 | — | Admin 전용 | — |
| | **검사 관리 (교사)** | | | | | *신규 API 개발 예정* | |
| 35 | 검사 | GET | `/api/meta/tc/start` | 검사 생성/시작 | ❌ | | [이동](#api-35) |
| 36 | 검사 | GET | `/api/meta/tc/info` | 교사 검사 목록 | ❌ | | [이동](#api-36) |
| 37 | 검사 | GET | `/api/meta/tc/detail` | 검사 상세 조회 | ❌ | | [이동](#api-37) |
| 38 | 검사 | GET | `/api/meta/tc/end` | 검사 종료 | ❌ | | [이동](#api-38) |
| 39 | 검사 | GET | `/api/meta/tc/cancel` | 검사 취소 (데이터 삭제) | ❌ | | [이동](#api-39) |
| 40 | 검사 | GET | `/api/meta/tc/restart` | 검사 재시작 | ❌ | | [이동](#api-40) |
| 41 | 검사 | GET | `/api/meta/tc/stinfolist` | 학생 목록 + 신뢰도 | ❌ | ?type=1,2,3,4 | [이동](#api-41) |
| 42 | 검사 | GET | `/api/meta/tc/notsubm` | 미제출 학생 목록 | ❌ | | [이동](#api-42) |
| 43 | 검사 | GET | `/api/meta/tc/need` | 관심 필요 학생 | ❌ | | [이동](#api-43) |
| | **검사 관리 (학생)** | | | | | *신규 API 개발 예정* | |
| 44 | 검사 | GET | `/api/meta/st/info` | 학생 검사 목록 | ❌ | | [이동](#api-44) |
| 45 | 검사 | GET | `/api/meta/st/start` | 문항 조회 (페이징) | ❌ | | [이동](#api-45) |
| 46 | 검사 | POST | `/api/meta/st/answer` | 답변 저장 | ❌ | | [이동](#api-46) |
| 47 | 검사 | POST | `/api/meta/st/submit` | 검사 제출 | ❌ | | [이동](#api-47) |
| 48 | 검사 | GET | `/api/meta/st/new` | 검사 새로하기 (답안 초기화) | ❌ | | [이동](#api-48) |
| | **분석/대시보드** | | | | | *신규 API 개발 예정* | |
| 49 | 분석 | GET | `/api/meta/tc/analysis` | 학급 평균 T점수 | ❌ | | [이동](#api-49) |
| 50 | 분석 | GET | `/api/meta/st/total/analysis` | 학생 개인 T점수 | ❌ | | [이동](#api-50) |
| 51 | 분석 | GET | `/api/dashboard` | 교사 대시보드 통합 | ❌ | 신규, 기존 API 없음 | [이동](#api-51) |
| 52 | 분석 | GET | `/api/class/{claId}/students` | 학급 전체 학생 목록 | ❌ | 신규, 기존 API 없음 | [이동](#api-52) |
| | **검사 코드 (QR)** | | | | | *프론트: localStorage → 전환* | |
| 53 | 검사코드 | POST | `/api/exam-code` | 검사 코드 생성 | ❌ | code, claId, dgnssId | [이동](#api-53) |
| 54 | 검사코드 | GET | `/api/exam-code/{code}` | 검사 코드 조회 | ❌ | | [이동](#api-54) |
| 55 | 검사코드 | PUT | `/api/exam-code/{code}` | 검사 코드 수정 | ❌ | | [이동](#api-55) |
| 56 | 검사코드 | DELETE | `/api/exam-code/{code}` | 검사 코드 삭제 | ❌ | | [이동](#api-56) |
| | **PDF 업로드** | | | | | *프론트: localStorage → 전환* | |
| 57 | 업로드 | POST | `/api/upload` | PDF 파일 업로드 | ❌ | multipart/form-data | [이동](#api-57) |
| 58 | 업로드 | GET | `/api/upload/latest` | 최근 업로드 데이터 조회 | ❌ | | [이동](#api-58) |
| | **생기부 (School Record)** | | | | | *1차 오픈 범위 아님 · 프론트: API 코드 완료, 백엔드 미구현* | |
| 59 | 생기부 | GET | `/api/school-records/student/{studentId}` | 저장된 생기부 조회 | ❌ | 1차 오픈 범위 아님 | [이동](#api-59) |
| 60 | 생기부 | POST | `/api/school-records` | 생기부 저장 | ❌ | 1차 오픈 범위 아님 | [이동](#api-60) |
| 61 | 생기부 | DELETE | `/api/school-records/{id}` | 생기부 삭제 | ❌ | 1차 오픈 범위 아님 | [이동](#api-61) |
| | **이메일 초대** | | | | | *프론트: Mock, 백엔드 미구현* | |
| 62 | 초대 | POST | `/group/invite/email` | 이메일 초대 발송 | ❌ | | [이동](#api-62) |
| 63 | 초대 | GET | `/group/invite/list` | 초대 목록 조회 | ❌ | ?groupId=xxx | [이동](#api-63) |
| 64 | 초대 | DELETE | `/group/invite/{invitationId}` | 초대 취소 | ❌ | | [이동](#api-64) |
| | **AI 프록시** | | | | | *프론트: Gemini 직접 호출* | |
| 65 | AI | POST | `/api/ai/generate` | AI 텍스트 생성 | ❌ | 기존: 프론트→Gemini API 직접 호출 | [이동](#api-65) |
| 66 | AI | POST | `/api/ai/assistant` | AI 교실 어시스턴트 (멀티턴) | ❌ | 기존: 프론트→Gemini API 직접 호출 | [이동](#api-66) |
| 67 | AI | POST | `/api/ai/multimodal` | PDF/이미지 AI 분석 | ❌ | 기존: 프론트→Gemini API 직접 호출 | [이동](#api-67) |

---

## API 호출 의존 관계

> 프론트에서 특정 API를 호출하려면, 선행 API에서 필요한 식별자를 먼저 획득해야 합니다.

### 핵심 데이터 흐름

```
로그인 (/member/login)
  └─ accessToken, userNo, tcId, stdtId 획득
       │
       ├─ 그룹 목록 (/group/list)
       │    └─ claId, groupId 획득
       │         │
       │         ├─ 그룹 상세 (/group/detail?claId=)
       │         │    └─ stdtId, memberNo, memberId 획득  ← 학생 식별자의 원천
       │         │         │
       │         │         ├─ 메모 조회 (/api/memos/student/{stdtId})
       │         │         ├─ 상담 조회 (/api/counseling/student/{stdtId})
       │         │         ├─ 생기부 조회 (/api/school-records/student/{stdtId})
       │         │         ├─ 학생 분석 (/api/analysis/student/{stdtId})
       │         │         ├─ 멤버 강퇴 (/group/member/kick) ← memberId 필요
       │         │         └─ 멤버 탈퇴 (/group/member/leave) ← memberId 필요
       │         │
       │         ├─ 학급 상담 (/api/counseling/class/{claId})
       │         ├─ 학급 분석 (/api/analysis/class/{claId})
       │         ├─ 학급 학생 목록 (/api/class/{claId}/students)
       │         └─ 검사 시작 (/api/exam/start) ← claId, tcId 필요
       │              └─ dgnssId 획득
       │                   │
       │                   ├─ 검사 상세 (/api/exam/{dgnssId})
       │                   ├─ 검사 학생 목록 (/api/exam/{dgnssId}/students)
       │                   │    └─ dgnssResultId 획득
       │                   │         ├─ 문항 조회 (/api/exam/student/questions?dgnssResultId=)
       │                   │         ├─ 답변 저장 (/api/exam/student/answer)
       │                   │         ├─ 검사 제출 (/api/exam/student/submit)
       │                   │         └─ 검사 새로하기 (/api/exam/student/reset)
       │                   ├─ 미제출 학생 (/api/exam/{dgnssId}/not-submitted)
       │                   ├─ 관심 필요 학생 (/api/exam/{dgnssId}/attention)
       │                   ├─ 검사 종료 (/api/exam/{dgnssId}/end)
       │                   ├─ 검사 취소 (/api/exam/{dgnssId}/cancel)
       │                   └─ 검사 재시작 (/api/exam/{dgnssId}/restart)
       │
       ├─ 대시보드 (/api/dashboard) ← tcId 필요
       │
       └─ 게스트 확인 (/guest/check?email=)
            └─ memberId, guestStdtId 획득
                 └─ 게스트 전환 (/guest/convert)
```

### 식별자별 획득 경로

| 식별자 | 설명 | 획득 API | 비고 |
|--------|------|----------|------|
| `accessToken` | JWT 인증 토큰 | `/member/login` | 모든 JWT API의 전제 |
| `userNo` | 회원 PK | `/member/login` | |
| `tcId` | 교사 ID | `/member/login` | 교사 로그인 시 |
| `stdtId` | 학생 ID | `/group/detail`, `/api/exam/{id}/students` | **학생별 API의 핵심 키** |
| `claId` | 학급(그룹) ID | `/group/list`, `/group/detail` | 그룹·검사·분석의 핵심 키 |
| `groupId` | 그룹 PK | `/group/list` | |
| `memberId` | 그룹 멤버 PK | `/group/detail` | 강퇴·탈퇴 시 사용 |
| `inviteCode` | 초대코드 (6자리) | `/group/create`, `/group/detail` | 참가 시 사용 |
| `dgnssId` | 검사 PK | `/api/exam/start`, `/api/exam/list` | 검사 관리의 핵심 키 |
| `dgnssResultId` | 학생별 검사결과 PK | `/api/exam/{id}/students` | 문항·답변·제출에 필요 |

### 독립 호출 가능 API (선행 API 불필요)

| API | 설명 |
|-----|------|
| `POST /member/signup` | 회원가입 |
| `POST /member/login` | 로그인 |
| `POST /member/token/refresh` | 토큰 갱신 (refreshToken만 필요) |
| `POST /member/send-code` | 이메일 인증코드 발송 |
| `POST /member/verify-code` | 인증코드 확인 |
| `POST /group/join-guest` | 게스트 참가 (inviteCode만 알면 됨) |

---

## 상세 명세

---

## 1. 회원 인증 🔲

> 프론트: `AuthContext.tsx` (Mock) → 실제 API 전환 필요

<a id="api-1"></a>
### POST `/member/signup` — 회원가입 (Public)

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `email` | String | O | 로그인 식별자 | `"test@test.com"` | UNIQUE, 이메일 인증 완료 필요 |
| `password` | String | O | 비밀번호 | `"Test1234!@"` | 10~64자, 영문대소+숫자+특수 중 2종 이상, 동일문자 4회 연속 금지 |
| `nickname` | String | O | 닉네임 | `"테스터"` | |
| `roleCode` | String | X | 역할 코드 | `"TEACHER"` | 기본값 `TEACHER`. 허용값: `TEACHER` \| `STUDENT` |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `userNo` | Long | 회원 PK | `123` | AUTO_INCREMENT |
| `email` | String | 이메일 | `"test@test.com"` | |
| `nickname` | String | 닉네임 | `"테스터"` | |
| `roleCode` | String | 역할 코드 | `"TEACHER"` | |

```json
// Request
{ "email": "test@test.com", "password": "Test1234!@", "nickname": "테스터", "roleCode": "TEACHER" }

// Response resultData
{ "userNo": 123, "email": "test@test.com", "nickname": "테스터", "roleCode": "TEACHER" }
```

---

<a id="api-2"></a>
### POST `/member/login` — 로그인 (Public)

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `email` | String | O | 이메일 | `"test@test.com"` | |
| `password` | String | O | 비밀번호 | `"Test1234!@"` | |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `userNo` | Long | 회원 PK | `123` | |
| `email` | String | 이메일 | `"test@test.com"` | |
| `nickname` | String | 닉네임 | `"테스터"` | |
| `roleCode` | String | 역할 코드 | `"TEACHER"` | |
| `tcId` | String | 교사 ID | `"viva-t-a3f2b1c4"` | 교사 역할만. `viva-t-` + UUID 8자리 |
| `stdtId` | String | 학생 ID | `null` | 학생 역할만. `viva-s-` + UUID 8자리 |
| `accessToken` | String | JWT Access Token | `"eyJ..."` | 단기 만료 |
| `refreshToken` | String | JWT Refresh Token | `"eyJ..."` | 14일 만료 |

```json
// Request
{ "email": "test@test.com", "password": "Test1234!@" }

// Response resultData
{
  "userNo": 123, "email": "test@test.com", "nickname": "테스터",
  "roleCode": "TEACHER", "tcId": "viva-t-a3f2b1c4", "stdtId": null,
  "accessToken": "eyJ...", "refreshToken": "eyJ..."
}
```

---

<a id="api-3"></a>
### POST `/member/token/refresh` — 토큰 갱신 (Public)

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `refreshToken` | String | O | Refresh Token | `"eyJ..."` | 만료 시 재로그인 필요 |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `accessToken` | String | 새 Access Token | `"eyJ..."` | |

```json
// Request
{ "refreshToken": "eyJ..." }

// Response
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "토큰 갱신 성공",
  "resultData": {
    "accessToken": "eyJ..."
  }
}
```

---

<a id="api-4"></a>
### POST `/member/logout` — 로그아웃 (Public)

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `refreshToken` | String | O | Refresh Token | `"eyJ..."` | DB에서 삭제 (즉시 무효화) |

**Response**: resultData 없음 (성공 메시지만 반환)

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "로그아웃 완료"
}
```

---

<a id="api-5"></a>
### GET `/member/info` — 내 정보 조회 (JWT)

**Request**: 없음 (JWT에서 userNo 자동 추출)

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `userNo` | Long | 회원 PK | `123` | |
| `email` | String | 이메일 | `"test@test.com"` | |
| `nickname` | String | 닉네임 | `"테스터"` | |
| `roleCode` | String | 역할 코드 | `"TEACHER"` | |
| `tcId` | String | 교사 ID | `"viva-t-a3f2b1c4"` | 교사만 |
| `stdtId` | String | 학생 ID | `null` | 학생만 |
| `status` | String | 계정 상태 | `"ACTIVE"` | `ACTIVE` \| `WITHDRAWN` \| `SUSPENDED` |
| `lastLoginAt` | String | 최근 로그인 | `"2026-03-17 14:30:00"` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "회원 정보 조회",
  "resultData": {
    "userNo": 123,
    "email": "test@test.com",
    "nickname": "테스터",
    "roleCode": "TEACHER",
    "tcId": "viva-t-a3f2b1c4",
    "stdtId": null,
    "status": "ACTIVE",
    "lastLoginAt": "2026-03-17 14:30:00"
  }
}
```

---

## 2. 이메일 인증 🔲

<a id="api-6"></a>
### POST `/member/send-code` — 인증코드 발송 (Public)

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `email` | String | O | 수신 이메일 | `"user@example.com"` | 5분 유효, 1분 재발송 제한 |

**Response**: resultData 없음 (성공 메시지만 반환)

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "인증코드 발송 완료"
}
```

---

<a id="api-7"></a>
### POST `/member/verify-code` — 인증코드 확인 (Public)

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `email` | String | O | 이메일 | `"user@example.com"` | |
| `code` | String | O | 6자리 인증코드 | `"482917"` | 5분 내 입력 |

**Response**: resultData 없음 (성공 메시지만 반환)

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "인증 완료"
}
```

---

## 3. 관찰 메모 ✅

> 프론트: `memoService.ts` — 경로·필드 모두 일치

<a id="api-8"></a>
### GET `/api/memos/student/{studentId}` (JWT) — 학생별 메모 조회

**Path Parameter**

| 파라미터 | 타입 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|
| `studentId` | String | 학생 ID | `"viva-s-00000001"` | `/group/detail` 멤버 목록에서 획득 |

**Response resultData** — `Array`

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `id` | String | 메모 PK | `"1"` | |
| `studentId` | String | 학생 ID | `"viva-s-00000001"` | |
| `classId` | String | 학급 ID | `"abcd1234"` | claId |
| `date` | String | 관찰 날짜 | `"2026-03-11"` | yyyy-MM-dd |
| `category` | String | 카테고리 | `"behavior"` | `behavior` \| `academic` \| `social` \| `emotion` \| `other` |
| `content` | String | 내용 | `"수업 시간에 집중력이 좋았음"` | |
| `isImportant` | Boolean | 중요 여부 | `false` | |
| `createdAt` | String | 생성일시 | `"2026-03-11 14:30:00"` | |
| `updatedAt` | String | 수정일시 | `"2026-03-11 14:30:00"` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "메모 목록 조회",
  "resultData": [
    {
      "id": "1",
      "studentId": "viva-s-00000001",
      "classId": "abcd1234",
      "date": "2026-03-11",
      "category": "behavior",
      "content": "수업 시간에 집중력이 좋았음",
      "isImportant": false,
      "createdAt": "2026-03-11 14:30:00",
      "updatedAt": "2026-03-11 14:30:00"
    }
  ]
}
```

---

<a id="api-9"></a>
### POST `/api/memos` (JWT) — 메모 생성

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `studentId` | String | O | 학생 ID | `"viva-s-00000001"` | |
| `classId` | String | O | 학급 ID | `"abcd1234"` | |
| `date` | String | O | 관찰 날짜 | `"2026-03-11"` | yyyy-MM-dd |
| `category` | String | O | 카테고리 | `"behavior"` | `behavior` \| `academic` \| `social` \| `emotion` \| `other` |
| `content` | String | O | 내용 | `"수업 시간에 집중력이 좋았음"` | |
| `isImportant` | Boolean | X | 중요 여부 | `false` | 기본값 `false` |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `id` | String | 메모 PK | `"2"` | 생성된 메모 ID |
| `studentId` | String | 학생 ID | `"viva-s-00000001"` | |
| `classId` | String | 학급 ID | `"abcd1234"` | |
| `date` | String | 관찰 날짜 | `"2026-03-11"` | |
| `category` | String | 카테고리 | `"behavior"` | |
| `content` | String | 내용 | `"수업 시간에 집중력이 좋았음"` | |
| `isImportant` | Boolean | 중요 여부 | `false` | |
| `createdAt` | String | 생성일시 | `"2026-03-11 14:30:00"` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "메모 생성 완료",
  "resultData": {
    "id": "2",
    "studentId": "viva-s-00000001",
    "classId": "abcd1234",
    "date": "2026-03-11",
    "category": "behavior",
    "content": "수업 시간에 집중력이 좋았음",
    "isImportant": false,
    "createdAt": "2026-03-11 14:30:00"
  }
}
```

---

<a id="api-10"></a>
### PATCH `/api/memos/{id}` (JWT) — 메모 수정 (본인 건만)

**Path Parameter**

| 파라미터 | 타입 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|
| `id` | Long | 메모 PK | `1` | |

**Request Body** — 모든 필드 optional

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `date` | String | X | 관찰 날짜 | `"2026-03-12"` | |
| `category` | String | X | 카테고리 | `"academic"` | |
| `content` | String | X | 내용 | `"수정 내용"` | |
| `isImportant` | Boolean | X | 중요 여부 | `true` | |

**Response**: resultData 없음 (성공 메시지만 반환)

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "메모 수정 완료"
}
```

---

<a id="api-11"></a>
### DELETE `/api/memos/{id}` (JWT) — 메모 삭제 (본인 건만)

**Path Parameter**

| 파라미터 | 타입 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|
| `id` | Long | 메모 PK | `1` | |

**Response**: resultData 없음 (성공 메시지만 반환)

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "메모 삭제 완료"
}
```

---

## 4. 상담 ⚠️ 경로 변경 필요

> 프론트: `unifiedCounselingService.ts`
> **필드명 일치. 경로만 `/api/unified-counseling/*` → `/api/counseling/*` 변경.**

<a id="api-12"></a>
### GET `/api/counseling` (JWT) — 전체 조회

> JWT의 userNo 기준 **본인이 생성한 상담 기록만** 조회됨 (교사 전용)

**Request**: 없음

**Response resultData** — `Array` (아래 공통 응답 구조)

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "상담 목록 조회",
  "resultData": [
    {
      "id": "1",
      "classId": "abcd1234",
      "scheduledAt": "2026-03-12 14:30",
      "duration": null,
      "types": ["regular"],
      "areas": ["academic", "emotion"],
      "methods": ["face-to-face"],
      "status": "scheduled",
      "reason": "학업 부진 상담",
      "summary": null,
      "nextSteps": null,
      "createdAt": "2026-03-11 09:00:00",
      "updatedAt": "2026-03-11 09:00:00",
      "students": [
        { "id": "viva-s-00000001", "name": "학생1", "number": 1, "classId": "abcd1234" }
      ]
    }
  ]
}
```

---

<a id="api-13"></a>
### GET `/api/counseling/{id}` (JWT) — 단일 조회

**Path Parameter**

| 파라미터 | 타입 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|
| `id` | Long | 상담 PK | `1` | |

**Response resultData** — 공통 응답 구조 (단일 객체)

---

<a id="api-14"></a>
### GET `/api/counseling/student/{studentId}` (JWT) — 학생별 조회

**Path Parameter**

| 파라미터 | 타입 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|
| `studentId` | String | 학생 ID | `"viva-s-00000001"` | |

**Response resultData** — `Array` (공통 응답 구조)

---

<a id="api-15"></a>
### GET `/api/counseling/class/{classId}` (JWT) — 학급별 조회

**Path Parameter**

| 파라미터 | 타입 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|
| `classId` | String | 학급 ID | `"abcd1234"` | claId |

**Response resultData** — `Array` (공통 응답 구조)

---

<a id="api-16"></a>
### GET `/api/counseling/status/{status}` (JWT) — 상태별 조회

**Path Parameter**

| 파라미터 | 타입 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|
| `status` | String | 상담 상태 | `"scheduled"` | `scheduled` \| `completed` \| `cancelled` |

**Response resultData** — `Array` (공통 응답 구조)

---

### 상담 공통 Response resultData

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `id` | String | 상담 PK | `"1"` | |
| `classId` | String | 학급 ID | `"abcd1234"` | |
| `scheduledAt` | String | 예정 일시 | `"2026-03-12 14:30"` | |
| `duration` | Integer | 상담 시간(분) | `30` | 완료 시 입력 |
| `types` | String[] | 상담 유형 | `["regular"]` | `regular` \| `urgent` \| `follow-up` \| `initial` |
| `areas` | String[] | 상담 영역 | `["academic", "emotion"]` | `academic` \| `career` \| `peer` \| `family` \| `emotion` \| `behavior` \| `health` \| `other` |
| `methods` | String[] | 상담 방식 | `["face-to-face"]` | `face-to-face` \| `phone` \| `video` \| `group` |
| `status` | String | 상태 | `"scheduled"` | `scheduled` \| `completed` \| `cancelled` |
| `reason` | String | 상담 사유 | `"학업 부진 상담"` | |
| `summary` | String | 상담 요약 | `null` | 완료 시 입력 |
| `nextSteps` | String | 후속 조치 | `null` | 완료 시 입력 (선택) |
| `createdAt` | String | 생성일시 | `"2026-03-11 09:00:00"` | |
| `updatedAt` | String | 수정일시 | `"2026-03-11 09:00:00"` | |
| `students` | Array | 상담 대상 학생 | | 아래 참고 |

**students 배열 항목**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `id` | String | 학생 ID | `"viva-s-00000001"` | stdtId |
| `name` | String | 학생명 | `"학생1"` | |
| `number` | Integer | 출석번호 | `1` | |
| `classId` | String | 학급 ID | `"abcd1234"` | |

---

<a id="api-17"></a>
### POST `/api/counseling` (JWT) — 상담 생성

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `classId` | String | O | 학급 ID | `"abcd1234"` | |
| `scheduledAt` | String | O | 예정 일시 | `"2026-03-12 14:30"` | |
| `types` | String[] | O | 상담 유형 | `["regular"]` | 위 허용값 참고 |
| `areas` | String[] | O | 상담 영역 | `["academic", "emotion"]` | 위 허용값 참고 |
| `methods` | String[] | O | 상담 방식 | `["face-to-face"]` | 위 허용값 참고 |
| `status` | String | X | 상태 | `"scheduled"` | 기본값 `scheduled` |
| `reason` | String | X | 상담 사유 | `"학업 부진 상담"` | |
| `students` | Array | O | 대상 학생 | | `{id, name, number, classId}` |

**Response resultData** — 공통 응답 구조 (생성된 상담 객체)

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "상담 생성 완료",
  "resultData": {
    "id": "2",
    "classId": "abcd1234",
    "scheduledAt": "2026-03-12 14:30",
    "duration": null,
    "types": ["regular"],
    "areas": ["academic", "emotion"],
    "methods": ["face-to-face"],
    "status": "scheduled",
    "reason": "학업 부진 상담",
    "summary": null,
    "nextSteps": null,
    "createdAt": "2026-03-11 09:00:00",
    "updatedAt": "2026-03-11 09:00:00",
    "students": [
      { "id": "viva-s-00000001", "name": "학생1", "number": 1, "classId": "abcd1234" }
    ]
  }
}
```

---

<a id="api-18"></a>
### PATCH `/api/counseling/{id}` (JWT) — 상담 수정 (본인 건만)

**Request Body** — 모든 필드 optional

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `scheduledAt` | String | X | 예정 일시 | `"2026-03-13 10:00"` | |
| `areas` | String[] | X | 상담 영역 | `["academic", "career"]` | |
| `reason` | String | X | 사유 | `"수정 사유"` | |

**Response resultData** — 공통 응답 구조 (수정된 상담 객체)

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "상담 수정 완료",
  "resultData": {
    "id": "1",
    "classId": "abcd1234",
    "scheduledAt": "2026-03-13 10:00",
    "status": "scheduled",
    "areas": ["academic", "career"],
    "reason": "수정 사유"
  }
}
```

---

<a id="api-19"></a>
### POST `/api/counseling/{id}/complete` (JWT) — 완료 처리 (본인 건만)

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `duration` | Integer | O | 상담 시간(분) | `30` | |
| `summary` | String | O | 상담 내용 요약 | `"학업 부진 원인 파악"` | |
| `nextSteps` | String | X | 후속 조치 | `"2주 후 후속 상담"` | |

**Response resultData** — 공통 응답 구조 (status=completed)

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "상담 완료 처리",
  "resultData": {
    "id": "1",
    "status": "completed",
    "duration": 30,
    "summary": "학업 부진 원인 파악",
    "nextSteps": "2주 후 후속 상담"
  }
}
```

---

<a id="api-20"></a>
### POST `/api/counseling/{id}/cancel` (JWT) — 취소 (본인 건만)

**Request**: 없음

**Response**: resultData 없음 (성공 메시지만 반환)

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "상담 취소 완료"
}
```

---

<a id="api-21"></a>
### DELETE `/api/counseling/{id}` (JWT) — 삭제 (본인 건만)

**Path Parameter**

| 파라미터 | 타입 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|
| `id` | Long | 상담 PK | `1` | 소프트 삭제 (use_yn='N') |

**Response**: resultData 없음 (성공 메시지만 반환)

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "상담 삭제 완료"
}
```

---

## 5. 그룹 ⚠️ 필드명 매핑 필요

> 프론트: `groupService.ts` (Mock) → 필드명 매핑 후 전환

### 필드명 매핑표

| 프론트 | 백엔드 | 비고 |
|--------|--------|------|
| `id` | `groupId` | |
| `name` | `groupNm` | |
| `description` | `groupDesc` | |
| `ownerId` | `hostUserNo` | |
| `ownerName` | `hostNickname` | |
| `myRole: "owner"/"member"` | `myRole: "HOST"/"STUDENT"` | 값 다름 |
| `memberType: "member"/"guest"` | `memberType: "STUDENT"/"GUEST"` | 값 다름 |
| `status: "active"/"left"` | `status: "ACTIVE"/"LEFT"/"KICKED"` | 대소문자 |
| `userId` | `userNo` | |
| `name` (멤버) | `nickname` | |
| `studentNumber` | `memberNo` | |

---

<a id="api-22"></a>
### POST `/group/create` (JWT) — 그룹 생성

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `groupNm` | String | O | 그룹명 | `"6학년 2반"` | |
| `schoolLevel` | String | O | 학교급 | `"elementary"` | `elementary` \| `middle` \| `high` |
| `grade` | String | O | 학년 | `"6"` | |
| `classNumber` | String | O | 반 | `"2"` | |
| `schoolName` | String | O | 학교명 | `"서울초등학교"` | |
| `groupDesc` | String | X | 그룹 설명 | `"설명"` | |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `groupId` | Long | 그룹 PK | `1` | |
| `claId` | String | 학급 ID | `"a1b2c3d4..."` | UUID 기반 |
| `groupNm` | String | 그룹명 | `"6학년 2반"` | |
| `inviteCode` | String | 초대코드 | `"ABC123"` | 6자리 |
| `hostUserNo` | Long | 방장 PK | `123` | |
| `hostNickname` | String | 방장 닉네임 | `"김교사"` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "그룹 생성 완료",
  "resultData": {
    "groupId": 1,
    "claId": "a1b2c3d4...",
    "groupNm": "6학년 2반",
    "inviteCode": "ABC123",
    "hostUserNo": 123,
    "hostNickname": "김교사"
  }
}
```

---

<a id="api-23"></a>
### POST `/group/join` (JWT) — 회원 참가

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `inviteCode` | String | O | 초대코드 | `"ABC123"` | 6자리 |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `memberId` | Long | 멤버 PK | `8` | group_member.id |
| `groupId` | Long | 그룹 PK | `1` | |
| `claId` | String | 학급 ID | `"a1b2c3d4..."` | |
| `groupNm` | String | 그룹명 | `"6학년 2반"` | |
| `role` | String | 참가 역할 | `"STUDENT"` | `STUDENT` |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "그룹 참가 완료",
  "resultData": {
    "memberId": 8,
    "groupId": 1,
    "claId": "a1b2c3d4...",
    "groupNm": "6학년 2반",
    "role": "STUDENT"
  }
}
```

---

<a id="api-24"></a>
### POST `/group/join-guest` (Public) — 게스트 참가

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `inviteCode` | String | O | 초대코드 | `"ABC123"` | |
| `nickname` | String | O | 게스트 이름 | `"게스트이름"` | |
| `email` | String | X | 이메일 | `"guest@test.com"` | |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `memberId` | Long | 멤버 PK | `9` | group_member.id |
| `groupId` | Long | 그룹 PK | `1` | |
| `claId` | String | 학급 ID | `"a1b2c3d4..."` | |
| `groupNm` | String | 그룹명 | `"6학년 2반"` | |
| `stdtId` | String | 게스트 학생 ID | `"viva-s-00000002"` | 자동 생성 |
| `accessToken` | String | 임시 JWT | `"eyJ..."` | 게스트용 토큰 |
| `refreshToken` | String | Refresh Token | `"eyJ..."` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "게스트 참가 완료",
  "resultData": {
    "memberId": 9,
    "groupId": 1,
    "claId": "a1b2c3d4...",
    "groupNm": "6학년 2반",
    "stdtId": "viva-s-00000002",
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

<a id="api-25"></a>
### GET `/group/list` (JWT) — 내 그룹 목록

**Request**: 없음 (JWT에서 userNo 자동 추출)

**Response resultData** — `Array`

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `claId` | String | 학급 ID | `"a1b2c3d4..."` | |
| `groupNm` | String | 그룹명 | `"6학년 2반"` | |
| `inviteCode` | String | 초대코드 | `"ABC123"` | |
| `memberCount` | Integer | 멤버 수 | `25` | |
| `myRole` | String | 내 역할 | `"HOST"` | `HOST` \| `STUDENT` |
| `schoolLevel` | String | 학교급 | `"elementary"` | |
| `grade` | String | 학년 | `"6"` | |
| `classNumber` | String | 반 | `"2"` | |
| `schoolName` | String | 학교명 | `"서울초등학교"` | |
| `createdAt` | String | 생성일시 | `"2026-03-17 10:00:00"` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "그룹 목록 조회",
  "resultData": [
    {
      "claId": "a1b2c3d4...",
      "groupNm": "6학년 2반",
      "inviteCode": "ABC123",
      "memberCount": 25,
      "myRole": "HOST",
      "schoolLevel": "elementary",
      "grade": "6",
      "classNumber": "2",
      "schoolName": "서울초등학교",
      "createdAt": "2026-03-17 10:00:00"
    }
  ]
}
```

---

<a id="api-26"></a>
### GET `/group/detail` (JWT) — 그룹 상세 + 멤버

**Query Parameter**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `claId` | String | O | 학급 ID | `"a1b2c3d4..."` | |
| `page` | Integer | X | 멤버 페이지 | `0` | 기본값 0 |
| `size` | Integer | X | 멤버 페이지 크기 | `50` | 기본값 50 |

**Response resultData — members 배열 항목**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `id` | Long | 멤버 PK | `1` | 강퇴/탈퇴 시 사용 |
| `userNo` | Long | 회원 PK | `456` | 게스트는 null |
| `stdtId` | String | 학생 ID | `"viva-s-00000001"` | 학생별 API 호출에 사용 |
| `nickname` | String | 닉네임 | `"학생1"` | |
| `email` | String | 이메일 | `"student@test.com"` | |
| `memberNo` | Integer | 출석번호 | `1` | |
| `memberType` | String | 멤버 유형 | `"STUDENT"` | `STUDENT` \| `GUEST` |
| `status` | String | 상태 | `"ACTIVE"` | `ACTIVE` \| `LEFT` \| `KICKED` \| `ARCHIVED` |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "그룹 상세 조회",
  "resultData": {
    "members": [
      {
        "id": 1,
        "userNo": 456,
        "stdtId": "viva-s-00000001",
        "nickname": "학생1",
        "email": "student@test.com",
        "memberNo": 1,
        "memberType": "STUDENT",
        "status": "ACTIVE"
      }
    ]
  }
}
```

---

<a id="api-27"></a>
### GET `/group/invite` (JWT) — 초대코드로 그룹 조회

**Query Parameter**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `code` | String | O | 초대코드 | `"ABC123"` | 6자리 |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `groupId` | Long | 그룹 PK | `1` | |
| `claId` | String | 학급 ID | `"a1b2c3d4..."` | |
| `groupNm` | String | 그룹명 | `"6학년 2반"` | |
| `inviteCode` | String | 초대코드 | `"ABC123"` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "초대코드 그룹 조회",
  "resultData": {
    "groupId": 1,
    "claId": "a1b2c3d4...",
    "groupNm": "6학년 2반",
    "inviteCode": "ABC123"
  }
}
```

---

<a id="api-28"></a>
### PUT `/group/update` (JWT, 방장) — 그룹 수정

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `claId` | String | O | 학급 ID | `"a1b2c3d4..."` | |
| `groupNm` | String | X | 그룹명 | `"수정명"` | |
| `groupDesc` | String | X | 설명 | `"수정설명"` | |
| `schoolName` | String | X | 학교명 | `"수정학교"` | |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `groupId` | Long | 그룹 PK | `1` | |
| `claId` | String | 학급 ID | `"a1b2c3d4..."` | |
| `groupNm` | String | 수정된 그룹명 | `"수정명"` | |
| `groupDesc` | String | 수정된 설명 | `"수정설명"` | |
| `schoolName` | String | 수정된 학교명 | `"수정학교"` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "그룹 수정 완료",
  "resultData": {
    "groupId": 1,
    "claId": "a1b2c3d4...",
    "groupNm": "수정명",
    "groupDesc": "수정설명",
    "schoolName": "수정학교"
  }
}
```

---

<a id="api-29"></a>
### POST `/group/member/leave` (JWT) — 탈퇴

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `memberId` | Long | O | 멤버 PK | `8` | `/group/detail` 멤버 목록의 `id` |

**Response**: resultData 없음 (성공 메시지만 반환)

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "그룹 탈퇴 완료"
}
```

---

<a id="api-30"></a>
### POST `/group/member/kick` (JWT, 방장) — 강퇴

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `memberId` | Long | O | 멤버 PK | `8` | |

**Response**: resultData 없음 (성공 메시지만 반환)

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "멤버 강퇴 완료"
}
```

---

<a id="api-31"></a>
### DELETE `/group/delete` (JWT, 방장) — 그룹 삭제

**Query Parameter**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `claId` | String | O | 학급 ID | `"a1b2c3d4..."` | |

**Response**: resultData 없음 (성공 메시지만 반환)

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "그룹 삭제 완료"
}
```

---

## 6. 게스트 전환 🔲

<a id="api-32"></a>
### GET `/guest/check` (JWT) — 게스트 기록 조회

**Query Parameter**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `email` | String | O | 이메일 | `"guest@test.com"` | |

**Response resultData** — `Array`

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `memberId` | Long | 멤버 PK | `8` | 전환 시 사용 |
| `claId` | String | 학급 ID | `"a1b2c3d4..."` | |
| `stdtId` | String | 게스트 학생 ID | `"viva-s-00000002"` | |
| `nickname` | String | 게스트 닉네임 | `"게스트이름"` | |
| `email` | String | 이메일 | `"guest@test.com"` | |
| `groupNm` | String | 그룹명 | `"6학년 2반"` | |
| `grade` | String | 학년 | `"6"` | |
| `joinedAt` | String | 참가일시 | `"2026-03-10 12:00:00"` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "게스트 기록 조회",
  "resultData": [
    {
      "memberId": 8,
      "claId": "a1b2c3d4...",
      "stdtId": "viva-s-00000002",
      "nickname": "게스트이름",
      "email": "guest@test.com",
      "groupNm": "6학년 2반",
      "grade": "6",
      "joinedAt": "2026-03-10 12:00:00"
    }
  ]
}
```

---

<a id="api-33"></a>
### POST `/guest/convert` (JWT) — 게스트→회원 전환

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `memberId` | Long | O | 멤버 PK | `8` | `/guest/check`에서 획득 |
| `mergeYn` | String | O | 검사 결과 합산 여부 | `"Y"` | `Y`: 합산, `N`: 합산 안함 |
| `email` | String | O | 이메일 | `"guest@test.com"` | |
| `guestStdtId` | String | O | 게스트 학생 ID | `"viva-s-00000002"` | |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `userNo` | Long | 회원 PK | `456` | 전환 후 정식 회원 PK |
| `email` | String | 이메일 | `"guest@test.com"` | |
| `stdtId` | String | 학생 ID | `"viva-s-00000001"` | 기존 회원의 stdtId로 통합 |
| `mergedCount` | Integer | 합산된 검사 수 | `2` | mergeYn=Y일 때만 |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "게스트 전환 완료",
  "resultData": {
    "userNo": 456,
    "email": "guest@test.com",
    "stdtId": "viva-s-00000001",
    "mergedCount": 2
  }
}
```

---

## 7. 검사 관리 — 교사 ❌ 신규 개발 예정

> 기존 `vcloudapi.vsaidt.com`의 `/etc/meta/tc/*` → `/api/meta/tc/*`로 대체
> 기존 API 기준: `vlms-stat` EtcController / EtcService / EtcMapper

<a id="api-35"></a>
### GET `/api/meta/tc/start` (JWT) — 검사 생성/시작

**Query Parameter**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `claId` | String | O | 학급 ID | `"eb1460dce8fc42889862e9a460beb4a0"` | |
| `tcId` | String | O | 교사 ID | `"rrmath016-t"` | |
| `ordNo` | Integer | O | 검사 회차 | `2` | 1차, 2차 등 |
| `grade` | String | O | 학교급 | `"el"` | `el` (초등) \| `mi` (중등) \| `hi` (고등) |
| `paperIdx` | Integer | X | 지필 번호 | `2` | 기본값 `2` |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `dgnssId` | Integer | 검사 PK | `1088` | 생성된 검사 ID |
| `ordNo` | Integer | 회차 | `2` | |
| `claId` | String | 학급 ID | `"eb1460dce8fc42889862e9a460beb4a0"` | |
| `tcId` | String | 교사 ID | `"rrmath016-t"` | |
| `dgnssAt` | String | 검사 진행 여부 | `"Y"` | `Y` (진행) \| `N` (종료) |
| `paperIdx` | String | 지필 번호 | `"2"` | |
| `dgnssStDt` | String | 검사 시작일 | `"2026. 03. 18."` | |
| `dgnssEdDt` | String | 검사 종료일 | `null` | 종료 전이면 null |
| `stSubmCnt` | Integer | 제출 학생 수 | `0` | |
| `stTotalCnt` | Integer | 전체 학생 수 | `30` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "(선생님) 학습심리정서검사 시작",
  "resultData": {
    "dgnssId": 1088,
    "ordNo": 2,
    "claId": "eb1460dce8fc42889862e9a460beb4a0",
    "tcId": "rrmath016-t",
    "dgnssAt": "Y",
    "paperIdx": "2",
    "dgnssStDt": "2026. 03. 18.",
    "dgnssEdDt": null,
    "stSubmCnt": 0,
    "stTotalCnt": 30
  }
}
```

---

<a id="api-36"></a>
### GET `/api/meta/tc/info` (JWT) — 교사 검사 목록

**Query Parameter**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `claId` | String | O | 학급 ID | `"eb1460dce8fc42889862e9a460beb4a0"` | |
| `tcId` | String | O | 교사 ID | `"rrmath016-t"` | |
| `paperIdx` | Integer | X | 지필 번호 | `1` | 기본값 `0` (전체) |

**Response resultData** — `Object`

| 필드 | 타입 | 설명 |
|------|------|------|
| `dgnssInfo` | Array | 검사 목록 배열 |

**dgnssInfo 항목**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `dgnssId` | Integer | 검사 PK | `1088` | |
| `ordNo` | Integer | 회차 | `2` | |
| `claId` | String | 학급 ID | `"eb1460dce8fc42889862e9a460beb4a0"` | |
| `tcId` | String | 교사 ID | `"rrmath016-t"` | |
| `dgnssAt` | String | 진행 여부 | `"Y"` | `Y` \| `N` |
| `paperIdx` | String | 지필 번호 | `"2"` | |
| `dgnssStDt` | String | 시작일 | `"2026. 03. 18."` | `YYYY. MM. DD.` 포맷 |
| `dgnssEdDt` | String | 종료일 | `null` | 종료 전이면 null |
| `stSubmCnt` | Integer | 제출 학생 수 | `25` | |
| `stTotalCnt` | Integer | 전체 학생 수 | `30` | |
| `notDgnssStartCnt` | Integer | 미시작 학생 수 | `2` | |
| `notDgnssStartList` | String | 미시작 학생 ID | `"s1,s2"` | 콤마 구분 |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "(선생님)학습심리정서검사 목록 조회",
  "resultData": {
    "dgnssInfo": [
      {
        "dgnssId": 1088,
        "ordNo": 2,
        "claId": "eb1460dce8fc42889862e9a460beb4a0",
        "tcId": "rrmath016-t",
        "dgnssAt": "Y",
        "paperIdx": "2",
        "dgnssStDt": "2026. 03. 18.",
        "dgnssEdDt": null,
        "stSubmCnt": 25,
        "stTotalCnt": 30,
        "notDgnssStartCnt": 2,
        "notDgnssStartList": "rrmath016-s3,rrmath016-s7"
      }
    ]
  }
}
```

---

<a id="api-37"></a>
### GET `/api/meta/tc/detail` (JWT) — 검사 상세

**Query Parameter**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `dgnssId` | Integer | O | 검사 PK | `1088` | |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `dgnssId` | Integer | 검사 PK | `1088` | |
| `ordNo` | Integer | 회차 | `2` | |
| `claId` | String | 학급 ID | `"eb1460..."` | |
| `dgnssAt` | String | 진행 여부 | `"Y"` | |
| `paperIdx` | String | 지필 번호 | `"2"` | |
| `dgnssText` | String | 검사 메모 | `"1반 2차 검사"` | 교사 입력 텍스트 |
| `dgnssStDt` | String | 시작일 | `"2026. 03. 18."` | |
| `dgnssEdDt` | String | 종료일 | `null` | |
| `num` | Integer | 출석번호 | `1` | |
| `notSubmStdtName` | String | 미제출 학생명 | `"3번 홍길동,7번 김철수"` | 콤마 구분, `NUM번 이름` 포맷 |
| `notSubmStdtId` | String | 미제출 학생 ID | `"s3,s7"` | 콤마 구분 |
| `stSubmCnt` | Integer | 제출 학생 수 | `25` | |
| `stTotalCnt` | Integer | 전체 학생 수 | `30` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "학습심리정서검사 상세 내용",
  "resultData": {
    "dgnssId": 1088,
    "ordNo": 2,
    "claId": "eb1460dce8fc42889862e9a460beb4a0",
    "dgnssAt": "Y",
    "paperIdx": "2",
    "dgnssText": "1반 2차 검사",
    "dgnssStDt": "2026. 03. 18.",
    "dgnssEdDt": null,
    "num": 1,
    "notSubmStdtName": "3번 홍길동,7번 김철수",
    "notSubmStdtId": "rrmath016-s3,rrmath016-s7",
    "stSubmCnt": 25,
    "stTotalCnt": 30
  }
}
```

---

<a id="api-38"></a>
### GET `/api/meta/tc/end` (JWT) — 검사 종료

**Query Parameter**: `dgnssId` (Integer, 필수)

**Response**: resultData는 종료 처리 결과 Map

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "(선생님) 학습심리정서검사 종료",
  "resultData": { ... }
}
```

---

<a id="api-39"></a>
### GET `/api/meta/tc/cancel` (JWT) — 검사 취소 (데이터 삭제)

> 검사 데이터 완전 삭제 (비가역)

**Query Parameter**: `dgnssId` (Integer, 필수)

**Response**: resultData `null`

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "(선생님)학습심리정서검사 취소",
  "resultData": null
}
```

---

<a id="api-40"></a>
### GET `/api/meta/tc/restart` (JWT) — 검사 재시작

**Query Parameter**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `dgnssId` | Integer | O | 검사 PK | `1088` | |
| `claId` | String | O | 학급 ID | `"eb1460..."` | |
| `grade` | String | O | 학교급 | `"el"` | |

**Response**: resultData는 재시작 처리 결과 Map

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "(선생님)학습심리정서검사 재시작",
  "resultData": { ... }
}
```

---

<a id="api-41"></a>
### GET `/api/meta/tc/stinfolist` (JWT) — 학생 목록 + 신뢰도

**Query Parameter**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `dgnssId` | Integer | O | 검사 PK | `1088` | |
| `type` | Integer | O | 조회 유형 | `1` | 1:신뢰도, 2:동기전략, 3:인지전략, 4:행동전략 |
| `paperIdx` | Integer | X | 지필 번호 | `2` | 기본값 `2` |
| `testFlag` | String | X | 테스트 플래그 | `"N"` | 기본값 `N` |

**Response resultData** — `Object`

| 필드 | 타입 | 설명 |
|------|------|------|
| `stInfoList` | Array | 학생 목록 |
| `type` | Integer | 조회 유형 |

**stInfoList 항목 (type=1, 신뢰도)**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `rowNum` | Integer | 순번 | `1` | ROW_NUMBER |
| `stdtId` | String | 학생 ID | `"rrmath016-s1"` | |
| `answerIdx` | Integer | 답안 인덱스 | `1161` | |
| `gender` | String | 성별 | `"남자"` | `남자` \| `여자` |
| `reaction` | String | 반응성 | `null` | `주의` 또는 null |
| `repeatResponse` | String | 반복응답 | `"N"` | `Y` \| `N` |
| `desirable` | String | 바람직성 | `null` | `주의` 또는 null |
| `reason` | String | 학습 동기 | `"흥미를 느껴서"` | LS_ANS03 매핑 |
| `styTime` | String | 학습 시간 | `"30분~1시간"` | LS_ANS04 매핑 |
| `styPer` | String | 학습량 인식 | `"보통"` | LS_ANS01 매핑 |
| `satisPer` | String | 만족도 인식 | `"높음"` | LS_ANS02 매핑 |
| `cnsl` | String | 상담 대상 | `"친구"` | LS_ANS05 매핑 |

**stInfoList 항목 (type=2, 동기전략)**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `rowNum` | Integer | 순번 | `1` | |
| `stdtId` | String | 학생 ID | `"rrmath016-s1"` | |
| `gender` | String | 성별 | `"남자"` | |
| `reaction` | String | 반응성 | `null` | |
| `desirable` | String | 바람직성 | `null` | |
| `repeatResponse` | String | 반복응답 | `"N"` | |
| `total` | Integer | 총점 T점수 | `52` | ROUND(T_SCORE) |
| `learningEg` | Integer | 학습동기 | `55` | |
| `mindSet` | Integer | 성장마인드셋 | `48` | |
| `efficacy` | Integer | 학습자기효능감 | `60` | |
| `motivation` | Integer | 내재적동기 | `53` | |
| `emotionCtrl` | Integer | 정서조절 | `47` | |
| `gradeLvl` | Integer | 학급분위기 | `51` | |
| `styLvl` | Integer | 학습양식 | `49` | |
| `failLvl` | Integer | 실패내성 | `54` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "대시보드 - 학생 목록",
  "resultData": {
    "type": 1,
    "stInfoList": [
      {
        "rowNum": 1,
        "stdtId": "rrmath016-s1",
        "answerIdx": 1161,
        "gender": "남자",
        "reaction": null,
        "repeatResponse": "N",
        "desirable": null,
        "reason": "흥미를 느껴서",
        "styTime": "30분~1시간",
        "styPer": "보통",
        "satisPer": "높음",
        "cnsl": "친구"
      }
    ]
  }
}
```

---

<a id="api-42"></a>
### GET `/api/meta/tc/notsubm` (JWT) — 미제출 학생

**Query Parameter**: `dgnssId` (Integer, 필수)

**Response resultData** — `Array`

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `stdtId` | String | 학생 ID | `"rrmath016-s3"` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "학습심리정서검사 미제출 인원 목록",
  "resultData": [
    { "stdtId": "rrmath016-s3" },
    { "stdtId": "rrmath016-s7" }
  ]
}
```

---

<a id="api-43"></a>
### GET `/api/meta/tc/need` (JWT) — 관심 필요 학생

**Query Parameter**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `dgnssId` | Integer | O | 검사 PK | `1088` | |
| `paperIdx` | Integer | X | 지필 번호 | `2` | 기본값 `2` |

**Response resultData**

| 필드 | 타입 | 설명 | 비고 |
|------|------|------|------|
| `reaction` | Array | 반응성 주의 학생 | `[{num, stdtId}]` |
| `repeatResponse` | Array | 반복응답 학생 | `[{num, stdtId}]` |
| `desirable` | Array | 바람직성 주의 학생 | `[{num, stdtId}]` |
| `etcInfo` | Object | 역량별 관심 학생 | key별 `[{num, stdtId}]` |

**etcInfo 하위 키**

| 키 | 설명 | 기준 |
|---|------|------|
| `learningEg` | 학습동기 | T점수 < 40 |
| `emotionCtrl` | 정서조절 | T점수 < 40 |
| `metaCog` | 메타인지 | T점수 < 40 |
| `cogLrnSkil` | 인지학습기술 | T점수 < 40 |
| `behvCtrl` | 행동조절 | T점수 < 40 |
| `behvLrnSkil` | 행동학습기술 | T점수 < 40 |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "(교사)학습심리정서검사 상담 및 지도가 필요한 학생 전달",
  "resultData": {
    "reaction": [{ "num": 3, "stdtId": "rrmath016-s3" }],
    "repeatResponse": [],
    "desirable": [{ "num": 7, "stdtId": "rrmath016-s7" }],
    "etcInfo": {
      "learningEg": [{ "num": 5, "stdtId": "rrmath016-s5" }],
      "emotionCtrl": [],
      "metaCog": [],
      "cogLrnSkil": [],
      "behvCtrl": [],
      "behvLrnSkil": []
    }
  }
}
```

---

## 8. 검사 관리 — 학생 ❌ 신규 개발 예정

> 기존 `vcloudapi.vsaidt.com`의 `/etc/meta/st/*` → `/api/meta/st/*`로 대체
> 기존 API 기준: `vlms-stat` EtcController / EtcService / EtcMapper

<a id="api-44"></a>
### GET `/api/meta/st/info` (JWT) — 학생 검사 목록

**Query Parameter**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `claId` | String | O | 학급 ID | `"eb1460dce8fc42889862e9a460beb4a0"` | |
| `stdtId` | String | O | 학생 ID | `"rrmath016-s1"` | |

**Response resultData** — `Array`

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `dgnssId` | Integer | 검사 PK | `1088` | |
| `paperIdx` | String | 지필 번호 | `"2"` | |
| `dgnssResultId` | Integer | 검사결과 PK | `12509` | 문항 조회/답변/제출에 사용 |
| `ordNo` | Integer | 회차 | `2` | |
| `dgnssAt` | String | 검사 진행 여부 | `"Y"` | `Y` \| `N` |
| `submAt` | String | 제출 여부 | `"N"` | `Y` (제출) \| `N` (미제출) |
| `eakAt` | String | 채점 완료 여부 | `"N"` | `Y` \| `N` |
| `submDt` | String | 제출일 | `null` | `"YYYY. MM. DD."` 또는 null |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "(학생)학습심리정서검사 목록 조회",
  "resultData": [
    {
      "dgnssId": 1088,
      "paperIdx": "2",
      "dgnssResultId": 12509,
      "ordNo": 2,
      "dgnssAt": "Y",
      "submAt": "N",
      "eakAt": "N",
      "submDt": null
    }
  ]
}
```

---

<a id="api-45"></a>
### GET `/api/meta/st/start` (JWT) — 문항 조회 (페이징)

**Query Parameter**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `dgnssResultId` | Integer | O | 검사결과 PK | `12509` | |
| `paperIdx` | Integer | X | 지필 번호 | `2` | 기본값 `2` |
| `page` | Integer | X | 페이지 | `0` | 0-indexed |
| `size` | Integer | X | 페이지 크기 | `20` | 기본값 `20` |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `omrIdx` | Integer | OMR 인덱스 | `5001` | 답변 저장 시 사용 |
| `dgnssQuesList` | Array | 문항 목록 | | 아래 참조 |
| `page` | Object | 페이징 정보 | | 아래 참조 |
| `stAnsCnt` | Integer | 현재 답변 수 | `15` | 입력 완료 문항 수 |

**dgnssQuesList 항목**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `NO` | Integer | 문항 번호 | `1` | 1-based |
| `QESITM_NM` | String | 문항 내용 | `"나는 스스로 공부할 수 있다."` | |
| `answer` | String | 현재 답변 | `""` | 미응답이면 빈 문자열 |
| `fullCount` | Integer | 전체 문항 수 | `119` | paperIdx=1 → 119문항, paperIdx=2 → 77문항 |

**page**

| 필드 | 타입 | 설명 | 샘플 |
|------|------|------|------|
| `size` | Integer | 페이지 크기 | `20` |
| `number` | Integer | 현재 페이지 | `0` |
| `totalElements` | Integer | 전체 문항 수 | `119` |
| `totalPages` | Integer | 전체 페이지 수 | `6` |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "(학생)META 자기조절학습 시작",
  "resultData": {
    "omrIdx": 5001,
    "dgnssQuesList": [
      { "NO": 1, "QESITM_NM": "나는 스스로 공부할 수 있다.", "answer": "", "fullCount": 119 },
      { "NO": 2, "QESITM_NM": "나는 어려운 일도 해낼 수 있다.", "answer": "3", "fullCount": 119 }
    ],
    "page": {
      "size": 20,
      "number": 0,
      "totalElements": 119,
      "totalPages": 6
    },
    "stAnsCnt": 15
  }
}
```

---

<a id="api-46"></a>
### POST `/api/meta/st/answer` (JWT) — 답변 저장

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `omrIdx` | Integer | O | OMR 인덱스 | `5001` | st/start에서 받은 값 |
| `no` | Integer | O | 문항 번호 | `1` | |
| `answer` | Integer | O | 답변 | `3` | 리커트 척도 값 |

**Response**: resultData는 Integer (1 = 성공)

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "(학생)문제 풀이",
  "resultData": 1
}
```

---

<a id="api-47"></a>
### POST `/api/meta/st/submit` (JWT) — 검사 제출

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `dgnssResultId` | Integer | O | 검사결과 PK | `12509` | |

**Response**: resultData는 제출 결과 Map

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "심리검사 제출",
  "resultData": { ... }
}
```

---

<a id="api-48"></a>
### GET `/api/meta/st/new` (JWT) — 검사 새로하기 (답안 초기화)

**Query Parameter**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `dgnssResultId` | Integer | O | 검사결과 PK | `12509` | |
| `paperIdx` | Integer | X | 지필 번호 | `2` | 기본값 `2` |
| `page` | Integer | X | 페이지 | `0` | |
| `size` | Integer | X | 페이지 크기 | `20` | |

**Response**: `/api/exam/student/questions` 와 동일 구조 (초기화된 문항 목록 반환)

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "(학생)심리검사 새로하기",
  "resultData": {
    "omrIdx": 5002,
    "dgnssQuesList": [
      { "NO": 1, "QESITM_NM": "나는 스스로 공부할 수 있다.", "answer": "", "fullCount": 119 }
    ],
    "page": {
      "size": 20,
      "number": 0,
      "totalElements": 119,
      "totalPages": 6
    },
    "stAnsCnt": 0
  }
}
```

---

## 9. 분석/대시보드 ❌ 신규 개발 예정

> 기존 `vcloudapi.vsaidt.com`의 분석 API 대체
> 기존 API 기준: `vlms-stat` EtcController / EtcService / EtcMapper

<a id="api-49"></a>
### GET `/api/meta/tc/analysis` (JWT) — 학급 평균 T점수

**Query Parameter**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `claId` | String | O | 학급 ID | `"eb1460dce8fc42889862e9a460beb4a0"` | |
| `paperIdx` | String | O | 지필 번호 | `"2"` | 기본값 `"2"` |
| `ordNo` | String | O | 회차 | `"1"` | 기본값 `"2"` |

**Response resultData** — `Object` (ordNo를 key로 한 회차별 분석 데이터)

> 응답 구조가 복잡합니다. ordNo를 key(`"1"`, `"2"`)로 하여 회차별 T점수 배열이 반환됩니다.
> 각 항목은 SECTION_ID 기반 38개 하위요인의 학급 평균 T점수입니다.

| 키 | 타입 | 설명 |
|----|------|------|
| `"1"` | Array | 1차 검사 분석 결과 |
| `"2"` | Array | 2차 검사 분석 결과 (있는 경우) |

**회차별 배열 항목**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `ord_no` | Integer | 회차 | `1` | |
| `SECTION_ID` | String | 요인 코드 | `"10-22-01-01-01-0"` | 38개 하위요인 코드 |
| `SECTION_NM` | String | 요인명 | `"자아존중감"` | |
| `DEPTH` | Integer | 요인 깊이 | `5` | 1~5, DEPTH=5가 최하위 요인 |
| `tScore` | Number | T점수 | `52` | 학급 평균, 기본값 50 |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "(교사) 대시보드 - 종합 분석",
  "resultData": {
    "1": [
      { "ord_no": 1, "SECTION_ID": "10-22-01-01-01-0", "SECTION_NM": "자아존중감", "DEPTH": 5, "tScore": 55 },
      { "ord_no": 1, "SECTION_ID": "10-22-01-01-02-0", "SECTION_NM": "자기효능감", "DEPTH": 5, "tScore": 62 },
      { "ord_no": 1, "SECTION_ID": "10-22-01-01-03-0", "SECTION_NM": "성장마인드셋", "DEPTH": 5, "tScore": 48 }
    ],
    "2": [
      { "ord_no": 2, "SECTION_ID": "10-22-01-01-01-0", "SECTION_NM": "자아존중감", "DEPTH": 5, "tScore": 57 }
    ]
  }
}
```

---

<a id="api-50"></a>
### GET `/api/meta/st/total/analysis` (JWT) — 학생 개인 T점수

**Query Parameter**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `stdtId` | String | O | 학생 ID | `"rrmath016-s1"` | |
| `paperIdx` | String | X | 지필 번호 | `"2"` | 기본값 `"2"` |
| `ordNo` | String | X | 회차 | `"1"` | 기본값 `"1"` |

**Response resultData** — `Object`

| 키 | 타입 | 설명 |
|----|------|------|
| `stUserInfo` | Object | 학생 기본 정보 |
| `"1"` | Array | 1차 검사 분석 결과 |
| `"2"` | Array | 2차 검사 분석 결과 (있는 경우) |

**stUserInfo**

| 필드 | 타입 | 설명 | 샘플 |
|------|------|------|------|
| `stdtId` | String | 학생 ID | `"rrmath016-s1"` |
| `eakStDt` | String | 제출일 | `"2026. 03. 18."` |
| `ordNo` | Integer | 회차 | `1` |
| `gender` | String | 성별 | `"남자"` |
| `grade` | String | 학년 | `"초등"` |
| `classCd` | String | 반 정보 | `"1반"` |
| `dgnssResultId` | Integer | 검사결과 PK | `12509` |

**회차별 배열 항목** (학급 분석과 동일 + 신뢰도 필드)

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `ord_no` | Integer | 회차 | `1` | |
| `SECTION_ID` | String | 요인 코드 | `"10-22-01-01-01-0"` | |
| `SECTION_NM` | String | 요인명 | `"자아존중감"` | |
| `DEPTH` | Integer | 요인 깊이 | `5` | |
| `tScore` | Number | T점수 | `55` | 개인 점수 |
| `reaction` | String | 반응성 | `null` | `주의` 또는 null |
| `desirable` | String | 바람직성 | `null` | `주의` 또는 null |
| `repeatResponse` | String | 반복응답 | `"N"` | `Y` \| `N` |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "(학생) 학습심리정서검사 결과보기",
  "resultData": {
    "stUserInfo": {
      "stdtId": "rrmath016-s1",
      "eakStDt": "2026. 03. 18.",
      "ordNo": 1,
      "gender": "남자",
      "grade": "초등",
      "classCd": "1반",
      "dgnssResultId": 12509
    },
    "1": [
      { "ord_no": 1, "SECTION_ID": "10-22-01-01-01-0", "SECTION_NM": "자아존중감", "DEPTH": 5, "tScore": 55, "reaction": null, "desirable": null, "repeatResponse": "N" },
      { "ord_no": 1, "SECTION_ID": "10-22-01-01-02-0", "SECTION_NM": "자기효능감", "DEPTH": 5, "tScore": 62, "reaction": null, "desirable": null, "repeatResponse": "N" }
    ]
  }
}
```

---

<a id="api-51"></a>
### GET `/api/dashboard` (JWT) — 교사 대시보드 통합

> 기존 API에는 없음. 프론트에서 `tc/info` + `tc/analysis` + `tc/need` + `tc/stinfolist` 개별 호출 조합.
> 신규 개발 시 통합 API로 제공 예정.

**Request**: 없음 (JWT에서 tcId 추출)

**Response**: 설계 미확정 — 기존 개별 API 응답을 조합한 통합 구조 예정

---

<a id="api-52"></a>
### GET `/api/class/{claId}/students` (JWT) — 학급 전체 학생 목록

> 기존 API에는 단독 엔드포인트 없음. `tc/stinfolist`에서 학생 목록 확인 가능.
> 신규 개발 시 독립 API로 제공 예정.

**Query Parameter**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `claId` | String | O | 학급 ID | `"eb1460dce8fc42889862e9a460beb4a0"` | |

**Response**: 설계 미확정

---

## 10. 검사 코드 (QR) ❌ 신규 개발 예정

> 프론트: localStorage(`exam_code_map`) → API 전환

<a id="api-53"></a>
### POST `/api/exam-code` (JWT) — 생성

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `code` | String | O | 검사 코드 | `"ABC123"` | QR코드로 변환 |
| `claId` | String | O | 학급 ID | `"abcd1234"` | |
| `dgnssId` | Long | O | 검사 PK | `100` | |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `code` | String | 검사 코드 | `"ABC123"` | |
| `claId` | String | 학급 ID | `"abcd1234"` | |
| `dgnssId` | Long | 검사 PK | `100` | |
| `createdAt` | String | 생성일시 | `"2026-03-17 10:00:00"` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "검사 코드 생성 완료",
  "resultData": {
    "code": "ABC123",
    "claId": "abcd1234",
    "dgnssId": 100,
    "createdAt": "2026-03-17 10:00:00"
  }
}
```

---

<a id="api-54"></a>
### GET `/api/exam-code/{code}` (JWT) — 조회

**Path Parameter**

| 파라미터 | 타입 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|
| `code` | String | 검사 코드 | `"ABC123"` | |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `code` | String | 검사 코드 | `"ABC123"` | |
| `claId` | String | 학급 ID | `"abcd1234"` | |
| `dgnssId` | Long | 검사 PK | `100` | |
| `createdAt` | String | 생성일시 | `"2026-03-17 10:00:00"` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "조회 완료",
  "resultData": {
    "code": "ABC123",
    "claId": "abcd1234",
    "dgnssId": 100,
    "createdAt": "2026-03-17 10:00:00"
  }
}
```

---

<a id="api-55"></a>
### PUT `/api/exam-code/{code}` (JWT) — 수정

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `claId` | String | X | 학급 ID | `"abcd1234"` | |
| `dgnssId` | Long | X | 검사 PK | `101` | |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `code` | String | 검사 코드 | `"ABC123"` | |
| `claId` | String | 학급 ID | `"abcd1234"` | |
| `dgnssId` | Long | 검사 PK | `101` | 수정된 값 |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "검사 코드 수정 완료",
  "resultData": {
    "code": "ABC123",
    "claId": "abcd1234",
    "dgnssId": 101
  }
}
```

---

<a id="api-56"></a>
### DELETE `/api/exam-code/{code}` (JWT) — 삭제

**Path Parameter**: `code` (String)

**Response**: resultData 없음 (성공 메시지만 반환)

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "검사 코드 삭제 완료"
}
```

---

## 11. PDF 업로드 ❌ 신규 개발 예정

> 프론트: localStorage → API 전환
> AI 처리 프로세스 상세: `docs/ai-process.md` 5번 항목

<a id="api-57"></a>
### POST `/api/upload` (JWT) — PDF 업로드 + AI 추출

**Request** — `multipart/form-data`

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `file` | File | O | PDF 파일 | | 최대 20MB, PDF만 허용 |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `uploadId` | Long | 업로드 PK | `1` | |
| `uploadedAt` | String | 업로드 일시 | `"2026-03-17 10:00:00"` | |
| `classCount` | Integer | 추출 학급 수 | `3` | |
| `studentCount` | Integer | 추출 학생 수 | `90` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "업로드 완료",
  "resultData": {
    "uploadId": 1,
    "uploadedAt": "2026-03-17 10:00:00",
    "classCount": 3,
    "studentCount": 90
  }
}
```

---

<a id="api-58"></a>
### GET `/api/upload/latest` (JWT) — 최근 업로드 데이터

**Request**: 없음

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `uploadId` | Long | 업로드 PK | `1` | |
| `uploadedAt` | String | 업로드 일시 | `"2026-03-17 10:00:00"` | |
| `rawData` | Object | 파싱된 PDF 데이터 | `{examInfo, classes}` | 38개 T점수 구조화 |
| `metadata` | Object | 메타데이터 | `{classCount, studentCount}` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "조회 완료",
  "resultData": {
    "uploadId": 1,
    "uploadedAt": "2026-03-17 10:00:00",
    "rawData": {
      "examInfo": { "name": "META 검사", "year": "2026", "school": "서울초", "grade": "el" },
      "classes": {}
    },
    "metadata": { "classCount": 3, "studentCount": 90 }
  }
}
```

---

## 12. 생기부 (School Record) ❌ 신규 개발 예정 — 1차 오픈 범위 아님

> 프론트: `schoolRecordService.ts` — API 코드 작성 완료
> **1차 오픈 범위에 포함되지 않음. 추후 개발 예정.**

<a id="api-59"></a>
### GET `/api/school-records/student/{studentId}` (JWT) — 조회

**Path Parameter**

| 파라미터 | 타입 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|
| `studentId` | String | 학생 ID | `"viva-s-00000001"` | |

**Response resultData** — `Array`

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `id` | String | 생기부 PK | `"1"` | |
| `studentId` | String | 학생 ID | `"viva-s-00000001"` | |
| `classId` | String | 학급 ID | `"abcd1234"` | |
| `category` | String | 카테고리 | `"comprehensive"` | `comprehensive` \| `learning` \| `personality` \| `socialSkills` \| `selfManagement` |
| `content` | String | 생기부 문구 | `"AI 생성 문구..."` | |
| `createdAt` | String | 생성일시 | `"2026-03-17 10:00:00"` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "조회 완료",
  "resultData": [
    {
      "id": "1",
      "studentId": "viva-s-00000001",
      "classId": "abcd1234",
      "category": "comprehensive",
      "content": "AI 생성 문구...",
      "createdAt": "2026-03-17 10:00:00"
    }
  ]
}
```

---

<a id="api-60"></a>
### POST `/api/school-records` (JWT) — 저장

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `stdtId` | String | O | 학생 ID | `"viva-s-00000001"` | |
| `category` | String | O | 카테고리 | `"comprehensive"` | 위 허용값 참고 |
| `content` | String | O | 문구 내용 | `"AI 생성 문구..."` | |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `id` | String | 생기부 PK | `"1"` | 생성된 레코드 ID |
| `stdtId` | String | 학생 ID | `"viva-s-00000001"` | |
| `category` | String | 카테고리 | `"comprehensive"` | |
| `content` | String | 저장된 문구 | `"AI 생성 문구..."` | |
| `createdAt` | String | 생성일시 | `"2026-03-17 10:00:00"` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "생기부 저장 완료",
  "resultData": {
    "id": "1",
    "stdtId": "viva-s-00000001",
    "category": "comprehensive",
    "content": "AI 생성 문구...",
    "createdAt": "2026-03-17 10:00:00"
  }
}
```

---

<a id="api-61"></a>
### DELETE `/api/school-records/{id}` (JWT) — 삭제

**Path Parameter**

| 파라미터 | 타입 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|
| `id` | String | 생기부 PK | `"1"` | |

**Response**: resultData 없음 (성공 메시지만 반환)

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "생기부 삭제 완료"
}
```

---

## 13. 이메일 초대 ❌ 신규 개발 예정

> 프론트: `groupService.ts` (Mock)

<a id="api-62"></a>
### POST `/group/invite/email` (JWT) — 초대 발송

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `groupId` | String | O | 그룹 ID | `"group-001"` | |
| `email` | String | O | 초대 대상 이메일 | `"invitee@test.com"` | |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `invitationId` | String | 초대 PK | `"inv-001"` | |
| `groupId` | String | 그룹 ID | `"group-001"` | |
| `email` | String | 초대 이메일 | `"invitee@test.com"` | |
| `status` | String | 상태 | `"sent"` | 발송 즉시 `sent` |
| `sentAt` | String | 발송일시 | `"2026-03-17 10:00:00"` | |
| `expiresAt` | String | 만료일시 | `"2026-03-24 10:00:00"` | 7일 |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "초대 발송 완료",
  "resultData": {
    "invitationId": "inv-001",
    "groupId": "group-001",
    "email": "invitee@test.com",
    "status": "sent",
    "sentAt": "2026-03-17 10:00:00",
    "expiresAt": "2026-03-24 10:00:00"
  }
}
```

---

<a id="api-63"></a>
### GET `/group/invite/list` (JWT) — 초대 목록

**Query Parameter**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `groupId` | String | O | 그룹 ID | `"group-001"` | |

**Response resultData** — `Array`

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `id` | String | 초대 PK | `"inv-001"` | |
| `groupId` | String | 그룹 ID | `"group-001"` | |
| `email` | String | 초대 이메일 | `"invitee@test.com"` | |
| `status` | String | 상태 | `"pending"` | `pending` \| `sent` \| `accepted` \| `expired` |
| `sentAt` | String | 발송일시 | `"2026-03-17 10:00:00"` | |
| `expiresAt` | String | 만료일시 | `"2026-03-24 10:00:00"` | 7일 |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "조회 완료",
  "resultData": [
    {
      "id": "inv-001",
      "groupId": "group-001",
      "email": "invitee@test.com",
      "status": "sent",
      "sentAt": "2026-03-17 10:00:00",
      "expiresAt": "2026-03-24 10:00:00"
    }
  ]
}
```

---

<a id="api-64"></a>
### DELETE `/group/invite/{invitationId}` (JWT) — 초대 취소

**Path Parameter**

| 파라미터 | 타입 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|
| `invitationId` | String | 초대 PK | `"inv-001"` | |

**Response**: resultData 없음 (성공 메시지만 반환)

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "초대 취소 완료"
}
```

---

## 14. AI 프록시 ❌ 신규 개발 예정

> 프론트: Gemini 직접 호출 (API Key 노출) → 백엔드 프록시 경유
> AI 프로세스 상세: `docs/ai-process.md`

<a id="api-65"></a>
### POST `/api/ai/generate` (JWT) — AI 텍스트 생성

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `feature` | String | O | 기능 구분 | `"student-analysis"` | `student-analysis` \| `school-record` \| `data-helper` \| `strategy` |
| `prompt` | String | O | 프롬프트 | `"학생 분석 요청..."` | |
| `context` | Object | X | 컨텍스트 데이터 | `{tScores, type, ...}` | 기능별 상이 |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `content` | String | AI 생성 텍스트 | `"분석 결과..."` | |
| `model` | String | 사용 모델 | `"gemini-2.5-flash"` | |
| `tokenUsage` | Integer | 토큰 사용량 | `1500` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "AI 생성 완료",
  "resultData": {
    "content": "이 학생은 자기효능감이 높은 편이에요. 학업에 대한 자신감이 있으며...",
    "model": "gemini-2.5-flash",
    "tokenUsage": 1500
  }
}
```

---

<a id="api-66"></a>
### POST `/api/ai/assistant` (JWT) — AI 교실 어시스턴트 (멀티턴)

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `mode` | String | O | 대화 모드 | `"class"` | `all` \| `class` \| `student` |
| `messages` | Array | O | 대화 이력 | `[{role, content}]` | `role`: `user` \| `assistant` |
| `context` | Object | X | RAG 컨텍스트 | `{claId, students}` | PII 별칭 처리된 데이터 |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `role` | String | 역할 | `"assistant"` | |
| `content` | String | AI 응답 | `"분석 결과..."` | 별칭 상태로 반환, 프론트에서 복원 |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "AI 응답 완료",
  "resultData": {
    "role": "assistant",
    "content": "student_A는 자기효능감이 높은 편이에요..."
  }
}
```

---

<a id="api-67"></a>
### POST `/api/ai/multimodal` (JWT) — PDF/이미지 AI 분석

**Request** — `multipart/form-data`

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `file` | File | O | PDF 또는 이미지 | | 최대 20MB |
| `prompt` | String | O | 분석 프롬프트 | `"T점수 추출..."` | |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `content` | String | AI 추출 결과 | `"{JSON...}"` | JSON 문자열 |
| `model` | String | 사용 모델 | `"gemini-2.5-flash"` | |
| `tokenUsage` | Integer | 토큰 사용량 | `5000` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "AI 분석 완료",
  "resultData": {
    "content": "{\"examInfo\":{\"name\":\"META 검사\"},\"classes\":{}}",
    "model": "gemini-2.5-flash",
    "tokenUsage": 5000
  }
}
```

---

## 프론트 연동 시 주의사항

### 날짜/시간 포맷

모든 API 응답의 날짜/시간 필드는 **공백 구분** 형식으로 통일:

```
yyyy-MM-dd HH:mm:ss   (예: 2026-03-17 14:30:00)
```

- ISO 8601의 `T` 구분자 사용하지 않음
- 타임존: `Asia/Seoul` (KST)
- 날짜만 있는 필드: `yyyy-MM-dd` (예: `2026-03-11`)

### Status 값 정의

**회원 (user.status)**

| 값 | 설명 |
|----|------|
| `ACTIVE` | 정상 활동 중 |
| `WITHDRAWN` | 회원 탈퇴 (자발적) |
| `SUSPENDED` | 관리자에 의해 정지 |

**그룹 멤버 (group_member.status)**

| 값 | 설명 |
|----|------|
| `ACTIVE` | 그룹 참여 중 |
| `LEFT` | 자발적 탈퇴 |
| `KICKED` | 교사에 의해 강퇴 |
| `ARCHIVED` | 학기/학년 종료 등으로 보관 처리 |

**상담 (counseling_info.status)**

| 값 | 설명 |
|----|------|
| `scheduled` | 예약됨 (기본값) |
| `completed` | 상담 완료 (요약/후속조치 입력) |
| `cancelled` | 상담 취소 |

**검사 (diagnosis.status)**

| 값 | 설명 |
|----|------|
| `진행` | 검사 진행 중 (학생 응답 가능) |
| `종료` | 검사 종료 (응답 마감) |
| `취소` | 검사 취소 |

**검사 결과 (diagnosis_result.status)**

| 값 | 설명 |
|----|------|
| `미제출` | 학생이 아직 응답하지 않음 |
| `제출완료` | 학생이 응답 완료 |

**초대 (invitation.status)**

| 값 | 설명 |
|----|------|
| `pending` | 초대 생성됨 (미발송) |
| `sent` | 이메일 발송 완료 |
| `accepted` | 초대 수락 (가입/참가 완료) |
| `expired` | 유효기간 만료 (7일) |

### 상담 경로 변경

```
/api/unified-counseling/* → /api/counseling/*
```

### 그룹 필드명 매핑

> 위 [5. 그룹](#5-그룹--필드명-매핑-필요) 매핑표 참고
