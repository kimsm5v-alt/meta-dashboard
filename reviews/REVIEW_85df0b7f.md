> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 85df0b7f

## 코드 복잡도 분석

**분석된 파일**: 9개 / 변경된 파일: 9개


### 정상 범위 (NONE)


**`dgnssmapper.xml`** (other)

- 평균 복잡도: **0.243**

- 최대 복잡도: 0.474

- 청크 수: 2개

- 평균 사용처: 7.0곳


**권장사항:**

- 복잡도 정상 범위


**`dgnssmapper.java`** (other)

- 평균 복잡도: **0.218**

- 최대 복잡도: 0.466

- 청크 수: 171개

- 평균 사용처: 32.5곳


**권장사항:**

- 파일 크기가 큼 (171개 청크) - 파일 분리 검토


**`dgnssservice.java`** (other)

- 평균 복잡도: **0.152**

- 최대 복잡도: 0.473

- 청크 수: 50개

- 평균 사용처: 17.6곳


**권장사항:**

- 파일 크기가 큼 (50개 청크) - 파일 분리 검토


**`studentexamnotificationevent.java`** (other)

- 평균 복잡도: **0.008**

- 최대 복잡도: 0.008

- 청크 수: 1개


**권장사항:**

- 복잡도 정상 범위


**`examsubmittedevent.java`** (other)

- 평균 복잡도: **0.007**

- 최대 복잡도: 0.007

- 청크 수: 1개


**권장사항:**

- 복잡도 정상 범위


**`teacherexamnotificationevent.java`** (other)

- 평균 복잡도: **0.007**

- 최대 복잡도: 0.007

- 청크 수: 1개


**권장사항:**

- 복잡도 정상 범위


**`notificationeventhandler.java`** (other)

- 평균 복잡도: **0.007**

- 최대 복잡도: 0.008

- 청크 수: 5개


**권장사항:**

- 복잡도 정상 범위


**`features.ts`** (config)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.010

- 청크 수: 4개


**권장사항:**

- Config 파일은 높은 연결도가 정상적임


**`useapidata.ts`** (other)

- 평균 복잡도: **0.001**

- 최대 복잡도: 0.010

- 청크 수: 36개


**권장사항:**

- 파일 크기가 큼 (36개 청크) - 파일 분리 검토


---


## 변경 배경

이 커밋은 **진단검사(Dgnss) 도메인에 알림(Notification) 시스템을 통합**하는 변경입니다. 기존에는 학생이 검사를 제출하거나 교사가 검사를 종료/재시험 요청할 때 별도의 알림이 발송되지 않았으나, 이번 변경을 통해 **Spring의 ApplicationEventPublisher**를 활용한 이벤트 기반 알림 발송 체계를 도입했습니다.

- **목적**: 진단검사 생명주기(배정 -> 제출 -> 전원제출 -> 리포트 생성 -> 재시험 요청)의 각 주요 이벤트에 대해 교사/학생에게 실시간 알림 전송
- **도메인**: 비즈니스 로직 (진단검사 + 알림 시스템 통합)
- **변경 방향**: 기존의 단순 CRUD 위주 로직에서 **이벤트 기반 아키텍처**로 확장하여, 검사 관련 주요 상태 변화를 외부 시스템(알림)에 전파할 수 있도록 개선

---

## [GOOD] 잘된 점

1. **이벤트 클래스 설계가 명확함**: `ExamSubmittedEvent`(단일 제출), `TeacherExamNotificationEvent`(교사용), `StudentExamNotificationEvent`(학생용)로 이벤트를 분리하고, `Kind` enum으로 세부 유형을 구분한 설계는 확장성과 가독성이 좋습니다.

2. **Java Record 활용**: `record` 타입으로 이벤트 클래스를 정의하여 불변성(immutability)을 보장하고 보일러플레이트 코드를 최소화한 점이 좋습니다.

3. **예외 처리 격리**: 각 `publish*` 메서드에서 개별적으로 try-catch로 예외를 처리하여, 알림 발행 실패가 본래의 검사 제출/종료 비즈니스 로직에 영향을 주지 않도록 한 설계가 적절합니다.

4. **중복 제출 방지 로직**: `stSubmit()` 메서드에서 `wasAlreadySubmitted` 플래그를 통해 이미 제출된 건에 대해 이벤트를 중복 발행하지 않도록 처리한 점이 세심합니다.

---

## 변경사항 요약

- **DgnssService.java**: 5개의 이벤트 발행 메서드(`publishExamSubmittedEvent`, `publishExamEndedReportEvent`, `publishExamAllSubmittedEventIfCompleted`, `publishExamReexamRequestedEvent`, `publishExamAssignedEvent`) 추가 및 기존 메서드에 `@Transactional` 애노테이션 보강
- **NotificationEventHandler.java**: 3개의 이벤트 리스너(`onExamSubmitted`, `onTeacherExamNotification`, `onStudentExamNotification`) 추가
- **Mapper/XML**: 5개의 새로운 SQL 쿼리 추가 (알림 대상자 조회, 제출 상태 확인, 완료 정보 조회 등)
- **frontend**: `useApiData.ts`의 조건식 개선, `features.ts`에서 COMMUNITY/RESOURCES 기능 플래그 비활성화

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

#### 1. `publishExamAssignedEvent`에서 불필요한 추가 DB 조회 발생

**파일**: `DgnssService.java`
**위치**: `publishExamAssignedEvent` 메서드 내부

**문제**: `publishExamAssignedEvent`는 `insertTcDgnssStart()` 메서드 내에서 호출됩니다. 그런데 이 메서드는 이미 `dgnssMapper.selectTcDgnssInfoOne(paramMap)`을 호출하여 `dgnssInfoMap`을 가지고 있습니다. 하지만 `publishExamAssignedEvent`는 `paramMap`만 받아서 `dgnssId`로 다시 `selectTcDgnssInfoOneWithDgnssId`를 호출하여 `groupNm`을 조회합니다.

**기존 코드**:
```java
// DgnssService.java - insertTcDgnssStart() 내부
Map<String, Object> dgnssInfoMap = dgnssMapper.selectTcDgnssInfoOne(paramMap);
dgnssInfoMap.put("stTotalCnt", result);
publishExamAssignedEvent(paramMap);  // paramMap만 전달 -> 내부에서 다시 DB 조회
```

**해결 방안**: `dgnssInfoMap`을 `publishExamAssignedEvent`에 함께 전달하여 중복 DB 조회를 제거하세요.

```java
// insertTcDgnssStart() 내부 수정
publishExamAssignedEvent(paramMap, dgnssInfoMap);

// publishExamAssignedEvent 시그니처 변경
private void publishExamAssignedEvent(Map<String, Object> paramMap, Map<String, Object> dgnssInfoMap) {
    // ... 기존 로직에서 dgnssInfoMap을 파라미터로 받아 groupName 추출
    String groupName = MapUtils.getString(dgnssInfoMap, "groupNm", "그룹");
    // ... 나머지 로직 동일
}
```

#### 2. `selectSubmitCompletionInfo` 쿼리의 서브쿼리 성능 이슈

**파일**: `DgnssMapper.xml`
**위치**: `selectSubmitCompletionInfo` 쿼리

**문제**: `totalCount`와 `submittedCount`를 각각 서브쿼리로 계산하고 있습니다. 이 쿼리는 학생이 제출할 때마다(`stSubmit` -> `publishExamAllSubmittedEventIfCompleted`) 호출되므로, 동시에 많은 학생이 제출하는 상황에서 성능 병목이 될 수 있습니다.

**기존 코드**:
```xml
<select id="selectSubmitCompletionInfo" parameterType="int" resultType="map">
    SELECT ...
         , (
            SELECT COUNT(*)
            FROM tb_dgnss_result_info tdri_total
            WHERE tdri_total.dgnss_id = tdi.id
           ) AS totalCount
         , (
            SELECT COUNT(*)
            FROM tb_dgnss_result_info tdri_subm
            WHERE tdri_subm.dgnss_id = tdi.id
              AND tdri_subm.subm_at = 'Y'
           ) AS submittedCount
    FROM tb_dgnss_result_info tdri
        INNER JOIN tb_dgnss_info tdi ON tdri.dgnss_id = tdi.id
        INNER JOIN group_info gi ON tdi.cla_id = gi.cla_id
    WHERE tdri.id = #{dgnssResultId}
    LIMIT 1
</select>
```

**해결 방안**: 서브쿼리를 `COUNT` + `SUM(CASE WHEN ...)` 패턴으로 단일 패스로 변경하세요.

```xml
<select id="selectSubmitCompletionInfo" parameterType="int" resultType="map">
    /* DgnssMapper.selectSubmitCompletionInfo */
    SELECT tdi.id AS dgnssId
         , tdi.ord_no AS ordNo
         , tdi.paper_idx AS paperIdx
         , COALESCE(gi.group_nm, '그룹') AS groupNm
         , gi.host_user_no AS teacherUserNo
         , COUNT(*) AS totalCount
         , SUM(CASE WHEN tdri_all.subm_at = 'Y' THEN 1 ELSE 0 END) AS submittedCount
    FROM tb_dgnss_info tdi
        INNER JOIN tb_dgnss_result_info tdri_all ON tdri_all.dgnss_id = tdi.id
        INNER JOIN group_info gi ON tdi.cla_id = gi.cla_id
    WHERE tdi.id = (
        SELECT tdi2.dgnss_id
        FROM tb_dgnss_result_info tdri2
        WHERE tdri2.id = #{dgnssResultId}
        LIMIT 1
    )
    GROUP BY tdi.id, tdi.ord_no, tdi.paper_idx, gi.group_nm, gi.host_user_no
    LIMIT 1
</select>
```

### Medium (개선 권장)

#### 1. `resolveExamNameByPaperIdx`의 하드코딩된 문자열

**파일**: `DgnssService.java`
**위치**: `resolveExamNameByPaperIdx` 메서드

**문제**: 검사명이 `"1"` -> `"학습종합검사"`, 그 외 -> `"자기조절학습검사"`로 하드코딩되어 있습니다. 비즈니스 요구사항 변경 시 유지보수가 어렵습니다.

**개선 제안**: Enum이나 DB 설정으로 관리하거나, 최소한 상수로 분리하는 것을 검토하세요.

```java
private static final String PAPER_IDX_COMPREHENSIVE = "1";
private static final String EXAM_NAME_COMPREHENSIVE = "학습종합검사";
private static final String EXAM_NAME_SELF_REGULATION = "자기조절학습검사";

private String resolveExamNameByPaperIdx(String paperIdx) {
    return StringUtils.equals(StringUtils.trimToEmpty(paperIdx), PAPER_IDX_COMPREHENSIVE)
            ? EXAM_NAME_COMPREHENSIVE
            : EXAM_NAME_SELF_REGULATION;
}
```

#### 2. `publishExamAllSubmittedEventIfCompleted`의 네이밍

**파일**: `DgnssService.java`
**위치**: 메서드 선언부

**문제**: 메서드명이 너무 길고 `IfCompleted`라는 조건부 의미가 포함되어 있어, 호출부에서 이 메서드가 실제로 이벤트를 발행할 수도 있고 안 할 수도 있다는 점을 직관적으로 알기 어렵습니다.

**개선 제안**: `tryPublishAllSubmittedEvent` 또는 `publishAllSubmittedEventIfAllSubmitted` 정도로 단순화하거나, JavaDoc에 조건부 발행임을 명시하는 것이 좋습니다.

#### 3. `onStudentExamNotification`에서 개별 dispatch 반복

**파일**: `NotificationEventHandler.java`
**위치**: `onStudentExamNotification` 메서드

**문제**: `createBatch`로 일괄 생성한 Notification을 개별적으로 `dispatcher.dispatch()`를 호출하고 있습니다. `dispatcher`에 배치 dispatch 메서드가 있다면 활용하는 것이 좋습니다.

---

## 주요 파일 분석

### DgnssService.java

**변경 내용**: 5개의 이벤트 발행 메서드 추가, `stSubmit()`에 중복 제출 방지 로직 및 이벤트 발행 조건 추가, 주요 메서드에 `@Transactional` 보강

**개선 제안**:
1. **`publishExamAssignedEvent`의 중복 DB 조회** (위 High #1 참조)
2. **`@Transactional` 범위 검토**: `insertTcDgnssStart`와 `updateTcDgnssEnd`에 `@Transactional(rollbackFor = Exception.class)`가 추가되었으나, `tcDgnssRestart`에도 동일 애노테이션이 추가되었습니다. `tcDgnssRestart` 내부에서 `publishExamReexamRequestedEvent` 호출 시 예외가 발생하면 트랜잭션이 롤백되면서 이벤트 발행도 취소됩니다. `@TransactionalEventListener(phase = AFTER_COMMIT)`을 사용하는 리스너 구조이므로, 이벤트 발행 자체는 롤백되지 않지만 이벤트 발행 전에 DB 작업이 롤백되면 일관성이 깨질 수 있습니다. 현재는 try-catch로 보호되어 있어 큰 문제는 없으나, 의도된 동작인지 확인이 필요합니다.

### NotificationEventHandler.java

**변경 내용**: 3개의 새로운 `@TransactionalEventListener` 메서드 추가

**개선 제안**:
1. **`onTeacherExamNotification`의 if-else 분기**: `T4`와 `T6`를 if-else로 구분하고 있는데, `Kind` enum이 확장될 경우 switch 문으로 변경하는 것이 유지보수에 유리합니다.

### DgnssMapper.xml

**변경 내용**: 5개의 새로운 SQL 쿼리 추가

**개선 제안**:
1. **`selectSubmitCompletionInfo` 서브쿼리 성능** (위 High #2 참조)
2. **`selectSubmitNotificationInfo`의 LEFT JOIN 조건**: `gm.stdt_id = tdri.stdt_id` 조건으로 LEFT JOIN하고 있으나, `group_member`에 `stdt_id`가 없는 경우 `studentNickname`이 `tdri.stdt_id`로 fallback됩니다. 이는 적절한 fallback 처리이나, `COALESCE`보다는 `NULLIF` + `COALESCE` 조합으로 빈 문자열도 처리하는 것이 더 안전할 수 있습니다.

### useApiData.ts (frontend)

**변경 내용**: `hasJwt` 변수 제거, `!!user`로 조건식 단순화

**평가**: 간결해지고 의미가 명확해졌습니다. JWT 존재 여부보다 사용자 객체 존재 여부가 더 직관적인 조건입니다. **이상 없음.**

### features.ts (frontend)

**변경 내용**: `COMMUNITY`와 `RESOURCES` 기능 플래그를 `false`로 변경

**평가**: MVP 스코프 조정에 따른 적절한 변경입니다. **이상 없음.**

---

## 최종 평가

**결론**:
- [ ] [OK] **승인 (Approved)** - Critical/High 이슈 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - Medium 이하 이슈만 존재
- [X] [FIX] **수정 필요 (Changes Requested)** - Critical/High 이슈 존재

**종합 의견**: 전반적으로 이벤트 기반 알림 시스템 도입이라는 큰 그림은 잘 설계되었습니다. 이벤트 클래스 분리, 예외 격리, 중복 제출 방지 등 세심한 부분까지 고려된 점이 인상적입니다. 다만 **`publishExamAssignedEvent`에서의 중복 DB 조회(High)** 와 **`selectSubmitCompletionInfo` 서브쿼리 성능(High)** 이슈는 실제 운영 환경에서 성능 저하로 이어질 수 있으므로, 머지 전에 수정을 권장합니다. 두 이슈 모두 수정 범위가 작고 영향도가 명확하므로 빠르게 조치 가능할 것으로 보입니다.