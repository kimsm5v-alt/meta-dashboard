# 06. BE 작업 체크리스트

---

## 의존성 추가

`backend/build.gradle`:

```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'
    implementation 'net.javacrumbs.shedlock:shedlock-spring:4.46.0'
    implementation 'net.javacrumbs.shedlock:shedlock-provider-jdbc-template:4.46.0'
    // SseEmitter는 spring-web에 포함됨
}
```

---

## DB 마이그레이션

- [ ] `notification` 테이블 DDL 작성 및 dev DB 적용
- [ ] `shedlock` 테이블 DDL 작성 및 dev DB 적용
- [ ] 운영 배포용 마이그레이션 스크립트 별도 관리

---

## 설정

### application.yml

```yaml
spring:
  redis:
    host: ${REDIS_HOST}
    port: ${REDIS_PORT:6379}
    password: ${REDIS_PASSWORD:}
    timeout: 3000

server:
  tomcat:
    threads:
      max: 500  # SSE 연결 대비
```

### SchedulerConfig

- [ ] `@EnableScheduling`, `@EnableSchedulerLock(defaultLockAtMostFor = "PT10M")`
- [ ] `LockProvider` Bean (JdbcTemplateLockProvider)

### RedisConfig

- [ ] `RedisTemplate<String, String>` Bean
- [ ] `RedisMessageListenerContainer` Bean (Pub/Sub 구독)

---

## 도메인 구현

### Entity / Enum

- [ ] `domain/Notification.java` — 엔티티
- [ ] `domain/enums/NotificationCategory.java` — EXAM/GROUP/NOTICE

### Mapper

- [ ] `api/notification/mapper/NotificationMapper.java`
- [ ] `resources/mapper/notification/NotificationMapper.xml`
  - [ ] `insertBatch` — 여러 사용자에게 동시 insert
  - [ ] `findByUserNoWithCursor` — cursor 페이징 조회
  - [ ] `countUnreadByUserNo`
  - [ ] `markAsRead` (user_no 필터 필수)
  - [ ] `markAllAsRead`
  - [ ] `deleteOlderThan` — 90일 삭제 배치용

### Service

- [ ] `api/notification/service/NotificationService.java`
  - [ ] `create(userNo, category, eventCode, content, link)` → insert + Redis publish
  - [ ] `createBatch(userNos, ...)` → 대량 발송
  - [ ] `list(userNo, cursor, size, category)` → cursor 페이징
  - [ ] `countUnread(userNo)`
  - [ ] `markAsRead(userNo, notificationId)`
  - [ ] `markAllAsRead(userNo)`

### Controller

- [ ] `api/notification/controller/NotificationController.java` — REST 4종
- [ ] `api/notification/controller/NotificationStreamController.java` — SSE 엔드포인트

---

## SSE 구현

### SseEmitterRegistry

- [ ] `api/notification/sse/SseEmitterRegistry.java`
  - [ ] `register(userNo, emitter)` — 사용자별 emitter 목록 관리 (멀티 탭 지원)
  - [ ] `remove(userNo, emitter)` — 정리
  - [ ] `sendTo(userNo, eventName, data)` — 대상자에게 push
  - [ ] `size()` — 모니터링용

### NotificationPubSubBridge

- [ ] `api/notification/sse/NotificationPubSubBridge.java`
  - [ ] `publish(userNo, payload)` — Redis PUBLISH
  - [ ] Redis MessageListener — SUBSCRIBE → registry.sendTo()

### Heartbeat

- [ ] `@Scheduled(fixedRate = 30_000)`로 모든 emitter에 ping 전송
- [ ] Nginx/LB idle timeout 방지

---

## 이벤트 디스패처

### 이벤트 정의

- [ ] `api/notification/event/StudentJoinedGroupEvent.java` (T1)
- [ ] `api/notification/event/StudentLeftGroupEvent.java` (T2)
- [ ] `api/notification/event/ExamSubmittedEvent.java` (T3, T4)
- [ ] `api/notification/event/ExamAssignedEvent.java` (S1)
- [ ] `api/notification/event/ExamResultPublishedEvent.java` (S3)
- [ ] `api/notification/event/StudentKickedEvent.java` (S5) — 기능 존재 확인 후
- [ ] `api/notification/event/ReExamRequestedEvent.java` (S6) — 기능 존재 확인 후

### 리스너

- [ ] `api/notification/listener/NotificationEventHandler.java`
  - [ ] 각 이벤트에 `@TransactionalEventListener(phase = AFTER_COMMIT)` 메서드

### 비즈니스 로직 수정 (이벤트 발행 추가)

- [ ] `GroupService.joinGroup()` → T1 이벤트 발행
- [ ] `GroupService.leaveGroup()` → T2 이벤트 발행
- [ ] 검사 제출 API → T3/T4 이벤트 발행
- [ ] 검사 생성 API → S1 이벤트 발행 (그룹 전원)
- [ ] 결과 공개 API → S3 이벤트 발행 (⚠️ 공개 로직 확정 필요)

---

## 스케줄러

### NotificationScheduler

- [ ] `api/notification/scheduler/NotificationScheduler.java`
- [ ] T5 / S2 리마인더
  ```java
  @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Seoul")
  @SchedulerLock(name = "sendExamReminders", lockAtMostFor = "PT30M", lockAtLeastFor = "PT5M")
  public void sendReminders() { ... }
  ```
- [ ] 90일 삭제 배치
  ```java
  @Scheduled(cron = "0 0 3 * * *", zone = "Asia/Seoul")
  @SchedulerLock(name = "cleanupOldNotifications", lockAtMostFor = "PT1H")
  public void cleanup() { ... }
  ```

---

## 이메일 발송 (S4, C1)

- [ ] S4: 교사가 초대 메일 발송 API (⚠️ 신규 개발 여부 확정)
- [ ] C1: `SsoUserRegistrationService.register()` 성공 후 메일 발송
  - Auth 서버 자체 가입 메일과 중복 방지 확인

---

## 보안

- [ ] Spring Security 필터 체인에 `/api/v1/notifications/**` 인증 필요
- [ ] SSE 엔드포인트도 JWT 검증 동작 확인
- [ ] `markAsRead` 시 `WHERE user_no = ?` 필터 (남의 알림 수정 방지)

---

## 모니터링

- [ ] Micrometer 메트릭:
  - [ ] `sse.active_connections`
  - [ ] `sse.send.success`, `sse.send.failure`
  - [ ] `redis.pubsub.messages.published`, `.received`
  - [ ] `notification.created` (카테고리별, eventCode별)
- [ ] Prometheus scrape endpoint 노출

---

## 테스트

### 단위 테스트

- [ ] `NotificationServiceTest` — CRUD, 권한 필터링
- [ ] `NotificationSchedulerTest` — 리마인더 대상 추출 로직

### 통합 테스트

- [ ] 이벤트 발행 → 알림 insert → Redis publish 확인
- [ ] 읽음 처리 권한 분리 (다른 사용자 알림 수정 실패)
- [ ] 커서 페이징 동작

### 다중 인스턴스 테스트

- [ ] 서버A에서 이벤트 발생 → 서버B의 SSE 연결 사용자에게 전달 확인
- [ ] 스케줄러 ShedLock 동작 (2대 중 1대만 실행)

---

## 배포

- [ ] `application-vs-dev.yml` Redis 설정 추가
- [ ] `application-prod.yml` Redis 설정 추가
- [ ] Graceful Shutdown 활성화 확인
- [ ] 롤링 배포 시 인스턴스 간 60초 이상 간격
