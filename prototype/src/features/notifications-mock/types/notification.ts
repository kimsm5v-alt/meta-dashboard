export type NotificationCategory = 'exam' | 'group';

export type NotificationEventType =
  | 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6'
  | 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6';

export interface Notification {
  id: string;
  eventType: NotificationEventType;
  category: NotificationCategory;
  message: string;
  highlights?: string[];
  link: string;
  isRead: boolean;
  createdAt: string;
}
