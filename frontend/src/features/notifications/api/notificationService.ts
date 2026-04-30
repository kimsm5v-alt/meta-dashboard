import { apiClient } from '@shared/api/client';
import type {
  NotificationListResponse,
  UnreadCountResponse,
  ReadAllResponse,
  NotificationCategory,
} from '../model/types';

// ============================================================
// 알림 API 서비스 (SSE 기반)
// ============================================================

/**
 * 알림 목록 조회 (cursor 페이징)
 * GET /api/v1/notifications
 */
export const fetchNotifications = async (params: {
  cursor?: number;
  size?: number;
  category?: NotificationCategory;
}): Promise<NotificationListResponse> => {
  const queryParams = new URLSearchParams();
  if (params.cursor) queryParams.append('cursor', String(params.cursor));
  if (params.size) queryParams.append('size', String(params.size));
  if (params.category) queryParams.append('category', params.category);

  const url = `/api/v1/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await apiClient.get<NotificationListResponse>(url);
  return response.resultData;
};

/**
 * 미확인 알림 개수 조회
 * GET /api/v1/notifications/unread-count
 */
export const fetchUnreadCount = async (): Promise<number> => {
  const response = await apiClient.get<UnreadCountResponse>('/api/v1/notifications/unread-count');
  return response.resultData.count;
};

/**
 * 개별 알림 읽음 처리
 * POST /api/v1/notifications/{notificationId}/read
 */
export const markAsRead = async (notificationId: number): Promise<void> => {
  await apiClient.post(`/api/v1/notifications/${notificationId}/read`);
};

/**
 * 전체 알림 읽음 처리
 * POST /api/v1/notifications/read-all
 */
export const markAllAsRead = async (): Promise<number> => {
  const response = await apiClient.post<ReadAllResponse>('/api/v1/notifications/read-all');
  return response.resultData.updatedCount;
};
