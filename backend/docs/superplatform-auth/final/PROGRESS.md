# SSO 전환 구현 진행 상황

> 이 문서를 보고 바로 이어서 작업 가능하도록 정리한 진행 기록
>
> **브랜치**: `feature/sso-integration`
> **마지막 커밋**: `eef957f` — [FRONTEND] feat: SSO 최초 로그인 시 프로필 등록 체크 + 자동 리다이렉트
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

### BE Step 1: 기반
- [x] build.gradle: +spring-boot-starter-oauth2-resource-server
- [x] application-local.yml: SP Auth 설정 (JWKS URI, client-id/secret)
- [x] SpAuthProperties.java: Auth 서버 연결 @ConfigurationProperties
- [x] User.java: +spUserId, +authProvider 필드
- [x] SpAuthenticatedUser.java: JWT Claims 기반 record
- [x] UserMapper: +findBySpUserId, resultMap/columns에 sp_user_id/auth_provider 추가
- [x] AdminAccount.java + AdminAccountMapper: admin_account 테이블

### BE Step 2: 인증 전환
- [x] SecurityConfig: oauth2ResourceServer().jwt() + jwtAuthenticationConverter
- [x] AuthProxyController: 4개 엔드포인트 (token, refresh, logout, guest/token)
- [x] SecurityUtil: SpAuthenticatedUser 기반
- [x] AdminUserDetailsService: admin_account 테이블 기반

### BE Step 3: 서비스 로직
- [x] SsoUserService: SSO 첫 로그인 시 user 자동 생성/동기화
- [x] UserProfileController: POST /api/v1/user/complete-profile + GET /api/v1/user/status
- [x] MemberController: 자체 인증 엔드포인트 제거, /member/info만 유지
- [x] MemberService: login/createUser/refreshToken/logout 제거
- [x] GuestAuthService: Auth 게스트 토큰 프록시 경유
- [x] AdminUserService: admin_account 기반, createUserByAdmin 제거
- [x] AdminController: 회원 생성/비밀번호 초기화 제거, API 테스트 JwtUtil 제거
- [x] GroupService: Auth 게스트 토큰 + inviteCode/groupId 응답 누락 수정

### BE: jjwt 완전 제거
- [x] FileService: SecurityUtil.getCurrentSpUser() 기반으로 전환 (3곳)
- [x] JwtUtil.java 삭제
- [x] JwtAuthenticationFilter.java 삭제
- [x] build.gradle: jjwt 의존성 제거

### BE: SecurityUtil.getCurrentUserNo() 완성
- [x] SpUserMappingFilter 신규: JWT 검증 후 spUserId → userNo DB 조회 → request attribute 캐싱
- [x] SecurityConfig: BearerTokenAuthenticationFilter 뒤에 SpUserMappingFilter 등록
- [x] SecurityUtil: request attribute에서 매핑된 userNo 읽기

### BE: Admin UI 정리
- [x] users.html: 계정 등록 폼 제거, 비밀번호 초기화 버튼/모달/JS 제거, SP_USER_ID 컬럼 추가
- [x] api-test.html: 자동 토큰 발급 제거 → 토큰 직접 입력 필드 추가

### FE: Auth Client SDK 연동
- [x] index.html: SDK CDN 스크립트 추가
- [x] authClient.ts: SDK 타입 선언 + initAuth/getAuth
- [x] useSpAuth.ts: useSyncExternalStore 기반 React 훅
- [x] main.tsx: SDK init → handleRedirectResult → React 렌더 부트스트랩
- [x] AuthContext.tsx: SDK 기반 전면 교체
- [x] client.ts: 자체 Silent Refresh 제거 → SDK getAccessToken
- [x] LoginPage.tsx: SSO 로그인 버튼 + 게스트 버튼
- [x] SignUpPage.tsx 삭제, ForgotPasswordPage.tsx 삭제
- [x] routes.tsx: /signup, /forgot-password 제거
- [x] ExamAuthStep, JoinGroupPage, groupService, useApiData: SSO 대응 수정
- [x] User 타입: +spUserId, +userType, provider에 'sso' 추가
- [x] .env.*: VITE_SP_AUTH_URL, VITE_SP_CLIENT_ID

### FE: CompleteProfilePage + 프로필 등록 체크
- [x] CompleteProfilePage.tsx: 성별 + 역할(UNSET 시) 입력 페이지
- [x] useProfileCheck.ts: GET /api/v1/user/status 호출하여 등록 여부 확인
- [x] ProtectedLayout / StudentProtectedLayout: needsProfile 시 /auth/complete-profile 자동 리다이렉트
- [x] routes.tsx: /auth/complete-profile 라우트 추가

### 인프라
- [x] Docker MySQL 8.0.40 (mysql-local, port 3306, root/root1234)
- [x] DB: superplatform-meta (31개 테이블, DDL v4)
- [x] admin_account 초기 데이터: admin@visang.com / qwer1234!@#$
- [x] application-local.yml: 로컬 DB 바라보도록 변경

---

## 남은 작업

### 통합 테스트 (Auth 서버 로컬 실행 후)

- [ ] SSO 로그인 → 콜백 → CompleteProfilePage → user 생성 → 대시보드
- [ ] SSO Silent Login (다른 서비스에서 로그인 후 학심정 접근)
- [ ] 게스트 플로우: 초대코드 → 이메일 인증 → Auth 게스트 토큰 → 검사 참여
- [ ] AT 만료 → SDK refresh → 새 AT
- [ ] 로그아웃 → SSO 세션 삭제 → 다른 탭 동기화
- [ ] Admin 로그인 (admin_account 기반 세션)
- [ ] Admin API 테스트 (토큰 직접 입력)

### 선택 (정리)

- [ ] PasswordValidator.java: 사용처 없음 → 삭제 가능
- [ ] LoginRateLimiter.java: Admin 세션에서만 사용 → 유지
- [ ] User.java의 password 필드: DB에 컬럼 없으므로 제거 가능
- [ ] UserMapper.xml의 password 관련 (updatePassword 등): 정리 가능
- [ ] EmailVerificationController: 게스트 전용으로 정리

---

## 커밋 히스토리

```
feature/sso-integration
├── 5962e27 docs: SSO 분석 문서
├── 7b1d406 [BACKEND] Step 1~3 (중간)
├── 10a5f10 [BACKEND] Step 3 완료
├── d188f76 [BACKEND] jjwt 완전 제거 + FileService 전환
├── 27a2338 [FRONTEND] Auth Client SDK 연동
├── 34af1be docs: PROGRESS.md
├── 1c51b42 [BACKEND] SecurityUtil.getCurrentUserNo() 완성
├── ae7ebfe [FRONTEND] CompleteProfilePage
├── 6542725 [BACKEND] Admin UI 정리
└── eef957f [FRONTEND] 프로필 등록 체크 + 자동 리다이렉트
```

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
