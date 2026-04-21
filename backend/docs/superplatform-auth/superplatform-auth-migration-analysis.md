# 슈퍼플랫폼 통합인증 전환 대응방안 분석서

> 학심정(학생심리정서행동검사) 서비스의 SuperPlatform SSO(OAuth2 + PKCE) 통합 인증 전환을 위한 종합 분석 보고서  
> **실제 `superplatform-auth` 프로젝트 소스 분석 기반**

**작성일**: 2026-04-16  
**대상 시스템**: meta-dashboard (학심정)  
**참조 프로젝트**: `D:\workspace\superplatform-auth` (SuperPlatform Auth Server + Auth Client SDK)

---

## 목차

1. [SuperPlatform Auth 시스템 분석](#1-superplatform-auth-시스템-분석)
2. [현행 학심정 인증 시스템](#2-현행-학심정-인증-시스템)
3. [GAP 분석](#3-gap-분석)
4. [학심정 측 구현 범위](#4-학심정-측-구현-범위)
5. [백엔드 변경 상세](#5-백엔드-변경-상세)
6. [프론트엔드 변경 상세](#6-프론트엔드-변경-상세)
7. [DDL 변경 사항](#7-ddl-변경-사항)
8. [데이터 이관 전략](#8-데이터-이관-전략)
9. [작업 절차 및 단계별 계획](#9-작업-절차-및-단계별-계획)
10. [리스크 및 미결 사항](#10-리스크-및-미결-사항)

---

## 1. SuperPlatform Auth 시스템 분석

### 1.1 기술 스택

| 구성 요소 | 기술 |
|----------|------|
| 프로토콜 | **OAuth2 Authorization Code Grant + PKCE S256** (RFC 6749, RFC 7636) |
| 토큰 | JWT Access Token (HS256) + Opaque Refresh Token (32-byte base64url) |
| SSO 세션 | ST_SESSION 쿠키 (HttpOnly, 7일 idle / 12시간 absolute) |
| 소셜 로그인 | Google, Kakao, Naver |
| Backend | Spring Boot 4.0, Java 21, Spring Data JPA |
| SDK | `@superplatform/auth-client` (UMD 번들, CDN 배포) |

### 1.2 JWT Access Token Claims

```json
{
  "sub": "public-user-id (UUID)",    // 사용자 고유 ID
  "email": "user@example.com",
  "name": "홍길동",
  "userType": "TEACHER",             // UNSET / TEACHER / STUDENT / ADMIN / GUEST
  "roles": ["TEACHER"],
  "tid": 1,                          // 테넌트 ID
  "aud": "client_id",                // 대상 서비스
  "iss": "superplatform",
  "iat": 1712700000,
  "exp": 1712703600                  // 15분 후
}
```

### 1.3 토큰 수명

| 토큰 | TTL | 비고 |
|------|-----|------|
| Access Token | 15분 | JWT, HS256 서명 |
| Refresh Token | 7일 | Opaque, SHA-256 해시로 DB 저장, **Rotation** (사용 시 즉시 폐기 + 새 RT 발급) |
| Guest Token | 2시간 | JWT, RT 없음, SSO 세션 없음 |
| Authorization Code | 30초 | 1회용 |

### 1.4 서비스 연동 구조 (핵심)

SuperPlatform은 **서비스 BE가 프록시 역할**을 하는 BFF(Backend For Frontend) 패턴을 사용한다.

```
┌───────────┐     ┌──────────────┐     ┌───────────────┐
│ 브라우저    │     │ 학심정 BE     │     │ Auth Server   │
│ (SDK)      │     │ (프록시)      │     │ (Core API)    │
└─────┬─────┘     └──────┬───────┘     └──────┬────────┘
      │                   │                     │
 ① PKCE 생성             │                     │
 ② → /oauth2/authorize ──────────────────────▶│
      │                   │  (브라우저 리다이렉트) │
      │                   │                     │ 로그인/동의 처리
 ③ ← redirect_uri?code=X │                     │
      │                   │                     │
 ④ code+verifier ────────▶│                     │
      │                   │ ⑤ POST /oauth2/token│
      │                   │  + client_secret ──▶│
      │                   │                     │ ⑥ PKCE 검증
      │                   │ ◀── AT + RT ────────│
 ⑦ ← AT + RT ◀───────────│                     │
      │                   │                     │
 ⑧ API 호출              │                     │
  Authorization: Bearer AT│                     │
```

### 1.5 서비스 BE가 구현해야 하는 프록시 엔드포인트

| 엔드포인트 | Auth 서버 호출 | 용도 |
|-----------|---------------|------|
| `POST /api/v1/auth/token` | `POST /oauth2/token` (form-urlencoded) | code → 토큰 교환 (client_secret 추가) |
| `POST /api/v1/auth/refresh` | `POST /api/v1/auth/refresh` (JSON) | RT → 새 AT/RT (RT Rotation) |
| `POST /api/v1/auth/logout` | `POST /api/v1/auth/logout` (JSON) | RT 무효화 (token family 전체 삭제) |
| `POST /api/v1/auth/guest/token` | `POST /oauth2/guest-token` (JSON) | 게스트 JWT 발급 (client_secret 추가) |

> 참고 구현: `superplatform-auth/docs/auth-client/20260414-integration-kit/sample-backend/AuthProxyController.java`

### 1.6 Auth Client SDK Public API

```typescript
const auth = await AuthClient.init({
  authUrl: 'https://auth.superplatform.com',
  clientId: 'haksimjung-service',
  redirectUri: window.location.origin + '/auth/callback',
});
```

| 메서드 | 설명 |
|--------|------|
| `login(options?)` | Auth 서버 로그인 페이지로 리다이렉트 |
| `logout()` | 토큰 삭제 + 다른 탭 전파 + SSO 세션 삭제 |
| `handleRedirectResult()` | 페이지 로드 시 1회 호출 (콜백 처리 + 세션 복구) |
| `trySilentLogin()` | prompt=none으로 SSO 세션 복구 시도 |
| `getUser()` | 현재 사용자 (`{ publicUserId, email, name, userType }`) |
| `isAuthenticated()` | 로그인 여부 |
| `getAccessToken()` | AT 반환 (만료 시 자동 청소) |
| `authorizedFetch(url, init)` | AT 자동 주입 + 만료 시 refresh + 401 재시도 |
| `refreshAccessToken()` | RT로 AT 갱신 (single-flight 보호) |
| `setGuestToken(at)` | 게스트 JWT 주입 |
| `onAuthChange(cb)` | 인증 상태 변경 리스너 |

### 1.7 PlatformUser 엔티티 (Auth 서버 측 사용자)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | Long (PK) | 내부 ID |
| public_user_id | UUID (UNIQUE) | 외부 노출용 식별자 (JWT sub) |
| tenant_id | Long | 멀티테넌트 |
| email | String(255) | 이메일 (테넌트 내 UNIQUE) |
| password_hash | String | BCrypt |
| name | String(100) | 표시 이름 |
| gender | String(10) | M/F |
| user_type | Enum | UNSET / TEACHER / STUDENT / ADMIN |
| auth_provider | Enum | LOCAL / GOOGLE / KAKAO / NAVER |
| status | Enum | ACTIVE / INACTIVE / SUSPENDED / DELETED |
| guardian_consented | Boolean | 14세 미만 보호자 동의 |
| last_login_at | DateTime | 마지막 로그인 |

### 1.8 게스트 토큰 구조

게스트 토큰은 **Auth 서버가 발급**하되, 도메인 로직(참여 검증 등)은 **서비스 BE**가 처리한다.

```
서비스 FE → 서비스 BE (도메인 검증: 초대코드 확인, 게스트 등록)
         → Auth 프록시 (POST /api/v1/auth/guest/token)
         → Auth 서버 (POST /oauth2/guest-token + client_secret)
         ← { accessToken, guestId: "guest_xxx" }
서비스 FE: auth.setGuestToken(accessToken)
```

JWT Claims: `{ sub: "guest_xxx", name: "김철수", userType: "GUEST", roles: [] }`

---

## 2. 현행 학심정 인증 시스템

### 2.1 인증 아키텍처 현황

| 구분 | 현행 |
|------|------|
| 인증 주체 | 학심정 자체 (독립 인증) |
| 로그인 식별자 | email (UNIQUE) |
| 비밀번호 | BCrypt, 자체 정책 (10~64자, 2종류 이상) |
| Access Token | 자체 JWT (HS256, **30분**) |
| Refresh Token | 자체 JWT (SHA-256 해시 저장, **14일**) |
| SSO | 미지원 |
| 소셜 로그인 | 미지원 |
| 게스트 | 초대코드 + 이메일 인증 → 자체 Guest JWT |
| Admin | 별도 세션 기반 Form Login |

### 2.2 핵심 파일

| Backend | 역할 |
|---------|------|
| `SecurityConfig.java` | 이중 보안 체인 (Admin=Session @Order(1), API=JWT @Order(2)) |
| `JwtUtil.java` | JWT 생성/검증, Claims: `{userNo, email, userSeCd, tokenType}` |
| `JwtAuthenticationFilter.java` | Bearer 토큰 검증, SecurityContext 설정 |
| `MemberController.java` | 로그인/가입/토큰갱신/로그아웃 |
| `MemberService.java` | 인증 비즈니스 로직 |
| `GuestAuthService.java` | 게스트 인증 (초대코드 기반) |

| Frontend | 역할 |
|----------|------|
| `AuthContext.tsx` | React Context 인증 상태 관리 |
| `client.ts` | Axios + Silent Refresh + 동시요청 큐 |
| `LoginForm.tsx` / `LoginPage.tsx` | 로그인 UI |

### 2.3 현행 JWT Claims

```json
// MEMBER
{ "tokenType": "MEMBER", "userNo": 123, "email": "...", "userSeCd": "TEACHER" }
// GUEST
{ "tokenType": "GUEST", "stdtId": "uuid", "claId": "group-uuid", "email": "..." }
```

### 2.4 현행 DB 스키마 (인증 관련)

| 테이블 | 용도 |
|--------|------|
| `user` | 회원 (user_no PK, email UNIQUE, password BCrypt, role_code, tc_id, stdt_id) |
| `role_group` | 권한 마스터 (STUDENT=1, TEACHER=2, ..., ADMIN=99) |
| `refresh_token` | RT 해시 저장 (user_no 또는 stdt_id) |
| `email_verification` | 이메일 인증코드 (6자리, 5분 TTL) |
| `auth_school_map` | 직책별 학교 접근 매핑 |

---

## 3. GAP 분석

### 3.1 핵심 차이

| # | 영역 | 현행 (학심정) | 목표 (SuperPlatform SSO) | 변경 규모 |
|---|------|-------------|------------------------|----------|
| 1 | **인증 주체** | 자체 email/password | Auth 서버 OAuth2 + PKCE | **Critical** |
| 2 | **토큰 발급** | 학심정 BE가 직접 발급 | Auth 서버가 발급 → 학심정 BE는 **프록시** | **Critical** |
| 3 | **JWT 구조** | `{userNo, email, userSeCd}` | `{sub(UUID), email, name, userType, roles, tid}` | **High** |
| 4 | **사용자 식별자** | `user_no` (BIGINT) | `publicUserId` (UUID) — Auth 서버 발급 | **High** |
| 5 | **토큰 수명** | AT 30분 / RT 14일 | AT 15분 / RT 7일 (Rotation) | **Medium** |
| 6 | **소셜 로그인** | 미지원 | Google/Kakao/Naver (Auth 서버가 처리) | **서비스 측 변경 없음** |
| 7 | **회원가입** | 자체 이메일 인증 → 가입 | Auth 서버 공통 가입 → 서비스 연동 동의 | **High** |
| 8 | **프론트엔드 인증** | Axios interceptor 자체 구현 | **Auth Client SDK** 사용 | **Critical** |
| 9 | **게스트 인증** | 자체 초대코드 + 이메일 인증 | Auth 서버 게스트 토큰 + 서비스 도메인 로직 | **Medium** |
| 10 | **비밀번호 관리** | 자체 BCrypt 저장/검증 | Auth 서버 위임 (서비스 측 불필요) | **Medium** |

### 3.2 변경 불필요 영역

| 영역 | 이유 |
|------|------|
| Admin 인증 (Session) | 내부 관리자 전용, SSO 대상 아님 |
| 역할 체계 (role_group) | 서비스 레벨 — 학심정 자체 유지 |
| 그룹/학급/상담/메모 도메인 | 인증과 독립 |
| tc_id / stdt_id 체계 | 학심정 도메인 식별자 — 유지 (sp_user_id와 매핑만 추가) |

---

## 4. 학심정 측 구현 범위

### 4.1 백엔드: 신규 생성

| 파일 | 역할 |
|------|------|
| `api/sso/controller/AuthProxyController.java` | **핵심** — Auth 서버 프록시 4개 엔드포인트 |
| `api/sso/config/AuthServerProperties.java` | Auth 서버 연결 설정 (`@ConfigurationProperties`) |
| `common/security/SpJwtClaimFilter.java` | SP JWT Claims → request attribute 추출 필터 |
| `common/security/SpJwtClaimExtractor.java` | JWT payload base64 디코딩 유틸 |
| `api/sso/service/SsoUserMappingService.java` | SP 사용자 ↔ 학심정 사용자 매핑 로직 |
| `api/sso/service/GuestTokenService.java` | 게스트 토큰 발급 (도메인 검증 + Auth 프록시 호출) |
| `mapper/sso/SsoUserMapper.java` + `SsoUserMapper.xml` | SP 매핑 쿼리 |

### 4.2 백엔드: 수정 대상

| 파일 | 변경 내용 | 영향도 |
|------|----------|--------|
| **`SecurityConfig.java`** | ApiSecurityConfig에서 `JwtAuthenticationFilter` → `SpJwtClaimFilter` 교체, SSO 프록시 URL permitAll | **Critical** |
| **`JwtAuthenticationFilter.java`** | SP JWT 형식 검증 추가 (전환기: 기존 + SP 양쪽 지원) | **Critical** |
| **`SecurityUtil.java`** | `requireCurrentUserNo()` → SP `publicUserId`(UUID) 기반으로 학심정 `user_no` 조회 | **High** |
| **`User.java`** (Domain) | `sp_user_id` 필드 추가 | **High** |
| `MemberService.java` | SSO 회원 자동 생성/매핑 로직 | **High** |
| `GuestAuthService.java` | Auth 서버 게스트 토큰 연동으로 변경 | **Medium** |
| `application.yml` | Auth 서버 URL, client_id/secret 환경변수 | **Medium** |

### 4.3 프론트엔드: 신규 생성

| 파일 | 역할 |
|------|------|
| `shared/lib/authClient.ts` | Auth Client SDK 초기화 + 타입 선언 |
| `shared/hooks/useSpAuth.ts` | SDK 기반 React 훅 (`useSyncExternalStore`) |
| `pages/auth/SsoCallbackPage.tsx` | SSO 콜백 처리 (SDK `handleRedirectResult` 호출) |

### 4.4 프론트엔드: 수정 대상

| 파일 | 변경 내용 | 영향도 |
|------|----------|--------|
| **`index.html`** | Auth Client SDK CDN 스크립트 태그 추가 | **Critical** |
| **`main.tsx`** | SDK init + handleRedirectResult → 라우터 생성 순서 변경 | **Critical** |
| **`AuthContext.tsx`** | SDK 기반으로 전면 교체 (loginWithEmail → auth.login 리다이렉트) | **Critical** |
| **`client.ts`** | 자체 Silent Refresh 제거 → `auth.getAccessToken()` 또는 `auth.authorizedFetch()` 사용 | **Critical** |
| **`LoginPage.tsx`** | 자체 로그인 폼 → SSO 로그인 버튼 (전환기에는 병행) | **High** |
| **`routes.tsx`** | `/auth/callback` 라우트 추가, `createBrowserRouter` 지연 생성 | **High** |
| `shared/types/index.ts` | User 타입에 `spUserId` 추가 | **Medium** |

---

## 5. 백엔드 변경 상세

### 5.1 AuthProxyController (핵심 신규 파일)

`superplatform-auth/docs/auth-client/20260414-integration-kit/sample-backend/AuthProxyController.java`를 기반으로 학심정에 맞게 구현한다.

```java
@RestController
@RequestMapping("/api/v1/auth")
public class AuthProxyController {

    // POST /api/v1/auth/token    — code → AT + RT 교환
    // POST /api/v1/auth/refresh  — RT → 새 AT + RT
    // POST /api/v1/auth/logout   — RT 무효화
    // POST /api/v1/auth/guest/token — 게스트 JWT 발급
}
```

**주의**: 학심정 현행 BE는 **Spring Boot 2.7 + Java 17**이고, 샘플은 **Spring Boot 4.0 + Java 21** (`jakarta.*` 패키지)이므로, `jakarta.servlet` → `javax.servlet`으로 변환 필요.

### 5.2 SecurityConfig 변경

```java
// 현행 ApiSecurityConfig.configure()
.authorizeRequests()
    .antMatchers("/member/login", "/member/signup", ...).permitAll()
    .anyRequest().authenticated()
.addFilterBefore(jwtAuthenticationFilter, ...)

// 변경 후
.authorizeRequests()
    // SSO 프록시 엔드포인트 (public)
    .antMatchers("/api/v1/auth/token", "/api/v1/auth/refresh",
                 "/api/v1/auth/logout", "/api/v1/auth/guest/token").permitAll()
    // 기존 public 엔드포인트 (전환기 유지)
    .antMatchers("/member/login", "/member/signup", ...).permitAll()
    // 게스트 관련 (기존 유지)
    .antMatchers("/guest/exists", "/guest/auth").permitAll()
    .anyRequest().authenticated()
// 필터: SP JWT 파싱 필터 추가 (기존 필터와 병행)
.addFilterBefore(spJwtClaimFilter, UsernamePasswordAuthenticationFilter.class)
```

### 5.3 JWT 검증 전략 (전환기)

전환기에는 **두 종류의 JWT**가 공존한다:

| JWT 종류 | 발급자 | Claims | 식별 방법 |
|----------|--------|--------|----------|
| 학심정 자체 JWT | 학심정 BE | `{tokenType, userNo, email, userSeCd}` | `tokenType` claim 존재 |
| SP JWT | Auth 서버 | `{sub(UUID), email, userType, roles, iss:"superplatform"}` | `iss == "superplatform"` |

```java
// SpJwtClaimFilter에서의 분기 로직
String iss = extractIssuer(token);
if ("superplatform".equals(iss)) {
    // SP JWT → publicUserId로 학심정 user 조회 → SecurityContext 설정
    String spUserId = claims.getSubject();
    Long userNo = ssoUserMapper.findUserNoBySpUserId(spUserId);
    // ...
} else {
    // 기존 학심정 JWT → 기존 JwtAuthenticationFilter 로직
}
```

### 5.4 사용자 매핑 로직

SSO 로그인 사용자가 학심정에 처음 접근할 때:

```
1. Auth 서버에서 AT 수신 (JWT sub = publicUserId)
2. 학심정 BE에서 sp_user_id로 user 테이블 조회
   2a. 매칭 O → 기존 user 반환
   2b. 매칭 X → email로 기존 user 조회
       2b-1. email 매칭 O → sp_user_id 매핑 업데이트 (기존 회원 SSO 전환)
       2b-2. email 매칭 X → 신규 user 생성
           - user_no 자동채번
           - email = JWT email
           - nickname = JWT name
           - role_code = JWT userType 매핑 (TEACHER→TEACHER, STUDENT→STUDENT)
           - tc_id / stdt_id 자동 채번
           - password = NULL (SSO 회원)
           - sp_user_id = JWT sub
3. 필요 시 서비스별 추가 정보 입력 화면으로 분기
```

### 5.5 게스트 토큰 연동

현행 게스트 플로우를 SP 게스트 토큰으로 전환:

```
현행:
  초대코드 입력 → 이메일 인증 → GuestAuthService.authenticateGuest()
  → 학심정 자체 Guest JWT 발급

변경 후:
  초대코드 입력 → 이메일 인증 (유지)
  → GuestTokenService.issueGuestToken(name)
    → POST /api/v1/auth/guest/token (Auth 프록시)
    → Auth 서버에서 Guest JWT 발급 (sub: "guest_xxx", userType: "GUEST")
  ← 프론트에서 auth.setGuestToken(accessToken)
```

게스트 → 회원 전환 시 데이터 이관은 **학심정 BE가 처리** (Auth 서버 무관):
```sql
-- guest_xxx의 데이터를 정식 사용자로 이관
UPDATE group_member SET user_no = :newUserNo WHERE stdt_id = :guestStdtId;
```

### 5.6 application.yml 추가

```yaml
superplatform:
  auth:
    server-url: ${SP_AUTH_SERVER_URL:http://localhost:8080}
    client-id: ${SP_AUTH_CLIENT_ID:haksimjung-service}
    client-secret: ${SP_AUTH_CLIENT_SECRET}
```

---

## 6. 프론트엔드 변경 상세

### 6.1 SDK 로드 (index.html)

```html
<!-- frontend/index.html -->
<head>
  <script src="https://cdn.vsaidt.com/superplatform/auth-client.js"></script>
</head>
```

### 6.2 main.tsx 부트스트랩 변경 (핵심)

```typescript
// frontend/src/main.tsx — 변경 후
import { createRouter } from '@app/router/routes';

async function bootstrap() {
  // 1) SDK 초기화
  const auth = await AuthClient.init({
    authUrl: import.meta.env.VITE_SP_AUTH_URL,
    clientId: import.meta.env.VITE_SP_CLIENT_ID,
    redirectUri: window.location.origin + '/auth/callback',
  });

  // 2) 콜백 처리 + 세션 복구
  const result = await auth.handleRedirectResult();

  if (result.type === 'callback') {
    if (result.authenticated) {
      window.history.replaceState(null, '', result.returnPath || '/');
    }
  } else if (!result.authenticated) {
    // 공개 경로(QR, 게스트 참여 등) 체크
    const PUBLIC_PATHS = ['/guest', '/group/join'];
    const isPublic = PUBLIC_PATHS.some(p => window.location.pathname.startsWith(p));

    if (!isPublic) {
      const silentResult = await auth.trySilentLogin();
      if (!silentResult.success && !auth.isAuthenticated()) {
        // 비인증 상태 — 라우터에서 로그인 페이지로 리다이렉트
      }
    }
  }

  // 3) replaceState 이후에 라우터 생성 (React Router 주의사항)
  const router = createRouter();

  // 4) React 렌더
  createRoot(document.getElementById('root')!).render(
    <AuthSdkProvider auth={auth}>
      <RouterProvider router={router} />
    </AuthSdkProvider>
  );
}

bootstrap();
```

### 6.3 AuthContext 전면 교체

현행 `AuthContext.tsx`의 자체 인증 로직을 SDK 기반으로 전환:

```typescript
// 현행 — 제거 대상
loginWithEmail(email, password)  → apiClient.post('/member/login', ...)
signUp(data)                     → apiClient.post('/member/signup', ...)
sendCode(email)                  → apiClient.post('/member/send-code', ...)
verifyCode(email, code)          → apiClient.post('/member/verify-code', ...)
// localStorage 직접 관리: auth_token, refresh_token, meta_auth_user

// 변경 후 — SDK 위임
login()       → auth.login()                  // Auth 서버로 리다이렉트
logout()      → auth.logout()                 // SSO 세션까지 삭제
getUser()     → auth.getUser()                // JWT에서 파싱
getToken()    → auth.getAccessToken()          // SDK가 만료 관리
// localStorage: SDK가 accessToken, refreshToken 키로 자동 관리
```

### 6.4 React Hook 구현

```typescript
// shared/hooks/useSpAuth.ts
import { useSyncExternalStore, useCallback } from 'react';

export function useSpAuth() {
  const auth = useAuthClient(); // Context에서 SDK 인스턴스 가져오기

  const user = useSyncExternalStore(
    (cb) => auth.onAuthChange(cb),
    () => auth.getUser(),
  );

  return {
    user,
    isAuthenticated: auth.isAuthenticated(),
    login: useCallback((path?: string) => auth.login({ redirectPath: path }), [auth]),
    logout: useCallback(() => auth.logout(), [auth]),
    getAccessToken: useCallback(() => auth.getAccessToken(), [auth]),
  };
}
```

### 6.5 client.ts (Axios) 변경

```typescript
// 현행 — Silent Refresh 자체 구현 (약 170줄)
// 제거 대상: isRefreshing, failedQueue, processQueue, tryRefreshToken

// 변경 후
axiosInstance.interceptors.request.use((config) => {
  const token = auth.getAccessToken(); // SDK에서 가져오기
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

> 또는 `auth.authorizedFetch()`를 직접 사용하여 Axios를 대체할 수도 있으나, 기존 `apiClient` 패턴을 유지하는 것이 변경 범위를 최소화한다.

### 6.6 LoginPage 변경

**전환기 (Phase 1):**
```tsx
<Button variant="primary" onClick={() => auth.login()}>
  슈퍼플랫폼으로 로그인
</Button>
{/* 기존 이메일 로그인 — 보조 옵션으로 유지 */}
<Divider>또는</Divider>
<LoginForm onSubmit={loginWithEmail} />
```

**완료 후 (Phase 3):**
```tsx
<Button variant="primary" onClick={() => auth.login()}>
  로그인
</Button>
<Button variant="ghost" onClick={() => navigate('/guest/join')}>
  게스트로 참여하기
</Button>
```

### 6.7 환경변수 추가

```bash
# frontend/.env.development
VITE_SP_AUTH_URL=http://localhost:8080
VITE_SP_CLIENT_ID=haksimjung-service

# frontend/.env.production
VITE_SP_AUTH_URL=https://auth.superplatform.com
VITE_SP_CLIENT_ID=haksimjung-service
```

---

## 7. DDL 변경 사항

### 7.1 `user` 테이블 ALTER

```sql
-- SP 사용자 ID 연결 (Auth 서버의 publicUserId = UUID)
ALTER TABLE `user`
  ADD COLUMN sp_user_id VARCHAR(64) NULL
    COMMENT '슈퍼플랫폼 사용자 ID (UUID, Auth 서버 publicUserId)' AFTER user_no,
  ADD UNIQUE KEY uk_user_sp_user_id (sp_user_id);

-- 인증 제공자 구분 (기존 LOCAL vs SSO 전환 추적)
ALTER TABLE `user`
  ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL'
    COMMENT '인증 제공자 (LOCAL/SSO)' AFTER sp_user_id;

-- password NULL 허용 (SSO 회원은 비밀번호 없음)
ALTER TABLE `user`
  MODIFY COLUMN password VARCHAR(255) NULL
    COMMENT '비밀번호 (BCrypt, SSO 회원은 NULL)';
```

### 7.2 변경 요약

| 테이블 | 변경 | 비고 |
|--------|------|------|
| `user` | +`sp_user_id` VARCHAR(64) UNIQUE, +`auth_provider` VARCHAR(20), `password` NULL 허용 | 핵심 변경 |
| `refresh_token` | **점진적 폐기** (SP 전환 완료 후) | 전환기에는 유지 |
| `email_verification` | **점진적 폐기** (가입/인증이 Auth 서버로 이관됨) | 전환기에는 유지 |
| 기타 테이블 | **변경 없음** | tc_id, stdt_id, group 등 그대로 |

### 7.3 신규 테이블 없음

SP는 서비스 측에 별도 인증 테이블을 요구하지 않는다. `user` 테이블에 `sp_user_id` 매핑만 추가하면 충분하다.

---

## 8. 데이터 이관 전략

### 8.1 접근 방식: 런타임 점진적 매핑 (Migration-on-Login)

별도 배치 이관 없이, **기존 회원이 SSO로 첫 로그인할 때 자동 매핑**한다.

```
기존 회원 (LOCAL) SSO 첫 로그인 시:
1. Auth 서버에서 로그인 완료 → AT 발급 (sub=UUID, email=xxx)
2. 학심정 BE: sp_user_id로 user 조회 → 없음
3. 학심정 BE: email로 user 조회 → 기존 회원 발견!
4. UPDATE user SET sp_user_id = :uuid, auth_provider = 'SSO'
   WHERE user_no = :found AND sp_user_id IS NULL
5. 매핑 완료 → 이후 sp_user_id로 직접 조회
```

### 8.2 초기화 스크립트

```sql
-- 기존 회원 상태 초기화
UPDATE `user`
SET auth_provider = 'LOCAL'
WHERE sp_user_id IS NULL AND status = 'ACTIVE';

-- 이관 현황 모니터링 쿼리
SELECT
    auth_provider,
    COUNT(*) AS cnt,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) AS pct
FROM `user`
WHERE status = 'ACTIVE'
GROUP BY auth_provider;
```

### 8.3 이메일 불일치 대응

Auth 서버의 email과 학심정 user.email이 다를 수 있는 경우:
- 소셜 로그인(Google/Kakao/Naver)으로 가입한 경우 provider_email이 다를 수 있음
- **정책 결정 필요**: email 불일치 시 신규 생성 vs 수동 매핑 안내

---

## 9. 작업 절차 및 단계별 계획

### Phase 0: 사전 준비

| # | 작업 | 담당 | 산출물 |
|---|------|------|--------|
| 0-1 | Auth 팀에 연동 신청 (서비스명, redirect_uri, 담당자) | 학심정팀 | 신청서 |
| 0-2 | `client_id`, `client_secret` 수령 | Auth 팀 | 인증 정보 |
| 0-3 | Auth 서버 CORS에 학심정 도메인 추가 요청 | Auth 팀 | CORS 설정 |
| 0-4 | 로컬 개발 환경에서 Auth 서버 (localhost:8080) 연동 테스트 | 학심정팀 | 동작 확인 |

### Phase 1: 백엔드 SSO 프록시 구현

| # | 작업 | 파일 |
|---|------|------|
| 1-1 | DDL 적용 (`user` ALTER) | `meta_api_ddl_v4_sso.sql` |
| 1-2 | `User.java` 엔티티에 `spUserId`, `authProvider` 필드 추가 | `User.java` |
| 1-3 | AuthProxyController 구현 (4개 엔드포인트) | `AuthProxyController.java` |
| 1-4 | AuthServerProperties 설정 클래스 | `AuthServerProperties.java` |
| 1-5 | SpJwtClaimFilter + SpJwtClaimExtractor 구현 | `SpJwtClaimFilter.java` |
| 1-6 | SsoUserMappingService 구현 (SP→학심정 사용자 매핑) | `SsoUserMappingService.java` |
| 1-7 | SecurityConfig 수정 (SSO URL 허용 + 필터 추가) | `SecurityConfig.java` |
| 1-8 | application.yml 환경변수 추가 | `application.yml` |
| 1-9 | UserMapper에 SP 매핑 쿼리 추가 | `UserMapper.xml` |

### Phase 2: 프론트엔드 SDK 연동

| # | 작업 | 파일 |
|---|------|------|
| 2-1 | index.html에 SDK CDN 스크립트 추가 | `index.html` |
| 2-2 | SDK 타입 선언 + 초기화 모듈 생성 | `shared/lib/authClient.ts` |
| 2-3 | useSpAuth 훅 구현 | `shared/hooks/useSpAuth.ts` |
| 2-4 | main.tsx 부트스트랩 변경 (SDK init → handleRedirectResult → createRouter) | `main.tsx` |
| 2-5 | routes.tsx에 `/auth/callback` 라우트 추가 + `createBrowserRouter` 지연 생성 | `routes.tsx` |
| 2-6 | AuthContext → SDK 기반 전면 교체 | `AuthContext.tsx` |
| 2-7 | client.ts Silent Refresh 제거 → SDK getAccessToken 사용 | `client.ts` |
| 2-8 | LoginPage SSO 버튼 추가 (기존 로그인 보조 유지) | `LoginPage.tsx` |
| 2-9 | 환경변수 추가 (.env.development, .env.production) | `.env.*` |
| 2-10 | User 타입에 spUserId 추가 | `shared/types/index.ts` |

### Phase 3: 통합 테스트

| # | 테스트 항목 |
|---|-----------|
| 3-1 | SSO 로그인 → 콜백 → 토큰 교환 → 대시보드 진입 |
| 3-2 | SSO Silent Login (다른 서비스에서 로그인 후 학심정 접근) |
| 3-3 | 기존 LOCAL 회원의 SSO 첫 로그인 → 자동 매핑 |
| 3-4 | 게스트 초대코드 → 게스트 토큰 발급 → 검사 참여 |
| 3-5 | AT 만료 → RT Rotation → 새 AT 발급 |
| 3-6 | 로그아웃 → 토큰 삭제 + SSO 세션 삭제 + 다른 탭 동기화 |
| 3-7 | 소셜 로그인 (Google/Kakao/Naver) → 학심정 진입 |
| 3-8 | 동시 요청 시 refresh stampede 방지 확인 |

### Phase 4: 자체 인증 폐기

| # | 작업 |
|---|------|
| 4-1 | LoginPage에서 기존 이메일 로그인 UI 제거 |
| 4-2 | `/member/login`, `/member/signup`, `/member/send-code`, `/member/verify-code` deprecated |
| 4-3 | `email_verification` 테이블 데이터 정리 |
| 4-4 | `user.password` 컬럼 데이터 일괄 NULL 처리 |
| 4-5 | `refresh_token` 테이블 폐기 (SP가 RT 관리) |

---

## 10. 리스크 및 미결 사항

### 10.1 확인 필요 사항

| # | 항목 | 상태 | 영향 |
|---|------|------|------|
| **Q1** | Auth 팀에 `client_id`/`client_secret` 발급 요청 | **미신청** | 모든 작업의 전제 |
| **Q2** | Auth 서버 CORS에 학심정 도메인 등록 | **미요청** | SDK 동작 불가 |
| **Q3** | SP `userType`과 학심정 `role_code` 매핑 정책 (TEACHER↔TEACHER, STUDENT↔STUDENT 1:1?) | **미확인** | 사용자 매핑 로직 |
| **Q4** | 서비스별 추가 정보 수집 화면 (성별, 학교, 학년 등) — Auth 서버 consent 이후? 학심정 자체? | **미확인** | 추가 UI/API 필요 여부 |
| **Q5** | 14세 미만 보호자 동의 — Auth 서버의 `guardian_consented` 필드로 충분한지 | **미확인** | 법적 컴플라이언스 |
| **Q6** | 기존 회원 email ≠ SP email 시 매핑 정책 | **미확인** | 데이터 이관 로직 |
| **Q7** | `test-service` / `test-secret-1234!` (local 프로필 자동 등록) 활용 가능 여부 | **확인 필요** | 로컬 개발 편의 |
| **Q8** | Spring Boot 2.7 + `javax.servlet` 환경에서 샘플 코드 호환성 | **확인 필요** | `jakarta` → `javax` 변환 |

### 10.2 기술 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Auth 서버 장애 시 학심정 로그인 불가 | **Critical** | Phase 1에서 기존 로그인 fallback 유지 |
| JWT 서명 키 불일치 (서비스 BE에서 SP JWT 직접 검증 필요 시) | **High** | `SpJwtClaimFilter`는 서명 검증 안 함 (GW/Auth 서버가 검증) — 필요 시 Auth 서버 공개키 요청 |
| `createBrowserRouter` 호출 타이밍 이슈 (callback URL 오인식) | **Medium** | main.tsx에서 SDK handleRedirectResult → replaceState 이후 라우터 생성 |
| RT Rotation에서 기존 학심정 RT와 충돌 | **Low** | 전환기에 기존 `refresh_token` 테이블과 SP RT는 독립 경로로 관리 |

### 10.3 일정 추정

| Phase | 예상 범위 | 전제 조건 |
|-------|----------|----------|
| Phase 0 (사전 준비) | 1~2일 | Auth 팀 협조 |
| Phase 1 (BE 프록시) | 3~5일 | client_id/secret 확보 |
| Phase 2 (FE SDK) | 3~5일 | Phase 1 완료 |
| Phase 3 (통합 테스트) | 2~3일 | Phase 1+2 완료 |
| Phase 4 (자체 인증 폐기) | 1~2일 | 전환율 충분 시 |

---

## 부록: SSO 인증 시퀀스 다이어그램

### A. 정상 로그인 플로우

```
사용자          학심정 FE (SDK)     학심정 BE (프록시)    Auth Server
  │                │                    │                  │
  │ [로그인 클릭]   │                    │                  │
  │───────────────>│                    │                  │
  │                │ auth.login()       │                  │
  │                │ PKCE 생성          │                  │
  │                │ (verifier+challenge)│                  │
  │                │                    │                  │
  │  ◀──── 302 /oauth2/authorize ──────────────────────── │
  │         (client_id, code_challenge, state)             │
  │                                                        │
  │  [로그인 페이지]                                        │
  │────── email + password ───────────────────────────────>│
  │                                                        │
  │  [동의 화면] (최초 1회)                                 │
  │────── 동의 ───────────────────────────────────────────>│
  │                                                        │
  │  ◀──── 302 redirect_uri?code=X&state=Y ───────────────│
  │                │                    │                  │
  │                │ handleRedirectResult()                │
  │                │ state 검증          │                  │
  │                │                    │                  │
  │                │──── POST /api/v1/auth/token ──────>│  │
  │                │     { code, codeVerifier }          │  │
  │                │                    │                  │
  │                │                    │── POST /oauth2/token ──>│
  │                │                    │   + client_secret       │
  │                │                    │                         │
  │                │                    │   PKCE 검증             │
  │                │                    │<── AT + RT ─────────────│
  │                │                    │                         │
  │                │                    │ ssoUserMapping()        │
  │                │                    │ (sp_user_id 매핑)       │
  │                │                    │                         │
  │                │<── { AT, RT } ─────│                         │
  │                │                    │                         │
  │                │ storeTokens()      │                         │
  │                │ setUser()          │                         │
  │                │ startActivityTracking()                      │
  │                │                    │                         │
  │  [대시보드 진입]│                    │                         │
  │<───────────────│                    │                         │
```

### B. 게스트 참여 플로우

```
게스트          학심정 FE (SDK)     학심정 BE            Auth Server
  │                │                  │                    │
  │ [초대코드 입력]  │                  │                    │
  │───────────────>│                  │                    │
  │                │                  │                    │
  │                │── POST /guest/auth ──>│               │
  │                │   { inviteCode, email }│               │
  │                │                  │                    │
  │                │                  │ 초대코드 검증      │
  │                │                  │ 이메일 인증 확인   │
  │                │                  │ 게스트 DB 등록     │
  │                │                  │                    │
  │                │                  │── POST /api/v1/auth/guest/token ──>│
  │                │                  │   { name } + client_secret        │
  │                │                  │                                    │
  │                │                  │<── { accessToken, guestId } ──────│
  │                │                  │                                    │
  │                │<── { accessToken, guestId, claId } ──│               │
  │                │                  │                    │
  │                │ auth.setGuestToken(AT)                │
  │                │                  │                    │
  │  [검사 참여]    │                  │                    │
  │<───────────────│                  │                    │
```

---

**문서 끝**

> 이 문서는 `D:\workspace\superplatform-auth` 프로젝트의 실제 소스 코드와 SDK 스펙을 기반으로 작성되었습니다.  
> Phase 0 (사전 준비)의 Auth 팀 협의 완료 후 즉시 Phase 1 착수가 가능합니다.
