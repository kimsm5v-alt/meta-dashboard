import type { Notification } from '../types/notification';
import { formatNotificationTime } from '../utils/formatNotificationTime';
import { renderMessage } from '../utils/renderMessage';

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
  const { message, highlights, isRead, createdAt } = notification;

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className="w-full text-left flex gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors"
    >
      <span
        className={`shrink-0 w-[7px] h-[7px] rounded-full mt-1.5 ${
          isRead ? 'bg-transparent' : 'bg-primary-500'
        }`}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-[13px] leading-[1.5] ${
            isRead ? 'text-gray-500' : 'text-gray-900 font-medium'
          }`}
        >
          {renderMessage(message, highlights, isRead)}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">{formatNotificationTime(createdAt)}</p>
      </div>
    </button>
  );
};

export default NotificationItem;
