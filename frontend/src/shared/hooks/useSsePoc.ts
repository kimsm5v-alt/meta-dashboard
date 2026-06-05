import { useEffect, useState } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { getAuth } from '@shared/lib/authClient';

export interface SsePocMessage {
  content: string;
  at: number;
}

/**
 * 알림 SSE 찍먹용 훅.
 * - /api/v1/notifications/stream 에 연결
 * - "notification" 이벤트 수신 시 messages 상태에 prepend
 */
export function useSsePoc(enabled: boolean = true) {
  const [messages, setMessages] = useState<SsePocMessage[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const ctrl = new AbortController();
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
    let token: string | null = null;
    try {
      token = getAuth().getAccessToken();
    } catch {
      // SDK 미초기화
    }
    if (!token) return;

    fetchEventSource(`${baseUrl}/api/v1/notifications/stream`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
      openWhenHidden: true,
      onopen: async (res) => {
        if (res.ok && res.headers.get('content-type')?.includes('text/event-stream')) {
          setConnected(true);
          // eslint-disable-next-line no-console
          console.log('[SSE] opened');
        } else {
          throw new Error(`SSE open failed: ${res.status}`);
        }
      },
      onmessage: (ev) => {
        if (ev.event === 'notification') {
          try {
            const data = JSON.parse(ev.data) as SsePocMessage;
            setMessages((prev) => [data, ...prev].slice(0, 50));
          } catch {
            // ignore
          }
        } else if (ev.event === 'connected') {
          // eslint-disable-next-line no-console
          console.log('[SSE] connected event');
        }
      },
      onerror: (err) => {
        // eslint-disable-next-line no-console
        console.warn('[SSE] error:', err);
        setConnected(false);
        // throw 안 하면 자동 재연결 시도
      },
      onclose: () => {
        setConnected(false);
        // eslint-disable-next-line no-console
        console.log('[SSE] closed');
      },
    }).catch(() => {
      setConnected(false);
    });

    return () => {
      ctrl.abort();
    };
  }, [enabled]);

  return { messages, connected };
}
