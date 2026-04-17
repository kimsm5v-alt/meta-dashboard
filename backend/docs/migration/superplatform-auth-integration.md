# 학심정(meta-dashboard) — superplatform-auth 통합 인증 대응 분석

> 통합 인증 플랫폼(superplatform-auth) 오픈에 따른 학심정 서비스의 구현/변경 사항 분석

**작성일**: 2026-04-14
**상태**: 사전 분석
**참조**: [0414 회의록](https://vs365.atlassian.net/wiki/spaces/AppleTF/pages/369393800/0414)
**화면안**: https://ssuper-platform.vercel.app/

---

## 1. 플랫폼 / 서비스 역할 분담

### 1-1. 정보 수집 분담

| 구분 | 수집 주체 | 항목 |
|------|----------|------|
| 플랫폼에서 수집 | superplatform-auth | 역할(교사/학생), 이름, 이메일, 비밀번호 |
| 서비스에서 수집 | 학심정 자체 | 성별, 학교명, 학교급, 학년/반/번호 |

### 1-2. 기능 분담

| 기능 | 플랫폼 | 학심정 |
|------|--------|--------|
| 소셜 로그인 (비바샘/구글/네이버/카카오) | O | - |
| 계정 관리 (이름, 이메일) | O | - |
| SSO 세션 관리 | O | - |
| 통합 회원가입/로그인 UI | O | - |
| 비밀번호 관리 | O | - |
| 역할 분기 (교사/학생) | - | O |
| 그룹/반 생성 및 관리 | - | O (서비스 내 생성) |
| QR 코드 초대 | - | O |
| 게스트 허용 | - | O (이메일 입력칸 O) |
| 학생 전용 화면 | - | O |
| 추가 정보 수집 (성별/학교/학년 등) | - | O |
| 단독 서비스 (별도 도메인) | - | O |

---

## 2. 진입 시나리오별 학심정 대응

### 2-1. 일반 진입 (서비스 최초)

| 시나리오 | 학심정 대응 |
|---------|-----------|
| 비로그인 + 계정 없음 | 플랫폼 로그인 창 리다이렉트 → 회원가입 → **학심정 추가 정보 입력** → 서비스 랜딩 |
| 비로그인 + 계정 있음 (최초 진입) | 플랫폼 로그인 → **연동 동의** → **학심정 추가 정보 입력** → 서비스 랜딩 |
| 비로그인 + 계정 있음 (기존 이력) | 플랫폼 로그인 → 바로 서비스 랜딩 |
| 로그인 됨 + 타 서비스에서 이동 (최초) | **연동 동의** → **학심정 추가 정보 입력** → 서비스 랜딩 |
| 로그인 됨 + 기존 이력 | 자동 로그인 유지 → 바로 서비스 랜딩 |

### 2-2. QR코드 진입

```
QR코드 스캔
  ↓
[회원] 플랫폼 로그인 창으로 이동
  또는
[게스트] 비회원 정보 입력 창으로 이동
```

- 학심정은 게스트 허용(이메일 입력칸 O) → 기존 게스트 플로우 상당 부분 유지

### 2-3. 기존 자체 회원 → SSO 전환

> "학심정 일반 회원으로 가입했으나, 플랫폼 SSO가 아닐 때
> → 플랫폼 통합 SSO 회원으로 전환하시겠습니까?" 알럿 노출

- 기존 학심정 자체 가입 사용자에 대해 SSO 전환 유도 알럿 필요

---

## 3. 학심정 추가 정보 입력 화면 (신규)

플랫폼 로그인 후 학심정 최초 진입 시 표시.
플랫폼에서 이미 확보한 정보(이름, 이메일, 역할)는 제외하고 서비스 고유 정보만 수집.

```
플랫폼 로그인 완료 (이름, 이메일, 역할 확보)
  ↓
학심정 최초 진입 감지 (서비스 DB에 해당 사용자 프로필 없음)
  ↓
추가 정보 입력 화면:
  - 성별 (M/F)
  - 학교명
  - 학교급 (초등/중등)
  - 학년, 반, 번호
  ↓
서비스 DB에 저장
  ↓
서비스 메인 화면 랜딩
```

---

## 4. 게스트 플로우 (유지/조정)

학심정은 게스트 허용 + 이메일 입력칸 O — 현재 구조와 동일한 방향.

```
QR코드 스캔
  ↓
선택: [로그인] 또는 [게스트 참여]
  ↓ (게스트 선택 시)
이메일 입력 → 이메일 인증 → 닉네임/성별 입력 → 그룹 참가
```

- 게스트는 플랫폼 회원이 아님 → 게스트 인증/관리는 학심정 서비스 레벨에서 처리
- 게스트 이메일 인증 주체 (플랫폼 vs 학심정 자체) 협의 필요

---

## 5. 백엔드 구현 항목

| # | 항목 | 구분 | 설명 |
|---|------|------|------|
| 1 | 추가 정보 저장 API | 신규 | 성별, 학교명, 학교급, 학년/반/번호 저장. publicUserId 기반 |
| 2 | 최초 진입 여부 확인 API | 신규 | publicUserId로 서비스 DB에 프로필 존재 여부 확인 |
| 3 | JWT 검증 로직 교체 | 변경 | superplatform JWT 검증 (서명 키 공유 or 공개키). subject: publicUserId |
| 4 | user 테이블에 publicUserId 컬럼 추가 | 변경 | 플랫폼 사용자 ↔ 서비스 사용자 매핑 |
| 5 | event_outbox 수신 로직 | 신규 | 플랫폼 회원 변경 이벤트 수신 → 로컬 user 테이블 동기화 |
| 6 | 기존 회원 SSO 전환 API | 신규 | 기존 user_no ↔ publicUserId 연결 |
| 7 | 게스트 인증 유지/조정 | 변경 | 게스트 이메일 인증 주체 결정 후 대응 |
| 8 | 자체 가입/로그인/토큰 API 제거 | 제거 | 플랫폼 오픈 후 순차 제거 |

### 제거 대상 파일 (플랫폼 오픈 후)

```
# Controller
com.vs.meta.api.member.controller.MemberController
com.vs.meta.api.member.controller.EmailVerificationController

# Service
com.vs.meta.api.member.service.MemberService
com.vs.meta.api.member.service.EmailVerificationService

# Security
com.vs.meta.common.security.JwtUtil (교체)
com.vs.meta.common.config.JwtAuthenticationFilter (교체)
com.vs.meta.common.utils.LoginRateLimiter
com.vs.meta.common.utils.PasswordValidator
com.vs.meta.common.exception.JwtExpiredException (교체)
com.vs.meta.common.exception.AuthFailedException (교체)

# Mapper
resources/mapper/member/RefreshTokenMapper.xml
resources/mapper/member/EmailVerificationMapper.xml
resources/mapper/member/UserMapper.xml (insert/update 제거, 조회는 유지)
```

### 변경 대상 파일

```
# Security (JWT 검증 교체)
com.vs.meta.common.config.SecurityConfig (API 영역 필터 교체)
com.vs.meta.common.utils.SecurityUtil (publicUserId 기반으로 변경)
com.vs.meta.common.utils.AuthTcIdResolver (JWT Claims 변경 대응)

# 게스트
com.vs.meta.api.guest.controller.GuestAuthController
com.vs.meta.api.guest.service.GuestAuthService
com.vs.meta.api.guest.service.GuestService
```

---

## 6. 프론트엔드 구현 항목

| # | 항목 | 구분 | 설명 |
|---|------|------|------|
| 1 | 추가 정보 입력 페이지 | 신규 | 플랫폼 로그인 후 최초 진입 시 (성별/학교/학년·반·번호) |
| 2 | SSO 리다이렉트 로그인 | 변경 | 자체 LoginForm → 플랫폼 로그인 페이지 리다이렉트 (OAuth2 흐름) |
| 3 | 연동 동의 화면 | 신규 | 기존 계정 있는 사용자가 최초 진입 시 |
| 4 | SSO 전환 안내 알럿 | 신규 | 기존 자체 가입 사용자에게 "통합 SSO 전환" 알럿 |
| 5 | AuthContext 변경 | 변경 | 플랫폼 JWT 기반 인증으로 교체 |
| 6 | API Client | 변경 | 인증 BASE_URL 분리 (인증→플랫폼, 비즈니스→학심정) |
| 7 | QR 진입 화면 | 변경 | 로그인→플랫폼 리다이렉트, 게스트→기존 플로우 유지 |
| 8 | 자체 가입/로그인 UI 제거 | 제거 | SignUpPage, LoginForm 등 |

### 변경 대상 파일

```
# 인증 (핵심)
features/auth/model/AuthContext.tsx (API 호출 전면 변경)
shared/api/client.ts (BASE_URL 분리, PUBLIC_ENDPOINTS 변경, Silent Refresh)
shared/types/index.ts (User 인터페이스에 publicUserId 추가)

# 로그인/가입 UI
features/auth/ui/LoginForm.tsx (SSO 리다이렉트 or 제거)
pages/auth/SignUpPage.tsx (제거)
pages/auth/LoginPage.tsx (SSO 리다이렉트로 변경)

# 게스트
pages/groups/JoinGroupPage.tsx (QR 진입 플로우 변경)

# 라우팅
app/router/routes.tsx (추가 정보 입력 라우트 추가, 라우트 가드 조정)
```

---

## 7. 인증 구조 변경 상세

### 7-1. 현재 vs 변경 후

```
[현재]
프론트 → 학심정 백엔드 (/member/login) → JWT 발급 → 프론트 저장

[변경 후]
프론트 → 플랫폼 로그인 페이지 (OAuth2 리다이렉트)
  → 플랫폼 인증 완료 → authorization code 발급
  → 학심정으로 콜백 → 학심정 BE가 code로 토큰 교환
  → 플랫폼 JWT(AT+RT) 확보 → 프론트에 전달

또는

프론트 → 플랫폼 API 직접 호출 (/api/v1/auth/login)
  → AT+RT 수신 → 학심정 API 호출 시 해당 토큰 사용
```

### 7-2. JWT Claims 변경

```
현재 (학심정 자체):
  subject: userNo (BIGINT)
  tokenType: "MEMBER" | "GUEST"
  userNo, email, userSeCd, timestamp

변경 후 (superplatform):
  subject: publicUserId (UUID)
  issuer: "superplatform"
  audience: clientId
  email, name, userType, roles[], tid(tenantId)
```

### 7-3. 사용자 식별자 전환

```
현재: userNo (BIGINT) — 모든 FK, 쿼리에서 사용
변경: publicUserId (UUID) — 외부 식별자

대응: user 테이블에 public_user_id 컬럼 추가
     + JWT에서 publicUserId 추출 → 매핑 테이블로 userNo 변환
     → 기존 FK 참조 로직 유지
```

### 7-4. 토큰 만료 시간 변경

| 토큰 | 현재 | 변경 후 |
|------|------|---------|
| Access Token | 30분 | 15분 |
| Refresh Token | 14일 | 7일 |

- 프론트 Silent Refresh 빈도 증가하지만, 이미 구현되어 있어 큰 문제 없음

---

## 8. event_outbox 동기화 구조 (예상)

```
superplatform-auth                          학심정(meta-dashboard)
┌──────────────┐                           ┌──────────────┐
│ platform_user│ ─── 생성 이벤트 ────────→ │ user 테이블   │
│ (원본 관리)  │ ─── 수정 이벤트 ────────→ │ (로컬 복제)  │
│              │ ─── 탈퇴 이벤트 ────────→ │              │
└──────────────┘                           └──────────────┘
      │                                           │
  event_outbox                              이벤트 수신 후
  테이블에 기록                              로컬 user 테이블 반영
```

- user 테이블은 삭제되지 않고 유지 (group_member, memo_info, counseling_info 등 FK 참조)
- 원본 관리 주체만 플랫폼으로 이동
- 이벤트 전달 방식 (폴링/웹훅/메시지큐) 협의 필요

---

## 9. 데이터 이관

### 9-1. 기존 회원 이관

```
user 테이블 → platform_user
  - email → email
  - password → password_hash (BCrypt 동일, 그대로 이관)
  - nickname → name
  - gender → gender
  - role_code → role + user_role (RBAC 매핑)
  - status → status (ACTIVE/WITHDRAWN/SUSPENDED 동일)
  - public_user_id 자동 발급 (UUID)
```

### 9-2. 매핑 테이블

```sql
-- user 테이블에 컬럼 추가
ALTER TABLE user ADD COLUMN public_user_id VARCHAR(64) NULL UNIQUE;

-- 또는 별도 매핑 테이블
CREATE TABLE user_platform_mapping (
    user_no         BIGINT NOT NULL,
    public_user_id  VARCHAR(64) NOT NULL,
    mapped_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_no),
    UNIQUE KEY uk_public_user_id (public_user_id)
);
```

---

## 10. 협의 필요 사항

| # | 항목 | 관련 팀 | 내용 |
|---|------|---------|------|
| 1 | 게스트 이메일 인증 주체 | 플랫폼 팀 | 학심정 게스트의 이메일 인증을 플랫폼에서 할지, 학심정 자체에서 유지할지 |
| 2 | JWT 검증 방식 | 플랫폼 팀 | 동일 비밀키 공유 vs 공개키 검증 vs 토큰 introspection |
| 3 | event_outbox 전파 스펙 | 플랫폼 팀 | 이벤트 포맷, 전달 방식 (폴링/웹훅/메시지큐), 재시도 정책 |
| 4 | 추가 정보 입력 시점 | 기획 | 플랫폼 가입 직후 vs 학심정 최초 진입 시 |
| 5 | 기존 회원 데이터 이관 시점 | 플랫폼 팀 + DBA | user → platform_user 이관 방법 및 시점 |
| 6 | 14세 미만 가입 | 기획 | 보호자 동의 플로우 학심정 대응 범위 |
| 7 | 플랫폼 로그인 UI 커스터마이징 | 기획/디자인 | 학심정 톤앤매너에 맞춘 커스터마이징 가능 여부 |
| 8 | 전환 기간 운영 | 플랫폼 팀 | 자체 인증과 SSO 인증 병행 기간 필요 여부 (dual validation) |

---

## 11. 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| userNo → publicUserId 전환 | 모든 FK/쿼리에서 userNo 사용 중 | 매핑 테이블로 해결. user 테이블은 유지 |
| JWT 검증 호환 | 서명 키, Claims 구조 상이 | 전환 기간 dual validation 또는 일괄 전환 + 재로그인 |
| 게스트 토큰 | 현재 JWT에 stdtId/claId Claims 있음. 플랫폼에는 없음 | 게스트는 서비스 레벨이므로 학심정 자체 토큰 유지 가능 |
| 기존 사용자 세션 무효화 | 전환 시 기존 JWT 무효화 | 사전 공지 + 전 사용자 재로그인 필요 |
| API 응답 포맷 차이 | ResponseDTO vs ApiResponse | 인증 API만 플랫폼 포맷, 비즈니스 API는 기존 포맷 유지 |

---

## 12. 타임라인 (예상)

```
현재          학심정 서비스 오픈 (자체 인증)
  ↓
Phase 0      현행 유지. 새 기능에서 userNo 외부 노출 자제
  ↓
Phase 1      superplatform-auth 오픈
             - 기존 회원 데이터 이관
             - 매핑 테이블 생성
  ↓
Phase 2      학심정 인증 전환
             - JWT 검증 교체
             - 추가 정보 입력 화면 개발
             - SSO 리다이렉트 로그인 적용
             - 기존 회원 SSO 전환 안내
  ↓
Phase 3      정리
             - 자체 가입/로그인 코드 제거
             - 게스트 플로우 통합
             - Admin 인증 전환 (선택)
```
