# 개인정보 관리 정책 케이스별 대응 분석서

> 슈퍼플랫폼 통합 인증 전환 시, 개인정보를 어디에서 관리하느냐에 따른 학심정 서비스 영향도 분석

**작성일**: 2026-04-16  
**대상 시스템**: meta-dashboard (학심정)  
**배경**: 통합 플랫폼 회원 체계 정리에 따라 개인정보 관리 주체에 대한 3가지 정책 케이스가 논의 중

---

## 목차

1. [정책 케이스 정의](#1-정책-케이스-정의)
2. [현행 개인정보 저장 현황 (전수 조사)](#2-현행-개인정보-저장-현황)
3. [케이스 A: 인증 정보만 Auth 위임](#3-케이스-a-인증-정보만-auth-위임)
4. [케이스 B: 모든 개인정보 Auth 일괄 관리](#4-케이스-b-모든-개인정보-auth-일괄-관리)
5. [케이스 C: Auth 마스터 + 서비스 동기화 사본 허용](#5-케이스-c-auth-마스터--서비스-동기화-사본-허용)
6. [케이스 비교 요약](#6-케이스-비교-요약)
7. [기획 측 확인 필요 사항](#7-기획-측-확인-필요-사항)

---

## 1. 정책 케이스 정의

| 케이스 | 설명 | Auth 서버 관리 범위 | 서비스 DB 저장 범위 |
|--------|------|-------------------|-------------------|
| **A** | 인증 정보만 Auth 위임 | email, 비밀번호, 소셜 연동 | email, 이름, 성별 등 개인정보 유지 |
| **B** | 모든 개인정보 Auth 일괄 관리 | email, 비밀번호, 이름, 성별 등 전체 | sp_user_id (참조키) + 서비스 전용 데이터만 |
| **C** | Auth 마스터 + 서비스 동기화 사본 | Auth가 원본(마스터) 관리 | 캐시/사본으로 개인정보 보관 (주기적 동기화) |

---

## 2. 현행 개인정보 저장 현황

### 2.1 개인정보가 저장된 테이블 (6개 테이블, 15개 컬럼)

| 테이블 | 개인정보 컬럼 | 저장 방식 | 참조 빈도 |
|--------|-------------|----------|----------|
| **`user`** | `email`, `nickname`, `gender` | 원본 | 매우 높음 |
| **`group_member`** | `nickname`, `gender`, `email` | user에서 복사 (비정규화) | 매우 높음 |
| **`counseling_student`** | `stdt_name` | 상담 생성 시 스냅샷 | 중간 |
| **`group_invitation`** | `email` | 초대 대상 이메일 | 중간 |
| **`guest_conversion_log`** | `guest_email` | 전환 이력 감사 로그 | 낮음 |
| **`email_verification`** | `email` | 인증코드 임시 저장 | 낮음 (SSO 후 폐기) |

### 2.2 개인정보를 조회하는 백엔드 쿼리 (7개 Mapper, 30+ 쿼리)

| Mapper XML | 영향 쿼리 수 | 주요 사용처 |
|------------|------------|------------|
| `UserMapper.xml` | 8개 | 로그인 응답, 프로필 조회, 관리자 회원 검색 |
| `GroupMemberMapper.xml` | 5개 | 그룹 멤버 조회, 생성, 수정 |
| `GroupQueryMapper.xml` | 8개 | 그룹 상세, 멤버 목록, 관리자 그룹 검색 |
| `DgnssMapper.xml` | 6개+ | 진단 학생 목록, 보고서 (nickname AS MEM_NM) |
| `CounselingStudentMapper.xml` | 2개 | 상담 학생 매핑 (stdt_name) |
| `GroupInvitationMapper.xml` | 2개 | 초대 이메일 저장/조회 |
| `GuestConversionLogMapper.xml` | 1개 | 게스트 전환 이력 |

### 2.3 개인정보를 사용하는 백엔드 서비스 (8개 클래스)

| 서비스 클래스 | 사용 내용 |
|-------------|----------|
| `MemberService` | 로그인/프로필 응답에 email, nickname, gender 포함 |
| `GroupService` | 그룹 참가 시 user → group_member로 nickname/gender/email 복사 |
| `CounselingService` | 상담 생성 시 stdt_name 스냅샷 저장 |
| `AdminUserService` | 관리자 회원 목록에 email, nickname 표시 및 검색 |
| `GuestAuthService` | 게스트 인증 응답에 email 포함 |
| `GuestService` | 게스트→회원 전환 시 gender 동기화 |
| `GroupInvitationService` | 초대 이메일 저장/발송 |
| `AdminUserDetailsService` | Admin 로그인 시 email을 username으로 사용 |

### 2.4 개인정보를 표시하는 프론트엔드 (15개+ 파일)

| 영역 | 파일 수 | 사용 내용 |
|------|--------|----------|
| 타입 정의 (User, GroupMember 등) | 3개 | email, name, gender 필드 정의 |
| 로그인/회원가입 페이지 | 3개 | email, nickname, gender 입력/표시 |
| 그룹 관리 (멤버 목록, 상세, 검색) | 4개+ | 멤버 이름/이메일 표시, 이메일 검색 |
| 검사/진단 (학생 목록, 보고서) | 4개+ | nickname을 MEM_NM으로 표시 |
| 게스트 플로우 | 3개+ | 게스트 닉네임/이메일 입력/표시 |
| 대시보드 서비스 | 2개 | 학생 이름 표시 (stdtNm, nickname) |

---

## 3. 케이스 A: 인증 정보만 Auth 위임

### 3.1 개요

Auth 서버가 **인증 행위(로그인 검증, 비밀번호 관리, 소셜 연동)**만 담당하고, 이름/성별 등 개인정보는 학심정 DB에서 계속 관리한다.

### 3.2 학심정 DB 변경

```sql
ALTER TABLE `user`
  ADD COLUMN sp_user_id VARCHAR(64) NULL COMMENT '슈퍼플랫폼 사용자 ID',
  ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
  ADD UNIQUE KEY uk_user_sp_user_id (sp_user_id);

ALTER TABLE `user`
  MODIFY COLUMN password VARCHAR(255) NULL COMMENT '비밀번호 (SSO 회원은 NULL)';
```

- email, nickname, gender 컬럼 **유지**
- group_member, counseling_student 등 비정규화 컬럼 **유지**
- password만 SSO 회원은 NULL 허용

### 3.3 백엔드 변경 범위

| 대상 | 변경 내용 |
|------|----------|
| 신규: AuthProxyController (4개 엔드포인트) | Auth 서버 프록시 |
| 신규: SpJwtClaimFilter | SP JWT 파싱 |
| 신규: SsoUserMappingService | SP ↔ 학심정 사용자 매핑 |
| 수정: SecurityConfig | SSO URL 허용, 필터 추가 |
| 수정: JwtAuthenticationFilter | SP JWT 형식 분기 |
| 수정: application.yml | Auth 서버 환경변수 |

기존 서비스 로직(GroupService, CounselingService 등) **수정 불필요**.

### 3.4 프론트엔드 변경 범위

| 대상 | 변경 내용 |
|------|----------|
| index.html | SDK CDN 스크립트 추가 |
| main.tsx | SDK init + handleRedirectResult 부트스트랩 |
| AuthContext.tsx | SDK 기반 전면 교체 |
| client.ts | 자체 Silent Refresh 제거 → SDK 위임 |
| LoginPage.tsx | SSO 로그인 버튼 추가 |
| routes.tsx | /auth/callback 라우트 추가 |

그룹/상담/진단 관련 컴포넌트 **수정 불필요**.

### 3.5 장단점

| 장점 | 단점 |
|------|------|
| 변경 범위 최소 (인증 경로만) | 개인정보가 Auth + 학심정 양쪽에 중복 저장 |
| 기존 쿼리/서비스/화면 수정 없음 | 개인정보 유출 시 학심정 DB도 포함 |
| 예상 기간 **2~3주** | Auth와 학심정 간 이름/이메일 불일치 가능성 |
| Auth 서버 장애 시 개인정보 표시에 영향 없음 | 개인정보 삭제 요청(GDPR 등) 시 양쪽 모두 처리 필요 |

### 3.6 리스크

| 리스크 | 영향도 | 대응 |
|--------|-------|------|
| Auth 서버 장애 시 로그인 불가 | High | 전환기에 자체 로그인 fallback 유지 |
| Auth 쪽 이름 변경이 학심정에 반영 안 됨 | Low | 로그인 시 JWT Claims로 동기화 가능 |

---

## 4. 케이스 B: 모든 개인정보 Auth 일괄 관리

### 4.1 개요

Auth 서버가 email, 이름, 성별 등 **모든 개인정보의 유일한 저장소**가 된다. 학심정 DB에는 `sp_user_id`(참조키)와 서비스 전용 데이터(tc_id, stdt_id, role_code 등)만 저장한다.

### 4.2 학심정 DB 변경

```sql
-- user 테이블: 개인정보 컬럼 제거
ALTER TABLE `user`
  ADD COLUMN sp_user_id VARCHAR(64) NULL COMMENT '슈퍼플랫폼 사용자 ID',
  ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
  ADD UNIQUE KEY uk_user_sp_user_id (sp_user_id);

ALTER TABLE `user`
  DROP COLUMN email,
  DROP COLUMN password,
  DROP COLUMN nickname,
  DROP COLUMN gender;

-- group_member: 비정규화 개인정보 컬럼 제거
ALTER TABLE group_member
  DROP COLUMN nickname,
  DROP COLUMN gender,
  DROP COLUMN email;

-- counseling_student: 이름 스냅샷 제거
ALTER TABLE counseling_student
  DROP COLUMN stdt_name;

-- group_invitation: email 제거 (sp_user_id로 대체하거나 별도 설계)
ALTER TABLE group_invitation
  DROP COLUMN email;

-- guest_conversion_log: email 제거
ALTER TABLE guest_conversion_log
  DROP COLUMN guest_email;
```

### 4.3 백엔드 변경 범위

**케이스 A의 모든 작업 +** 아래 추가 작업:

| 대상 | 변경 내용 |
|------|----------|
| **신규: PersonInfoClient** | Auth 서버 사용자 정보 조회 API 클라이언트 |
| **신규: PersonInfoCacheService** (캐시 불허 시 불필요) | 개인정보 조회 캐싱 레이어 |
| 수정: `UserMapper.xml` (8개 쿼리) | email/nickname/gender SELECT 전부 제거 |
| 수정: `GroupMemberMapper.xml` (5개 쿼리) | nickname/gender/email 컬럼 관련 전면 수정 |
| 수정: `GroupQueryMapper.xml` (8개 쿼리) | JOIN으로 가져오던 nickname 등 제거, sp_user_id만 반환 |
| 수정: `DgnssMapper.xml` (6개+ 쿼리) | gm.nickname AS MEM_NM 등 전면 수정 |
| 수정: `CounselingStudentMapper.xml` (2개 쿼리) | stdt_name INSERT/SELECT 제거 |
| 수정: `GroupInvitationMapper.xml` (2개 쿼리) | email 저장/조회 방식 변경 |
| 수정: `GuestConversionLogMapper.xml` (1개 쿼리) | guest_email 제거 |
| 수정: `MemberService` | 로그인/프로필 응답 → Auth API에서 가져오기 |
| 수정: `GroupService` | 비정규화 복사 로직 전면 제거 |
| 수정: `CounselingService` | stdt_name 스냅샷 저장 제거 |
| 수정: `AdminUserService` | 회원 목록/검색 → Auth API 검색으로 전환 |
| 수정: `GuestAuthService` | 게스트 개인정보 처리 재설계 |
| 수정: `GuestService` | gender 동기화 로직 제거 |
| 수정: `GroupInvitationService` | 초대 방식 재설계 |
| 수정: `AdminUserDetailsService` | Admin 인증 방식 재검토 |
| 수정: 관련 Domain 엔티티 전부 | User, GroupMember, CounselingStudent 등 필드 제거 |
| 수정: 관련 DTO/응답 객체 전부 | 개인정보 필드 제거 후 API 호출로 교체 |

### 4.4 프론트엔드 변경 범위

**케이스 A의 모든 작업 +** 아래 추가 작업:

| 대상 | 변경 내용 |
|------|----------|
| `shared/types/index.ts` | User, GroupMember, GuestJoinGroupInput 등 타입에서 email/name/gender 필드 소스 변경 |
| `SignUpPage.tsx` | 자체 가입 페이지 제거 (Auth 서버에서 처리) |
| `ForgotPasswordPage.tsx` | 제거 (Auth 서버에서 처리) |
| `GroupDetailPage.tsx` | 멤버 이름/이메일 표시 → sp_user_id 기반 Auth API 조회 |
| `groupService.ts` | nickname/gender/email 매핑 전면 수정 |
| `useApiData.ts` | 학생 이름 표시 로직 변경 |
| `dashboardService.ts` | stdtNm/nickname 참조 전면 수정 |
| `AssessmentList.tsx` | student.nickname 표시 변경 |
| `GuestExamEntryStep.tsx` | 게스트 닉네임 입력 처리 변경 |
| `StudentInfoStep.tsx` | gender 입력/표시 변경 |
| `GuestCompletePage.tsx` | user.email 표시 변경 |
| 개인정보 표시하는 기타 컴포넌트 | 전수 수정 |

### 4.5 아키텍처 추가 설계 필요 사항

#### 4.5.1 개인정보 조회 레이어

개인정보가 필요한 모든 곳에서 Auth API를 호출해야 한다. 성능을 위해 조회 레이어 설계가 필수.

```
학심정 BE 서비스 → PersonInfoClient → Auth 서버 /api/v1/users/{id}
                                    → Auth 서버 /api/v1/users?ids=a,b,c (배치)
```

**성능 우려 시나리오:**

| 시나리오 | 현행 | B안 |
|---------|------|-----|
| 교사가 학급 학생 30명 목록 조회 | DB JOIN 1회 (0.1ms) | Auth API 1회 (배치) 또는 30회 (개별) |
| 진단 보고서 생성 (학생별 분석) | DB SELECT (0.1ms) | Auth API 호출 (50~200ms) |
| 관리자 회원 검색 (email 기준) | `WHERE email LIKE '%keyword%'` | Auth 검색 API 필요 (Auth 서버가 지원해야 함) |

#### 4.5.2 Auth 서버 장애 시 영향

| 상황 | 현행 | B안 |
|------|------|-----|
| Auth 서버 다운 + 이미 로그인된 사용자 | 정상 동작 | **이름/이메일 표시 불가** (대시보드 빈 칸) |
| Auth 서버 다운 + 신규 접근 | 자체 로그인 가능 (A안 전환기) | 로그인 불가 + 개인정보 조회 불가 |

#### 4.5.3 이력성 데이터 처리

| 데이터 | 현재 상태 | 처리 방안 |
|--------|---------|----------|
| `counseling_student.stdt_name` | "김철수" 같은 실명 저장 | (a) 삭제/마스킹 (b) 기존 이력은 유지, 신규만 ID 참조 (c) 별도 정책 |
| `guest_conversion_log.guest_email` | 게스트 이메일 감사 로그 | (a) 삭제 (b) 기존 유지 |
| 상담 기록 내 학생 이름 참조 | stdt_name으로 직접 표시 | stdt_id → Auth API 조회로 변경 |

#### 4.5.4 게스트(비회원) 개인정보

게스트는 Auth 서버에 **계정이 없는** 사용자이다. 현재 `group_member` 테이블에 게스트의 nickname, gender, email을 저장하고 있음.

| 선택지 | 설명 |
|--------|------|
| Auth 서버에 게스트 프로필 저장 | Auth 서버가 게스트 정보까지 관리 → Auth 서버 변경 필요 |
| 게스트만 예외적으로 서비스 DB 저장 | B안의 예외 규정 → 정책 명확화 필요 |
| 게스트 토큰 JWT Claims에만 보관 | 토큰 만료(2시간) 후 이름 조회 불가 |

#### 4.5.5 Admin 영역 영향

현재 Admin(관리자 화면)에서 수행하는 작업 중 개인정보 의존 항목:

| Admin 기능 | 현행 | B안 |
|-----------|------|-----|
| 회원 목록 (email/이름 표시) | DB 직접 조회 | Auth API 호출 |
| 회원 검색 (email LIKE 검색) | DB WHERE 절 | Auth 검색 API 필요 |
| 그룹 상세 (방장 이름/이메일) | DB JOIN | Auth API 호출 |
| 그룹 멤버 목록 (이름/이메일) | DB 직접 조회 | Auth API 호출 |

Admin은 세션 기반 별도 인증이므로 SSO 대상이 아니지만, **개인정보 표시 부분은 동일하게 영향**을 받는다.

### 4.6 장단점

| 장점 | 단점 |
|------|------|
| 개인정보 단일 저장소 → 유출 리스크 최소화 | 변경 범위 매우 넓음 (30+ 쿼리, 8 서비스, 15+ 컴포넌트) |
| 개인정보 삭제 요청 시 Auth만 처리하면 됨 | Auth API 의존으로 성능 저하 (네트워크 latency) |
| 데이터 일관성 보장 (원본 1곳) | Auth 서버 장애 시 이름 표시 불가 |
| 개인정보 보호법 컴플라이언스에 유리 | 배치 조회 API 등 Auth 서버 측 추가 기능 필요 |
| | 이력성 데이터 처리 정책 복잡 |
| | 게스트 개인정보 처리 방안 별도 설계 필요 |
| | 예상 기간 **6~8주+** (A안 대비 3~4배) |

### 4.7 리스크

| 리스크 | 영향도 | 대응 |
|--------|-------|------|
| Auth 서버 장애 시 학심정 전체 기능 마비 (로그인 + 이름 표시 모두 불가) | **Critical** | 로컬 캐시 fallback 필수 → 그러면 결국 C안에 가까워짐 |
| Auth 서버에 배치 조회 API가 없는 경우 성능 병목 | **High** | Auth 팀에 API 추가 요청 또는 개별 호출 + 캐시 |
| 기존 이력 데이터(상담 기록 등)의 이름 처리 합의 지연 | **High** | 이력 데이터는 별도 마이그레이션 단계로 분리 |
| 게스트 개인정보 처리 방안 미결 | **Medium** | 게스트는 예외 허용하는 방향으로 협의 |
| 개발 기간 증가로 오픈 일정 지연 | **High** | 단계적 적용 (Phase 분리) |

---

## 5. 케이스 C: Auth 마스터 + 서비스 동기화 사본 허용

### 5.1 개요

Auth 서버가 개인정보의 **마스터(원본)**를 관리하되, 서비스 DB에 **동기화 사본(캐시)**을 저장하는 것을 허용한다. 사용자가 Auth에서 이름을 변경하면 서비스 DB에도 반영되는 구조.

### 5.2 학심정 DB 변경

```sql
-- user 테이블: sp_user_id 추가, 기존 컬럼 유지 (동기화 사본)
ALTER TABLE `user`
  ADD COLUMN sp_user_id VARCHAR(64) NULL COMMENT '슈퍼플랫폼 사용자 ID',
  ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
  ADD COLUMN synced_at DATETIME NULL COMMENT '개인정보 마지막 동기화 일시',
  ADD UNIQUE KEY uk_user_sp_user_id (sp_user_id);

ALTER TABLE `user`
  MODIFY COLUMN password VARCHAR(255) NULL;

-- email, nickname, gender 컬럼 유지 (Auth 마스터의 사본)
-- group_member의 nickname, gender, email도 유지
-- counseling_student의 stdt_name도 유지
```

### 5.3 동기화 전략

```
로그인 시점 동기화:
1. SSO 로그인 완료 → Auth JWT Claims에서 email, name 추출
2. 학심정 user 테이블의 email, nickname과 비교
3. 다르면 UPDATE + synced_at 갱신
4. group_member 등 비정규화 사본도 연쇄 업데이트 (선택)

백그라운드 동기화 (선택):
- 주기적으로 Auth API 호출 → 변경된 사용자 정보 동기화
- 또는 Auth 서버의 Webhook/이벤트 구독 (Auth 서버가 지원하는 경우)
```

### 5.4 백엔드 변경 범위

**케이스 A의 모든 작업 +** 아래 추가 작업:

| 대상 | 변경 내용 |
|------|----------|
| 신규: UserSyncService | 로그인 시 Auth → 학심정 개인정보 동기화 |
| 수정: SsoUserMappingService | 매핑 시 개인정보 동기화 포함 |
| 수정: User.java | synced_at 필드 추가 |

기존 쿼리/서비스/화면은 **대부분 수정 불필요** (DB에 사본이 있으므로).

### 5.5 장단점

| 장점 | 단점 |
|------|------|
| A안 수준의 적은 변경 범위 | 개인정보가 여전히 서비스 DB에 존재 (유출 리스크) |
| 기존 쿼리/서비스/화면 대부분 수정 불필요 | Auth와 서비스 DB 간 동기화 지연 가능 |
| Auth 서버 장애 시 캐시된 정보로 표시 가능 | 동기화 로직 추가 개발 필요 |
| 성능 이슈 없음 (DB 직접 조회) | 개인정보 삭제 요청 시 양쪽 처리 필요 |
| 예상 기간 **3~4주** | 데이터 정합성 관리 부담 (Auth 원본 ≠ 서비스 사본) |

### 5.6 리스크

| 리스크 | 영향도 | 대응 |
|--------|-------|------|
| 동기화 지연 시 Auth와 학심정 이름 불일치 | Low | 로그인 시 실시간 동기화로 최소화 |
| 개인정보 보호 관점에서 B안보다 약함 | Medium | 보안 심사 시 "캐시" 목적 소명 필요 |
| Auth 서버 장애 시 로그인 불가 (A안과 동일) | High | 전환기 자체 로그인 fallback |

---

## 6. 케이스 비교 요약

### 6.1 변경 규모 비교

| 항목 | A안 (인증만) | B안 (전체 위임) | C안 (마스터+사본) |
|------|------------|---------------|-----------------|
| DDL 변경 | user에 2컬럼 추가 | 6테이블 15컬럼 제거/변경 | user에 3컬럼 추가 |
| Mapper XML 수정 | 0개 | **7개 파일, 30+ 쿼리** | 0~1개 |
| Service 수정 | 2~3개 | **8개 클래스** | 3~4개 |
| Frontend 수정 | 6개 (인증 관련) | **15개+ 컴포넌트** | 6개 (인증 관련) |
| 신규 개발 | 프록시 4개 | 프록시 + **개인정보 조회 레이어 + 캐싱** | 프록시 + 동기화 서비스 |
| **예상 기간** | **2~3주** | **6~8주+** | **3~4주** |

### 6.2 품질 속성 비교

| 속성 | A안 | B안 | C안 |
|------|-----|-----|-----|
| 개인정보 보호 | △ (중복 저장) | ◎ (단일 저장소) | ○ (사본이지만 원본 관리 명확) |
| 성능 | ◎ (DB 직접) | △ (API 호출 필요) | ◎ (DB 직접) |
| 가용성 (Auth 장애 시) | ○ (이름 표시 가능) | × (이름 표시 불가) | ○ (캐시로 표시) |
| 데이터 일관성 | △ (수동 관리) | ◎ (원본 1곳) | ○ (동기화 필요) |
| 개발 복잡도 | ◎ (최소) | × (전면 재설계) | ○ (동기화 추가) |
| 유지보수 | ◎ | △ (Auth 의존) | ○ |

### 6.3 오픈 일정 영향

| 케이스 | 학심정 먼저 오픈 시 | 동시 오픈 시 |
|--------|-----------------|------------|
| A안 | 자체 인증 오픈 → 2~3주 후 SSO 전환 | 오픈 3주 전 Auth 서버 필요 |
| B안 | 자체 인증 오픈 → **6~8주+ 후** SSO 전환 | 오픈 **2개월 전** Auth 서버 필요 |
| C안 | 자체 인증 오픈 → 3~4주 후 SSO 전환 | 오픈 4주 전 Auth 서버 필요 |

---

## 7. 기획 측 확인 필요 사항

### 7.1 정책 결정 사항

| # | 질문 | A안 | B안 | C안 |
|---|------|-----|-----|-----|
| **P1** | 개인정보 관리 정책이 A/B/C 중 어디에 해당하는지 | - | - | - |
| **P2** | Auth 서버에 **배치 사용자 조회 API**가 있는지 (B안이면 필수) | 불필요 | **필수** | 불필요 |
| **P3** | 서비스 DB에 개인정보 **캐시**를 두는 것이 허용되는지 | 해당없음 | 불허면 B, 허용이면 C | 허용 전제 |
| **P4** | **게스트(비회원)** 개인정보는 누가 관리하는지 | 학심정 | **미결** | 학심정 |
| **P5** | 기존 **이력 데이터**(상담 기록 내 학생 이름 등) 처리 정책 | 유지 | **삭제/마스킹/유지 결정 필요** | 유지 |
| **P6** | **Admin 관리 화면** 회원 검색 방식 (B안이면 Auth API 검색 필요) | DB 검색 유지 | **Auth API 검색으로 전환** | DB 검색 유지 |
| **P7** | 정책 **적용 시점** — 오픈 시 즉시인지, 이후 단계적인지 | 즉시 가능 | 단계적 권장 | 즉시 가능 |

### 7.2 Auth 팀 확인 사항

| # | 질문 | 해당 케이스 |
|---|------|-----------|
| **A1** | 사용자 정보 배치 조회 API (`GET /users?ids=a,b,c`) 제공 여부 | B |
| **A2** | 사용자 정보 검색 API (`GET /users?email=keyword`) 제공 여부 | B |
| **A3** | 사용자 정보 변경 시 Webhook/이벤트 알림 제공 여부 | C |
| **A4** | 게스트 프로필 저장/조회 기능 제공 여부 | B |
| **A5** | Auth 서버 SLA (가용성 보장 수준) | B, C |

---

**문서 끝**
