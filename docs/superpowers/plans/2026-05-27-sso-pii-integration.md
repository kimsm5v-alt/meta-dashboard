# SSO 재설계 ↔ PII 제거 통합 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (권장 — 머지는 단일 트랜잭션이라 중간 커밋 불가) to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** vs-develop 의 SSO 재설계(이벤트 폴링/탈퇴 cascade/resolveOrProvision)를 `feature/sso-integration` 으로 가져와 PII 제거 방향에 맞게 통합한다.

**Architecture:** `git merge vs-develop` 한 번으로 시작 → 충돌 2건 수동 해결 + 진입점 3곳 semantic 정리 + PII 조정 5곳 → 컴파일/테스트/BE부팅 검증 → 단일 머지 커밋. 전 작업은 `sso-integration` 브랜치 안에서만 (vs-develop 불변, push 안 함).

**Tech Stack:** Java 21, Spring Boot 4.0.5, MyBatis, Git merge.

**설계 출처:** `docs/superpowers/specs/2026-05-27-sso-pii-integration-design.md`

> ⚠️ **머지 특성**: Task 1 의 `git merge` 가 시작되면 머지 진행 상태가 된다. Task 2~10 은 그 상태에서 충돌 해결·조정을 이어서 하고, **커밋은 Task 14 에서 단 한 번**(머지 커밋)이다. 중간에 `git commit` 하지 말 것.

---

## Task 0: 사전 준비

**Files:** 없음 (git 상태 정리)

- [ ] **Step 1: 브랜치 확인**

Run: `git branch --show-current`
Expected: `feature/sso-integration`

- [ ] **Step 2: working-copy noise 확인**

Run: `git status -s`
Expected: `application-local.yml`, `frontend/package.json`, `frontend/package-lock.json` 3개만 (이게 머지를 방해할 수 있음)

- [ ] **Step 3: noise stash (머지 충돌 회피)**

```bash
git stash push backend/src/main/resources/application-local.yml frontend/package.json frontend/package-lock.json
```
Expected: `Saved working directory...`. 머지 끝나고 Task 13 전에 `git stash pop`.

- [ ] **Step 4: 안전 태그 (롤백 지점)**

```bash
git tag pre-sso-merge
```
머지 꼬이면 `git merge --abort` 또는 `git reset --hard pre-sso-merge` 로 복구.

---

## Task 1: 머지 시작 + 충돌 현황 파악

**Files:** 없음

- [ ] **Step 1: 머지 실행 (커밋 보류)**

```bash
git merge --no-commit --no-ff vs-develop
```
Expected: `Automatic merge failed; fix conflicts...` (충돌 2건 예상)

- [ ] **Step 2: 충돌 파일 목록 확인**

Run: `git diff --name-only --diff-filter=U`
Expected: 정확히 2개:
```
backend/src/main/java/com/vs/meta/api/group/mapper/GroupMemberMapper.java
backend/src/main/java/com/vs/meta/api/sso/service/SsoUserMigrationService.java
```

- [ ] **Step 3: 전체 변경 파일 확인 (auto-merge 된 것 포함)**

Run: `git status -s | head -60`
검토 대상 진입점 3곳(MemberController/UserProfileController/SpUserMappingFilter)이 modified 로 보이는지 확인.

---

## Task 2: 충돌 해결 — SsoUserMigrationService.java (삭제 채택)

**Files:**
- Delete: `backend/src/main/java/com/vs/meta/api/sso/service/SsoUserMigrationService.java`

develop 에서 삭제됨(SsoUserResolveService 로 대체), feature 에서 수정함 → **삭제 채택**.

- [ ] **Step 1: 삭제로 충돌 해결**

```bash
git rm backend/src/main/java/com/vs/meta/api/sso/service/SsoUserMigrationService.java
```
Expected: `rm '.../SsoUserMigrationService.java'`

- [ ] **Step 2: 잔여 참조 확인**

Run: `git grep -n "SsoUserMigrationService\|migrateBySpUserId" -- 'backend/src/main/java/**/*.java'`
Expected: 이 시점엔 진입점 3곳에 아직 참조 있을 수 있음 (Task 4 에서 제거). 결과를 기록만.

---

## Task 3: 충돌 해결 — GroupMemberMapper.java (feature + withdrawByUserNo)

**Files:**
- Modify: `backend/src/main/java/com/vs/meta/api/group/mapper/GroupMemberMapper.java`

feature 의 깨끗한 8개 메서드 유지 + develop 의 `withdrawByUserNo` 만 추가. dead 메서드(`updateGuestToStudent`, `findActiveGuestByGroupIdAndEmail`, `syncSnapshotByUserNo`)는 **추가하지 않음**(feature 가 지운 대로).

- [ ] **Step 1: 충돌 해결 — 파일 전체를 아래 내용으로 교체**

```java
package com.vs.meta.api.group.mapper;

import com.vs.meta.domain.GroupMember;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface GroupMemberMapper {

    long countByGroupIdAndStatus(@Param("groupId") Long groupId, @Param("status") String status);

    List<GroupMember> findByGroupIdAndStatus(@Param("groupId") Long groupId, @Param("status") String status);

    boolean existsByGroupIdAndUserNoAndStatus(@Param("groupId") Long groupId, @Param("userNo") Long userNo, @Param("status") String status);

    GroupMember findGroupMemberById(@Param("id") Long id);

    void insertGroupMember(GroupMember groupMember);

    void updateGroupMember(GroupMember groupMember);

    Integer findMaxMemberNoByGroupId(@Param("groupId") Long groupId);

    GroupMember findByGroupIdAndUserNo(@Param("groupId") Long groupId, @Param("userNo") Long userNo);

    /**
     * SSO 탈퇴 cascade — 옛 user_no 의 비종결 멤버십(ACTIVE 등)을 모두 WITHDRAWN 처리.
     * status='WITHDRAWN' 은 어떤 멤버 조회 쿼리에도 매칭되지 않으므로 유령 멤버 발생 안 함.
     */
    int withdrawByUserNo(@Param("userNo") Long userNo);
}
```
> develop 원본 주석의 "nickname/email 스냅샷도 마스킹" 문구는 제거함 — PII 컬럼이 없어 마스킹 안 하므로.

- [ ] **Step 2: 충돌 해소 표시**

```bash
git add backend/src/main/java/com/vs/meta/api/group/mapper/GroupMemberMapper.java
```

- [ ] **Step 3: 충돌 마커 잔여 확인**

Run: `git grep -n "<<<<<<<\|>>>>>>>\|=======" -- backend/src/main/java/com/vs/meta/api/group/mapper/GroupMemberMapper.java`
Expected: 결과 없음

---

## Task 4: 진입점 3곳 semantic 정리 — resolveOrProvision 단일화

auto-merge 가 `migrateBySpUserId`(feature)와 `resolveOrProvision`(develop)을 둘 다 남겼을 수 있음. develop 의 단일 호출로 정리.

**Files:**
- Modify: `backend/src/main/java/com/vs/meta/api/member/controller/MemberController.java`
- Modify: `backend/src/main/java/com/vs/meta/api/sso/controller/UserProfileController.java`
- Modify: `backend/src/main/java/com/vs/meta/common/config/SpUserMappingFilter.java`

- [ ] **Step 1: 각 파일에서 migrate 패턴 검색**

Run:
```bash
git grep -n "ssoUserMigrationService\|migrateBySpUserId\|resolveOrProvision\|findBySpUserId" -- \
  backend/src/main/java/com/vs/meta/api/member/controller/MemberController.java \
  backend/src/main/java/com/vs/meta/api/sso/controller/UserProfileController.java \
  backend/src/main/java/com/vs/meta/common/config/SpUserMappingFilter.java
```

- [ ] **Step 2: MemberController.java 정리**

`SsoUserMigrationService` 필드/import 와 `findBySpUserId → migrateBySpUserId` 2단계 패턴을 제거하고, develop 방식인 단일 호출로 통일:
```java
// 회원 resolve — sp_user_id 매핑 없으면 자동가입(또는 추가정보 입력 유도)
User user = ssoUserResolveService.resolveOrProvision(spUser);
```
- 필드: `private final SsoUserResolveService ssoUserResolveService;` (이미 develop 이 추가했으면 중복 없게)
- `ssoUserMigrationService`, `ssoUserQueryService`(이 호출에서만 쓰였다면) 미사용 필드/import 제거
- 만약 auto-merge 로 `ssoUserMigrationService.migrateBySpUserId` 호출이 남아있으면 삭제

- [ ] **Step 3: UserProfileController.java 정리**

동일 패턴. `status` 핸들러의 resolve 호출을 `ssoUserResolveService.resolveOrProvision(spUser)` 단일로. `ssoUserMigrationService` 필드/import 제거.

- [ ] **Step 4: SpUserMappingFilter.java 정리**

동일. 필터 내 resolve 를 `ssoUserResolveService.resolveOrProvision(spUser)` 로. `ssoUserMigrationService` 필드/import 제거.

- [ ] **Step 5: 미사용 import/필드 잔여 확인**

Run: `git grep -n "SsoUserMigrationService\|migrateBySpUserId" -- 'backend/src/main/java/**/*.java'`
Expected: **결과 0건** (삭제된 서비스 참조가 코드에 전혀 없어야 컴파일됨)

- [ ] **Step 6: 충돌 마커 확인 + add**

```bash
git grep -n "<<<<<<<\|>>>>>>>" -- backend/src/main/java/com/vs/meta/api/member/controller/MemberController.java backend/src/main/java/com/vs/meta/api/sso/controller/UserProfileController.java backend/src/main/java/com/vs/meta/common/config/SpUserMappingFilter.java
git add backend/src/main/java/com/vs/meta/api/member/controller/MemberController.java backend/src/main/java/com/vs/meta/api/sso/controller/UserProfileController.java backend/src/main/java/com/vs/meta/common/config/SpUserMappingFilter.java
```
Expected: 충돌 마커 0건

---

## Task 5: PII 조정 ① — SsoUserResolveService email 분기 제거

**Files:**
- Modify: `backend/src/main/java/com/vs/meta/api/sso/service/SsoUserResolveService.java`

- [ ] **Step 1: resolveOrProvision 의 email 분기(2-a/2-b) 제거**

`resolveOrProvision` 메서드 본문을 아래로 교체:
```java
    @Transactional
    public User resolveOrProvision(SpAuthenticatedUser spUser) {
        // 1) sp_user_id 정상 매핑
        User user = ssoUserQueryService.findBySpUserId(spUser.spUserId());
        if (user != null) return user;

        // 2) email 기반 재가입/마이그레이션 감지는 제거.
        //    - 재가입: IdP 탈퇴 → SSO 이벤트 폴링이 옛 row 를 WITHDRAWN 처리(인격분리). 재가입 시 신규 sp_user_id 자동가입.
        //    - 마이그레이션: 운영 미오픈 + 전환 이전 회원 없음(모든 회원 sp_user_id 보유). PII email 컬럼도 DROP 됨.
        return registerIfAutoRegistrable(spUser);
    }
```

- [ ] **Step 2: 미사용 의존성/import 제거**

email 분기 제거로 다음이 미사용이 됨 — 컴파일 에러 안 나게 정리:
- 필드 `private final UserMapper userMapper;` (다른 곳에서 안 쓰면 제거)
- 필드 `private final SsoUserWithdrawalService ssoUserWithdrawalService;` (resolve 에서만 썼다면 제거)
- import `UserMapper`, `PiiMasker`, `java.time.LocalDateTime` (미사용 시)

> `registerIfAutoRegistrable` / `isAutoRegistrable` private 메서드는 그대로 유지.

- [ ] **Step 3: 확인**

Run: `git grep -n "findByEmail\|userMapper" -- backend/src/main/java/com/vs/meta/api/sso/service/SsoUserResolveService.java`
Expected: 결과 0건

```bash
git add backend/src/main/java/com/vs/meta/api/sso/service/SsoUserResolveService.java
```

---

## Task 6: PII 조정 ② — SsoUserWithdrawalService 로그

**Files:**
- Modify: `backend/src/main/java/com/vs/meta/api/sso/service/SsoUserWithdrawalService.java`

- [ ] **Step 1: getEmail 로그를 sp_user_id 마스킹으로 교체**

`withdraw` 메서드에서:
```java
// 변경 전
String maskedEmail = PiiMasker.email(user.getEmail());
... log.info("... email={} ...", ..., maskedEmail, ...);

// 변경 후 — User.email 필드 없음. sp_user_id 마스킹으로 추적.
String maskedSpUserId = PiiMasker.maskUuid(user.getSpUserId());
... log.info("SSO 탈퇴 처리 완료: userNo={}, spUserId={}, reason={}, userRows={}, memberRows={}, hostGroupRows={}",
        userNo, maskedSpUserId, reason, userRows, memberRows, hostGroupRows);
```
> `PiiMasker.maskUuid` 가 SsoEventPollService 에서 이미 쓰임 — 존재 확인됨. `user.getEmail()` 호출 완전 제거.

- [ ] **Step 2: 확인 + add**

Run: `git grep -n "getEmail\|PiiMasker.email" -- backend/src/main/java/com/vs/meta/api/sso/service/SsoUserWithdrawalService.java`
Expected: 결과 0건
```bash
git add backend/src/main/java/com/vs/meta/api/sso/service/SsoUserWithdrawalService.java
```

---

## Task 7: PII 조정 ③ — GroupMemberMapper.xml withdrawByUserNo

**Files:**
- Modify: `backend/src/main/resources/mapper/group/GroupMemberMapper.xml`

- [ ] **Step 1: withdrawByUserNo 의 nickname/email SET 제거**

`<update id="withdrawByUserNo">` 블록을 아래로:
```xml
    <update id="withdrawByUserNo">
        /* GroupMemberMapper.withdrawByUserNo */
        UPDATE group_member
        SET status     = 'WITHDRAWN',
            left_at    = NOW(),
            updated_by = 0,
            updated_at = NOW()
        WHERE user_no = #{userNo}
          AND status NOT IN ('LEFT', 'KICKED', 'ARCHIVED', 'WITHDRAWN')
    </update>
```
> `nickname = '탈퇴한 회원'`, `email = NULL` 두 줄 삭제. (컬럼 DROP 됨)

- [ ] **Step 2: 이 XML 에 dead 게스트 쿼리/PII 잔재 없는지 확인**

Run: `git grep -n "nickname\|email\|findActiveGuest\|updateGuestToStudent\|syncSnapshot" -- backend/src/main/resources/mapper/group/GroupMemberMapper.xml`
Expected: 결과 0건 (feature 가 이미 정리 + Step 1 으로 withdraw 도 정리). 남아있으면 해당 쿼리도 제거.
```bash
git add backend/src/main/resources/mapper/group/GroupMemberMapper.xml
```

---

## Task 8: PII 조정 ④ — UserMapper.xml markWithdrawn

**Files:**
- Modify: `backend/src/main/resources/mapper/member/UserMapper.xml`

- [ ] **Step 1: markWithdrawn 의 email/nickname SET 제거**

`<update id="markWithdrawn">` 블록을 아래로:
```xml
    <update id="markWithdrawn">
        /* UserMapper.markWithdrawn */
        UPDATE `user`
        SET status      = 'WITHDRAWN',
            tc_id       = NULL,
            stdt_id     = NULL,
            sp_user_id  = NULL,
            updated_by  = 0,
            updated_at  = NOW()
        WHERE user_no = #{userNo}
    </update>
```
> `email = CONCAT(...)`, `nickname = '탈퇴한 회원'` 두 줄 삭제. `sp_user_id=NULL` 은 유지(인격분리 핵심).

- [ ] **Step 2: 이 XML 에 findByEmail/email/nickname 잔재 없는지 확인**

Run: `git grep -n "findByEmail\|findByEmailAndStatus\|nickname\|[^_]email" -- backend/src/main/resources/mapper/member/UserMapper.xml`
Expected: 결과 0건. develop 이 되살린 `findByEmail`/`findByEmailAndStatus`/INSERT 의 email·nickname/keyword LIKE 가 남아있으면 **전부 제거**(feature 정리본 기준).
```bash
git add backend/src/main/resources/mapper/member/UserMapper.xml
```

> 참고: `UserMapper.java` 인터페이스도 `findByEmail`/`findByEmailAndStatus` 가 develop 머지로 되살아났을 수 있음 → Task 10 에서 확인.

---

## Task 9: PII 조정 ⑤ — DgnssMapper.xml gender 26줄 제거 (feature 누락 보완)

**Files:**
- Modify: `backend/src/main/resources/mapper/dgnss/DgnssMapper.xml`

`gm.gender` 참조 전부 제거. 두 형태: (1) `gm.gender AS MEM_GENDER` SELECT 컬럼, (2) `CASE WHEN gm.gender='M' THEN '남자' ... END AS ...` 블록.

- [ ] **Step 1: 머지 후 gm.gender 참조 라인 수 확인**

Run: `git grep -c "gm\.gender" -- backend/src/main/resources/mapper/dgnss/DgnssMapper.xml`
Expected: 26 내외 (feature 26 + develop auto-merge 분 — develop 이 더 많아 머지 결과는 더 클 수 있음. 실제 수 기록)

- [ ] **Step 2: gm.gender 참조 라인 전부 출력해서 형태 파악**

Run: `git grep -n "gm\.gender" -- backend/src/main/resources/mapper/dgnss/DgnssMapper.xml`

- [ ] **Step 3: 각 참조 제거**

각 매칭을 형태별로 처리:
- `, gm.gender AS MEM_GENDER` 또는 `gm.gender AS MEM_GENDER,` → 그 줄 삭제 (앞뒤 콤마 정합 유지)
- 여러 줄에 걸친 `CASE WHEN gm.gender = 'M' THEN '남자' WHEN gm.gender = 'F' THEN '여자' ... END AS MEM_GENDER_NM` (또는 `AS gender`) → CASE 블록 전체 삭제 (선행 콤마 포함)
- 한 줄 `, CASE WHEN gm.gender = 'M' THEN '남자' WHEN gm.gender = 'F' THEN '여자' ELSE '' END AS gender` → 그 줄 삭제

> SELECT 절 콤마 정합 주의: 마지막 컬럼이었으면 앞 줄의 trailing 콤마도 정리. 각 수정 후 그 쿼리의 SELECT 절이 문법적으로 온전한지 눈으로 확인.

- [ ] **Step 4: gm.gender 완전 제거 확인**

Run: `git grep -c "gm\.gender" -- backend/src/main/resources/mapper/dgnss/DgnssMapper.xml`
Expected: **0**

- [ ] **Step 5: GROUP_CONCAT ;; 구분자 + sp_user_id 재설계가 유지됐는지 확인 (feature 채택)**

Run: `git grep -n "SEPARATOR ';;'\|&#x1E;\|sp_user_id.*member_no" -- backend/src/main/resources/mapper/dgnss/DgnssMapper.xml`
Expected: `;;` 존재, `&#x1E;` 0건. develop 의 `CONCAT(gm.member_no, '번', gm.nickname)`(line 2999 류) 같은 nickname 잔재가 머지로 들어왔으면 제거.

- [ ] **Step 6: nickname 잔재도 확인**

Run: `git grep -n "gm\.nickname" -- backend/src/main/resources/mapper/dgnss/DgnssMapper.xml`
Expected: feature 의 GROUP_CONCAT raw(`u.sp_user_id`) 재설계만 남고, develop 의 `gm.nickname` SELECT/CONCAT 직접 참조는 0건. 남아있으면 sp_user_id 기반으로 정리(Phase 3 패턴).
```bash
git add backend/src/main/resources/mapper/dgnss/DgnssMapper.xml
```

---

## Task 10: 나머지 auto-merge 파일 PII 관점 검증

**Files:**
- `backend/src/main/java/com/vs/meta/api/member/mapper/UserMapper.java`
- `backend/src/main/resources/mapper/counseling/CounselingStudentMapper.xml`
- `backend/src/main/resources/mapper/group/GroupQueryMapper.xml`
- `backend/src/main/resources/mapper/common/FileMapper.xml`
- `backend/src/main/resources/application.yml`
- `backend/src/main/java/com/vs/meta/common/config/SecurityConfig.java`

- [ ] **Step 1: UserMapper.java 에 findByEmail 되살아났나 확인**

Run: `git grep -n "findByEmail\|findByEmailAndStatus" -- backend/src/main/java/com/vs/meta/api/member/mapper/UserMapper.java`
Expected: 0건. 있으면 메서드 선언 제거(feature 정리본 기준).

- [ ] **Step 2: 전체 mapper PII 잔재 전수 스캔 (group_invitation/admin 제외)**

Run:
```bash
git grep -nE "gm\.nickname|gm\.email|gm\.gender|stdt_name|\.nickname AS|\.email AS" -- 'backend/src/main/resources/mapper/**/*.xml' | grep -viE "GroupInvitation|admin/|AdminAccount|reporter|resolver"
```
Expected: 결과 0건. CounselingStudentMapper(stdt_name), GroupQueryMapper(nickname/email/hostNickname), FileMapper(gm_st.nickname) 에 develop 잔재가 머지로 들어왔으면 feature 정리본 기준으로 제거.
> AiBugReportMapper 의 `reporter.email`/`reporter.nickname` 은 별도 — develop 신규 기능. Task 12 테스트에서 확인.

- [ ] **Step 3: application.yml — 양쪽 블록 공존 확인**

Run: `git grep -n "internal-api\|sso:\|poll:" -- backend/src/main/resources/application.yml`
Expected: feature 의 `superplatform.auth.internal-api` + develop 의 `sso.poll` 둘 다 존재. 충돌 마커 없음.

- [ ] **Step 4: 충돌 마커 전역 스캔**

Run: `git grep -n "<<<<<<<\|>>>>>>>\|=======" -- 'backend/**'`
Expected: 결과 0건 (`=======` 는 주석/구분선 오탐 가능 — `<<<`/`>>>` 가 0이면 OK)

- [ ] **Step 5: 검토 끝난 파일 add**

```bash
git add backend/src/main/java/com/vs/meta/api/member/mapper/UserMapper.java \
        backend/src/main/resources/mapper/counseling/CounselingStudentMapper.xml \
        backend/src/main/resources/mapper/group/GroupQueryMapper.xml \
        backend/src/main/resources/mapper/common/FileMapper.xml \
        backend/src/main/resources/application.yml \
        backend/src/main/java/com/vs/meta/common/config/SecurityConfig.java
```

- [ ] **Step 6: 남은 unmerged 파일 없는지 확인**

Run: `git diff --name-only --diff-filter=U`
Expected: 결과 0건 (모든 충돌 해소)

---

## Task 11: 컴파일 검증

**Files:** 없음

- [ ] **Step 1: 메인 + 테스트 컴파일**

Run: `./gradlew :backend:compileJava :backend:compileTestJava --console=plain 2>&1 | tail -20`
Expected: `BUILD SUCCESSFUL`. 실패 시 — 대개 미사용 import / 삭제 서비스 참조 / SsoUserMigrationService 잔존 참조. 에러 메시지의 파일:라인 보고 해당 Task 로 돌아가 정리.

- [ ] **Step 2: SsoUserMigrationService 참조 전무 재확인**

Run: `git grep -rn "SsoUserMigrationService\|migrateBySpUserId" -- 'backend/src'`
Expected: 0건 (테스트 포함)

---

## Task 12: 테스트 검증

**Files:** 필요 시 `backend/src/test/...` 의 SsoUserMigrationService 참조 테스트 수정

- [ ] **Step 1: 전체 테스트**

Run: `./gradlew :backend:test --rerun-tasks --console=plain 2>&1 | tail -20`
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 2: 테스트 결과 집계**

Run (PowerShell):
```powershell
Get-ChildItem backend/build/test-results/test/*.xml | ForEach-Object { [xml]$x = Get-Content $_.FullName; [PSCustomObject]@{ Suite=$_.BaseName.Replace('TEST-com.vs.meta.',''); Tests=[int]$x.testsuite.tests; Fail=([int]$x.testsuite.failures + [int]$x.testsuite.errors) } } | Format-Table -AutoSize
```
Expected: Fail=0 전부. feature 의 24 pass + develop 의 SSO 폴링 신규 테스트 통과. 만약 SsoUserMigrationService/migrate 참조 테스트가 develop 에 있으면 resolveOrProvision 기준으로 수정.

---

## Task 13: BE 부팅 + enrich 회귀 검증

**Files:** 없음

- [ ] **Step 1: stash 복원 (application-local.yml)**

```bash
git stash pop
```
Expected: working tree 에 noise 3개 복원. (충돌 시 application-local.yml 우선 — 로컬 설정)

- [ ] **Step 2: podman 컨테이너 확인**

Run: `podman ps --format "table {{.Names}}\t{{.Status}}"`
Expected: mysql-meta / redis-meta / neo4j-meta 모두 Up. 아니면 `podman machine start; podman start mysql-meta redis-meta neo4j-meta`

- [ ] **Step 3: 8081 포트 정리 후 BE 기동**

```powershell
Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```
그 다음 (background): `./gradlew :backend:bootRun -Dspring.profiles.active=local --console=plain`
Expected: 로그에 `Started MetaApplication`. SSO 폴링은 `sso.poll.enabled=false` 라 부팅 영향 없음.

- [ ] **Step 4: health + enrich 전수 검증**

```bash
curl -s -o /dev/null -w "health=%{http_code}\n" http://localhost:8081/actuator/health
export META_TOKEN='<교사 토큰 — 만료 시 재발급>'
bash docs/user-info-from-idp/verify-enrich.sh
```
Expected: health=200, verify-enrich PASS 5/0. (토큰 만료 시 사용자에게 재요청)

- [ ] **Step 5: BE 종료**

```powershell
Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

---

## Task 14: 머지 커밋

**Files:** 없음

- [ ] **Step 1: 스테이징 최종 확인 (noise 제외)**

Run: `git status -s`
Expected: backend/src 변경들이 staged(`M`/`D`), noise 3개(application-local.yml, frontend/*)는 unstaged. noise 가 staged 면 `git restore --staged <file>`.

- [ ] **Step 2: 머지 커밋**

```bash
git commit -m "[BACKEND] vs-develop SSO 재설계 통합 — resolveOrProvision email 분기 제거(이벤트폴링 대체) + PII 조정 5곳(group_member/user markWithdrawn XML, withdrawal 로그, DgnssMapper gender 26줄) + SsoUserMigrationService 삭제 수용"
```
> 머지 커밋이므로 자동으로 두 부모(sso-integration + vs-develop) 연결됨.

- [ ] **Step 3: 결과 확인**

Run: `git log --oneline --graph -5`
Expected: 머지 커밋이 sso-integration HEAD, 두 부모.

- [ ] **Step 4: 안전 태그 정리**

```bash
git tag -d pre-sso-merge
```

> **push 안 함. develop 반영 안 함.** (설계 §7 — 사용자 명시 시까지 보류)

---

## 완료 기준

- [ ] 충돌 마커 0건, unmerged 0건
- [ ] `SsoUserMigrationService`/`migrateBySpUserId` 참조 0건
- [ ] mapper PII 잔재 0건 (group_invitation/admin/reporter/resolver 제외)
- [ ] `gm.gender` 0건
- [ ] 컴파일 SUCCESS, 테스트 Fail 0
- [ ] BE 부팅 + verify-enrich PASS 5/0
- [ ] 단일 머지 커밋 (sso-integration, push 안 함)
