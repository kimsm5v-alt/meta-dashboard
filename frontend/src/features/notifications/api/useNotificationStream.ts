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
            // 가드 ① — max 한도 체크 (onerror 의 reconnectAttempts 가드가 401 경로에선 안 먹음).
            // 폭주 방지: 5회 401 받으면 SSE 영구 중단 → IdP refresh 폭주 차단
            reconnectAttempts.current += 1;
            if (reconnectAttempts.current >= maxReconnectAttempts) {
              console.error('[SSE] 401 retry max reached — 알림 기능 중단');
              throw new Error('auth-failed-max-retries');
            }

            // 가드 ② — BE 가 user_no 매핑 실패로 보낸 401 은 refresh 무의미 → 즉시 중단
            // (학심정 BE commit 600a82b 에서 errorCode=USER_NOT_MAPPED 로 식별)
            let errorCode: string | undefined;
            try {
              const body = await res.clone().json();
              errorCode = body?.errorCode;
            } catch {
              // SSE 응답 body 가 json 아닐 수 있음 — 무시
            }
            if (errorCode === 'USER_NOT_MAPPED') {
              console.error('[SSE] 사용자 매핑 미완료 — SSE 중단 (refresh 무의미)');
              throw new Error('user-not-mapped');
            }

            console.warn('[SSE] Token expired, refreshing...');
            try {
              await auth.refreshAccessToken();
            } catch {
              console.error('[SSE] Token refresh failed');
              throw new Error('auth-failed');
            }
            // refresh 성공 → 외부 catch 가 'retry-with-new-token' 분기에서 재연결 (1초 후)
            throw new Error('retry-with-new-token');
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

              // 알림 목록 갱신
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
              // 미확인 개수 +1 (API 재호출 없이 로컬 증가)
              queryClient.setQueryData<number>(['unread-count'], (old) => (old ?? 0) + 1);

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

      // 영구 중단 케이스 — connect 재호출 안 함 (폭주 방지)
      if (
        err instanceof Error &&
        (err.message === 'auth-failed-max-retries' ||
          err.message === 'user-not-mapped' ||
          err.message === 'auth-failed')
      ) {
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
