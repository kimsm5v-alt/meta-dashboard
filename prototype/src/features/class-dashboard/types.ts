/**
 * 결과보기 Feature - 타입 정의
 *
 * @see prototype/docs/features/EXAM_COUNSELING.md - 화면 3, 4번
 */

// ============================================================
// LPA 유형
// ============================================================

/** 초등 LPA 유형 */
export type ElementaryLPAType = '자원소진형' | '안전 균형형' | '몰입자원 풍부형';

/** 중등 LPA 유형 */
export type MiddleLPAType = '냉소적 무기력형' | '정서조절 취약형' | '자기주도 몰입형';

/** LPA 유형 (통합) */
export type LPAType = ElementaryLPAType | MiddleLPAType;

/** LPA 유형 색상 */
export const LPA_TYPE_COLORS: Record<LPAType, string> = {
  // 초등
  '자원소진형': '#EF4444',
  '안전 균형형': '#F59E0B',
  '몰입자원 풍부형': '#10B981',
  // 중등
  '냉소적 무기력형': '#EF4444',
  '정서조절 취약형': '#F59E0B',
  '자기주도 몰입형': '#10B981',
};

// ============================================================
// 반 전체 결과 (화면 3번)
// ============================================================

/** LPA 유형 분포 */
export interface LPADistribution {
  type: LPAType;
  count: number;
  percentage: number;
  color: string;
}

/** 요인별 평균 점수 */
export interface FactorAverage {
  name: string;
  category: string;
  avgScore: number;
  level: '매우낮음' | '낮음' | '보통' | '높음' | '매우높음';
}

/** 위험군 학생 */
export interface RiskStudent {
  id: string;
  number: number;
  name: string;
  reason: string;
  type: 'attention' | 'reliability';
}

/** 반 결과 요약 */
export interface ClassResultSummary {
  className: string;
  round: 1 | 2;
  assessedCount: number;
  totalCount: number;
  avgTScore: number;
  lpaDistribution: LPADistribution[];
  factorAverages: FactorAverage[];
  riskStudents: RiskStudent[];
  strengths: string[];
  weaknesses: string[];
}

// ============================================================
// 학생 개인 결과 (화면 4번)
// ============================================================

/** 요인 점수 */
export interface FactorScore {
  index: number;
  name: string;
  category: string;
  score: number;
  level: '매우낮음' | '낮음' | '보통' | '높음' | '매우높음';
  isPositive: boolean;
}

/** 학생 결과 상세 */
export interface StudentResult {
  id: string;
  number: number;
  name: string;
  lpaType: LPAType;
  assessedAt: Date;
  round: 1 | 2;
  tScores: number[];
  avgTScore: number;
  factorScores: FactorScore[];
  typeDescription: string;
  typeCharacteristics: string[];
  aiSummary?: string;
  strengths: FactorScore[];
  weaknesses: FactorScore[];
  needsAttention: boolean;
  reliabilityWarnings: string[];
}

// ============================================================
// 뷰 상태
// ============================================================

/** 반 전체 vs 학생 선택 */
export type ResultViewMode = 'class' | 'student';
