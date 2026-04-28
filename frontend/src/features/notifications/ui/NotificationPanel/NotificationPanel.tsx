import { useState } from 'react';
import type { NotificationCategory } from '../../model/types';
import { NotificationTabs } from '../NotificationTabs/NotificationTabs';
import { NotificationList } from '../NotificationList/NotificationList';
import { NotificationEmpty } from '../NotificationEmpty/NotificationEmpty';
import { useNotifications, useMarkAllAsRead } from '../../api/queries';
import * as S from './NotificationPanel.styles';

interface NotificationPanelProps {
  onClose: () => void;
}

export const NotificationPanel = ({ onClose: _onClose }: NotificationPanelProps) => {
  const [activeCategory, setActiveCategory] = useState<'all' | NotificationCategory>('all');
  const markAllAsReadMutation = useMarkAllAsRead();

  // 무한 스크롤 쿼리 (카테고리 필터 적용)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications(activeCategory === 'all' ? undefined : activeCategory);

  // 모든 페이지의 알림 병합
  const allNotifications = data?.pages.flatMap((page) => page.items) ?? [];

  // 미확인 개수 (현재 카테고리 기준)
  const unreadCount = allNotifications.filter((n) => !n.read).length;

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
        allNotifications={allNotifications}
      />

      {allNotifications.length === 0 ? (
        <NotificationEmpty category={activeCategory} />
      ) : (
        <NotificationList
          notifications={allNotifications}
          onLoadMore={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          hasMore={hasNextPage}
          isLoading={isFetchingNextPage}
        />
      )}
    </S.Panel>
  );
};
