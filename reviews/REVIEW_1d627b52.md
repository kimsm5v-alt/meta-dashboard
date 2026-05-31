> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 1d627b52

## 코드 복잡도 분석

**분석된 파일**: 7개 / 변경된 파일: 10개


### 정상 범위 (NONE)


**`dgnssmapper.xml`** (other)

- 평균 복잡도: **0.475**

- 최대 복잡도: 0.475

- 청크 수: 1개

- 평균 사용처: 14.0곳


**권장사항:**

- 복잡도 정상 범위


**`groupmembermapper.xml`** (other)

- 평균 복잡도: **0.469**

- 최대 복잡도: 0.469

- 청크 수: 1개

- 평균 사용처: 14.0곳


**권장사항:**

- 복잡도 정상 범위


**`usermapper.xml`** (other)

- 평균 복잡도: **0.469**

- 최대 복잡도: 0.469

- 청크 수: 1개

- 평균 사용처: 14.0곳


**권장사항:**

- 복잡도 정상 범위


**`membercontroller.java`** (other)

- 평균 복잡도: **0.467**

- 최대 복잡도: 0.470

- 청크 수: 5개

- 평균 사용처: 64.4곳


**권장사항:**

- 복잡도 정상 범위


**`groupmembermapper.java`** (other)

- 평균 복잡도: **0.463**

- 최대 복잡도: 0.465

- 청크 수: 8개

- 평균 사용처: 36.5곳


**권장사항:**

- 복잡도 정상 범위


**`securityconfig.java`** (config)

- 평균 복잡도: **0.463**

- 최대 복잡도: 0.464

- 청크 수: 6개

- 평균 사용처: 52.3곳


**권장사항:**

- Config 파일은 높은 연결도가 정상적임


**`usermapper.java`** (other)

- 평균 복잡도: **0.462**

- 최대 복잡도: 0.463

- 청크 수: 5개

- 평균 사용처: 39.4곳


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 SSO(SuperPlatform) 재설계 통합의 일환으로, PII(개인정보) email 컬럼 DROP에 따른 후속 작업과 SSO 이벤트 폴링 기반 탈퇴 처리로의 전환을 주요 목적으로 합니다.

- **목적**: email 기반 재가입/마이그레이션 감지 로직 제거 및 PII 컬럼(gender, nickname, email) 참조 제거, SSO 이벤트 폴링 기반 탈퇴 처리로의 전환
- **도메인**: 비즈니스 로직 (SSO 인증/회원 관리), 데이터 액세스 레이어 (MyBatis Mapper)
- **변경 방향**: email 기반 분기 로직을 제거하고 SSO 이벤트 폴링(SsoEventPollService)이 IdP 탈퇴 이벤트를 수신하여 처리하는 아키텍처로 전환. PII 컬럼 참조를 sp_user_id 기반 식별자로 대체하여 개인정보 노출 최소화

---

## [GOOD] 잘된 점

1. **명확한 책임 분리와 문서화**: `SsoUserResolveService`의 Javadoc에 email 기반 분기가 제거된 이유와 대체 아키텍처(SSO 이벤트 폴링)를 상세히 기술하여, 향후 유지보수자가 변경 의도를 명확히 이해할 수 있습니다. 특히 "재가입 — IdP 탈퇴 시 SSO 이벤트 폴링이 옛 row를 WITHDRAWN 처리(인격분리)"라는 설명은 아키텍처 결정을 잘 전달합니다.

2. **Race condition 처리**: `SsoUserResolveService.registerIfAutoRegistrable()`에서 `DataIntegrityViolationException`을 캐치하여 재조회하는 패턴은 동시성 이슈(동일 sp_user_id로 중복 가입 요청)에 대한 실용적인 대응입니다. 단순히 예외를 던지지 않고 재시도 로직을 구현한 점이 좋습니다.

3. **PII 마스킹 일관성**: `SsoUserWithdrawalService`의 로그에서 `PiiMasker.maskUuid()`를 사용하여 sp_user_id를 마스킹 처리한 점이 ISMS/개인정보보호법 대응 측면에서 적절합니다. 이전에는 email을 마스킹했으나 email 컬럼 DROP에 따라 sp_user_id로 전환한 것이 일관성 있습니다.

4. **탈퇴 처리의 안전성**: `GroupMemberMapper.withdrawByUserNo`에서 `status NOT IN ('LEFT', 'KICKED', 'ARCHIVED', 'WITHDRAWN')` 조건으로 이미 종결 처리된 멤버십을 이중으로 WITHDRAWN 처리하지 않도록 보호한 점이 좋습니다.

---

## 변경사항 요약

- `SsoUserResolveService`: email 기반 재가입/마이그레이션 분기 로직(약 30줄) 제거, `SsoUserWithdrawalService` 의존성 제거, 단순화된 2-step 분기(sp_user_id 조회 -> 자동 가입)로 축소
- `SsoUserWithdrawalService`: 로그에서 email 마스킹을 sp_user_id 마스킹으로 변경, Javadoc에서 `SsoUserResolveService` 호출 진입점 참조 제거
- `GroupMemberMapper`: `updateGuestToStudent`, `findActiveGuestByGroupIdAndEmail`, `syncSnapshotByUserNo` 메서드 제거, `withdrawByUserNo` 추가 (nickname/email 마스킹 없이 status만 WITHDRAWN 처리)
- `UserMapper`: `markWithdrawn`에서 email/nickname 마스킹 제거 (PII 컬럼 DROP), tc_id/stdt_id/sp_user_id를 NULL 처리
- `DgnssMapper.xml`: 26개 쿼리에서 gender 컬럼 참조 제거, nickname을 sp_user_id로 대체
- `MemberController`: `SsoUserMigrationService` import 제거, `SsoUserResolveService` 추가
- `application.yml`: SSO 이벤트 폴링 설정(`sso.poll.enabled`, `sso.poll.limit`) 추가

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

**1. `SsoUserWithdrawalService.withdraw()`에서 `user.getSpUserId()` NPE 가능성**

`SsoUserWithdrawalService.withdraw()` 메서드에서 `user.getSpUserId()`를 호출한 후 `PiiMasker.maskUuid()`로 마스킹하는데, `markWithdrawn` 쿼리에서 `sp_user_id = NULL`로 설정하는 것과 로그 출력 시점의 순서를 고려해야 합니다. 현재는 `markWithdrawn` 실행 전에 `maskedSpUserId`를 계산하므로 문제가 없지만, `user` 객체의 `spUserId`가 null인 경우 `maskUuid`가 빈 문자열을 반환하므로 로그가 불완전해집니다.

- **위치**: `SsoUserWithdrawalService.java` 라인 47
- **기존 코드**:
```java
String maskedSpUserId = PiiMasker.maskUuid(user.getSpUserId());
```
- **해결 방안**: null-safe 처리를 추가하여 로그의 완전성을 보장합니다.
```java
String maskedSpUserId = user.getSpUserId() != null 
    ? PiiMasker.maskUuid(user.getSpUserId()) 
    : "(null)";
```

**2. `SsoUserResolveService`에서 `SsoUserWithdrawalService` 제거로 인한 재가입 케이스 누락 가능성**

email 기반 재가입 감지 로직이 제거되고 SSO 이벤트 폴링으로 대체되었습니다. 그러나 `SsoEventPollService`가 아직 구현되지 않았거나, 폴링 간격(15분) 동안 재가입 요청이 들어오면 이전 계정이 WITHDRAWN 처리되지 않은 상태에서 중복 가입이 발생할 수 있습니다. `sp_user_id`는 신규이므로 `findBySpUserId`로는 기존 계정을 찾을 수 없고, email 컬럼은 DROP되었으므로 중복 감지도 불가능합니다.

이는 아키텍처 결정 사항이므로 코드 수준의 이슈는 아니지만, SSO 이벤트 폴링이 완전히 배포되고 안정화되기 전까지의 과도기적 리스크를 인지해야 합니다. `application.yml`에서 `sso.poll.enabled`가 기본 `false`로 설정되어 있으므로, 폴링이 활성화되기 전까지 재가입 케이스가 정상 처리되지 않을 수 있습니다.

- **권장 사항**: SSO 이벤트 폴링 배포 전까지 임시로 email 기반 중복 체크를 유지하거나, IdP 측에서 탈퇴-재가입 간 최소 시간 간격을 보장하는 정책을 수립하세요.

### Medium (개선 권장)

**1. `SsoUserResolveService`의 `registerIfAutoRegistrable`에서 예외 처리 범위**

`DataIntegrityViolationException`을 캐치하여 재조회하는 것은 동시성 이슈에 대한 적절한 대응이지만, `IllegalStateException`까지 함께 캐치하는 것은 의도치 않은 상태를 가릴 수 있습니다. `IllegalStateException`은 비즈니스 로직 위반(예: 이미 가입된 사용자)을 나타낼 수 있는데, 이를 캐치하면 실제 문제를 로그에만 남기고 사용자에게는 빈 결과(null)를 반환하게 됩니다.

- **위치**: `SsoUserResolveService.java` 라인 52
- **기존 코드**:
```java
} catch (IllegalStateException | org.springframework.dao.DataIntegrityViolationException e) {
```
- **해결 방안**: `IllegalStateException`은 별도로 처리하거나, 최소한 로그 레벨을 `warn`으로 높여 운영자가 인지할 수 있도록 합니다.
```java
} catch (org.springframework.dao.DataIntegrityViolationException e) {
    // 동시 요청 race — 한쪽이 먼저 insert 한 경우. 재조회.
    log.info("자동 가입 race 감지, 재조회: spUserId={}, error={}",
            spUser.spUserId(), e.getMessage());
    return ssoUserQueryService.findBySpUserId(spUser.spUserId());
} catch (IllegalStateException e) {
    log.warn("자동 가입 불가 (비즈니스 규칙 위반): spUserId={}, error={}",
            spUser.spUserId(), e.getMessage());
    throw e;
}
```

**2. `GroupMemberMapper.withdrawByUserNo`에서 nickname/email 마스킹 제거로 인한 PII 잔류 가능성**

이전 버전의 `withdrawByUserNo`는 nickname을 '탈퇴한 회원'으로, email을 NULL로 설정하여 PII를 명시적으로 제거했습니다. 그러나 이번 변경에서 nickname/email 컬럼 자체가 DROP되었다면 문제가 없지만, 만약 컬럼이 아직 존재한다면(Phase 전환 중) 기존 데이터에 PII가 그대로 남을 수 있습니다.

- **위치**: `GroupMemberMapper.xml` 라인 100-107
- **분석**: Diff 내용을 보면 `nickname = '탈퇴한 회원'`과 `email = NULL` 설정이 제거되었습니다. 이는 PII email 컬럼 DROP이 선행되었음을 가정합니다. 만약 DDL 마이그레이션이 아직 적용되지 않은 환경이라면, 탈퇴 처리 후에도 nickname/email이 그대로 남는 문제가 발생합니다.
- **권장 사항**: DDL 마이그레이션(ALTER TABLE DROP COLUMN)이 이 커밋보다 먼저 적용되었는지 확인하세요. 만약 아니라면, DDL 적용 전까지는 nickname/email 마스킹 로직을 유지하는 것이 안전합니다.

---

## 주요 파일 분석

### SsoUserResolveService.java

**변경 내용:**
email 기반 재가입/마이그레이션 분기 로직(약 30줄)을 제거하고, sp_user_id 조회 실패 시 바로 자동 가입으로 연결하는 단순한 2-step 구조로 변경. `SsoUserWithdrawalService`, `UserMapper`, `PiiMasker` 의존성 제거.

**개선 제안:**
1. `registerIfAutoRegistrable`에서 `IllegalStateException` 처리 분리 (위 Medium #1 참조)

### SsoUserWithdrawalService.java

**변경 내용:**
로그 출력에서 email 마스킹(`PiiMasker.email()`)을 sp_user_id 마스킹(`PiiMasker.maskUuid()`)으로 변경. Javadoc에서 `SsoUserResolveService` 호출 진입점 참조 업데이트.

**개선 제안:**
1. `user.getSpUserId()` null-safe 처리 (위 High #1 참조)

### GroupMemberMapper.java / GroupMemberMapper.xml

**변경 내용:**
- 제거: `updateGuestToStudent`, `findActiveGuestByGroupIdAndEmail`, `syncSnapshotByUserNo`
- 추가: `withdrawByUserNo` — status='WITHDRAWN' + left_at=NOW() 처리 (nickname/email 마스킹 제거)

**개선 제안:**
1. DDL 마이그레이션 순서 확인 필요 (위 Medium #2 참조)

### UserMapper.xml

**변경 내용:**
`markWithdrawn`에서 email/nickname 마스킹 제거, tc_id/stdt_id/sp_user_id를 NULL로 설정. PII 컬럼 DROP에 따른 변경.

**분석:**
이전에는 `email = CONCAT('withdrawn+', user_no, '@deleted.local')`와 `nickname = '탈퇴한 회원'`으로 설정했으나, 이제 email/nickname 컬럼이 DROP되었으므로 tc_id/stdt_id/sp_user_id를 NULL 처리하는 것으로 변경되었습니다. sp_user_id를 NULL로 설정하면 해당 사용자는 더 이상 SSO 인증으로 로그인할 수 없게 되어 탈퇴 효과가 완전히 달성됩니다.

### DgnssMapper.xml

**변경 내용:**
26개 쿼리에서 gender 컬럼 참조(CASE WHEN gender='M' THEN '남자'...) 제거, nickname을 sp_user_id로 대체. PII 컬럼 DROP에 따른 일괄 정리.

**분석:**
gender 컬럼이 DROP되었으므로, gender를 참조하던 모든 CASE WHEN 표현식을 제거한 것은 올바른 변경입니다. nickname 대신 `u.sp_user_id`를 사용하여 개인정보 노출을 방지한 점도 적절합니다. 다만, gender 정보가 리포트에서 더 이상 제공되지 않으므로, 이에 따른 프론트엔드 영향(예: 학습 분석 리포트에서 성별 필터링)을 확인해야 합니다.

### MemberController.java

**변경 내용:**
`SsoUserMigrationService` import 제거, `SsoUserResolveService` import 추가. `SsoUserMigrationService`가 삭제되었음을 반영.

**분석:**
`SsoUserMigrationService`는 SSO 전환 1회성 마이그레이션을 담당했으나, 이제 모든 회원이 sp_user_id를 보유하므로 불필요해졌습니다. `SsoUserResolveService`로 대체된 것은 아키텍처 결정에 부합합니다.

### application.yml

**변경 내용:**
SSO 이벤트 폴링 설정(`sso.poll.enabled`, `sso.poll.limit`) 추가. SuperPlatform internal-api 설정도 추가.

**분석:**
`sso.poll.enabled`가 기본 `false`로 설정되어 점진적 배포가 가능하도록 설계된 점이 좋습니다. `sso.poll.limit`이 500으로 설정되어 IdP의 max 1000 제한을 고려한 적절한 값입니다. `connect-timeout-ms: 2000`, `read-timeout-ms: 3000`은 외부 API 호출의 타임아웃을 명시적으로 설정하여 장애 전파를 방지합니다.

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [x] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견:**
전반적으로 SSO 재설계 방향성과 PII 제거 작업이 체계적으로 진행되고 있으며, 코드 품질과 문서화 수준이 우수합니다. 다만, `SsoUserWithdrawalService`의 NPE 가능성(High)과 SSO 이벤트 폴링 배포 전까지의 재가입 케이스 리스크(High)는 운영 안정성을 위해 반드시 검토가 필요합니다. 위 High 이슈 2건이 해결되면 승인 가능합니다.