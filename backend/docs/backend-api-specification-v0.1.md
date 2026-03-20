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
| | **심리검사 (#35~#58)** | | | | | *별도 문서로 분리: `dgnss-api-spec.md` 참고* | |
| | **생기부 (School Record)** | | | | | *1차 오픈 범위 아님 · 프론트: API 코드 완료, 백엔드 미구현* | |
| 59 | 생기부 | GET | `/api/school-records/student/{studentId}` | 저장된 생기부 조회 | ❌ | 1차 오픈 범위 아님 | [이동](#api-59) |
| 60 | 생기부 | POST | `/api/school-records` | 생기부 저장 | ❌ | 1차 오픈 범위 아님 | [이동](#api-60) |
| 61 | 생기부 | DELETE | `/api/school-records/{id}` | 생기부 삭제 | ❌ | 1차 오픈 범위 아님 | [이동](#api-61) |
| | **이메일 초대** | | | | | *프론트: Mock, 백엔드 미구현* | |
| 62 | 초대 | POST | `/group/invite/email` | 이메일 초대 발송 | ❌ | | [이동](#api-62) |
| 63 | 초대 | GET | `/group/invite/list` | 초대 목록 조회 | ❌ | ?groupId=xxx | [이동](#api-63) |
| 64 | 초대 | DELETE | `/group/invite/{invitationId}` | 초대 취소 | ❌ | | [이동](#api-64) |

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
       │         └─ 심리검사 관련 → dgnss-api-spec.md 참고
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
| `stdtId` | 학생 ID | `/group/detail` | **학생별 API의 핵심 키** |
| `claId` | 학급(그룹) ID | `/group/list`, `/group/detail` | 그룹·분석의 핵심 키 |
| `groupId` | 그룹 PK | `/group/list` | |
| `memberId` | 그룹 멤버 PK | `/group/detail` | 강퇴·탈퇴 시 사용 |
| `inviteCode` | 초대코드 (6자리) | `/group/create`, `/group/detail` | 참가 시 사용 |

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
| `gender` | String | O | 성별 | `"M"` | `M` \| `F` |
| `roleCode` | String | X | 역할 코드 | `"TEACHER"` | 기본값 `TEACHER`. 허용값: `TEACHER` \| `STUDENT` |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `userNo` | Long | 회원 PK | `123` | AUTO_INCREMENT |
| `email` | String | 이메일 | `"test@test.com"` | |
| `nickname` | String | 닉네임 | `"테스터"` | |
| `gender` | String | 성별 | `"M"` | `M` \| `F` |
| `roleCode` | String | 역할 코드 | `"TEACHER"` | |

```json
// Request
{ "email": "test@test.com", "password": "Test1234!@", "nickname": "테스터", "gender": "M", "roleCode": "TEACHER" }

// Response resultData
{ "userNo": 123, "email": "test@test.com", "nickname": "테스터", "gender": "M", "roleCode": "TEACHER" }
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
| `gender` | String | 성별 | `"M"` | `M` \| `F`, 미등록 시 `null` |
| `roleCode` | String | 역할 코드 | `"TEACHER"` | |
| `tcId` | String | 교사 ID | `"a1b2c3d4e5f67890abcdef1234567890"` | 교사 역할만. UUID 32자리 |
| `stdtId` | String | 학생 ID | `null` | 학생 역할만. UUID 32자리 |
| `accessToken` | String | JWT Access Token | `"eyJ..."` | 단기 만료 |
| `refreshToken` | String | JWT Refresh Token | `"eyJ..."` | 14일 만료 |

```json
// Request
{ "email": "test@test.com", "password": "Test1234!@" }

// Response resultData
{
  "userNo": 123, "email": "test@test.com", "nickname": "테스터", "gender": "M",
  "roleCode": "TEACHER", "tcId": "a1b2c3d4e5f67890abcdef1234567890", "stdtId": null,
  "accessToken": "eyJ...", "refreshToken": "eyJ..."
}

// Error — Rate Limiting (5회 실패 시 5분 차단, application.yml에서 설정 가능)
{ "success": false, "resultCode": 400, "resultMessage": "로그인 시도 횟수를 초과했습니다. 5분 후 다시 시도해주세요." }
```

---

<a id="api-3"></a>
### POST `/member/token/refresh` — 토큰 갱신 (Public)

> **Refresh Token Rotation 방식**: 갱신 시 기존 refreshToken은 폐기되고 새 refreshToken이 발급됩니다.
> 프론트에서 응답의 새 refreshToken을 반드시 저장해야 합니다.

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `refreshToken` | String | O | Refresh Token | `"eyJ..."` | 만료 시 재로그인 필요 |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `accessToken` | String | 새 Access Token | `"eyJ..."` | |
| `refreshToken` | String | 새 Refresh Token | `"eyJ..."` | 기존 토큰은 폐기됨, 반드시 교체 저장 |

> **Grace Period**: 동시 요청 대응을 위해 교체된 토큰으로 10초 이내 재요청 시 동일 결과를 반환합니다.

```json
// Request
{ "refreshToken": "eyJ..." }

// Response
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "토큰 갱신 성공",
  "resultData": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
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
| `gender` | String | 성별 | `"M"` | `M` \| `F`, 미등록 시 `null` |
| `roleCode` | String | 역할 코드 | `"TEACHER"` | |
| `tcId` | String | 교사 ID | `"a1b2c3d4e5f67890abcdef1234567890"` | 교사만 |
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
    "gender": "M",
    "roleCode": "TEACHER",
    "tcId": "a1b2c3d4e5f67890abcdef1234567890",
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
| `studentId` | String | 학생 ID | `"f9e8d7c6b5a43210fedcba0987654321"` | `/group/detail` 멤버 목록에서 획득 |

**Response resultData** — `Array`

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `id` | String | 메모 PK | `"1"` | |
| `studentId` | String | 학생 ID | `"f9e8d7c6b5a43210fedcba0987654321"` | |
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
      "studentId": "f9e8d7c6b5a43210fedcba0987654321",
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
| `studentId` | String | O | 학생 ID | `"f9e8d7c6b5a43210fedcba0987654321"` | |
| `classId` | String | O | 학급 ID | `"abcd1234"` | |
| `date` | String | O | 관찰 날짜 | `"2026-03-11"` | yyyy-MM-dd |
| `category` | String | O | 카테고리 | `"behavior"` | `behavior` \| `academic` \| `social` \| `emotion` \| `other` |
| `content` | String | O | 내용 | `"수업 시간에 집중력이 좋았음"` | |
| `isImportant` | Boolean | X | 중요 여부 | `false` | 기본값 `false` |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `id` | String | 메모 PK | `"2"` | 생성된 메모 ID |
| `studentId` | String | 학생 ID | `"f9e8d7c6b5a43210fedcba0987654321"` | |
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
    "studentId": "f9e8d7c6b5a43210fedcba0987654321",
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
        { "id": "f9e8d7c6b5a43210fedcba0987654321", "name": "학생1", "number": 1, "classId": "abcd1234" }
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
| `studentId` | String | 학생 ID | `"f9e8d7c6b5a43210fedcba0987654321"` | |

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
| `id` | String | 학생 ID | `"f9e8d7c6b5a43210fedcba0987654321"` | stdtId |
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
      { "id": "f9e8d7c6b5a43210fedcba0987654321", "name": "학생1", "number": 1, "classId": "abcd1234" }
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
| `memberNo` | Integer | 출석번호 | `3` | 그룹 내 자동 채번 (MAX+1) |
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
    "memberNo": 3,
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
| `gender` | String | O | 성별 | `"M"` | `M` \| `F` |
| `email` | String | X | 이메일 | `"guest@test.com"` | |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `memberId` | Long | 멤버 PK | `9` | group_member.id |
| `memberNo` | Integer | 출석번호 | `4` | 그룹 내 자동 채번 (MAX+1) |
| `groupId` | Long | 그룹 PK | `1` | |
| `claId` | String | 학급 ID | `"a1b2c3d4..."` | |
| `groupNm` | String | 그룹명 | `"6학년 2반"` | |
| `stdtId` | String | 게스트 학생 ID | `"b2c3d4e5f6a78901bcdef23456789abc"` | 자동 생성 |
| `accessToken` | String | 임시 JWT | `"eyJ..."` | 게스트용 토큰 |
| `refreshToken` | String | Refresh Token | `"eyJ..."` | |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "게스트 참가 완료",
  "resultData": {
    "memberId": 9,
    "memberNo": 4,
    "groupId": 1,
    "claId": "a1b2c3d4...",
    "groupNm": "6학년 2반",
    "stdtId": "b2c3d4e5f6a78901bcdef23456789abc",
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
| `stdtId` | String | 학생 ID | `"f9e8d7c6b5a43210fedcba0987654321"` | 학생별 API 호출에 사용 |
| `nickname` | String | 닉네임 | `"학생1"` | |
| `gender` | String | 성별 | `"M"` | `M` \| `F` |
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
        "stdtId": "f9e8d7c6b5a43210fedcba0987654321",
        "nickname": "학생1",
        "gender": "M",
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
| `stdtId` | String | 게스트 학생 ID | `"b2c3d4e5f6a78901bcdef23456789abc"` | |
| `nickname` | String | 게스트 닉네임 | `"게스트이름"` | |
| `gender` | String | 성별 | `"M"` | `M` \| `F` |
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
      "stdtId": "b2c3d4e5f6a78901bcdef23456789abc",
      "nickname": "게스트이름",
      "gender": "M",
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
| `guestStdtId` | String | O | 게스트 학생 ID | `"b2c3d4e5f6a78901bcdef23456789abc"` | |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `userNo` | Long | 회원 PK | `456` | 전환 후 정식 회원 PK |
| `email` | String | 이메일 | `"guest@test.com"` | |
| `stdtId` | String | 학생 ID | `"f9e8d7c6b5a43210fedcba0987654321"` | 기존 회원의 stdtId로 통합 |
| `mergedCount` | Integer | 합산된 검사 수 | `2` | mergeYn=Y일 때만 |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "게스트 전환 완료",
  "resultData": {
    "userNo": 456,
    "email": "guest@test.com",
    "stdtId": "f9e8d7c6b5a43210fedcba0987654321",
    "mergedCount": 2
  }
}
```

---

## 7~11. 심리검사 관련 API — 별도 문서 분리

> 검사 관리(교사/학생), 분석/대시보드, 검사코드(QR), PDF 업로드 관련 API(#35~#58)는
> **[dgnss-api-spec.md](dgnss-api-spec.md)** 에서 관리합니다.

---

## 12. 생기부 (School Record) ❌ 신규 개발 예정 — 1차 오픈 범위 아님

> 프론트: `schoolRecordService.ts` — API 코드 작성 완료
> **1차 오픈 범위에 포함되지 않음. 추후 개발 예정.**

<a id="api-59"></a>
### GET `/api/school-records/student/{studentId}` (JWT) — 조회

**Path Parameter**

| 파라미터 | 타입 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|
| `studentId` | String | 학생 ID | `"f9e8d7c6b5a43210fedcba0987654321"` | |

**Response resultData** — `Array`

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `id` | String | 생기부 PK | `"1"` | |
| `studentId` | String | 학생 ID | `"f9e8d7c6b5a43210fedcba0987654321"` | |
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
      "studentId": "f9e8d7c6b5a43210fedcba0987654321",
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
| `stdtId` | String | O | 학생 ID | `"f9e8d7c6b5a43210fedcba0987654321"` | |
| `category` | String | O | 카테고리 | `"comprehensive"` | 위 허용값 참고 |
| `content` | String | O | 문구 내용 | `"AI 생성 문구..."` | |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `id` | String | 생기부 PK | `"1"` | 생성된 레코드 ID |
| `stdtId` | String | 학생 ID | `"f9e8d7c6b5a43210fedcba0987654321"` | |
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
    "stdtId": "f9e8d7c6b5a43210fedcba0987654321",
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
