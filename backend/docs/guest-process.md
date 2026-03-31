# 게스트 검사 응시 프로세스

> 게스트(비회원)가 QR/URL/초대코드로 접속하여 검사를 응시하기까지의 전체 프로세스 및 API 명세
> **인증**: 토큰 불필요 API는 `(Public)`, 토큰 필요 API는 `(JWT)` 로 표기
> **공통 응답**:
> ```json
> { "success": true, "resultCode": 200, "resultMessage": "...", "resultData": { ... } }
> ```
> **작성일**: 2026-03-27

---

## 1. 프로세스 흐름

```
게스트가 QR/URL/초대코드로 접속
         │
     이메일 입력
         │
  GET /guest/exists (Public, 토큰 불필요)
  → 해당 그룹에 이 이메일로 참가한 게스트가 있는지 확인
         │
  ┌──────┴──────┐
  │             │
 신규           기존 게스트
(exists:false) (exists:true)
  │             │
  │         토큰 유효한가?
  │          ┌──┴──┐
  │         Yes    No
  │          │      │
  │    토큰 갱신   이메일 인증
  │    (아래 2번)   │
  │             POST /guest/auth (Public, 토큰 불필요)
  │             → accessToken + refreshToken 발급
  │                    │
 이메일 인증            │
 + 닉네임/성별 입력     │
  │                    │
 POST /group/join-guest (Public, 토큰 불필요)
 → accessToken + refreshToken 발급
  │                    │
  └──────┬─────────────┘
         │
     검사 응시 (JWT 필요)
         │
  ┌──────┴──────┐
  │             │
 14일 이내      14일 이후
 재접속         재접속
  │             │
 POST /member/token/refresh    refreshToken 만료
 (Public, refreshToken body전달) → 위 "기존 게스트" 흐름으로
 → 새 accessToken 발급
 (이메일 인증 불필요)
```

---

## 2. API 호출 순서

### 2-1. 신규 게스트 (첫 참가)

| 순서 | API | 토큰 | 설명 |
|:---:|:---|:---:|:---|
| ① | `GET /guest/exists?inviteCode=xxx&email=xxx` | 불필요 | 기존 참가 여부 확인 → `exists: false` |
| ② | `POST /member/send-code` | 불필요 | 이메일 인증코드 발송 |
| ③ | `POST /member/verify-code` | 불필요 | 인증코드 확인 |
| ④ | `POST /group/join-guest` | 불필요 | 그룹 참가 + 토큰 발급 |
| ⑤ | 검사 API 호출 (`/api/dgnss/*`) | **필요** | ④에서 받은 accessToken 사용 |

### 2-2. 기존 게스트 (재접속, 토큰 유효 — 14일 이내)

| 순서 | API | 토큰 | 설명 |
|:---:|:---|:---:|:---|
| ① | `POST /member/token/refresh` | 불필요 | refreshToken을 body로 전달 → 새 accessToken 발급 |
| ② | 검사 API 호출 (`/api/dgnss/*`) | **필요** | ①에서 받은 accessToken 사용 |

### 2-3. 기존 게스트 (재접속, 토큰 만료 — 14일 이후)

| 순서 | API | 토큰 | 설명 |
|:---:|:---|:---:|:---|
| ① | `GET /guest/exists?inviteCode=xxx&email=xxx` | 불필요 | 기존 참가 여부 확인 → `exists: true` |
| ② | `POST /member/send-code` | 불필요 | 이메일 인증코드 발송 |
| ③ | `POST /member/verify-code` | 불필요 | 인증코드 확인 |
| ④ | `POST /guest/auth` | 불필요 | 게스트 재인증 → 토큰 재발급 |
| ⑤ | 검사 API 호출 (`/api/dgnss/*`) | **필요** | ④에서 받은 accessToken 사용 |

---

## 3. 신규 API 상세

### 3-1. GET `/guest/exists` (Public) — 게스트 참가 여부 확인

> 해당 그룹에 이 이메일로 참가한 게스트가 있는지 확인. 프론트에서 신규/기존 분기에 사용.

**Query Parameter**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `inviteCode` | String | O | 그룹 초대코드 | `"ABC123"` | 6자리 |
| `email` | String | O | 게스트 이메일 | `"guest@test.com"` | |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `exists` | Boolean | 참가 여부 | `true` | |
| `groupNm` | String | 그룹명 | `"6학년 2반"` | 초대코드가 유효할 때만 |
| `claId` | String | 학급 ID | `"a1b2c3d4..."` | 초대코드가 유효할 때만 |

**응답 예시 — 기존 게스트**

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "게스트 참가 여부 확인",
  "resultData": {
    "exists": true,
    "groupNm": "6학년 2반",
    "claId": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
  }
}
```

**응답 예시 — 신규 게스트**

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "게스트 참가 여부 확인",
  "resultData": {
    "exists": false,
    "groupNm": "6학년 2반",
    "claId": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
  }
}
```

**에러 케이스**

| 상황 | resultCode | resultMessage |
|------|:---:|:---|
| inviteCode 누락 | 400 | inviteCode는 필수입니다 |
| email 누락 | 400 | email은 필수입니다 |
| 유효하지 않은 초대코드 | 400 | 유효한 초대코드가 아닙니다 |

---

### 3-2. POST `/guest/auth` (Public) — 게스트 재인증

> 기존 게스트가 토큰 만료 후 재접속 시 사용. 이메일 인증 완료 후 호출.
> accessToken + refreshToken을 재발급받아 검사에 진입.

**Request Body**

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `inviteCode` | String | O | 그룹 초대코드 | `"ABC123"` | 6자리 |
| `email` | String | O | 게스트 이메일 | `"guest@test.com"` | 이메일 인증 완료 상태여야 함 |

**Response resultData**

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `stdtId` | String | 게스트 학생 ID | `"viva-s-02adfd05"` | 기존 참가 시 발급된 ID |
| `claId` | String | 학급 ID | `"a1b2c3d4..."` | |
| `groupNm` | String | 그룹명 | `"6학년 2반"` | |
| `email` | String | 이메일 | `"guest@test.com"` | |
| `accessToken` | String | Access Token | `"eyJ..."` | 게스트용 JWT |
| `refreshToken` | String | Refresh Token | `"eyJ..."` | 14일 유효 |

**응답 예시**

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "게스트 재인증 완료",
  "resultData": {
    "stdtId": "viva-s-02adfd05",
    "claId": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
    "groupNm": "6학년 2반",
    "email": "guest@test.com",
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**에러 케이스**

| 상황 | resultCode | resultMessage |
|------|:---:|:---|
| inviteCode 누락 | 400 | inviteCode는 필수입니다 |
| email 누락 | 400 | email은 필수입니다 |
| 이메일 미인증 | 400 | 이메일 인증이 필요합니다 |
| 유효하지 않은 초대코드 | 400 | 유효한 초대코드가 아닙니다 |
| 해당 그룹에 게스트 없음 | 400 | 해당 그룹에 참가한 게스트 기록이 없습니다 |

---

## 4. 기존 API 변경사항

### 4-1. POST `/group/join-guest` (Public) — 응답에 토큰 추가

> 기존 응답에 `accessToken`, `refreshToken` 필드가 추가됨

**Request Body** (변경 없음)

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `inviteCode` | String | O | 초대코드 | `"ABC123"` | |
| `nickname` | String | O | 게스트 이름 | `"게스트이름"` | |
| `gender` | String | O | 성별 | `"M"` | `M` \| `F` |
| `email` | String | O | 이메일 | `"guest@test.com"` | 이메일 인증 완료 상태 |

**Response resultData** (토큰 필드 추가)

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `memberId` | Long | 멤버 PK | `9` | group_member.id |
| `memberNo` | Integer | 출석번호 | `4` | 그룹 내 자동 채번 |
| `groupId` | Long | 그룹 PK | `1` | |
| `claId` | String | 학급 ID | `"a1b2c3d4..."` | |
| `groupNm` | String | 그룹명 | `"6학년 2반"` | |
| `stdtId` | String | 게스트 학생 ID | `"viva-s-02adfd05"` | 자동 생성 |
| `accessToken` | String | Access Token | `"eyJ..."` | **신규 추가** |
| `refreshToken` | String | Refresh Token | `"eyJ..."` | **신규 추가**, 14일 유효 |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "게스트 참가 완료",
  "resultData": {
    "memberId": 9,
    "memberNo": 4,
    "groupId": 1,
    "claId": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
    "groupNm": "6학년 2반",
    "stdtId": "viva-s-02adfd05",
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### 4-2. POST `/member/token/refresh` (Public) — 게스트 토큰 갱신 지원

> 기존 회원 토큰 갱신과 동일한 엔드포인트. 게스트 refreshToken도 처리 가능하도록 확장.

**Request Body** (변경 없음)

| 파라미터 | 타입 | 필수 | 설명 | 샘플 | 비고 |
|---------|------|------|------|------|------|
| `refreshToken` | String | O | Refresh Token | `"eyJ..."` | |

**Response resultData** (게스트인 경우)

| 필드 | 타입 | 설명 | 샘플 | 비고 |
|------|------|------|------|------|
| `accessToken` | String | 새 Access Token | `"eyJ..."` | |
| `refreshToken` | String | 새 Refresh Token | `"eyJ..."` | Rotation 방식 |

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "토큰 갱신 완료",
  "resultData": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

## 5. 게스트 JWT 토큰 구조

### 회원 토큰 (기존)

| claim | 설명 | 샘플 |
|-------|------|------|
| `tokenType` | 토큰 유형 | `"MEMBER"` |
| `userNo` | 회원 PK | `456` |
| `email` | 이메일 | `"user@test.com"` |
| `userSeCd` | 사용자 구분 | `"T"` / `"S"` |
| `timestamp` | 발급 시각 | `"2026-03-27 09:00:00.000"` |

### 게스트 토큰 (신규)

| claim | 설명 | 샘플 |
|-------|------|------|
| `tokenType` | 토큰 유형 | `"GUEST"` |
| `stdtId` | 게스트 학생 ID | `"viva-s-02adfd05"` |
| `claId` | 학급 ID | `"a1b2c3d4..."` |
| `email` | 이메일 | `"guest@test.com"` |
| `timestamp` | 발급 시각 | `"2026-03-27 09:00:00.000"` |

### 토큰 유효기간

| 토큰 | 유효기간 |
|------|---------|
| accessToken | 30분 |
| refreshToken | 14일 |

---

## 6. DB 변경사항

### refresh_token 테이블 수정

```sql
ALTER TABLE refresh_token
    DROP FOREIGN KEY fk_rt_user,
    MODIFY user_no BIGINT NULL,
    ADD stdt_id VARCHAR(64) NULL COMMENT '게스트 학생 ID',
    ADD INDEX idx_rt_stdt (stdt_id);
```

| 변경 | 내용 | 사유 |
|------|------|------|
| `user_no` | NOT NULL → NULL | 게스트는 user 레코드 없음 |
| `stdt_id` | 컬럼 추가 | 게스트 식별용 |
| `fk_rt_user` | FK 제거 | NULL 허용으로 FK 유지 불가 |

**저장 규칙:**
- 회원: `user_no` 채움, `stdt_id` NULL
- 게스트: `user_no` NULL, `stdt_id` 채움

---

## 7. 참고 — 기존 API (이메일 인증)

게스트 프로세스에서 사용하는 이메일 인증 API는 기존과 동일합니다.

### POST `/member/send-code` (Public) — 인증코드 발송

| 파라미터 | 타입 | 필수 | 설명 | 샘플 |
|---------|------|------|------|------|
| `email` | String | O | 이메일 | `"guest@test.com"` |

### POST `/member/verify-code` (Public) — 인증코드 확인

| 파라미터 | 타입 | 필수 | 설명 | 샘플 |
|---------|------|------|------|------|
| `email` | String | O | 이메일 | `"guest@test.com"` |
| `code` | String | O | 6자리 인증코드 | `"123456"` |
