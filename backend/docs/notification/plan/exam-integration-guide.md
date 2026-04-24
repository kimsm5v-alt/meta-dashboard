# 검사 영역 알림 연동 가이드

> 검사 관련 이벤트(T3/T4/T5/T6, S1/S2/S3/S6)를 검사 도메인 코드에 붙이기 위한 가이드.
>
> 이 문서는 검사 코드를 수정 중인 담당자에게 전달되어, 병합 이후 알림 연동만 추가하도록 한다.

---

## 📋 개요

### 알림 기능 뼈대는 이미 완성되어 있음

`feature/notification` 브랜치에 BE 뼈대가 있어, **이벤트 클래스 1개 만들고 기존 로직에 `eventPublisher.publishEvent(...)` 한 줄 추가**하면 알림이 자동으로 생성/전달된다.

- DB 테이블: `notification` (이미 생성)
- Service/Controller/SSE: 이미 구현
- 리스너 패턴: `@TransactionalEventListener(AFTER_COMMIT)` — 본 업무 커밋 후에만 알림 발송 → 롤백 시 알림도 안 감

---

## 🎯 검사 관련 이벤트 목록

| 코드 | 트리거 시점 | 수신자 | 카테고리 | 문구 템플릿 | 딥링크 |
|---|---|---|---|---|---|
| T3 | 학생 제출 성공 | 그룹 오너 교사 | EXAM | `%닉네임% 학생이 %N%차 %검사명%를 제출했습니다.` | `/assessment` |
| T4 | 전원 제출 완료 시점 | 그룹 오너 교사 | EXAM | `%그룹명% %N%차 %검사명% 전원 제출이 완료되었습니다. [검사 종료] 시 리포트가 생성됩니다.` | `/assessment` |
| T5 | 스케줄러 (매일 08:00, D-3 ~ D-1) | 그룹 오너 교사 | EXAM | `%그룹명% %N%차 %검사명% 기한 마감 %남은일수%일 전입니다. 미제출한 학생이 있다면 검사 진행을 안내해 주세요.` | `/assessment` |
| T6 | 집계 배치 완료 시 (⚠️ 정의 확정 필요) | 그룹 오너 교사 | EXAM | `%그룹명% %N%차 %검사명% 리포트가 생성되었습니다. 대시보드에서 결과를 확인해 보세요.` | `/dashboard` |
| S1 | 교사가 검사 배정 | 그룹 소속 학생 전원 | EXAM | `%그룹명% %N%차 %검사명% 검사가 시작되었어요.` | `/student/exams` |
| S2 | 스케줄러 (매일 08:00, D-3 ~ D-1) | 미제출 학생 | EXAM | `%그룹명% %N%차 %검사명% 검사 종료까지 %남은일수%일 남았어요.` | `/student/exams` |
| S3 | 결과 공개 시 (⚠️ 시점 확정 필요) | 해당 학생 | EXAM | `%그룹명% %N%차 %검사명% 리포트가 생성되었어요. 대시보드에서 결과를 확인해 보세요.` | `/student/result` |
| S6 | 교사가 재응시 요청 (⚠️ 기능 존재 확인) | 해당 학생 | EXAM | `선생님이 %N%차 %검사명% 다시 한번 응시를 요청했어요.` | `/student/exams` |

---

## 🔧 연동 절차 (예시: T3 학생 검사 제출)

### Step 1 — 이벤트 클래스 생성

`backend/src/main/java/com/vs/meta/api/notification/event/ExamSubmittedEvent.java`

```java
package com.vs.meta.api.notification.event;

/**
 * T3/T4 — 학생 검사 제출.
 * submittedCount == totalCount면 T4 (전원 완료)도 발행됨.
 *
 * @param teacherUserNo   수신자 (그룹 오너 교사)
 * @param groupName       그룹명 (문구 박제)
 * @param examName        검사명 (문구 박제)
 * @param round           N차 (1 or 2)
 * @param studentNickname 제출한 학생 닉네임
 * @param submittedCount  현재까지 제출한 인원 수
 * @param totalCount      총 배정 인원
 */
public record ExamSubmittedEvent(
        Long teacherUserNo,
        String groupName,
        String examName,
        int round,
        String studentNickname,
        int submittedCount,
        int totalCount
) {}
```

### Step 2 — 리스너에 처리 로직 추가

`backend/src/main/java/com/vs/meta/api/notification/listener/NotificationEventHandler.java` 에 메서드 추가:

```java
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void onExamSubmitted(ExamSubmittedEvent e) {
    try {
        // T3
        String t3Content = String.format("%s 학생이 %d차 %s를 제출했습니다.",
                e.studentNickname(), e.round(), e.examName());
        Notification t3 = notificationService.create(
                e.teacherUserNo(), NotificationCategory.EXAM, "T3", t3Content, "/assessment");
        dispatcher.dispatch(e.teacherUserNo(), NotificationDto.from(t3));

        // T4: 전원 제출 완료 시 추가 발송
        if (e.submittedCount() == e.totalCount()) {
            String t4Content = String.format(
                    "'%s' %d차 %s 전원 제출이 완료되었습니다. [검사 종료] 시 리포트가 생성됩니다.",
                    e.groupName(), e.round(), e.examName());
            Notification t4 = notificationService.create(
                    e.teacherUserNo(), NotificationCategory.EXAM, "T4", t4Content, "/assessment");
            dispatcher.dispatch(e.teacherUserNo(), NotificationDto.from(t4));
        }
    } catch (Exception ex) {
        // SLF4J — 마지막 인자가 Throwable이면 placeholder에 소비되지 않고 스택트레이스로 출력됨
        log.warn("[Notification] T3/T4 처리 실패", ex);
    }
}
```

### Step 3 — 검사 제출 로직에 이벤트 발행 추가

예: `DgnssService.submit(...)` 또는 해당하는 메서드:

```java
@Service
@RequiredArgsConstructor
public class DgnssService {
    private final ApplicationEventPublisher eventPublisher;
    // ... 기존 필드

    @Transactional
    public void submit(...) {
        // ... 기존 제출 로직

        // 제출 완료 후 이벤트 발행
        int submittedCount = ...;  // 현재 제출 수 조회
        int totalCount = ...;      // 배정 인원 수
        Long teacherUserNo = ...;  // 그룹 오너 userNo
        String groupName = ...;
        String examName = ...;
        int round = ...;
        String studentNickname = ...;

        eventPublisher.publishEvent(new ExamSubmittedEvent(
                teacherUserNo, groupName, examName, round,
                studentNickname, submittedCount, totalCount
        ));
    }
}
```

### Step 4 — 테스트

#### (a) 빠른 단위 확인 — 이벤트 → 리스너 → DB/SSE 파이프라인만 격리 검증

BE를 `@Profile("local")` 로 기동한 뒤 브라우저에서:

```
http://localhost:8081/dev/notification-tester
```

이 테스터는 **이벤트 publish 이후 경로 전체**를 실제와 동일하게 탄다 (리스너 → DB insert → SSE 전송). 상위 비즈 로직(검사 제출 로직 자체)은 우회하고 이벤트 파라미터를 직접 입력하여 발화.

검사 이벤트용 트리거 폼이 필요하면 `NotificationDebugController` 에 기존 `fireT1/T2/S4/S5` 와 동일한 패턴으로 추가 (예: `fireT3` 등). T3/T4/S1/S3 각각 30초면 추가 가능.

#### (b) 풀 E2E — 실 비즈 로직 포함 검증

로컬 환경에서:
1. 교사 로그인 → 브라우저 `/dev/notification-tester` 접속 후 SSE 연결 (본인 userNo 로)
2. 학생 계정으로 검사 제출 API 호출 (실 로직 경로)
3. 교사 화면(테스터 우측 로그)에 T3 알림 즉시 수신되는지 확인
4. DB에 notification row 생성되는지 확인 (`SELECT * FROM notification ORDER BY notification_id DESC`)

---

## 📌 이벤트별 연동 지점 가이드

### T3 / T4 — 검사 제출

- **연동 메서드**: `DgnssService.submit*()` 또는 검사 제출 처리 서비스
- **필요 정보**:
  - 그룹 오너 userNo — `GroupInfo.hostUserNo`
  - 그룹명 — `GroupInfo.groupNm`
  - 검사명 — `Dgnss.examName` (or 동등 필드)
  - round — 1/2
  - 학생 닉네임 — `User.nickname` (또는 `GroupMember.nickname`)
  - submittedCount / totalCount — 같은 dgnssId 기준 집계

### T5 / S2 — 리마인더 스케줄러

- **신규 스케줄러 작성 필요**: `backend/src/main/java/com/vs/meta/api/notification/scheduler/ExamReminderScheduler.java`
- **매일 08:00 (Asia/Seoul) 실행**:
  - D-3 ~ D-1 검사 조회
  - 각 검사별 미제출자 목록 조회
  - T5: 오너 교사에게 1건
  - S2: 미제출 학생 각각에게 1건
- **ShedLock** — Phase 2에서 `@SchedulerLock` 추가 (Phase 1은 단일 인스턴스라 생략 가능)

### T6 — 리포트 생성

- **연동 시점 확정 필요**: "집계 배치"가 정확히 무엇인가?
  - 후보 A: 교사가 [검사 종료] 버튼 클릭 후 집계 완료
  - 후보 B: 검사 마감일 자동 집계
- 확정 후 해당 지점에 `ExamReportGeneratedEvent` 발행

### S1 — 새 검사 배정

- **연동 메서드**: 검사 생성(배정) API
- **발송 대상**: 해당 그룹의 `ACTIVE` 멤버 중 `userNo != null` (회원만, 게스트 제외)
- **배치 발송**: `NotificationService.createBatch(userNoList, ...)` 활용

```java
// 예시
List<Long> studentUserNos = groupMemberMapper
        .findActiveMemberUserNosByGroupId(groupId)
        .stream().filter(Objects::nonNull).collect(Collectors.toList());
eventPublisher.publishEvent(new ExamAssignedEvent(
        studentUserNos, groupName, examName, round));
```

### S3 — 결과 공개

- **연동 시점 확정 필요**: 수동 공개? 자동 공개?
- 공개된 검사의 제출 학생들에게 각각 S3 발송

### S6 — 재응시 요청

- **기능 존재 확인 필요**: 교사가 특정 학생에게 재응시 요청하는 API가 있는지?
- 있다면 해당 API 성공 시 이벤트 발행

---

## ✅ 체크리스트 (검사 담당자용)

### 구현 전 확인
- [ ] `feature/notification` 브랜치가 `vs-develop`에 병합되었는지 확인 (또는 직접 pull)
- [ ] `backend/docs/notification/04-api.md` 읽기
- [ ] 본 가이드 이벤트 명세 숙지

### 구현
- [ ] `ExamSubmittedEvent` 작성 (T3/T4)
- [ ] `ExamAssignedEvent` 작성 (S1)
- [ ] `ExamResultPublishedEvent` 작성 (S3)
- [ ] `ExamReExamRequestedEvent` 작성 (S6, 기능 존재 시)
- [ ] `NotificationEventHandler`에 리스너 메서드 추가
- [ ] 검사 도메인 서비스에 `ApplicationEventPublisher` 주입
- [ ] 각 메서드에 `publishEvent(...)` 한 줄 추가
- [ ] `ExamReminderScheduler` 작성 (T5/S2)

### 테스트
- [ ] 로컬 테스터 페이지 (`http://localhost:8081/dev/notification-tester`)로 SSE 연결 & 수신 확인
- [ ] 각 이벤트별로 `notification` 테이블 row 생성 확인
- [ ] 롤백 시나리오: 제출 트랜잭션 실패 시 알림 row 없음 확인 (AFTER_COMMIT 리스너 동작 증빙)

### 담당자 협업
- [ ] T6 집계 배치 정의 기획 확인
- [ ] S3 공개 시점 기획 확인
- [ ] S6 기능 존재 여부 확인

---

## 🚫 주의사항

1. **`@TransactionalEventListener(AFTER_COMMIT)` 유지** — 커밋 전 발행하면 롤백 시 유령 알림 발생
2. **트랜잭션 내부에서 `publishEvent()` 호출** — `@TransactionalEventListener`가 트랜잭션 경계를 기반으로 동작
3. **이벤트 객체에 박제할 값 그대로 담기** — `groupName`, `nickname`, `examName` 등 렌더링 시점 문자열 그대로
4. **게스트 대상 알림 주의** — `userNo == null`이면 인앱 알림 불가. 스킵 처리
5. **대량 발송 (S1)** — `createBatch` 사용, 단건 반복 X

---

## 🔗 참고

- 알림 구조 설계: `backend/docs/notification/`
- 이벤트별 문구/링크: `backend/docs/notification/05-events.md`
- 그룹 영역 구현 예시 (실 비즈 로직 + `publishEvent` 호출 패턴):
  - `com.vs.meta.api.group.service.GroupService` — `joinGroupAsPlayer`, `leaveGroup`, `kickMember`
  - `com.vs.meta.api.group.service.GroupInvitationService` — `sendInvitation`
  - `com.vs.meta.api.notification.listener.NotificationEventHandler` — 리스너 4종 (T1/T2/S4/S5)
- 로컬 테스터 페이지: `backend/src/main/resources/notification-dev/tester.html` + `NotificationDebugController` (`@Profile("local")`)

궁금한 점은 알림 기능 담당자에게 문의.
