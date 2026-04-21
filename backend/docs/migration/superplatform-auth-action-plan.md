# 학심정 — superplatform-auth 전환 실행 계획 (BE + FE)

> Auth Client SDK 연동 가이드 + 기존 마이그레이션 분석을 종합한 BE/FE 단계별 실행 계획

**작성일**: 2026-04-14
**참조 문서**:
- `superplatform-auth/docs/auth-client/20260412-architecture.md` — SDK 아키텍처
- `superplatform-auth/docs/auth-client/20260412-integration-guide.md` — 서비스 적용 가이드
- `superplatform-auth/docs/auth-client/20260414-integration-kit/` — BE 프록시 샘플 + API 스펙
- `backend/docs/migration/superplatform-auth-technical-analysis.md` — 기술 비교 분석
- `backend/docs/migration/superplatform-auth-integration.md` — 학심정 대응 분석

---

## 1. 전환 아키텍처 (최종 상태)

```
┌──────────────────────────────────────────────────┐
│  브라우저                                         │
│                                                  │
│  ┌──────────────────┐                            │
│  │ 학심정 FE          │                            │
│  │                    │                            │
│  │ <script>           │                            │
│  │ auth-client.js     │  ← SDK (UMD 번들)          │
│  └──────┬─────────────┘                            │
│         │                                          │
│         │  /api/v1/auth/token                      │
│         │  /api/v1/auth/refresh                    │
│         │  /api/v1/auth/logout                     │
│         │  /api/dgnss/*, /group/*, ...             │
└─────────┼──────────────────────────────────────────┘
          │
          ▼
  ┌────────────────────────────┐
  │ 학심정 BE (meta-dashboard)  │
  │                            │
  │ AuthProxyController (신규)  │ ─── client_secret ──→ Auth 서버
  │  POST /api/v1/auth/token   │     POST /oauth2/token
  │  POST /api/v1/auth/refresh │     POST /api/v1/auth/refresh
  │  POST /api/v1/auth/logout  │     POST /api/v1/auth/logout
  │                            │
  │ JwtClaimFilter (신규)       │ ← JWT payload에서 publicUserId 추출
  │                            │
  │ 기존 비즈니스 API (유지)     │
  │  /api/dgnss/*, /group/*    │
  └────────────────────────────┘
          │
          ▼
  ┌────────────────────────────┐
  │ Auth 서버 (superplatform)   │
  │                            │
  │ /oauth2/authorize          │
  │ /oauth2/token              │
  │ /oauth2/touch  ← SDK      │
  │ /oauth2/logout             │
  │                            │
  │ ST_SESSION 쿠키 (httpOnly)  │
  └────────────────────────────┘
```

**핵심**: 학심정 BE는 **프록시 3개 + JWT 클레임 필터** 추가만으로 연동 완료.
기존 비즈니스 API는 그대로 유지하되, 사용자 식별 방식만 userNo → publicUserId 경유로 변경.

---

## 2. 타임라인

```
Phase 0  현재 ~ 학심정 오픈
         ─────────────────────────
         자체 인증으로 서비스 오픈
         public_user_id 선행 추가 (전환 준비)

Phase 1  superplatform-auth 오픈 시 (D-Day)
         ─────────────────────────
         데이터 이관 + oauth2_client 등록

Phase 2  인증 전환 (D-Day ~ D+2주)
         ─────────────────────────
         BE 프록시 구현 + JWT 필터 교체
         추가 정보 API + 서비스 프로필 테이블
         자체 인증 비활성화

Phase 3  정리 (D+2주 이후)
         ─────────────────────────
         자체 인증 코드/테이블 제거
```

---

## 3. Phase 0: 선행 준비 (자체 인증으로 오픈)

> 기존 기능에 영향 없이, 향후 전환 비용을 줄이는 준비

### 3-1. DDL: user 테이블에 public_user_id 추가

```sql
ALTER TABLE `user`
  ADD COLUMN `public_user_id` VARCHAR(64) NULL AFTER `user_no`,
  ADD UNIQUE KEY `uk_user_public_id` (`public_user_id`);
```

### 3-2. 회원가입 시 자동 채번

```java
// MemberService.createUser() 수정
String publicUserId = UUID.randomUUID().toString().replace("-", "");
user.setPublicUserId(publicUserId);
```

- User.java에 `publicUserId` 필드 추가
- UserMapper.xml의 insert/update/select에 `public_user_id` 포함
- 로그인 응답에 `publicUserId` 포함 (프론트가 미리 저장)

### 3-3. 작업량

| 항목 | 파일 | 변경량 |
|------|------|--------|
| DDL | migration SQL | 1건 |
| Domain | User.java | 필드 1개 추가 |
| Mapper | UserMapper.xml | insert/update/select에 컬럼 추가 |
| Service | MemberService.createUser() | UUID 채번 1줄 |
| 로그인 응답 | MemberService.login() | 응답에 publicUserId 추가 |

---

## 4. Phase 1: 데이터 이관 (superplatform-auth 오픈 시)

### 4-1. 기존 회원 public_user_id backfill

Phase 0 이전 기존 회원은 public_user_id가 null.

```sql
UPDATE `user`
SET public_user_id = REPLACE(UUID(), '-', '')
WHERE public_user_id IS NULL;
```

### 4-2. 회원 데이터 → platform_user 이관

```sql
INSERT INTO superteacher_core.platform_user
  (public_user_id, tenant_id, email, password_hash, name, gender,
   user_type, auth_provider, status, created_by, updated_by)
SELECT
  u.public_user_id,
  1,
  u.email,
  u.password,                                 -- BCrypt 동일
  u.nickname,
  u.gender,
  CASE u.role_code
    WHEN 'TEACHER'        THEN 'TEACHER'
    WHEN 'STUDENT'        THEN 'STUDENT'
    WHEN 'ADMIN'          THEN 'ADMIN'
    WHEN 'PRINCIPAL'      THEN 'TEACHER'
    WHEN 'SUPERINTENDENT' THEN 'TEACHER'
    ELSE 'UNSET'
  END,
  'LOCAL',
  CASE u.status
    WHEN 'ACTIVE'    THEN 'ACTIVE'
    WHEN 'WITHDRAWN' THEN 'WITHDRAWN'
    WHEN 'SUSPENDED' THEN 'SUSPENDED'
  END,
  0, 0
FROM viva_meta.`user` u
WHERE u.status = 'ACTIVE'
  AND u.public_user_id IS NOT NULL;
```

### 4-3. role 매핑

```sql
INSERT INTO superteacher_core.user_role (user_id, role_id, granted_by, granted_at)
SELECT
  pu.id, r.id, 0, NOW()
FROM superteacher_core.platform_user pu
JOIN viva_meta.`user` u ON u.public_user_id = pu.public_user_id
JOIN superteacher_core.role r
  ON r.code = CASE u.role_code
    WHEN 'TEACHER'        THEN 'TEACHER'
    WHEN 'STUDENT'        THEN 'STUDENT'
    WHEN 'ADMIN'          THEN 'ADMIN'
    WHEN 'PRINCIPAL'      THEN 'TEACHER'
    WHEN 'SUPERINTENDENT' THEN 'TEACHER'
  END
  AND r.tenant_id = 1;
```

### 4-4. 교사 프로필 생성

```sql
INSERT INTO superteacher_core.teacher_profile (user_id, created_by, updated_by)
SELECT pu.id, 0, 0
FROM superteacher_core.platform_user pu
WHERE pu.user_type = 'TEACHER';
```

### 4-5. oauth2_client 등록 요청

Auth 팀에 전달할 정보:

| 항목 | 개발 | 운영 |
|------|------|------|
| 서비스명 | 학심정 (meta-dashboard) | 동일 |
| client_id | `meta-dashboard` | `meta-dashboard` |
| redirect_uris | `["https://t-meta-service.vsaidt.com/auth/callback", "http://localhost:5173/auth/callback"]` | `["https://meta-service.vsaidt.com/auth/callback"]` |
| 담당자 | (본인 연락처) | 동일 |

### 4-6. 이관 검증

```sql
-- 이관 누락 확인
SELECT COUNT(*) AS missing
FROM viva_meta.`user` u
LEFT JOIN superteacher_core.platform_user pu
  ON u.public_user_id = pu.public_user_id
WHERE u.status = 'ACTIVE' AND pu.id IS NULL;

-- 비밀번호 해시 일치 (샘플)
SELECT u.email, (u.password = pu.password_hash) AS pw_match
FROM viva_meta.`user` u
JOIN superteacher_core.platform_user pu ON u.public_user_id = pu.public_user_id
LIMIT 10;
```

---

## 5. Phase 2: 인증 전환

### 5-1. BE 프록시 엔드포인트 구현 (신규)

SDK가 호출하는 프록시 3개. `AuthProxyController` 샘플 기반으로 구현.

| 엔드포인트 | Auth 서버 호출 | Content-Type | 비고 |
|-----------|---------------|-------------|------|
| `POST /api/v1/auth/token` | `POST /oauth2/token` | form-urlencoded | client_id + client_secret 추가 |
| `POST /api/v1/auth/refresh` | `POST /api/v1/auth/refresh` | JSON | 401/403 전파 필수 |
| `POST /api/v1/auth/logout` | `POST /api/v1/auth/logout` | JSON | 실패해도 success:true |

**응답 포맷** (SDK 규약):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "xxx...",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "refreshExpiresIn": 604800
  }
}
```

**쿠키/body 양쪽 호환**: localStorage 모드와 cookie 모드 SDK 모두 지원.
body에서 RT 먼저 확인 → 없으면 쿠키에서 fallback.
응답 시 body + Set-Cookie 양쪽으로 RT 전달.

**환경변수 추가**:
```yaml
# application-vs-dev.yml
oauth2:
  client-id: meta-dashboard
  client-secret: ${OAUTH2_CLIENT_SECRET}
  auth-server-url: https://t-superteacher-api.vsaidt.com
```

### 5-2. JWT 클레임 필터 교체

기존 `JwtAuthenticationFilter` → `JwtClaimFilter` 교체.

**현재 (자체 JWT)**:
- JwtUtil로 서명 검증 + Claims 파싱
- subject: userNo → SecurityContext에 저장

**변경 후 (superplatform JWT)**:
- `JwtClaimExtractor`로 payload 디코딩 (서명 검증은 Auth 서버가 담당)
- request attribute에 저장: `userId`(publicUserId), `userEmail`, `userName`, `userType`, `tenantId`

```java
// 컨트롤러에서 사용
var claims = (JwtClaimExtractor.Claims) request.getAttribute("claims");
String publicUserId = claims.userId();   // UUID
String email = claims.email();
```

### 5-3. SecurityUtil 변경

```java
// 기존
public static Long getCurrentUserNo() { ... }

// 추가
public static String getCurrentPublicUserId() {
    // request attribute에서 "userId" 조회
}

// userNo가 필요한 기존 서비스 로직 호환
public static Long getCurrentUserNo() {
    String publicUserId = getCurrentPublicUserId();
    return userMapper.findUserNoByPublicUserId(publicUserId);
}
```

**UserMapper에 추가**:
```sql
<select id="findUserNoByPublicUserId" resultType="long">
    SELECT user_no FROM `user` WHERE public_user_id = #{publicUserId}
</select>
```

### 5-4. SecurityConfig 변경

```java
// API 영역 Security 설정
http
  .cors().and()
  .csrf().disable()
  .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
  .and()
  .authorizeRequests()
    // Auth 프록시 (SDK가 호출, 인증 불필요)
    .antMatchers("/api/v1/auth/**").permitAll()
    // 게스트 (서비스 자체 처리)
    .antMatchers("/guest/**", "/group/invite", "/group/join-guest").permitAll()
    // 공개
    .antMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
    .antMatchers("/actuator/health").permitAll()
    // 나머지 인증 필수
    .anyRequest().authenticated()
  .and()
  .addFilterBefore(jwtClaimFilter, UsernamePasswordAuthenticationFilter.class);
```

**변경 포인트**:
- 기존 `JwtAuthenticationFilter` → `JwtClaimFilter`로 교체
- `/api/v1/auth/**` permitAll 추가 (프록시 엔드포인트)
- 기존 `/member/login`, `/member/signup` 등 제거

### 5-5. 서비스 프로필 테이블 + API (신규)

플랫폼에서 수집하지 않는 서비스 고유 정보 저장.

```sql
CREATE TABLE service_profile (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    public_user_id  VARCHAR(64) NOT NULL,
    user_no         BIGINT NULL COMMENT '기존 user 테이블 FK (호환용)',
    gender          VARCHAR(10) NULL,
    school_name     VARCHAR(200) NULL,
    school_level    VARCHAR(20) NULL COMMENT 'elementary|middle',
    grade           VARCHAR(10) NULL,
    class_number    INT NULL,
    student_number  INT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_sp_public_user (public_user_id),
    INDEX idx_sp_user_no (user_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

```
POST /api/service/profile       추가 정보 저장
GET  /api/service/profile       내 프로필 조회
GET  /api/service/profile/exists 최초 진입 여부 확인
```

### 5-6. 기존 회원 SSO 전환 API (신규)

자체 가입 → 플랫폼 SSO 전환 시 매핑.

```
POST /api/service/link-sso
Authorization: Bearer {superplatform JWT}

Request: { "email": "user@example.com" }

동작:
  1. JWT에서 publicUserId 추출
  2. email로 기존 user 테이블 조회
  3. user.public_user_id = publicUserId 매핑
  4. service_profile에 기존 정보 복사 (gender, school 등)
```

### 5-7. 자체 인증 비활성화

- `/member/login`, `/member/signup`, `/member/token/refresh` → 410 Gone 응답
- 또는 SecurityConfig에서 경로 제거

### 5-8. event_outbox 수신 (플랫폼 전파 방식 확정 후)

플랫폼에서 회원 생성/수정/탈퇴 이벤트 수신 → 로컬 user 테이블 동기화.

```java
@PostMapping("/internal/events/user")
public void handleUserEvent(@RequestBody UserEvent event) {
    switch (event.type) {
        case "USER_CREATED" -> createLocalUser(event);
        case "USER_UPDATED" -> updateLocalUser(event);
        case "USER_WITHDRAWN" -> deactivateLocalUser(event);
    }
}
```

전파 방식 (폴링/웹훅/메시지큐) 협의 필요.

---

## 6. Phase 3: 정리

### 6-1. 제거 대상 코드

```
# 인증 Controller/Service (전체 제거)
MemberController.java
EmailVerificationController.java
MemberService.java
EmailVerificationService.java

# Security (교체 완료 후 구버전 제거)
JwtUtil.java
JwtAuthenticationFilter.java (→ JwtClaimFilter로 교체됨)
LoginRateLimiter.java
PasswordValidator.java
JwtExpiredException.java
AuthFailedException.java

# Mapper
RefreshTokenMapper.java / RefreshTokenMapper.xml (전체)
EmailVerificationMapper.xml (전체)
UserMapper.xml의 insert/update (조회는 유지)
```

### 6-2. 제거 대상 테이블

```sql
DROP TABLE refresh_token;
DROP TABLE email_verification;
```

### 6-3. 유지 대상

| 항목 | 이유 |
|------|------|
| `user` 테이블 | group_member, memo_info, counseling_info 등 FK 참조. event_outbox로 동기화 |
| `tc_id` / `stdt_id` | 검사/상담/메모 등 비즈니스 식별자 (108+ 쿼리 참조) |
| `user_no` | 내부 FK 전용. publicUserId 경유 변환으로 호환 |
| 게스트 인증 | 서비스 레벨 (플랫폼 미관여). 자체 JWT 유지 or 별도 협의 |
| Admin 세션 인증 | 당장 변경 불필요. 향후 SSO 전환 별도 |

---

## 7. FE 대응 상세

### 7-1. Auth Client SDK 적용 (Phase 2)

SDK는 UMD 번들로 `<script>` 태그 1줄로 로드. `window.AuthClient` 전역 사용.

**index.html**:
```html
<script src="/sdk/auth-client.js"></script>
```

**TypeScript 타입 선언** — `sample-react/auth.ts`를 프로젝트에 복사:
```ts
// 핵심 타입
interface AuthUser {
  publicUserId: string;
  email: string;
  name: string;
  userType: string;
}

interface RedirectResult {
  type: 'callback' | 'normal';
  authenticated: boolean;
  user: AuthUser | null;
  returnPath?: string;
  error?: string;
}
```

**SDK 초기화** (`auth.ts`):
```ts
export let auth: AuthClientInstance;

export async function initAuth(): Promise<void> {
  auth = await AuthClient.init({
    authUrl:     import.meta.env.VITE_AUTH_URL,
    clientId:    import.meta.env.VITE_CLIENT_ID,
    redirectUri: window.location.origin + '/auth/callback',
  });
}
```

**환경변수** (`.env`):
```
VITE_AUTH_URL=https://t-superteacher-api.vsaidt.com
VITE_CLIENT_ID=meta-dashboard
```

### 7-2. 앱 부트스트랩 변경 (main.tsx)

현재 React 렌더링 전에 SDK 초기화 + 인증 상태 판단 수행:

```tsx
async function bootstrap(): Promise<void> {
  // 1) SDK 초기화
  await initAuth();

  // callback 처리 중이면 로딩 표시
  const params = new URLSearchParams(window.location.search);
  if (params.has('code') || params.has('error')) {
    showLoading();
  }

  // 2) 인증 상태 판단
  const result = await auth.handleRedirectResult();

  if (result.type === 'callback') {
    if (result.authenticated) {
      window.history.replaceState(null, '', result.returnPath || '/');
    } else {
      showError(result.error);
      return;
    }
  } else if (!result.authenticated) {
    // 3) 미인증 → SSO silent login 시도
    await auth.trySilentLogin();
  }

  // 4) React 앱 렌더링
  root.render(<StrictMode><App /></StrictMode>);
}

bootstrap();
```

### 7-3. AuthContext 교체

현재 자체 AuthContext → SDK 기반 `useAuth` 훅으로 교체:

```tsx
// useAuth.ts — useSyncExternalStore 기반
import { useSyncExternalStore } from 'react';
import { auth } from './auth';

export function useAuth() {
  const user = useSyncExternalStore(
    (onStoreChange) => auth.onAuthChange(onStoreChange),
    () => auth.getUser(),
  );

  return {
    user,
    isAuthenticated: user !== null,
    login: (options?) => auth.login(options),
    logout: () => auth.logout(),
    getAccessToken: () => auth.getAccessToken(),
  };
}
```

### 7-4. API Client 변경

**현재**: `apiClient`가 localStorage에서 auth_token 읽어서 Bearer 주입
**변경**: SDK의 `authorizedFetch()` 사용 또는 기존 axios 인터셉터에서 SDK 토큰 사용

```ts
// 옵션 A: SDK authorizedFetch 직접 사용
const response = await auth.authorizedFetch('/api/dgnss/tc/stinfolist?dgnssId=14');

// 옵션 B: 기존 axios 인터셉터에서 SDK 토큰 주입 (기존 코드 변경 최소화)
axiosInstance.interceptors.request.use((config) => {
  const token = auth.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**Silent Refresh**: SDK의 `refreshAccessToken()`이 자동 처리. 기존 `tryRefreshToken()` 제거.

### 7-5. User 타입 변경

```ts
// 현재
interface User {
  id: string;           // userNo
  name: string;
  email: string;
  memberType: MemberType;
  provider: OAuthProvider;
  // ...
}

// 변경
interface User {
  publicUserId: string; // UUID (SDK AuthUser.publicUserId)
  id: string;           // 호환용 (publicUserId와 동일값)
  name: string;
  email: string;
  userType: string;     // TEACHER | STUDENT | GUEST
  // memberType, provider 제거 또는 매핑
}
```

### 7-6. 추가 정보 입력 페이지 (신규)

플랫폼 로그인 후 학심정 최초 진입 시 표시. BE의 `/api/service/profile/exists` 호출 → false면 입력 화면.

```
입력 항목:
  - 성별 (M/F)
  - 학교명
  - 학교급 (초등/중등)
  - 학년, 반, 번호
```

라우트 추가: `/service/setup` 또는 `/onboarding`

### 7-7. 라우트 가드 변경

```tsx
// 현재: AuthContext의 isAuthenticated
// 변경: SDK의 useAuth() 훅

const ProtectedLayout = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    auth.login({ redirectPath: window.location.pathname });
    return <Loading />;
  }
  return <Outlet />;
};
```

비인증 시 플랫폼 로그인 페이지로 리다이렉트 (`auth.login()`).

### 7-8. 로그인/회원가입 UI 제거

| 제거 대상 | 대체 |
|-----------|------|
| LoginPage | 플랫폼 로그인 (auth.login() 리다이렉트) |
| SignUpPage | 플랫폼 회원가입 |
| LoginForm | 제거 |
| TestLoginForm | 개발용 유지 가능 |

### 7-9. 게스트 플로우 유지

QR코드 → 게스트 참여는 서비스 레벨이므로 기존 플로우 유지.
`JoinGroupPage.tsx`의 게스트 분기는 그대로.

### 7-10. 크로스탭 로그아웃

현재: StorageEvent로 auth_token 감지
변경: SDK의 BroadcastChannel이 자동 처리. `onAuthChange(null)` 콜백 수신.

### 7-11. FE 변경 대상 파일 목록

```
# 핵심 (신규/전면 변경)
shared/auth/auth.ts (신규 — SDK 타입 선언 + 초기화)
shared/auth/useAuth.ts (신규 — useSyncExternalStore 훅)
main.tsx (변경 — bootstrap 로직)
index.html (변경 — SDK script 태그 추가)

# 인증 (교체)
features/auth/model/AuthContext.tsx (제거 → useAuth로 대체)
shared/api/client.ts (변경 — 토큰 주입 방식, Silent Refresh 제거)

# UI (제거/변경)
pages/auth/LoginPage.tsx (제거)
pages/auth/SignUpPage.tsx (제거)
features/auth/ui/LoginForm.tsx (제거)

# 라우팅
app/router/routes.tsx (변경 — 가드 변경, 추가 정보 입력 라우트 추가)

# 타입
shared/types/index.ts (변경 — User 인터페이스)

# 신규 페이지
pages/onboarding/ServiceProfilePage.tsx (신규 — 추가 정보 입력)

# 게스트 (소폭 변경)
pages/groups/JoinGroupPage.tsx (로그인 분기만 변경)

# 환경변수
.env (추가 — VITE_AUTH_URL, VITE_CLIENT_ID)
```

---

## 8. Phase별 작업 체크리스트 (BE + FE)

### Phase 0 (지금)

**BE:**
- [ ] DDL: user 테이블에 public_user_id 컬럼 추가
- [ ] User.java에 publicUserId 필드 추가
- [ ] UserMapper.xml에 public_user_id 포함
- [ ] MemberService.createUser()에서 UUID 자동 채번
- [ ] 로그인 응답에 publicUserId 포함
- [ ] 빌드/테스트 확인

**FE:**
- [ ] User 타입에 publicUserId 필드 추가 (선행)
- [ ] 로그인 응답에서 publicUserId 저장 (localStorage)

### Phase 1 (superplatform-auth 오픈 시)

**BE:**
- [ ] 기존 회원 public_user_id backfill (UPDATE SQL)
- [ ] platform_user 이관 SQL 실행
- [ ] user_role 매핑 SQL 실행
- [ ] teacher_profile 생성 SQL 실행
- [ ] 이관 검증 쿼리 실행
- [ ] Auth 팀에 oauth2_client 등록 요청
- [ ] client_secret 수령 → 환경변수 설정

**FE:**
- [ ] SDK 번들 확보 (auth-client.js → public/ 에 배치)

### Phase 2 (인증 전환)

**BE:**
- [ ] AuthProxyController 구현 (token/refresh/logout 프록시 3개)
- [ ] JwtClaimExtractor 구현 (JWT payload 파싱)
- [ ] JwtClaimFilter 구현 (request attribute에 클레임 저장)
- [ ] SecurityConfig 변경 (필터 교체, permitAll 경로)
- [ ] SecurityUtil 변경 (publicUserId 기반 + userNo 변환)
- [ ] UserMapper에 findUserNoByPublicUserId 추가
- [ ] service_profile 테이블 DDL
- [ ] 서비스 프로필 API 구현 (저장/조회/exists)
- [ ] SSO 전환 API 구현 (link-sso)
- [ ] 자체 인증 API 비활성화 (410 Gone)
- [ ] event_outbox 수신 로직 (전파 방식 확정 후)
- [ ] 환경변수 추가 (oauth2.*)
- [ ] 통합 테스트

**FE:**
- [ ] index.html에 SDK script 태그 추가
- [ ] auth.ts 생성 (SDK 타입 선언 + 초기화)
- [ ] useAuth.ts 생성 (useSyncExternalStore 훅)
- [ ] main.tsx 변경 (bootstrap 로직)
- [ ] AuthContext 제거 → useAuth 훅으로 교체
- [ ] API Client 변경 (토큰 주입 방식)
- [ ] 라우트 가드 변경 (auth.login() 리다이렉트)
- [ ] 추가 정보 입력 페이지 개발
- [ ] LoginPage / SignUpPage / LoginForm 제거
- [ ] User 타입 변경 (publicUserId 기반)
- [ ] .env에 VITE_AUTH_URL, VITE_CLIENT_ID 추가
- [ ] JoinGroupPage 로그인 분기 변경
- [ ] 통합 테스트

### Phase 3 (정리)

**BE:**
- [ ] 자체 인증 코드 삭제
- [ ] Security 관련 구버전 삭제
- [ ] refresh_token / email_verification 테이블 DROP
- [ ] 미사용 환경변수 정리

**FE:**
- [ ] 기존 AuthContext 관련 파일 완전 삭제
- [ ] useAuthStore (Zustand) 제거
- [ ] TestLoginForm 정리 (필요 시 유지)

---

## 9. 협의 필요 사항 (재정리)

| # | 항목 | 상대 | 상태 |
|---|------|------|------|
| 1 | oauth2_client 등록 | Auth 팀 | Phase 1에서 요청 |
| 2 | client_secret 수령 | Auth 팀 | Phase 1에서 수령 |
| 3 | JWT 서명 검증 방식 | Auth 팀 | 현재 샘플은 payload만 파싱 (GW 검증 전제). 자체 검증 필요 시 비밀키 공유 협의 |
| 4 | event_outbox 전파 스펙 | Auth 팀 | 이벤트 포맷, 전달 방식 (폴링/웹훅/MQ) |
| 5 | 게스트 이메일 인증 주체 | Auth 팀 + 기획 | 플랫폼 vs 학심정 자체 |
| 6 | 전환 기간 운영 | Auth 팀 | dual validation 필요 여부, 기존 사용자 재로그인 공지 |
| 7 | Auth 서버 URL | Auth 팀 | 환경별 (로컬/개발/운영) 확정값 |
| 8 | SDK CDN 배포 경로 | Auth 팀 | 운영 SDK URL 확정 |
| 9 | 추가 정보 입력 시점 | 기획 | 플랫폼 가입 직후 vs 학심정 최초 진입 시 |
| 10 | 14세 미만 가입 | 기획 | 보호자 동의 플로우 대응 범위 |
