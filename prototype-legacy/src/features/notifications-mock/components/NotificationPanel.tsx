import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { Notification, NotificationCategory } from '../types/notification';
import { NotificationTabs } from './NotificationTabs';
import { NotificationList } from './NotificationList';

interface NotificationPanelProps {
  role: 'teacher' | 'student';
  notifications: Notification[];
  onNotificationsChange: (next: Notification[]) => void;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  role,
  notifications,
  onNotificationsChange,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<NotificationCategory>('exam');

  const unreadByCategory = useMemo<Record<NotificationCategory, number>>(() => {
    const base: Record<NotificationCategory, number> = { exam: 0, group: 0 };
    for (const n of notifications) {
      if (!n.isRead) base[n.category] += 1;
    }
    return base;
  }, [notifications]);

  const filtered = useMemo(
    () =>
      notifications
        .filter((n) => n.category === activeTab)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notifications, activeTab],
  );

  const currentTabUnread = unreadByCategory[activeTab];

  const handleItemClick = (clicked: Notification) => {
    if (!clicked.isRead) {
      onNotificationsChange(
        notifications.map((n) => (n.id === clicked.id ? { ...n, isRead: true } : n)),
      );
    }
    console.info(`[${role}] Navigate to:`, clicked.link);
  };

  const handleMarkAllRead = () => {
    if (currentTabUnread === 0) return;
    onNotificationsChange(
      notifications.map((n) => (n.category === activeTab && !n.isRead ? { ...n, isRead: true } : n)),
    );
  };

  return (
    <div className="absolute right-0 top-12 w-96 bg-white border border-gray-200 rounded-xl shadow-sm z-50">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-[15px] font-medium text-gray-900">알림</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={currentTabUnread === 0}
            className={`px-2 py-1 text-xs rounded-md transition-colors ${
              currentTabUnread === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-primary-600 hover:bg-primary-50'
            }`}
          >
            모두 읽음
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
            aria-label="알림 패널 닫기"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 탭 */}
      <NotificationTabs
        active={activeTab}
        unreadByCategory={unreadByCategory}
        onChange={setActiveTab}
      />

      {/* 리스트 or 빈 상태 */}
      <NotificationList notifications={filtered} onItemClick={handleItemClick} />
    </div>
  );
};

export default NotificationPanel;
