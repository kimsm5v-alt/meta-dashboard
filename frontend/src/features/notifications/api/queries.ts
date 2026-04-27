import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Notification } from '../model/types';
import { fetchNotifications, markAsRead, markAllAsRead } from './notificationService';

const NOTIFICATIONS_KEY = 'notifications';

/**
 * 알림 목록 조회 (30초마다 자동 갱신)
 */
export const useNotifications = (role: 'teacher' | 'student') => {
  return useQuery<Notification[]>({
    queryKey: [NOTIFICATIONS_KEY, role],
    queryFn: () => fetchNotifications(role),
    staleTime: 30_000, // 30초
    refetchInterval: 30_000, // 30초마다 폴링
    refetchOnWindowFocus: true,
  });
};

/**
 * 알림 읽음 처리 (Optimistic Update)
 */
export const useMarkAsRead = (role: 'teacher' | 'student') => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markAsRead(notificationId, role),
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [NOTIFICATIONS_KEY, role] });

      // Snapshot previous value
      const previous = queryClient.getQueryData<Notification[]>([NOTIFICATIONS_KEY, role]);

      // Optimistically update
      queryClient.setQueryData<Notification[]>([NOTIFICATIONS_KEY, role], (old) =>
        old?.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );

      return { previous };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData([NOTIFICATIONS_KEY, role], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY, role] });
    },
  });
};

/**
 * 모든 알림 읽음 처리
 */
export const useMarkAllAsRead = (role: 'teacher' | 'student') => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllAsRead(role),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [NOTIFICATIONS_KEY, role] });

      const previous = queryClient.getQueryData<Notification[]>([NOTIFICATIONS_KEY, role]);

      queryClient.setQueryData<Notification[]>([NOTIFICATIONS_KEY, role], (old) =>
        old?.map((n) => ({ ...n, isRead: true })),
      );

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData([NOTIFICATIONS_KEY, role], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY, role] });
    },
  });
};
