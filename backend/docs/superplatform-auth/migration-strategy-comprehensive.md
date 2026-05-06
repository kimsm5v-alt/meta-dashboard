# 슈퍼플랫폼 SSO 전환 종합 마이그레이션 전략

> 개인정보 SSO 일괄 관리 정책(ISMS 대응) 확정에 따른 학심정 단독 오픈 → SSO 전환 전체 대응 계획

**작성일**: 2026-04-16  
**정책 근거**: 개별 서비스에서 추가로 받은 정보도 슈퍼플랫폼 DB에 취합 및 저장 (ISMS 인증 대응)  
**핵심 원칙**: 개인정보는 SSO 통합 플랫폼에서만 저장, 학심정 DB에는 개인정보를 보관하지 않음

---

## 목차

1. [전체 전환 로드맵 (3-Phase)](#1-전체-전환-로드맵)
2. [Phase 1: 단독 인증으로 오픈](#2-phase-1-단독-인증으로-오픈)
3. [Phase 2: SSO 인증 전환](#3-phase-2-sso-인증-전환)
4. [Phase 3: 개인정보 이관 완료](#4-phase-3-개인정보-이관-완료)
5. [DB 구조 변천](#5-db-구조-변천)
6. [개인정보 조회 아키텍처](#6-개인정보-조회-아키텍처)
7. [Auth 서버 연동 상세](#7-auth-서버-연동-상세)
8. [영향받는 코드 전수 목록](#8-영향받는-코드-전수-목록)
9. [Auth 팀 협의 필요 사항](#9-auth-팀-협의-필요-사항)
10. [리스크 및 대응](#10-리스크-및-대응)

---

## 1. 전체 전환 로드맵

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Phase 1                 Phase 2                Phase 3
  단독 인증 오픈            SSO 인증 전환           개인정보 이관
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  학심정 자체 인증          Auth 서버 SSO           개인정보 Auth 일괄
  (현재 그대로)            + 학심정 DB에             관리로 전환
                          개인정보 아직 유지
                          (과도기)

  인증: 자체               인증: SSO               인증: SSO
  개인정보: 학심정 DB       개인정보: 학심정 DB       개인정보: Auth DB만
  Auth 의존: 없음          Auth 의존: 인증만         Auth 의존: 인증+개인정보

  개발: 0 (현행 유지)       개발: ~2~3주             개발: ~4~5주
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**왜 3단계로 나누는가:**
- Phase 1→2를 한 번에 하면 Auth 서버 일정에 종속
- Phase 2→3를 한 번에 하면 변경 범위가 너무 커서 리스크 증가
- 각 Phase 사이에 안정화 기간을 두고 검증 가능

---

## 2. Phase 1: 단독 인증으로 오픈

### 2.1 목표

학심정 서비스를 현재 자체 인증 체계로 오픈한다. SSO 관련 변경 사항 없음.

### 2.2 유일한 사전 준비: Phase 2를 위한 컬럼 선 추가

오픈 전에 `user` 테이블에 `sp_user_id` 컬럼만 미리 추가해둔다. 당장은 NULL이지만 Phase 2에서 매핑에 사용된다.

```sql
ALTER TABLE `user`
  ADD COLUMN sp_user_id VARCHAR(64) NULL
    COMMENT '슈퍼플랫폼 publicUserId (Phase 2에서 매핑)' AFTER user_no,
  ADD UNIQUE KEY uk_user_sp_user_id (sp_user_id);
```

이 한 줄 변경은 기존 기능에 **영향 제로**이고, Phase 2 진입 시 DDL 변경 없이 바로 매핑을 시작할 수 있다.

### 2.3 Phase 1 체크리스트

- [x] 현행 인증 시스템으로 오픈
- [ ] `user.sp_user_id` 컬럼 선 추가
- [ ] Auth 팀에 서비스 등록 신청 (Phase 2 준비)

---

## 3. Phase 2: SSO 인증 전환

### 3.1 목표

로그인/회원가입을 Auth 서버 SSO로 전환한다. **개인정보는 아직 학심정 DB에 유지** (과도기).

### 3.2 이 Phase에서 개인정보를 아직 유지하는 이유

- Phase 3의 개인정보 이관은 30+쿼리, 8서비스, 15+화면 수정이 필요한 대공사
- SSO 인증 전환과 개인정보 이관을 동시에 하면 디버깅이 극히 어려움
- 인증이 안정적으로 동작하는 것을 확인한 후 개인정보 이관에 착수하는 것이 안전

### 3.3 백엔드 작업

| # | 작업 | 파일 |
|---|------|------|
| 2-1 | Auth 프록시 컨트롤러 구현 (4개 엔드포인트) | `AuthProxyController.java` (신규) |
| 2-2 | Auth 서버 설정 클래스 | `AuthServerProperties.java` (신규) |
| 2-3 | SP JWT Claims 파싱 필터 | `SpJwtClaimFilter.java` (신규) |
| 2-4 | SP ↔ 학심정 사용자 매핑 서비스 | `SsoUserMappingService.java` (신규) |
| 2-5 | SecurityConfig 수정 (SSO URL 허용 + 필터) | `SecurityConfig.java` (수정) |
| 2-6 | JwtAuthenticationFilter에 SP JWT 분기 | `JwtAuthenticationFilter.java` (수정) |
| 2-7 | application.yml 환경변수 추가 | `application.yml` (수정) |
| 2-8 | UserMapper에 sp_user_id 매핑 쿼리 추가 | `UserMapper.xml` (수정) |

**사용자 매핑 로직 (Phase 2):**
```
SSO 로그인 완료 → JWT Claims 수신 (sub=UUID, email, name, userType)

1. sp_user_id로 학심정 user 조회
   → 매칭 O: 기존 user 반환 (로그인 시 nickname/email 동기화)
   → 매칭 X: email로 기존 user 조회
     → email 매칭 O: sp_user_id 매핑 + auth_provider='SSO' 업데이트
     → email 매칭 X: 신규 user 생성 (JWT 정보 기반)
```

### 3.4 프론트엔드 작업

| # | 작업 | 파일 |
|---|------|------|
| 2-9 | Auth Client SDK CDN 스크립트 추가 | `index.html` |
| 2-10 | SDK 타입 선언 + 초기화 | `shared/lib/authClient.ts` (신규) |
| 2-11 | SDK 기반 React 훅 | `shared/hooks/useSpAuth.ts` (신규) |
| 2-12 | main.tsx 부트스트랩 변경 | `main.tsx` (수정) |
| 2-13 | AuthContext SDK 기반 전면 교체 | `AuthContext.tsx` (수정) |
| 2-14 | client.ts Silent Refresh 제거 → SDK 위임 | `client.ts` (수정) |
| 2-15 | LoginPage SSO 버튼 + 기존 로그인 보조 유지 | `LoginPage.tsx` (수정) |
| 2-16 | /auth/callback 라우트 추가 | `routes.tsx` (수정) |
| 2-17 | 환경변수 추가 | `.env.*` |

### 3.5 Phase 2 완료 상태

```
인증: SSO (Auth Client SDK)
user 테이블: sp_user_id 매핑 완료, email/nickname/gender 아직 유지
group_member: nickname/gender/email 아직 유지
모든 쿼리/서비스/화면: 변경 없음 (DB에서 직접 조회)
```

### 3.6 Phase 2 체크리스트

- [ ] Auth 팀에서 client_id / client_secret 수령
- [ ] Auth 서버 CORS에 학심정 도메인 등록
- [ ] BE: Auth 프록시 4개 엔드포인트
- [ ] BE: SP JWT 파싱 + 사용자 매핑
- [ ] FE: SDK 연동 + 인증 플로우 전환
- [ ] 기존 회원 SSO 전환 테스트 (email 기반 자동 매핑)
- [ ] 게스트 토큰 연동 테스트
- [ ] 자체 로그인 fallback 유지 (Auth 서버 장애 대응)

---

## 4. Phase 3: 개인정보 이관 완료

### 4.1 목표

학심정 DB에서 모든 개인정보를 제거하고, Auth 서버에서만 조회하도록 전환한다. ISMS 인증 대응 완료.

### 4.2 개인정보 제거 대상

| 테이블 | 제거 컬럼 | 대체 방법 |
|--------|----------|----------|
| **user** | `email`, `password`, `nickname`, `gender` | Auth API 조회 (sp_user_id 기반) |
| **group_member** | `nickname`, `gender`, `email` | Auth API 조회 (user의 sp_user_id 경유) |
| **counseling_student** | `stdt_name` | Auth API 조회 (stdt_id → user → sp_user_id) |
| **group_invitation** | `email` | sp_user_id로 대체 또는 Auth API 경유 |
| **guest_conversion_log** | `guest_email` | guest_id만 보관 |
| **email_verification** | 테이블 전체 | DROP (Auth 서버가 처리) |

### 4.3 신규 아키텍처: PersonalInfoResolver

개인정보가 필요한 모든 곳에서 Auth API를 호출하는 공통 레이어를 도입한다.

```
┌─────────────────────────────────────────────────────────┐
│                     학심정 Backend                        │
│                                                         │
│  Controller → Service → PersonalInfoResolver            │
│                          ├─ 단건: resolve(spUserId)     │
│                          │   → 캐시 hit? return         │
│                          │   → 캐시 miss? Auth API call │
│                          │                              │
│                          └─ 배치: resolveBatch(ids)     │
│                              → 캐시에서 hit 분리        │
│                              → miss만 Auth batch API    │
│                              → 결과 병합 + 캐시 저장    │
│                                                         │
│  ┌────────────────┐                                     │
│  │  Local Cache    │  (Caffeine / Redis)                │
│  │  TTL: 5~10분    │  ← ISMS: 캐시는 "저장"이 아닌      │
│  │  Max: 10,000건  │     "일시적 처리 목적의 보유"로 소명 │
│  └────────────────┘                                     │
└─────────────────────────────────────────────────────────┘
         │                    ▲
         ▼                    │
┌────────────────────────────────────┐
│  Auth 서버                          │
│  GET  /api/v1/users/{id}    (단건)  │
│  POST /api/v1/users/batch   (100건) │
└────────────────────────────────────┘
```

### 4.4 Auth 서버 지원 현황 (확인 완료)

| 필요 기능 | Auth 서버 지원 여부 | 비고 |
|----------|-------------------|------|
| 단건 사용자 조회 | **있음** (`GET /api/v1/users/{publicUserId}`) | publicUserId 기반 |
| 배치 사용자 조회 | **있음** (`POST /api/v1/users/batch`, 최대 100건) | sp_user_id 목록으로 조회 |
| 사용자 프로필 수정 | **있음** (`PUT /api/v1/users/me`) | name, gender 수정 |
| 교사 프로필 | **있음** (`TeacherProfile` 엔티티) | schoolName, schoolCode, subject, department, phone |
| 서비스별 추가 데이터 | **있음** (`TeacherProfile.extra_data` JSON 필드) | 학심정 고유 필드 저장 가능 |
| 학생 프로필 | **없음** | 학교급, 학년, 반, 번호 저장할 곳 필요 → Auth 팀 협의 |

### 4.5 백엔드 작업

#### 4.5.1 신규 생성

| 파일 | 역할 |
|------|------|
| `common/resolver/PersonalInfoResolver.java` | Auth API 기반 개인정보 조회 + 캐싱 핵심 모듈 |
| `common/resolver/PersonalInfo.java` | 개인정보 VO (email, name, gender) |
| `common/resolver/AuthApiClient.java` | Auth 서버 REST 호출 클라이언트 |
| `common/config/CacheConfig.java` | Caffeine 캐시 설정 (TTL, 최대 건수) |

#### 4.5.2 Mapper XML 수정 (7개 파일, 30+ 쿼리)

| Mapper | 쿼리 수 | 변경 내용 |
|--------|--------|----------|
| `UserMapper.xml` | 8개 | email/nickname/gender SELECT 제거, sp_user_id 반환 |
| `GroupMemberMapper.xml` | 5개 | nickname/gender/email 컬럼 제거 |
| `GroupQueryMapper.xml` | 8개 | JOIN으로 가져오던 nickname/email 제거 |
| `DgnssMapper.xml` | 6개+ | `gm.nickname AS MEM_NM` 등 제거, sp_user_id 반환 |
| `CounselingStudentMapper.xml` | 2개 | stdt_name 제거 |
| `GroupInvitationMapper.xml` | 2개 | email → sp_user_id 전환 |
| `GuestConversionLogMapper.xml` | 1개 | guest_email 제거 |

#### 4.5.3 Service 수정 (8개 클래스)

| 서비스 | 변경 내용 |
|--------|----------|
| `MemberService` | 로그인/프로필 응답에서 DB 조회 → PersonalInfoResolver 사용 |
| `GroupService` | 그룹 참가 시 user→group_member 비정규화 복사 **제거** |
| `CounselingService` | stdt_name 스냅샷 저장 **제거**, 조회 시 PersonalInfoResolver |
| `AdminUserService` | 회원 목록/검색 → Auth API 경유로 전환 |
| `GuestAuthService` | 게스트 응답에서 개인정보 처리 변경 |
| `GuestService` | gender 동기화 로직 제거 |
| `GroupInvitationService` | email 저장 → sp_user_id 또는 Auth API 경유 |
| `AdminUserDetailsService` | Admin 인증 (별도 처리 — 아래 참고) |

#### 4.5.4 응답 DTO 변경 패턴

모든 API 응답에서 개인정보를 반환하는 곳을 PersonalInfoResolver 경유로 변경한다.

```java
// AS-IS (Phase 2까지)
public GroupMemberResponse getGroupMembers(Long groupId) {
    List<GroupMember> members = groupMemberMapper.findByGroupId(groupId);
    // members에 nickname, email이 이미 들어있음
    return members.stream().map(this::toResponse).toList();
}

// TO-BE (Phase 3)
public GroupMemberResponse getGroupMembers(Long groupId) {
    List<GroupMember> members = groupMemberMapper.findByGroupId(groupId);
    
    // sp_user_id 목록 추출
    List<String> spUserIds = members.stream()
        .map(m -> userMapper.findSpUserIdByUserNo(m.getUserNo()))
        .toList();
    
    // Auth API 배치 조회
    Map<String, PersonalInfo> infoMap = personalInfoResolver.resolveBatch(spUserIds);
    
    // 병합
    return members.stream()
        .map(m -> toResponse(m, infoMap.get(m.getSpUserId())))
        .toList();
}
```

### 4.6 프론트엔드 작업

#### 4.6.1 타입 변경

```typescript
// AS-IS
interface GroupMember {
  name: string;        // DB에서 직접
  email?: string;      // DB에서 직접
  gender?: 'M' | 'F'; // DB에서 직접
}

// TO-BE — 필드 자체는 동일하지만, 백엔드가 Auth API에서 가져와서 채워줌
// 프론트엔드 타입은 유지, 데이터 소스만 변경
interface GroupMember {
  name: string;        // 백엔드가 Auth API에서 채워서 응답
  email?: string;      // 백엔드가 Auth API에서 채워서 응답
  gender?: 'M' | 'F'; // 백엔드가 Auth API에서 채워서 응답
}
```

**핵심**: 백엔드 응답 형식을 유지하면 **프론트엔드 수정을 최소화**할 수 있다. PersonalInfoResolver가 DB 대신 Auth API에서 가져온 개인정보를 기존과 동일한 응답 구조에 채워주면 된다.

#### 4.6.2 프론트엔드 수정이 필요한 부분

| 파일 | 변경 내용 |
|------|----------|
| `SignUpPage.tsx` | 제거 (Auth 서버에서 처리) |
| `ForgotPasswordPage.tsx` | 제거 (Auth 서버에서 처리) |
| 회원가입 시 추가 정보 입력 | Auth 서버 프로필 완성 API 호출로 변경 |
| AuthContext의 User 타입 | `spUserId` 추가, 개인정보는 JWT Claims에서 가져옴 |

**대부분의 화면 컴포넌트는 수정 불필요** — 백엔드 응답 형식이 동일하게 유지되므로.

### 4.7 Phase 3 체크리스트

- [ ] PersonalInfoResolver + 캐시 레이어 구현
- [ ] Auth API 클라이언트 구현 (단건 + 배치)
- [ ] 7개 Mapper XML 수정 (30+ 쿼리)
- [ ] 8개 Service 클래스 수정
- [ ] DDL 적용 (개인정보 컬럼 DROP)
- [ ] 기존 데이터 이력 처리 (상담 기록 등)
- [ ] Admin 영역 대응
- [ ] 통합 테스트 (Auth 장애 시 fallback 포함)

---

## 5. DB 구조 변천

### 5.1 user 테이블 진화

```sql
-- ═══════════════════════════════════════════════
-- Phase 1: 현행 (단독 인증)
-- ═══════════════════════════════════════════════
CREATE TABLE `user` (
    user_no         BIGINT NOT NULL AUTO_INCREMENT,
    sp_user_id      VARCHAR(64) NULL,            -- 미리 추가해둠 (NULL)
    email           VARCHAR(100) NOT NULL,        -- ● 개인정보
    password        VARCHAR(255) NOT NULL,        -- ● 개인정보
    nickname        VARCHAR(50) NOT NULL,         -- ● 개인정보
    gender          VARCHAR(10) NULL,             -- ● 개인정보
    role_code       VARCHAR(20) NOT NULL,         -- ○ 서비스 데이터
    tc_id           VARCHAR(64) NULL,             -- ○ 서비스 데이터
    stdt_id         VARCHAR(64) NULL,             -- ○ 서비스 데이터
    status          VARCHAR(20) NOT NULL,         -- ○ 서비스 데이터
    last_login_at   DATETIME NULL,
    created_by      BIGINT NOT NULL DEFAULT 0,
    updated_by      BIGINT NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_no),
    UNIQUE KEY uk_user_email (email),
    UNIQUE KEY uk_user_sp_user_id (sp_user_id)
);

-- ═══════════════════════════════════════════════
-- Phase 2: SSO 전환 (개인정보 아직 유지)
-- ═══════════════════════════════════════════════
ALTER TABLE `user`
  ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL'
    COMMENT 'LOCAL / SSO' AFTER sp_user_id;

ALTER TABLE `user`
  MODIFY COLUMN password VARCHAR(255) NULL
    COMMENT 'SSO 회원은 NULL';

-- ═══════════════════════════════════════════════
-- Phase 3: 개인정보 제거 (ISMS 대응 완료)
-- ═══════════════════════════════════════════════
ALTER TABLE `user`
  DROP INDEX uk_user_email,
  DROP COLUMN email,
  DROP COLUMN password,
  DROP COLUMN nickname,
  DROP COLUMN gender;

-- Phase 3 최종 user 테이블
-- user_no, sp_user_id, auth_provider, role_code, tc_id, stdt_id, status, ...
-- 개인정보 컬럼 0개
```

### 5.2 group_member 테이블 진화

```sql
-- Phase 1~2: 현행 유지
-- nickname, gender, email 컬럼 존재

-- Phase 3: 비정규화 개인정보 제거
ALTER TABLE group_member
  DROP COLUMN nickname,
  DROP COLUMN gender,
  DROP COLUMN email;
-- 조회 시: user_no → user.sp_user_id → Auth API
```

### 5.3 기타 테이블

```sql
-- Phase 3
ALTER TABLE counseling_student DROP COLUMN stdt_name;
ALTER TABLE group_invitation DROP COLUMN email;
  -- email 대신 invited_user_no 또는 invited_sp_user_id 사용
ALTER TABLE guest_conversion_log DROP COLUMN guest_email;
DROP TABLE IF EXISTS email_verification;
```

---

## 6. 개인정보 조회 아키텍처

### 6.1 PersonalInfoResolver 설계

```java
@Component
public class PersonalInfoResolver {

    private final AuthApiClient authApiClient;
    private final Cache<String, PersonalInfo> cache; // Caffeine

    /** 단건 조회 */
    public PersonalInfo resolve(String spUserId) {
        if (spUserId == null) return PersonalInfo.UNKNOWN;
        return cache.get(spUserId, key -> authApiClient.getUser(key));
    }

    /** 배치 조회 (최대 100건) */
    public Map<String, PersonalInfo> resolveBatch(List<String> spUserIds) {
        // 1. 캐시에서 hit 분리
        Map<String, PersonalInfo> result = new HashMap<>();
        List<String> misses = new ArrayList<>();

        for (String id : spUserIds) {
            PersonalInfo cached = cache.getIfPresent(id);
            if (cached != null) result.put(id, cached);
            else misses.add(id);
        }

        // 2. miss만 Auth API 배치 호출
        if (!misses.isEmpty()) {
            Map<String, PersonalInfo> fetched = authApiClient.batchGetUsers(misses);
            fetched.forEach((k, v) -> {
                cache.put(k, v);
                result.put(k, v);
            });
        }

        return result;
    }

    /** Auth 서버 장애 시 fallback */
    // - 캐시에 있으면 만료되었더라도 반환 (stale cache)
    // - 완전히 없으면 PersonalInfo.UNKNOWN (이름: "---", 이메일: "---")
}
```

### 6.2 PersonalInfo VO

```java
public record PersonalInfo(
    String spUserId,
    String email,
    String name,
    String gender,
    String userType
) {
    public static final PersonalInfo UNKNOWN = new PersonalInfo(null, "---", "---", null, null);
}
```

### 6.3 캐시 설정

```java
@Configuration
public class CacheConfig {
    @Bean
    public Cache<String, PersonalInfo> personalInfoCache() {
        return Caffeine.newBuilder()
            .maximumSize(10_000)        // 최대 1만 건
            .expireAfterWrite(5, TimeUnit.MINUTES)  // TTL 5분
            .build();
    }
}
```

**ISMS 소명**: 캐시는 "저장"이 아니라 "API 성능 최적화를 위한 일시적 메모리 보유"이며, 5분 후 자동 소멸하고 디스크/DB에 기록되지 않는다. 서버 재시작 시 즉시 소멸.

### 6.4 시나리오별 호출 패턴

| 시나리오 | 현행 | Phase 3 |
|---------|------|---------|
| 교사 대시보드 (학생 30명 목록) | DB JOIN 1회 | DB 조회 + Auth 배치 API 1회 (캐시 miss 시) |
| 진단 보고서 (학생 1명 분석) | DB SELECT | DB 조회 + Auth API 1회 (캐시 hit 시 0회) |
| 관리자 회원 검색 (email LIKE) | DB WHERE | **Auth 검색 API 필요** (아래 Q2 참조) |
| 로그인 응답 (사용자 프로필) | DB SELECT | JWT Claims에서 추출 (API 호출 불필요) |
| 상담 기록 조회 (학생 이름 표시) | DB SELECT (stdt_name) | stdt_id → user.sp_user_id → Auth API |

---

## 7. Auth 서버 연동 상세

### 7.1 학심정이 호출하는 Auth 서버 API 전체 목록

| API | 용도 | Phase |
|-----|------|-------|
| **`POST /oauth2/token`** | code → 토큰 교환 (프록시) | 2 |
| **`POST /api/v1/auth/refresh`** | RT → 새 AT/RT (프록시) | 2 |
| **`POST /api/v1/auth/logout`** | RT 무효화 (프록시) | 2 |
| **`POST /oauth2/guest-token`** | 게스트 JWT 발급 (프록시) | 2 |
| **`GET /api/v1/users/{id}`** | 단건 사용자 정보 조회 | 3 |
| **`POST /api/v1/users/batch`** | 배치 사용자 정보 조회 (최대 100건) | 3 |
| **`PUT /api/v1/users/me`** | 사용자 프로필 수정 | 3 |
| **`PUT /api/v1/teachers/me/profile`** | 교사 프로필 수정 | 3 |
| `GET /api/v1/users/me` | 현재 사용자 프로필 (선택) | 3 |
| `POST /oauth2/touch` | SSO 세션 연장 (SDK가 호출) | 2 |

### 7.2 학심정 서비스별 추가 수집 정보의 Auth 저장 위치

| 학심정 수집 정보 | Auth 서버 저장 위치 | 비고 |
|-----------------|-------------------|------|
| 성별 | `PlatformUser.gender` | 이미 존재 |
| 이름(실명) | `PlatformUser.name` | 이미 존재 |
| 학교명 | `TeacherProfile.schoolName` | 교사만 해당 |
| 학교코드 | `TeacherProfile.schoolCode` | 교사만 해당 |
| 학교급 (초등/중등) | `TeacherProfile.extra_data` JSON | Auth 팀 협의 필요 |
| 학년 | **미정** | 학생 프로필 엔티티 필요 → Q1 |
| 반 | **미정** | 학생 프로필 엔티티 필요 → Q1 |
| 번호 | **미정** | 학생 프로필 엔티티 필요 → Q1 |
| 지역 | `TeacherProfile.extra_data` JSON 또는 `schoolInfo` 연동 | Auth 팀 협의 필요 |

### 7.3 게스트 개인정보 처리

게스트는 Auth 서버에 **정식 계정이 없다**. Auth 서버가 게스트 토큰을 발급하지만, JWT Claims에 `name`만 포함되고 서버 측에 게스트 프로필을 저장하지 않는다.

```json
// 게스트 JWT Claims
{ "sub": "guest_xxx", "name": "김철수", "userType": "GUEST", "roles": [] }
```

**문제**: 게스트의 `nickname`, `gender`, `email`을 어디에 저장하나?

| 선택지 | 설명 | ISMS 영향 |
|--------|------|----------|
| **(a)** Auth 서버에 게스트 프로필 저장 기능 추가 요청 | Auth 팀 작업 필요 | ISMS 대응 완벽 |
| **(b)** 게스트 개인정보는 학심정 DB에 예외 저장 | 학심정 group_member에 게스트만 nickname/email 유지 | ISMS 예외 소명 필요 |
| **(c)** 게스트 토큰 JWT Claims에만 보관 | name만 JWT에 포함, 2시간 후 소멸 | 이름 조회 불가 (토큰 만료 후) |
| **(d)** 게스트 참여 시 반드시 회원가입 유도 | 게스트 기능 사실상 폐기 | UX 영향 큼 |

**권장: (b)안** — 게스트는 비회원이므로 "회원 개인정보"와 분리하여 소명 가능. 현실적 대안.

### 7.4 Admin 영역 처리

Admin은 **세션 기반 별도 인증**이며 SSO 대상이 아니다. 하지만 개인정보 표시 부분은 영향을 받는다.

| Admin 기능 | 현행 | Phase 3 |
|-----------|------|---------|
| 관리자 로그인 | 세션 (email/password) | **유지** — Admin 전용 계정은 Auth 미이관 |
| 회원 목록 | DB 직접 조회 | PersonalInfoResolver 배치 조회 |
| 회원 검색 | DB `WHERE email LIKE` | **Auth 검색 API 필요** (Q2) |
| 그룹 상세 (방장 이름) | DB JOIN | PersonalInfoResolver 단건 조회 |

**Admin 계정 자체의 처리**: Admin은 학심정 내부 관리자로, SSO 대상이 아닐 가능성이 높다. Admin 계정의 email/password는 학심정 DB에 유지하되, 일반 회원의 개인정보만 Auth로 이관하는 것이 현실적이다.

---

## 8. 영향받는 코드 전수 목록

### 8.1 백엔드 — Phase 2에서 수정

| 파일 | 변경 유형 | 작업 내용 |
|------|----------|----------|
| `AuthProxyController.java` | **신규** | Auth 프록시 4개 엔드포인트 |
| `AuthServerProperties.java` | **신규** | Auth 서버 연결 설정 |
| `SpJwtClaimFilter.java` | **신규** | SP JWT 파싱 필터 |
| `SpJwtClaimExtractor.java` | **신규** | JWT payload 디코딩 유틸 |
| `SsoUserMappingService.java` | **신규** | SP ↔ 학심정 사용자 매핑 |
| `SecurityConfig.java` | **수정** | SSO URL 허용 + 필터 추가 |
| `JwtAuthenticationFilter.java` | **수정** | SP JWT 분기 (iss 체크) |
| `application.yml` | **수정** | Auth 서버 환경변수 |
| `UserMapper.xml` | **수정** | sp_user_id 매핑 쿼리 추가 |

### 8.2 프론트엔드 — Phase 2에서 수정

| 파일 | 변경 유형 | 작업 내용 |
|------|----------|----------|
| `index.html` | **수정** | SDK CDN 스크립트 추가 |
| `shared/lib/authClient.ts` | **신규** | SDK 타입 + 초기화 |
| `shared/hooks/useSpAuth.ts` | **신규** | SDK React 훅 |
| `main.tsx` | **수정** | SDK 부트스트랩 |
| `AuthContext.tsx` | **수정** | SDK 기반 전면 교체 |
| `client.ts` | **수정** | Silent Refresh 제거 → SDK |
| `LoginPage.tsx` | **수정** | SSO 로그인 버튼 |
| `routes.tsx` | **수정** | /auth/callback 추가 |
| `.env.*` | **수정** | SP 환경변수 |

### 8.3 백엔드 — Phase 3에서 수정

| 파일 | 변경 유형 | 작업 내용 |
|------|----------|----------|
| `PersonalInfoResolver.java` | **신규** | Auth API 기반 개인정보 조회 + 캐시 |
| `PersonalInfo.java` | **신규** | 개인정보 VO |
| `AuthApiClient.java` | **신규** | Auth 서버 REST 클라이언트 |
| `CacheConfig.java` | **신규** | Caffeine 캐시 설정 |
| `UserMapper.xml` | **수정** | email/nickname/gender SELECT 제거 (8쿼리) |
| `GroupMemberMapper.xml` | **수정** | nickname/gender/email 제거 (5쿼리) |
| `GroupQueryMapper.xml` | **수정** | 비정규화 JOIN 제거 (8쿼리) |
| `DgnssMapper.xml` | **수정** | MEM_NM/MEM_GENDER 제거 (6+쿼리) |
| `CounselingStudentMapper.xml` | **수정** | stdt_name 제거 (2쿼리) |
| `GroupInvitationMapper.xml` | **수정** | email 제거 (2쿼리) |
| `GuestConversionLogMapper.xml` | **수정** | guest_email 제거 (1쿼리) |
| `User.java` | **수정** | email/password/nickname/gender 필드 제거 |
| `GroupMember.java` | **수정** | nickname/gender/email 필드 제거 |
| `CounselingStudent.java` | **수정** | stdtName 필드 제거 |
| `MemberService.java` | **수정** | 프로필 응답 → PersonalInfoResolver |
| `GroupService.java` | **수정** | 비정규화 복사 제거, 조회 시 PersonalInfoResolver |
| `CounselingService.java` | **수정** | stdt_name 스냅샷 제거 |
| `AdminUserService.java` | **수정** | 회원 목록/검색 → Auth API |
| `GuestAuthService.java` | **수정** | 게스트 개인정보 처리 변경 |
| `GuestService.java` | **수정** | gender 동기화 제거 |
| `GroupInvitationService.java` | **수정** | email 저장 방식 변경 |
| `AdminUserDetailsService.java` | **검토** | Admin 인증 별도 처리 |
| 관련 DTO/Response 클래스 | **수정** | 개인정보 필드 → PersonalInfoResolver에서 채우기 |

### 8.4 프론트엔드 — Phase 3에서 수정

| 파일 | 변경 유형 | 작업 내용 |
|------|----------|----------|
| `SignUpPage.tsx` | **제거** | Auth 서버에서 가입 처리 |
| `ForgotPasswordPage.tsx` | **제거** | Auth 서버에서 비밀번호 재설정 |
| `shared/types/index.ts` | **수정** | User 타입에 spUserId 추가 |
| 추가 정보 입력 UI | **신규 또는 수정** | Auth 프로필 완성 API 호출 |

> **핵심**: 백엔드가 기존과 동일한 응답 형식(name, email, gender 포함)을 유지하면, 대부분의 프론트엔드 컴포넌트는 **수정 불필요**. 데이터 소스만 DB → Auth API로 바뀔 뿐 응답 DTO는 동일.

### 8.5 DDL — Phase 3에서 실행

```sql
-- 1. user 테이블 개인정보 제거
ALTER TABLE `user`
  DROP INDEX uk_user_email,
  DROP COLUMN email,
  DROP COLUMN password,
  DROP COLUMN nickname,
  DROP COLUMN gender;

-- 2. group_member 비정규화 제거
ALTER TABLE group_member
  DROP COLUMN nickname,
  DROP COLUMN gender,
  DROP COLUMN email;

-- 3. counseling_student 이름 스냅샷 제거
ALTER TABLE counseling_student
  DROP COLUMN stdt_name;

-- 4. group_invitation email 제거 (대체 설계 적용 후)
ALTER TABLE group_invitation
  DROP COLUMN email;

-- 5. guest_conversion_log email 제거
ALTER TABLE guest_conversion_log
  DROP COLUMN guest_email;

-- 6. email_verification 테이블 폐기
DROP TABLE IF EXISTS email_verification;
```

---

## 9. Auth 팀 협의 필요 사항

| # | 질문 | 긴급도 | Phase |
|---|------|--------|-------|
| **Q1** | 학생 프로필 엔티티가 필요함. 현재 Auth 서버에 TeacherProfile은 있지만 StudentProfile은 없음. 학심정 학생의 학교급/학년/반/번호를 어디에 저장하는지? extra_data JSON? 별도 엔티티? | **높음** | 3 |
| **Q2** | 관리자 화면에서 회원을 이메일/이름으로 검색해야 함. Auth 서버에 **검색 API** (`GET /users?email=keyword&name=keyword`)가 있는지, 없다면 추가 가능한지? | **높음** | 3 |
| **Q3** | 게스트(비회원)의 닉네임/이메일을 Auth 서버에서 관리할 수 있는지? 게스트 프로필 저장 기능 존재 여부 | **중간** | 3 |
| **Q4** | 배치 조회 API (`POST /users/batch`)의 최대 건수가 100건인데, 학급 규모가 100명을 넘는 경우는 없지만 관리자 회원 목록(페이징)에서 한 번에 50~100건 요청이 가능한지 확인 | **낮음** | 3 |
| **Q5** | Auth 서버의 SLA(가용성 보장 수준)는 어느 정도인지? 학심정에서 개인정보 조회가 Auth 의존이 되므로 장애 시 영향 범위가 큼 | **중간** | 3 |
| **Q6** | 사용자 프로필 변경 시 Webhook/이벤트 알림이 있는지? (캐시 무효화 트리거용) | **낮음** | 3 |
| **Q7** | client_id / client_secret 발급 요청 (Phase 2 전제조건) | **높음** | 2 |
| **Q8** | Auth 서버 CORS에 학심정 도메인 등록 요청 | **높음** | 2 |

---

## 10. 리스크 및 대응

### 10.1 Phase별 리스크

| Phase | 리스크 | 영향도 | 대응 |
|-------|--------|-------|------|
| 1 | 없음 (현행 유지) | - | - |
| 2 | Auth 서버 장애 시 로그인 불가 | High | 전환기에 자체 로그인 fallback 유지 |
| 2 | 기존 회원의 SSO 전환 거부/혼란 | Medium | 전환 안내 UI + 자체 로그인 병행 |
| 3 | Auth 서버 장애 시 이름 표시 불가 | **Critical** | Caffeine 캐시 (5분) + stale cache fallback |
| 3 | Auth 배치 API 성능 병목 | High | 캐시 적극 활용, 프리페치 전략 |
| 3 | 학생 프로필 엔티티 미존재 (Auth 서버) | High | Auth 팀에 StudentProfile 추가 요청 (Q1) |
| 3 | Admin 회원 검색 불가 (Auth 검색 API 미존재 시) | High | Auth 팀에 검색 API 추가 요청 (Q2) |
| 3 | 기존 이력 데이터(상담 기록 내 학생 이름) 처리 | Medium | 정책 결정 필요: 유지/마스킹/삭제 |
| 3 | 개발 기간 증가 (Phase 2 대비 +4~5주) | High | Phase 분리로 리스크 분산 |

### 10.2 Auth 서버 장애 대응 전략 (Phase 3)

```
Auth 서버 상태 확인
  │
  ├─ 정상 → Auth API 호출 → 캐시 저장 → 응답
  │
  └─ 장애 (타임아웃/5xx)
       │
       ├─ 캐시에 있음 (만료되었더라도) → stale cache 반환
       │   (이름이 표시되지만 최신이 아닐 수 있음)
       │
       └─ 캐시에 없음 → PersonalInfo.UNKNOWN 반환
           (이름: "---", 이메일: "---")
           (화면에 "사용자 정보를 불러올 수 없습니다" 표시)
```

### 10.3 일정 요약

| Phase | 전제 조건 | 예상 기간 | 누적 |
|-------|----------|----------|------|
| Phase 1 | 없음 | 0 (현행) | - |
| Phase 2 | client_id/secret + CORS | 2~3주 | 2~3주 |
| Phase 3 | Phase 2 안정화 + Auth 팀 Q1~Q2 해결 | 4~5주 | 6~8주 |

---

**문서 끝**

> Phase 1 → 2 → 3 순서로 진행하며, 각 Phase 사이에 안정화 기간을 두는 것을 권장합니다.  
> Phase 2는 Auth 팀의 client_id/secret 발급이 전제 조건이며,  
> Phase 3는 Auth 팀의 학생 프로필 엔티티(Q1)와 검색 API(Q2) 지원이 전제 조건입니다.
