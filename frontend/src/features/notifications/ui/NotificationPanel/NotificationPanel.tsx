import { useState } from 'react';
import type { Notification, NotificationCategory } from '../../model/types';
import { NotificationTabs } from '../NotificationTabs/NotificationTabs';
import { NotificationList } from '../NotificationList/NotificationList';
import { NotificationEmpty } from '../NotificationEmpty/NotificationEmpty';
import { useMarkAllAsRead } from '../../api/queries';
import * as S from './NotificationPanel.styles';

interface NotificationPanelProps {
  notifications: Notification[];
  role: 'teacher' | 'student';
  onClose: () => void;
}

export const NotificationPanel = ({ notifications, role }: NotificationPanelProps) => {
  const [activeCategory, setActiveCategory] = useState<'all' | NotificationCategory>('all');
  const markAllAsReadMutation = useMarkAllAsRead(role);

  const filteredNotifications = notifications.filter((n) => {
    if (activeCategory === 'all') return true;
    return n.category === activeCategory;
  });

  const unreadCount = filteredNotifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <S.Panel>
      <S.Header>
        <S.Title>알림</S.Title>
        {unreadCount > 0 && (
          <S.MarkAllButton onClick={handleMarkAllAsRead}>모두 읽음</S.MarkAllButton>
        )}
      </S.Header>

      <NotificationTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        notifications={notifications}
      />

      {filteredNotifications.length === 0 ? (
        <NotificationEmpty category={activeCategory} />
      ) : (
        <NotificationList notifications={filteredNotifications} role={role} />
      )}
    </S.Panel>
  );
};
