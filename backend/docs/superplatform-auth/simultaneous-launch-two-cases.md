# 동시 오픈 기준 — 개인정보 관리 범위 2가지 케이스 비교

> Auth 서버와 학심정 동시 오픈 확정 전제, 개인정보 관리 범위에 따른 두 가지 케이스 비교

**작성일**: 2026-04-17

---

## 케이스 정의

| | 케이스 A: Auth 인증만 | 케이스 B: Auth 개인정보 일괄 |
|---|---|---|
| **Auth 관할** | 로그인, 비밀번호, 소셜 연동, 토큰 발급 | 로그인 + 이름, 이메일, 성별, 학교, 학년 등 모든 개인정보 |
| **학심정 DB** | sp_user_id + 이름/이메일/성별 등 개인정보 저장 | sp_user_id + 서비스 도메인 데이터만 |
| **ISMS** | 학심정 DB도 개인정보 보유 → 감사 대상 | Auth DB만 감사 대상 |

---

## 1. 학심정 user 테이블

### 케이스 A

```sql
CREATE TABLE `user` (
    user_no         BIGINT NOT NULL AUTO_INCREMENT,
    sp_user_id      VARCHAR(64) NOT NULL,       -- Auth 연결 키
    email           VARCHAR(100) NOT NULL,       -- ● 유지 (Auth에서 받아서 저장)
    nickname        VARCHAR(50) NOT NULL,        -- ● 유지
    gender          VARCHAR(10) NULL,            -- ● 유지
    role_code       VARCHAR(20) NOT NULL,
    tc_id           VARCHAR(64) NULL,
    stdt_id         VARCHAR(64) NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_login_at   DATETIME NULL,
    created_by      BIGINT NOT NULL DEFAULT 0,
    updated_by      BIGINT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_no),
    UNIQUE KEY uk_sp_user_id (sp_user_id),
    UNIQUE KEY uk_email (email)
);
-- password 컬럼 없음 (Auth가 관리)
-- email/nickname/gender는 SSO 로그인 시 JWT Claims에서 받아서 저장/동기화
```

### 케이스 B

```sql
CREATE TABLE `user` (
    user_no         BIGINT NOT NULL AUTO_INCREMENT,
    sp_user_id      VARCHAR(64) NOT NULL,       -- Auth 연결 키 (유일한 식별자)
    role_code       VARCHAR(20) NOT NULL,
    tc_id           VARCHAR(64) NULL,
    stdt_id         VARCHAR(64) NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_login_at   DATETIME NULL,
    created_by      BIGINT NOT NULL DEFAULT 0,
    updated_by      BIGINT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_no),
    UNIQUE KEY uk_sp_user_id (sp_user_id)
);
-- email, nickname, gender 모두 없음
-- 이름이 필요할 때마다 Auth API 조회
```

---

## 2. 다른 테이블 영향

### group_member

| 컬럼 | 케이스 A | 케이스 B |
|------|---------|---------|
| nickname | **유지** (user에서 복사) | **제거** (Auth API 조회) |
| gender | **유지** | **제거** |
| email | **유지** | **제거** |

### counseling_student

| 컬럼 | 케이스 A | 케이스 B |
|------|---------|---------|
| stdt_name | **유지** (스냅샷) | **제거** (Auth API 조회) |

### 기타

| 테이블 | 케이스 A | 케이스 B |
|--------|---------|---------|
| group_invitation.email | 유지 | 제거 (sp_user_id로 대체) |
| guest_conversion_log.guest_email | 유지 | 제거 |
| email_verification | **DROP** (양쪽 동일) | **DROP** |
| refresh_token | **DROP** (양쪽 동일) | **DROP** |

---

## 3. 백엔드 변경 범위

### 케이스 A: Auth 인증만

**공통 (SSO 연동):**

| 신규 | 역할 |
|------|------|
| AuthProxyController | Auth 프록시 4개 엔드포인트 |
| AuthServerProperties | Auth 서버 설정 |
| SpJwtClaimFilter | SP JWT 파싱 |
| SsoUserService | SSO 로그인 시 학심정 user 자동 생성/동기화 |

**수정:**

| 파일 | 변경 |
|------|------|
| SecurityConfig | 자체 JWT 필터 → SpJwtClaimFilter |
| User.java | sp_user_id 추가, password 제거 |
| UserMapper.xml | sp_user_id 기반 쿼리 추가, password 관련 제거 |
| application.yml | Auth 서버 환경변수 |

**제거:**
- JwtUtil, JwtAuthenticationFilter, EmailVerificationService, RefreshTokenMapper
- MemberController의 login/signup/send-code/verify-code

**기존 쿼리/서비스 수정: 거의 없음** — email/nickname/gender가 학심정 DB에 있으므로 기존 JOIN/SELECT 그대로 동작.

**SsoUserService 동기화 로직:**
```
SSO 로그인 → JWT Claims (sub, email, name, gender, userType) 수신
→ sp_user_id로 학심정 user 조회
  → 있으면: email/nickname/gender가 JWT와 다르면 UPDATE (로그인 시 동기화)
  → 없으면: 신규 INSERT (JWT 정보 기반)
```

### 케이스 B: Auth 개인정보 일괄

**케이스 A의 모든 작업 + 추가:**

| 신규 | 역할 |
|------|------|
| PersonalInfoResolver | Auth API 개인정보 조회 + Caffeine 캐시 |
| PersonalInfo VO | email, name, gender 값 객체 |
| AuthApiClient | Auth 서버 REST 클라이언트 |
| CacheConfig | Caffeine 캐시 설정 |

**추가 수정 (케이스 A에 없는 것):**

| 파일 | 변경 |
|------|------|
| UserMapper.xml | email/nickname/gender SELECT 전부 제거 (8쿼리) |
| GroupMemberMapper.xml | nickname/gender/email 컬럼 제거 (5쿼리) |
| GroupQueryMapper.xml | 비정규화 JOIN 제거 (8쿼리) |
| DgnssMapper.xml | MEM_NM/MEM_GENDER 제거 (6+쿼리) |
| CounselingStudentMapper.xml | stdt_name 제거 (2쿼리) |
| GroupInvitationMapper.xml | email 제거 (2쿼리) |
| GuestConversionLogMapper.xml | guest_email 제거 (1쿼리) |
| User.java | email/nickname/gender 필드 제거 |
| GroupMember.java | nickname/gender/email 필드 제거 |
| CounselingStudent.java | stdtName 필드 제거 |
| MemberService | 프로필 응답 → PersonalInfoResolver |
| GroupService | 비정규화 복사 제거 → PersonalInfoResolver |
| CounselingService | stdt_name 제거 → PersonalInfoResolver |
| AdminUserService | 회원 목록/검색 → PersonalInfoResolver + Auth 검색 API |
| GuestAuthService | 게스트 개인정보 처리 변경 |
| GuestService | gender 동기화 제거 |
| GroupInvitationService | email 저장 방식 변경 |
| 관련 DTO/응답 객체 | 개인정보 필드를 PersonalInfoResolver에서 채워 반환 |

---

## 4. 프론트엔드 변경 범위

### 공통 (양쪽 동일)

| 파일 | 변경 |
|------|------|
| index.html | SDK CDN 스크립트 추가 |
| main.tsx | SDK init + handleRedirectResult 부트스트랩 |
| AuthContext.tsx | SDK 기반 전면 교체 |
| client.ts | 자체 Silent Refresh 제거 → SDK |
| LoginPage.tsx | SSO 로그인 버튼만 |
| routes.tsx | /auth/callback 추가 |
| SignUpPage.tsx | 제거 |
| ForgotPasswordPage.tsx | 제거 |
| LoginForm.tsx | 제거 |
| authClient.ts / useSpAuth.ts | 신규 |

### 케이스 A 추가: 없음

백엔드가 기존과 동일한 형식으로 email/name/gender를 응답하므로, 화면 컴포넌트 수정 불필요.

### 케이스 B 추가: 거의 없음

백엔드가 PersonalInfoResolver로 채워서 **기존과 동일한 응답 형식**을 유지하면, 프론트엔드도 수정 불필요. 다만 User 타입에서 email/name 필드의 존재 방식이 달라질 수 있어 타입 정의 일부 조정 필요.

---

## 5. Auth 서버 측 필요 작업

### 케이스 A

| 요청 | 비고 |
|------|------|
| client_id / client_secret 발급 | 필수 |
| CORS 도메인 등록 | 필수 |
| 이상 끝 | Auth 서버 코드 변경 없음 |

### 케이스 B — 케이스 A + 추가

| 요청 | 비고 |
|------|------|
| **StudentProfile 엔티티 + CRUD API** | 학년/반/번호 저장할 곳 필요 |
| **TeacherProfile에 school_level, region 추가** | 교사 확장 |
| **사용자 검색 API** | Admin 회원 검색 필수 |
| **배치 조회에 프로필 포함 옵션** | 목록 화면 성능 |

---

## 6. 수치 비교

| 항목 | 케이스 A | 케이스 B |
|------|---------|---------|
| **DDL** | user에 sp_user_id 추가, password 제거 | 6테이블 15컬럼 변경 |
| **Mapper XML 수정** | 2~3쿼리 (sp_user_id 추가) | **30+ 쿼리** |
| **Service 수정** | 2~3개 (인증 관련) | **8개** |
| **신규 클래스** | 4개 (프록시+필터+설정+매핑) | **8개** (+ PersonalInfoResolver 계열) |
| **FE 수정** | 10개 (SSO 연동) | 10개 (동일) |
| **Auth 서버 변경** | 0 (발급만) | **4개 API 추가 요청** |
| **제거 코드** | 자체 인증 (JwtUtil 등) | 자체 인증 + 개인정보 컬럼/쿼리 전부 |
| **예상 기간** | **3주** | **5주** |
| **Auth 팀 의존** | 낮음 (발급만) | **높음** (API 개발 필요) |

---

## 7. 장단점

### 케이스 A: Auth 인증만 + 개인정보 학심정 유지

| 장점 | 단점 |
|------|------|
| 변경 범위 최소 (3주) | 개인정보가 Auth + 학심정 양쪽에 존재 |
| Auth 서버 코드 변경 요청 불필요 | ISMS 감사 시 학심정 DB도 대상 |
| 기존 쿼리/서비스 거의 그대로 | Auth 쪽 이름 변경 시 동기화 필요 |
| Auth 장애 시 이름 표시 정상 | 개인정보 삭제 요청 시 양쪽 처리 |
| Auth 팀 의존도 낮음 | |

### 케이스 B: Auth 개인정보 일괄 관리

| 장점 | 단점 |
|------|------|
| 개인정보 단일 저장소 → ISMS 완벽 대응 | 변경 범위 큼 (5주) |
| 개인정보 삭제 요청 시 Auth만 처리 | Auth 장애 시 이름 표시 불가 (캐시로 완화) |
| 데이터 일관성 보장 | Auth 서버에 StudentProfile 등 추가 개발 필요 |
| 동기화 로직 불필요 | Admin 회원 검색에 Auth 검색 API 필수 |
| | Auth 팀 의존도 높음 (API 4개 추가 요청) |

---

## 8. 리스크 비교

| 리스크 | 케이스 A | 케이스 B |
|--------|---------|---------|
| Auth 서버 장애 시 | 로그인 불가, **이름 표시는 정상** | 로그인 불가 + **이름 표시도 불가** |
| Auth 팀 일정 지연 | 영향 거의 없음 (발급만) | **학심정 개발도 지연** (API 의존) |
| ISMS 감사 | 학심정 DB도 감사 대상 | Auth만 감사 대상 |
| 개발 기간 초과 | 리스크 낮음 (3주) | 30+쿼리 수정으로 리스크 있음 (5주) |
| 개인정보 불일치 | Auth ↔ 학심정 이름 불일치 가능 (로그인 시 동기화로 완화) | 불일치 없음 (원본 1곳) |
| 오픈 일정 리스크 | **낮음** | **중간~높음** |

---

## 9. 타임라인 비교

### 케이스 A (3주)

```
오픈 5주 전   Auth팀: client_id 발급 + CORS (1일)
오픈 5주 전   학심정: 개발 착수
              1주차: Auth 프록시 + SpJwtClaimFilter + SsoUserService
              2주차: FE SDK 연동 + AuthContext 교체 + LoginPage
              3주차: 통합 테스트 + 자체 인증 코드 제거
오픈 2주 전   안정화 + 버그 수정
오픈          ═══ 동시 오픈 ═══
```

### 케이스 B (5주)

```
오픈 7주 전   Auth팀: client_id 발급 + CORS (1일)
              Auth팀: StudentProfile + 검색 API 개발 착수 (1~2주)
오픈 7주 전   학심정: 개발 착수
              1주차: Auth 프록시 + SpJwtClaimFilter + SsoUserService
              2주차: PersonalInfoResolver + 캐시 + DB 스키마 변경
              3주차: Mapper XML 30+쿼리 수정 + Service 8개 수정
              4주차: Admin 대응 + 게스트 플로우
              5주차: 통합 테스트
오픈 2주 전   안정화 + 버그 수정
오픈          ═══ 동시 오픈 ═══
```

---

## 10. 의사결정 포인트

최종 결정 시 아래 질문에 대한 답이 방향을 결정합니다:

| # | 질문 | A면 | B면 |
|---|------|-----|-----|
| 1 | **ISMS 인증을 SSO 센터만 확인하면 되게 해야 하는가?** | 아니어도 됨 | 반드시 |
| 2 | **Auth 팀에 StudentProfile + 검색 API 개발을 요청할 수 있는가?** | 요청 불필요 | 요청 필수 |
| 3 | **오픈까지 남은 기간이 5주 이상인가?** (Auth 팀 작업 포함 7주) | 3주면 됨 | 최소 7주 필요 |
| 4 | **Auth 서버 장애 시 학심정에서 이름 표시가 안 되어도 되는가?** | 안 됨 (A 선택) | 캐시로 감수 |

이전에 공유받은 정책 메일 기준이면 **B안**이지만, 일정이 빠듯하면 **A안으로 먼저 오픈 → 추후 B안 전환**도 가능합니다. A안에서 B안으로 전환하는 작업은 추가 2~3주입니다.

---

**문서 끝**
