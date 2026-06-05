// ============================================================
// SSE 기반 실시간 알림 타입 정의
// 백엔드 가이드: /Downloads/fe-guide.html 참조
// ============================================================

/** 알림 카테고리 (대문자) */
export type NotificationCategory = 'EXAM' | 'GROUP' | 'NOTICE';

/** 백엔드 알림 객체 */
export interface Notification {
  notificationId: number;
  category: NotificationCategory;
  eventCode: string; // 'T1', 'T2', 'S1', 'S4' 등
  content: string; // 메시지 본문
  link: string | null; // 딥링크 (null이면 이동 없음)
  read: boolean; // 읽음 여부
  createdAt: string; // ISO 8601
}

/** 알림 목록 응답 (cursor 페이징) */
export interface NotificationListResponse {
  items: Notification[];
  nextCursor: number | null;
  hasMore: boolean;
}

/** 미확인 알림 개수 응답 */
export interface UnreadCountResponse {
  count: number;
}

/** 전체 읽음 처리 응답 */
export interface ReadAllResponse {
  updatedCount: number;
}

/** SSE 이벤트 타입 */
export type SSEEventType = 'connected' | 'notification';
