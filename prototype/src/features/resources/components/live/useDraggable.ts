/**
 * 포인터 드래그 이동 훅 (수업 위젯용).
 * 핸들에만 바인딩한다 — 카드 전체에 걸면 내부 버튼을 누를 때마다 드래그가 시작된다.
 * 위젯은 position:fixed 라 뷰포트 기준으로 clamp 한다.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

export interface Pos {
  x: number;
  y: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function useDraggable(initial: () => Pos) {
  const [pos, setPos] = useState<Pos>(initial);
  const elRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef<{ dx: number; dy: number } | null>(null);

  const clampToViewport = useCallback((p: Pos): Pos => {
    const w = elRef.current?.offsetWidth ?? 0;
    const h = elRef.current?.offsetHeight ?? 0;
    return {
      x: clamp(p.x, 0, Math.max(0, window.innerWidth - w)),
      y: clamp(p.y, 0, Math.max(0, window.innerHeight - h)),
    };
  }, []);

  // 창을 줄였을 때 위젯이 화면 밖으로 밀려나지 않게
  useEffect(() => {
    const onResize = () => setPos((p) => clampToViewport(p));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampToViewport]);

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // 핸들 안의 버튼(닫기 등)에서 시작한 입력은 드래그로 가로채지 않는다.
    // setPointerCapture 를 하면 이후 pointer·mouse 이벤트가 핸들로 리타깃돼
    // 버튼의 click 이 아예 발생하지 않는다.
    if ((e.target as HTMLElement).closest('button, a, input, [data-no-drag]')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    offsetRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const o = offsetRef.current;
    if (!o) return;
    setPos(clampToViewport({ x: e.clientX - o.dx, y: e.clientY - o.dy }));
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLElement>) => {
    offsetRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return {
    pos,
    elRef,
    /** 드래그 핸들(헤더)에 스프레드 */
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onLostPointerCapture: () => { offsetRef.current = null; },
    },
  };
}
