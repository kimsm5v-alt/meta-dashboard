# 학심정 × 슈퍼플랫폼 SSO 동시 오픈 구현 계획 (확정)

> Auth 서버와 학심정 동시 오픈, 인증은 Auth 서버가 담당, 개인정보는 Auth DB에서만 관리

**작성일**: 2026-04-17  
**정책 확정**: 동시 오픈 / Auth 인증 / 개인정보 Auth 일괄 관리 (ISMS)  
**이전 문서**: `migration-strategy-comprehensive.md` (3-Phase 점진 전환 → **폐기**, 본 문서로 대체)

---

## 1. 정책 변경에 따른 영향

### 1.1 이전 계획 vs 확정 계획

| 항목 | 이전 (3-Phase 점진 전환) | 확정 (동시 오픈) |
|------|------------------------|----------------|
| 오픈 시 인증 | Phase 1: 자체 → Phase 2: SSO | **처음부터 SSO** |
| 기존 회원 이관 | email 기반 자동 매핑 필요 | **불필요** (처음부터 SSO 가입) |
| 자체 로그인 fallback | 전환기에 병행 유지 | **불필요** (자체 로그인 없음) |
| 이중 JWT 지원 | 기존 JWT + SP JWT 병행 | **SP JWT만** |
| user.email/password | Phase 1~2 유지 → Phase 3 제거 | **처음부터 없음** |
| 개인정보 이관 | Phase 3에서 기존 데이터 이관 | **불필요** (처음부터 Auth에 저장) |

### 1.2 단순해지는 것

- 자체 인증 코드(MemberController의 login/signup/send-code/verify-code) **제거 가능**
- 이중 JWT 분기 처리 불필요
- 기존 회원 매핑 로직(email 기반 자동 매핑) 불필요
- user 테이블에 email/password 컬럼 자체가 불필요
- email_verification 테이블 불필요
- 자체 refresh_token 테이블도 불필요 (Auth 서버가 관리)
- 로그인 페이지에 자체 로그인 폼 불필요

### 1.3 달라지는 것

- 오픈 전에 Auth 연동이 **100% 완료**되어야 함 (fallback 없음)
- PersonalInfoResolver가 오픈 시점부터 동작해야 함
- Auth 서버 장애 = 학심정 전체 장애 (캐시로 완화)

---

## 2. 전체 구조

### 2.1 오픈 시점의 아키텍처

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│ 브라우저       │     │ 학심정 BE         │     │ Auth 서버     │
│ (Auth SDK)    │     │ (프록시+서비스)    │     │              │
└──────┬───────┘     └────────┬─────────┘     └──────┬───────┘
       │                      │                       │
  로그인/로그아웃              │                       │
  ──── SDK가 직접 ────────────────────────────────────▶│
       │                      │                       │
  토큰 교환/갱신              │                       │
  ──── SDK → 학심정 프록시 ──▶│ ── client_secret ────▶│
       │                      │                       │
  도메인 API                  │                       │
  ──── Bearer AT ────────────▶│                       │
       │                      │                       │
       │                      │  이름/이메일 필요 시    │
       │                      │ ── PersonalInfoResolver│
       │                      │    ── Auth API ───────▶│
       │                      │    ◀── 개인정보 ───────│
       │                      │                       │
       │                      │  그룹/상담/메모 등      │
       │                      │ ── 학심정 DB ──▶ MySQL │
```

### 2.2 데이터 분리 원칙

```
Auth 서버 DB (개인정보):           학심정 DB (서비스 데이터):
├─ email                          ├─ user (sp_user_id, role_code, tc_id, stdt_id, status)
├─ name                           ├─ group_info (그룹)
├─ gender                         ├─ group_member (user_no, stdt_id, member_type만)
├─ password                       ├─ counseling_info (상담)
├─ 학교명/학교급/지역              ├─ counseling_student (stdt_id, stdt_number만)
├─ 학년/반/번호                    ├─ memo_info (관찰 메모)
├─ 소셜 로그인 연동                ├─ school_record_info (생기부)
└─ 보호자 동의                     ├─ school_info (학교 마스터)
                                   ├─ role_group (권한 마스터)
                                   └─ 검사/진단 데이터 전부
```

---

## 3. 학심정 DB 스키마 (오픈 시점)

### 3.1 user 테이블 — 신규 설계

기존 email/password/nickname/gender 컬럼을 **처음부터 제외**한다.

```sql
CREATE TABLE `user` (
    user_no         BIGINT          NOT NULL AUTO_INCREMENT  COMMENT '회원 번호 (PK)',
    sp_user_id      VARCHAR(64)     NOT NULL    COMMENT '슈퍼플랫폼 publicUserId (UUID)',
    role_code       VARCHAR(20)     NOT NULL    COMMENT '권한 코드 (FK → role_group)',
    tc_id           VARCHAR(64)     NULL        COMMENT '교사 ID (TEACHER 계열 자동 채번)',
    stdt_id         VARCHAR(64)     NULL        COMMENT '학생 ID (STUDENT 자동 채번)',
    status          VARCHAR(20)     NOT NULL    DEFAULT 'ACTIVE' COMMENT 'ACTIVE/WITHDRAWN/SUSPENDED',
    last_login_at   DATETIME        NULL        COMMENT '마지막 로그인 일시',
    created_by      BIGINT          NOT NULL    DEFAULT 0,
    updated_by      BIGINT          NOT NULL    DEFAULT 0,
    created_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_no),
    UNIQUE KEY uk_user_sp_user_id (sp_user_id),
    UNIQUE KEY uk_user_tc_id (tc_id),
    UNIQUE KEY uk_user_stdt_id (stdt_id),
    INDEX idx_user_role (role_code),
    CONSTRAINT fk_user_role FOREIGN KEY (role_code) REFERENCES role_group (role_code) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='통합 회원 (개인정보는 Auth 서버에서 관리)';
```

**제거된 컬럼**: email, password, nickname, gender  
**추가된 컬럼**: sp_user_id (기존 user_no 대신 Auth 서버와의 연결 키)

### 3.2 group_member 테이블 — 개인정보 컬럼 제거

```sql
CREATE TABLE group_member (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    group_id        BIGINT          NOT NULL,
    user_no         BIGINT          NULL        COMMENT '회원 번호 (게스트는 NULL)',
    stdt_id         VARCHAR(64)     NOT NULL    COMMENT '학생 ID',
    member_type     VARCHAR(10)     NOT NULL    COMMENT 'STUDENT/GUEST',
    member_no       INT             NULL        COMMENT '순번',
    status          VARCHAR(20)     NOT NULL    DEFAULT 'ACTIVE',
    -- nickname, gender, email 컬럼 제거
    -- 표시 시 PersonalInfoResolver로 Auth API 조회
    joined_at       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    left_at         DATETIME        NULL,
    created_by      BIGINT          NOT NULL    DEFAULT 0,
    updated_by      BIGINT          NOT NULL    DEFAULT 0,
    created_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    -- ... 기존 인덱스/FK 유지
);
```

### 3.3 제거 대상 테이블/컬럼

| 대상 | 조치 |
|------|------|
| `email_verification` 테이블 | **DROP** (Auth 서버가 처리) |
| `refresh_token` 테이블 | **DROP** (Auth 서버가 관리) |
| `user.email, password, nickname, gender` | **처음부터 미생성** |
| `group_member.nickname, gender, email` | **처음부터 미생성** |
| `counseling_student.stdt_name` | **제거** (Auth API로 조회) |
| `group_invitation.email` | `invited_sp_user_id`로 대체 또는 Auth API 경유 |
| `guest_conversion_log.guest_email` | `guest_id`만 보관 |

### 3.4 게스트 처리

게스트는 Auth 서버에 계정이 없으므로 **예외적으로 학심정 DB에 최소 정보 저장**:

```sql
-- group_member 테이블에 게스트 전용 컬럼 유지
ALTER TABLE group_member
  ADD COLUMN guest_name VARCHAR(50) NULL COMMENT '게스트 닉네임 (게스트만, 회원은 NULL)';
```

게스트 토큰은 Auth 서버가 발급 (`POST /oauth2/guest-token`), JWT Claims에 `name`이 포함됨. 토큰 만료(2시간) 후에도 이름을 표시하기 위해 `guest_name`을 학심정 DB에 보관.

---

## 4. 백엔드 구현 목록

### 4.1 신규 생성 파일

| # | 파일 | 역할 |
|---|------|------|
| 1 | `api/sso/controller/AuthProxyController.java` | Auth 서버 프록시 4개 엔드포인트 |
| 2 | `api/sso/config/AuthServerProperties.java` | Auth 서버 연결 설정 |
| 3 | `common/resolver/PersonalInfoResolver.java` | Auth API 개인정보 조회 + Caffeine 캐시 |
| 4 | `common/resolver/PersonalInfo.java` | 개인정보 VO (email, name, gender) |
| 5 | `common/resolver/AuthApiClient.java` | Auth 서버 REST 호출 클라이언트 |
| 6 | `common/config/CacheConfig.java` | Caffeine 캐시 설정 |
| 7 | `common/security/SpJwtClaimFilter.java` | SP JWT Claims 파싱 필터 |
| 8 | `common/security/SpJwtClaimExtractor.java` | JWT payload 디코딩 유틸 |
| 9 | `api/sso/service/SsoUserService.java` | SSO 로그인 시 학심정 user 자동 생성/조회 |
| 10 | `api/sso/service/GuestTokenService.java` | 게스트 토큰 발급 (도메인 검증 + Auth 프록시) |

### 4.2 수정 대상 파일

| # | 파일 | 변경 내용 |
|---|------|----------|
| 11 | **`SecurityConfig.java`** | API 체인: 자체 JWT 필터 제거 → SpJwtClaimFilter로 교체, SSO 프록시 URL permitAll |
| 12 | **`UserMapper.java`** + **`UserMapper.xml`** | email/password/nickname/gender 관련 쿼리 제거, sp_user_id 기반 쿼리 추가 |
| 13 | **`GroupMemberMapper.xml`** | nickname/gender/email 컬럼 제거 |
| 14 | **`GroupQueryMapper.xml`** | 비정규화 JOIN 제거, sp_user_id 반환 |
| 15 | **`DgnssMapper.xml`** | `gm.nickname AS MEM_NM` 등 제거 → sp_user_id 반환 |
| 16 | **`CounselingStudentMapper.xml`** | stdt_name 제거 |
| 17 | **`User.java`** (Domain) | email/password/nickname/gender 필드 제거, sp_user_id 추가 |
| 18 | **`GroupMember.java`** | nickname/gender/email 제거, guest_name 추가 |
| 19 | **`CounselingStudent.java`** | stdtName 제거 |
| 20 | **`MemberService.java`** | 자체 login/signup/refreshToken 로직 제거, SSO 기반으로 전환 |
| 21 | **`GroupService.java`** | user→group_member 비정규화 복사 제거, 조회 시 PersonalInfoResolver |
| 22 | **`CounselingService.java`** | stdt_name 스냅샷 제거, 조회 시 PersonalInfoResolver |
| 23 | **`AdminUserService.java`** | 회원 목록/검색 → PersonalInfoResolver 배치 조회 |
| 24 | **`GuestAuthService.java`** | Auth 서버 게스트 토큰 연동으로 변경 |
| 25 | **`application.yml`** | Auth 서버 환경변수 추가 |

### 4.3 제거 대상 파일/코드

| 대상 | 이유 |
|------|------|
| `JwtUtil.java` | 자체 JWT 발급 불필요 (Auth 서버가 발급) |
| `JwtAuthenticationFilter.java` | SpJwtClaimFilter로 대체 |
| `EmailVerificationService.java` | Auth 서버가 이메일 인증 처리 |
| `EmailVerificationMapper.java` + XML | 테이블 자체 제거 |
| `RefreshTokenMapper.java` + XML | 테이블 자체 제거 |
| `MemberController`의 login/signup/send-code/verify-code | Auth 서버가 처리 |
| `PasswordValidator.java` | 비밀번호 검증은 Auth 서버 담당 |
| `LoginRateLimiter.java` | 로그인 시도 제한은 Auth 서버 담당 |
| `AdminUserDetailsService.java` | **보류** — Admin 인증 방식 결정 후 |

### 4.4 AuthProxyController 상세

```java
@RestController
@RequestMapping("/api/v1/auth")
public class AuthProxyController {

    // POST /api/v1/auth/token         — code → AT+RT 교환
    // POST /api/v1/auth/refresh       — RT → 새 AT+RT
    // POST /api/v1/auth/logout        — RT 무효화
    // POST /api/v1/auth/guest/token   — 게스트 JWT 발급

    // 모든 엔드포인트는 Auth 서버에 client_secret을 추가해서 전달하는 프록시 역할
    // 구현 참고: superplatform-auth/docs/auth-client/20260414-integration-kit/
    //           sample-backend/AuthProxyController.java
}
```

### 4.5 PersonalInfoResolver 상세

```java
@Component
public class PersonalInfoResolver {

    // 단건 조회: resolve(spUserId) → PersonalInfo
    //   캐시 hit → 즉시 반환
    //   캐시 miss → Auth API GET /api/v1/users/{id} → 캐시 저장 → 반환

    // 배치 조회: resolveBatch(List<spUserId>) → Map<spUserId, PersonalInfo>
    //   캐시에서 hit 분리 → miss만 Auth API POST /api/v1/users/batch → 병합

    // 캐시: Caffeine, TTL 5분, 최대 10,000건
    // Auth 장애 시: stale cache 반환, 완전 miss면 PersonalInfo.UNKNOWN ("---")
}
```

### 4.6 SsoUserService — SSO 로그인 시 학심정 user 자동 생성

```java
@Service
public class SsoUserService {

    /**
     * SSO 로그인 완료 후 학심정 user 조회 또는 자동 생성
     * - sp_user_id로 조회 → 있으면 반환
     * - 없으면 신규 생성 (role_code, tc_id/stdt_id 자동 채번)
     */
    public User findOrCreateUser(String spUserId, String userType) {
        User existing = userMapper.findBySpUserId(spUserId);
        if (existing != null) return existing;

        // 신규 생성
        String roleCode = mapUserType(userType); // TEACHER→TEACHER, STUDENT→STUDENT
        User user = User.builder()
            .spUserId(spUserId)
            .roleCode(roleCode)
            .tcId(isTeacher(roleCode) ? IdGenerator.generateTcId() : null)
            .stdtId("STUDENT".equals(roleCode) ? IdGenerator.generateStdtId() : null)
            .status(UserStatus.ACTIVE)
            .build();
        userMapper.insertUser(user);
        return user;
    }
}
```

### 4.7 SecurityConfig 변경

```java
// AS-IS: 자체 JWT 필터
.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

// TO-BE: SP JWT 파싱 필터
.authorizeRequests()
    // SSO 프록시 (public)
    .antMatchers("/api/v1/auth/**").permitAll()
    // 게스트 관련 (public)
    .antMatchers("/guest/exists", "/group/invite", "/group/join-guest").permitAll()
    // Swagger, health
    .antMatchers("/swagger-ui/**", "/v3/api-docs/**", "/actuator/health").permitAll()
    .anyRequest().authenticated()
.addFilterBefore(spJwtClaimFilter, UsernamePasswordAuthenticationFilter.class)
```

### 4.8 application.yml 추가

```yaml
superplatform:
  auth:
    server-url: ${SP_AUTH_SERVER_URL:http://localhost:8080}
    client-id: ${SP_AUTH_CLIENT_ID:haksimjung-service}
    client-secret: ${SP_AUTH_CLIENT_SECRET}

cache:
  personal-info:
    max-size: 10000
    ttl-minutes: 5
```

---

## 5. 프론트엔드 구현 목록

### 5.1 신규 생성

| # | 파일 | 역할 |
|---|------|------|
| 1 | `shared/lib/authClient.ts` | Auth Client SDK 타입 선언 + 초기화 |
| 2 | `shared/hooks/useSpAuth.ts` | SDK 기반 React 훅 (useSyncExternalStore) |

### 5.2 수정 대상

| # | 파일 | 변경 내용 |
|---|------|----------|
| 3 | **`index.html`** | Auth Client SDK CDN 스크립트 추가 |
| 4 | **`main.tsx`** | SDK init → handleRedirectResult → createRouter (부트스트랩 변경) |
| 5 | **`routes.tsx`** | `/auth/callback` 추가, `createBrowserRouter` 지연 생성 함수로 변경 |
| 6 | **`AuthContext.tsx`** | SDK 기반 전면 교체 (loginWithEmail 제거 → auth.login) |
| 7 | **`client.ts`** | 자체 Silent Refresh 전면 제거, SDK getAccessToken 사용 |
| 8 | **`LoginPage.tsx`** | 자체 로그인 폼 제거 → SSO 로그인 버튼만 |
| 9 | **`shared/types/index.ts`** | User 타입: email/name 제거, spUserId 추가 (백엔드 응답에서 채워줌) |
| 10 | `.env.development` / `.env.production` | SP 환경변수 추가 |

### 5.3 제거 대상

| 파일 | 이유 |
|------|------|
| `SignUpPage.tsx` | Auth 서버가 회원가입 처리 |
| `ForgotPasswordPage.tsx` | Auth 서버가 비밀번호 재설정 처리 |
| `LoginForm.tsx` | 자체 이메일/비밀번호 폼 불필요 |
| `features/auth/ui/` 하위 자체 로그인 컴포넌트들 | SSO로 대체 |

### 5.4 LoginPage 최종 형태

```tsx
export const LoginPage = () => {
  const { login } = useSpAuth();

  return (
    <Container>
      <Logo />
      <Title>학생심리정서행동검사</Title>
      <SsoLoginButton onClick={() => login()}>
        로그인
      </SsoLoginButton>
      <GuestButton onClick={() => navigate('/guest/join')}>
        게스트로 참여하기
      </GuestButton>
    </Container>
  );
};
```

### 5.5 main.tsx 부트스트랩

```typescript
async function bootstrap() {
  const auth = await AuthClient.init({
    authUrl: import.meta.env.VITE_SP_AUTH_URL,
    clientId: import.meta.env.VITE_SP_CLIENT_ID,
    redirectUri: window.location.origin + '/auth/callback',
  });

  const result = await auth.handleRedirectResult();

  if (result.type === 'callback' && result.authenticated) {
    window.history.replaceState(null, '', result.returnPath || '/');
  } else if (!result.authenticated) {
    const PUBLIC_PATHS = ['/guest', '/group/join'];
    const isPublic = PUBLIC_PATHS.some(p => window.location.pathname.startsWith(p));
    if (!isPublic) {
      const silent = await auth.trySilentLogin();
      // 미인증 상태 → 라우터에서 로그인 페이지로 리다이렉트
    }
  }

  const router = createRouter(); // replaceState 이후에 생성
  createRoot(document.getElementById('root')!).render(
    <AuthSdkProvider auth={auth}>
      <RouterProvider router={router} />
    </AuthSdkProvider>
  );
}

bootstrap();
```

### 5.6 client.ts 변경

```typescript
// AS-IS: 자체 Silent Refresh (~170줄)
// 제거 대상: isRefreshing, failedQueue, processQueue, tryRefreshToken 전부

// TO-BE: SDK 기반 (~20줄)
axiosInstance.interceptors.request.use((config) => {
  const token = auth.getAccessToken();
  if (token && !isPublicEndpoint(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const newToken = await auth.refreshAccessToken();
      if (newToken) {
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(error.config);
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 6. Admin 영역 처리

### 6.1 Admin 인증

Admin은 세션 기반 별도 인증이며 SSO 대상이 아니다. **Admin 전용 계정은 학심정 DB에 유지**한다.

```sql
-- admin_account 테이블 (신규, user 테이블에서 분리)
CREATE TABLE admin_account (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    email           VARCHAR(100)    NOT NULL,
    password        VARCHAR(255)    NOT NULL,  -- BCrypt
    nickname        VARCHAR(50)     NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_admin_email (email)
) COMMENT='관리자 계정 (SSO 미적용, 학심정 자체 관리)';
```

또는 기존 `user` 테이블에 role_code='ADMIN'인 사용자만 email/password를 예외적으로 유지하는 방법도 있으나, **Admin과 일반 회원을 분리하는 것이 ISMS 소명에 유리**.

### 6.2 Admin 회원 관리 페이지

개인정보(이름, 이메일) 표시 → PersonalInfoResolver 배치 조회로 변경.
회원 검색 → Auth 검색 API (`GET /api/v1/users/search`) 필요 (Auth 팀 확인).

### 6.3 비밀번호 초기화 기능 (오늘 구현한 것)

동시 오픈 시 일반 회원의 비밀번호는 Auth 서버가 관리하므로, **Admin 비밀번호 초기화 기능은 Admin 계정 전용으로만 유지**하거나, Auth 서버의 Admin API를 통해 처리해야 한다.

---

## 7. Auth 서버 측 필요 작업 (재확인)

| # | 요청 | 우선순위 |
|---|------|---------|
| 1 | **client_id / client_secret 발급** | 즉시 |
| 2 | **CORS에 학심정 도메인 등록** | 즉시 |
| 3 | **StudentProfile 엔티티 + CRUD API** | 필수 |
| 4 | **TeacherProfile에 school_level, region 추가** | 필수 |
| 5 | **사용자 검색 API** (Admin용) | 필수 |
| 6 | **배치 조회에 프로필 포함 옵션** | 필수 |
| 7 | 게스트 프로필 저장 여부 | 확인 필요 |

---

## 8. 작업 일정

### 8.1 선행 조건 (Auth 팀)

| 항목 | 필요 시점 | 비고 |
|------|----------|------|
| client_id/secret 발급 | **개발 착수 전** | 프록시 개발에 필요 |
| CORS 등록 | **개발 착수 전** | SDK 동작에 필요 |
| Auth 서버 개발 환경 접근 | **개발 착수 전** | localhost:8080 연동 테스트 |
| StudentProfile API | **통합 테스트 전** | 학생 추가 정보 저장/조회 |
| 검색 API | **통합 테스트 전** | Admin 회원 검색 |

### 8.2 학심정 개발 일정

| 주차 | 백엔드 | 프론트엔드 |
|------|--------|-----------|
| **1주차** | Auth 프록시 4개 엔드포인트 구현 + SpJwtClaimFilter + SsoUserService | SDK 연동 + main.tsx 부트스트랩 + AuthContext 교체 |
| **2주차** | PersonalInfoResolver + 캐시 구현 + DB 스키마 변경 (user, group_member 등) | client.ts 교체 + LoginPage 변경 + SignUp/ForgotPassword 제거 |
| **3주차** | Mapper XML 수정 (30+쿼리) + Service 수정 (8개) + 자체 인증 코드 제거 | 기존 컴포넌트 개인정보 표시 확인 (백엔드 응답 형식 유지로 대부분 수정 불필요) |
| **4주차** | Admin 영역 대응 + 게스트 플로우 연동 | 게스트 참여 플로우 연동 |
| **5주차** | 통합 테스트 + Auth 장애 시나리오 테스트 | E2E 테스트 |

**총 예상: 5주**

### 8.3 전체 타임라인

```
                Auth 팀                    학심정 팀
                ────────                   ────────
오픈 7주 전     client_id 발급 + CORS      
오픈 7주 전     StudentProfile 개발 착수    개발 착수 (1주차)
오픈 6주 전                                2주차
오픈 5주 전     StudentProfile 완료        3주차 (Mapper/Service 수정)
오픈 4주 전     검색 API 완료              4주차 (Admin/게스트)
오픈 3주 전                                5주차 (통합 테스트)
오픈 2주 전                                버그 수정 + 안정화
오픈 1주 전                                최종 검증
오픈             ═══════════ 동시 오픈 ═══════════
```

---

## 9. 리스크

| 리스크 | 영향도 | 대응 |
|--------|-------|------|
| Auth 서버 개발 지연 (StudentProfile 등) | **Critical** | 오픈 7주 전까지 Auth 팀 착수 필요 |
| Auth 서버 장애 시 학심정 전체 장애 | **Critical** | Caffeine 캐시 (5분 TTL) + stale cache fallback |
| 검색 API 미제공 시 Admin 회원 검색 불가 | **High** | Auth 팀 사전 협의 |
| 개발 기간 초과 (30+ 쿼리 수정 규모) | **High** | 백엔드 응답 형식 유지로 FE 수정 최소화 |
| 게스트 개인정보 ISMS 예외 소명 | **Medium** | 게스트는 비회원이므로 "회원 개인정보"와 분리 소명 |

---

## 부록: 기존 문서와의 관계

| 문서 | 상태 |
|------|------|
| `superplatform-auth-migration-analysis.md` | 참고용 유지 (초기 기술 분석) |
| `sso-integration-schedule-response.md` | **폐기** (동시 오픈으로 확정) |
| `personal-data-policy-case-analysis.md` | 참고용 유지 (B안 확정 근거) |
| `migration-strategy-comprehensive.md` | **폐기** (3-Phase → 본 문서로 대체) |
| `auth-server-side-changes.md` | 유효 (Auth 서버 측 변경은 동일) |
| **`final-implementation-plan.md`** (본 문서) | **현행 기준 문서** |

---

**문서 끝**
