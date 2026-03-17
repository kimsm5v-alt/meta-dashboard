/**
 * 관심 필요 학생 판별 유틸리티
 *
 * 38개 요인 T점수를 5대 영역(대분류) 단위로 검사하여
 * 정적 요인 T≤39 또는 부적 요인 T≥60 해당 시 관심 필요 판정.
 */

import type { AttentionResult, AttentionReason, FactorCategory } from '@/shared/types';
import { FACTOR_DEFINITIONS } from '@/shared/data/factors';

const POSITIVE_THRESHOLD = 39; // 정적 요인: T ≤ 39 → 관심 필요
const NEGATIVE_THRESHOLD = 60; // 부적 요인: T ≥ 60 → 관심 필요

/**
 * tScores(number[38], FACTORS 인덱스 순서)를 받아 관심 필요 여부 판별.
 * 대분류 단위로 하위 요인 중 1개라도 기준에 해당하면 해당 대분류에서 관심 필요.
 */
export const checkAttention = (tScores: number[]): AttentionResult => {
  const reasons: AttentionReason[] = [];

  // 대분류별로 요인을 그룹핑
  const categoryMap = new Map<FactorCategory, typeof FACTOR_DEFINITIONS>();
  for (const factor of FACTOR_DEFINITIONS) {
    const list = categoryMap.get(factor.category) ?? [];
    list.push(factor);
    categoryMap.set(factor.category, list);
  }

  for (const [category, factors] of categoryMap) {
    if (factors[0]?.isPositive) {
      // 정적 요인: T ≤ 39이면 관심 필요
      const flagged = factors
        .filter(f => tScores[f.index] <= POSITIVE_THRESHOLD)
        .map(f => ({ name: f.name, score: Math.round(tScores[f.index] * 10) / 10 }));

      if (flagged.length > 0) {
        reasons.push({ category, factors: flagged, direction: 'low' });
      }
    } else {
      // 부적 요인: T ≥ 60이면 관심 필요
      const flagged = factors
        .filter(f => tScores[f.index] >= NEGATIVE_THRESHOLD)
        .map(f => ({ name: f.name, score: Math.round(tScores[f.index] * 10) / 10 }));

      if (flagged.length > 0) {
        reasons.push({ category, factors: flagged, direction: 'high' });
      }
    }
  }

  return { needsAttention: reasons.length > 0, reasons };
};

/**
 * 관심 필요 사유를 한 줄 텍스트로 요약 (툴팁용)
 */
export const formatAttentionTooltip = (result: AttentionResult): string => {
  return result.reasons
    .map(r => {
      const dir = r.direction === 'low' ? '↓' : '↑';
      const items = r.factors.map(f => `${f.name}(T=${f.score})`).join(', ');
      return `${r.category}${dir}: ${items}`;
    })
    .join('\n');
};
