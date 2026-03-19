# 신규 학습심리정서검사 플랫폼 - 회원 DB 설계서 v3

> **최종 수정일**: 2026-03-17
> **기반 문서**: member-final-db.md (v1, 2026-03-09) → member-final-db_v2.md (v2, 2026-03-16)
> **주요 변경**: userId(VARCHAR PK) 제거, user_no(BIGINT AUTO_INCREMENT) PK 도입, email 로그인 식별자, FK user_id→user_no, audit 컬럼 BIGINT(0=system)
> **상태**: 구현 완료 (aidt_lms 동기화 제외)

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1 | 2026-03-09 | 초안 (행위 기반 역할, lazy 채번) |
| v2 | 2026-03-12 | 가입 시 역할 확정 + 권한 그룹 체계 도입 |
| v2.1 | 2026-03-15 | **현행화** — 구현 완료 내용 반영, email_verification 테이블 추가, 비밀번호 정책/JWT 상세 추가, 관리자 사이트 구현 완료 반영 |
| v2.2 | 2026-03-16 | **refresh_token 테이블 추가** — refreshToken DB 관리, accessToken 30분 단축, 로그아웃/계정정지 시 즉시 차단 |
| v3 | 2026-03-17 | **userId→user_no 마이그레이션** — userId(VARCHAR PK) 제거, user_no(BIGINT AUTO_INCREMENT) PK 도입, email 로그인 식별자, FK user_id→user_no, audit 컬럼 BIGINT(0=system) |

### v1 → v2 변경 요약

| # | 변경 항목 | v1 (기존) | v2 (변경) |
|---|----------|----------|----------|
| 1 | 역할 결정 방식 | 행위 기반 (그룹 생성=방장, 참가=플레이어) | **가입 시 교사/학생 선택** |
| 2 | tc_id 채번 | 최초 그룹 생성 시 lazy 채번 | **가입 시 즉시 채번** (GroupService에 lazy fallback 존재) |
| 3 | stdt_id 채번 | 최초 그룹 참가 시 lazy 채번 | **가입 시 즉시 채번** (GroupService에 lazy fallback 존재) |
| 4 | 복수 역할 | 가능 (동일인 방장+플레이어) | **불가 (가입 시 고정)** |
| 5 | 권한 체계 | 없음 (방장/참가자 2단계) | **4단계 (학생→교사→교장→장학사) + 관리자** |
| 6 | 학교 관리 | 자유 입력 (school_name) | **학교코드 기반 관리 (school_info 테이블)** |
| 7 | 이메일 인증 | 없음 | **가입/게스트 참가 시 이메일 인증 필수** |
| 8 | 관리자 사이트 | 없음 | **구현 완료 (사용자/역할/학교 관리)** |
| 9 | 신규 테이블 | - | role_group, school_info, auth_school_map, email_verification |

---

## 1. 플랫폼 구조 및 회원 정책

### 1.1 플랫폼 구조

```
┌─────────────────────────────────────────┐
│          통합 로그인 (UNIFIED LOGIN)       │
│   가입: 이메일인증 + 이메일 + 비밀번호       │
│         + 닉네임 + 역할 선택(교사/학생)     │
└──────────────────┬──────────────────────┘
                   │
       ┌───────────┼───────────┬──────────────┐
       ▼           ▼           ▼              ▼
  학습심리검사   매스캔버스     게임        ... 등 nn개
  (교사/학생)
```

- 통합 로그인에서 `user_no` 자동 발급 (이메일 인증 → 이메일 + 비밀번호 + 닉네임 + **역할 선택**)
- 동일 `user_no`/`email`이 서비스별로 다른 역할 가능

### 1.2 역할 결정 방식

```
역할 결정 시점: 회원가입 시 교사(TEACHER) 또는 학생(STUDENT) 선택
역할 저장 위치: user.role_code
역할 범위:      계정 단위로 고정, 복수 역할 불가

예시:
  교사 A = 그룹1의 방장 + 그룹2의 방장 (교사는 항상 방장)
  학생 B = 그룹1의 참가자 + 그룹3의 참가자 (학생은 항상 참가자)
  교장 C = 교사에서 승격, 관할 학교 전체 조회 가능

※ 동일인이 방장+플레이어를 겸하는 것은 불가
```

### 1.3 회원 유형

| 유형 | 설명 | 가입/승격 | 기존 API 매핑 |
|------|------|----------|--------------|
| **학생(STUDENT)** | 그룹에 참가하여 검사 응시 | 가입 시 선택 | `stdtId` |
| **교사(TEACHER)** | 그룹을 만들고 검사를 관리 | 가입 시 선택 | `tcId` |
| **교장(PRINCIPAL)** | 학교 내 전체 그룹/교사 조회 | 교사에서 관리자 승격 | `tcId` (교사 기반) |
| **장학사(SUPERINTENDENT)** | 관할 학교 전체 조회 | 교사에서 관리자 승격 | `tcId` (교사 기반) |
| **게스트(GUEST)** | 비가입 참가자 (이메일인증+닉네임만) | 가입 불필요 | `stdtId` + Guest 플래그 |
| **관리자(ADMIN)** | 시스템 관리 | 관리자 사이트에서 생성 | `tcId` (관리자 기반) |

### 1.4 권한 계층

```
level 99: ADMIN (관리자)          ← 시스템 전체 관리, 관리자 사이트 접근
level  4: SUPERINTENDENT (장학사) ← 관할 학교 전체 조회 (복수 학교)
level  3: PRINCIPAL (교장)        ← 학교 내 전체 그룹 조회
level  2: TEACHER (교사)          ← 본인 그룹만 관리
level  1: STUDENT (학생)          ← 본인 참가 그룹만 조회

※ 상위 level은 하위 level의 권한을 포함
※ 교장/장학사는 교사 기능(그룹 생성, 검사 관리)도 수행 가능
※ 관리자 사이트 접근: level >= 99 필요
```

### 1.5 그룹(방) 정책

- **생성**: TEACHER 이상만 가능 (STUDENT, GUEST 불가)
- **참가**: STUDENT, GUEST만 가능
- **초대 방식**: 초대 코드 직접 입력 (6자리 대문자)
- **권한 매트릭스**:

| 권한 | 학생 | 교사(방장) | 교장 | 장학사 |
|------|:----:|:--------:|:----:|:------:|
| 그룹 생성 | - | O | O | O |
| 그룹 정보 수정 | - | O (본인) | O (관할) | O (관할) |
| 멤버 초대/강퇴 | - | O (본인) | O (관할) | O (관할) |
| 검사 생성/시작 | - | O | O | O |
| 결과 조회 (본인) | O | - | - | - |
| 결과 조회 (그룹 전체) | - | O (본인) | O (관할) | O (관할) |
| 학교 내 전체 그룹 조회 | - | - | O | O |
| 관할 학교 전체 조회 | - | - | - | O |
| 그룹 삭제 | - | O (본인) | O (관할) | O (관할) |
| 그룹 탈퇴 | O | - | - | - |

### 1.6 학교 기반 접근 범위

```
역할별 그룹 조회 범위:

STUDENT (level 1)
  └─ 본인이 참가한 그룹만
     WHERE group_member.user_no = ?

TEACHER (level 2)
  └─ 본인이 만든 그룹 + 본인이 참가한 그룹
     WHERE group_info.host_user_no = ? OR group_member.user_no = ?

PRINCIPAL (level 3)
  └─ 매핑된 학교의 전체 그룹
     WHERE group_info.school_code IN (
       SELECT school_code FROM auth_school_map
       WHERE user_no = ? AND status = 'ACTIVE'
     )

SUPERINTENDENT (level 4)
  └─ 매핑된 학교들의 전체 그룹 (복수 학교)
     WHERE group_info.school_code IN (
       SELECT school_code FROM auth_school_map
       WHERE user_no = ? AND status = 'ACTIVE'
     )
     ※ PRINCIPAL과 쿼리 동일, 매핑된 학교 수만 다름

ADMIN (level 99)
  └─ 관리자 사이트에서 전체 관리
```

### 1.7 가입 & 전환 플로우

```
1. 게스트로 응시 (이메일인증: abc@gmail.com)
       ↓
2. 나중에 회원가입 (동일 이메일, 학생 역할 선택)
       ↓
3. 연동 확인 안내: "이 이메일로 응시한 기록이 있어요"
       ↓
4. Yes → 기존 결과 합산 / No → 새 계정으로 시작
```

### 1.8 승격 플로우 (구현 완료)

```
1. 교사로 가입 (role_code = TEACHER)
       ↓
2. 관리자 사이트에서 교장으로 승격
       ├─ UPDATE user SET role_code = 'PRINCIPAL'
       └─ INSERT INTO auth_school_map (user_no, school_code)
       ↓
3. 해당 학교의 전체 그룹 조회 가능

※ 관리자 사이트에서 직접 모든 역할의 계정 생성 가능 (구현 완료)
```

---

## 2. 확정 정책 및 구현 현황

| # | 항목 | 결정 내용 | 구현 |
|---|------|----------|:----:|
| 1 | 역할 결정 방식 | **가입 시 선택**. 교사(TEACHER) 또는 학생(STUDENT). 복수 역할 불가 | O |
| 2 | stdt_id 정책 | **학생 가입 시 즉시 채번**. user 테이블에서 관리, group_member에 복사 (비정규화) | O |
| 3 | tc_id 정책 | **교사 가입 시 즉시 채번**. user 테이블에서 관리 | O |
| 4 | 교장/장학사 | **교사에서 관리자 승격**. 관할 학교코드 매핑으로 접근 범위 관리 | O |
| 5 | 게스트 중복 참가 | **차단**. 같은 이메일로 같은 그룹 재참가 시 기존 참가 정보로 연결 | O |
| 6 | 학교급 | **그룹당 고정**. 같은 그룹 내 학교급 변경 불가. 다른 학교급 검사는 새 그룹 생성 | O |
| 7 | 그룹 최대 인원 | **그룹 생성 시 방장이 지정** (max_member_count, 기본값 40) | O |
| 8 | 게스트 회원전환 결과 | **사용자가 합산 여부 선택** (merge_yn) | △ (테이블만 존재) |
| 9 | 그룹 생성 수 | **제한 없음** (TEACHER 이상만 생성 가능) | O |
| 10 | 교사의 학생 참가 | **불가** (역할 고정) | O |
| 11 | 이메일 인증 | **가입/게스트참가 시 필수** (6자리 코드, 5분 TTL) | O |
| 12 | 비밀번호 정책 | **10~64자, 2종 이상 문자 조합, 연속 4자 금지, email 포함 금지** | O |
| 13 | 관리자 사이트 | **사용자/역할/학교 CRUD, 세션 기반 Form Login** | O |
| 14 | JWT 인증 | **API: accessToken 12h + refreshToken 14d, HS256** | O |
| 15 | aidt_lms 동기화 | 회원 인입 시 기존 DB 동기화 | **미구현** |

---

## 3. 인증 & 보안

### 3.1 이중 보안 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                       SecurityConfig                                 │
│                                                                     │
│  ① Admin Chain (/admin/**)          ② API Chain (그 외)              │
│  ┌───────────────────┐              ┌────────────────────────────┐  │
│  │ Session 기반        │              │ JWT Stateless               │  │
│  │ Form Login         │              │ JwtAuthenticationFilter     │  │
│  │ ROLE_ADMIN 필요     │              │ Bearer 토큰                  │  │
│  │ (level >= 99)      │              │                             │  │
│  └───────────────────┘              └────────────────────────────┘  │
│                                                                     │
│  permitAll:                                                         │
│   /admin/login, /static/**, /member/signup, /member/login,         │
│   /member/send-code, /member/verify-code, /group/join-guest,       │
│   /school/import, /swagger-ui/**, /api-docs/**                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 JWT 토큰

| 항목 | 값 |
|------|-----|
| 알고리즘 | HS256 (HMAC-SHA256) |
| Secret | 환경변수 `META_API_JWT_SECRET` |
| Access Token 만료 | 30분 (1,800,000ms) |
| Refresh Token 만료 | 14일 (1,209,600,000ms) |

**토큰 Claim 구조:**

```json
{
  "userNo": 1,
  "userSeCd": "T",
  "timestamp": "2026-03-15 10:30:00.000",
  "sub": "1",
  "iat": 1742024400,
  "exp": 1742067600
}
```

| Claim | 설명 |
|-------|------|
| `userNo` | 회원 번호 (user.user_no) |
| `userSeCd` | 사용자 구분 (`T`=교사(tcId 보유), `S`=학생) |
| `timestamp` | 토큰 발급 시각 (yyyy-MM-dd HH:mm:ss.SSS) |

### 3.3 비밀번호 정책

> 구현 위치: `com.vs.meta.common.utils.PasswordValidator`

| 규칙 | 조건 |
|------|------|
| 최소 길이 | 10자 이상 |
| 최대 길이 | 64자 이하 |
| 문자 조합 | 영문 대문자, 소문자, 숫자, 특수문자 중 **2가지 이상** |
| 연속 문자 | 동일 문자 **4회 이상** 연속 사용 금지 (예: `aaaa` 불가) |
| email 포함 | 비밀번호에 email 포함 불가 (대소문자 무시) |
| 흔한 비밀번호 | `password`, `123456`, `qwerty` 등 블랙리스트 차단 |
| 허용 문자 | 영문 + 숫자 + 특수문자(`!@#$%^&*()_+-=[]{}:'",./<>?\|`) |

### 3.4 이메일 인증 플로우

```
[1] 인증코드 발송 (POST /member/send-code)
    ├─ 1분 재발송 쿨다운 체크
    ├─ 6자리 랜덤 코드 생성
    ├─ 이전 미인증 레코드 삭제
    ├─ INSERT email_verification (expires_at = NOW() + 5분)
    └─ NCP Cloud Outbound Mailer로 메일 발송

[2] 인증코드 확인 (POST /member/verify-code)
    ├─ 이메일로 최신 레코드 조회
    ├─ 코드 일치 + 미만료 + 미인증 상태 확인
    └─ UPDATE verified = true

[3] 인증 소비 (가입 또는 게스트 참가 성공 시)
    └─ DELETE FROM email_verification WHERE email = ?
       ※ 동일 인증으로 중복 가입 방지
```

**인증 필수 시점:**

| 시점 | 필수 여부 | 비고 |
|------|:--------:|------|
| 일반 회원가입 | O | 가입 전 이메일 인증 완료 필요 |
| 게스트 그룹 참가 | O | 참가 전 이메일 인증 완료 필요 |
| 관리자 계정 생성 | **X** | 관리자가 직접 생성 시 인증 스킵 |

---

## 4. 기존 API 파라미터 매핑

### 4.1 핵심 파라미터 변환

| 파라미터 | 기존 시스템 | 신규 플랫폼 | 매핑 전략 |
|---------|-----------|-----------|---------|
| `tcId` | 시스템 기존 교사 ID | `user.tc_id` | **교사 가입 시 즉시 채번** |
| `stdtId` | 시스템 기존 학생 ID | `user.stdt_id` (회원) / `group_member.stdt_id` (게스트) | **학생 가입 시 즉시 채번**, 게스트는 참가마다 새 채번 |
| `claId` | 기존 학급 ID | `group_info.cla_id` | 그룹 생성 시 자동 채번 |
| `grade` | grade 파라미터 (el/mi/hi) | `group_info.school_level` → 변환 | school_level에서 el/mi/hi로 자동 변환 |
| `ordNo` | 회차 (1, 2, 3) | 동일 | 기존 로직 그대로 |
| `paperIdx` | 시험지 종류 (1, 2) | 동일 | 기존 로직 그대로 |

### 4.2 ID 채번 규칙

```
tcId   : "viva-t-{UUID 8자리}"     예) viva-t-a1b2c3d4
stdtId : "viva-s-{UUID 8자리}"     예) viva-s-e5f6g7h8
claId  : "{UUID 32자리}"           예) eb1460dce8fc42889862e9a460beb4a0
```

**채번 시점 상세:**

| ID | 일반 가입 | 관리자 생성 | GroupService fallback |
|----|:--------:|:---------:|:--------------------:|
| tcId | TEACHER 선택 시 즉시 | TEACHER/PRINCIPAL/SUPERINTENDENT/ADMIN → 즉시 | 그룹 생성 시 null이면 채번 |
| stdtId | STUDENT 선택 시 즉시 | STUDENT → 즉시 | 그룹 참가 시 null이면 채번 |
| claId | - | - | 그룹 생성 시 UUID 채번 |

> GroupService의 lazy fallback은 안전장치 — 정상 플로우에서는 가입 시 즉시 채번됨

---

## 5. 테이블 설계

### 5.1 ERD

```
┌─────────────────────┐
│  role_group          │
│  (권한 그룹 마스터)    │
├─────────────────────┤
│ role_code (PK)      │
│ role_name           │
│ level (UK)          │
│ description         │
│ created_by          │
│ created_at          │
└────────┬────────────┘
         │ FK
         ▼
┌──────────────────────────┐
│       user (회원)          │
├──────────────────────────┤
│ user_no (PK, AUTO_INCREMENT, BIGINT) │
│ email (UK, 로그인 식별자) │
│ password (BCrypt)        │
│ nickname                 │
│ role_code (FK)           │  ← TEACHER / STUDENT (가입 시 선택)
│ tc_id (UK, NULL)         │  ← TEACHER: 가입 시 즉시 채번
│ stdt_id (UK, NULL)       │  ← STUDENT: 가입 시 즉시 채번
│ status (enum)            │  ← ACTIVE / WITHDRAWN / SUSPENDED
│ last_login_at            │
│ created_by / updated_by  │  ← BIGINT (0=system)
│ created_at / updated_at  │
└──────────┬───────────────┘
           │
     ┌─────┴──────────────────────────────────┐
     │ 그룹 생성 (TEACHER 이상)                 │ 그룹 참가 (STUDENT / GUEST)
     ▼                                        ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│    group_info (그룹)      │   │    group_member           │
├──────────────────────────┤   │    (그룹 멤버)             │
│ group_id (PK, AUTO)      │   ├──────────────────────────┤
│ cla_id (UK)              │   │ id (PK, AUTO)            │
│ host_user_no (FK)        │←──│ group_id (FK)            │
│ group_nm                 │   │ user_no (FK, NULL)       │  ← 게스트는 NULL
│ group_desc               │   │ stdt_id (IDX)            │  ← STUDENT: user에서 복사
│ school_level             │   │ nickname                 │     GUEST: 참가마다 새 채번
│ grade                    │   │ email                    │
│ class_number             │   │ member_type (enum)       │  ← STUDENT / GUEST
│ school_code (FK, NULL)   │   │ member_no               │
│ school_name              │   │ status (enum)            │  ← ACTIVE/LEFT/KICKED/ARCHIVED
│ invite_code (UK)         │   │ joined_at / left_at      │
│ invite_link_token        │   │ created_by / updated_by  │
│ max_member_count (40)    │   │ created_at / updated_at  │
│ use_yn (Y/N)             │   └──────────┬───────────────┘
│ created_by / updated_by  │              │
│ created_at / updated_at  │              │
└──────────┬───────────────┘              │
           │ FK                           │
           ▼                              ▼
┌─────────────────────────┐  ┌──────────────────────────┐
│  school_info             │  │  guest_conversion_log     │
│  (학교 마스터)            │  │  (게스트 회원전환 이력)     │
├─────────────────────────┤  ├──────────────────────────┤
│ school_code (PK)        │  │ id (PK, AUTO)            │
│ school_name             │  │ member_id (FK)           │
│ school_level            │  │ guest_email              │
│ region                  │  │ converted_user_no (FK)   │
│ district                │  │ merge_yn                 │
│ status                  │  │ converted_at             │
│ created_by / updated_by │  └──────────────────────────┘
│ created_at / updated_at │
└─────────────────────────┘
         ▲ FK
┌────────┴─────────────────────┐
│  auth_school_map             │
│  (직책별 학교 접근 매핑)        │
├──────────────────────────────┤
│ id (PK, AUTO)                │
│ user_no (FK → user)          │
│ school_code (FK)             │
│ granted_by                   │
│ status                       │
│ created_by / updated_by      │
│ created_at / updated_at      │
└──────────────────────────────┘

┌──────────────────────────┐
│ email_verification        │
│ (이메일 인증코드)           │
├──────────────────────────┤
│ id (PK, AUTO)            │
│ email (IDX)              │
│ code (6자리)              │
│ verified (BOOLEAN)       │
│ expires_at (IDX)         │
│ created_at               │
└──────────────────────────┘

┌──────────────────────────┐
│ memo_info (관찰 메모)     │
├──────────────────────────┤
│ id (PK, AUTO)            │
│ stdt_id (IDX)            │
│ cla_id (IDX)             │
│ tc_id (IDX)              │
│ memo_date (IDX)          │
│ category (enum)          │
│ content (TEXT)            │
│ is_important             │
│ use_yn (Y/N)             │
│ created_by / updated_by  │
│ created_at / updated_at  │
└──────────────────────────┘

┌──────────────────────────┐
│ counseling_info (상담)    │
├──────────────────────────┤
│ id (PK, AUTO)            │
│ cla_id (IDX)             │
│ tc_id (IDX)              │
│ scheduled_at (IDX)       │
│ duration                 │
│ types / areas / methods  │  ← JSON 배열
│ status (IDX, enum)       │  ← scheduled/completed/cancelled
│ reason / summary         │
│ next_steps               │
│ use_yn (Y/N)             │
│ created_by / updated_by  │
│ created_at / updated_at  │
└──────────┬───────────────┘
           │ 1:N
           ▼
┌──────────────────────────┐
│ counseling_student       │
│ (상담-학생 매핑)          │
├──────────────────────────┤
│ id (PK, AUTO)            │
│ counseling_id (FK, IDX)  │
│ stdt_id (IDX)            │
│ stdt_name                │
│ stdt_number              │
│ cla_id                   │
│ use_yn (Y/N)             │
└──────────────────────────┘
```

**테이블 수: 12개** (v1 7개 + role_group, school_info, auth_school_map, email_verification, refresh_token)

---

### 5.2 테이블 상세

#### 5.2.1 `role_group` — 권한 그룹 마스터

| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|-------|------|------|-------|------|
| `role_code` | VARCHAR(20) | NOT NULL | - | 권한 코드 (PK) |
| `role_name` | VARCHAR(50) | NOT NULL | - | 권한명 (한글) |
| `level` | INT | NOT NULL | - | 권한 수준 (높을수록 상위) |
| `description` | VARCHAR(200) | NULL | NULL | 설명 |
| `created_by` | BIGINT | NOT NULL | 0 | 등록자 (user_no, 0=system) |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 생성 일시 |

- **PK**: `role_code`
- **UK**: `level` (uk_role_level)

**초기 데이터:**

| role_code | role_name | level | description |
|-----------|-----------|-------|-------------|
| STUDENT | 학생 | 1 | 그룹 참가, 검사 응시 |
| TEACHER | 교사 | 2 | 그룹 생성, 검사 관리 |
| PRINCIPAL | 교장 | 3 | 학교 내 전체 그룹 조회 |
| SUPERINTENDENT | 장학사 | 4 | 관할 학교 전체 조회 |
| ADMIN | 관리자 | 99 | 시스템 관리 |

---

#### 5.2.2 `school_info` — 학교 마스터

| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|-------|------|------|-------|------|
| `school_code` | VARCHAR(20) | NOT NULL | - | 학교 고유 코드 (PK) |
| `school_name` | VARCHAR(200) | NOT NULL | - | 학교명 |
| `school_level` | VARCHAR(20) | NULL | NULL | 학교급 (elementary/middle/high) |
| `region` | VARCHAR(100) | NULL | NULL | 시/도 |
| `district` | VARCHAR(100) | NULL | NULL | 교육지원청 |
| `status` | VARCHAR(20) | NOT NULL | 'ACTIVE' | ACTIVE / CLOSED |
| `created_by` | BIGINT | NOT NULL | 0 | 등록자 (user_no, 0=system) |
| `updated_by` | BIGINT | NOT NULL | 0 | 수정자 (user_no, 0=system) |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 생성 일시 |
| `updated_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 수정 일시 |

- **PK**: `school_code`
- **IDX**: `school_name` (idx_school_name), `region` (idx_school_region)

> 데이터 등록: 관리자 사이트에서 CSV/TSV 파일 업로드 (UTF-8, MS949 인코딩 지원, 자동 감지)
> school_level 정규화: "초등학교"→elementary, "중학교"→middle, "고등학교"→high

---

#### 5.2.3 `user` — 통합 회원

| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|-------|------|------|-------|------|
| `user_no` | BIGINT | NOT NULL | AUTO_INCREMENT | 회원 번호 (PK) |
| `email` | VARCHAR(100) | NOT NULL | - | 이메일 (UK, 로그인 식별자) |
| `password` | VARCHAR(255) | NOT NULL | - | 비밀번호 (BCrypt 암호화) |
| `nickname` | VARCHAR(50) | NOT NULL | - | 닉네임 |
| `role_code` | VARCHAR(20) | NOT NULL | - | 권한 코드 (FK → role_group) |
| `tc_id` | VARCHAR(64) | NULL | NULL | 교사 ID (UK) — 가입 시 즉시 채번 |
| `stdt_id` | VARCHAR(64) | NULL | NULL | 학생 ID (UK) — 가입 시 즉시 채번 |
| `status` | VARCHAR(20) | NOT NULL | 'ACTIVE' | ACTIVE / WITHDRAWN / SUSPENDED |
| `last_login_at` | DATETIME | NULL | NULL | 마지막 로그인 |
| `created_by` | BIGINT | NOT NULL | 0 | 등록자 (user_no, 0=system) |
| `updated_by` | BIGINT | NOT NULL | 0 | 수정자 (user_no, 0=system) |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 가입 일시 |
| `updated_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 수정 일시 |

- **PK**: `user_no`
- **UK**: `email` (uk_user_email), `tc_id` (uk_user_tc_id), `stdt_id` (uk_user_stdt_id)
- **IDX**: `role_code` (idx_user_role)
- **FK**: `role_code` → `role_group.role_code` (ON UPDATE CASCADE)

**역할별 ID 채번:**

| 가입 경로 | role_code | tc_id | stdt_id |
|----------|-----------|:-----:|:-------:|
| 일반 가입 (교사 선택) | TEACHER | 즉시 채번 | NULL |
| 일반 가입 (학생 선택) | STUDENT | NULL | 즉시 채번 |
| 관리자 생성 (TEACHER) | TEACHER | 즉시 채번 | NULL |
| 관리자 생성 (PRINCIPAL) | PRINCIPAL | 즉시 채번 | NULL |
| 관리자 생성 (SUPERINTENDENT) | SUPERINTENDENT | 즉시 채번 | NULL |
| 관리자 생성 (ADMIN) | ADMIN | 즉시 채번 | NULL |
| 관리자 생성 (STUDENT) | STUDENT | NULL | 즉시 채번 |

---

#### 5.2.4 `group_info` — 그룹/방

| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|-------|------|------|-------|------|
| `group_id` | BIGINT | NOT NULL | AUTO_INCREMENT | PK |
| `cla_id` | VARCHAR(64) | NOT NULL | - | 기존 API용 학급 ID (UK) |
| `host_user_no` | BIGINT | NOT NULL | - | 방장 회원 번호 (FK → user.user_no) |
| `group_nm` | VARCHAR(100) | NOT NULL | - | 그룹 이름 |
| `group_desc` | VARCHAR(500) | NULL | NULL | 그룹 설명 |
| `school_level` | VARCHAR(20) | NOT NULL | - | 학교급 (elementary/middle/high) |
| `grade` | VARCHAR(10) | NOT NULL | - | 학년 (숫자, 예: 1~6) |
| `class_number` | INT | NOT NULL | - | 반 번호 |
| `school_code` | VARCHAR(20) | NULL | NULL | 학교 코드 (FK → school_info, NULL=미소속) |
| `school_name` | VARCHAR(200) | NULL | NULL | 학교명 (표시용, 비정규화) |
| `invite_code` | VARCHAR(20) | NOT NULL | - | 초대 코드 6자리 대문자 (UK) |
| `invite_link_token` | VARCHAR(128) | NULL | NULL | 초대 링크 토큰 |
| `max_member_count` | INT | NOT NULL | 40 | 최대 멤버 수 |
| `use_yn` | CHAR(1) | NOT NULL | 'Y' | 사용 여부 (Y/N) |
| `created_by` | BIGINT | NOT NULL | 0 | 등록자 (user_no, 0=system) |
| `updated_by` | BIGINT | NOT NULL | 0 | 수정자 (user_no, 0=system) |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 생성 일시 |
| `updated_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 수정 일시 |

- **PK**: `group_id`
- **UK**: `cla_id` (uk_group_cla_id), `invite_code` (uk_group_invite_code)
- **IDX**: `host_user_no` (idx_group_host), `school_code` (idx_group_school)
- **FK**: `host_user_no` → `user.user_no` (ON UPDATE CASCADE), `school_code` → `school_info.school_code` (ON UPDATE CASCADE)

> 삭제 시 `use_yn = 'N'` (물리 삭제 없음)
> `school_code`는 교장/장학사의 접근 범위 매핑에 사용
> `school_name`은 표시용으로 유지 (school_info와 비정규화)
> 비관적 잠금: `findByInviteCodeAndUseYnForUpdate` — SELECT FOR UPDATE

---

#### 5.2.5 `auth_school_map` — 직책별 학교 접근 매핑

| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|-------|------|------|-------|------|
| `id` | BIGINT | NOT NULL | AUTO_INCREMENT | PK |
| `user_no` | BIGINT | NOT NULL | - | 사용자 번호 (FK → user.user_no) |
| `school_code` | VARCHAR(20) | NOT NULL | - | 학교 코드 (FK → school_info) |
| `granted_by` | BIGINT | NULL | NULL | 권한 부여한 관리자 (user_no) |
| `status` | VARCHAR(20) | NOT NULL | 'ACTIVE' | ACTIVE / REVOKED |
| `created_by` | BIGINT | NOT NULL | 0 | 등록자 (user_no, 0=system) |
| `updated_by` | BIGINT | NOT NULL | 0 | 수정자 (user_no, 0=system) |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 생성 일시 |
| `updated_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 수정 일시 |

- **PK**: `id`
- **UK**: `user_no` + `school_code` (uk_asm_user_school)
- **IDX**: `school_code` (idx_asm_school)
- **FK**: `user_no` → `user.user_no` (ON UPDATE CASCADE), `school_code` → `school_info.school_code` (ON UPDATE CASCADE)

> 관리자 사이트에서 매핑 추가/전체 해제 가능 (구현 완료)

---

#### 5.2.6 `group_member` — 그룹 멤버

| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|-------|------|------|-------|------|
| `id` | BIGINT | NOT NULL | AUTO_INCREMENT | PK |
| `group_id` | BIGINT | NOT NULL | - | 그룹 ID (FK) |
| `user_no` | BIGINT | NULL | NULL | 회원 번호 (FK → user.user_no, 게스트는 NULL) |
| `stdt_id` | VARCHAR(64) | NOT NULL | - | 기존 API용 학생 ID |
| `nickname` | VARCHAR(50) | NOT NULL | - | 닉네임 |
| `email` | VARCHAR(255) | NULL | NULL | 게스트 이메일 |
| `member_type` | VARCHAR(10) | NOT NULL | - | STUDENT / GUEST |
| `member_no` | INT | NULL | NULL | 순번 |
| `status` | VARCHAR(20) | NOT NULL | 'ACTIVE' | ACTIVE / LEFT / KICKED / ARCHIVED |
| `joined_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 참가 일시 |
| `left_at` | DATETIME | NULL | NULL | 탈퇴/강퇴 일시 |
| `created_by` | BIGINT | NOT NULL | 0 | 등록자 (user_no, 0=system) |
| `updated_by` | BIGINT | NOT NULL | 0 | 수정자 (user_no, 0=system) |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 생성 일시 |
| `updated_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | 수정 일시 |

- **PK**: `id`
- **UK**: `group_id` + `user_no` (uk_gm_group_user)
- **IDX**: `stdt_id` (idx_gm_stdt_id), `email` (idx_gm_email), `user_no` (idx_gm_user)
- **FK**: `group_id` → `group_info.group_id` (ON UPDATE CASCADE), `user_no` → `user.user_no` (ON UPDATE CASCADE, ON DELETE SET NULL)

---

#### 5.2.7 `guest_conversion_log` — 게스트 회원전환 이력

| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|-------|------|------|-------|------|
| `id` | BIGINT | NOT NULL | AUTO_INCREMENT | PK |
| `member_id` | BIGINT | NOT NULL | - | 그룹 멤버 ID (FK → group_member.id) |
| `guest_email` | VARCHAR(255) | NOT NULL | - | 게스트 시절 이메일 |
| `converted_user_no` | BIGINT | NOT NULL | - | 전환된 회원 번호 (FK → user.user_no) |
| `merge_yn` | CHAR(1) | NOT NULL | 'N' | 기존 결과 합산 여부 |
| `converted_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 전환 일시 |

- **PK**: `id`
- **IDX**: `member_id` (idx_gcl_member)
- **FK**: `member_id` → `group_member.id` (ON UPDATE CASCADE), `converted_user_no` → `user.user_no` (ON UPDATE CASCADE)

---

#### 5.2.8 `email_verification` — 이메일 인증코드

| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|-------|------|------|-------|------|
| `id` | BIGINT | NOT NULL | AUTO_INCREMENT | PK |
| `email` | VARCHAR(255) | NOT NULL | - | 이메일 주소 |
| `code` | VARCHAR(10) | NOT NULL | - | 인증 코드 (6자리) |
| `verified` | TINYINT(1) | NOT NULL | 0 | 인증 완료 여부 (0=미인증, 1=인증완료) |
| `expires_at` | DATETIME | NOT NULL | - | 만료 시각 (발송 시각 + 5분) |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 생성 일시 |

- **PK**: `id`
- **IDX**: `email` (idx_ev_email), `expires_at` (idx_ev_expires)
- FK 없음 (독립 테이블)

---

#### 5.2.9 `refresh_token` — Refresh Token 관리

| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|-------|------|------|-------|------|
| `id` | BIGINT | NOT NULL | AUTO_INCREMENT | PK |
| `user_no` | BIGINT | NOT NULL | - | 회원 번호 (FK → user.user_no) |
| `token_hash` | VARCHAR(128) | NOT NULL | - | refreshToken SHA-256 해시 |
| `device_info` | VARCHAR(200) | NULL | NULL | 기기 정보 (User-Agent 요약) |
| `ip_address` | VARCHAR(45) | NULL | NULL | 발급 시 IP |
| `expires_at` | DATETIME | NOT NULL | - | 만료 일시 |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 생성 일시 |

- **PK**: `id`
- **UK**: `token_hash` (uk_rt_token_hash)
- **IDX**: `user_no` (idx_rt_user), `expires_at` (idx_rt_expires)
- **FK**: `user_no` → `user.user_no` (ON DELETE CASCADE)

**운영 시나리오:**
- 로그인 시 refreshToken 발급 → SHA-256 해시하여 INSERT
- 토큰 갱신 시 token_hash로 조회 → 존재하면 새 accessToken 발급
- 로그아웃 시 해당 token_hash 행 DELETE
- 계정 정지/탈퇴 시 user_no 기준 전체 DELETE → 30분 내 강제 로그아웃
- 만료 토큰 정리: `DELETE FROM refresh_token WHERE expires_at < NOW()`

---

#### 5.2.10 `memo_info` — 관찰 메모

| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|-------|------|------|-------|------|
| `id` | BIGINT | NOT NULL | AUTO_INCREMENT | PK |
| `stdt_id` | VARCHAR(64) | NOT NULL | - | 대상 학생 ID |
| `cla_id` | VARCHAR(64) | NOT NULL | - | 학급 ID |
| `tc_id` | VARCHAR(64) | NOT NULL | - | 교사 ID (user.tc_id) |
| `memo_date` | DATE | NOT NULL | - | 관찰 날짜 |
| `category` | VARCHAR(20) | NOT NULL | - | behavior/academic/social/emotion/other |
| `content` | TEXT | NOT NULL | - | 메모 내용 |
| `is_important` | TINYINT(1) | NOT NULL | 0 | 중요 표시 |
| `use_yn` | CHAR(1) | NOT NULL | 'Y' | 사용 여부 (Y/N, 소프트 삭제) |
| `created_by` | BIGINT | NOT NULL | 0 | 등록자 (user_no, 0=system) |
| `updated_by` | BIGINT | NOT NULL | 0 | 수정자 (user_no, 0=system) |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | |
| `updated_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | |

- **PK**: `id`
- **IDX**: `stdt_id` (idx_memo_stdt), `cla_id` (idx_memo_cla), `tc_id` (idx_memo_tc), `memo_date` (idx_memo_date)

> 권한: JWT에서 추출한 tcId == memo.tc_id 인 경우만 수정/삭제 가능

---

#### 5.2.11 `counseling_info` — 상담 정보

| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|-------|------|------|-------|------|
| `id` | BIGINT | NOT NULL | AUTO_INCREMENT | PK |
| `cla_id` | VARCHAR(64) | NOT NULL | - | 학급 ID |
| `tc_id` | VARCHAR(64) | NOT NULL | - | 교사 ID |
| `scheduled_at` | DATETIME | NOT NULL | - | 상담 예정 일시 |
| `duration` | INT | NULL | NULL | 상담 시간 (분, 완료 시 필수) |
| `types` | JSON | NOT NULL | - | 상담 유형 (JSON 배열) |
| `areas` | JSON | NOT NULL | - | 상담 영역 (JSON 배열) |
| `methods` | JSON | NOT NULL | - | 상담 방법 (JSON 배열) |
| `status` | VARCHAR(20) | NOT NULL | 'scheduled' | scheduled/completed/cancelled |
| `reason` | TEXT | NULL | NULL | 상담 사유 |
| `summary` | TEXT | NULL | NULL | 상담 요약 (완료 시 필수) |
| `next_steps` | TEXT | NULL | NULL | 후속 조치 |
| `use_yn` | CHAR(1) | NOT NULL | 'Y' | 사용 여부 (Y/N, 소프트 삭제) |
| `created_by` | BIGINT | NOT NULL | 0 | 등록자 (user_no, 0=system) |
| `updated_by` | BIGINT | NOT NULL | 0 | 수정자 (user_no, 0=system) |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | |
| `updated_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE | |

- **PK**: `id`
- **IDX**: `cla_id` (idx_counsel_cla), `tc_id` (idx_counsel_tc), `status` (idx_counsel_status), `scheduled_at` (idx_counsel_scheduled)

**상태 전이:**

```
scheduled → completed  (POST /api/counseling/{id}/complete: duration, summary 필수)
scheduled → cancelled  (POST /api/counseling/{id}/cancel)
```

> 권한: JWT에서 추출한 tcId == counseling.tc_id 인 경우만 수정/삭제 가능

---

#### 5.2.12 `counseling_student` — 상담-학생 매핑

| 컬럼명 | 타입 | NULL | 기본값 | 설명 |
|-------|------|------|-------|------|
| `id` | BIGINT | NOT NULL | AUTO_INCREMENT | PK |
| `counseling_id` | BIGINT | NOT NULL | - | 상담 ID (FK) |
| `stdt_id` | VARCHAR(64) | NOT NULL | - | 학생 ID |
| `stdt_name` | VARCHAR(50) | NOT NULL | - | 학생 이름 |
| `stdt_number` | INT | NOT NULL | 0 | 학생 번호 |
| `cla_id` | VARCHAR(64) | NULL | NULL | 학급 ID |
| `use_yn` | CHAR(1) | NOT NULL | 'Y' | 사용 여부 (Y/N) |

- **PK**: `id`
- **IDX**: `counseling_id` (idx_cs_counseling), `stdt_id` (idx_cs_stdt)
- **FK**: `counseling_id` → `counseling_info.id` (ON UPDATE CASCADE)

---

## 6. Enum 정의

### 6.1 UserStatus (계정 상태)

| 값 | 설명 | 비고 |
|----|------|------|
| `ACTIVE` | 활성 | 로그인 가능 |
| `WITHDRAWN` | 탈퇴 | 로그인 불가 |
| `SUSPENDED` | 정지 | 로그인 불가 |

### 6.2 MemberType (그룹 멤버 유형)

| 값 | 설명 | user_no |
|----|------|:-------:|
| `STUDENT` | 가입 회원 | NOT NULL |
| `GUEST` | 비가입 게스트 | NULL |

### 6.3 MemberStatus (그룹 멤버 상태)

| 값 | 설명 | left_at |
|----|------|:-------:|
| `ACTIVE` | 참가 중 | NULL |
| `LEFT` | 본인 탈퇴 | 설정됨 |
| `KICKED` | 방장 강퇴 | 설정됨 |
| `ARCHIVED` | 아카이브 | - |

### 6.4 MemoCategory (관찰 메모 카테고리)

| 값 | 설명 |
|----|------|
| `behavior` | 행동 관찰 |
| `academic` | 학습 관찰 |
| `social` | 교우관계 |
| `emotion` | 정서 |
| `other` | 기타 |

### 6.5 CounselingStatus (상담 상태)

| 값 | 설명 |
|----|------|
| `scheduled` | 예정 |
| `completed` | 완료 |
| `cancelled` | 취소 |

### 6.6 SchoolLevel (학교급)

| Enum | code | 기존 API grade | 기존 sync gradeCd | 학년 범위 |
|------|------|:---:|:---:|:---:|
| ELEMENTARY | `elementary` | `el` | `3` | 1~6 |
| MIDDLE | `middle` | `mi` | `7` | 1~3 |
| HIGH | `high` | `hi` | `10` | 1~3 |

---

## 7. 프로세스 흐름

### 7.1 회원가입 → 그룹 생성 → 검사 시작

```
[1] 이메일 인증
    ├─ POST /member/send-code {email}
    │   └─ 6자리 코드 발송 (5분 TTL, 1분 재발송 쿨다운)
    └─ POST /member/verify-code {email, code}
        └─ 인증 완료 (verified = true)

[2] 통합 로그인 회원가입
    ├─ POST /member/signup {password, email, nickname, roleCode}
    ├─ 이메일 인증 완료 확인
    ├─ 비밀번호 정책 검증 (10~64자, 2종 조합, 연속4자 금지 등)
    ├─ BCrypt 암호화
    ├─ 교사(TEACHER) 선택 시:
    │   INSERT INTO user (..., role_code='TEACHER', tc_id='viva-t-xxxxxxxx')
    │
    ├─ 학생(STUDENT) 선택 시:
    │   INSERT INTO user (..., role_code='STUDENT', stdt_id='viva-s-xxxxxxxx')
    │
    └─ 이메일 인증 레코드 소비 (DELETE)

[3] 로그인
    ├─ POST /member/login {email, password}
    ├─ BCrypt 비밀번호 검증
    ├─ status = ACTIVE 확인
    ├─ last_login_at 갱신
    ├─ userSeCd = tcId != null ? "T" : "S"
    ├─ accessToken (30min) + refreshToken (14d) 발급
    └─ 응답: {userNo, email, nickname, roleCode, tcId, stdtId, accessToken, refreshToken}

[4] 그룹(방) 생성 (TEACHER 이상만)
    ├─ POST /group/create (JWT 필수)
    ├─ schoolLevel + grade 유효성 검증
    ├─ tcId null이면 lazy 채번 (안전장치)
    ├─ INSERT INTO group_info (cla_id=UUID32, invite_code=랜덤6자리대문자, ...)
    └─ 응답: {claId, inviteCode, ...}

[5] 그룹 참가 — 학생(STUDENT)
    ├─ POST /group/join (JWT 필수) {inviteCode}
    ├─ 최대 인원 체크 (ACTIVE 멤버 수 < max_member_count)
    ├─ stdtId null이면 lazy 채번 (안전장치)
    ├─ INSERT INTO group_member (stdt_id=user.stdt_id, member_type='STUDENT')
    └─ 응답: {stdtId, ...}

[5-G] 그룹 참가 — 게스트(GUEST)
    ├─ POST /group/join-guest {inviteCode, nickname, email} (이메일 인증 필수)
    ├─ 최대 인원 체크
    ├─ INSERT INTO group_member (stdt_id=새로채번, user_no=NULL, member_type='GUEST')
    └─ 이메일 인증 레코드 소비 (DELETE)

[6] 검사 시작 (방장/TEACHER 이상이 실행)
    ├─ 기존 API 호출: /etc/meta/tc/start
    │   tcId=user.tc_id, claId=group_info.cla_id,
    │   grade=school_level→변환(el/mi/hi), ordNo, paperIdx
    └─ 기존 API 내부 처리 (수정 없이 그대로 동작)
```

### 7.2 관찰 메모 / 상담 CRUD

```
[메모 CRUD] (JWT 필수, tcId 자동 추출)
    ├─ GET    /api/memos/student/{studentId}   ← 학생별 메모 목록
    ├─ POST   /api/memos                       ← 메모 생성
    ├─ PATCH  /api/memos/{id}                  ← 메모 수정 (작성자만)
    └─ DELETE /api/memos/{id}                  ← 메모 삭제 (작성자만, 소프트)

[상담 CRUD] (JWT 필수, tcId 자동 추출)
    ├─ GET    /api/counseling                  ← 전체 목록
    ├─ GET    /api/counseling/{id}             ← 상세 조회 (학생 목록 포함)
    ├─ POST   /api/counseling                  ← 상담 생성 (학생 목록 배치 등록)
    ├─ PATCH  /api/counseling/{id}             ← 상담 수정 (작성자만)
    ├─ POST   /api/counseling/{id}/complete    ← 상담 완료 (duration, summary 필수)
    ├─ POST   /api/counseling/{id}/cancel      ← 상담 취소
    └─ DELETE /api/counseling/{id}             ← 상담 삭제 (소프트)
```

### 7.3 게스트 → 회원 전환 플로우

```
[A] 게스트로 검사 응시
    ├─ group_member: user_no = NULL, email = "abc@gmail.com", member_type = 'GUEST'
    ├─ stdt_id = "viva-s-xxxxxxxx" (새로 채번됨)
    └─ 기존 API로 검사 완료 (결과 데이터 존재)

[B] 동일 이메일로 통합 회원가입 (학생 역할 선택)
    ├─ INSERT INTO user (..., stdt_id=즉시채번)
    └─ 연동 확인: group_member에서 email = ? AND user_no IS NULL 조회

[C] 연동 확인 팝업
    ├─ Yes → 기존 결과 합산
    │   ├─ 가입 시 채번된 stdt_id 대신 게스트 시절 stdt_id를 채택
    │   ├─ UPDATE group_member SET user_no = ?, member_type = 'STUDENT'
    │   └─ INSERT INTO guest_conversion_log (merge_yn = 'Y')
    └─ No → 새 계정으로 시작
        └─ INSERT INTO guest_conversion_log (merge_yn = 'N')
```

### 7.4 관리자 사이트 (구현 완료)

```
[관리자 로그인]
    ├─ 세션 기반 Form Login (/admin/login)
    ├─ AdminUserDetailsService: role_group.level >= 99 확인
    └─ ROLE_ADMIN 부여

[대시보드] /admin/dashboard
    └─ 전체 사용자 수, 역할 수, 등록 학교 수, 활성 그룹 수

[사용자 관리] /admin/users
    ├─ 계정 등록 (이메일 인증 스킵, 역할별 tcId/stdtId 즉시 채번)
    ├─ 사용자 목록 (검색: 키워드/역할/상태, 페이징)
    ├─ 역할 변경 (승격/강등)
    └─ 상태 변경 (ACTIVE/WITHDRAWN/SUSPENDED)

[권한 관리] /admin/roles
    ├─ 역할 등록/수정 (Upsert)
    └─ 역할 목록 (페이징)

[학교 관리]
    ├─ /admin/schools      ← 학교 목록 (검색: 키워드/학교급/지역, 페이징)
    ├─ /admin/school-import ← CSV/TSV 업로드 (UTF-8, MS949 자동 감지)
    └─ /admin/school-map    ← 사용자-학교 매핑 (추가/전체 해제)

[API 기능 테스트] /admin/api-test
    └─ 10개 API 테스트 패널 (회원가입~상담관리)
```

### 7.5 그룹 삭제 & 멤버 탈퇴 플로우

```
[멤버 탈퇴 / 강퇴]
    ├─ UPDATE group_member SET status = 'LEFT' (또는 'KICKED'), left_at = NOW()
    └─ 대시보드에서 "탈퇴한 멤버"로 표시
    ※ 물리 DELETE 없음 — 데이터 보존

[그룹 삭제]
    ├─ UPDATE group_info SET use_yn = 'N'
    └─ 목록 조회 시 use_yn = 'Y'만 표시
    ※ 물리 DELETE 없음 — 데이터 보존
```

---

## 8. 기존 DB 동기화 (미구현)

> **현재 상태**: aidt_lms 동기화는 설계만 완료, 코드 미구현
> legacySyncMapper 등 동기화 관련 코드는 존재하지 않음

**설계된 동기화 테이블 매핑:**

| 이벤트 | 신규 DB | 기존 aidt_lms DB | 비고 |
|--------|--------|-----------------|------|
| 교사 가입 (tc_id 즉시) | `user` INSERT (tc_id 포함) | `user` (T) + `tc_reg_info` INSERT | 미구현 |
| 학생 가입 (stdt_id 즉시) | `user` INSERT (stdt_id 포함) | `user` (S) + `stdt_reg_info` INSERT | 미구현 |
| 그룹 생성 | `group_info` INSERT | `tc_cla_info` + `tc_cla_user_info` INSERT | 미구현 |
| 학생 그룹 참가 | `group_member` INSERT | `tc_cla_mb_info` (actvtn_at='Y') | 미구현 |
| 게스트 참가 | `group_member` INSERT | `user` (S) + `stdt_reg_info` + `tc_cla_mb_info` | 미구현 |
| 멤버 탈퇴/추방 | `group_member` UPDATE | `tc_cla_mb_info` UPDATE (actvtn_at='N') | 미구현 |

```
┌──────────────────────────────────────────────────────────────────┐
│                     신규 플랫폼 DB (viva_meta)                     │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────┐   │
│  │   user   │→│ group_info │→│group_member│ │ school_info  │   │
│  │ role_code│  │school_code│  └──────────┘  └──────────────┘   │
│  └──────────┘  └───────────┘                                    │
└──────────────────────────┬───────────────────────────────────────┘
                           │ 회원 인입 시 동기화 (INSERT/UPDATE) ← 미구현
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     기존 aidt_lms DB                              │
│  ┌──────────┐  ┌───────────────┐  ┌──────────────┐              │
│  │   user   │  │ stdt_reg_info │  │tc_cla_mb_info│              │
│  └──────────┘  └───────────────┘  └──────────────┘              │
│                                                                  │
│  기존 /etc/meta API가 이 테이블들을 직접 조회                       │
│  → 신규 멤버도 여기에 있어야 기존 API가 정상 동작                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 9. 핵심 데이터 흐름 요약

```
┌──────────────────┐    교사 가입    ┌──────────────────────────┐
│  통합 로그인       │──────────────▶│      user                 │
│  (이메일인증 필수)  │               │  role_code = TEACHER      │
│  (역할 선택)       │    학생 가입    │  tc_id = 즉시 채번         │
│                   │──────────────▶│  또는                      │
│  TEACHER/STUDENT  │               │  role_code = STUDENT      │
└──────────────────┘               │  stdt_id = 즉시 채번       │
                                   └────────┬───────────────────┘
                                            │
                      ┌─────────────────────┴────────────────────┐
                      ▼                                          ▼
             그룹 생성 (TEACHER 이상)                  그룹 참가 (STUDENT)
                      │                                          │
                      ▼                                          ▼
          ┌──────────────────┐              ┌──────────────────────────┐
          │   group_info     │              │  group_member             │
          │ (cla_id 채번)    │              │ (stdt_id = user에서 복사)  │
          │ school_code(FK)  │              │  STUDENT: 동일 stdt_id    │
          │ host_user_no     │              │  GUEST: 매번 새 stdt_id   │
          └────────┬─────────┘              └──────────────────────────┘
                   │
                   ▼
          ┌───────────────────────────────┐
          │  기존 /etc/meta API 호출        │
          │  (tcId, claId, stdtId, grade)  │
          │  ※ aidt_lms 동기화 필요 (미구현) │
          └───────────────────────────────┘

          ┌───────────────────────────────────────────┐
          │  교장/장학사 접근 범위                       │
          │                                           │
          │  auth_school_map                          │
          │  ┌─────────┬────────────┐                  │
          │  │user_no  │ school_code│                  │
          │  ├─────────┼────────────┤                  │
          │  │ 교장A   │ SCH-001    │ ← 1개 학교       │
          │  │ 장학사B  │ SCH-001    │ ← 복수 학교      │
          │  │ 장학사B  │ SCH-002    │                  │
          │  │ 장학사B  │ SCH-003    │                  │
          │  └─────────┴────────────┘                  │
          │                                           │
          │  → group_info.school_code와 JOIN으로       │
          │    접근 가능한 그룹 목록 산출                 │
          └───────────────────────────────────────────┘
```

---

## 10. API 엔드포인트 요약

### 10.1 회원 API (공개/JWT)

| Method | Path | 인증 | 설명 |
|--------|------|:----:|------|
| POST | `/member/send-code` | - | 이메일 인증코드 발송 |
| POST | `/member/verify-code` | - | 인증코드 확인 |
| POST | `/member/signup` | - | 회원가입 (이메일 인증 필수) |
| POST | `/member/login` | - | 로그인 (JWT 발급) |
| POST | `/member/token/refresh` | - | accessToken 갱신 |
| GET | `/member/info` | JWT | 회원 정보 조회 |

### 10.2 그룹 API (JWT)

| Method | Path | 설명 |
|--------|------|------|
| POST | `/group/create` | 그룹 생성 (TEACHER 이상) |
| POST | `/group/join` | 회원 그룹 참가 |
| POST | `/group/join-guest` | 게스트 그룹 참가 (이메일 인증 필수) |
| GET | `/group/list` | 내 그룹 목록 (페이징) |
| GET | `/group/detail` | 그룹 상세 + 멤버 목록 |
| GET | `/group/invite` | 초대코드로 그룹 미리보기 |
| PUT | `/group/update` | 그룹 수정 (방장만) |
| DELETE | `/group/delete` | 그룹 삭제 (방장만, 소프트) |
| POST | `/group/member/leave` | 그룹 탈퇴 |
| POST | `/group/member/kick` | 멤버 강퇴 (방장만) |

### 10.3 관찰 메모 API (JWT)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/memos/student/{studentId}` | 학생별 메모 목록 |
| POST | `/api/memos` | 메모 생성 (tcId 자동) |
| PATCH | `/api/memos/{id}` | 메모 수정 (작성자만) |
| DELETE | `/api/memos/{id}` | 메모 삭제 (작성자만, 소프트) |

### 10.4 상담 API (JWT)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/counseling` | 전체 조회 |
| GET | `/api/counseling/{id}` | 상세 조회 (학생 포함) |
| GET | `/api/counseling/student/{studentId}` | 학생별 조회 |
| GET | `/api/counseling/class/{classId}` | 학급별 조회 |
| GET | `/api/counseling/status/{status}` | 상태별 조회 |
| POST | `/api/counseling` | 상담 생성 (tcId 자동) |
| PATCH | `/api/counseling/{id}` | 상담 수정 (작성자만) |
| POST | `/api/counseling/{id}/complete` | 상담 완료 |
| POST | `/api/counseling/{id}/cancel` | 상담 취소 |
| DELETE | `/api/counseling/{id}` | 상담 삭제 (작성자만, 소프트) |

### 10.5 관리자 사이트 (세션, ROLE_ADMIN)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/admin/login` | 로그인 페이지 |
| POST | `/admin/login` | 로그인 처리 |
| GET | `/admin/dashboard` | 대시보드 |
| GET | `/admin/users` | 사용자 목록 (검색/페이징) |
| POST | `/admin/users/create` | 사용자 등록 |
| POST | `/admin/users/role` | 역할 변경 |
| POST | `/admin/users/status` | 상태 변경 |
| GET | `/admin/roles` | 역할 목록 |
| POST | `/admin/roles/upsert` | 역할 등록/수정 |
| GET | `/admin/schools` | 학교 목록 |
| GET | `/admin/school-import` | 학교 등록 페이지 |
| POST | `/admin/school-import/upload` | CSV 업로드 |
| GET | `/admin/school-map` | 학교 매핑 |
| POST | `/admin/school-map/assign` | 매핑 추가 |
| POST | `/admin/school-map/revoke` | 매핑 전체 해제 |
| GET | `/admin/api-test` | API 테스트 페이지 |

---

## 부록: 학교급/학년 매핑

### school_level ↔ 기존 API 변환

| 신규 (group_info.school_level) | 기존 API grade | 기존 sync gradeCd | 기존 schGrade |
|:--:|:--:|:--:|:--:|
| `elementary` | `el` | `3` | `CMM13001` (초등학교) |
| `middle` | `mi` | `7` | `CMM13002` (중학교) |
| `high` | `hi` | `10` | `CMM13003` (고등학교) |

### grade (학년)

| school_level | grade 범위 | 설명 |
|:--:|:--:|:--:|
| `elementary` | 1 ~ 6 | 초등학교 1~6학년 |
| `middle` | 1 ~ 3 | 중학교 1~3학년 |
| `high` | 1 ~ 3 | 고등학교 1~3학년 |

---

## 부록: 기술 스택

| 항목 | 버전/기술 |
|------|----------|
| Framework | Spring Boot 2.7.17 |
| ORM | MyBatis 3.5.13 |
| DB | MySQL 8.3.0 (viva_meta) |
| 인증 (API) | JWT (HS256, jjwt 라이브러리) |
| 인증 (Admin) | Spring Security 5.7 세션 기반 Form Login |
| 템플릿 엔진 | Thymeleaf 3.0 + thymeleaf-extras-springsecurity5 |
| 메일 발송 | NCP Cloud Outbound Mailer |
| 패스워드 | BCrypt (Spring Security PasswordEncoder) |
| 서버 포트 | 15000 |
| 패키지 루트 | com.vs.meta |
