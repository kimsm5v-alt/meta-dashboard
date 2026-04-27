export type NotificationCategory = 'exam' | 'group';

export type TeacherEventType = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';
export type StudentEventType = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6';
export type NotificationEventType = TeacherEventType | StudentEventType;

export interface Notification {
  id: string;
  eventType: NotificationEventType;
  category: NotificationCategory;
  message: string;
  highlights?: string[]; // 메시지 내 강조 키워드
  link: string; // 클릭 시 이동 경로
  isRead: boolean;
  createdAt: string; // ISO 8601 timestamp
}
