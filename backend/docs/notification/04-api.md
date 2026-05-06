# 04. API 설계

---

## 엔드포인트 목록

| Method | Path | 용도 |
|---|---|---|
| `GET` | `/api/v1/notifications` | 알림 목록 (cursor 페이징) |
| `GET` | `/api/v1/notifications/unread-count` | 미확인 개수 (뱃지/fallback 폴링) |
| `POST` | `/api/v1/notifications/{id}/read` | 개별 읽음 처리 |
| `POST` | `/api/v1/notifications/read-all` | 전체 읽음 처리 |
| `GET` | `/api/v1/notifications/stream` | SSE 스트림 (실시간 푸시) |

---

## 1. 알림 목록 조회

### Request

```
GET /api/v1/notifications?cursor=123&size=20&category=EXAM
Authorization: Bearer <token>
```

| 파라미터 | 필수 | 설명 |
|---|---|---|
| `cursor` | N | 이전 페이지의 마지막 `notification_id`. 없으면 최신부터 |
| `size` | N | 페이지 크기 (기본 20, 최대 100) |
| `category` | N | `EXAM` / `GROUP` / `NOTICE`. 없으면 전체 |

### Response 200

```json
{
  "success": true,
  "resultCode": 200,
  "resultData": {
    "items": [
      {
        "notificationId": 125,
        "category": "GROUP",
        "eventCode": "T1",
        "content": "홍길동 학생이 '2반' 그룹에 참여했습니다.",
        "link": "/groups/abc-123",
        "read": false,
        "createdAt": "2026-04-24T10:15:00"
      },
      {
        "notificationId": 120,
        "category": "EXAM",
        "eventCode": "T3",
        "content": "김영희 학생이 1차 학습심리정서검사를 제출했습니다.",
        "link": "/assessment",
        "read": true,
        "createdAt": "2026-04-24T09:00:00"
      }
    ],
    "nextCursor": 119,
    "hasMore": true
  }
}
```

### SQL

```sql
SELECT *
FROM notification
WHERE user_no = ?
  AND (? IS NULL OR notification_id < ?)
  AND (? IS NULL OR category = ?)
ORDER BY notification_id DESC
LIMIT ?;
```

---

## 2. 미확인 개수

### Request

```
GET /api/v1/notifications/unread-count
Authorization: Bearer <token>
```

### Response 200

```json
{
  "success": true,
  "resultCode": 200,
  "resultData": {
    "count": 3
  }
}
```

### SQL

```sql
SELECT COUNT(*)
FROM notification
WHERE user_no = ? AND read_at IS NULL;
```

---

## 3. 개별 읽음 처리

### Request

```
POST /api/v1/notifications/125/read
Authorization: Bearer <token>
```

### Response 200

```json
{
  "success": true,
  "resultCode": 200,
  "resultData": null,
  "resultMessage": "읽음 처리 완료"
}
```

### SQL

```sql
UPDATE notification
SET read_at = NOW()
WHERE notification_id = ?
  AND user_no = ?           -- 본인 알림만 수정 가능
  AND read_at IS NULL;      -- 이미 읽음이면 no-op
```

### 보안

- `WHERE user_no = ?` 필수 (남의 알림 읽음 처리 차단)
- 이미 읽은 알림 재호출 시 조용히 no-op (404 대신 200)

---

## 4. 전체 읽음 처리

### Request

```
POST /api/v1/notifications/read-all
Authorization: Bearer <token>
```

### Response 200

```json
{
  "success": true,
  "resultCode": 200,
  "resultData": {
    "updatedCount": 5
  }
}
```

### SQL

```sql
UPDATE notification
SET read_at = NOW()
WHERE user_no = ? AND read_at IS NULL;
```

---

## 5. SSE 스트림

### Request

```
GET /api/v1/notifications/stream
Accept: text/event-stream
Authorization: Bearer <token>
```

### Response (지속적)

```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

event: connected
data:

event: notification
id: 125
data: {"notificationId":125,"category":"GROUP","eventCode":"T1","content":"...","link":"/groups/abc","read":false,"createdAt":"2026-04-24T10:15:00"}

: heartbeat

event: notification
id: 126
data: {...}
```

### 이벤트 타입

| event | 의미 |
|---|---|
| `connected` | 연결 성공 (초기 1회) |
| `notification` | 새 알림 도착 |
| `:` (주석) | heartbeat (30초 주기) |

### 재연결

- 브라우저/`fetch-event-source`가 자동 재연결
- `Last-Event-ID` 헤더로 놓친 이벤트 복구 (서버가 해당 ID 이후 DB 조회해서 push)

### 에러

- 401 Unauthorized: 토큰 무효 → 재인증 필요
- 503 Service Unavailable: 서버 과부하 → FE가 fallback 폴링으로 전환

---

## 응답 공통 규약

### 성공

```json
{
  "success": true,
  "resultCode": 200,
  "resultData": { ... },
  "resultMessage": "OK"
}
```

### 실패

```json
{
  "success": false,
  "resultCode": 400,
  "resultData": {
    "code": 400,
    "name": "IllegalArgument",
    "message": "..."
  },
  "resultMessage": "..."
}
```

학심정 기존 `ResponseDTO<CustomBody>` 규약 준수.

---

## API 구현 메모

### NotificationController

```java
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService service;

    @GetMapping
    public ResponseDTO<CustomBody> list(
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) NotificationCategory category,
            HttpServletRequest request
    ) {
        Long userNo = SecurityUtil.requireCurrentUserNo(request);
        var page = service.list(userNo, cursor, size, category);
        return AidtCommonUtil.makeResultSuccess(null, page, "OK");
    }

    @GetMapping("/unread-count")
    public ResponseDTO<CustomBody> unreadCount(HttpServletRequest request) {
        Long userNo = SecurityUtil.requireCurrentUserNo(request);
        int count = service.countUnread(userNo);
        return AidtCommonUtil.makeResultSuccess(null, Map.of("count", count), "OK");
    }

    @PostMapping("/{id}/read")
    public ResponseDTO<CustomBody> read(@PathVariable Long id, HttpServletRequest request) {
        Long userNo = SecurityUtil.requireCurrentUserNo(request);
        service.markAsRead(userNo, id);
        return AidtCommonUtil.makeResultSuccess(null, null, "읽음 처리 완료");
    }

    @PostMapping("/read-all")
    public ResponseDTO<CustomBody> readAll(HttpServletRequest request) {
        Long userNo = SecurityUtil.requireCurrentUserNo(request);
        int updated = service.markAllAsRead(userNo);
        return AidtCommonUtil.makeResultSuccess(null, Map.of("updatedCount", updated), "OK");
    }
}
```

### NotificationStreamController (SSE)

```java
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationStreamController {

    private final SseEmitterRegistry registry;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(HttpServletRequest request) {
        Long userNo = SecurityUtil.requireCurrentUserNo(request);
        SseEmitter emitter = new SseEmitter(Duration.ofHours(1).toMillis());
        
        registry.register(userNo, emitter);
        
        emitter.onCompletion(() -> registry.remove(userNo, emitter));
        emitter.onTimeout(() -> registry.remove(userNo, emitter));
        emitter.onError(e -> registry.remove(userNo, emitter));
        
        try {
            emitter.send(SseEmitter.event().name("connected").data(""));
        } catch (IOException ignored) {}
        
        return emitter;
    }
}
```
