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
export const TYPE_ORDER_ELEMENTARY = ['몰입자원 풍부형', '안전 균형형', '자원소진형', '미실시'] as const;
// 중등 유형 순서
export const TYPE_ORDER_MIDDLE = ['자기주도 몰입형', '정서조절 취약형', '냉소적 무기력형', '미실시'] as const;
// 기본값 (초등)
export const TYPE_ORDER = TYPE_ORDER_ELEMENTARY;

export const TYPE_COLORS: Record<string, string> = {
  '미실시': '#E5E7EB',
  // 초등 유형 (JSON 원본 기준)
  '자원소진형': '#E74C3C',        // red
  '안전 균형형': '#3498DB',       // blue
  '몰입자원 풍부형': '#2ECC71',   // green
  // 중등 유형 (JSON 원본 기준)
  '냉소적 무기력형': '#E74C3C',   // red
  '정서조절 취약형': '#F39C12',   // orange
  '자기주도 몰입형': '#2ECC71',   // green
};

export const TYPE_GRADIENTS: Record<string, { start: string; end: string }> = {
  '미실시': { start: '#E5E7EB', end: '#D1D5DB' },
  // 초등 유형 (JSON 원본 기준)
  '자원소진형': { start: '#F1948A', end: '#E74C3C' },        // red gradient
  '안전 균형형': { start: '#85C1E9', end: '#3498DB' },       // blue gradient
  '몰입자원 풍부형': { start: '#82E0AA', end: '#2ECC71' },   // green gradient
  // 중등 유형 (JSON 원본 기준)
  '냉소적 무기력형': { start: '#F1948A', end: '#E74C3C' },   // red gradient
  '정서조절 취약형': { start: '#F8C471', end: '#F39C12' },   // orange gradient
  '자기주도 몰입형': { start: '#82E0AA', end: '#2ECC71' },   // green gradient
};

// 유형명 약칭 (테이블 표시용)
const TYPE_ABBREVIATIONS: Record<string, string> = {
  '자원소진형': '소진',
  '안전 균형형': '균형',
  '몰입자원 풍부형': '몰입',
  '냉소적 무기력형': '무기력',
  '정서조절 취약형': '정서취약',
  '자기주도 몰입형': '자기주도',
};

export const abbreviateType = (type: string): string =>
  TYPE_ABBREVIATIONS[type] || type;

// 유형 점수 (변화 판단용)
export const TYPE_RANK: Record<string, number> = {
  '미실시': 0,
  // 초등 유형
  '자원소진형': 1,
  '안전 균형형': 2,
  '몰입자원 풍부형': 3,
  // 중등 유형 (동일한 순위 체계)
  '냉소적 무기력형': 1,
  '정서조절 취약형': 2,
  '자기주도 몰입형': 3,
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
