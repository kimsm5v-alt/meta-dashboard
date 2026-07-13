/**
 * 상담·코칭 Feature - 타입 정의
 *
 * @see prototype/docs/features/EXAM_COUNSELING.md - 화면 7, 8, 9번
 */

// ============================================================
// 상담 관련 타입
// ============================================================

/** 상담 유형 */
export type CounselingType = 'regular' | 'urgent' | 'follow-up' | 'initial';

export const COUNSELING_TYPE_LABELS: Record<CounselingType, string> = {
  regular: '정기상담',
  urgent: '긴급상담',
  'follow-up': '후속상담',
  initial: '초기상담',
};

/** 상담 영역 */
export type CounselingArea = 'academic' | 'career' | 'peer' | 'family' | 'emotion' | 'behavior' | 'health' | 'other';

export const COUNSELING_AREA_LABELS: Record<CounselingArea, string> = {
  academic: '학업',
  career: '진로',
  peer: '교우관계',
  family: '가정',
  emotion: '정서·심리',
  behavior: '행동',
  health: '건강',
  other: '기타',
};

/** 상담 상태 */
export type CounselingStatus = 'scheduled' | 'completed' | 'cancelled';

export const COUNSELING_STATUS_LABELS: Record<CounselingStatus, string> = {
  scheduled: '예정',
  completed: '완료',
  cancelled: '취소',
};

// ============================================================
// 상담 기록
// ============================================================

/** 상담 기록 */
export interface CounselingRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: number;
  classId: string;
  className: string;
  scheduledAt: Date;
  duration?: number; // 분
  type: CounselingType;
  area: CounselingArea;
  status: CounselingStatus;
  reason?: string;
  summary?: string;
  nextSteps?: string;
  createdAt: Date;
}

// ============================================================
// 전체 현황 (화면 7번)
// ============================================================

/** 전체 현황 요약 */
export interface CounselingOverviewSummary {
  /** 상담 대상 학생 수 (관심 필요) */
  targetStudentCount: number;
  /** 코칭 진행중 학생 수 */
  activeCoachingCount: number;
  /** 이번 주 예정 상담 수 */
  scheduledThisWeek: number;
  /** 이번 달 완료 상담 수 */
  completedThisMonth: number;
}

// ============================================================
// 학생 상담 - 반 전체 (화면 7번)
// ============================================================

/** 상담 기준 필터 */
export type CounselingFilter = 'all' | 'priority' | 'reliability' | 'strength';

export const COUNSELING_FILTER_LABELS: Record<CounselingFilter, string> = {
  all: '전체 학생',
  priority: '상담 우선',
  reliability: '응답 신뢰도 확인 필요',
  strength: '강점 활용 가능',
};

export const COUNSELING_FILTER_DESCRIPTIONS: Record<CounselingFilter, string> = {
  all: '우리 반 전체 학생',
  priority: '먼저 대화로 맥락 확인이 필요한 학생',
  reliability: '검사 결과를 단정하기 전 응답 상황 확인이 필요한 학생',
  strength: '강점 언어로 상담을 시작하기 좋은 학생',
};

/** 상담 이유 태그 */
export type CounselingReasonTag = 'burden' | 'obstacle' | 'reliability' | 'strength';

export const COUNSELING_REASON_TAG_LABELS: Record<CounselingReasonTag, string> = {
  burden: '공부부담 신호',
  obstacle: '학습 방해 요인',
  reliability: '응답 신뢰도 확인 필요',
  strength: '강점 활용',
};

export const COUNSELING_REASON_TAG_COLORS: Record<CounselingReasonTag, { bg: string; text: string; border: string }> = {
  burden: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  obstacle: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  reliability: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  strength: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
};

/** 학생 상담 목록 아이템 (반 전체 뷰용) */
export interface CounselingStudentItem {
  id: string;
  number: number;
  name: string;
  lpaType: string;
  avgTScore: number;
  tags: CounselingReasonTag[];
  lastCounselingAt?: Date;
  round: number;
  assessedAt?: Date;
}

/** 우선순위 추천 카테고리 (레거시 호환) */
export type PriorityCategory = 'attention' | 'emotion' | 'reliability';

export const PRIORITY_CATEGORY_LABELS: Record<PriorityCategory, string> = {
  attention: '상담 우선',
  emotion: '감정활용 추천',
  reliability: '신뢰도 주의',
};

/** 우선순위 추천 학생 */
export interface PriorityStudent {
  id: string;
  number: number;
  name: string;
  category: PriorityCategory;
  reason: string;
  lpaType?: string;
  lastCounselingAt?: Date;
}

/** 상담 통계 */
export interface CounselingStats {
  totalCount: number;
  byType: Record<CounselingType, number>;
  byArea: Record<CounselingArea, number>;
  avgDuration: number;
}

// ============================================================
// 학생 상담 - 학생 선택 (화면 9번)
// ============================================================

/** AI 추천 질문 */
export interface RecommendedQuestion {
  id: string;
  category: string;
  question: string;
  purpose: string;
}

/** 상담 메모 */
export interface CounselingMemo {
  id: string;
  studentId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/** 학생 상담 요약 */
export interface StudentCounselingSummary {
  studentId: string;
  studentName: string;
  studentNumber: number;
  lpaType: string;
  needsAttention: boolean;
  attentionReason?: string;
  avgTScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendedQuestions: RecommendedQuestion[];
  memos: CounselingMemo[];
  records: CounselingRecord[];
  /** 총 상담 횟수 */
  totalCounselingCount?: number;
  /** 이번 학기 상담 횟수 */
  thisTermCount?: number;
  /** 마지막 상담일 */
  lastCounselingDate?: Date | null;
  /** 주요 상담 영역 */
  mainCounselingArea?: string;
  /** 상담 이유 태그 */
  reasonTags?: CounselingReasonTag[];
  /** 검사 회차 */
  round?: number;
  /** 응시일 */
  assessedAt?: Date;
  /** AI 분석 총평 */
  aiSummary?: string;
  /** 핵심 키워드 */
  keywords?: string[];
  /** 응답 신뢰도 */
  reliability?: {
    consistencyIndex: number;
    nonResponseRate: number;
    warnings: string[];
  };
  /** 학습 이력 (1차/2차 비교) */
  history?: {
    round1TScore?: number;
    round2TScore?: number;
    change?: 'up' | 'down' | 'same';
  };
  /** 강점 요인 Top 3 상세 */
  strengthDetails?: Array<{
    factorName: string;
    parentCategory: string;
    avgT: number;
    definition: string;
  }>;
  /** 보완점 요인 Top 3 상세 */
  weaknessDetails?: Array<{
    factorName: string;
    parentCategory: string;
    avgT: number;
    definition: string;
  }>;
  /** 개인학습현황 (120~124번 문항) */
  learningStatus?: LearningStatus;
}

// ============================================================
// 개인학습현황 (문항 120~124번)
// ============================================================

/** 학업성취도 (120번) - 자신의 성적 수준 */
export type AcademicAchievement = 'top10' | 'top30' | 'middle' | 'bottom30' | 'bottom10';

export const ACADEMIC_ACHIEVEMENT_LABELS: Record<AcademicAchievement, string> = {
  top10: '상위 10% 이내',
  top30: '상위 30% 이내',
  middle: '중위권 (30~70%)',
  bottom30: '하위 30% 이내',
  bottom10: '하위 10% 이내',
};

/** 성적만족도 (121번) - 현재 성적 만족 정도 */
export type GradeSatisfaction = 'very_satisfied' | 'satisfied' | 'neutral' | 'dissatisfied' | 'very_dissatisfied';

export const GRADE_SATISFACTION_LABELS: Record<GradeSatisfaction, string> = {
  very_satisfied: '매우 만족',
  satisfied: '만족',
  neutral: '보통',
  dissatisfied: '불만족',
  very_dissatisfied: '매우 불만족',
};

/** 학습동기 (122번) - 공부하는 주된 이유 */
export type LearningMotivation = 'interest' | 'future' | 'parents' | 'peers' | 'none';

export const LEARNING_MOTIVATION_LABELS: Record<LearningMotivation, string> = {
  interest: '배움 자체가 즐거워서',
  future: '미래 진로/목표를 위해',
  parents: '부모님 기대에 부응하려고',
  peers: '친구들과 비교 때문에',
  none: '특별한 동기 없음',
};

/** 혼공시간 (123번) - 하루 평균 혼자 공부 시간 */
export type SelfStudyTime = 'none' | 'under1h' | '1to2h' | '2to3h' | 'over3h';

export const SELF_STUDY_TIME_LABELS: Record<SelfStudyTime, string> = {
  none: '거의 안 함',
  under1h: '1시간 미만',
  '1to2h': '1~2시간',
  '2to3h': '2~3시간',
  over3h: '3시간 이상',
};

/** 학습고민상담사 (124번) - 학습 고민을 주로 상담하는 대상 */
export type LearningCounselor = 'parents' | 'teacher' | 'friends' | 'self' | 'none';

export const LEARNING_COUNSELOR_LABELS: Record<LearningCounselor, string> = {
  parents: '부모님',
  teacher: '선생님',
  friends: '친구',
  self: '혼자 해결',
  none: '상담 안 함',
};

/** 개인학습현황 전체 */
export interface LearningStatus {
  /** 학업성취도 (120번) */
  academicAchievement: AcademicAchievement;
  /** 성적만족도 (121번) */
  gradeSatisfaction: GradeSatisfaction;
  /** 학습동기 (122번) */
  learningMotivation: LearningMotivation;
  /** 혼공시간 (123번) */
  selfStudyTime: SelfStudyTime;
  /** 학습고민상담사 (124번) */
  learningCounselor: LearningCounselor;
}
