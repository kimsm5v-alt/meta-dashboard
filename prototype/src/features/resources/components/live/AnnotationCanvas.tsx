/**
 * 슬라이드 위 필기 캔버스.
 *
 * 캔버스 2겹:
 *  - base: 확정된 스트로크 전체 (슬라이드 전환·커밋·undo·clear·리사이즈 시 replay)
 *  - live: 그리는 중인 스트로크 하나 (프레임마다 전체 경로를 한 번에 다시 긋는다)
 * 지우개만 예외로 base 에 직접 그린다 — 투명한 live 레이어에 destination-out 을 하면
 * 아무것도 지워지지 않아 pointerup 전까지 피드백이 없기 때문.
 */
import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { clear, replay, sizeCanvas, strokePath } from './annotationDraw';
import { TOOL_WIDTH, type Point, type Stroke, type ToolId } from './annotationTypes';

interface AnnotationCanvasProps {
  strokes: Stroke[];
  slide: number;
  tool: ToolId | null;
  color: string;
  onCommit: (slide: number, stroke: Stroke) => void;
}

export const AnnotationCanvas = ({ strokes, slide, tool, color, onCommit }: AnnotationCanvasProps) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const liveRef = useRef<HTMLCanvasElement | null>(null);

  const sizeRef = useRef({ w: 0, h: 0 });
  const drawingRef = useRef(false);
  const activeIdRef = useRef<number | null>(null);
  const pointsRef = useRef<Point[]>([]);
  /** 지우개가 base 에 이미 그린 지점 (프레임 사이에 점이 쌓여도 끊기지 않게) */
  const erasedUpToRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  /** pointerdown 시점의 슬라이드 — 그리는 도중 페이지를 넘겨도 원래 슬라이드에 커밋 */
  const strokeSlideRef = useRef(slide);
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  toolRef.current = tool;
  colorRef.current = color;

  const redrawBase = useCallback(() => {
    const ctx = baseRef.current?.getContext('2d');
    const { w, h } = sizeRef.current;
    if (!ctx || !w) return;
    replay(ctx, strokes, w, h);
  }, [strokes]);

  // 크기·DPR 대응: 크기 설정 → setTransform → 전체 replay 순서를 반드시 지킨다
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let raf: number | null = null;

    const apply = () => {
      raf = null;
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      const dpr = window.devicePixelRatio || 1;
      sizeRef.current = { w, h };
      if (baseRef.current) sizeCanvas(baseRef.current, w, h, dpr);
      if (liveRef.current) sizeCanvas(liveRef.current, w, h, dpr);
      redrawBase();
    };

    apply();
    const ro = new ResizeObserver(() => {
      if (raf === null) raf = requestAnimationFrame(apply);
    });
    ro.observe(host); // 캔버스가 아니라 호스트를 관찰 — 캔버스는 absolute 라 피드백 루프가 난다
    return () => {
      ro.disconnect();
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [redrawBase]);

  // 확정 스트로크 변화(슬라이드 전환 포함) → base 다시 그리기.
  // 그리는 도중에는 건너뛴다 — 지우개가 base 를 직접 건드리는 중이라 replay 하면 지운 게 되살아난다.
  useEffect(() => {
    if (drawingRef.current) return;
    redrawBase();
  }, [redrawBase]);

  const toNorm = (e: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  const currentStroke = (): Stroke => ({
    tool: toolRef.current ?? 'pen',
    color: colorRef.current,
    width: TOOL_WIDTH[toolRef.current ?? 'pen'],
    points: pointsRef.current,
  });

  const paintFrame = () => {
    rafRef.current = null;
    const { w, h } = sizeRef.current;
    const s = currentStroke();
    if (s.tool === 'eraser') {
      // 지우개는 base 에 직접 그린다 (투명한 live 레이어에서는 destination-out 이 아무것도 안 지운다).
      // 한 프레임에 점이 여러 개 쌓일 수 있으므로 "지난번에 그린 지점부터 끝까지" 이어 그려야 끊기지 않는다.
      const ctx = baseRef.current?.getContext('2d');
      const pts = pointsRef.current;
      const from = Math.max(0, erasedUpToRef.current - 1);
      if (ctx && pts.length - from >= 2) {
        strokePath(ctx, { ...s, points: pts.slice(from) }, w, h);
        erasedUpToRef.current = pts.length;
      }
      return;
    }
    const ctx = liveRef.current?.getContext('2d');
    if (!ctx) return;
    clear(ctx, w, h);
    strokePath(ctx, s, w, h);
  };

  const schedule = () => {
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(paintFrame);
  };

  const finish = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    activeIdRef.current = null;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const pts = pointsRef.current;
    pointsRef.current = [];
    const ctx = liveRef.current?.getContext('2d');
    const { w, h } = sizeRef.current;
    if (ctx) clear(ctx, w, h);
    if (pts.length) {
      onCommit(strokeSlideRef.current, {
        tool: toolRef.current ?? 'pen',
        color: colorRef.current,
        width: TOOL_WIDTH[toolRef.current ?? 'pen'],
        points: pts,
      });
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!toolRef.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (activeIdRef.current !== null) return; // 첫 포인터만 인정 (팜 리젝션)
    e.currentTarget.setPointerCapture(e.pointerId); // 슬라이드 밖으로 나가도 스트로크가 끊기지 않게
    activeIdRef.current = e.pointerId;
    drawingRef.current = true;
    strokeSlideRef.current = slide;
    pointsRef.current = [toNorm(e)];
    erasedUpToRef.current = 0;
    schedule();
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || e.pointerId !== activeIdRef.current) return;
    const coalesced = e.nativeEvent.getCoalescedEvents?.();
    if (coalesced?.length) {
      const r = e.currentTarget.getBoundingClientRect();
      for (const c of coalesced) {
        pointsRef.current.push({ x: (c.clientX - r.left) / r.width, y: (c.clientY - r.top) / r.height });
      }
    } else {
      pointsRef.current.push(toNorm(e));
    }
    schedule();
  };

  const end = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.pointerId !== activeIdRef.current) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    finish();
  };

  const active = tool !== null;

  return (
    <div ref={hostRef} className="absolute inset-0">
      <canvas ref={baseRef} className="pointer-events-none absolute inset-0" />
      <canvas
        ref={liveRef}
        className={`absolute inset-0 select-none ${
          active ? 'pointer-events-auto cursor-crosshair touch-none' : 'pointer-events-none'
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={finish}
      />
    </div>
  );
};
