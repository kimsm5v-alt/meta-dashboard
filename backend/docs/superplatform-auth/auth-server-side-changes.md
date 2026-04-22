# 슈퍼플랫폼 Auth 서버 측 변경 필요 사항 분석

> 학심정 개인정보를 Auth 서버에서 일괄 관리하기 위해 **Auth 서버 측에서** 추가/변경해야 하는 DB 테이블, API, 엔티티 분석

**작성일**: 2026-04-16  
**분석 대상**: `D:\workspace\superplatform-auth` (Auth 서버 프로젝트)

---

## 1. Auth 서버 현행 구조 요약

### 1.1 현재 개인정보 관련 엔티티

| 엔티티 | 테이블 | 저장하는 개인정보 | 대상 |
|--------|--------|-----------------|------|
| **PlatformUser** | `platform_user` | email, name, gender, password_hash | 전체 사용자 |
| **TeacherProfile** | `teacher_profile` | schoolName, schoolCode, subject, department, phone, **extra_data (JSON)** | 교사만 |
| **SocialAccount** | `social_account` | provider_email, provider_name | 소셜 로그인 사용자 |

### 1.2 현재 없는 것 (GAP)

| 필요한 것 | 현재 상태 | 영향 |
|----------|----------|------|
| **StudentProfile** (학생 프로필) | **없음** | 학생의 학교급/학년/반/번호 저장 불가 |
| **서비스별 추가 수집 데이터 저장** | TeacherProfile.extra_data JSON만 존재 | 학심정 외 다른 서비스의 추가 데이터 구조 불명확 |
| **사용자 검색 API** | **없음** | Admin에서 이메일/이름 검색 불가 |
| **게스트 프로필 저장** | **없음** | 게스트 개인정보 저장 불가 |

---

## 2. Auth 서버에 필요한 DB 변경

### 2.1 신규 테이블: `student_profile` (학생 프로필)

현재 Auth 서버에는 `teacher_profile`만 있고 학생용이 없다. 학심정이 수집하는 학생 개인정보(학교급, 학년, 반, 번호 등)를 저장하려면 학생 프로필 엔티티가 필요하다.

```sql
-- ============================================================
-- 학생 프로필 테이블 (신규)
-- teacher_profile과 대칭 구조
-- ============================================================
CREATE TABLE student_profile (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    user_id         BIGINT          NOT NULL    COMMENT 'FK → platform_user.id',
    school_name     VARCHAR(200)    NULL        COMMENT '학교명',
    school_code     VARCHAR(20)     NULL        COMMENT '학교 코드',
    school_level    VARCHAR(20)     NULL        COMMENT '학교급 (elementary/middle/high)',
    grade           VARCHAR(10)     NULL        COMMENT '학년',
    class_number    VARCHAR(10)     NULL        COMMENT '반',
    student_number  VARCHAR(10)     NULL        COMMENT '번호',
    region          VARCHAR(100)    NULL        COMMENT '지역 (시/도)',
    extra_data      JSON            NULL        COMMENT '서비스별 추가 데이터 (JSON)',
    created_by      BIGINT          NOT NULL    DEFAULT 0,
    updated_by      BIGINT          NOT NULL    DEFAULT 0,
    created_at      DATETIME(6)     NOT NULL    DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6)     NOT NULL    DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_student_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='학생 프로필 (teacher_profile 대칭)';
```

### 2.2 `teacher_profile` 확장

학심정이 교사에 대해 추가 수집하는 정보 중 기존 컬럼에 없는 것:

| 학심정 수집 항목 | 현재 teacher_profile | 필요 조치 |
|-----------------|---------------------|----------|
| 학교명 | `school_name` 있음 | 변경 없음 |
| 학교코드 | `school_code` 있음 | 변경 없음 |
| 학교급 | **없음** | 컬럼 추가 또는 extra_data 활용 |
| 지역 | **없음** | 컬럼 추가 또는 extra_data 활용 |

```sql
-- teacher_profile에 학교급, 지역 컬럼 추가
ALTER TABLE teacher_profile
  ADD COLUMN school_level VARCHAR(20) NULL
    COMMENT '학교급 (elementary/middle/high)' AFTER school_code,
  ADD COLUMN region VARCHAR(100) NULL
    COMMENT '지역 (시/도)' AFTER school_level;
```

### 2.3 신규 테이블 (대안): `service_user_data` (서비스별 사용자 데이터)

서비스마다 수집하는 추가 개인정보가 다르므로, 범용 저장 테이블을 두는 방안도 있다.

```sql
-- ============================================================
-- 서비스별 사용자 추가 데이터 (대안)
-- 각 서비스가 수집하는 추가 개인정보를 JSON으로 저장
-- ============================================================
CREATE TABLE service_user_data (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    user_id         BIGINT          NOT NULL    COMMENT 'FK → platform_user.id',
    client_id       VARCHAR(100)    NOT NULL    COMMENT 'FK → oauth2_client.client_id (서비스 식별)',
    data            JSON            NOT NULL    COMMENT '서비스별 추가 개인정보 (JSON)',
    created_at      DATETIME(6)     NOT NULL    DEFAULT CURRENT_TIMESTAMP(6),
    updated_at      DATETIME(6)     NOT NULL    DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_service (user_id, client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='서비스별 사용자 추가 데이터';

-- 학심정 데이터 예시:
-- INSERT INTO service_user_data (user_id, client_id, data)
-- VALUES (1, 'haksimjung-service', '{"schoolLevel":"middle","grade":"2","classNumber":"3","studentNumber":"15","region":"서울"}');
```

### 2.4 두 방안 비교

| 항목 | 방안 A: student_profile 전용 테이블 | 방안 B: service_user_data 범용 테이블 |
|------|----------------------------------|-------------------------------------|
| 구조 | teacher_profile과 대칭, 정규화 | JSON 기반 유연 구조 |
| 타입 안전성 | 컬럼 레벨 제약 가능 | JSON이라 DB 레벨 제약 불가 |
| 다른 서비스 확장 | 서비스마다 새 프로필 테이블 필요 | 하나의 테이블로 모든 서비스 대응 |
| 쿼리 성능 | WHERE school_level = 'middle' 가능 | JSON 내부 검색은 상대적으로 느림 |
| Auth 팀 작업량 | Entity + Repository + Service + Controller | Entity + Repository + 범용 CRUD API |
| **권장 대상** | 학생/교사처럼 공통적인 구조 | 서비스마다 전혀 다른 데이터 |

**권장: 방안 A + B 혼합**
- 학생/교사 공통 프로필은 **student_profile / teacher_profile** (정규화)
- 서비스별 고유 데이터는 **service_user_data** 또는 **extra_data JSON** (유연)

---

## 3. Auth 서버에 필요한 API 변경

### 3.1 신규 API

| API | Method | 용도 | 사용처 |
|-----|--------|------|--------|
| **`GET /api/v1/students/me/profile`** | GET | 학생 프로필 조회 | 학심정 FE (프로필 화면) |
| **`PUT /api/v1/students/me/profile`** | PUT | 학생 프로필 수정 | 학심정 FE (프로필 수정) |
| **`GET /api/v1/users/search`** | GET | 사용자 검색 (email/name LIKE) | 학심정 Admin 회원 검색 |
| **`PUT /api/v1/services/{clientId}/user-data`** | PUT | 서비스별 추가 데이터 저장 | 학심정 BE (추가 정보 수집 시) |
| **`GET /api/v1/services/{clientId}/user-data`** | GET | 서비스별 추가 데이터 조회 | 학심정 BE |

### 3.2 기존 API 확장

| API | 현재 | 필요한 변경 |
|-----|------|------------|
| **`GET /api/v1/users/{id}`** | publicUserId, email, name, gender, userType 반환 | 학교정보(schoolName, schoolLevel, grade 등) 포함 옵션 |
| **`POST /api/v1/users/batch`** | 최대 100건 배치 조회 | 응답에 학교정보 포함 옵션 (쿼리 파라미터: `?include=profile`) |
| **`PUT /api/v1/users/me`** | name, gender 수정 가능 | 추가 필드(학교급, 지역 등) 수정 가능하도록 확장 |

### 3.3 검색 API 상세 (신규)

```
GET /api/v1/users/search?q=홍길동&type=name&page=0&size=20
GET /api/v1/users/search?q=hong@example.com&type=email&page=0&size=20

Response:
{
  "success": true,
  "data": {
    "content": [
      { "publicUserId": "uuid", "email": "...", "name": "...", "userType": "TEACHER" }
    ],
    "totalElements": 42,
    "totalPages": 3,
    "page": 0,
    "size": 20
  }
}
```

이 API가 없으면 **학심정 Admin에서 회원 검색이 불가**하다. 현재 학심정은 `WHERE email LIKE '%keyword%'`로 직접 DB 검색하고 있음.

---

## 4. Auth 서버에 필요한 백엔드 코드 변경

### 4.1 신규 생성

| 파일 (예상) | 역할 |
|------------|------|
| `domain/user/entity/StudentProfile.java` | 학생 프로필 JPA 엔티티 |
| `domain/user/repository/StudentProfileRepository.java` | 학생 프로필 Repository |
| `domain/user/dto/StudentProfileResponse.java` | 학생 프로필 응답 DTO |
| `domain/user/dto/UpdateStudentProfileRequest.java` | 학생 프로필 수정 요청 DTO |
| `domain/user/controller/StudentProfileController.java` | 학생 프로필 API (또는 UserController 확장) |
| `domain/user/service/StudentProfileService.java` | 학생 프로필 비즈니스 로직 |
| `domain/user/dto/UserSearchResponse.java` | 검색 결과 DTO |
| `domain/user/controller/UserSearchController.java` | 검색 API (또는 UserController 확장) |

방안 B(service_user_data) 채택 시:

| 파일 (예상) | 역할 |
|------------|------|
| `domain/service/entity/ServiceUserData.java` | 서비스별 데이터 JPA 엔티티 |
| `domain/service/repository/ServiceUserDataRepository.java` | Repository |
| `domain/service/controller/ServiceDataController.java` | CRUD API |
| `domain/service/service/ServiceDataService.java` | 비즈니스 로직 |

### 4.2 기존 수정

| 파일 | 변경 내용 |
|------|----------|
| `UserController.java` | `/users/{id}` 응답에 profile 포함 옵션 추가 |
| `UserService.java` | 배치 조회 시 profile 조인 로직 |
| `TeacherProfile.java` | school_level, region 컬럼 추가 (엔티티 필드) |
| `TeacherProfileResponse.java` | school_level, region 필드 추가 |
| `UpdateTeacherProfileRequest.java` | school_level, region 필드 추가 |

---

## 5. 학심정 ↔ Auth 서버 역할 분담 명확화

### 5.1 핵심 원칙

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Auth 서버 = "이 사람이 누구인가" (신원)                  │
│   학심정 DB = "이 사람이 우리 서비스에서 뭘 하는가" (활동)   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5.2 데이터 분류표

| 데이터 | 관리 주체 | 이유 |
|--------|----------|------|
| 이메일 | **Auth** | 개인정보 (ISMS) |
| 이름/닉네임 | **Auth** | 개인정보 |
| 성별 | **Auth** | 개인정보 |
| 비밀번호 | **Auth** | 인증정보 |
| 학교명/학교급/지역 | **Auth** | 개인정보 (소속 정보) |
| 학년/반/번호 | **Auth** | 개인정보 (학적 정보) |
| --- | --- | --- |
| role_code (TEACHER/STUDENT) | **학심정** | 서비스 내 권한 (Auth의 userType과 매핑하되 별도 관리) |
| tc_id (교사 ID) | **학심정** | 서비스 도메인 식별자 |
| stdt_id (학생 ID) | **학심정** | 서비스 도메인 식별자 |
| group_info (그룹) | **학심정** | 서비스 도메인 |
| group_member (그룹 참가) | **학심정** | 서비스 도메인 (nickname/email 컬럼만 제거) |
| counseling_info (상담) | **학심정** | 서비스 도메인 |
| memo_info (관찰 메모) | **학심정** | 서비스 도메인 |
| school_record_info (생기부) | **학심정** | 서비스 도메인 |
| 검사/진단 데이터 전부 | **학심정** | 서비스 도메인 |

### 5.3 주요 시나리오별 호출 흐름

#### 시나리오 1: 그룹 생성

```
교사가 "3학년 2반" 그룹 생성
  │
  ├─ 학심정 FE → 학심정 BE: POST /group/create { groupNm, grade, classNumber, ... }
  │
  ├─ 학심정 BE: INSERT INTO group_info (...) → 학심정 DB
  │   (Auth 서버 호출 없음!)
  │
  └─ 응답 반환
```

**Auth 서버와 무관. 100% 학심정 내부 처리.**

#### 시나리오 2: 그룹 멤버 목록 조회 (이름 표시 필요)

```
교사가 그룹 멤버 목록 조회
  │
  ├─ 학심정 BE: SELECT user_no, stdt_id, member_type FROM group_member WHERE group_id = ?
  │   → 학심정 DB (개인정보 없는 순수 데이터)
  │
  ├─ 학심정 BE: user_no 목록 → sp_user_id 목록 조회 (학심정 DB)
  │
  ├─ 학심정 BE: PersonalInfoResolver.resolveBatch(spUserIds)
  │   → Auth 서버 POST /api/v1/users/batch (캐시 miss분만)
  │   → 이름, 성별 수신
  │
  └─ 응답: [ { stdtId, name: "김철수", gender: "M", memberNo: 15, ... } ]
```

**Auth API는 "이름을 보여줘야 할 때"만 호출. 그것도 캐시 덕분에 대부분 0회.**

#### 시나리오 3: 상담 기록 생성

```
교사가 상담 기록 작성
  │
  ├─ 학심정 FE → 학심정 BE: POST /counseling/create
  │   { claId, scheduledAt, types, areas, students: [{ stdtId, stdtNumber }] }
  │
  ├─ 학심정 BE: INSERT INTO counseling_info (...) → 학심정 DB
  ├─ 학심정 BE: INSERT INTO counseling_student (stdt_id, stdt_number, ...) → 학심정 DB
  │   (stdt_name 컬럼 제거됨 — stdt_id만 저장)
  │
  └─ 응답 반환 (Auth 서버 호출 없음!)
```

**저장 시에는 Auth 호출 불필요. 조회 시 이름을 보여줄 때만 Auth 호출.**

#### 시나리오 4: 관리자 회원 검색

```
관리자가 "hong@" 으로 회원 검색
  │
  ├─ 학심정 BE: PersonalInfoResolver 또는 직접 Auth API 호출
  │   → Auth 서버 GET /api/v1/users/search?q=hong@&type=email
  │   → 검색 결과: [ { publicUserId, email, name, userType } ]
  │
  ├─ 학심정 BE: publicUserId 목록으로 학심정 user 테이블 조회
  │   → 서비스 데이터 (role_code, tc_id, status 등) 매칭
  │
  └─ 응답: 병합된 회원 목록
```

**이것은 Auth 검색 API가 필수인 케이스. 현재 Auth 서버에 없으므로 추가 요청 필요.**

---

## 6. Auth 서버 측 변경 규모 요약

### 6.1 DB 변경

| 변경 | 대상 | 우선순위 |
|------|------|---------|
| **신규 테이블**: `student_profile` | 학생 프로필 (학교급, 학년, 반, 번호, 지역) | **필수** |
| **컬럼 추가**: `teacher_profile`에 school_level, region | 교사 프로필 확장 | 높음 |
| **신규 테이블**: `service_user_data` (선택) | 서비스별 범용 추가 데이터 | 선택 |

### 6.2 API 변경

| 변경 | 대상 | 우선순위 |
|------|------|---------|
| **신규 API**: 학생 프로필 CRUD | `GET/PUT /api/v1/students/me/profile` | **필수** |
| **신규 API**: 사용자 검색 | `GET /api/v1/users/search` | **필수** |
| **기존 확장**: 배치 조회에 프로필 포함 | `POST /api/v1/users/batch?include=profile` | 높음 |
| **기존 확장**: 단건 조회에 프로필 포함 | `GET /api/v1/users/{id}?include=profile` | 높음 |
| **신규 API**: 서비스별 데이터 CRUD (방안 B 채택 시) | `GET/PUT /api/v1/services/{clientId}/user-data` | 선택 |

### 6.3 백엔드 코드

| 변경 | 파일 수 |
|------|--------|
| 신규 Entity + Repository + Service + Controller (StudentProfile) | ~6개 |
| 신규 검색 API (UserSearch) | ~3개 |
| 기존 UserController/UserService 확장 (배치 조회 프로필 포함) | ~2개 수정 |
| TeacherProfile 엔티티/DTO 확장 | ~3개 수정 |
| (선택) ServiceUserData 범용 CRUD | ~4개 |
| **합계** | **약 14~18개 파일** |

### 6.4 Auth 서버 측 예상 작업 기간

| 작업 | 기간 |
|------|------|
| StudentProfile 엔티티 + CRUD API | 2~3일 |
| TeacherProfile 확장 (school_level, region) | 1일 |
| 사용자 검색 API | 2~3일 |
| 배치 조회 프로필 포함 옵션 | 1~2일 |
| 테스트 + 배포 | 2~3일 |
| **합계** | **약 1~2주** |

---

## 7. 양쪽 작업 일정 종합

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  Auth 서버 측              학심정 측
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 1 (학심정 오픈)
  작업 없음                         현행 유지 + sp_user_id 컬럼 선추가

Phase 2 (SSO 인증 전환)
  client_id/secret 발급 (1일)      Auth 프록시 + SDK 연동 (2~3주)
  CORS 등록 (1일)

Phase 3-Auth (Auth 서버 준비)     Phase 3-학심정 (개인정보 이관)
  StudentProfile 추가 (3일)           ← 이것이 완료되어야
  TeacherProfile 확장 (1일)          PersonalInfoResolver 구현
  검색 API 추가 (3일)               30+ 쿼리 수정
  배치 조회 확장 (2일)              8 서비스 수정
  테스트/배포 (3일)                  DDL 적용 (개인정보 컬럼 DROP)
  ─────────────                    ─────────────
  약 1~2주                          약 4~5주 (Auth 완료 후 착수)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총 소요: Phase 2(2~3주) + Phase 3(Auth 1~2주 + 학심정 4~5주) = 약 8~10주
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**핵심 의존 관계**: Phase 3에서 학심정이 Auth API를 통해 학생 프로필을 조회/저장하려면, Auth 서버에 StudentProfile이 먼저 준비되어 있어야 한다. **Auth 서버 작업이 선행 조건**.

---

## 8. Auth 팀에 전달해야 할 요청 사항

### 즉시 요청 (Phase 2 전제)

| # | 요청 | 설명 |
|---|------|------|
| 1 | **client_id / client_secret 발급** | 학심정 서비스 등록 |
| 2 | **CORS 도메인 등록** | 학심정 FE 도메인 (dev/staging/prod) |

### Phase 3 전 요청 (Auth 서버 개발 필요)

| # | 요청 | 설명 | Auth 작업량 |
|---|------|------|-----------|
| 3 | **StudentProfile 엔티티 + CRUD API** | 학생 프로필 (학교급, 학년, 반, 번호, 지역) | 2~3일 |
| 4 | **TeacherProfile에 school_level, region 추가** | 교사 프로필 확장 | 1일 |
| 5 | **사용자 검색 API** | email/name 기반 검색 (Admin용, 페이징) | 2~3일 |
| 6 | **배치 조회 응답에 프로필 포함 옵션** | `?include=profile` 파라미터 | 1~2일 |
| 7 | **(선택) 서비스별 추가 데이터 범용 API** | service_user_data CRUD | 2~3일 |

### 정책 협의 사항

| # | 질문 |
|---|------|
| 8 | 학생 프로필을 **전용 테이블(student_profile)**로 만들지, **범용 JSON(service_user_data)**으로 처리할지 |
| 9 | 게스트(비회원) 개인정보는 Auth에서 관리하는지, 서비스 예외 허용인지 |
| 10 | 학심정 외 다른 서비스(게임, 매쓰캔버스 등)도 추가 개인정보를 Auth에 저장할 예정인지 (공통 설계 필요) |
| 11 | 사용자가 Auth에서 이름/이메일 변경 시 서비스에 **Webhook 통지**가 필요한지 |

---

## 9. 정리: 전체 변경 범위 한눈에 보기

```
┌─────────────────────────────────────┬────────────────────────────────────┐
│         Auth 서버 (슈퍼플랫폼)        │          학심정 (서비스)             │
├─────────────────────────────────────┼────────────────────────────────────┤
│                                     │                                    │
│  [DB]                               │  [DB]                              │
│  + student_profile 테이블 신규       │  - user.email 제거                  │
│  + teacher_profile에 2컬럼 추가      │  - user.password 제거               │
│  + (선택) service_user_data 테이블   │  - user.nickname 제거               │
│                                     │  - user.gender 제거                 │
│  [API]                              │  - group_member.nickname 제거       │
│  + 학생 프로필 CRUD                  │  - group_member.gender 제거         │
│  + 사용자 검색 API                   │  - group_member.email 제거          │
│  + 배치 조회 프로필 포함 옵션         │  - counseling_student.stdt_name 제거│
│                                     │  - email_verification 테이블 DROP   │
│  [엔티티]                            │                                    │
│  + StudentProfile.java              │  [백엔드]                           │
│  + StudentProfileRepository         │  + PersonalInfoResolver (신규)      │
│  + StudentProfileController         │  + AuthApiClient (신규)             │
│  + StudentProfileService            │  + AuthProxyController (신규)       │
│  ~ TeacherProfile 확장              │  ~ 7 Mapper XML (30+ 쿼리 수정)    │
│  ~ UserController 확장              │  ~ 8 Service 클래스 수정            │
│  + UserSearchController             │  ~ SecurityConfig 수정              │
│                                     │                                    │
│  파일 약 14~18개                     │  [프론트엔드]                       │
│  기간 약 1~2주                       │  + SDK 연동 (Phase 2)              │
│                                     │  ~ AuthContext 전환                 │
│                                     │  - SignUpPage 제거                  │
│                                     │  - ForgotPasswordPage 제거          │
│                                     │                                    │
│                                     │  BE 파일 약 30+개                   │
│                                     │  FE 파일 약 10+개                   │
│                                     │  기간 약 6~8주 (Phase 2+3)          │
└─────────────────────────────────────┴────────────────────────────────────┘
```

---

**문서 끝**
