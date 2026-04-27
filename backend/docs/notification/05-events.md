# 05. 이벤트별 구현 상세

---

## 이벤트 분류

### 즉시 발생 (Application Event)

비즈니스 로직 성공 시 `@TransactionalEventListener(AFTER_COMMIT)`로 알림 insert.

| 코드 | 트리거 | 수신자 | 카테고리 |
|---|---|---|---|
| T1 | 학생 그룹 가입 성공 | 그룹 오너 교사 | GROUP |
| T2 | 학생 그룹 탈퇴 (LEFT만) | 그룹 오너 교사 | GROUP |
| T3 | 학생 검사 제출 성공 | 그룹 오너 교사 | EXAM |
| T4 | 검사 전원 제출 완료 시점 | 그룹 오너 교사 | EXAM |
| S1 | 교사가 그룹에 검사 생성 | 그룹 소속 학생 전원 | EXAM |
| S3 | 교사가 결과 공개 | 해당 학생 | EXAM |
| S5 | 교사가 학생 추방 (KICKED) | 추방된 학생 | GROUP |
| S6 | 교사가 재응시 요청 | 해당 학생 | EXAM |

### 배치 (스케줄러)

| 코드 | 주기 | 조건 |
|---|---|---|
| T5 | 매일 08:00 | 마감 D-3~D-1 검사 중 미제출자 있는 그룹의 오너 교사 |
| S2 | 매일 08:00 | 마감 D-3~D-1 검사 중 본인이 미제출 학생 |
| (삭제) | 매일 03:00 | `created_at < NOW() - 90일`인 알림 DELETE |

### 외부 채널 (이메일)

| 코드 | 채널 | 트리거 |
|---|---|---|
| S4 | 인앱 + 이메일 | 교사가 초대 메일 발송 (⚠️ 기능 존재 확인 필요) |
| C1 | 이메일 | 회원가입 완료 (학심정 `createUser` 성공 후) |

---

## 이벤트별 상세

### T1. 학생 그룹 가입

**트리거**: `GroupService.joinGroup()` 트랜잭션 커밋 후.

**이벤트 객체**:
```java
public record StudentJoinedGroupEvent(
    Long groupId,
    String groupName,
    String studentNickname,
    Long teacherUserNo
) {}
```

**리스너**:
```java
@TransactionalEventListener(phase = AFTER_COMMIT)
public void on(StudentJoinedGroupEvent e) {
    String content = String.format("%s 학생이 '%s' 그룹에 참여했습니다.",
            e.studentNickname(), e.groupName());
    String link = "/groups/" + e.groupId();
    notificationService.create(e.teacherUserNo(), NotificationCategory.GROUP, "T1", content, link);
}
```

---

### T2. 학생 그룹 탈퇴

**트리거**: `group_member.status`가 `ACTIVE → LEFT`로 변경 시.

**범위 결정**:
- `LEFT` (자발적 탈퇴): T2 발송
- `KICKED` (교사 추방): T2 **미발송** (교사 본인 행동)
- `ARCHIVED` (그룹 종료): T2 미발송

**문구**: `%닉네임% 학생이 그룹을 탈퇴했습니다.`

---

### T3. 학생 검사 제출

**트리거**: 검사 제출 API 성공 (트랜잭션 커밋 후).

**이벤트 객체**:
```java
public record ExamSubmittedEvent(
    Long groupId,
    String groupName,
    String examName,
    int round,
    String studentNickname,
    Long teacherUserNo,
    int submittedCount,
    int totalCount
) {}
```

**리스너**:
```java
@TransactionalEventListener(phase = AFTER_COMMIT)
public void on(ExamSubmittedEvent e) {
    // T3 알림
    String t3Content = String.format("%s 학생이 %d차 %s를 제출했습니다.",
            e.studentNickname(), e.round(), e.examName());
    notificationService.create(e.teacherUserNo(), NotificationCategory.EXAM, "T3", t3Content, "/assessment");
    
    // T4: 전원 완료 여부 확인
    if (e.submittedCount() == e.totalCount()) {
        String t4Content = String.format(
            "%s %d차 %s 전원 제출이 완료되었습니다. [검사 종료] 시 리포트가 생성됩니다.",
            e.groupName(), e.round(), e.examName());
        notificationService.create(e.teacherUserNo(), NotificationCategory.EXAM, "T4", t4Content, "/assessment");
    }
}
```

**대안**: T4를 별도 배치로 분리할 경우 `@Scheduled`로 주기 체크. MVP는 인라인 체크 선택.

---

### T5. 교사 미제출 리마인더 (스케줄러)

**주기**: 매일 08:00 Asia/Seoul.

**대상**: 마감일 기준 D-3, D-2, D-1인 검사 중 미제출자가 1명이라도 있는 그룹의 오너 교사.

**문구**: `%그룹명% %N차% %검사명% 기한 마감 %남은 일수%일 전입니다. 미제출한 학생이 있다면 검사 진행을 안내해 주세요.`

**구현**:
```java
@Scheduled(cron = "0 0 8 * * *", zone = "Asia/Seoul")
@SchedulerLock(name = "sendExamReminders", lockAtMostFor = "PT30M", lockAtLeastFor = "PT5M")
public void sendExamReminders() {
    // 1. 마감 D-3~D-1 검사 조회
    // 2. 각 검사별 미제출자 count > 0인 그룹 추출
    // 3. 각 오너 교사에게 T5 알림 insert (배치)
    // 4. 각 미제출 학생에게 S2 알림 insert (배치)
}
```

---

### T6. 검사 종료 / 리포트 생성

**트리거**: ⚠️ **확정 필요** (기획 확인 항목 참조).

**후보 시점**:
- 교사가 [검사 종료] 버튼 클릭 + 집계 배치 완료
- 검사 마감일 도래 + 자동 집계

**문구**: `%그룹명% %N차% %검사명% 리포트가 생성되었습니다. 대시보드에서 결과를 확인해 보세요.`

**링크**: `/dashboard`

---

### S1. 새 검사 배정

**트리거**: 교사가 그룹에 검사 생성 API 성공.

**수신자**: 검사 생성 시점의 그룹 `ACTIVE` 멤버 전원.

**주의**:
- 배치 insert (`<foreach>`)로 N명에게 동시 insert
- 이후 가입자에겐 S1 미발송 (진입 유도는 별도 UI)

**문구**: `%그룹명% %N차% %검사명% 검사가 시작되었어요.`

---

### S2. 검사 마감 임박 (스케줄러)

T5와 같은 스케줄러에서 함께 처리.

**대상**: 본인이 아직 미제출한 검사 중 마감 D-3~D-1인 학생.

**문구**: `%그룹명% %N차% %검사명% 검사 종료까지 %남은 일수%일 남았어요.`

---

### S3. 결과 공개

**트리거**: ⚠️ **확정 필요**.

**후보**:
- 교사가 [결과 공개] 수동 버튼
- 검사 종료 시 자동 공개

**수신자**: 해당 검사를 제출한 학생 전원.

**문구**: `%그룹명% %N차% %검사명% 리포트가 생성되었어요. 대시보드에서 결과를 확인해 보세요.`

**링크**: `/student/result`

---

### S4. 그룹 초대 수신 ⚠️

**기능 존재 여부 미확인**. 현재 학심정은 `/join/{inviteCode}` 링크 기반 가입만 존재.

**MVP 결정 대기**:
- 신규 개발하면: 교사가 이메일 목록 입력 → 초대 메일 + 알림 생성
- MVP 제외 시: 고도화로 이월

---

### S5. 그룹 추방 ⚠️

**기능 존재 여부 미확인**. `group_member.status = KICKED` enum은 있으나 UI 존재 확인 필요.

**트리거 후보**: 교사 추방 API 성공 시.

**수신자**: 추방된 학생.

**문구**: `%그룹명% 그룹에서 퇴장 되었어요.`

---

### S6. 재검사 권유 ⚠️

**기능 존재 여부 미확인**.

**트리거 후보**: 교사 재응시 요청 API 성공 시.

**수신자**: 해당 학생.

**문구**: `선생님이 %N차% %검사명% 다시 한번 응시를 요청했어요.`

---

### C1. 회원가입 축하

**채널**: 이메일만 (인앱 알림 없음).

**트리거**: 학심정 `SsoUserRegistrationService.register()` 성공 후.

**주의**: Auth 서버가 자체 가입 축하 메일을 보낼 수 있음 → **중복 발송 방지 확인 필요** (Auth 팀 협의).

**문구**:
```
제목: 학심정 회원가입을 축하드립니다
본문:
%닉네임%님은 정상적으로 회원가입이 완료 되었습니다.

회원 아이디: %이메일%

[로그인]
```

---

## 이벤트 → 알림 발송 흐름 (전체)

```
[비즈니스 로직]
    ↓ publishEvent
[ApplicationEvent]
    ↓ AFTER_COMMIT
[NotificationEventHandler]
    ↓ 알림 생성
[NotificationService.create()]
    ↓ DB insert
[notification 테이블 row 추가]
    ↓ NotificationPubSubBridge.publish()
[Redis PUBLISH meta-noti:user:{userNo}]
    ↓ (모든 BE 인스턴스 구독 중)
[해당 userNo 연결 보유한 서버]
    ↓ SseEmitter.send()
[FE SSE 수신]
    ↓ 뱃지 +1, 토스트 표시
[사용자 경험]
```
