import type { Notification } from '../types/notification';
import { NotificationItem } from './NotificationItem';
import { NotificationEmpty } from './NotificationEmpty';

interface NotificationListProps {
  notifications: Notification[];
  onItemClick: (notification: Notification) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({ notifications, onItemClick }) => {
  if (notifications.length === 0) {
    return <NotificationEmpty />;
  }

  return (
    <div className="py-1 max-h-[420px] overflow-y-auto">
      {notifications.map((n) => (
        <NotificationItem key={n.id} notification={n} onClick={onItemClick} />
      ))}
    </div>
  );
};

export default NotificationList;
