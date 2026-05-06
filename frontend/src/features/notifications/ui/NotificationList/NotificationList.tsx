import { useRef, useEffect } from 'react';
import type { Notification } from '../../model/types';
import { NotificationItem } from '../NotificationItem/NotificationItem';
import * as S from './NotificationList.styles';

interface NotificationListProps {
  notifications: Notification[];
  onLoadMore: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

export const NotificationList = ({
  notifications,
  onLoadMore,
  hasMore,
  isLoading,
}: NotificationListProps) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  // 무한 스크롤 — IntersectionObserver
  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 1.0 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  return (
    <S.List>
      {notifications.map((notification) => (
        <NotificationItem key={notification.notificationId} notification={notification} />
      ))}
      {/* 무한 스크롤 트리거 */}
      {hasMore && <div ref={observerTarget} style={{ height: '1px' }} />}
      {isLoading && (
        <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
          불러오는 중...
        </div>
      )}
    </S.List>
  );
};
