/**
 * 코칭 관련 타입 정의
 */

/** LPA 유형 */
export type LPAType =
  | '자원소진형'
  | '안전 균형형'
  | '몰입자원 풍부형'
  | '냉소적 무기력형'
  | '정서조절 취약형'
  | '자기주도 몰입형';

/** LPA 유형별 색상 */
export const LPA_TYPE_COLORS: Record<LPAType, string> = {
  '자원소진형': '#EF4444',
  '안전 균형형': '#10B981',
  '몰입자원 풍부형': '#3B82F6',
  '냉소적 무기력형': '#EF4444',
  '정서조절 취약형': '#F59E0B',
  '자기주도 몰입형': '#3B82F6',
};

/** SEL(사회정서학습) 콘텐츠 카테고리 */
export type SELCategory =
  | 'self-awareness'      // 자기인식
  | 'self-management'     // 자기관리
  | 'social-awareness'    // 사회적 인식
  | 'relationship'        // 관계기술
  | 'decision-making';    // 책임있는 의사결정

export const SEL_CATEGORY_LABELS: Record<SELCategory, string> = {
  'self-awareness': '자기인식',
  'self-management': '자기관리',
  'social-awareness': '사회적 인식',
  'relationship': '관계기술',
  'decision-making': '책임있는 의사결정',
};

/** SEL 콘텐츠 아이템 */
export interface SELContent {
  id: string;
  title: string;
  category: SELCategory;
  description: string;
  duration: number; // 분
  targetLPATypes: LPAType[];
  tags: string[];
}

/** 반 특성 분석 */
export interface ClassCharacteristics {
  totalStudents: number;
  lpaDistribution: Record<LPAType, number>;
  dominantType: LPAType;
  strengths: string[];
  challenges: string[];
  recommendedFocus: string[];
}

/** 반 운영 전략 */
export interface ClassStrategy {
  id: string;
  title: string;
  description: string;
  targetArea: string;
  activities: string[];
  expectedOutcomes: string[];
}

/** 학생별 코칭 전략 */
export interface StudentCoachingStrategy {
  studentId: string;
  studentName: string;
  studentNumber: number;
  lpaType: LPAType;
  keyStrengths: string[];
  growthAreas: string[];
  teacherGuidelines: string[];
  studentGuidelines: string[];
  parentGuidelines: string[];
}

/** 코칭 진행 현황 */
export interface CoachingProgress {
  studentId: string;
  studentName: string;
  studentNumber: number;
  lpaType: LPAType;
  startDate: Date;
  currentPhase: string;
  completedActivities: number;
  totalActivities: number;
  lastActivityDate: Date;
  nextActivityDue: Date;
}
