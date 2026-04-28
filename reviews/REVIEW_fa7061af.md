> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - fa7061af

## 코드 복잡도 분석

**분석된 파일**: 9개 / 변경된 파일: 11개


### 정상 범위 (NONE)


**`groupservice.java`** (other)

- 평균 복잡도: **0.160**

- 최대 복잡도: 0.471

- 청크 수: 6개

- 평균 사용처: 12.5곳


**권장사항:**

- 복잡도 정상 범위


**`groupinvitationservice.java`** (other)

- 평균 복잡도: **0.008**

- 최대 복잡도: 0.008

- 청크 수: 1개


**권장사항:**

- 복잡도 정상 범위


**`groupinvitedevent.java`** (other)

- 평균 복잡도: **0.007**

- 최대 복잡도: 0.007

- 청크 수: 1개


**권장사항:**

- 복잡도 정상 범위


**`studentjoinedgroupevent.java`** (other)

- 평균 복잡도: **0.007**

- 최대 복잡도: 0.007

- 청크 수: 1개


**권장사항:**

- 복잡도 정상 범위


**`notificationeventhandler.java`** (other)

- 평균 복잡도: **0.007**

- 최대 복잡도: 0.008

- 청크 수: 4개


**권장사항:**

- 복잡도 정상 범위


**`notificationmapper.xml`** (other)

- 평균 복잡도: **0.007**

- 최대 복잡도: 0.007

- 청크 수: 1개


**권장사항:**

- 복잡도 정상 범위


**`studentkickedevent.java`** (other)

- 평균 복잡도: **0.006**

- 최대 복잡도: 0.006

- 청크 수: 1개


**권장사항:**

- 복잡도 정상 범위


**`studentleftgroupevent.java`** (other)

- 평균 복잡도: **0.006**

- 최대 복잡도: 0.006

- 청크 수: 1개


**권장사항:**

- 복잡도 정상 범위


**`notificationservice.java`** (other)

- 평균 복잡도: **0.004**

- 최대 복잡도: 0.008

- 청크 수: 8개


**권장사항:**

- 복잡도 정상 범위


---


**결론**: 이 커밋은 **조건부 승인 (Approved with Comments)** 수준입니다. 명백한 버그나 성능 저하는 없으며, 이벤트 기반 알림 연동 아키텍처가 명확하게 설계되어 있습니다. 로깅 개선(스택 트레이스 출력)만 적용하면 운영 관점에서 완성도가 높아집니다.

---

## 1. 변경사항 요약

그룹 영역의 4가지 동작에 대해 알림 이벤트를 연동한 커밋입니다.

| 이벤트 코드 | 트리거 | 발행 위치 | 수신자 |
|---|---|---|---|
| T1 | 학생 그룹 가입 (Player/Guest) | GroupService.joinAsPlayer, joinAsGuest | 교사 (hostUserNo) |
| T2 | 학생 자발적 탈퇴 | GroupService.leaveGroup | 교사 (hostUserNo) |
| S4 | 교사가 이메일 초대 발송 | GroupInvitationService.sendInvitation | 초대받은 학생 (기존 회원만) |
| S5 | 교사가 학생 강제 추방 | GroupService.kickMember | 추방당한 학생 (회원만) |

총 11개 파일이 변경되었으며, 핵심은 다음과 같습니다:
- **GroupService** / **GroupInvitationService** : `ApplicationEventPublisher.publishEvent()`로 이벤트 발행
- **NotificationEventHandler** (신규) : `@TransactionalEventListener(AFTER_COMMIT)`로 이벤트 수신, DB 저장 + SSE dispatch
- **NotificationService** : 기존에 있던 `dispatch` 호출 제거 (리스너가 직접 처리)
- **NotificationMapper.xml** : `insert`, `insertBatch`에 `useGeneratedKeys="true"` 추가

---

## 2. [GOOD] 잘 설계된 부분

### 2.1. 관심사 분리와 이벤트 기반 아키텍처

GroupService는 그룹 비즈니스 로직에만 집중하고, 알림 생성/전달은 전혀 알지 못합니다. 예를 들어 `leaveGroup` 메서드의 끝부분을 보면:

```java
// GroupService.java (L422)
GroupInfo groupInfo = groupInfoMapper.findGroupInfoById(member.getGroupId());
if (groupInfo != null && groupInfo.getHostUserNo() != null) {
    eventPublisher.publishEvent(new StudentLeftGroupEvent(
            groupInfo.getHostUserNo(),
            groupInfo.getClaId(),
            member.getNickname()
    ));
}
```

GroupService는 "탈퇴 이벤트가 발생했다"는 사실만 알리고, 누가, 어떻게 알림을 받을지는 전혀 신경 쓰지 않습니다. 이는 단일 책임 원칙(SRP)을 잘 지킨 설계입니다.

### 2.2. 트랜잭션 격리 (Fire-and-Forget)

`NotificationEventHandler`는 다음과 같은 조합으로 본 업무 트랜잭션과 알림 처리를 완전히 분리했습니다:

```java
// NotificationEventHandler.java
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void onStudentJoined(StudentJoinedGroupEvent e) {
    try {
        // ... 알림 생성 및 dispatch ...
    } catch (Exception ex) {
        log.warn("[Notification] T1 처리 실패: {}", ex.getMessage());
    }
}
```

- `AFTER_COMMIT` : 그룹 비즈니스 로직(join, leave, kick)의 트랜잭션이 성공적으로 커밋된 후에만 실행됩니다. 롤백 시에는 리스너가 아예 호출되지 않아 알림 불일치가 발생하지 않습니다.
- `REQUIRES_NEW` : 리스너 자체가 독립된 트랜잭션에서 실행되므로, 알림 저장/전달이 실패해도 원래 비즈니스 로직에는 영향을 주지 않습니다.
- `try-catch` : 리스너 내부의 예외를 잡아서 로그만 남기고 종료하므로, SSE dispatch 실패 등이 본 업무에 전파되지 않습니다.

### 2.3. Java record를 활용한 불변 이벤트 DTO

4개의 이벤트 클래스가 모두 `record`로 선언되어 있어, 생성자/equals/hashCode/toString이 자동 생성되고 불변성이 보장됩니다:

```java
public record StudentJoinedGroupEvent(
        Long teacherUserNo,
        String claId,
        String groupName,
        String studentNickname
) {}
```

각 필드에 용도가 주석으로 명확히 문서화되어 있어, 새로운 개발자가 봐도 이벤트의 의도를 파악하기 쉽습니다.

### 2.4. 게스트 멤버에 대한 스마트한 스킵 처리

`kickMember` 메서드에서 게스트(userNo == null)는 인앱 알림이 불가능하므로 이벤트 발행 자체를 건너뜁니다:

```java
// GroupService.java (L461)
if (member.getUserNo() != null) {
    eventPublisher.publishEvent(new StudentKickedEvent(
            member.getUserNo(),
            groupInfo.getGroupNm()
    ));
}
```

불필요한 이벤트 발행과 리스너 호출을 방지하여 불필요한 리소스 소모를 줄인 좋은 판단입니다.

### 2.5. `insertBatch`에 `useGeneratedKeys` 추가

```xml
<!-- NotificationMapper.xml -->
<insert id="insertBatch" parameterType="list"
        useGeneratedKeys="true" keyProperty="list.notificationId">
```

`createBatch()`로 대량 알림을 생성할 때, 각 Notification의 PK(notificationId)가 자동으로 채워져 반환됩니다. 호출자가 반환된 리스트를 순회하면서 개별 dispatch를 수행해야 하는 구조에서 이 PK가 필요하므로, 이 변경은 반드시 필요한 수정이었습니다.

---

## 3. [ISSUE] 개선 제안

### 3.1. Medium - 예외 로깅 시 스택 트레이스 누락 (우선 수정 권장)

**문제점**: 4개 핸들러의 catch 블록이 모두 `ex.getMessage()`만 출력하고, 예외 객체 자체를 로깅 프레임워크에 전달하지 않아 스택 트레이스가 출력되지 않습니다.

**영향**: 운영 장애 발생 시 "처리 실패" 메시지만 남고, 실제로 어디서 예외가 발생했는지(어느 라인, 어떤 호출 스택인지)를 알 수 없어 디버깅에 많은 시간이 소요됩니다.

**위치**: NotificationEventHandler.java, 라인 37, 54, 71, 100 (4개 핸들러 모두 동일 패턴)

**기존 코드** (T1 예시):
```java
} catch (Exception ex) {
    log.warn("[Notification] T1 처리 실패: {}", ex.getMessage());
}
```

**수정 코드**:
```java
} catch (Exception ex) {
    log.warn("[Notification] T1 처리 실패", ex);
}
```

**설명**: SLF4J의 `log.warn(String format, Object arg)` 시그니처는 두 번째 인자로 예외 객체를 받으면 자동으로 메시지와 함께 전체 스택 트레이스를 출력합니다. `{}` placeholder와 `ex.getMessage()`를 별도로 전달할 필요가 없습니다. 4개 핸들러(T1, T2, S4, S5) 모두 동일한 방식으로 수정해야 합니다.

### 3.2. Low - 초대 이메일 발송 시점과 S4 이벤트 발행 시점의 일관성

**관찰**: `GroupInvitationService.sendInvitation()`에서 메일 발송(`ncpMailSender.sendGroupInvitation()`)과 S4 이벤트 발행이 동일한 `@Transactional` 트랜잭션 내에서 이루어집니다. 메일 발송은 외부 API 호출(네트워크 I/O)이므로 트랜잭션 내에서 장시간 블로킹될 가능성이 있습니다.

**현재 코드**:
```java
// 메일 발송 (외부 API 호출)
ncpMailSender.sendGroupInvitation(email, groupInfo.getGroupNm(), groupInfo.getInviteCode());

// S4 알림 이벤트 발행
User invitee = userMapper.findByEmail(email);
if (invitee != null && invitee.getUserNo() != null) {
    eventPublisher.publishEvent(new GroupInvitedEvent(...));
}
```

**제안**: 현재 문제가 발생하고 있지는 않지만, 향후 메일 발송이 지연될 경우를 대비하여 메일 발송을 트랜잭션 외부(비동기)로 분리하거나, 메일 발송 후 이벤트를 발행하는 순서를 유지하되 트랜잭션 커밋이 빨리 이루어지도록 구조를 검토할 수 있습니다. 다만 현재는 심각한 문제는 아니므로, 추후 리팩토링 항목으로 기록해두는 것을 권장합니다.

---

## 4. 주요 파일 분석

### NotificationEventHandler.java (신규, 125줄)

이 커밋의 핵심 파일입니다. 4개의 리스너 메서드가 모두 동일한 패턴을 따릅니다:

1. `@TransactionalEventListener(AFTER_COMMIT)` 선언
2. `@Transactional(REQUIRES_NEW)` 선언
3. 이벤트 객체에서 필요한 필드 추출
4. `String.format()`으로 알림 문구 생성
5. `notificationService.create()`로 DB 저장
6. `dispatcher.dispatch()`로 SSE 전달
7. 전체를 try-catch로 감싸서 fire-and-forget

이 패턴의 일관성은 좋지만, 4번의 반복되는 보일러플레이트 코드가 있습니다. 추후 이벤트 유형이 늘어나면 리팩토링(예: 공통 템플릿 메서드 패턴 도입)을 고려할 수 있습니다.

### GroupService.java (+40줄)

변경된 3군데의 이벤트 발행 포인트를 확인했습니다:

| 메서드 | 라인 | 이벤트 |
|---|---|---|
| publishStudentJoined() | L328 | StudentJoinedGroupEvent (T1) |
| leaveGroup() | L422 | StudentLeftGroupEvent (T2) |
| kickMember() | L461 | StudentKickedEvent (S5) |

`publishStudentJoined()`를 private 메서드로 추출하여 `joinAsPlayer`(신규 가입 + 재가입)와 `joinAsGuest`에서 재사용한 점이 효율적입니다. 재가입 시에도 `existing.setNickname(user.getNickname())`으로 최신 닉네임을 반영한 후 이벤트를 발행하므로, 닉네임 변경이 알림 문구에 정확히 반영됩니다.

### GroupInvitationService.java (+16줄)

S4 이벤트 발행은 `sendInvitation` 메서드 내에서 조건부로 이루어집니다:

```java
User invitee = userMapper.findByEmail(email);
if (invitee != null && invitee.getUserNo() != null) {
    eventPublisher.publishEvent(new GroupInvitedEvent(...));
}
```

- `invitee != null` : 해당 이메일로 가입된 회원이 존재하는지 확인
- `invitee.getUserNo() != null` : userNo가 유효한지 추가 확인 (null-safe)

이 조건 분기로 인알 알림이 불가능한 미가입자에게 불필요한 이벤트를 발행하지 않습니다.

### NotificationService.java (-24줄)

기존에 `create` 메서드 내에 있던 `dispatcher.dispatch()` 호출이 제거되었습니다. 이로 인해 NotificationService는 "알림을 DB에 저장하는 책임"만 가지게 되었고, "실시간 전달"은 NotificationEventHandler가 담당하게 되었습니다. SRP 관점에서 올바른 방향입니다.

---

## 5. 최종 평가

| 구분 | 평가 |
|---|---|
| Critical 이슈 | 없음 |
| High 이슈 | 없음 |
| Medium 이슈 | 1건 (로깅 개선 - 스택 트레이스 출력) |
| Low 이슈 | 1건 (메일 발송 트랜잭션 고려사항, 기록용) |

**결론**: **조건부 승인 (Approved with Comments)**

- **승인 사유**: 전체적인 아키텍처 설계가 명확하고, 트랜잭션 격리, 게스트 스킵 처리, 공통 메서드 추출 등 실무에서 중요한 포인트를 잘 고려했습니다. 변경된 11개 파일 모두 일관된 패턴을 유지하고 있습니다.
- **권장 개선**: 4개 핸들러의 catch 블록에서 `log.warn("...", ex)` 형태로 예외 객체를 전달하여 스택 트레이스가 출력되도록 수정하는 것을 권장합니다. 이는 운영 디버깅 효율성에 직접적인 영향을 주는 사항입니다.