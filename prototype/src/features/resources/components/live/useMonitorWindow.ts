/**
 * 모니터링 팝업 창 생명주기.
 *
 * open() 은 **반드시 클릭 핸들러 안에서** 호출한다 — 팝업 차단기가 사용자 제스처를 요구하고,
 * effect 에서 열면 StrictMode 이중 실행에 걸린다.
 * URL 에 라우트를 주면 SPA 가 통째로 다시 부팅되므로 빈 문자열(about:blank)을 쓴다.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const FEATURES = 'popup=yes,noopener=no,width=440,height=800';

export function useMonitorWindow(onBlocked: () => void) {
  const [win, setWin] = useState<Window | null>(null);
  const blockedCb = useRef(onBlocked);
  blockedCb.current = onBlocked;

  const close = useCallback(() => {
    setWin((w) => {
      if (w && !w.closed) w.close();
      return null;
    });
  }, []);

  const open = useCallback(() => {
    const left = window.screenX + window.outerWidth;
    const top = window.screenY;
    let w: Window | null = null;
    try {
      w = window.open('', 'meta-live-monitor', `${FEATURES},left=${left},top=${top}`);
    } catch {
      w = null;
    }
    if (!w || w.closed || typeof w.closed === 'undefined') {
      blockedCb.current();
      return;
    }
    w.focus();
    setWin(w);
  }, []);

  // 사용자가 X 로 닫는 건 이벤트가 보장되지 않으므로 pagehide 와 폴링을 둘 다 건다
  useEffect(() => {
    if (!win) return;
    let done = false;
    const onClosed = () => {
      if (done) return;
      done = true;
      setWin(null);
    };
    win.addEventListener('pagehide', onClosed);
    const poll = setInterval(() => {
      if (win.closed) onClosed();
    }, 500);
    // opener 를 새로고침/이탈하면 팝업이 죽은 트리로 남는다
    const onOpenerHide = () => {
      if (!win.closed) win.close();
    };
    window.addEventListener('pagehide', onOpenerHide);
    return () => {
      clearInterval(poll);
      win.removeEventListener('pagehide', onClosed);
      window.removeEventListener('pagehide', onOpenerHide);
    };
  }, [win]);

  // 부모 언마운트(수업 종료) → 팝업도 닫는다
  useEffect(() => () => { if (win && !win.closed) win.close(); }, [win]);

  return { win, open, close };
}
