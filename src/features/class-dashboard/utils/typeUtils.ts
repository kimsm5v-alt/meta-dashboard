import type { Student } from '@/shared/types';
import { getTypeDeviations } from '@/shared/utils/lpaClassifier';
import { FACTOR_DEFINITIONS } from '@/shared/data/factors';

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

// 초등 유형 순서
export const TYPE_ORDER_ELEMENTARY = ['몰입자원풍부형', '안전균형형', '자원소진형', '미실시'] as const;
// 중등 유형 순서
export const TYPE_ORDER_MIDDLE = ['자기주도몰입형', '정서조절취약형', '무기력형', '미실시'] as const;
// 기본값 (초등)
export const TYPE_ORDER = TYPE_ORDER_ELEMENTARY;

export const TYPE_COLORS: Record<string, string> = {
  '미실시': '#E5E7EB',
  // 초등 유형
  '자원소진형': '#F97316',
  '안전균형형': '#14B8A6',
  '몰입자원풍부형': '#3B82F6',
  // 중등 유형 (초등과 동일한 색상 체계)
  '무기력형': '#F97316',        // orange (자원소진형과 동일)
  '정서조절취약형': '#14B8A6',   // teal (안전균형형과 동일)
  '자기주도몰입형': '#3B82F6',   // blue (몰입자원풍부형과 동일)
};

export const TYPE_GRADIENTS: Record<string, { start: string; end: string }> = {
  '미실시': { start: '#E5E7EB', end: '#D1D5DB' },
  // 초등 유형
  '자원소진형': { start: '#FDBA74', end: '#F97316' },
  '안전균형형': { start: '#5EEAD4', end: '#14B8A6' },
  '몰입자원풍부형': { start: '#93C5FD', end: '#3B82F6' },
  // 중등 유형
  '무기력형': { start: '#FDBA74', end: '#F97316' },
  '정서조절취약형': { start: '#5EEAD4', end: '#14B8A6' },
  '자기주도몰입형': { start: '#93C5FD', end: '#3B82F6' },
};

// 유형명 약칭 (테이블 표시용)
const TYPE_ABBREVIATIONS: Record<string, string> = {
  '자원소진형': '소진',
  '안전균형형': '균형',
  '몰입자원풍부형': '몰입',
  '무기력형': '무기력',
  '정서조절취약형': '정서취약',
  '자기주도몰입형': '자기주도',
};

export const abbreviateType = (type: string): string =>
  TYPE_ABBREVIATIONS[type] || type;

// 유형 점수 (변화 판단용)
export const TYPE_RANK: Record<string, number> = {
  '미실시': 0,
  // 초등 유형
  '자원소진형': 1,
  '안전균형형': 2,
  '몰입자원풍부형': 3,
  // 중등 유형 (동일한 순위 체계)
  '무기력형': 1,
  '정서조절취약형': 2,
  '자기주도몰입형': 3,
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
): 'change' | 'maintain' | 'notAssessed' => {
  if (to === '미실시') return 'notAssessed';
  if (from === to) return 'maintain';
  return 'change';
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
