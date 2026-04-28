import { useNavigate } from 'react-router-dom';
import type { Notification } from '../../model/types';
import { useMarkAsRead } from '../../api/queries';
import { formatNotificationTime } from '../../utils/formatNotificationTime';
import * as S from './NotificationItem.styles';

interface NotificationItemProps {
  notification: Notification;
}

export const NotificationItem = ({ notification }: NotificationItemProps) => {
  const navigate = useNavigate();
  const markAsReadMutation = useMarkAsRead();

  const handleClick = () => {
    // 읽지 않은 알림은 읽음 처리
    if (!notification.read) {
      markAsReadMutation.mutate(notification.notificationId);
    }

    // 딥링크 이동 (null이면 이동하지 않음)
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <S.Item
      $isRead={notification.read}
      onClick={handleClick}
      style={{ cursor: notification.link ? 'pointer' : 'default' }}
    >
      <S.Message>{notification.content}</S.Message>
      <S.Time>{formatNotificationTime(notification.createdAt)}</S.Time>
    </S.Item>
  );
};
