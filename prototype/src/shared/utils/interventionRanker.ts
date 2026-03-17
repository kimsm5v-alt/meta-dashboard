/**
 * 개인별 코칭 경로 랭킹 알고리즘
 *
 * 학생의 38개 T점수를 기반으로 유형별 interventions를 관련도 순으로 정렬한다.
 * - needScore: 관련 요인의 T점수가 이상적 방향에서 얼마나 떨어져 있는지
 * - deviationScore: 같은 유형 평균 대비 얼마나 나쁜 방향으로 치우쳐 있는지
 * - betaBoost: 통계적 효과크기(β)가 큰 경로를 우선 반영
 */

import { FACTOR_DEFINITIONS, getFactorByName } from '@/shared/data/factors';
import { LPA_PROFILE_DATA } from '@/shared/data/lpaProfiles';
import type { StudentType, SchoolLevel, RankedIntervention } from '@/shared/types';

/**
 * intervention의 x, z 필드에서 요인명을 추출하여 38개 요인 인덱스로 변환한다.
 * 복합 요인명("수업태도/몰두/의미감")은 "/"로 분리하여 개별 매칭한다.
 */
function resolveFactorIndices(name: string | null): number[] {
  if (!name) return [];
  const parts = name.split('/').map(s => s.trim());
  const indices: number[] = [];
  for (const part of parts) {
    const factor = getFactorByName(part);
    if (factor) indices.push(factor.index);
  }
  return indices;
}

/**
 * 관련 요인들의 T점수가 이상적 방향에서 얼마나 떨어져 있는지 계산한다.
 * 정적 요인: 낮을수록 gap 큼 (50 기준)
 * 부적 요인: 높을수록 gap 큼 (50 기준)
 * 반환값: 0~100 (높을수록 개입 필요도 높음)
 */
function computeNeedScore(tScores: number[], factorIndices: number[]): number {
  if (factorIndices.length === 0) return 0;

  let totalGap = 0;
  for (const idx of factorIndices) {
    const factor = FACTOR_DEFINITIONS[idx];
    const score = tScores[idx];
    if (factor.isPositive) {
      totalGap += Math.max(0, 50 - score);
    } else {
      totalGap += Math.max(0, score - 50);
    }
  }
  // T점수 범위 20~80에서 최대 gap = 30 (50-20 또는 80-50)
  return Math.min(100, (totalGap / factorIndices.length) * (100 / 30));
}

/**
 * 같은 유형의 평균 T점수 대비 학생 개인의 편차를 계산한다.
 * 나쁜 방향 편차에 1.5배, 나은 방향 편차에 0.5배 가중치를 적용한다.
 * 반환값: 0~100 (높을수록 유형 내에서 해당 영역이 상대적으로 취약)
 */
function computeDeviationScore(
  tScores: number[],
  typeMeans: number[],
  factorIndices: number[]
): number {
  if (factorIndices.length === 0 || typeMeans.length !== 38) return 0;

  let weightedSum = 0;
  for (const idx of factorIndices) {
    const factor = FACTOR_DEFINITIONS[idx];
    const diff = tScores[idx] - typeMeans[idx];
    // 정적 요인에서 유형 평균보다 낮거나, 부적 요인에서 유형 평균보다 높으면 "나쁜 방향"
    const isWorseDirection = factor.isPositive ? diff < 0 : diff > 0;
    const weight = isWorseDirection ? 1.5 : 0.5;
    weightedSum += Math.abs(diff) * weight;
  }
  // 일반적 편차 범위 0~15 기준 정규화
  return Math.min(100, (weightedSum / factorIndices.length) * (100 / 15));
}

/**
 * 통계적 효과크기(β)를 0~100 점수로 변환한다.
 * β 범위 0~0.5를 0~100으로 정규화.
 * β=0.479 → 95.8, β=0.220 → 44.0, β=0.045 → 9.0
 */
function computeBetaBoost(beta: number | undefined): number {
  if (!beta) return 0;
  return Math.min(100, Math.abs(beta) * 200);
}

/**
 * 관련도 사유 문자열을 생성한다.
 * 관련 요인 중 이상 방향으로 벗어난 요인을 최대 2개까지 표시한다.
 */
function buildRelevanceReason(
  tScores: number[],
  factorIndices: number[]
): string {
  if (factorIndices.length === 0) return '유형 기본 전략';

  const weak = factorIndices
    .map(idx => ({
      name: FACTOR_DEFINITIONS[idx].name,
      score: tScores[idx],
      isPositive: FACTOR_DEFINITIONS[idx].isPositive,
      gap: FACTOR_DEFINITIONS[idx].isPositive
        ? Math.max(0, 50 - tScores[idx])
        : Math.max(0, tScores[idx] - 50),
    }))
    .filter(f => f.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 2);

  if (weak.length === 0) return '유형 기본 전략';
  return weak.map(f => `${f.name}(T=${Math.round(f.score)})`).join(', ') + ' 보완 필요';
}

/**
 * 학생의 T점수 기반으로 유형별 interventions를 관련도 순으로 랭킹한다.
 *
 * 가중치 공식:
 * - typeMeans 있을 때: needScore×0.5 + deviationScore×0.3 + betaBoost×0.2
 * - typeMeans 없을 때: needScore×0.65 + betaBoost×0.35
 */
export function rankInterventions(
  tScores: number[],
  predictedType: StudentType,
  schoolLevel: SchoolLevel
): RankedIntervention[] {
  const schoolData = LPA_PROFILE_DATA[schoolLevel];
  const typeProfile = schoolData?.types.find(t => t.name === predictedType);

  if (!typeProfile) return [];

  const baseInterventions = typeProfile.interventions;
  const typeMeans = typeProfile.means;
  const hasTypeMeans = typeMeans.length === 38;

  // tScores가 유효하지 않으면 기존 순서 그대로 반환
  if (!tScores || tScores.length !== 38) {
    return baseInterventions.map((inv, i) => ({
      intervention: inv,
      relevanceScore: 100 - i * 10,
      relevanceReason: '기본 추천 전략',
      involvedFactors: [],
    }));
  }

  const ranked: RankedIntervention[] = baseInterventions.map(inv => {
    const xIndices = resolveFactorIndices(inv.x);
    const zIndices = resolveFactorIndices(inv.z);
    const allIndices = [...new Set([...xIndices, ...zIndices])];

    const needScore = computeNeedScore(tScores, allIndices);
    const deviationScore = computeDeviationScore(tScores, typeMeans, allIndices);
    const betaBoost = computeBetaBoost(inv.beta);

    // typeMeans가 있으면 3요소 가중, 없으면 needScore + betaBoost로 계산
    const relevanceScore = hasTypeMeans
      ? Math.round(needScore * 0.5 + deviationScore * 0.3 + betaBoost * 0.2)
      : Math.round(needScore * 0.65 + betaBoost * 0.35);

    return {
      intervention: inv,
      relevanceScore,
      relevanceReason: buildRelevanceReason(tScores, allIndices),
      involvedFactors: allIndices.map(idx => ({
        name: FACTOR_DEFINITIONS[idx].name,
        score: Math.round(tScores[idx] * 10) / 10,
        typeMean: hasTypeMeans
          ? Math.round(typeMeans[idx] * 10) / 10
          : null,
      })),
      scoreBreakdown: {
        needScore: Math.round(needScore),
        deviationScore: Math.round(deviationScore),
        betaBoost: Math.round(betaBoost),
      },
    };
  });

  ranked.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return ranked;
}
