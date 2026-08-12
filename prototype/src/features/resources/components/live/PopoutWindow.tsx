/**
 * 별도 브라우저 창으로 React 트리를 포털한다.
 * 라우트를 새로 만들지 않아도 되고(app/ 미변경), 부모 트리의 일부라 상태가 자동 동기화된다.
 *
 * 스타일 주입이 dev/prod 가 다르다:
 *  - 빌드: <link rel=stylesheet>
 *  - dev : @vitejs/plugin-react 가 넣은 <style> 이고 CSS HMR 이 그 textContent 를 제자리에서 바꾼다
 * 그래서 한 번 cloneNode 하면 CSS 를 수정하는 순간 팝업만 스타일이 날아간다 → 재조정 방식으로 동기화.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PopoutWindowProps {
  win: Window;
  title: string;
  /** 팝업 body 에 적용할 클래스 (Tailwind preflight 는 클론되지만 앱 루트 클래스는 안 따라온다) */
  bodyClassName?: string;
  children: ReactNode;
}

export const PopoutWindow = ({ win, title, bodyClassName = '', children }: PopoutWindowProps) => {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const doc = win.document;
    doc.title = title;

    if (!doc.head.querySelector('meta[charset]')) {
      const meta = doc.createElement('meta');
      meta.setAttribute('charset', 'utf-8');
      doc.head.appendChild(meta);
    }

    // 원본 → 클론 매핑을 유지하며 재조정. MutationRecord 를 해석하지 않으므로 어긋날 수 없다.
    const map = new Map<Element, Element>();
    const syncHead = () => {
      const originals = document.head.querySelectorAll('style, link[rel="stylesheet"]');
      originals.forEach((el) => {
        const clone = map.get(el);
        if (!clone) {
          const c = el.cloneNode(true) as Element;
          map.set(el, c);
          doc.head.appendChild(c);
        } else if (el.tagName === 'STYLE' && clone.textContent !== el.textContent) {
          clone.textContent = el.textContent; // ← CSS HMR 대응
        }
      });
      map.forEach((clone, orig) => {
        if (!orig.isConnected) {
          clone.remove();
          map.delete(orig);
        }
      });
    };
    syncHead();
    // characterData 가 HMR 의 텍스트 교체를 잡는 부분이다
    const mo = new MutationObserver(syncHead);
    mo.observe(document.head, { childList: true, subtree: true, characterData: true });

    doc.documentElement.className = 'h-full';
    doc.body.className = bodyClassName;

    // body 가 같은 틱에 준비되지 않는 브라우저가 있어 host div 를 직접 만든다
    const el = doc.createElement('div');
    el.className = 'h-full';
    (doc.body ?? doc.documentElement).appendChild(el);
    setHost(el);

    return () => {
      mo.disconnect();
      setHost(null);
      if (!win.closed) el.remove();
    };
  }, [win, title, bodyClassName]);

  return host ? createPortal(children, host) : null;
};
