/**
 * 관심 필요 학생 판별 유틸리티
 *
 * 38개 요인 T점수에서 두 가지 카운트를 계산:
 * - 극단값: 정적 요인 T<30 + 부적 요인 T≥70
 * - 경계값: 정적 요인 30≤T<40 + 부적 요인 60≤T<70
 *
 * 극단값 ≥ 2 또는 경계값 ≥ 5이면 관심 필요 판정.
 */

import type { AttentionResult, AttentionReason, FactorCategory } from '@shared/types';
import { FACTOR_DEFINITIONS } from '@shared/data/factors';

export const checkAttention = (tScores: number[]): AttentionResult => {
  let extremeCount = 0;
  let boundaryCount = 0;

  for (const factor of FACTOR_DEFINITIONS) {
    const score = tScores[factor.index];
    if (factor.isPositive) {
      if (score < 30) extremeCount++;
      else if (score < 40) boundaryCount++;
    } else {
      if (score >= 70) extremeCount++;
      else if (score >= 60) boundaryCount++;
    }
  }

  const needsAttention = extremeCount >= 2 || boundaryCount >= 5;

  if (!needsAttention) return { needsAttention: false, reasons: [] };

  // 툴팁용 reasons 구성 (극단값·경계값 해당 요인 전부 포함)
  const categoryMap = new Map<FactorCategory, { name: string; score: number }[]>();
  for (const factor of FACTOR_DEFINITIONS) {
    const score = tScores[factor.index];
    const flagged = factor.isPositive ? score < 40 : score >= 60;
    if (flagged) {
      const list = categoryMap.get(factor.category) ?? [];
      list.push({ name: factor.name, score: Math.round(score * 10) / 10 });
      categoryMap.set(factor.category, list);
    }
  }

  const reasons: AttentionReason[] = [];
  for (const [category, factors] of categoryMap) {
    const sample = FACTOR_DEFINITIONS.find((f) => f.category === category);
    const direction: 'low' | 'high' = sample?.isPositive ? 'low' : 'high';
    reasons.push({ category, factors, direction });
  }

  return { needsAttention, reasons };
};

/**
 * 관심 필요 사유를 한 줄 텍스트로 요약 (툴팁용)
 */
export const formatAttentionTooltip = (result: AttentionResult): string => {
  return result.reasons
    .map((r) => {
      const dir = r.direction === 'low' ? '↓' : '↑';
      const items = r.factors.map((f) => `${f.name}(T=${f.score})`).join(', ');
      return `${r.category}${dir}: ${items}`;
    })
    .join('\n');
};
