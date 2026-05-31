# Meta API - Project Guide

## Overview
교사-학생 그룹 기반 학습 관리 플랫폼 API 서버.
학교/학급 관리, 그룹(방) 생성/참가, 상담 관리, 관찰 메모 등 교육 현장 기능 제공.

## Tech Stack
- **Java 21** + **Spring Boot 4.0.5** + **Gradle 8.14**
- **MyBatis Spring Boot Starter 4.0.1** + **MySQL 8.3.0**
- **Security**: API JWT Stateless (SuperPlatform SSO RS256 + JWKS) — Admin 영역 폐기됨
- **회원 정보 조회**: Auth Internal API (`/api/v1/users/{id}` · `/batch` · `/lookup`) + `UserInfoEnricher` 패턴
  - 학심정 DB 에 회원 PII(name/email/nickname/gender) **미저장** — Auth 가 단일 출처
  - `HasUserInfo` 구현 DTO 또는 `UserSlot` 으로 묶어서 `enricher.enrich(item|list)` 한 줄로 채움
  - `@RequestScope` `PersonInfoRequestCache` 가 요청 내 중복 호출 dedup, 100건 초과는 자동 chunking
- **Master/Slave DataSource** with `DynamicRoutingDataSource`
- **ShedLock 7.7.0** (분산 스케줄러 락) + **Redis Pub/Sub** (알림)
- **MapStruct 1.6.3** + **PDFBox 3.0.1** + **Apache POI 5.2.5** + **Neo4j Driver 5.28.5**
- **Port**: 8081

## Package Structure
```
com.vs.meta
├── admin/                      # Admin 전용 (session-based)
│   ├── controller/AdminController.java
│   ├── mapper/                 # RoleGroupMapper, AuthSchoolMapMapper
│   └── service/                # AdminUserService, AdminUserDetailsService
├── api/                        # REST API (JWT-based)
│   ├── counseling/             # 상담 관리
│   ├── group/                  # 그룹(방/학급) 관리
│   ├── member/                 # 회원 정보 조회 (SSO 가입은 Auth)
│   ├── memo/                   # 관찰 메모
│   └── school/                 # 학교 정보 관리
# 폐기된 영역: api/guest/, api/member/EmailVerification — Auth 단일 가입 + 게스트 폐기 (feature/user-info-from-idp)
├── common/
│   ├── aop/                    # ApiResponseAspect, TransactionAspect
│   ├── config/                 # Security, MyBatis, CORS, Swagger, DataSource
│   ├── exception/              # AuthFailedException, JwtExpiredException
│   ├── response/               # ResponseDTO, CustomBody, AidtCommonUtil
│   ├── security/JwtUtil.java
│   └── utils/                  # PageUtil, AuthTcIdResolver, SecurityUtil 등
└── domain/                     # Entity classes + enums
```

## Build & Run
```bash
./gradlew :backend:bootJar -x test  # Build
./gradlew :backend:bootRun          # Run (requires .env or env vars)
./gradlew :backend:compileJava      # Compile check only
./gradlew :backend:test             # Run tests
npm run backend                     # Run via Nx
```

## Key Conventions

### MyBatis XML
- **위치**: `src/main/resources/mapper/{도메인}/XxxMapper.xml`
  - `mapper/member/`, `mapper/group/`, `mapper/counseling/`, `mapper/memo/`, `mapper/school/`, `mapper/admin/`, `mapper/guest/`
- **Config**: `MyBatisConfig.java`에서 `classpath:mapper/**/*.xml`로 스캔 (application.yml이 아님)
- **resultMap** + Domain 객체 사용 (HashMap 사용 금지)
- **쿼리 주석**: `/* MapperName.methodName */` 형태로 모든 쿼리에 추가
- **쿼리 ID 네이밍**: `{action}{Entity}{Condition}` (예: `insertUser`, `findGroupInfoById`, `countActiveGroups`)
  - 조건이 이미 대상을 특정하는 경우 Entity 생략 가능 (예: `findByEmail`, `findByRoleCode`)
- **`@Param` 개별 바인딩**: PagingParam 같은 래퍼 없이 각 파라미터를 `@Param`으로 전달
- **별도 COUNT 쿼리**: 페이징 시 `COUNT(*)` 전용 select 별도 작성 (window function 미사용)
- **동적 SQL**: `<where>` + `<if>` 패턴
- **배치 처리**: 대량 INSERT/UPDATE는 `<foreach>`로 벌크 처리 (예: `upsertSchoolBatch`)
- **UPSERT**: `INSERT ... ON DUPLICATE KEY UPDATE` 패턴
- **잠금**: 동시성 제어 시 `FOR UPDATE` 사용

### Pagination
- `PageUtil` 유틸리티 사용 (직접 `(page-1)*size` 계산 금지)
  - `PageUtil.offset(page, size)` — 0-indexed page
  - `PageUtil.offsetOneIndexed(page, size)` — 1-indexed page (Admin)
  - `PageUtil.totalPages(total, size)`, `PageUtil.clampPage(page, totalPages)`, `PageUtil.of(page, size, total)`

### API Response
- 모든 API 응답은 `ResponseDTO<CustomBody>` 래핑
- `AidtCommonUtil.makeResultSuccess(null, data, message)` 사용

### Security
- **API** (`/member/**`, `/group/**`, `/api/**`): SuperPlatform SSO JWT Stateless (RS256 + JWKS) — `JwtAuthenticationFilter` 검증
- **로그인 식별자**: `sp_user_id` (Auth public_user_id) — 회원가입/로그인은 Auth 서버가 처리, 학심정은 sp_user_id 기준으로 user 행 매핑
- **PK**: `user_no` (BIGINT AUTO_INCREMENT) — 학심정 내부 식별자, 클라이언트에서 직접 전달하지 않음
- **JWT Claims**: SuperPlatform 표준 (`sub` = sp_user_id, `userType`, `roles` 등)
- **SecurityContext principal**: `SpAuthenticatedUser` → `SecurityUtil.requireCurrentUserNo()` 로 학심정 user_no 변환
- **Audit 컬럼**: `created_by`/`updated_by` BIGINT (0=시스템/배치)
- JWT에서 sp_user_id/tcId 추출: `AuthTcIdResolver` 사용

### Admin UI (Thymeleaf)
- AdminLTE 3.x CDN 기반
- `fragments.html`에 공통 요소: css, js, navbar, sidebar, pagination
- 모든 페이지는 `sidebar-mini` 레이아웃
- 페이징은 pagination fragment 재사용

### Database
- DB명: `viva_meta`
- Master/Slave DataSource: `RoutingDataSourceConfig` + `DynamicRoutingDataSource`
- `@Transactional(readOnly=true)` → Slave, 나머지 → Master

### Environment Variables
```
SPRING_PROFILES_ACTIVE, SPRING_DATASOURCE_DRIVER_CLASS_NAME
META_API_DATASOURCE_MASTER_URL/USERNAME/PASSWORD
META_API_DATASOURCE_SLAVE_URL/USERNAME/PASSWORD
META_API_JWT_SECRET, META_API_JWT_ACCESS_EXPIRATION_MS, META_API_JWT_REFRESH_EXPIRATION_MS
NCP_MAIL_ACCESS_KEY, NCP_MAIL_SECRET_KEY, NCP_MAIL_SENDER
KEY_SALT_MAIN
```

### Tables (DDL: docs/meta_api_ddl_v3.sql)
- `role_group` — 권한 그룹 마스터
- `school_info` — 학교 마스터 (CSV import, UPSERT, ACTIVE/CLOSED)
- `user` — 학심정 회원 매핑 (user_no PK, sp_user_id UNIQUE, ACTIVE/WITHDRAWN/SUSPENDED). **PII(name/email/nickname/gender) 미저장 — Auth 가 단일 출처** (Phase 4 에서 컬럼 DROP 예정)
- `group_info` — 그룹(방/학급), invite_code, FOR UPDATE 잠금
- `group_member` — 그룹 멤버 (STUDENT, ACTIVE/LEFT/KICKED/ARCHIVED). nickname/email 컬럼은 Phase 4 DROP 대상
- `group_invitation` — 그룹 초대 (회원/비회원 모두 — email 컬럼 **유지**: 비회원 초대 식별용)
- `auth_school_map` — 직책별 학교 접근 매핑
- `memo_info` — 관찰 메모
- `counseling_info` — 상담 정보 (scheduled→completed/cancelled)
- `counseling_student` — 상담 대상 학생 (stdt_name 컬럼은 Phase 4 DROP 대상)
- **폐기됨**: `email_verification`(Auth 단일 가입), `guest_conversion_log`(게스트 영역 폐기). DDL DROP 은 `docs/user-info-from-idp/migrations/01-guest-cleanup.sql`

### Deployment
- **Docker**: Multi-stage build (gradle:8.5-jdk17 → temurin:17-jre-alpine)
- **CI/CD**: GitLab 4-stage pipeline (build → test → docker → deploy)
- **develop** → auto deploy dev, **main** → manual deploy prod

## Git Commit Rules
- 커밋 메시지에 `Co-Authored-By` 라인을 포함하지 않는다.

## Code Patterns to Follow
1. 새 기능 추가 시: Controller → Service → Mapper(Java) → Mapper(XML) → Domain 순서
2. Mapper XML 추가 시: 반드시 기존 도메인 서브디렉토리에 배치
3. 쿼리 추가 시: `/* MapperName.methodName */` 주석 필수
4. 대량 데이터 처리: 건별 쿼리 금지, 배치(foreach) 사용
5. 페이징: PageUtil 사용 필수
6. 검색 조건: `<where>` + `<if>` 동적 SQL 패턴
7. Admin 페이지 추가 시: AdminLTE 레이아웃 + fragments 재사용
