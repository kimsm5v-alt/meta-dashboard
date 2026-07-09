# 온디맨드 그룹 sync 트랜잭션 격리 (Fix 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 온디맨드 그룹 sync에서 각 그룹 작업을 REQUIRES_NEW 트랜잭션으로 격리해, 한 그룹의 DB 실패가 전체 트랜잭션을 오염시켜 `/group/list`가 500나는 것을 막고 partial success를 보장한다.

**Architecture:** `syncMyGroups`는 이름이 `sync*`라 `TransactionAspect`의 단일 트랜잭션에 잡힌다. 그 안에서 그룹별 upsert(REQUIRED)가 같은 물리 tx에 참여하다 실패하면 공유 tx가 rollback-only가 되어 catch해도 커밋 시 500. 폴링(`GroupSyncService`)이 쓰는 `TransactionTemplate` 패턴을 차용해, **on-demand 호출부에서만** 각 그룹 작업을 `PROPAGATION_REQUIRES_NEW`로 감싸고 그룹별 try/catch로 스킵한다. 공유 `GroupUpsertService`는 무변경(폴링 사이드이펙트 0).

**Tech Stack:** Java 21, Spring Boot 4, Spring `TransactionTemplate`, JUnit 5 + Mockito + AssertJ.

## Global Constraints

- 변경 파일은 **`GroupOnDemandSyncService.java` 단 하나** + 신규 테스트. 공유 `GroupUpsertService`(폴링 `GroupSyncService`와 공유)의 시그니처·애노테이션·propagation은 **절대 변경 금지**.
- 격리 수단: `new TransactionTemplate(txManager)` + `setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW)`. `txManager`는 @Primary `mybatisTrManager`가 주입됨.
- Auth RP HTTP 호출(`rpGroupClient.detail`)은 트랜잭션 **밖**에서 수행(커넥션 미점유).
- 각 그룹/각 deactivate는 개별 try/catch로 스킵 + WARN 로그. 한 건 실패가 나머지·요청을 막지 않음.
- 커밋 메시지 한글 `fix(be): ...`, **`Co-Authored-By` 트레일러 금지**.
- 테스트/컴파일: `.\gradlew.bat :backend:test --tests "..."`, `.\gradlew.bat :backend:compileJava` (Windows PowerShell). Bash에서 gradlew 미인식 시 PowerShell 사용.

---

## File Structure

- `backend/src/main/java/com/vs/meta/api/sso/service/GroupOnDemandSyncService.java` — (수정) 생성자에 `PlatformTransactionManager` 주입 + `REQUIRES_NEW` `TransactionTemplate` 구성. `syncMyGroups` 그룹 루프와 `reconcileDeleted` deactivate 루프를 그룹별 격리로 재구성.
- `backend/src/test/java/com/vs/meta/api/sso/service/GroupOnDemandSyncServiceTest.java` — (신규) Mockito 단위 테스트. 실제 `TransactionTemplate` + mock `PlatformTransactionManager`로 콜백 실행·예외 전파를 재현해 격리 루프 로직을 DB 없이 검증.

---

### Task 1: TransactionTemplate 도입 + syncMyGroups 그룹별 격리

**Files:**
- Modify: `backend/src/main/java/com/vs/meta/api/sso/service/GroupOnDemandSyncService.java` (생성자, imports, `syncMyGroups` 66-101)
- Test: `backend/src/test/java/com/vs/meta/api/sso/service/GroupOnDemandSyncServiceTest.java` (신규)

**Interfaces:**
- Consumes: `GroupUpsertService.upsertGroupFromRp(RpGroupDto, boolean) -> int` (무변경), `RpGroupClient.myStudentGroupIds(String)/myTeacherGroupIds(String) -> List<Long>`, `RpGroupClient.detail(String, Long) -> RpGroupDto`, `SpServiceTokenProvider.getToken(String) -> String`.
- Produces: 생성자 시그니처 `GroupOnDemandSyncService(RpGroupClient, SpServiceTokenProvider, GroupUpsertService, GroupSyncProperties, UserMapper, GroupInfoMapper, PlatformTransactionManager)` 와 private 필드 `TransactionTemplate requiresNewTx` (REQUIRES_NEW). Task 2가 `requiresNewTx`를 재사용.

- [ ] **Step 1: 실패하는 테스트 작성**

Create `backend/src/test/java/com/vs/meta/api/sso/service/GroupOnDemandSyncServiceTest.java`:

```java
package com.vs.meta.api.sso.service;

import com.vs.meta.api.group.mapper.GroupInfoMapper;
import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.api.sso.client.RpGroupClient;
import com.vs.meta.api.sso.client.SpServiceTokenProvider;
import com.vs.meta.api.sso.client.dto.RpGroupDto;
import com.vs.meta.common.config.GroupSyncProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.transaction.PlatformTransactionManager;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GroupOnDemandSyncServiceTest {

    @Mock RpGroupClient rpGroupClient;
    @Mock SpServiceTokenProvider tokenProvider;
    @Mock GroupUpsertService upsertService;
    @Mock GroupSyncProperties props;
    @Mock UserMapper userMapper;
    @Mock GroupInfoMapper groupInfoMapper;
    @Mock PlatformTransactionManager txManager; // getTransaction→null, commit/rollback no-op

    GroupOnDemandSyncService service;

    @BeforeEach
    void setUp() {
        when(props.isEnabled()).thenReturn(true);
        service = new GroupOnDemandSyncService(
                rpGroupClient, tokenProvider, upsertService, props, userMapper, groupInfoMapper, txManager);
    }

    @Test
    void 한_그룹_upsert_실패해도_나머지_그룹은_계속_동기화된다() {
        when(rpGroupClient.myStudentGroupIds("bt")).thenReturn(List.of(1L, 2L, 3L));
        when(tokenProvider.getToken(anyString())).thenReturn("svc");
        RpGroupDto rp1 = org.mockito.Mockito.mock(RpGroupDto.class);
        RpGroupDto rp2 = org.mockito.Mockito.mock(RpGroupDto.class);
        RpGroupDto rp3 = org.mockito.Mockito.mock(RpGroupDto.class);
        when(rpGroupClient.detail("svc", 1L)).thenReturn(rp1);
        when(rpGroupClient.detail("svc", 2L)).thenReturn(rp2);
        when(rpGroupClient.detail("svc", 3L)).thenReturn(rp3);
        when(upsertService.upsertGroupFromRp(rp1, true)).thenReturn(1);
        when(upsertService.upsertGroupFromRp(rp2, true)).thenThrow(new RuntimeException("dup"));
        when(upsertService.upsertGroupFromRp(rp3, true)).thenReturn(1);

        assertThatCode(() -> service.syncMyGroups("sp-user", "STUDENT", "bt"))
                .doesNotThrowAnyException();

        verify(upsertService).upsertGroupFromRp(rp1, true);
        verify(upsertService).upsertGroupFromRp(rp2, true);
        verify(upsertService).upsertGroupFromRp(rp3, true); // 2번째 실패가 3번째를 막지 않음
    }

    @Test
    void 부분_실패해도_디바운스_갱신되어_즉시_재동기화_안함() {
        when(rpGroupClient.myStudentGroupIds("bt")).thenReturn(List.of(1L));
        when(tokenProvider.getToken(anyString())).thenReturn("svc");
        RpGroupDto rp1 = org.mockito.Mockito.mock(RpGroupDto.class);
        when(rpGroupClient.detail("svc", 1L)).thenReturn(rp1);
        when(upsertService.upsertGroupFromRp(rp1, true)).thenThrow(new RuntimeException("dup"));

        service.syncMyGroups("sp-user", "STUDENT", "bt");  // 1st: 실패해도 정상 종료 + lastSyncAt 갱신
        service.syncMyGroups("sp-user", "STUDENT", "bt");  // 2nd: 디바운스로 조기 리턴

        verify(rpGroupClient, times(1)).myStudentGroupIds("bt"); // 2번째는 short-circuit
    }
}
```

- [ ] **Step 2: 테스트 실패(컴파일) 확인**

Run: `.\gradlew.bat :backend:test --tests "com.vs.meta.api.sso.service.GroupOnDemandSyncServiceTest" --console=plain`
Expected: 컴파일 실패 — 현재 `GroupOnDemandSyncService`에 `PlatformTransactionManager`를 받는 7-인자 생성자가 없음(현재는 `@RequiredArgsConstructor` 6-인자).

- [ ] **Step 3: 구현 — 생성자 + imports + syncMyGroups**

`GroupOnDemandSyncService.java` 상단 import 블록에 추가하고 `lombok.RequiredArgsConstructor` import는 제거:

```java
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
```

클래스 애노테이션에서 `@RequiredArgsConstructor` 제거(`@Slf4j`, `@Service`는 유지). 필드 선언부에 `requiresNewTx` 추가하고 명시적 생성자 작성(기존 `final` 필드들은 그대로, `lastSyncAt`는 inline 초기화 유지):

```java
    private final TransactionTemplate requiresNewTx;

    public GroupOnDemandSyncService(RpGroupClient rpGroupClient,
                                    SpServiceTokenProvider tokenProvider,
                                    GroupUpsertService upsertService,
                                    GroupSyncProperties props,
                                    UserMapper userMapper,
                                    GroupInfoMapper groupInfoMapper,
                                    PlatformTransactionManager txManager) {
        this.rpGroupClient = rpGroupClient;
        this.tokenProvider = tokenProvider;
        this.upsertService = upsertService;
        this.props = props;
        this.userMapper = userMapper;
        this.groupInfoMapper = groupInfoMapper;
        // 각 그룹 작업을 outer sync* 트랜잭션에서 분리 — 한 그룹 실패가 공유 tx를 rollback-only로 오염시키지 않도록.
        TransactionTemplate t = new TransactionTemplate(txManager);
        t.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.requiresNewTx = t;
    }
```

`syncMyGroups`의 그룹 루프(현재 84-90)를 그룹별 격리로 교체. try 블록 내부의 `for` 루프를 아래로 변경(나머지 메서드 구조·backstop try/catch·`lastSyncAt`·로그는 유지):

```java
            String serviceToken = tokenProvider.getToken(SCOPE_GROUPS_READ);
            int synced = 0;
            for (Long groupId : groupIds) {
                try {
                    RpGroupDto rp = rpGroupClient.detail(serviceToken, groupId); // HTTP — tx 밖
                    if (rp != null) {
                        requiresNewTx.execute(status -> {
                            upsertService.upsertGroupFromRp(rp, true); // 알림 억제
                            return null;
                        });
                        synced++;
                    }
                } catch (Exception e) {
                    // 그룹별 격리 — 한 그룹 실패(중복 race 등)가 나머지 그룹·요청을 막지 않음. 폴링이 백업.
                    log.warn("[GROUP-SYNC] on-demand 그룹 sync 실패(스킵): groupId={}, error={}",
                            groupId, e.getMessage());
                }
            }
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `.\gradlew.bat :backend:test --tests "com.vs.meta.api.sso.service.GroupOnDemandSyncServiceTest" --console=plain`
Expected: 2개 테스트 PASS (`한_그룹_upsert_실패해도...`, `부분_실패해도_디바운스...`).

- [ ] **Step 5: 커밋**

```bash
git -C /c/workspace/meta-dashboard add \
  backend/src/main/java/com/vs/meta/api/sso/service/GroupOnDemandSyncService.java \
  backend/src/test/java/com/vs/meta/api/sso/service/GroupOnDemandSyncServiceTest.java
git -C /c/workspace/meta-dashboard commit -m "fix(be): 온디맨드 그룹 sync 그룹별 REQUIRES_NEW 격리로 500 방지"
```

---

### Task 2: reconcileDeleted deactivate 건별 격리

**Files:**
- Modify: `backend/src/main/java/com/vs/meta/api/sso/service/GroupOnDemandSyncService.java` (`reconcileDeleted` 117-140)
- Test: `backend/src/test/java/com/vs/meta/api/sso/service/GroupOnDemandSyncServiceTest.java` (테스트 추가)

**Interfaces:**
- Consumes: Task 1의 `requiresNewTx` 필드, `GroupUpsertService.deactivateBySpGroupId(Long) -> int` (무변경), `UserMapper.findBySpUserId(String) -> User`, `GroupInfoMapper.findActiveGroupsByHostUserNo(Long) -> List<GroupInfo>`.
- Produces: 없음(내부 격리).

- [ ] **Step 1: 실패하는 테스트 추가**

`GroupOnDemandSyncServiceTest.java`에 import와 테스트 추가:

```java
// import 추가
import com.vs.meta.domain.GroupInfo;
import com.vs.meta.domain.User;
```

```java
    @Test
    void reconcile_한_그룹_비활성_실패해도_나머지는_계속된다() {
        when(rpGroupClient.myTeacherGroupIds("bt")).thenReturn(List.of(10L)); // authGroupIds 비어있지 않음
        when(tokenProvider.getToken(anyString())).thenReturn("svc");
        when(rpGroupClient.detail(eq("svc"), any())).thenReturn(org.mockito.Mockito.mock(RpGroupDto.class));
        when(upsertService.upsertGroupFromRp(any(), eq(true))).thenReturn(0);

        User teacher = User.builder().userNo(100L).build();
        when(userMapper.findBySpUserId("sp-teacher")).thenReturn(teacher);
        GroupInfo gA = GroupInfo.builder().spGroupId(20L).claId("A").build(); // authSet{10}에 없음 → 비활성
        GroupInfo gB = GroupInfo.builder().spGroupId(30L).claId("B").build(); // 없음 → 비활성
        when(groupInfoMapper.findActiveGroupsByHostUserNo(100L)).thenReturn(List.of(gA, gB));
        when(upsertService.deactivateBySpGroupId(20L)).thenThrow(new RuntimeException("x"));
        when(upsertService.deactivateBySpGroupId(30L)).thenReturn(1);

        assertThatCode(() -> service.syncMyGroups("sp-teacher", "TEACHER", "bt"))
                .doesNotThrowAnyException();

        verify(upsertService).deactivateBySpGroupId(20L);
        verify(upsertService).deactivateBySpGroupId(30L); // 20L 실패가 30L을 막지 않음
    }
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `.\gradlew.bat :backend:test --tests "com.vs.meta.api.sso.service.GroupOnDemandSyncServiceTest" --console=plain`
Expected: `reconcile_한_그룹_비활성_실패해도...` FAIL — 현재 `reconcileDeleted`는 `deactivateBySpGroupId`를 격리 없이 호출해, 20L 예외가 outer 트랜잭션 컨텍스트에서 전파되어 30L 호출 전에 `syncMyGroups` backstop catch로 빠지므로 `deactivateBySpGroupId(30L)` 미호출.

- [ ] **Step 3: 구현 — reconcileDeleted 건별 격리**

`reconcileDeleted`의 for 루프(현재 127-138)를 아래로 교체:

```java
        for (GroupInfo g : groupInfoMapper.findActiveGroupsByHostUserNo(teacher.getUserNo())) {
            if (g.getSpGroupId() == null) {
                continue; // 레거시(학심정 자체 생성) 그룹 불가침
            }
            if (authSet.contains(g.getSpGroupId())) {
                continue;
            }
            try {
                Integer n = requiresNewTx.execute(status -> upsertService.deactivateBySpGroupId(g.getSpGroupId()));
                if (n != null && n > 0) {
                    count++;
                    log.info("[GROUP-SYNC] on-demand 삭제 반영: spGroupId={}, claId={}",
                            g.getSpGroupId(), g.getClaId());
                }
            } catch (Exception e) {
                // 건별 격리 — 한 그룹 비활성 실패가 나머지 reconcile·요청을 막지 않음.
                log.warn("[GROUP-SYNC] on-demand 삭제 반영 실패(스킵): spGroupId={}, error={}",
                        g.getSpGroupId(), e.getMessage());
            }
        }
```

- [ ] **Step 4: 테스트·컴파일 통과 확인**

Run: `.\gradlew.bat :backend:test --tests "com.vs.meta.api.sso.service.GroupOnDemandSyncServiceTest" --console=plain`
Expected: 3개 테스트 전부 PASS.

Run: `.\gradlew.bat :backend:compileJava --console=plain`
Expected: BUILD SUCCESSFUL.

- [ ] **Step 5: 커밋**

```bash
git -C /c/workspace/meta-dashboard add \
  backend/src/main/java/com/vs/meta/api/sso/service/GroupOnDemandSyncService.java \
  backend/src/test/java/com/vs/meta/api/sso/service/GroupOnDemandSyncServiceTest.java
git -C /c/workspace/meta-dashboard commit -m "fix(be): 온디맨드 sync reconcile deactivate 건별 트랜잭션 격리"
```

---

## Self-Review

**Spec coverage:**
- §3.1 TransactionTemplate(REQUIRES_NEW) 도입 → Task 1 Step 3 ✅
- §3.2 syncMyGroups 그룹별 격리(HTTP tx 밖, 그룹별 try/catch) → Task 1 Step 3 ✅
- §3.3 reconcileDeleted 건별 격리 → Task 2 Step 3 ✅
- §2 공유 메서드 무변경 → 두 Task 모두 `GroupUpsertService` 미변경, `upsertGroupFromRp`/`deactivateBySpGroupId` 호출부만 감쌈 ✅
- §5.1 단위 테스트(2번째 그룹 실패, 디바운스, reconcile 격리) → Task 1·2 테스트 ✅
- §4.1 500 제거(rollback-only 미오염) → 그룹별 REQUIRES_NEW + try/catch로 예외가 outer 경계를 넘지 않음 ✅

**Placeholder scan:** 모든 스텝에 실제 코드·명령·기대출력 포함. 플레이스홀더 없음.

**Type consistency:** 생성자 7-인자 시그니처가 Task 1 Interfaces·Step 3·테스트 `new GroupOnDemandSyncService(...)` 인자 순서와 일치(rpGroupClient, tokenProvider, upsertService, props, userMapper, groupInfoMapper, txManager). `requiresNewTx`(Task 1 생성) → Task 2에서 재사용. `TransactionTemplate.execute`의 반환은 Task 2에서 `Integer`로 받아 null 체크. `upsertGroupFromRp(RpGroupDto, boolean)`·`deactivateBySpGroupId(Long)` 시그니처는 기존 코드와 일치(무변경).

**참고(테스트 실행 환경):** 로컬 MySQL 부재 → 단위 테스트는 mock `PlatformTransactionManager` 기반이라 DB 불필요. 실제 REQUIRES_NEW 격리(동시성) 최종 확인은 dev 배포 후 통합 검증(spec §5.2).
