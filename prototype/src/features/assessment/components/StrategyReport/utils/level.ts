/**
 * 등급 산정 유틸리티
 *
 * T점수 기준으로 등급을 계산하는 순수 함수
 * ※ 임시 구간이니 LEVEL_BANDS 상수 테이블로 빼서 나중에 교체 가능하게
 * ※ 등급은 화면 표시용. 해설문은 백엔드 description을 쓴다. 둘을 연결하지 마
 */

import type { LevelType } from '../types';

/** 등급 구간 정의 (나중에 교체 가능하도록 테이블화) */
export const LEVEL_BANDS: { min: number; max: number; level: LevelType }[] = [
  { min: 70, max: Infinity, level: '매우 높음' },
  { min: 60, max: 69, level: '높음' },
  { min: 41, max: 59, level: '보통' },
  { min: 31, max: 40, level: '낮음' },
  { min: -Infinity, max: 30, level: '매우 낮음' },
];

/**
 * T점수 기준 등급 산정
 * @param t T점수
 * @returns 등급 라벨
 */
export const getLevel = (t: number): LevelType => {
  for (const band of LEVEL_BANDS) {
    if (t >= band.min && t <= band.max) {
      return band.level;
    }
  }
  // fallback (정상적으로는 도달하지 않음)
  return '보통';
};
