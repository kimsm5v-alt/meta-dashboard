import { useEffect, useRef, useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useQueryClient } from '@tanstack/react-query';
import { getAuth } from '@shared/lib/authClient';
import { ENV } from '@shared/config/env';
import type { Notification } from '../model/types';

// ============================================================
// SSE 스트림 훅
// ============================================================

interface UseNotificationStreamOptions {
  enabled: boolean; // 로그인 상태에서만 활성화
  onNotification?: (notification: Notification) => void;
}

export const useNotificationStream = ({ enabled, onNotification }: UseNotificationStreamOptions) => {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(async () => {
    if (!enabled) return;

    // 기존 연결 정리
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const auth = getAuth();
      const token = auth.getAccessToken();

      if (!token) {
        console.warn('[SSE] No access token available');
        return;
      }

      console.log('[SSE] Connecting to stream...');

      await fetchEventSource(`${ENV.API_URL}/api/v1/notifications/stream`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: abortController.signal,

        async onopen(res) {
          if (res.ok) {
            console.log('[SSE] Connected successfully');
            reconnectAttempts.current = 0;
            return;
          }

          // 401 토큰 만료 → SDK refresh 시도
          if (res.status === 401) {
            console.warn('[SSE] Token expired, refreshing...');
            try {
              await auth.refreshAccessToken();
              throw new Error('retry-with-new-token');
            } catch {
              console.error('[SSE] Token refresh failed');
              throw new Error('auth-failed');
            }
          }

          throw new Error(`SSE connection failed: ${res.status}`);
        },

        onmessage(ev) {
          if (ev.event === 'connected') {
            console.log('[SSE] Initial connection event received');
            return;
          }

          if (ev.event === 'notification') {
            try {
              const notification: Notification = JSON.parse(ev.data);
              console.log('[SSE] New notification:', notification);

              // React Query 캐시 무효화 → 목록 새로고침
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
              queryClient.invalidateQueries({ queryKey: ['unread-count'] });

              // 커스텀 핸들러 호출 (옵션)
              onNotification?.(notification);
            } catch (err) {
              console.error('[SSE] Failed to parse notification:', err);
            }
          }
        },

        onerror(err) {
          console.error('[SSE] Connection error:', err);

          // 재연결 지수 백오프
          reconnectAttempts.current += 1;

          if (reconnectAttempts.current >= maxReconnectAttempts) {
            console.warn('[SSE] Max reconnect attempts reached, aborting');
            abortController.abort();
            return; // stop retrying
          }

          const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30_000);
          const jitter = Math.random() * 1000;
          const retryDelay = delay + jitter;

          console.log(`[SSE] Retrying in ${Math.round(retryDelay / 1000)}s...`);
          return retryDelay;
        },

        openWhenHidden: true, // 백그라운드에서도 연결 유지
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'retry-with-new-token') {
        // 토큰 갱신 후 재연결
        setTimeout(() => connect(), 1000);
        return;
      }

      console.error('[SSE] Fatal error:', err);
    }
  }, [enabled, queryClient, onNotification]);

  // 연결 시작
  useEffect(() => {
    connect();

    return () => {
      console.log('[SSE] Disconnecting...');
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, [connect]);

  return {
    reconnect: connect,
  };
};
