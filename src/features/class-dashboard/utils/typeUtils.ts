import type { Student } from '../../../shared/types';
import { getTypeDeviations } from '../../../shared/utils/lpaClassifier';
import { FACTOR_DEFINITIONS } from '../../../shared/data/factors';

// ============================================================
// 타입 정의
// ============================================================

export interface Keyword {
  name: string;
  isPositive: boolean;
  direction: 'positive' | 'negative';
}

// ============================================================
// 유형 순서 및 색상 상수
// ============================================================

export const TYPE_ORDER = ['몰입자원풍부형', '안전균형형', '자원소진형', '미실시'] as const;

export const TYPE_COLORS: Record<string, string> = {
  '미실시': '#E5E7EB',
  '자원소진형': '#FB923C',
  '안전균형형': '#2DD4BF',
  '몰입자원풍부형': '#60A5FA',
};

export const TYPE_GRADIENTS: Record<string, { start: string; end: string }> = {
  '미실시': { start: '#E5E7EB', end: '#D1D5DB' },
  '자원소진형': { start: '#FB923C', end: '#F97316' },
  '안전균형형': { start: '#5EEAD4', end: '#14B8A6' },
  '몰입자원풍부형': { start: '#93C5FD', end: '#3B82F6' },
};

export const FLOW_COLORS: Record<string, string> = {
  improve: '#10B981',
  maintain: '#94A3B8',
  concern: '#F43F5E',
  notAssessed: '#CBD5E1',
};

export const FLOW_GRADIENTS: Record<string, { start: string; end: string }> = {
  improve: { start: '#6EE7B7', end: '#10B981' },
  maintain: { start: '#E2E8F0', end: '#94A3B8' },
  concern: { start: '#FCA5A5', end: '#F87171' },
  notAssessed: { start: '#F1F5F9', end: '#CBD5E1' },
};

// 유형 점수 (변화 판단용)
export const TYPE_RANK: Record<string, number> = {
  '미실시': 0,
  '자원소진형': 1,
  '안전균형형': 2,
  '몰입자원풍부형': 3,
};

// ============================================================
// 유틸리티 함수
// ============================================================

/**
 * 유형 변화 유형 결정
 */
export const getChangeType = (
  from: string,
  to: string
): 'improve' | 'maintain' | 'concern' | 'notAssessed' => {
  if (to === '미실시') return 'notAssessed';
  if (from === to) return 'maintain';

  const fromRank = TYPE_RANK[from] || 0;
  const toRank = TYPE_RANK[to] || 0;

  return toRank > fromRank ? 'improve' : 'concern';
};

/**
 * 유형 변화 점수 반환 (긍정: 1, 부정: -1, 변화없음: 0)
 */
export const getTypeChangeScore = (type1?: string, type2?: string): number => {
  if (!type1 || !type2) return 0;
  if (type1 === type2) return 0;

  const score1 = TYPE_RANK[type1] || 0;
  const score2 = TYPE_RANK[type2] || 0;

  if (score2 > score1) return 1;
  if (score2 < score1) return -1;
  return 0;
};

/**
 * 학생의 주요 키워드 추출 (특정 차수)
 */
export const getStudentKeywords = (student: Student, round: 1 | 2): Keyword[] => {
  const assessment = student.assessments.find(a => a.round === round);
  if (!assessment) return [];

  const deviations = getTypeDeviations(
    assessment.tScores,
    assessment.predictedType,
    student.schoolLevel,
    3
  );

  return deviations.map(dev => {
    const factor = FACTOR_DEFINITIONS[dev.index];
    return {
      name: factor.name,
      isPositive: factor.isPositive,
      direction: dev.direction,
    };
  });
};

/**
 * 키워드 색상 결정
 */
export const getKeywordColor = (
  isPositive: boolean,
  direction: 'positive' | 'negative'
): string => {
  if (isPositive) {
    return direction === 'positive' ? 'text-blue-600' : 'text-red-500';
  }
  return direction === 'positive' ? 'text-red-500' : 'text-blue-600';
};
