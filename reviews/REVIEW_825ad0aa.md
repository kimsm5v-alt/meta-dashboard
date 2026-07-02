> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 825ad0aa

## 코드 복잡도 분석

**분석된 파일**: 5개 / 변경된 파일: 7개


### 정상 범위 (NONE)


**`dgnssmapper.xml`** (other)

- 평균 복잡도: **0.243**

- 최대 복잡도: 0.474

- 청크 수: 2개

- 평균 사용처: 7.0곳


**권장사항:**

- 복잡도 정상 범위


**`groupmembermapper.xml`** (other)

- 평균 복잡도: **0.238**

- 최대 복잡도: 0.469

- 청크 수: 2개

- 평균 사용처: 7.0곳


**권장사항:**

- 복잡도 정상 범위


**`mapperxmlparsetest.java`** (config)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.006

- 청크 수: 3개


**권장사항:**

- Config 파일은 높은 연결도가 정상적임


**`groupondemandsyncservice.java`** (other)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.007

- 청크 수: 3개


**권장사항:**

- 복잡도 정상 범위


**`groupondemandsyncservicetest.java`** (other)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.002

- 청크 수: 1개


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 온디맨드(on-demand) 그룹 동기화 과정에서 발생하는 `/group/list` 500 에러를 해결하기 위한 변경입니다. 근본 원인은 `syncMyGroups` 메서드가 `TransactionAspect`의 이름 기반(`sync*`) 단일 트랜잭션에 포착되어, 그룹 루프 내 한 건의 DB 실패(중복 race 등)가 공유 트랜잭션을 rollback-only로 오염시키고, 예외를 catch해도 최종 커밋 시점에 `UnexpectedRollbackException`이 발생하는 구조적 문제였습니다.

- **목적**: 그룹별 트랜잭션 격리(REQUIRES_NEW) 도입으로 partial success 보장 및 500 제거
- **도메인**: 백엔드 비즈니스 로직 (SSO 그룹 동기화), MyBatis 매퍼 XML
- **변경 방향**: 폴링(`GroupSyncService`)에서 이미 사용 중인 `TransactionTemplate` + `PROPAGATION_REQUIRES_NEW` 패턴을 on-demand 호출부에 차용. 공유 `GroupUpsertService`는 무변경으로 폴링 사이드이펙트 제로. 추가로 `GroupMemberMapper.insertGroupMember`에 `ON DUPLICATE KEY UPDATE` 멱등화(Fix 1), `DgnssMapper.xml`의 grade 필드 NULLIF 조건 보정(`''` -> `'0'`)

---

## [GOOD] 잘된 점

1. **문제 진단과 설계 문서화가 탁월함**: 설계 문서(`2026-07-01-ondemand-sync-tx-isolation-design.md`)에 근본 원인(rollback-only 오염), 결정 사항(REQUIRES_NEW vs Approach 2), 락/커넥션/사이드이펙트 분석까지 상세히 기록되어 있어 유지보수와 후속 작업에 큰 도움이 됩니다.

2. **변경 범위 최소화**: `GroupUpsertService`를 전혀 건드리지 않고 on-demand 서비스 내부에서만 격리 처리하여, 폴링(`GroupSyncService`)과 공유하는 메서드에 사이드이펙트가 없도록 설계한 점이 좋습니다. `GroupUpsertService.upsertGroupFromRp()`는 `@Transactional`(REQUIRED)이지만, 호출부인 `GroupOnDemandSyncService`에서 `TransactionTemplate(REQUIRES_NEW)`로 감싸서 호출하므로, REQUIRES_NEW 내부에서 REQUIRED가 참여하여 같은 물리 트랜잭션에서 실행됩니다. 이는 의도된 동작이며, 폴링 경로(`GroupSyncService`)에서는 기존처럼 직접 호출하므로 전혀 영향받지 않습니다.

3. **테스트 품질**: 단위 테스트가 실제 `TransactionTemplate`의 동작(콜백 실행 + 예외 전파)을 mock `PlatformTransactionManager`로 재현하고 있으며, 3가지 시나리오(그룹 upsert 실패 격리, 디바운스, reconcile 격리)를 모두 커버합니다. `MapperXmlParseTest`는 매퍼 XML 파싱 자체를 검증하여 운영 기동 시점의 오류를 사전에 발견할 수 있게 합니다.

---

## 변경사항 요약

- `GroupOnDemandSyncService`: `@RequiredArgsConstructor` 제거 후 명시적 생성자로 전환, `TransactionTemplate(REQUIRES_NEW)` 도입, 그룹 루프와 reconcile deactivate 루프를 각각 건별 try/catch + `requiresNewTx.execute()`로 격리
- `GroupMemberMapper.xml`: `insertGroupMember`에 `ON DUPLICATE KEY UPDATE id = id` 멱등화 추가
- `DgnssMapper.xml`: `gi.grade`의 `NULLIF` 조건을 `''`에서 `'0'`으로 변경 (grade='0'인 데이터가 빈 문자열로 처리되지 않도록)
- 테스트 2개 신규: `GroupOnDemandSyncServiceTest` (3개 테스트), `MapperXmlParseTest` (2개 테스트)
- 설계 문서 2개 추가

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

없음

### Medium (개선 권장)

**1. `GroupOnDemandSyncServiceTest` - `PlatformTransactionManager` mock이 실제 `TransactionTemplate.execute()` 동작을 완전히 재현하지 못함**

- **위치**: `GroupOnDemandSyncServiceTest.java:30` (`@Mock PlatformTransactionManager txManager`)
- **내용**: 현재 테스트는 `PlatformTransactionManager`를 mock으로 주입하고 있습니다. `TransactionTemplate.execute()`는 내부적으로 `txManager.getTransaction()`, `txManager.commit()`, `txManager.rollback()`을 호출하는데, mock의 기본 동작은 모든 메서드가 null을 반환합니다. 이로 인해 `requiresNewTx.execute(status -> ...)`의 콜백이 실제로 실행되긴 하지만, 트랜잭션 생명주기(시작/커밋/롤백)가 전혀 검증되지 않습니다.

  실제 운영 환경에서는 `REQUIRES_NEW`가 outer 트랜잭션을 suspend하고 새 물리 트랜잭션을 시작하는데, 현재 테스트는 이 격리 메커니즘을 검증하지 못합니다. 테스트가 검증하는 것은 "예외가 catch되어 다음 그룹으로 진행된다"는 루프 제어 로직뿐입니다.

  **해결 방안**: `TransactionTemplate`의 실제 동작을 재현하려면 `Mockito.doAnswer()`를 사용하여 `getTransaction()`이 mock `TransactionStatus`를 반환하고, `execute()`의 `TransactionCallback`을 실제로 호출하도록 설정하는 것이 좋습니다. 또는 `TransactionTemplate` 자체를 mock/spy하여 `execute()`가 콜백을 실행하는지만 검증하는 방법도 있습니다.

  ```
  // 예시: getTransaction이 mock TransactionStatus 반환
  when(txManager.getTransaction(any())).thenReturn(mock(TransactionStatus.class));
  ```

  다만, 현재 테스트가 검증하려는 핵심(그룹별 격리 + partial success)은 루프 제어 로직에 있으므로, 이 부분은 **선택적 개선 사항**으로 간주합니다.

**2. `DgnssMapper.xml` - `gi.grade` NULLIF 조건 변경의 영향 범위 문서화 부족**

- **위치**: `DgnssMapper.xml:1871, 1888` (2개 CASE 문)
- **내용**: `NULLIF(gi.grade, '')`를 `NULLIF(gi.grade, '0')`로 변경했습니다. 이는 `gi.grade` 컬럼에 실제로 `'0'`이라는 값이 저장되는 경우가 있어, 기존에는 `NULLIF(gi.grade, '')`가 `'0'`을 통과시켰지만 변경 후에는 `'0'`을 NULL로 변환하여 `DRI.grade`로 fallback하게 됩니다.

  이 변경의 의도(grade='0'인 데이터 처리)는 이해되지만, 이 SQL을 사용하는 모든 호출부(예: `DgnssService.selectStntDgnssList` 등)에서 `CLASS_NM`과 `stdtClassNm`이 이전과 다르게 표시될 수 있습니다. 예를 들어 `gi.grade='0'`이고 `DRI.grade=''`인 경우, 기존에는 `'0학년 N반'`으로 표시되던 것이 변경 후에는 `'-'` 또는 `''`로 표시됩니다.

  **제안**: 이 변경이 단순 버그 수정인지, 데이터 정합성 보정인지 명확히 하고, 영향받는 화면 영역을 문서나 커밋 메시지에 기록하는 것이 좋습니다. 또한 `gi.grade`에 `'0'`이 저장되는 원인(레거시 데이터 or 정상 케이스)을 파악하여 근본적인 데이터 정합성 문제를 해결하는 것도 고려할 필요가 있습니다.

---

## 주요 파일 분석

### `GroupOnDemandSyncService.java`

**변경 내용**: `@RequiredArgsConstructor` 제거, 명시적 생성자로 `TransactionTemplate(REQUIRES_NEW)` 도입, 그룹 루프와 reconcile deactivate를 건별 격리

**핵심 로직 분석**:

```java
// 생성자에서 TransactionTemplate(REQUIRES_NEW) 구성
public GroupOnDemandSyncService(..., PlatformTransactionManager txManager) {
    // ... 기존 필드 초기화
    TransactionTemplate t = new TransactionTemplate(txManager);
    t.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    this.requiresNewTx = t;
}

// syncMyGroups - 그룹별 격리
for (Long groupId : groupIds) {
    try {
        RpGroupDto rp = rpGroupClient.detail(serviceToken, groupId); // HTTP - tx 밖
        if (rp != null) {
            requiresNewTx.execute(status -> {
                upsertService.upsertGroupFromRp(rp, true); // REQUIRES_NEW 내부에서 실행
                return null;
            });
            synced++;
        }
    } catch (Exception e) {
        log.warn("[GROUP-SYNC] on-demand 그룹 sync 실패(스킵): groupId={}, error={}", groupId, e.getMessage());
    }
}

// reconcileDeleted - 건별 격리
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

**동작 흐름**:
1. `syncMyGroups`는 `TransactionAspect`에 의해 이름 기반(`sync*`)으로 outer 트랜잭션(REQUIRED)에 포착됨
2. HTTP 호출(`rpGroupClient.detail`)은 트랜잭션 밖에서 수행 (커넥션 미점유)
3. 각 그룹의 upsert만 `requiresNewTx.execute()`로 감싸서 outer 트랜잭션과 분리
4. 한 그룹 실패 시 해당 REQUIRES_NEW 트랜잭션만 롤백되고, 예외는 그룹별 try/catch가 흡수
5. outer 트랜잭션은 rollback-only로 마킹되지 않으므로 정상 커밋 -> 500 제거
6. `lastSyncAt` 갱신은 루프/reconcile 이후에 실행되므로, 부분 실패에도 디바운스 적용

**개선 제안**: 없음 (구현이 명확하고 설계 의도에 부합함)

### `GroupMemberMapper.xml`

**변경 내용**: `insertGroupMember`에 `ON DUPLICATE KEY UPDATE id = id` 추가

**분석**: `(group_id, user_no)` 복합 unique key(`uk_gm_group_user`) 중복 시, `id = id` no-op으로 경쟁 승자의 행을 건드리지 않고 조용히 무시합니다. 이는 on-demand sync가 멀티인스턴스/폴링과 동시에 같은 그룹을 처리할 때 발생하는 `DuplicateKeyException`을 방지합니다. 주석에 배경 설명이 충분히 기록되어 있습니다.

**개선 제안**: 없음

### `DgnssMapper.xml`

**변경 내용**: `gi.grade`의 `NULLIF` 조건을 `''`에서 `'0'`으로 변경 (2개 CASE 문)

**분석**: `NULLIF(gi.grade, '0')`는 `gi.grade`가 `'0'`인 경우 NULL을 반환하여 `DRI.grade`로 fallback합니다. 이는 `gi.grade` 컬럼에 `'0'`이 저장된 레거시 데이터가 있을 때, `'0학년'`으로 표시되는 것을 방지하기 위한 것으로 추정됩니다.

**개선 제안**: 위 Medium 이슈 #2 참조

### `GroupOnDemandSyncServiceTest.java` (신규)

**변경 내용**: 3개 단위 테스트 (그룹 upsert 격리, 디바운스, reconcile 격리)

**분석**:
- `한_그룹_upsert_실패해도_나머지_그룹은_계속_동기화된다`: 3개 그룹 중 2번째가 실패해도 1, 2, 3번째 모두 `upsertGroupFromRp`가 호출됨을 검증
- `부분_실패해도_디바운스_갱신되어_즉시_재동기화_안함`: 실패해도 `lastSyncAt`이 갱신되어 2번째 호출이 short-circuit됨을 검증
- `reconcile_한_그룹_비활성_실패해도_나머지는_계속된다`: 20L 비활성 실패가 30L 비활성을 막지 않음을 검증

**개선 제안**: 위 Medium 이슈 #1 참조

### `MapperXmlParseTest.java` (신규)

**변경 내용**: MyBatis 매퍼 XML 파싱 검증 (DB 불필요), `insertGroupMember` 멱등화 확인

**분석**: `SqlSessionFactoryBean`을 `MyBatisConfig`와 동일한 설정으로 빌드하여, 운영 기동 시점의 매퍼 파싱을 로컬 DB 없이 그대로 재현합니다. `allMapperXmlParses`는 모든 매퍼 XML이 정상 파싱되는지 검증하고, `insertGroupMemberIsIdempotent`는 `ON DUPLICATE KEY UPDATE` 절이 실제 SQL에 포함되었는지 문자열 검증합니다.

**개선 제안**: 없음 (잘 작성된 테스트입니다)

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [x] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [ ] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견**: 이 커밋은 근본 원인 분석부터 설계, 구현, 테스트까지 체계적으로 진행된 고품질 변경입니다. `TransactionTemplate(REQUIRES_NEW)` 패턴을 기존 폴링 코드와 일관되게 적용했고, 공유 서비스를 건드리지 않아 blast radius를 최소화했습니다. `MapperXmlParseTest`는 매퍼 XML 품질을 CI 단계에서 검증할 수 있는 좋은 추가입니다. `DgnssMapper.xml` 변경의 영향 범위만 명확히 문서화되면 더 좋을 것 같습니다. 전반적으로 **70점 이상**의 안정적인 코드입니다.