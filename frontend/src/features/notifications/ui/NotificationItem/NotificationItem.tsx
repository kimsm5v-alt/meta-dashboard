import { useNavigate } from 'react-router-dom';
import type { Notification } from '../../model/types';
import { useMarkAsRead } from '../../api/queries';
import { formatNotificationTime } from '../../utils/formatNotificationTime';
import { renderMessage } from '../../utils/renderMessage';
import * as S from './NotificationItem.styles';

interface NotificationItemProps {
  notification: Notification;
  role: 'teacher' | 'student';
}

export const NotificationItem = ({ notification, role }: NotificationItemProps) => {
  const navigate = useNavigate();
  const markAsReadMutation = useMarkAsRead(role);

  const handleClick = () => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    navigate(notification.link);
  };

  return (
    <S.Item $isRead={notification.isRead} onClick={handleClick}>
      <S.Message>{renderMessage(notification.message, notification.highlights)}</S.Message>
      <S.Time>{formatNotificationTime(notification.createdAt)}</S.Time>
    </S.Item>
  );
};
