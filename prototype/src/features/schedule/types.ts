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
// 학생 상담 - 반 전체 (화면 8번)
// ============================================================

/** 우선순위 추천 카테고리 */
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
}
