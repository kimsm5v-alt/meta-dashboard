import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import type { NotificationListResponse, NotificationCategory } from '../model/types';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
} from './notificationService';

// ============================================================
// React Query 훅
// ============================================================

/**
 * 알림 목록 조회 (무한 스크롤)
 * SSE로 실시간 갱신되므로 폴링 불필요
 */
export const useNotifications = (category?: NotificationCategory) => {
  return useInfiniteQuery<NotificationListResponse>({
    queryKey: ['notifications', category],
    queryFn: ({ pageParam }) =>
      fetchNotifications({
        cursor: pageParam as number | undefined,
        size: 20,
        category,
      }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    initialPageParam: undefined,
    staleTime: 5 * 60 * 1000, // 5분 (SSE가 실시간 갱신하므로 긴 시간 설정)
    refetchOnWindowFocus: true,
  });
};

/**
 * 미확인 알림 개수 조회
 * 최초 1회만 호출 — 이후 SSE 수신 시 +1, 읽음 처리 시 -1 로 로컬 관리
 */
export const useUnreadCount = () => {
  return useQuery<number>({
    queryKey: ['unread-count'],
    queryFn: fetchUnreadCount,
    staleTime: Infinity,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });
};

/**
 * 개별 알림 읽음 처리 (Optimistic Update)
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) => markAsRead(notificationId),
    onMutate: async (notificationId) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      // 이전 값 저장
      const previousData = queryClient.getQueriesData<{
        pages: NotificationListResponse[];
        pageParams: unknown[];
      }>({
        queryKey: ['notifications'],
      });

      // Optimistic Update — 모든 카테고리 쿼리에 적용
      queryClient.setQueriesData<{
        pages: NotificationListResponse[];
        pageParams: unknown[];
      }>({ queryKey: ['notifications'] }, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((n) =>
              n.notificationId === notificationId ? { ...n, read: true } : n,
            ),
          })),
        };
      });

      // 미확인 개수 -1
      queryClient.setQueryData<number>(['unread-count'], (old) => Math.max((old ?? 1) - 1, 0));

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Rollback
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

/**
 * 전체 알림 읽음 처리
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousData = queryClient.getQueriesData<{
        pages: NotificationListResponse[];
        pageParams: unknown[];
      }>({
        queryKey: ['notifications'],
      });

      // 모든 알림 read: true
      queryClient.setQueriesData<{
        pages: NotificationListResponse[];
        pageParams: unknown[];
      }>({ queryKey: ['notifications'] }, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((n) => ({ ...n, read: true })),
          })),
        };
      });

      // 미확인 개수 0
      queryClient.setQueryData<number>(['unread-count'], 0);

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
