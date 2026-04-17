# SSO 전환 구현 진행 상황

> 이 문서를 보고 바로 이어서 작업 가능하도록 정리한 진행 기록
>
> **브랜치**: `feature/sso-integration`
> **마지막 커밋**: `27a2338` — [FRONTEND] feat: SSO 통합 인증 전환 — Auth Client SDK 연동
> **마지막 작업일**: 2026-04-17

---

## 확정 정책 (변경 없음)

- 동시 오픈 / Auth 인증 / 개인정보 학심정 DB 유지 (Auth JWT에서 동기화)
- JWT: RS256 (Auth 서버 서명, JWKS 공개키 검증)
- Admin: admin_account 별도 테이블, 자체 세션 로그인
- 게스트: 이메일 인증 유지 + Auth 게스트 토큰
- FE: Auth Client SDK (CDN UMD 번들)
- 상세: `00-policy.md` 참조

---

## 완료된 작업

### BE Step 1: 기반 (커밋: 7b1d406)
- [x] build.gradle: +spring-boot-starter-oauth2-resource-server
- [x] application-local.yml: SP Auth 설정 (JWKS URI, client-id/secret)
- [x] SpAuthProperties.java (신규): Auth 서버 연결 @ConfigurationProperties
- [x] User.java: +spUserId, +authProvider 필드 (password는 아직 유지 — 기존 코드 호환)
- [x] SpAuthenticatedUser.java (신규): JWT Claims 기반 record
- [x] UserMapper: +findBySpUserId, resultMap/columns에 sp_user_id/auth_provider 추가
- [x] AdminAccount.java (신규): admin_account 엔티티
- [x] AdminAccountMapper.java + XML (신규): admin_account CRUD

### BE Step 2: 인증 전환 (커밋: 7b1d406)
- [x] SecurityConfig: ApiSecurityConfig에서 JwtAuthenticationFilter 제거 → oauth2ResourceServer().jwt() + jwtAuthenticationConverter
- [x] AuthProxyController.java (신규): 4개 엔드포인트 (token, refresh, logout, guest/token)
- [x] SecurityUtil.java: SpAuthenticatedUser 기반으로 전환
- [x] AdminUserDetailsService.java: user 테이블 → admin_account 테이블

### BE Step 3: 서비스 로직 (커밋: 10a5f10)
- [x] SsoUserService.java (신규): SSO 첫 로그인 시 user 자동 생성/동기화
- [x] UserProfileController.java (신규): POST /api/v1/user/complete-profile + GET /api/v1/user/status
- [x] MemberController: login/signup/refresh/logout 제거, /member/info만 유지 (SpAuthenticatedUser 기반)
- [x] MemberService: login/createUser/refreshToken/logout 제거
- [x] GuestAuthService: 자체 JWT 발급 → Auth 게스트 토큰 프록시 경유
- [x] AdminUserService: RefreshTokenMapper 제거, createUserByAdmin 제거, admin_account 기반 전환
- [x] AdminController: 회원 생성 제거, 비밀번호 초기화(일반회원) 제거, API 테스트 JwtUtil 제거
- [x] GroupService: issueGuestTokens → Auth 게스트 토큰으로 전환

### BE: jjwt 완전 제거 (커밋: d188f76)
- [x] FileService.java: JwtUtil.getAllClaimsFromToken() → SecurityUtil.getCurrentSpUser() (3곳)
- [x] JwtUtil.java 삭제
- [x] JwtAuthenticationFilter.java 삭제
- [x] build.gradle: jjwt 의존성 제거 (jjwt-api, jjwt-impl, jjwt-jackson)

### FE: Auth Client SDK 연동 (커밋: 27a2338)
- [x] index.html: SDK CDN 스크립트 추가
- [x] shared/lib/authClient.ts (신규): SDK 타입 선언 + initAuth/getAuth
- [x] shared/hooks/useSpAuth.ts (신규): useSyncExternalStore 기반 React 훅
- [x] main.tsx: SDK init → handleRedirectResult → React 렌더 부트스트랩
- [x] AuthContext.tsx: SDK 기반 전면 교체 (loginWithEmail/signUp/sendCode 제거)
- [x] client.ts: 자체 Silent Refresh ~170줄 제거 → SDK getAccessToken ~20줄
- [x] LoginPage.tsx: 자체 로그인 폼 제거 → SSO 버튼 + 게스트 버튼
- [x] SignUpPage.tsx 삭제
- [x] ForgotPasswordPage.tsx 삭제
- [x] routes.tsx: /signup, /forgot-password 라우트 제거
- [x] ExamAuthStep: loginWithEmail → auth.login() SSO 리다이렉트
- [x] JoinGroupPage: loginWithEmail → auth.login(), refreshToken → guestId
- [x] groupService: refreshToken → guestId
- [x] useApiData: credentials → user 기반
- [x] User 타입: +spUserId, +userType, provider에 'sso' 추가
- [x] .env.*: VITE_SP_AUTH_URL, VITE_SP_CLIENT_ID

### 인프라
- [x] Docker MySQL 8.0.40 (mysql-local, port 3306, root/root1234)
- [x] DB: superplatform-meta (31개 테이블, DDL v4)
- [x] admin_account 초기 데이터: admin@visang.com / qwer1234!@#$
- [x] application-local.yml: 로컬 DB 바라보도록 변경

---

## 남은 작업

### 필수 (동작에 영향)

#### 1. SecurityUtil.getCurrentUserNo() 완성 — ★ 가장 중요
**현재 상태**: SP JWT 인증 시 `getCurrentUserNo()`가 `null` 반환 (TODO 상태)
**문제**: 기존 서비스 로직에서 `SecurityUtil.requireCurrentUserNo()`를 호출하는 곳이 전부 실패
**해결**: SsoUserService를 주입받아 spUserId → user_no 매핑

```
방법: SecurityUtil은 static이라 DI 불가 → 2가지 옵션:
(a) Spring Filter에서 spUserId → userNo 조회 후 request attribute에 캐싱, SecurityUtil에서 읽기
(b) SecurityUtil을 @Component로 변경하거나 별도 SpUserResolver 빈 생성
```

**참조 파일**: `backend/src/main/java/com/vs/meta/common/utils/SecurityUtil.java` (line 42~55)

#### 2. CompleteProfilePage 신규 (FE)
**현재 상태**: 미구현
**용도**: SSO 최초 로그인 시 학심정 user가 없으면 성별 + 역할(UNSET 시) 입력
**API**: `POST /api/v1/user/complete-profile` (BE 구현 완료), `GET /api/v1/user/status` (BE 구현 완료)
**위치**: `frontend/src/pages/auth/CompleteProfilePage.tsx`

**플로우**:
```
SSO 로그인 → /api/v1/user/status 호출
  → registered: true → 대시보드
  → registered: false → /auth/complete-profile 리다이렉트
    → 성별 선택 + (UNSET이면 역할 선택)
    → POST /api/v1/user/complete-profile
    → 대시보드
```

routes.tsx에 `/auth/complete-profile` 라우트 추가 필요.

#### 3. Admin UI 정리
- users.html: 계정 등록 폼 제거, 비밀번호 초기화 버튼 제거 (일반 회원 대상)
- api-test.html: 토큰 자동 발급 제거 → 토큰 직접 입력 필드 추가
- BE 로직은 이미 변경됨, **Thymeleaf 템플릿 UI만 정리 필요**

### 선택 (동작에는 영향 없지만 정리 필요)

#### 4. 게스트 이메일 인증 유지 확인
- send-code/verify-code 엔드포인트는 SecurityConfig에서 permitAll 유지됨
- EmailVerificationService는 아직 코드에 존재 (삭제 안 함)
- 게스트 플로우에서 이메일 인증이 정상 동작하는지 통합 테스트 필요

#### 5. 불필요 코드 정리 (선택)
- EmailVerificationController: 가입용은 불필요하지만 게스트용은 유지 필요 → 게스트 전용으로 정리
- PasswordValidator.java: 사용처 없음 → 삭제 가능
- LoginRateLimiter.java: Admin 세션 로그인에서 사용 중 → 유지
- User.java의 password 필드: DB에 컬럼 없으므로 제거 가능 (MyBatis에서 null 매핑)
- UserMapper.xml의 password 관련 쿼리(updatePassword): Admin 전용이 아닌 일반 회원용 → 제거 가능

#### 6. 통합 테스트
- Auth 서버 로컬 실행 (localhost:8080) → SDK 로그인 → 토큰 교환 → API 호출
- 게스트 플로우: 초대코드 → 이메일 인증 → Auth 게스트 토큰 → 검사 참여
- Admin 로그인: admin_account 기반 세션 인증

---

## 로컬 환경 정보

```
Docker MySQL:
  컨테이너: mysql-local
  포트: 3306
  DB: superplatform-meta
  계정: root / root1234
  문자셋: utf8mb4

Auth 서버 (로컬 테스트 시):
  URL: http://localhost:8080
  test client: test-service / test-secret-1234!
  JWKS: http://localhost:8080/.well-known/jwks.json

학심정 BE:
  포트: 8081
  프로필: local
  DB: superplatform-meta (localhost:3306)

학심정 FE:
  포트: 5173
  SDK: CDN (https://cdn.vsaidt.com/superplatform/auth-client.js)
  Auth URL: env에 따라 (로컬: localhost:8080, dev: t-superplatform-api.vsaidt.com)
```

---

## 참고 파일

| 문서 | 위치 |
|------|------|
| 확정 정책 | `backend/docs/superplatform-auth/final/00-policy.md` |
| DDL 변경 | `backend/docs/superplatform-auth/final/01-DDL.md` |
| BE 수정 계획 | `backend/docs/superplatform-auth/final/02-BE.md` |
| FE 수정 계획 | `backend/docs/superplatform-auth/final/03-FE.md` |
| Admin 영향도 | `backend/docs/superplatform-auth/final/04-admin-impact.md` |
| 데이터 이관 | `backend/docs/superplatform-auth/final/05-data-migration.md` |
| 전체 DDL v4 | `backend/docs/superplatform-auth/final/meta_api_ddl_v4_sso.sql` |
