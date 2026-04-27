import type { Notification } from '../../model/types';
import { NotificationItem } from '../NotificationItem/NotificationItem';
import * as S from './NotificationList.styles';

interface NotificationListProps {
  notifications: Notification[];
  role: 'teacher' | 'student';
}

export const NotificationList = ({ notifications, role }: NotificationListProps) => {
  return (
    <S.List>
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} role={role} />
      ))}
    </S.List>
  );
};
