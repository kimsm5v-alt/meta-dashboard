import type { Notification } from '../model/types';
import { mockTeacherNotifications, mockStudentNotifications } from '../model/mockData';
// import { apiClient } from '@shared/api';

/**
 * Mock 데이터로 알림 목록 조회
 * Phase 2: apiClient.get<Notification[]>('/notifications') 로 교체
 */
export const fetchNotifications = async (
  role: 'teacher' | 'student',
): Promise<Notification[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300)); // 0.3초 지연

  const notifications =
    role === 'teacher' ? mockTeacherNotifications : mockStudentNotifications;

  // localStorage에서 읽음 상태 복원
  const readIds = JSON.parse(
    localStorage.getItem(`notification_read_${role}`) || '[]',
  ) as string[];

  return notifications.map((n) => ({
    ...n,
    isRead: readIds.includes(n.id),
  }));

  // Phase 2 (API 연동):
  // const response = await apiClient.get<Notification[]>('/notifications');
  // return response;
};

/**
 * 알림 읽음 처리
 * Phase 2: PATCH /notifications/:id/read
 */
export const markAsRead = async (
  notificationId: string,
  role: 'teacher' | 'student',
): Promise<void> => {
  const key = `notification_read_${role}`;
  const readIds = JSON.parse(localStorage.getItem(key) || '[]') as string[];

  if (!readIds.includes(notificationId)) {
    readIds.push(notificationId);
    localStorage.setItem(key, JSON.stringify(readIds));
  }

  // Phase 2 (API 연동):
  // await apiClient.patch(`/notifications/${notificationId}/read`);
};

/**
 * 모든 알림 읽음 처리
 * Phase 2: PATCH /notifications/read-all
 */
export const markAllAsRead = async (role: 'teacher' | 'student'): Promise<void> => {
  const notifications =
    role === 'teacher' ? mockTeacherNotifications : mockStudentNotifications;

  const allIds = notifications.map((n) => n.id);
  localStorage.setItem(`notification_read_${role}`, JSON.stringify(allIds));

  // Phase 2 (API 연동):
  // await apiClient.patch('/notifications/read-all');
};
