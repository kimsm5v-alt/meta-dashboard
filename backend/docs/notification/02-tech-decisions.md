# 02. 기술 선택 결정 사항

---

## 1. 실시간 전달 방식 — **SSE**

### 선택

| 옵션 | 결과 |
|---|---|
| 폴링 (30초) | ❌ |
| **SSE (Server-Sent Events)** | ⭐ **선택** |
| WebSocket | ❌ |

### 근거

- 알림은 단방향(서버 → 클라)이라 SSE의 특성에 부합
- 폴링 대비 실시간성 우위, 동접 증가 시 부하 효율적
- WebSocket 대비 구현 단순 (HTTP 기반, 브라우저 자동 재연결)
- 학심정에 Redis/NATS 인프라가 있어 다중 서버 브로드캐스트 가능

### 트레이드오프

- Tomcat blocking I/O 기반이라 연결 1000개 이상 시 스레드 한계 가능
- 대응: Spring Boot 3 + Java 21 (Virtual Threads) 업그레이드 로드맵과 연계
- MVP 시점에는 폴링 fallback 지원

---

## 2. 다중 서버 메시지 공유 — **Redis Pub/Sub**

### 선택 근거

- BE 인스턴스 2대 → 서버 간 메시지 공유 필수
- Redis/NATS 중 Redis 선택 (학심정 내 사용 사례 검토 후 조정 가능)
- 별도 메시지 큐(Kafka 등) 도입 없이 단순화

### 채널 네이밍

```
meta-noti:user:{userNo}
```

---

## 3. 스케줄러 중복 방지 — **ShedLock**

### 근거

운영 BE 인스턴스 2대 → `@Scheduled` 중복 실행 방지 필수.

### 대상

- T5 / S2 리마인더 (매일 08:00)
- 90일 경과 알림 자동 삭제 (매일 03:00)

### 구현

- `shedlock-spring` + `shedlock-provider-jdbc-template`
- `shedlock` 테이블 (MySQL)
- `@SchedulerLock(name=..., lockAtMostFor=..., lockAtLeastFor=...)`

---

## 4. 이벤트 디스패치 — **Spring `ApplicationEvent` + `AFTER_COMMIT`**

### 근거

- 본 업무 트랜잭션 성공 후에만 알림 발송되도록 보장
- 알림 발송 실패해도 본 업무는 유지 (fire-and-forget)
- 외부 메시지 큐 없이 Spring 내장 기능만 사용

### 패턴

```java
// 비즈니스 로직
@Service
class GroupService {
    void joinGroup(...) {
        // 기존 로직
        eventPublisher.publishEvent(new StudentJoinedGroupEvent(...));
    }
}

// 알림 리스너
@Component
class NotificationEventHandler {
    @TransactionalEventListener(phase = AFTER_COMMIT)
    void on(StudentJoinedGroupEvent e) {
        notificationService.create(...);
    }
}
```

---

## 5. 알림 내용 저장 — **렌더링된 문자열을 `content`에 박제**

### 근거

- 기획 요구사항: "생성 시점 닉네임 문자열로 저장"
- 닉네임/그룹명/검사명 모두 변수 치환된 최종 문자열을 저장
- 템플릿/파라미터 분리 구조 채택 안 함 (복잡도 증가, 이득 없음)
- 이후 변경/삭제 시에도 알림 문구 안정적

### 저장 예시

```
content = "홍길동 학생이 '2반' 그룹에 참여했습니다."
link    = "/groups/abc-123"
```

---

## 6. 대량 공지(T10/T11/S7) 저장 — **사용자별 개별 row insert**

### 근거

- 회원 수 수천 명 수준 → 배치 insert로 충분
- MyBatis `<foreach>`로 bulk insert
- 기존 조회/읽음 API 그대로 재사용
- 수십만 규모 도달 시 브로드캐스트 테이블 별도 구조로 재검토

---

## 7. 이메일 발송 — **기존 NCP 메일 재사용**

- S4 그룹 초대, C1 회원가입
- 기존 `send-code` 엔드포인트와 동일 인프라
- 실패 시 재시도 없음 (MVP), 로그만 기록

---

## 8. FE 상태 관리 — **React Query**

### 근거

- 기존 학심정 FE에 도입되어 있음
- 로그인 여부/탭 포커스/네트워크 상태 자동 관리
- 낙관적 업데이트 지원 (읽음 처리)

### 활용

- `useQuery(['unread-count'])` — SSE 보조 수단 (fallback용 폴링)
- `useInfiniteQuery(['notifications'])` — 무한 스크롤 목록
- `useMutation` — 읽음 처리

---

## 9. 페이징 — **Cursor 기반 (notification_id)**

### 엔드포인트

```
GET /api/v1/notifications?cursor=123&size=20
```

### SQL

```sql
WHERE user_no = ? AND notification_id < ?
ORDER BY notification_id DESC
LIMIT 20
```

### 근거

- 알림 많은 유저 대비 (오프셋은 뒷페이지 갈수록 느림)
- 무한 스크롤 UI에 자연스럽게 맞음
- `notification_id`(AUTO_INCREMENT)를 커서로 사용
- SSE의 `Last-Event-ID`와 호환

---

## 10. 뱃지 카운트 — **별도 경량 API**

```
GET /api/v1/notifications/unread-count  → { count: 3 }
```

### 근거

- SSE 실패 시 fallback 폴링 용도로 사용
- body 최소화
- 목록 API와 분리하여 드롭다운 열 때만 목록 조회

---

## 11. 카테고리 그룹핑 — **FE에서 처리**

- BE는 flat 목록 반환 (`category` 필드 포함)
- FE가 카테고리별 섹션으로 그룹핑 렌더링

### 근거

- BE 책임 단순화
- 페이징/정렬이 flat 구조에서 자연스러움

---

## 12. Fallback 전략 — **SSE 실패 시 폴링 30초**

### 동작

1. FE가 SSE 연결 시도
2. 3회 연속 실패 → 폴링 모드 전환
3. 폴링 중에도 주기적으로 SSE 재시도
4. SSE 재연결 성공 시 폴링 중단

### 근거

- 장애/네트워크 이슈에도 알림 동작 보장
- Nginx 버퍼링 문제 등 운영 이슈 대응
