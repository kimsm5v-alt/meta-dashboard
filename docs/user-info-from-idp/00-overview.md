# IDP 회원정보 API 전환 — 작업 개요

**시작일**: 2026-05-22
**브랜치**: `feature/user-info-from-idp`
**범위**: 학심정 백엔드 + 프론트엔드 + DB 스키마
**관련 SSO 통합**: `backend/docs/superplatform-auth/` (이미 완료된 선행 작업)

---

## 1. 작업 요지 (사용자 확정)

> superplatform-auth(IDP)의 **회원정보 API를 이용해서 조회 시마다 받아오고**, 학심정 DB에는 **이름·이메일 정보를 저장하지 않는다.**

### 1.1 명시된 결정사항

| 항목 | 결정 |
|:---|:---|
| 학심정 DB에서 제거 | **name(nickname), email** |
| 조회 방식 | superplatform-auth 회원정보 API 호출 |
| 호출 주기 | **매 조회시마다** (캐시 명시 X) |

### 1.2 분석서 기준 케이스 위치

- 2026-04-16 분석서 (`backend/docs/superplatform-auth/personal-data-policy-case-analysis.md`)의 **케이스 B를 부분 적용**
- 2026-04-17 확정 정책(`final/00-policy.md`)은 **케이스 C(학심정 DB에도 동기화)**였으나, 본 작업으로 **부분 케이스 B로 정책 전환**

### 1.3 본 작업 범위 확정 (이번 결정)

| 학심정 컬럼 | 케이스 C 기준 (현행) | 본 작업 결정 |
|:---|:---:|:---:|
| `user.email` | 유지 (동기화) | **DROP** |
| `user.nickname` | 유지 (동기화) | **DROP** |
| `user.gender` | 유지 | 유지 (Auth가 gender 미노출 — 의도적 제외) |
| `user.role_code` / `tc_id` / `stdt_id` | 유지 (학심정 서비스 데이터) | 유지 |
| `user.sp_user_id` | (SSO 통합으로 이미 추가됨) | **유일한 사용자 식별 키** |
| `group_member.nickname` / `email` | 유지 (비정규화) | **DROP** (조회 시 Auth 호출) |
| `group_member.gender` | 유지 | 유지 (학심정 자체 수집) |
| `counseling_student.stdt_name` | 유지 (스냅샷) | **결정 필요** (이력성 데이터) |
| `group_invitation.email` | 유지 | **결정 필요** (초대 흐름 재설계 필요) |
| `guest_conversion_log.guest_email` | 유지 | **결정 필요** (이력성 감사 로그) |

---

## 2. Auth(IDP) 측 회원정보 API — 발견 사항

### 2.1 사용 가능한 엔드포인트 3개

`superplatform-auth/backend/core-api/.../user/controller/UserController.java`

| HTTP | 경로 | 용도 | 인증 |
|:---:|:---|:---|:---|
| GET | `/api/v1/users/{publicUserId}` | 회원 **단건** 조회 | 사용자 AT 또는 service AT (`scope=users:read`) |
| POST | `/api/v1/users/batch` | 회원 **일괄** 조회 (최대 **100건**) | 동일 |
| POST | `/api/v1/users/lookup` | **이메일 → publicUserId** 매핑 | service AT 전용 |

### 2.2 응답 DTO (`UserPublicResponse`)

```java
public record UserPublicResponse(
    String publicUserId,
    String name,             // ★ 학심정이 필요
    String nickname,         // ★ 학심정이 필요
    String email,            // ★ 학심정이 필요
    String schoolName,
    String schoolGrade,
    String schoolCode,
    String profileImageUrl,
    String userType,
    String status
) {}
```

> **gender 의도적 제외** — Auth 문서 명시: "사적 정보로 RP 일괄 노출 대상 아님 (마이페이지 self 응답에서만 노출)". 학심정이 gender를 계속 자체 수집·저장하는 결정과 일치.

### 2.3 배치 응답 (`UserBatchResponse`)

```java
public record UserBatchResponse(
    List<UserPublicResponse> users,
    List<String> notFound    // 조회 실패한 publicUserId 목록 (탈퇴 등)
) {}
```

---

## 3. 학심정 측 영향 — 1차 추출 결과

### 3.1 백엔드 Java (8개 서비스/컨트롤러)

`getEmail()` / `getNickname()` / `setEmail()` / `setNickname()` / `getStdtName()` 호출:

1. `admin/service/AdminUserDetailsService.java`
2. `api/counseling/service/CounselingService.java`
3. `api/sso/service/SsoUserQueryService.java`
4. `api/member/service/MemberService.java`
5. `api/member/controller/MemberController.java`
6. `api/guest/service/GuestAuthService.java`
7. `api/group/service/GroupService.java`
8. `api/group/service/GroupInvitationService.java`

### 3.2 백엔드 MyBatis XML (11개 매퍼)

`email|nickname|stdt_name|MEM_NM` 패턴 매치:

1. `admin/AdminAccountMapper.xml` (Admin 영역 — 제외 가능성)
2. `common/FileMapper.xml`
3. `dgnss/DgnssMapper.xml` (★ `nickname AS MEM_NM` 다수)
4. `ai/AiBugReportMapper.xml`
5. `group/GroupQueryMapper.xml`
6. `member/UserMapper.xml`
7. `group/GroupMemberMapper.xml`
8. `group/GroupInvitationMapper.xml`
9. `member/EmailVerificationMapper.xml` (게스트 이메일 인증 — 유지)
10. `guest/GuestConversionLogMapper.xml`
11. `counseling/CounselingStudentMapper.xml`

### 3.3 프론트엔드 영향

분석서(`personal-data-policy-case-analysis.md`) 4.4절 추정: 타입 정의 3개 + 페이지/컴포넌트 15+개. 본 작업에서 1차 추출 예정 (`01-impact-mapping.md`).

---

## 4. 결정 필요 항목 (브레인스토밍 대상)

분석서 4.5절이 미리 짚어둔 5가지 + 본 작업에서 추가 발견 → 영향도 재검증으로 **5가지로 축소** (D는 해소):

### A. 캐시 정책
- 사용자 결정: **"조회 시마다"** = 캐시 없음 명시
- 검토: 학급 30명 그룹 페이지 1회 로딩 → batch API 1회 (예상 50~200ms). 트래픽/UX 측면에서 진짜 0초 캐시로 가는지, HTTP `Cache-Control` 수준은 OK인지

### B. 게스트(Auth 미가입) 처리
- 게스트는 Auth에 계정 없음 → publicUserId 없음
- group_member에 게스트 nickname/email 저장 중인데 이를 어떻게 처리?
  - (a) 게스트만 예외로 학심정 저장 유지
  - (b) 게스트 토큰 발급 시 Auth가 게스트 ID도 부여하도록 협의
  - (c) 게스트 JWT Claims에만 보관

### C. 이력성 데이터
- `counseling_student.stdt_name` — 1년 전 상담 기록의 학생 이름을 어떻게 표시?
  - (a) 매번 Auth 조회 — 학생이 탈퇴/이름 변경 시 이력 표시 영향
  - (b) 신규는 ID 참조, 기존 스냅샷은 그대로 유지
  - (c) 모두 삭제 (이력 손실)
- `guest_conversion_log.guest_email` — 감사 로그 의미상 시점 보존 필요할 수도

### D. Admin 회원 검색 — ~~결정 필요~~ ✅ **해소**
- 1차 추정: `WHERE email/nickname LIKE '%kw%'` 6곳 운영 추정
- **재검증 결과**: Java 호출 0건. Admin 폐기와 함께 dead query (정리 대상).
- **결론**: 학심정에 이름/이메일 LIKE 검색 기능 없음 → Auth API 추가 요청 불필요.

### E. group_invitation.email
- 초대 대상이 아직 학심정에 가입 안 했을 수도 (Auth 가입은 했지만)
- email로 lookup → publicUserId 추출 후 저장? 또는 email 유지?

### F. PersonInfoClient 아키텍처
- WebClient 기반 비동기? RestTemplate 동기?
- service AT 발급/캐시/갱신 패턴 (1h TTL)
- batch 100 초과 시 chunking
- Auth 장애 시 fallback (응답에 unknown name 표시? 503?)

---

## 5. 진행 흐름 (계획)

1. **00-overview.md** (본 문서) — 작업 요지/발견/결정 필요 항목 정리 ✅
2. **01-impact-mapping.md** — 영향도 자동 추출 (Java/XML/FE 라인 단위)
3. **02-auth-api-spec.md** — Auth API 호출 시나리오/스코프/에러 케이스 상세
4. **03-brainstorming-decisions.md** — 4장의 결정 필요 항목 풀어가기
5. **04-design.md** — 최종 설계 (PersonInfoClient + 캐시 정책 + 단계적 전환)
6. **05-plan.md** — Task 단위 구현 계획
7. **06-progress.md** — 진행 상황 추적
8. (이후) **07-ddl.md**, **08-migration.md** 등 DDL/이관 단계

---

## 6. 참조

- 선행 SSO 통합: `backend/docs/superplatform-auth/final/PROGRESS.md`
- 케이스 분석서: `backend/docs/superplatform-auth/personal-data-policy-case-analysis.md`
- 확정 정책 (변경 전): `backend/docs/superplatform-auth/final/00-policy.md`
- DDL 계획 (변경 전): `backend/docs/superplatform-auth/final/01-DDL.md`
