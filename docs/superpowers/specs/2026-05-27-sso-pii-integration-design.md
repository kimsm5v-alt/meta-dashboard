# SSO 재설계 ↔ PII 제거 통합 설계

**작성일**: 2026-05-27
**브랜치**: `feature/sso-integration` (feature/user-info-from-idp 기반)
**관련**: `docs/user-info-from-idp/04-design.md` (IDP 전환 원 설계)

---

## 1. 배경 · 목표 · 범위

### 배경
두 작업이 같은 영역(SSO user 동기화 + group_member/user PII)을 **다른 전제로** 진행됨:
- `feature/user-info-from-idp` — 회원 PII(name/email/nickname/gender)를 학심정 DB 에서 제거하고 IDP `/api/v1/users` 로 매 요청 조회. PII 컬럼 DROP 완료(로컬 검증 끝).
- `vs-develop` 의 SSO 재설계 — **PII 컬럼이 살아있던 시절** 설계. IdP 이벤트 폴링(탈퇴 cascade) + `SsoUserResolveService`(resolve/마이그레이션/재가입 감지) 도입. `SsoUserMigrationService` 삭제.

### 목표
vs-develop 의 SSO 구조를 `sso-integration` 으로 가져와 **PII 제거 방향에 맞게 조정**하여 통합.

### 범위 · 제약
- 모든 작업은 `sso-integration` 브랜치 내에서만. `vs-develop` 은 **읽기 전용(불변)** — 그쪽이 테스트 중.
- `vs-develop → sso-integration` 방향(가져오기)만. `sso-integration → vs-develop`(반영) ❌.
- 원격 push ❌ (사용자 명시 시까지). 산출물 = sso-integration 에 컴파일·테스트·BE부팅 검증된 통합본.

---

## 2. 핵심 설계 결정 — email 기반 감지 완전 제거

`SsoUserResolveService.resolveOrProvision` 의 email 분기 2개를 **둘 다 제거**:

| 분기 | 제거 근거 |
|:---|:---|
| 2-a 재가입 (같은 email, 다른 sp_user_id) | IdP 탈퇴 → **이벤트 폴링이 옛 row 를 WITHDRAWN** → 재가입 시 신규 sp_user_id 라 자동가입(빈 계정). 인격분리 동일 결과 |
| 2-b 마이그레이션 (같은 email, sp_user_id 없음) | **운영 미오픈 + 마이그레이션 자체가 없음**. 모든 회원이 sp_user_id 보유 (unmapped 0) |

### 통합 후 resolve 로직
```java
public User resolveOrProvision(SpAuthenticatedUser spUser) {
    User user = ssoUserQueryService.findBySpUserId(spUser.spUserId());
    if (user != null) return user;
    // email 분기(2-a/2-b) 제거 — 재가입은 이벤트 폴링이 담당, 마이그레이션 없음
    return registerIfAutoRegistrable(spUser);  // TEACHER/STUDENT 자동가입, 그 외 null
}
```
- `userMapper.findByEmail` 호출 제거 → feature 의 `findByEmail` 폐기와 일치 (PII email 의존 0)
- `SsoUserMigrationService` 삭제 수용 (develop 방향)

### 탈퇴(withdraw) 처리 — 변경 없이 채택 + PII 조정만
이벤트 폴링(REVOCATION/DELETION) → `SsoUserWithdrawalService.withdraw` [단일 트랜잭션]:
- ① `user` 테이블: `markWithdrawn` → status='WITHDRAWN' (**row 보존**, DELETE 아님)
- ② `group_member`: `withdrawByUserNo` → status='WITHDRAWN'
- ③ `group_info`: `deactivateByHostUserNo` → host 그룹 비활성

정책 = **"탈퇴 = 인격 분리"**: 계정은 끊되(status/sp_user_id 분리) 업무기록(상담/메모/생기부)은 보존, audit FK 무결성 유지.

---

## 3. 충돌 / 검토 파일 처리 규칙 (9개)

`git merge-tree` 사전 분석 결과.

### 텍스트 충돌 2건 (수동 해결 필수)
| 파일 | 처리 |
|:---|:---|
| `SsoUserMigrationService.java` | **삭제 채택**(develop). feature 수정분 버림 |
| `GroupMemberMapper.java` | **양쪽 반영** — develop `withdrawByUserNo` 추가 + feature `syncSnapshotByUserNo`/게스트 dead 메서드 삭제 |

### Auto-merge 되지만 semantic 검토 필수 — 진입점 3곳
auto-merge 가 `migrateBySpUserId`(feature)와 `resolveOrProvision`(develop)을 **둘 다 남길 위험**. develop 의 `resolveOrProvision` 단일 호출로 정리됐는지 반드시 확인.
- `MemberController.java`
- `UserProfileController.java`
- `SpUserMappingFilter.java`

### Auto-merge + PII 관점 확인
| 파일 | 확인 |
|:---|:---|
| `UserMapper.java` / `UserMapper.xml` | feature 의 `findByEmail`/`findByEmailAndStatus` 폐기 유지 (develop 이 되살리지 않게). 단 develop `markWithdrawn` 추가분은 §4 조정 |
| `DgnssMapper.xml` | feature 의 PII 제거 + GROUP_CONCAT 재설계(`;;` 구분자) 유지 + develop 검사2회차 2줄 병존. **추가로 §4-5 gender 정리 동반** |
| `application.yml` | feature `superplatform.auth.internal-api` + develop `sso.poll` 블록 둘 다 |
| `SecurityConfig.java` | feature 게스트 폐기 + develop 401 사유 로깅/WWW-Authenticate 둘 다 |

---

## 4. PII 의존 제거 지점 (4곳)

develop SSO 코드가 DROP 된 컬럼(email/nickname)을 참조 → PII 없는 방향 조정:

| # | 위치 | 현재(develop) | 조정 |
|:--:|:---|:---|:---|
| 1 | `SsoUserResolveService` email 분기 | `userMapper.findByEmail(spUser.email())` | **분기 통째 제거** (§2) |
| 2 | `SsoUserWithdrawalService` 로그 | `PiiMasker.email(user.getEmail())` | `user.getEmail()`(필드 없음) → sp_user_id 마스킹 로그 |
| 3 | `GroupMemberMapper.xml withdrawByUserNo` | `SET status, nickname='탈퇴한 회원', email=NULL, left_at` | nickname/email SET 제거 → `status, left_at` 만 |
| 4 | `UserMapper.xml markWithdrawn` | `SET status, email=CONCAT(...), nickname='탈퇴한 회원', tc_id=NULL, stdt_id=NULL, sp_user_id=NULL` | email/nickname SET 제거 → `status, tc_id=NULL, stdt_id=NULL, sp_user_id=NULL` |
| 5 | `DgnssMapper.xml` `gm.gender` 26줄 (~20개 쿼리) | `gm.gender AS MEM_GENDER`, `CASE WHEN gm.gender='M'...` 등 | **gender 표시 폐기** — `group_member.gender` 컬럼 DROP 됨 + Auth 미반환이라 enrich 불가. CASE/SELECT 제거, 응답 키(MEM_GENDER/gender)는 빈 문자열 또는 키 제거(FE 확인 필요) |

> `sp_user_id=NULL` 은 유지 — 탈퇴 row 의 SP 매핑을 떼어내는 게 인격분리 핵심.

### §4-5 보충 — feature Phase 4 누락 보완
이 gender 정리는 SSO 통합과 무관한 **feature 자체 누락 버그**다 (commit `8d2993a` "gender 는 Phase 4 정리 예정" → 컬럼 DROP 만 하고 DgnssMapper 참조 26줄 미정리). 영향 쿼리: `getDgnssReportLS`, `getDgnssReportValidity`, `selectDgnssAnswerReport{Behavior,Motivate,Recognition,Reliability}`(+FromOtherClasses), `selectLernType2~6`(+FromOtherClasses) 등 검사 보고서 분석 쿼리. 현재 호출 시 `Unknown column 'gm.gender'` 런타임 에러. 사용자 결정으로 **통합 작업에 포함**하여 함께 정리.

---

## 5. 검증 방법

1. `./gradlew :backend:compileJava :backend:compileTestJava` — findByEmail 등 PII 잔재 없어 컴파일 통과
2. `./gradlew :backend:test --rerun-tasks` — 기존 24 pass 유지 + develop 의 이벤트 폴링 신규 테스트 통과
3. BE 부팅(`bootRun`, profile=local) + `docs/user-info-from-idp/verify-enrich.sh` 재실행 — enrich 5종 PASS 유지
4. SSO 이벤트 폴링은 `sso.poll.enabled=false` 기본 → 로컬 부팅 영향 없음. 폴링 로직 검증은 단위 테스트로.

---

## 6. 통합 작업 순서 (개요 — 상세는 implementation plan)

1. `sso-integration` 체크아웃 확인 + working-copy noise 처리(stash 또는 commit 분리)
2. `git merge vs-develop` 실행
3. 텍스트 충돌 2건 해결 (§3)
4. 진입점 3곳 semantic 검토 — resolveOrProvision 단일화 (§3)
5. PII 조정 5곳 적용 (§4 — markWithdrawn/withdrawByUserNo XML, resolve, withdrawal 로그, **DgnssMapper gender 26줄**)
6. resolveOrProvision email 분기 제거 (§2)
7. 컴파일 + 테스트 + BE부팅 + verify-enrich.sh (§5)
8. 머지 커밋 (sso-integration 에만, push 안 함)

---

## 7. 보류 / 범위 외

- `sso-integration → vs-develop` 반영 — develop 테스트 종료 후 사용자가 직접
- 원격 push — 사용자 명시 시
- dev/prod DDL 적용 (`02-pii-column-drop.sql`) + SSO 폴링 운영 설정(`SSO_POLL_ENABLED`, `events:read` scope, `sso_poll_cursor` 초기 INSERT) — 운영 일정
- `PersonInfoClientImpl.getOne()` 404 fragile 경로 정리 — 후속
