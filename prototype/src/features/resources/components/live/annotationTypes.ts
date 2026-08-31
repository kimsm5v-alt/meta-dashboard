/**
 * 실시간 수업 슬라이드 필기 타입·상수.
 *
 * 좌표는 무대 박스 기준 0~1 정규화 값으로 저장한다.
 * 무대가 aspect-video 로 고정돼 있어 뷰포트가 바뀌어도 비율은 그대로고 배율만 변하므로,
 * 정규화 좌표는 리사이즈에 불변이다. (ClassLiveOverlay 무대의 aspect-video 는 이 설계의 전제)
 */

export type ToolId = 'pen' | 'highlighter' | 'eraser';

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  tool: ToolId;
  /** 지우개는 무시 */
  color: string;
  /** REF_W 기준 px — 렌더 시 실제 폭에 비례해 스케일한다 */
  width: number;
  points: Point[];
}

/** 선 굵기 기준 무대 폭. 굵기를 raw px로 저장하면 리사이즈 후 지우개 구멍 크기가 달라진다. */
export const REF_W = 1280;

export const TOOL_WIDTH: Record<ToolId, number> = {
  pen: 4,
  highlighter: 18,
  eraser: 22,
};

/** 형광펜은 흰 활동지 위에 얹히므로 밝은 색만 */
export const HIGHLIGHTER_ALPHA = 0.35;

export const PEN_COLORS = ['#ef4444', '#2563eb', '#111827', '#16a34a'];
export const HIGHLIGHTER_COLORS = ['#fde047', '#86efac', '#f9a8d4', '#67e8f9'];

export const colorsFor = (tool: ToolId): string[] =>
  tool === 'highlighter' ? HIGHLIGHTER_COLORS : PEN_COLORS;

/** 슬라이드 번호(1-based) → 스트로크 목록 */
export type SlideStrokes = Record<number, Stroke[]>;

/** 스트로크 없는 슬라이드용 고정 참조 — replay effect 의존성이 매 렌더 바뀌지 않게 */
export const NO_STROKES: Stroke[] = [];
