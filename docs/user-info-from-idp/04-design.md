# 통합 설계 — IDP 회원정보 API 전환 + 게스트 폐기

**Date**: 2026-05-22
**Branch**: `feature/user-info-from-idp`
**Status**: 설계안 (브레인스토밍 결과 통합)
**선행 문서**: `00-overview.md`, `01-impact-mapping.md`

---

## 1. 결정 사항 (브레인스토밍 기록)

| # | 항목 | 결정 |
|:---:|:---|:---|
| 1 | 핵심 정책 | 학심정 DB에 **이름·이메일 저장 안 함** + **조회시마다 Auth 회원정보 API 호출** |
| 2 | 게스트 영역 | **전체 폐기** (controller/service/mapper/yml/FE 페이지 + 기존 데이터 모두 삭제 — clean cut) |
| 3 | `user.gender` / `group_member.gender` | **DROP** (이미 dead — SsoUserRegistrationService 코멘트 "심리검사 시작 시 별도 수집" 명시, MyBatis INSERT/UPDATE 0건) |
| 4 | `counseling_student.stdt_name` | **DROP** + 매번 Auth 조회. 탈퇴/notFound 시 `(탈퇴 회원)` placeholder |
| 5 | `group_invitation.email` | **유지** (회원/비회원 양쪽 초대 흐름 — 이메일 발송 후 가입 유도) |
| 6 | 캐시 정책 | **요청 단위 메모 캐시** (한 HTTP 요청 안에서만 재사용). 메모리 캐시 없음. |
| 7 | Auth 장애 fallback | **부분 응답** (학심정 응답 자체는 200, 이름 자리에 placeholder) |
| 8 | LIKE 검색 | 학심정에 사용처 0건 (dead query) → Auth 측 추가 API 요청 불필요 |
| 9 | PersonInfoClient 동기/비동기 | **동기 (RestClient)** — Spring 6+ 표준, 응답 조합 layer의 가독성/단순성 |
| 10 | Service AT 발급 | `client_credentials` grant + `scope=users:read` + 1h TTL 메모리 캐시 + 만료 5분 전 갱신 |
| 11 | 응답 조합 패턴 | **명시적 Enricher 패턴** — `HasUserInfo` 인터페이스 + 공통 `UserInfoEnricher` 컴포넌트. Service에서 `enricher.enrich(list)` 1줄 호출로 통일. AOP/ResponseBodyAdvice 미사용 (디버깅·트랜잭션 경계 안전). |

---

## 2. 아키텍처

### 2.1 전체 흐름

```
[FE 컴포넌트]
   ↓
[학심정 Controller]
   ↓
[학심정 Service]
   ├─ [Mapper] (sp_user_id, stdt_id 만 SELECT — PII 없음)
   └─ [UserInfoEnricher.enrich(list)] ★ 한 줄로 enrich
         └─ [PersonInfoClient] ─→ [Auth /api/v1/users/{id} | /batch | /lookup]
              ├─ RequestScope Cache (요청 단위)
              ├─ ServiceAccessTokenProvider (1h TTL)
              └─ Fallback (placeholder)
```

### 2.2 응답 조합 패턴 — 명시적 Enricher (결정 #11)

**핵심 아이디어**: PII가 필요한 DTO는 `HasUserInfo` 인터페이스를 구현하고, Service는 `enricher.enrich(list)` 한 줄로 일괄 enrich. 모든 호출 지점에서 동일 패턴이라 학습/유지보수 비용 최소. AOP/ResponseBodyAdvice 미사용 (디버깅·트랜잭션 경계 안전).

#### 2.2.1 `HasUserInfo` 인터페이스 (DTO 표준)

```java
package com.vs.meta.common.auth;

/**
 * PII(name/email)가 필요한 DTO 가 구현하는 인터페이스.
 * UserInfoEnricher 가 sp_user_id 로 Auth 조회 후 setter 호출.
 */
public interface HasUserInfo {
    String getSpUserId();
    void setName(String name);
    void setEmail(String email);
}
```

#### 2.2.2 `UserInfoEnricher` (공통 컴포넌트)

```java
@Component
@RequiredArgsConstructor
public class UserInfoEnricher {

    private final PersonInfoClient personInfoClient;
    private final PersonInfoRequestCache requestCache;

    /**
     * 단건 enrich — 내부적으로 batch 1건 호출로 통일.
     * 단건 전용 API(getOne) 분기 의도적 미사용 — 캐시/디버깅 일관성 우선.
     */
    public <T extends HasUserInfo> void enrich(T item) {
        if (item == null || item.getSpUserId() == null) return;
        enrich(List.of(item));
    }

    /** 배치 enrich — sp_user_id 모아서 Auth /batch 호출 1회 (요청 캐시 거쳐서) */
    public <T extends HasUserInfo> void enrich(List<T> items) {
        if (items == null || items.isEmpty()) return;

        List<String> ids = items.stream()
                .map(HasUserInfo::getSpUserId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<String, UserInfo> infos = requestCache.getBatchOrLoad(ids, personInfoClient::getBatch);

        items.forEach(item -> {
            UserInfo info = infos.getOrDefault(item.getSpUserId(), UserInfo.placeholder(item.getSpUserId()));
            item.setName(info.name());
            item.setEmail(info.email());
        });
    }
}
```

#### 2.2.3 2명 이상 enrich 하는 DTO (예: BugReport reporter+resolver)

`HasUserInfo`는 1명 표현이므로, 여러 역할의 사용자가 있는 DTO는 nested 구조 권장:

```java
// 권장: nested UserSlot
public class BugReportDto {
    private Long id;
    private String title;
    private UserSlot reporter;   // HasUserInfo 구현
    private UserSlot resolver;   // HasUserInfo 구현 (nullable)
}

public class UserSlot implements HasUserInfo {
    private String spUserId;
    private String name;
    private String email;
    // getters/setters
}

// Service 에서
List<BugReportDto> reports = mapper.findReports();
userInfoEnricher.enrich(
    reports.stream()
        .flatMap(r -> Stream.of(r.getReporter(), r.getResolver()))
        .filter(Objects::nonNull)
        .toList()
);
```

> 비권장: BugReportDto 자체가 HasUserInfo를 두 번 구현하는 시도 — 인터페이스 충돌, 자동화 어려움.

#### 2.2.4 Service에서 사용 — 단건/다건/중첩 모두 동일 한 줄

```java
// 단건 — /member/info
MemberInfoDto dto = memberMapper.findByUserNo(userNo);   // sp_user_id만 SELECT
userInfoEnricher.enrich(dto);                            // ★ 단건도 한 줄
return dto;

// 다건 — 그룹 멤버 목록
List<MemberDto> members = mapper.findByGroupId(groupId);
userInfoEnricher.enrich(members);                        // ★ 다건도 한 줄
return members;

// 중첩 — BugReport reporter + resolver
List<BugReportDto> reports = mapper.findReports();
userInfoEnricher.enrich(
    reports.stream()
        .flatMap(r -> Stream.of(r.getReporter(), r.getResolver()))
        .filter(Objects::nonNull)
        .toList()
);
```

> **단건도 batch API 호출**: 단건 전용 분기를 두지 않는 이유 — 캐시/디버깅 일관성. 같은 요청에서 중복 호출은 RequestCache가 막아주므로 실질 비용 동일. Auth 호출 횟수 = `(같은 요청 안 distinct sp_user_id 종류 수 / 100)` 올림.

### 2.3 신규 컴포넌트 목록

| 컴포넌트 | 역할 |
|:---|:---|
| `HasUserInfo` (인터페이스) | PII 필요 DTO 표준 — 모든 enrich 대상이 구현 |
| `UserInfoEnricher` (`@Component`) | 단건/배치 enrich. **호출 코드가 닿는 유일한 진입점** |
| `PersonInfoClient` (인터페이스) | Auth 호출 추상화 — 단건/배치/lookup |
| `PersonInfoClientImpl` (`@Component`) | RestClient 기반 구현 (timeout/retry/error 매핑) |
| `PersonInfoRequestCache` (`@RequestScope`) | 한 HTTP 요청 안에서 sp_user_id → UserInfo 캐시 |
| `ServiceAccessTokenProvider` (`@Component`) | `client_credentials` 토큰 발급/캐시/갱신 (1h TTL) |
| `UserInfo` (record) | 응답 모델 + `placeholder()` factory |

#### 2.3.1 `UserInfo` 상세

```java
public record UserInfo(
    String publicUserId,
    String name,
    String nickname,
    String email,
    String userType,    // TEACHER / STUDENT
    boolean placeholder // 조회 실패/탈퇴 시 true (name="(탈퇴 회원)")
) {
    public static UserInfo placeholder(String publicUserId) {
        return new UserInfo(publicUserId, "(탈퇴 회원)", null, null, null, true);
    }
}
```

#### 2.3.2 `PersonInfoClient` 인터페이스

```java
public interface PersonInfoClient {
    UserInfo getOne(String publicUserId);
    Map<String, UserInfo> getBatch(List<String> publicUserIds);  // 100건 초과 시 자동 chunking
    Optional<UserInfo> lookupByEmail(String email);              // service AT 전용
}
```

> **Service 코드에서 PersonInfoClient를 직접 호출하지 않는 것이 원칙** — 항상 `UserInfoEnricher`를 거친다. 예외: `lookupByEmail` (이메일 → publicUserId 변환은 enrich 패턴과 무관 — SsoUserMigration, GroupInvitation 등 5곳에서 직접 호출).

---

## 3. DDL 마이그레이션 (전체)

### 3.1 사전 백업 (필수)

```sql
-- 운영 DB에서 마이그레이션 전 백업
mysqldump --single-transaction --routines --triggers \
  -h <host> -P <port> -u <user> -p \
  superplatform_meta > backup_before_user_info_from_idp_$(date +%Y%m%d_%H%M%S).sql
```

### 3.2 Step 1 — 게스트 영역 데이터 삭제 (코드 폐기 후 실행)

```sql
-- 게스트 그룹 멤버 삭제
DELETE FROM group_member WHERE member_type = 'GUEST';

-- 게스트 전환 이력 테이블 폐기
DROP TABLE IF EXISTS guest_conversion_log;

-- 게스트 이메일 인증 테이블 폐기 (회원가입이 Auth로 이관되어 미사용)
DROP TABLE IF EXISTS email_verification;
```

> **순서 주의**: 백엔드의 `GuestController`, `GuestService`, `EmailVerificationService` 등 게스트 코드 폐기 배포가 선행되어야 외래키/조회 충돌 없음.

### 3.3 Step 2 — user 테이블 PII 컬럼 DROP

```sql
-- 변경 전 최종 상태 확인
SELECT user_no, sp_user_id, email, nickname, gender, role_code, status
FROM `user` LIMIT 10;

-- 인덱스/제약 먼저 제거
ALTER TABLE `user` DROP INDEX uk_user_email;

-- 컬럼 DROP
ALTER TABLE `user`
  DROP COLUMN email,
  DROP COLUMN nickname,
  DROP COLUMN gender;

-- 변경 후 검증
DESCRIBE `user`;
-- 기대: user_no, sp_user_id, role_code, tc_id, stdt_id, status, last_login_at, created_by, updated_by, created_at, updated_at
```

### 3.4 Step 3 — group_member 테이블 PII 컬럼 DROP

```sql
-- 변경 전 상태 확인 (게스트 삭제가 완료되어야 함)
SELECT id, group_id, user_no, stdt_id, nickname, email, gender, member_type, member_no, status
FROM group_member WHERE member_type = 'GUEST' LIMIT 1;
-- 기대: 0 rows

-- email 관련 인덱스 있으면 제거 (정의 확인 후)
-- ALTER TABLE group_member DROP INDEX <인덱스명>;

-- 컬럼 DROP
ALTER TABLE group_member
  DROP COLUMN nickname,
  DROP COLUMN email,
  DROP COLUMN gender;

-- 검증
DESCRIBE group_member;
```

### 3.5 Step 4 — counseling_student 테이블 stdt_name DROP

```sql
ALTER TABLE counseling_student DROP COLUMN stdt_name;

DESCRIBE counseling_student;
```

### 3.6 Step 5 — 유지 항목 확인 (DROP 안 함)

```sql
-- group_invitation.email: 유지 (회원/비회원 양쪽 초대 흐름)
DESCRIBE group_invitation;
-- email 컬럼 그대로 존재해야 함

-- user.sp_user_id: 유지 (Auth 식별 키)
-- user.role_code, tc_id, stdt_id: 유지 (학심정 서비스 데이터)
SELECT user_no, sp_user_id, role_code, tc_id, stdt_id FROM `user` LIMIT 5;
```

### 3.7 Step 6 — 검증 쿼리

```sql
-- 모든 user row에 sp_user_id 매핑 완료 확인
SELECT
  COUNT(*) AS total_active,
  SUM(CASE WHEN sp_user_id IS NULL THEN 1 ELSE 0 END) AS unmapped
FROM `user` WHERE status = 'ACTIVE';
-- 기대: unmapped = 0

-- group_member에 GUEST 잔재 0건
SELECT COUNT(*) FROM group_member WHERE member_type = 'GUEST';
-- 기대: 0

-- guest_conversion_log, email_verification 테이블 부재 확인
SHOW TABLES LIKE 'guest_conversion_log';
SHOW TABLES LIKE 'email_verification';
-- 기대: 빈 결과 (테이블 없음)

-- 학심정 DB에 PII 잔재 0건 확인 (INFORMATION_SCHEMA)
SELECT TABLE_NAME, COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'superplatform_meta'
  AND COLUMN_NAME IN ('email', 'nickname', 'gender', 'stdt_name')
  AND TABLE_NAME NOT IN ('group_invitation');  -- group_invitation.email은 유지 항목
-- 기대: 0 rows
```

### 3.8 Step 7 — 롤백 SQL (만일에 대비)

```sql
-- 백업 복원이 가장 안전. ALTER 단위 롤백은 데이터 손실 발생.

-- 컬럼 복구 시도 (스키마만 — 데이터는 모두 NULL)
ALTER TABLE `user`
  ADD COLUMN email VARCHAR(100) NULL AFTER sp_user_id,
  ADD COLUMN nickname VARCHAR(50) NULL,
  ADD COLUMN gender VARCHAR(10) NULL;

-- 데이터 복원은 백업 mysqldump 파일에서 SELECT로 추출 후 UPDATE
```

---

## 4. 백엔드 변경 매핑

### 4.1 삭제 대상

**Controller**:
- `api/guest/controller/GuestController.java`
- `api/guest/controller/GuestAuthController.java`
- `api/member/controller/EmailVerificationController.java`

**Service**:
- `api/guest/service/GuestService.java`
- `api/guest/service/GuestAuthService.java`
- `api/member/service/EmailVerificationService.java`

**Mapper**:
- `api/guest/mapper/GuestConversionLogMapper.java`
- `api/member/mapper/EmailVerificationMapper.java`
- `mapper/guest/GuestConversionLogMapper.xml`
- `mapper/member/EmailVerificationMapper.xml`

**Domain**:
- `domain/GuestConversionLog.java`
- `domain/EmailVerification.java`

**기타**:
- `MemberController.sendCode/verifyCode` 메서드 (게스트 인증용)
- application.yml의 게스트 관련 prop (있다면)
- 관련 테스트 파일

### 4.2 수정 대상

**Domain 필드 제거**:
| 파일 | 제거 필드 |
|:---|:---|
| `domain/User.java` | `email`, `nickname`, `gender` |
| `domain/GroupMember.java` | `nickname`, `email`, `gender` |
| `domain/CounselingStudent.java` | `stdtName` |

**Mapper XML 정리** (구체 라인은 `01-impact-mapping.md` 3장 참조):
| Mapper | 변경 내용 |
|:---|:---|
| `UserMapper.xml` | resultMap에서 email/nickname/gender 제거, INSERT/UPDATE 컬럼 제거, dead LIKE 쿼리 삭제 |
| `GroupMemberMapper.xml` | resultMap/INSERT/UPDATE 전반 정리 |
| `GroupQueryMapper.xml` | 멤버 목록/상세 SELECT에서 nickname/email/gender 제거, dead LIKE 쿼리 삭제 |
| `DgnssMapper.xml` | **가장 큰 영향** — `gm.nickname AS MEM_NM` 등 30+ 라인 제거 (응답 조합 layer에서 채움) |
| `AiBugReportMapper.xml` | reporter/resolver email/nickname JOIN 제거 |
| `GroupInvitationMapper.xml` | (변경 최소) email 컬럼 유지 |
| `CounselingStudentMapper.xml` | stdt_name resultMap/INSERT 제거 |
| `FileMapper.xml` | `gm_st.nickname` JOIN 제거 |

**Service 응답 조합 적용** (공통 패턴: 응답 DTO가 `HasUserInfo` 구현 + `userInfoEnricher.enrich(...)` 한 줄):
| 파일 | DTO 변경 (HasUserInfo 구현) | Service 변경 |
|:---|:---|:---|
| `MemberService.java` + `MemberController.java` | `MemberInfoDto` | `enrich(dto)` 1줄 (단건) |
| `GroupService.java` | `GroupMemberDto`, `GroupHostDto` | 그룹 상세/멤버 목록 `enrich(members)` + 방장 단건 `enrich(host)`. 알림 publish 시 닉네임 필요하면 enrich 후 publish |
| `GroupInvitationService.java` | `GroupInvitationDto` (initiator) | 초대 목록 `enrich(initiators)`. email은 group_invitation.email 그대로 (enrich 대상 X) |
| `CounselingService.java` | `CounselingStudentDto` | `enrich(students)` |
| `SsoUserQueryService.java` | - | **동기화 로직 자체 제거** (저장 안 함) |
| `SsoUserRegistrationService.java` | - | 신규 user INSERT 시 sp_user_id만 저장. gender 컬럼 DROP에 따라 관련 코드 제거 |
| `DgnssService.java` (또는 보고서 Service) | `DgnssReportRowDto`, `DgnssStudentRowDto` 등 | 검사 결과 보고서 응답 `enrich(rows)` |
| `AiBugReportService.java` | `BugReportDto` (nested `UserSlot` reporter/resolver) | `enrich(reporters + resolvers stream flatMap)` |

> 모든 Service는 **`userInfoEnricher.enrich(...)` 한 줄만 호출**. PersonInfoClient/RequestCache/AccessToken 등 내부 구조는 Service에서 인지 불필요.

### 4.3 신규 컴포넌트

| 파일 | 역할 |
|:---|:---|
| `common/auth/HasUserInfo.java` | **PII 필요 DTO 표준 인터페이스** — getSpUserId/setName/setEmail |
| `common/auth/UserInfoEnricher.java` | **Service에서 호출하는 유일한 진입점** — `enrich(item)` / `enrich(list)` |
| `common/auth/PersonInfoClient.java` | Auth API 호출 인터페이스 (Enricher 내부에서만 호출) |
| `common/auth/PersonInfoClientImpl.java` | RestClient 기반 구현 (단건/배치/lookup) |
| `common/auth/PersonInfoRequestCache.java` | `@RequestScope` Bean — 요청 단위 캐시 |
| `common/auth/ServiceAccessTokenProvider.java` | service AT 발급/캐시/갱신 |
| `common/auth/UserInfo.java` | DTO + placeholder factory |
| `common/auth/AuthApiException.java` | Auth 호출 실패 시 (로깅용, 컨트롤러까지 전파 안 함) |
| `common/config/PersonInfoClientConfig.java` | RestClient Bean + timeout/retry 설정 |

> **사용 규칙**: Service/Controller 코드는 **항상 `UserInfoEnricher`만 호출**. `PersonInfoClient`를 직접 호출하는 곳은 **이메일 lookup이 필요한 5곳뿐** (SsoUserMigration, GroupInvitation 등 — 이메일 → publicUserId 변환은 enrich 패턴과 무관).

### 4.4 설정 추가 (application.yml)

```yaml
# Auth Internal API (회원정보 조회)
superplatform:
  auth:
    server-url: ${SP_AUTH_SERVER_URL:http://localhost:8080}
    client-id: ${SP_AUTH_CLIENT_ID:test-service}
    client-secret: ${SP_AUTH_CLIENT_SECRET:test-secret-1234!}
    # 신규 추가:
    internal-api:
      base-url: ${SP_AUTH_INTERNAL_API_URL:http://localhost:8080/api/v1}
      service-token-scope: users:read
      connect-timeout-ms: 2000
      read-timeout-ms: 3000
```

---

## 5. 프론트엔드 변경 매핑

### 5.1 타입 변경

`shared/types/index.ts`:
- `User` 타입에서 `email`, `name`, `nickname` 필드는 **응답 DTO 한정** (학심정 자체 저장 X)
- SDK `getUser()`가 반환하는 Auth user와 학심정 서비스 데이터(roleCode, tcId 등) 분리 명확화

### 5.2 게스트 영역 제거

- `pages/guest/*` 디렉토리 전체 삭제
- `features/guest-exam/*` 디렉토리 전체 삭제
- `routes.tsx`에서 `/guest/*` 라우트 제거
- `AuthContext.tsx`의 `loginAsGuest`, `setGuestToken` 등 제거
- `features/auth`의 게스트 관련 컴포넌트 제거

### 5.3 placeholder 표시 공통 컴포넌트

```typescript
// shared/ui/UserName.tsx
export const UserName = ({ user }: { user: UserInfo }) => {
  if (user.placeholder) {
    return <span className="text-gray-400">(탈퇴 회원)</span>;
  }
  return <span>{user.name}</span>;
};
```

### 5.4 영향 컴포넌트 (구체는 구현 시 매핑)

`01-impact-mapping.md` 4장 참조 — 약 30 파일.

---

## 6. 에러 처리 / Fallback

| 시나리오 | PersonInfoClient 동작 | 학심정 응답 |
|:---|:---|:---|
| Auth 단건 200 | UserInfo 정상 반환 | 200 + 정상 데이터 |
| Auth 단건 404 (hard purge) | `UserInfo.placeholder()` 반환 | 200 + name="(탈퇴 회원)" |
| Auth batch 일부 `notFound[]` 포함 | 해당 ID만 placeholder | 200 + 일부 placeholder |
| Auth 503/timeout | 모든 요청 ID를 placeholder로 채움 + 로그 WARN | 200 + 전체 placeholder |
| Service AT 발급 실패 | 1회 재시도 → 실패 시 placeholder | 200 + placeholder + 알림 |
| Auth lookup 404 (이메일 미등록) | `Optional.empty()` | 호출 Service가 결정 (예: 초대 흐름은 가입 권고 메시지) |

---

## 7. 단계적 전환 계획 (개요 — 상세 Task는 `05-plan.md`)

### Phase 1 — 인프라 (코드만 추가, DB 변경 X)
1. **`HasUserInfo` 인터페이스 + `UserInfoEnricher` 컴포넌트** 작성 (단건/다건/중첩 시그니처)
2. `PersonInfoClient` + `PersonInfoClientImpl` (RestClient 기반, batch 100 chunking 포함)
3. `ServiceAccessTokenProvider` (1h TTL 캐시 + 갱신)
4. `PersonInfoRequestCache` (`@RequestScope`)
5. `UserInfo` + `UserInfo.placeholder()` factory
6. `PersonInfoClientConfig` (RestClient Bean, timeout/retry)
7. 단위 테스트 (Mock 기반 — 정상/404/timeout/batch 부분 실패)

### Phase 2 — 게스트 영역 폐기 (코드 + 데이터)
4. 게스트 Controller/Service/Mapper/Domain 삭제 + 관련 테스트 삭제
5. FE 게스트 페이지/라우트/AuthContext 정리
6. application*.yml 게스트 prop 정리
7. **DB Step 1 — 게스트 데이터 DELETE + 테이블 DROP** (배포 후)

### Phase 3 — 응답 조합 layer 적용 (DB 변경 전, 안전 모드)
8. Mapper XML에서 PII 컬럼 SELECT 제거 (NULL 처리는 응답 조합 layer가 메꿈)
9. Service 8곳에 PersonInfoClient 호출 + 응답 조합 적용
10. **이 단계 완료 시점에 학심정은 PII 컬럼이 존재하지만 SELECT 안 함 → 안전 검증 가능**

### Phase 4 — DB 컬럼 DROP (Point of No Return)
11. **DB Step 2~4 — user/group_member/counseling_student PII 컬럼 DROP**
12. Domain 클래스 필드 제거
13. Mapper INSERT/UPDATE 컬럼 제거

### Phase 5 — 프론트엔드 정리
14. User 타입 정리 + placeholder 컴포넌트 + 영향 컴포넌트 매핑 수정
15. 통합 테스트

### Phase 6 — 검증 (Point of Verification)
16. DB Step 6 — 검증 쿼리 실행 (PII 잔재 0건 확인)
17. 부하/성능 검증 (Auth API 호출 횟수, p95 응답 시간)
18. Auth 장애 시뮬레이션 — placeholder 동작 확인

---

## 8. 검증 전략

### 8.1 단위 테스트

- `PersonInfoClient` mock 기반 테스트 (Auth 호출 성공/404/timeout/batch 부분 실패)
- `PersonInfoRequestCache` 동일 요청 안 재호출 확인
- `ServiceAccessTokenProvider` 토큰 만료 자동 갱신 확인

### 8.2 통합 테스트

- `@SpringBootTest` + WireMock으로 Auth 가짜 서버 띄우고 시나리오 검증:
  - 단건/배치/lookup 정상
  - notFound placeholder 적용
  - Auth 503 시 학심정 200 유지

### 8.3 개발 서버 시나리오 검증 (Phase 6)

- 그룹 멤버 목록 (정상)
- 그룹 멤버 목록 (멤버 중 1명 탈퇴 — placeholder 표시)
- 검사 결과 보고서 (학급 30명 — batch 호출 1회)
- 상담 기록 조회 (1년 전 학생 표시)
- 초대 이메일 발송 (회원/비회원 양쪽)
- Auth 일시 차단 후 페이지 로딩 (placeholder 표시 + 5xx 미발생)

### 8.4 성능 검증

| 시나리오 | 기준 |
|:---|:---|
| 그룹 멤버 목록 (30명) | p95 응답 시간 +200ms 이하 |
| 검사 보고서 (30명) | 동일 페이지에서 Auth API 호출 1회만 (RequestCache 동작) |
| Auth `/batch` 100건 초과 | 자동 chunking 확인 |

---

## 9. 롤백 전략

### 9.1 Phase 별 롤백 가능성

| Phase | 롤백 |
|:---|:---|
| Phase 1 | 코드만 추가 — 손쉽게 revert |
| Phase 2 (게스트 폐기, 데이터 삭제 후) | **데이터 복구 = 백업 복원**. 코드는 revert 가능 |
| Phase 3 (응답 조합 layer) | 코드 revert로 복귀 (DB는 미변경) |
| Phase 4 (DDL DROP) | **Point of No Return**. 백업 복원 외 방법 없음 |
| Phase 5 (FE) | 코드 revert 가능 |

### 9.2 운영 체크포인트

- **Phase 4 (DDL DROP) 직전에 운영 백업 1회 더 + Phase 3까지의 안전성 검증 완료 확인**
- 백업 mysqldump 파일을 별도 보관 (최소 30일)

---

## 10. 후속 작업 (별도 PR 권장)

### 10.1 tc_id / stdt_id → sp_user_id 통일 (★ 우선순위 높음)

**문제**: 학심정 자체 채번한 `tc_id`(교사) / `stdt_id`(학생)이 `sp_user_id`와 별도로 존재 — 본질적으로 이중 식별자. 게스트 폐기로 통합 식별자 필요성이 사라졌으므로 `sp_user_id`로 통일 가능.

**영향 규모 (2026-05-22 측정)**: 약 **567건 / 67 파일**
- Backend MyBatis XML: 264건 (DgnssMapper.xml만 203건)
- Backend Java: 182건 / 28 파일
- Frontend: 121건 / 30+ 파일

**일정 추정**: 5~8주 (본 PR과 비슷한 규모)

**의존 관계**: 본 PR(IDP 회원정보 전환) 완료 후 진행 — sp_user_id가 PK 역할로 자리잡은 후 안전.

**핵심 작업**:
1. 검사 이력 테이블(`dgnss_*`)의 stdt_id를 sp_user_id로 일괄 UPDATE (수십만 row 가능)
2. user/group_member 테이블에서 tc_id/stdt_id 컬럼 DROP
3. API 응답 형식 변경 — FE/외부 시스템 영향 협의 필요 (breaking change)
4. 28 Service + 9 XML + 30 FE 파일 수정

**리스크**:
- 검사 이력 데이터 무결성 (sp_user_id 미매핑 row 발생 가능)
- API 응답 형식 변경 = breaking change
- 1년치 검사 이력 마이그레이션 부담

### 10.2 기타

- Admin 영역 회원 목록 화면이 필요한 경우 Auth `/users/lookup` + 별도 Auth 측 LIKE 검색 API 협의
- Auth 측 `gender` 필드 노출 정책 변경 시 학심정 검사 보고서 통합 (현 상태는 학심정 검사 결과 테이블에서 직접 표시)
- 회원 통계/지표 화면 (이름 표시 필요 시 batch 호출 캐시 정책 재검토)

---

## 11. 참조

- 작업 개요: `00-overview.md`
- 영향도 매핑: `01-impact-mapping.md`
- 케이스 분석서 (선행): `backend/docs/superplatform-auth/personal-data-policy-case-analysis.md`
- 선행 SSO 통합: `backend/docs/superplatform-auth/final/PROGRESS.md`
- Auth UserController 코드: `C:/vs-workspace/superplatform-auth/backend/core-api/src/main/java/com/vs/stcore/domain/user/controller/UserController.java`
