/**
 * 필기 캔버스 순수 드로잉 함수.
 * 실시간 그리기와 replay 가 같은 코드를 쓰게 해서 둘이 어긋나지 않도록 분리했다.
 */
import { HIGHLIGHTER_ALPHA, REF_W, type Point, type Stroke } from './annotationTypes';

/**
 * 캔버스 백버퍼 크기 조정 + 좌표계 설정.
 * ⚠️ canvas.width/height 대입은 transform·strokeStyle·globalAlpha·globalCompositeOperation 을
 * 전부 리셋하고 비트맵을 지운다 → 호출 후에는 반드시 전체 replay 를 다시 해야 한다.
 */
export function sizeCanvas(canvas: HTMLCanvasElement, w: number, h: number, dpr: number): CanvasRenderingContext2D | null {
  canvas.width = Math.max(1, Math.round(w * dpr));
  canvas.height = Math.max(1, Math.round(h * dpr));
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function clear(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
}

/**
 * 스트로크 하나를 그린다.
 * 핵심: 한 스트로크 = beginPath … stroke() **한 번**.
 * 세그먼트마다 stroke() 를 호출하면 형광펜이 자기 자신과 겹친 곳에서 알파가 누적돼 얼룩진다.
 */
export function strokePath(ctx: CanvasRenderingContext2D, s: Stroke, w: number, h: number): void {
  if (s.points.length === 0) return;
  const scale = w / REF_W;

  ctx.save();
  ctx.lineWidth = Math.max(1, s.width * scale);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (s.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = s.color;
    if (s.tool === 'highlighter') ctx.globalAlpha = HIGHLIGHTER_ALPHA;
  }

  const px = (p: Point) => [p.x * w, p.y * h] as const;
  ctx.beginPath();

  if (s.points.length === 1) {
    // 점 찍기 — 탭해도 자국이 남게
    const [x, y] = px(s.points[0]);
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.01, y);
  } else {
    const [x0, y0] = px(s.points[0]);
    ctx.moveTo(x0, y0);
    // 중점 이차 곡선 스무딩 — 손떨림이 각지게 보이지 않게
    for (let i = 1; i < s.points.length - 1; i++) {
      const [cx, cy] = px(s.points[i]);
      const [nx, ny] = px(s.points[i + 1]);
      ctx.quadraticCurveTo(cx, cy, (cx + nx) / 2, (cy + ny) / 2);
    }
    const [lx, ly] = px(s.points[s.points.length - 1]);
    ctx.lineTo(lx, ly);
  }

  ctx.stroke();
  // save/restore 로도 되돌아가지만, 누수 시 "펜이 갑자기 안 그려짐" 으로 나타나므로 명시적으로도 복구
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** 확정된 스트로크 전체를 순서대로 다시 그린다 (지우개도 순서대로 적용됨) */
export function replay(ctx: CanvasRenderingContext2D, strokes: Stroke[], w: number, h: number): void {
  clear(ctx, w, h);
  for (const s of strokes) strokePath(ctx, s, w, h);
}
