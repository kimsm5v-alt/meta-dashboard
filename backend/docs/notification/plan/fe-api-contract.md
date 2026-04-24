# 알림 API 명세 — FE 전달용

> FE 개발자에게 전달할 실무용 API 명세서.
> 상세 설계는 [../04-api.md](../04-api.md), 이벤트 세부는 [../05-events.md](../05-events.md) 참조.

---

## 📋 공통 사항

### Base URL
- 로컬: `http://localhost:8081`
- 개발서버: `https://t-meta-api.vsaidt.com`
- FE 환경변수 `VITE_API_URL` 사용

### 인증
- 모든 요청에 `Authorization: Bearer {accessToken}` 헤더 필수
- 토큰은 SDK의 `getAccessToken()`에서 획득

### 사용자 식별
- **FE에서 userNo / stdtId / tcId 전달 불필요** — JWT로 BE가 자동 식별
- 응답 본문에도 수신자 ID 없음 ("내 알림"이라 자명)
- "다른 사람의 알림"을 조회하는 API는 없음 (보안상)

### 공통 응답 포맷
학심정 공통 `ResponseDTO<CustomBody>` 래핑:

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "OK",
  "resultData": { ... }
}
```

---

## 🔌 엔드포인트

### 1. 알림 목록 조회

```
GET /api/v1/notifications?cursor={cursor}&size={size}&category={category}
```

**Query Params:**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---|---|---|---|---|
| `cursor` | number | N | (없음) | 이전 페이지 마지막 `notificationId`. 미전달 시 최신부터 |
| `size` | number | N | 20 | 페이지 크기 (최대 100) |
| `category` | string | N | (전체) | `EXAM` \| `GROUP` \| `NOTICE` |

**응답 (200):**

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "OK",
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
      }
    ],
    "nextCursor": 105,
    "hasMore": true
  }
}
```

**무한 스크롤:**
- 첫 호출: `GET /api/v1/notifications?size=20` → `nextCursor: 105` 수신
- 다음 호출: `GET /api/v1/notifications?cursor=105&size=20`
- `hasMore: false`면 끝

---

### 2. 미확인 알림 개수

```
GET /api/v1/notifications/unread-count
```

뱃지 / fallback 폴링용 경량 API.

**응답 (200):**

```json
{
  "success": true,
  "resultCode": 200,
  "resultData": { "count": 3 }
}
```

---

### 3. 개별 읽음 처리

```
POST /api/v1/notifications/{notificationId}/read
```

**Request Body:** 없음

**응답 (200):**

```json
{
  "success": true,
  "resultCode": 200,
  "resultMessage": "읽음 처리 완료",
  "resultData": null
}
```

**특이사항:**
- 이미 읽은 알림 재호출 → 200 (no-op)
- 본인 알림 아니면 → 200 이지만 내부적으로 아무 변경 없음 (보안)

---

### 4. 전체 읽음 처리

```
POST /api/v1/notifications/read-all
```

**Request Body:** 없음

**응답 (200):**

```json
{
  "success": true,
  "resultCode": 200,
  "resultData": { "updatedCount": 5 }
}
```

`updatedCount`: 실제로 read 처리된 건수 (이미 읽은 건 제외).

---

### 5. SSE 스트림 연결

```
GET /api/v1/notifications/stream
Accept: text/event-stream
Authorization: Bearer {accessToken}
```

**응답:** `text/event-stream` (지속 연결)

**수신 이벤트:**

```
event: connected
data: 

event: notification
id: 125
data: {"notificationId":125,"category":"GROUP","eventCode":"T1",...}

: heartbeat

event: notification
id: 126
data: {...}
```

**이벤트 타입:**

| event | 의미 | 처리 |
|---|---|---|
| `connected` | 최초 연결 성공 | 로그만 |
| `notification` | 새 알림 도착 | `data`를 JSON 파싱 → 캐시 갱신 |
| `:` (주석) | heartbeat (30초 주기) | 무시 |

---

## 🚨 SSE 구현 주의사항

### ① 브라우저 기본 `EventSource` 사용 금지

`EventSource` API는 커스텀 헤더 미지원 → Bearer 토큰 전달 불가.

### ② `@microsoft/fetch-event-source` 사용

```bash
npm install @microsoft/fetch-event-source
```

```ts
import { fetchEventSource } from '@microsoft/fetch-event-source';

fetchEventSource('/api/v1/notifications/stream', {
  headers: { Authorization: `Bearer ${getAccessToken()}` },
  signal: abortController.signal,
  onmessage(ev) {
    if (ev.event === 'notification') {
      const noti = JSON.parse(ev.data);
      // ...
    }
  },
  onerror(err) {
    // 재연결 대기 시간 return
    return retryDelayMs;
  },
});
```

### ③ 토큰 만료 처리

연결 도중 토큰 만료는 SSE 자체에 영향 없음. **재연결 시점**에만 401 발생.

```ts
async onopen(res) {
  if (res.status === 401) {
    await getAuth().refreshAccessToken();
    throw new Error('retry-with-new-token');
  }
}
```

### ④ 재연결 지수 백오프

1s → 2s → 4s → 최대 30s. 랜덤 지터 추가 권장 (thundering herd 방지).

### ⑤ 로그아웃 시 정리

```ts
useEffect(() => {
  if (!isAuthenticated) return;
  const ctrl = new AbortController();
  // ... fetchEventSource(...)
  return () => ctrl.abort();
}, [isAuthenticated]);
```

### ⑥ Fallback 폴링

SSE 연결 N회 연속 실패 시 폴링 모드로 전환:

```tsx
useQuery({
  queryKey: ['unread-count'],
  queryFn: () => apiClient.get('/api/v1/notifications/unread-count'),
  refetchInterval: sseConnected ? false : 30_000,
  enabled: isAuthenticated,
});
```

---

## 📦 TypeScript 타입

```ts
// shared/types/notification.ts

export type NotificationCategory = 'EXAM' | 'GROUP' | 'NOTICE';

export interface Notification {
  notificationId: number;
  category: NotificationCategory;
  eventCode: string;
  content: string;
  link: string | null;
  read: boolean;
  createdAt: string; // ISO 8601
}

export interface NotificationListResponse {
  items: Notification[];
  nextCursor: number | null;
  hasMore: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

export interface ReadAllResponse {
  updatedCount: number;
}
```

---

## 🎨 카테고리 & 이벤트 코드

FE에서 카테고리 탭별로 보여줄 이벤트:

| 카테고리 | 교사 | 학생 |
|---|---|---|
| `EXAM` | T3, T4, T5, T6 | S1, S2, S3, S6 |
| `GROUP` | T1, T2 | S4, S5 |
| `NOTICE` | T10, T11 (고도화) | S7 (고도화) |

- FE는 `category` 필드로 탭 섹션 분할
- `eventCode`는 UI에 직접 노출 X (추적/아이콘 매핑용)

---

## 🔗 딥링크 규칙

알림 클릭 시 `link` 필드로 이동.

| 이벤트 | link 예시 |
|---|---|
| T1 (그룹 가입) | `/groups/{groupId}` |
| T3 (검사 제출) | `/assessment` |
| T6 (리포트 생성) | `/dashboard` |
| S1 (검사 배정) | `/student/exams` |
| S3 (결과 공개) | `/student/result` |
| S4 (그룹 초대) | `/student/groups?code=XXXX` |

**주의:**
- 쿼리스트링 포함 가능
- `null`이면 페이지 이동 없음
- FE는 `react-router`의 `navigate(link)` 사용

---

## ❌ 에러 응답

### 401 Unauthorized

```json
{
  "success": false,
  "resultCode": 401,
  "resultMessage": "Authentication is required.",
  "errorCode": "AUTH_REQUIRED"
}
```

처리: SDK refresh 시도 → 재호출. 계속 401이면 로그아웃.

### 500 Internal Server Error

토스트 표시 or 조용히 실패. 재시도는 React Query 기본 동작으로.

---

## ✅ FE 구현 체크리스트

### 필수
- [ ] `@microsoft/fetch-event-source` 설치
- [ ] `useNotificationStream` 훅 (SSE + 재연결 + 토큰 refresh)
- [ ] `useNotifications` (목록, `useInfiniteQuery`)
- [ ] `useUnreadCount` (뱃지, fallback 폴링)
- [ ] `useMarkAsRead` / `useMarkAllAsRead` (낙관적 업데이트)
- [ ] 벨 + 뱃지 UI (99+ 컷오프)
- [ ] 드롭다운 + 카테고리 탭 + 목록
- [ ] 상대 시간 유틸 (`방금 전` / `N분 전` / `어제` / `YYYY.MM.DD`)
- [ ] 딥링크 라우팅
- [ ] `MainLayout` / `StudentLayout` Header 통합

### 주의
- `EventSource` (브라우저 기본) 사용 금지
- 로그아웃 시 SSE 연결 반드시 해제 (메모리 누수)
- 읽음 처리는 낙관적 업데이트 — API 실패 시 다음 폴링에서 복구

---

## 🧪 로컬 테스트

### PoC 확인 (현재 `feature/notification` 브랜치)

1. BE 로컬 실행: `./gradlew :backend:bootRun`
2. FE 로컬 실행: `npm run frontend`
3. 로그인 후 `http://localhost:5173/dev/sse` 접속
4. 우하단 패널에서 SSE 연결 상태 확인
5. "테스트 알림 보내기" 버튼으로 본인에게 알림 발송 → 즉시 수신

### 본 구현 연결 후 시나리오

- 교사 로그인 → 학생이 그룹 가입 API 호출 → 교사에게 T1 알림 수신
- 학생 로그인 → 교사가 검사 생성 → 학생에게 S1 알림 수신
- 알림 클릭 → 딥링크 이동 + 읽음 처리

---

## 📚 참고 자료

- 전체 설계: `backend/docs/notification/`
- 이벤트별 상세: `backend/docs/notification/05-events.md`
- 기획 스펙: `backend/docs/notification/01-spec.md`
- 구현 계획: `backend/docs/notification/plan/`
- 프로토타입 UI: `prototype/src/features/notifications-mock/`

---

**최종 수정일**: 2026-04-24
