# 온디맨드 그룹 sync 트랜잭션 격리 (Fix 2) 설계

> **작성일**: 2026-07-01
> **대상**: backend — `com.vs.meta.api.sso.service.GroupOnDemandSyncService`
> **선행**: Fix 1(그룹 멤버 insert 멱등화, 커밋 7387620 — dev/prod 배포됨)
> **제약**: 운영 오픈 임박 → 최소 blast radius, 사이드이펙트 회피, 풀사이클 검증

---

## 1. 배경 / 근본 원인

`/group/list`(및 `/group/detail`) 진입 시 `GroupOnDemandSyncService.syncMyGroups`가 사용자 본인 그룹을 Auth에서 당겨와 로컬 반영한다. 이 메서드는 이름이 `sync*`라 `TransactionAspect`(`common/aop/TransactionAspect.java:53,63`, `execution(* com.vs.meta.api..service..*(..))` + prefix `sync*`, rollback rule = `Exception.class`)의 **단일 트랜잭션**에 잡힌다.

그 트랜잭션 안에서 그룹별 `upsertService.upsertGroupFromRp(...)`(`@Transactional` = REQUIRED)가 **같은 물리 트랜잭션에 참여**한다. 루프 중 한 그룹의 write가 예외(예: `insertGroup`의 `sp_group_id` 중복 race)를 던지면, 참여 트랜잭션 실패로 공유 tx가 **rollback-only**로 마킹된다. `syncMyGroups`가 예외를 catch해도(설계 의도: "실패는 화면을 막지 않음") 커밋 시점에 `UnexpectedRollbackException`이 터져 **`/group/list`가 500**이 된다.

Fix 1은 멤버 insert 중복만 멱등화로 막았다. 남은 uncaught race(대표적으로 `insertGroup`)와, "한 그룹 실패가 전체 sync를 롤백"하는 구조 문제가 이 설계의 대상이다.

> 참고: `ensureUser`(`SsoUserProvisioningService.java:46-81`)는 이미 `DuplicateKeyException`을 catch+재조회로 흡수하며 MySQL에서 안전하다. 즉 사용자 provisioning race는 이미 처리됨.

---

## 2. 결정 사항

| 항목 | 결정 | 근거 |
|---|---|---|
| 복원력 목표 | **그룹별 격리 + partial success** | 폴링(`SsoEventPollService`) 패턴과 동일. 한 그룹 실패가 나머지·요청을 막지 않음 |
| 격리 수단 | **`TransactionTemplate` + `PROPAGATION_REQUIRES_NEW`**, on-demand 호출부에만 적용 | 폴링 `GroupSyncService:60,78`가 쓰는 하우스 패턴 차용. outer sync* tx로부터 각 그룹을 독립 tx로 분리 |
| 공유 메서드 | `GroupUpsertService.upsertGroupFromRp`·`deactivateBySpGroupId` **무변경** | 폴링(`GroupSyncService:164,173,175,196,236`)과 **공유** → propagation을 바꾸면 폴링에 사이드이펙트. 절대 불가침 |
| 변경 범위 | **`GroupOnDemandSyncService.java` 단일 파일** | blast radius 최소화(오픈 임박) |
| Approach 2(orchestrator rename로 outer tx 제거) | **오픈 후로 보류** | rename+호출부 수정 = blast radius 큼. lazy DS 덕에 지금도 커넥션 문제 없음 |

---

## 3. 컴포넌트 설계

### 3.1 TransactionTemplate 도입 (`GroupOnDemandSyncService`)

현재 `@RequiredArgsConstructor`(Lombok) 사용. `TransactionTemplate`은 `REQUIRES_NEW`로 커스텀 빌드해야 하므로 **명시적 생성자로 전환**(폴링 `GroupSyncService` 와 동일 방식):

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
    // 각 그룹 작업을 outer sync* 트랜잭션으로부터 격리 — 한 그룹 실패가 공유 tx를 오염(rollback-only)시키지 않도록.
    TransactionTemplate t = new TransactionTemplate(txManager);
    t.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    this.requiresNewTx = t;
}
```

- `txManager`는 @Primary `mybatisTrManager`(`MyBatisConfig.java:43`)가 주입됨. 폴링과 동일.
- 나머지 필드(`lastSyncAt`, `DEBOUNCE_MS`)는 그대로.

### 3.2 `syncMyGroups` 그룹 루프 — 그룹별 격리

핵심: **HTTP 호출은 트랜잭션 밖**, upsert만 `requiresNewTx`로 감싸고 **그룹별 try/catch**로 스킵.

```java
int synced = 0;
for (Long groupId : groupIds) {
    try {
        RpGroupDto rp = rpGroupClient.detail(serviceToken, groupId); // HTTP — tx 밖 (커넥션 미점유)
        if (rp != null) {
            requiresNewTx.execute(status -> {
                upsertService.upsertGroupFromRp(rp, true); // 알림 억제
                return null;
            });
            synced++;
        }
    } catch (Exception e) {
        // 그룹별 격리 — 한 그룹 실패(중복 race 등)가 나머지 그룹·요청을 막지 않음. 폴링이 백업.
        log.warn("[GROUP-SYNC] on-demand 그룹 sync 실패(스킵): groupId={}, error={}", groupId, e.getMessage());
    }
}
```

- 기존 메서드 전체 `try/catch`(groupIds 조회·토큰 발급 실패 흡수용)는 **backstop으로 유지**.
- `lastSyncAt.put(spUserId, now())`는 현행대로 루프/reconcile 이후 실행 → 부분 실패에도 디바운스 적용(폴링 백업).

### 3.3 `reconcileDeleted` — deactivate 건별 격리

각 `upsertService.deactivateBySpGroupId(...)` 호출을 `requiresNewTx.execute(...)` + 건별 try/catch로 감싼다. 읽기(`findActiveGroupsByHostUserNo`, `findBySpUserId`)는 outer tx에 그대로 둔다(무해).

```java
for (GroupInfo g : groupInfoMapper.findActiveGroupsByHostUserNo(teacher.getUserNo())) {
    if (g.getSpGroupId() == null) continue;
    if (authSet.contains(g.getSpGroupId())) continue;
    try {
        Integer n = requiresNewTx.execute(status -> upsertService.deactivateBySpGroupId(g.getSpGroupId()));
        if (n != null && n > 0) {
            count++;
            log.info("[GROUP-SYNC] on-demand 삭제 반영: spGroupId={}, claId={}", g.getSpGroupId(), g.getClaId());
        }
    } catch (Exception e) {
        log.warn("[GROUP-SYNC] on-demand 삭제 반영 실패(스킵): spGroupId={}, error={}", g.getSpGroupId(), e.getMessage());
    }
}
```

---

## 4. 동작/락/사이드이펙트 분석

### 4.1 왜 500이 사라지나
`REQUIRES_NEW`는 각 그룹 작업을 **별도 물리 트랜잭션**으로 실행(outer sync* tx suspend). 그룹 실패 시 그 새 tx만 롤백되고 예외가 전파 → 그룹별 try/catch가 흡수 → **outer tx는 rollback-only로 마킹되지 않음** → 커밋 정상 → 500 없음.

### 4.2 테이블 락
- SQL 불변 → **InnoDB 행 락만**, 테이블 락 없음(신규 락 없음).
- 락 **보유 시간 단축**: 현재는 단일 tx라 그룹1 락을 이후 그룹들의 HTTP 내내 보유 후 최종 커밋에 해제. 변경 후엔 그룹별 즉시 커밋으로 락 즉시 해제 → **경합·데드락 위험 감소**(개선).

### 4.3 커넥션
- outer는 `LazyConnectionDataSourceProxy`(`RoutingDataSourceConfig:57`) → 루프·HTTP 동안 물리 커넥션 미점유.
- 그룹당 `REQUIRES_NEW`가 커넥션 1개를 짧게 점유 후 반납(순차). 순 압박은 현재보다 **감소**. 동시 2개 순간은 reconcile(교사 전용, 드묾)뿐. 같은 스레드 순차 + lazy → 풀 셀프-데드락 없음.

### 4.4 다른 경로 영향
- **폴링/공유 메서드**: 무변경 → 사이드이펙트 0.
- **클라이언트 응답**(group/list·detail): 불변, best-effort 배경 sync 유지, 500만 제거.
- **정상 경로 최종 상태**: 동일(전 그룹 upsert). 차이는 "N개 독립 커밋 vs 1개 공유 커밋". on-demand는 알림 suppress라 이벤트 부수효과 없음.
- **Master/Slave 라우팅**: write tx→master 그대로.

### 4.5 트레이드오프 (수용)
- 중간 가시성(그룹A가 C보다 먼저 커밋): 무해(그룹 독립, 화면 부분/최종 상태 허용).
- 실패 그룹은 이번 요청에서 스킵 → 다음 sync(5s) 또는 1분 폴링이 처리.
- 커밋 N회(라운드트립 소폭↑): 그룹 수 작아 무시 가능.
- outer sync* tx가 사실상 vestigial(reconcile 읽기만 감쌈): 무해, 완전 제거는 Approach 2(오픈 후).
- **현재보다 나빠지는 시나리오 없음.** 잃는 "전체 원자성"은 원래 버그(전체 롤백+500)였음.

---

## 5. 테스트

### 5.1 단위 (Mockito, DB 불필요)
`GroupOnDemandSyncService`에 mock 주입:
- `rpGroupClient.myStudentGroupIds`/`myTeacherGroupIds` → 그룹 id 3개
- `rpGroupClient.detail` → 각 `RpGroupDto` 반환
- `upsertService.upsertGroupFromRp` → **2번째 그룹에서 예외** throw, 나머지 정상
- `PlatformTransactionManager` mock → `TransactionTemplate.execute`가 콜백 실행 + 예외 전파를 재현(`getTransaction` 시 mock `TransactionStatus`, commit/rollback no-op)

검증:
1. `upsertGroupFromRp`가 **3개 그룹 모두** 호출됨(2번째 실패가 3번째를 막지 않음)
2. `syncMyGroups`가 **예외 없이 정상 종료**
3. `lastSyncAt`이 갱신됨(디바운스 적용) — 후속 호출이 `isDue`=false
4. (props.enabled=false / groupIds 빈 경우) 기존 조기 리턴 동작 유지

### 5.2 통합 (dev, 배포 후)
같은 그룹 동시 sync 재현(교사+학생 동시 `/group/list`, 또는 멀티인스턴스) → 500·`on-demand ... 실패(스킵)` 500 트리거 소거, WARN은 스킵 로그로만 확인.

---

## 6. 범위 밖 (오픈 후 별건)
- Approach 2: `syncMyGroups` rename로 outer sync* tx 자체 제거(커넥션·구조 최적화).
- 공유 `upsertGroupFromRp`/`insertGroup` 자체 멱등화.
- `TransactionAspect`의 이름기반 tx → 명시적 애노테이션 전환(광범위, 별도 과제).
