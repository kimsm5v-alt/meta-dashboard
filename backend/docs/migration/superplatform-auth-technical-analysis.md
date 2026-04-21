# superplatform-auth 통합 인증 마이그레이션 분석

> meta-dashboard 자체 인증 → superplatform-auth 통합 인증 플랫폼 전환 대비 분석 문서

**작성일**: 2026-04-14
**상태**: 사전 분석 (코드 변경 없음)

---

## 1. 현황 요약

### meta-dashboard (현재 운영)
- 자체 회원가입/로그인/토큰갱신 구현
- Spring Boot 2.7 + MyBatis + MySQL
- JWT(HS256) + Session(Admin) 이중 보안 구조
- 게스트는 group_member 테이블에서 userNo=null로 관리

### superplatform-auth (향후 통합)
- 통합 로그인/가입 플랫폼 (SuperTeacher Core)
- Spring Boot 4.0 + JPA + MySQL (멀티모듈: core-common + core-api)
- JWT + OAuth2 인가코드 + PKCE + SSO 세션
- 멀티테넌트, RBAC, event_outbox 이벤트 전파

---

## 2. 핵심 차이점 비교

### 2-1. 사용자 식별자

| 항목 | meta-dashboard | superplatform-auth |
|------|---------------|-------------------|
| PK | `user_no` (BIGINT AUTO_INCREMENT) | `id` (BIGINT AUTO_INCREMENT, 내부용) |
| 외부 식별자 | user_no를 그대로 노출 | `public_user_id` (UUID, 외부 노출 전용) |
| JWT Subject | `String(userNo)` | `publicUserId` (UUID) |

### 2-2. JWT 토큰 구조

| 항목 | meta-dashboard | superplatform-auth |
|------|---------------|-------------------|
| 라이브러리 | jjwt 0.11 | jjwt 0.12 |
| 서명 | HS256 | HS256 |
| issuer | 없음 | `"superplatform"` |
| audience | 없음 | clientId (예: `"superteacher-core"`) |
| AT 만료 | 30분 | 15분 |
| RT 만료 | 14일 | 7일 |
| RT 저장 | SHA-256 해시 | SHA-256 해시 + tokenFamily (Rotation) |

**Claims 비교:**

```
meta-dashboard:
  subject: userNo
  tokenType: "MEMBER" | "GUEST"
  userNo / stdtId, claId
  email, userSeCd, timestamp

superplatform-auth:
  subject: publicUserId
  email, name, userType
  roles: ["TEACHER", ...]
  tid: tenantId
```

### 2-3. 사용자 데이터 모델

| 항목 | meta-dashboard (`user`) | superplatform-auth (`platform_user`) |
|------|------------------------|-------------------------------------|
| 이메일 | `email` (UNIQUE) | `email` (tenant 내 UNIQUE) |
| 비밀번호 | `password` (BCrypt) | `password_hash` (BCrypt) |
| 닉네임/이름 | `nickname` | `name` |
| 성별 | `gender` | `gender` |
| 역할 | `role_code` 단일 컬럼 | `role` + `user_role` N:M (RBAC) |
| 교사 ID | `tc_id` (user 내) | `teacher_profile` 별도 테이블 |
| 학생 ID | `stdt_id` (user 내) | classroom_student에서 관리 |
| 상태 | ACTIVE/WITHDRAWN/SUSPENDED | ACTIVE/SUSPENDED/WITHDRAWN |
| 계정 잠금 | Caffeine 캐시 (IP+Email) | DB 기반 (failedLoginCount, lockedUntil) |
| 멀티테넌트 | 없음 | `tenant_id` 기반 격리 |
| 인증 제공자 | 없음 | `auth_provider` (LOCAL/OIDC/GOOGLE/KAKAO/NAVER) |

### 2-4. 게스트 구조

| 항목 | meta-dashboard | superplatform-auth |
|------|---------------|-------------------|
| 저장 위치 | `group_member` (userNo=null) | `guest_info` 별도 테이블 |
| 식별자 | email + groupId | `public_guest_id` (UUID) |
| JWT | tokenType="GUEST", stdtId/claId Claims | userType="GUEST", AuthenticatedPrincipal |
| RT 관리 | stdt_id 기반 | guestIdentifier 기반 |

### 2-5. API 경로

| 기능 | meta-dashboard | superplatform-auth |
|------|---------------|-------------------|
| 회원가입 | `POST /member/signup` | `POST /api/v1/auth/signup` |
| 로그인 | `POST /member/login` | `POST /api/v1/auth/login` |
| 토큰 갱신 | `POST /member/token/refresh` | `POST /api/v1/auth/refresh` |
| 로그아웃 | `POST /member/logout` | `POST /api/v1/auth/logout` |
| 이메일 코드 발송 | `POST /member/send-code` | `POST /api/v1/auth/send-code` |
| 이메일 코드 확인 | `POST /member/verify-code` | `POST /api/v1/auth/verify-code` |
| 내 정보 | `GET /member/info` | `GET /api/v1/users/me` |
| API 응답 포맷 | `ResponseDTO<CustomBody>` | `ApiResponse<T>` |

### 2-6. 추가 기능 (superplatform-auth에만 있는 것)

- **OAuth2/SSO**: 인가코드 흐름 + PKCE + ST_SESSION 쿠키
- **멀티테넌트**: TenantContextHolder (ThreadLocal)
- **RBAC**: role + permission + role_permission + user_role
- **event_outbox**: Core DB 변경 → 서비스 DB 전파
- **비밀번호 재설정**: verificationToken 기반
- **교사 프로필**: teacher_profile 별도 테이블 (schoolName, schoolCode, subject 등)
- **SSO 세션 관리**: idle 60분 + absolute 12시간 timeout

---

## 3. 영향 범위

### 3-1. 백엔드 영향

| 영역 | 영향도 | 내용 |
|------|--------|------|
| SecurityConfig | 높음 | JWT 필터 교체 — subject가 userNo→publicUserId, Claims 구조 변경, tenantId 추가 |
| JwtUtil | 높음 | superplatform의 JwtTokenProvider로 교체 또는 검증 로직 호환 필요 |
| JwtAuthenticationFilter | 높음 | Claims 파싱 로직 전면 변경 (userNo→publicUserId, tokenType→userType) |
| SecurityUtil | 높음 | getCurrentUserNo() → getCurrentPublicUserId() 전환. 내부 FK 참조 시 publicUserId→userNo 변환 레이어 필요 |
| AuthTcIdResolver | 높음 | JWT에서 tcId를 직접 추출하는 방식 변경 필요 |
| MemberController | 제거 | 회원가입/로그인/토큰갱신/로그아웃 API → superplatform-auth가 담당 |
| MemberService | 제거 | 동일 |
| EmailVerificationController | 제거 | 동일 |
| EmailVerificationService | 제거 | 동일 |
| GuestAuthController/Service | 중간 | superplatform-auth의 guest_info 연계로 변경 |
| user 테이블 | 중간 | 직접 관리 안 함. event_outbox 동기화로 유지 (FK 참조용) |
| UserMapper | 중간 | insertUser/updateUser 제거, 조회는 유지 (동기화된 데이터 참조) |
| RefreshTokenMapper | 제거 | superplatform-auth에서 관리 |
| LoginRateLimiter | 제거 | superplatform-auth의 DB 기반 잠금으로 대체 |
| PasswordValidator | 제거 | 동일 |
| Admin 세션 인증 | 낮음 | 당장 영향 없음. 향후 Admin도 SSO 통합 가능성 |

**제거 대상 파일 목록:**
```
com.vs.meta.api.member.controller.MemberController
com.vs.meta.api.member.controller.EmailVerificationController
com.vs.meta.api.member.service.MemberService
com.vs.meta.api.member.service.EmailVerificationService
com.vs.meta.api.member.mapper.UserMapper (insert/update만)
com.vs.meta.api.member.mapper.RefreshTokenMapper
com.vs.meta.common.security.JwtUtil
com.vs.meta.common.config.JwtAuthenticationFilter (교체)
com.vs.meta.common.utils.LoginRateLimiter
com.vs.meta.common.utils.PasswordValidator
com.vs.meta.common.exception.JwtExpiredException (교체)
com.vs.meta.common.exception.AuthFailedException (교체)
resources/mapper/member/UserMapper.xml (insert/update만)
resources/mapper/member/RefreshTokenMapper.xml
resources/mapper/member/EmailVerificationMapper.xml
```

**변경 대상 파일 목록:**
```
com.vs.meta.common.config.SecurityConfig (API 영역 필터 교체)
com.vs.meta.common.utils.SecurityUtil (publicUserId 기반으로 변경)
com.vs.meta.common.utils.AuthTcIdResolver (JWT Claims 변경 대응)
com.vs.meta.api.guest.controller.GuestAuthController (guest_info 연계)
com.vs.meta.api.guest.service.GuestAuthService (동일)
com.vs.meta.api.guest.service.GuestService (동일)
```

### 3-2. 프론트엔드 영향

| 영역 | 영향도 | 내용 |
|------|--------|------|
| AuthContext | 높음 | loginWithEmail, signUp, logout 등 API 엔드포인트 전부 변경. User 타입에 publicUserId 추가 |
| API Client (client.ts) | 높음 | 인증용 BASE_URL 분리 (인증→superplatform, 비즈니스→meta-dashboard). PUBLIC_ENDPOINTS 변경 |
| Silent Refresh | 중간 | 토큰 갱신 엔드포인트 변경 (/member/token/refresh → /api/v1/auth/refresh) |
| 로그인/회원가입 UI | 높음 | SSO 리다이렉트 방식 또는 superplatform API 직접 호출 방식 중 선택 |
| User 타입 (types/index.ts) | 중간 | publicUserId 필드 추가, memberType/provider 매핑 변경 |
| 라우트 가드 (routes.tsx) | 낮음 | 인증 여부 판단 로직 동일, 토큰 구조만 변경 |
| localStorage 키 | 낮음 | 키 이름 유지 가능, 저장되는 토큰 포맷만 변경 |
| 게스트 플로우 (JoinGroupPage) | 중간 | 게스트 인증 API 변경, stdtId 발급 방식 변경 |

**변경 대상 파일 목록:**
```
features/auth/model/AuthContext.tsx (핵심 — API 호출 전면 변경)
shared/api/client.ts (BASE_URL 분리, PUBLIC_ENDPOINTS 변경, Silent Refresh 엔드포인트)
shared/types/index.ts (User 인터페이스에 publicUserId 추가)
features/auth/ui/LoginForm.tsx (SSO 리다이렉트 or API 변경)
pages/auth/SignUpPage.tsx (동일)
pages/auth/LoginPage.tsx (동일)
pages/groups/JoinGroupPage.tsx (게스트 인증 API 변경)
app/router/routes.tsx (라우트 가드 — 토큰 검증 방식 변경 시)
```

---

## 4. 현재 시점 대비 전략

> 코드 변경 없이 인지하고 가이드하는 수준

### 4-1. 새 기능 개발 시 주의사항

- **userNo를 외부 API 응답에 직접 노출하지 않기** — 향후 publicUserId로 전환 시 외부 인터페이스 변경 최소화
- **인증 로직을 비즈니스 로직과 섞지 않기** — Controller에서 SecurityUtil 통해 사용자 식별하고, Service에는 userNo를 파라미터로 전달하는 현재 패턴 유지
- **새 테이블에 user_no FK 추가 시** — 향후 publicUserId 컬럼 추가될 수 있음을 인지

### 4-2. event_outbox 이해

superplatform-auth는 `event_outbox` 테이블로 Core DB 변경을 서비스에 전파하는 구조:

```
superplatform-auth                     meta-dashboard
┌──────────────┐                      ┌──────────────┐
│ platform_user│ ─── INSERT 이벤트 ──→ │ user 테이블   │ (동기화)
│ (원본 관리)  │ ─── UPDATE 이벤트 ──→ │ (로컬 복제)  │
│              │ ─── DELETE 이벤트 ──→ │              │
└──────────────┘                      └──────────────┘
      │                                      │
  event_outbox                         이벤트 수신 후
  테이블에 기록                         로컬 user 테이블 반영
```

- meta-dashboard의 user 테이블은 **삭제되지 않고 유지**됨 (FK 참조용)
- 원본 관리 주체만 superplatform-auth로 이동
- 회원가입/수정/탈퇴는 superplatform-auth에서 발생 → 이벤트로 meta-dashboard에 전파

### 4-3. 마이그레이션 시 비밀번호 이관

- 양쪽 모두 **BCrypt** 사용 → 비밀번호 해시 그대로 이관 가능
- 사용자가 비밀번호를 다시 설정할 필요 없음

---

## 5. 마이그레이션 Phase 계획 (예상)

### Phase 1: 데이터 이관 (superplatform-auth 오픈 시)

```
1. user 테이블 데이터 → platform_user로 마이그레이션
   - email, password(BCrypt), nickname→name, gender 매핑
   - public_user_id(UUID) 자동 발급
   - role_code → role + user_role 매핑
   - status 매핑 (동일: ACTIVE/WITHDRAWN/SUSPENDED)

2. 매핑 테이블 생성 (user_no ↔ public_user_id)
   - meta-dashboard 내부에서 기존 FK 참조 유지하면서 publicUserId 변환에 사용

3. teacher_profile 생성 (교사 계정)
   - 기존 user.tc_id → teacher_profile 연결

4. 게스트 데이터 이관 (필요 시)
   - group_member(GUEST) → guest_info 매핑
```

### Phase 2: meta-dashboard 인증 전환

```
백엔드:
  1. JwtAuthenticationFilter 교체
     - superplatform-auth JWT 검증 (동일 비밀키 공유 or 공개키 검증)
     - publicUserId 추출 → 매핑 테이블로 userNo 변환
  2. SecurityUtil 변경
     - getCurrentPublicUserId() 추가
     - getCurrentUserNo()는 매핑 테이블 경유로 유지 (하위 호환)
  3. 회원가입/로그인/토큰갱신 API 제거
  4. event_outbox 수신 로직 추가 (user 테이블 동기화)

프론트:
  1. AuthContext 변경
     - 인증 API → superplatform-auth 호출
     - 또는 OAuth2/SSO 리다이렉트 방식 채택
  2. API Client 변경
     - 인증용/비즈니스용 BASE_URL 분리
     - Silent Refresh 엔드포인트 변경
  3. User 타입에 publicUserId 추가
```

### Phase 3: 정리

```
1. 제거 대상 코드 삭제 (섹션 3-1 참조)
2. 매핑 테이블 의존도 축소 (점진적으로 publicUserId 직접 사용)
3. 게스트 플로우 통합
4. Admin 인증 SSO 전환 (선택)
```

---

## 6. 리스크 및 대응

| 리스크 | 설명 | 대응 |
|--------|------|------|
| userNo→publicUserId 전환 | group_member, memo_info, counseling_info 등 모든 FK에서 userNo 사용 중 | 매핑 테이블(user_no ↔ public_user_id) 생성. user 테이블은 유지하고 publicUserId 컬럼 추가 |
| JWT 검증 호환 | 서명 키, Claims 구조 완전히 다름 | 전환 기간 중 dual validation (양쪽 토큰 모두 검증) 고려. 또는 일괄 전환 + 전 사용자 재로그인 |
| 게스트 토큰 | 현재 게스트 JWT에 stdtId/claId Claims가 있음. superplatform에는 이 구조 없음 | superplatform의 게스트 구조 확정 후 대응. 커스텀 Claims 추가 협의 필요 |
| Admin 인증 | 현재 Session 기반. superplatform은 JWT+SSO 기반 | 초기에는 Admin 인증 유지, 향후 별도 전환 |
| 기존 사용자 세션 | 전환 시점에 기존 JWT가 무효화됨 | 전 사용자 재로그인 필요. 사전 공지 필수 |
| AT 만료 시간 차이 | 30분 → 15분 | 프론트 Silent Refresh 빈도 증가. 이미 구현되어 있으므로 큰 문제 없음 |
| API 응답 포맷 차이 | ResponseDTO vs ApiResponse | 인증 API만 superplatform 포맷 사용, 비즈니스 API는 기존 포맷 유지 |
| 멀티테넌트 | meta-dashboard에는 없는 개념 | 기본 tenantId(1L)로 고정 운영 가능. 향후 확장 시 대응 |

---

## 7. 참고: superplatform-auth API 스펙 요약

### 인증 API (공개)
```
GET  /api/v1/auth/check-email?email=xxx          이메일 중복 확인
POST /api/v1/auth/send-code                       인증코드 발송 (5분 유효, 1분 쿨다운)
POST /api/v1/auth/verify-code                     인증코드 확인 → verificationToken 반환
POST /api/v1/auth/signup                          회원가입 (verificationToken 필수)
POST /api/v1/auth/login                           로그인 → AT+RT+ST_SESSION 쿠키
POST /api/v1/auth/refresh                         토큰 갱신 (RT Rotation)
POST /api/v1/auth/logout                          로그아웃 (RT family 삭제)
POST /api/v1/auth/password-reset                  비밀번호 재설정
GET  /api/v1/auth/session                         SSO 세션 확인
```

### 사용자 API (인증 필요)
```
GET  /api/v1/users/me                             내 프로필
PUT  /api/v1/users/me                             프로필 수정
PUT  /api/v1/users/me/password                    비밀번호 변경 (다른 기기 세션 만료)
GET  /api/v1/users/{publicUserId}                 회원 단건 조회
POST /api/v1/users/batch                          회원 일괄 조회 (최대 100건)
GET  /api/v1/teachers/me/profile                  교사 프로필 조회
PUT  /api/v1/teachers/me/profile                  교사 프로필 수정
```

### OAuth2/SSO API
```
GET  /oauth2/authorize                            인가코드 요청 (PKCE 지원)
POST /oauth2/token                                토큰 교환 (서비스 BE→Core)
POST /oauth2/touch                                세션 활성화 (idle timeout 갱신)
GET  /oauth2/logout                               SSO 로그아웃
```

### 응답 포맷
```json
{
  "success": true,
  "message": null,
  "data": { ... }
}
```
- `@JsonInclude(NON_NULL)` — null 필드 제외

---

## 8. 결론

현재 시점에서 **코드 변경은 불필요**합니다. 다음만 인지하면 됩니다:

1. **인증 관련 코드 전체가 교체 대상** — 새 기능에서 인증 로직을 깊이 커플링하지 않기
2. **userNo 외부 노출 자제** — 향후 publicUserId 전환 시 외부 인터페이스 변경 최소화
3. **user 테이블은 유지됨** — 원본 관리 주체만 이동, event_outbox로 동기화
4. **비밀번호 이관은 무리 없음** — 양쪽 BCrypt 동일
5. **프론트 인증 레이어가 잘 분리되어 있음** — AuthContext + apiClient에 집중, 교체 수월

superplatform-auth 오픈 일정이 확정되면 Phase별 실행 계획을 구체화하면 됩니다.
