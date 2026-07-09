/**
 * 차트 관련 공용 유틸리티
 */

/** T점수(20~80)를 0~100% 비율로 변환 */
export const getBarPercent = (score: number): number =>
  Math.max(0, Math.min(100, ((score - 20) / 60) * 100));

/** T=50 기준선 위치 (%) */
export const REF_LINE_POS = getBarPercent(50);

/** 1차(이전) 막대 색상 (gray-400) */
export const PREV_COLOR = '#9CA3AF';
