# 07. FE 작업 체크리스트

---

## 의존성 추가

```json
{
  "dependencies": {
    "@microsoft/fetch-event-source": "^2.0.1"
  }
}
```

브라우저 내장 `EventSource`는 커스텀 헤더(Bearer 토큰) 지원 안 됨 → `fetch-event-source` 사용.

---

## 타입 정의

### `shared/types/notification.ts`

```ts
export type NotificationCategory = 'EXAM' | 'GROUP' | 'NOTICE';

export interface Notification {
  notificationId: number;
  category: NotificationCategory;
  eventCode: string;
  content: string;
  link: string | null;
  read: boolean;
  createdAt: string; // ISO
}

export interface NotificationListResponse {
  items: Notification[];
  nextCursor: number | null;
  hasMore: boolean;
}
```

---

## API 호출 레이어

### `features/notifications/api/notificationApi.ts`

- [ ] `getNotifications(cursor, size, category)` → 목록 조회
- [ ] `getUnreadCount()` → 뱃지용
- [ ] `markAsRead(id)` → 개별 읽음
- [ ] `markAllAsRead()` → 전체 읽음

학심정 기존 `apiClient` 사용.

---

## React Query Hooks

### `features/notifications/model/useNotifications.ts`

- [ ] `useNotifications(category?)` — `useInfiniteQuery` 무한 스크롤
- [ ] `useUnreadCount()` — 뱃지용, SSE 연결 성공 시 비활성, 실패 시 30초 폴링 fallback
- [ ] `useMarkAsRead()` — 낙관적 업데이트 mutation
- [ ] `useMarkAllAsRead()` — 낙관적 업데이트 mutation

### 낙관적 업데이트 예시

```tsx
const markAsRead = useMutation({
  mutationFn: (id: number) => notificationApi.markAsRead(id),
  onMutate: async (id) => {
    await queryClient.cancelQueries(['notifications']);
    queryClient.setQueriesData(['notifications'], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          items: page.items.map((n: Notification) =>
            n.notificationId === id ? { ...n, read: true } : n
          ),
        })),
      };
    });
    queryClient.setQueryData(['unread-count'], (old: any) => ({
      count: Math.max(0, (old?.count ?? 1) - 1),
    }));
  },
});
```

---

## SSE 클라이언트

### `shared/hooks/useNotificationStream.ts`

- [ ] `fetchEventSource` 사용
- [ ] Authorization 헤더에 JWT 주입
- [ ] `notification` 이벤트 수신 시 React Query invalidate
- [ ] 401 응답 → SDK `refreshAccessToken()` 호출 후 재연결
- [ ] 재연결 로직: 지수 백오프 (1s → 2s → 4s → 최대 30s) + 랜덤 지터
- [ ] `AbortController`로 컴포넌트 언마운트 시 정리

### 예시

```ts
export function useNotificationStream() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const ctrl = new AbortController();
    let retryDelay = 1000;
    
    const connect = async () => {
      try {
        await fetchEventSource('/api/v1/notifications/stream', {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          signal: ctrl.signal,
          
          async onopen(res) {
            if (res.status === 401) {
              await refreshAccessToken();
              throw new Error('retry-with-new-token');
            }
            retryDelay = 1000; // 성공 시 초기화
          },
          
          onmessage(ev) {
            if (ev.event === 'notification') {
              queryClient.invalidateQueries(['unread-count']);
              queryClient.invalidateQueries(['notifications']);
            }
          },
          
          onerror(err) {
            // 지수 백오프 (throw하면 자동 재연결 안 함, 직접 관리)
            retryDelay = Math.min(retryDelay * 2, 30000);
          },
        });
      } catch { /* 재연결 타이머 */ }
    };
    
    connect();
    return () => ctrl.abort();
  }, [isAuthenticated]);
}
```

---

## UI 컴포넌트

### `widgets/notifications/NotificationBell.tsx`

- [ ] 벨 아이콘
- [ ] 뱃지 (안읽음 count, 100+면 "99+")
- [ ] 클릭 시 드롭다운 열기/닫기
- [ ] 외부 클릭 감지로 닫기 (prototype에 `BellWithPanel` 참고)

### `widgets/notifications/NotificationPanel.tsx`

- [ ] 드롭다운 컨테이너
- [ ] 탭: 검사 / 그룹 (카테고리별)
- [ ] 탭별 "모두 읽음" 버튼 (안읽음 9개 이상만 활성화)
- [ ] 무한 스크롤 목록
- [ ] 빈 상태: "아직 알림이 없어요"
- [ ] 스크롤 하단 도달 시 `fetchNextPage()`

### `widgets/notifications/NotificationItem.tsx`

- [ ] 미확인 알림 시각적 강조 (배경색, 점)
- [ ] 클릭 시:
  - [ ] 낙관적 읽음 처리 → `markAsRead.mutate(id)`
  - [ ] 딥링크 이동 → `navigate(notification.link)`
- [ ] 상대 시간 표시 (`formatRelativeTime(createdAt)`)

### `widgets/notifications/NotificationEmpty.tsx`

- [ ] "아직 알림이 없어요" 빈 상태 UI

---

## 유틸리티

### `shared/utils/formatRelativeTime.ts`

```ts
export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return '방금 전';
  
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  
  // 어제 판정 (자정 기준)
  // ...
  
  const day = Math.floor(hour / 24);
  if (day === 1) return '어제';
  if (day < 7) return `${day}일 전`;
  
  return iso.slice(0, 10).replace(/-/g, '.');
}
```

---

## 레이아웃 통합

- [ ] `widgets/layout/MainLayout.tsx` (교사) Header에 `<NotificationBell />` 추가
- [ ] `widgets/layout/StudentLayout.tsx` Header에도 동일 추가
- [ ] 로그인 상태에서만 렌더 (조건부)

---

## 딥링크 처리

- [ ] `notification.link`로 `navigate()` 호출
- [ ] 쿼리스트링 포함된 링크 정상 동작 확인 (예: `/student/groups?code=XXXX`)
- [ ] 존재하지 않는 경로 fallback (404 페이지)

---

## 토스트 / 팝업 (고도화용)

현재 MVP 기준:
- T1~T6, S1~S6: 인앱만 (벨/목록)
- T10/T11/S7: 팝업 (고도화)

팝업 구현은 1차 고도화에서 진행 — MVP 제외.

---

## 테스트

- [ ] Mock Service Worker로 SSE 시뮬레이션
- [ ] 낙관적 업데이트 롤백 시나리오
- [ ] 재연결 로직 (네트워크 끊김)
- [ ] Fallback 폴링 전환 동작
- [ ] 탭 전환 시 정리

---

## 빌드 확인

- [ ] `npx tsc -b` 통과
- [ ] `npm run frontend` 로컬 실행 확인
- [ ] 개발서버 배포 후 실제 SSE 연결 확인

---

## 참고 자료

- 프로토타입 구현: `prototype/src/features/notifications-mock/` 폴더 (커밋 `cf2a6d1`)
  - `BellWithPanel.tsx`, `NotificationPanel.tsx`, `NotificationItem.tsx` 등
  - Mock 데이터 기반이지만 UI 구조는 그대로 이식 가능
