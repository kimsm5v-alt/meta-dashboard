/**
 * 검사 Feature - 타입 정의
 *
 * @see prototype/docs/features/EXAM_COUNSELING.md
 */

import type { StudentType, SchoolLevel } from '@/shared/types';

// ============================================================
// 검사 상태
// ============================================================

/** 검사 진행 상태 (반 전체) */
export type ExamStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled';

/** 검사 상태 라벨 */
export const EXAM_STATUS_LABELS: Record<ExamStatus, string> = {
  not_started: '미시작',
  in_progress: '진행중',
  completed: '완료',
  cancelled: '취소됨',
};

/** 검사 상태 스타일 */
export const EXAM_STATUS_STYLES: Record<ExamStatus, { bg: string; text: string }> = {
  not_started: { bg: 'bg-gray-100', text: 'text-gray-600' },
  in_progress: { bg: 'bg-amber-100', text: 'text-amber-700' },
  completed: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
};

/**
 * 학생 개별 응시 상태 (세분화된 5단계)
 *
 * 상태 결정 조건: dgnssAt, eakAt, submAt 3개 플래그 조합
 * - dgnssAt: 검사 진행 여부 (교사가 제어)
 * - eakAt: 학생 응시 시작 여부
 * - submAt: 학생 제출 여부
 */
export type StudentExamDetailedStatus =
  | 'waiting'        // 시작 전 (Y, N, N) - 응시 가능
  | 'in_progress'    // 응시 중 (Y, Y, N) - 이어하기/새로하기
  | 'completed'      // 제출 완료 (Y, Y, Y) - 결과 대기중
  | 'result_ready'   // 검사 종료 (N, Y, Y) - 결과 보기 가능
  | 'not_submitted'; // 미제출 (N, N, N) - 검사 종료됨

/** 학생 상태 라벨 (학생에게 보이는 텍스트) */
export const STUDENT_STATUS_LABELS: Record<StudentExamDetailedStatus, string> = {
  waiting: '응시 가능',
  in_progress: '이어하기',
  completed: '결과 대기중',
  result_ready: '결과 보기 가능',
  not_submitted: '검사 종료됨',
};

/** 학생 상태 UI 표시 (교사 화면용 - 3분류) */
export const getStudentDisplayStatus = (status: StudentExamDetailedStatus) => {
  switch (status) {
    case 'completed':
    case 'result_ready':
      return { label: '제출 완료', color: 'blue', icon: 'check' } as const;
    case 'in_progress':
      return { label: '응시 중', color: 'yellow', icon: 'clock' } as const;
    case 'not_submitted':
      return { label: '미제출', color: 'orange', icon: 'alert' } as const;
    case 'waiting':
    default:
      return { label: '미제출', color: 'gray', icon: null } as const;
  }
};

// ============================================================
// 검사 현황 테이블 (전체 현황)
// ============================================================

/** 검사 현황 행 (테이블용) */
export interface ExamOverviewRow {
  id: string;
  /** 반 이름 (예: 2-3반) */
  className: string;
  /** 검사지 이름 */
  examName: string;
  /** 회차 (1 또는 2) */
  round: 1 | 2;
  /** 제출 완료 학생 수 */
  submittedCount: number;
  /** 전체 학생 수 */
  totalCount: number;
  /** 제출률 (0-100) */
  submissionRate: number;
  /** 검사 상태 */
  status: ExamStatus;
  /** 그룹(반) ID */
  groupId: string;
}

/** 전체 현황 요약 카드 데이터 */
export interface ExamOverviewSummary {
  /** 관리 중인 반 수 */
  totalClasses: number;
  /** 진행 중인 검사 수 */
  inProgressExams: number;
  /** 결과 확인 가능한 검사 수 */
  completedExams: number;
  /** 미제출 학생 수 */
  pendingStudents: number;
}

// ============================================================
// 검사 관리 (반 전체)
// ============================================================

/** 학생 응시 현황 */
export interface StudentExamStatus {
  id: string;
  number: number;
  name: string;
  /** 제출 완료 여부 (하위 호환성 유지) */
  submitted: boolean;
  /** 제출 일시 */
  submittedAt?: Date;
  /** 세분화된 상태 (옵션) */
  detailedStatus?: StudentExamDetailedStatus;
}

/** 반 검사 관리 데이터 */
export interface ClassExamManagement {
  groupId: string;
  className: string;
  /** 현재 선택된 회차 */
  currentRound: 1 | 2;
  /** 회차별 상태 */
  rounds: {
    round: 1 | 2;
    status: ExamStatus;
    submittedCount: number;
    totalCount: number;
    startedAt?: Date;
    endedAt?: Date;
  }[];
  /** 학생 목록 (현재 회차 기준) */
  students: StudentExamStatus[];
}

// ============================================================
// 뷰 상태
// ============================================================

/** 전체 현황 vs 반 선택 */
export type AssessmentViewMode = 'overview' | 'class';

/** 서브탭 (반 선택 시) */
export type AssessmentSubTab = 'management' | 'result' | 'tracking';

export const ASSESSMENT_SUBTAB_LABELS: Record<AssessmentSubTab, string> = {
  management: '검사관리',
  result: '결과보기',
  tracking: '변화추적',
};

// ============================================================
// 변화추적 (화면 6번)
// ============================================================

/** 학생 변화 상태 */
export type ChangeDirection = 'up' | 'same' | 'down';

// ============================================================
// 학습 현황 (Q120~Q124 설문 응답)
// ============================================================

/**
 * 120. 내 학업 성적은 어느 정도인지 체크해 주세요.
 * ① 매우 낮음 ② 낮음 ③ 보통 ④ 높음 ⑤ 매우 높음
 */
export type AcademicAchievement = 'very-low' | 'low' | 'mid' | 'high' | 'very-high';

/**
 * 121. 나의 성적에 어느 정도 만족하는지 체크해 주세요.
 * ① 매우 낮음 ② 낮음 ③ 보통 ④ 높음 ⑤ 매우 높음
 */
export type GradeSatisfaction = 'very-low' | 'low' | 'mid' | 'high' | 'very-high';

/**
 * 122. 다음 중 내가 공부하는 가장 중요한 이유 1가지를 체크해 주세요.
 * ① 공부에 흥미를 느껴서 ② 나의 미래를 위해서 ③ 대학을 가기 위해서
 * ④ 주변 사람들(부모님, 선생님)의 기대 때문에 ⑤ 솔직히 왜 하는지 모르겠다
 */
export type LearningMotivation = 'interest' | 'future' | 'college' | 'expectations' | 'unknown';

/**
 * 123. 학교 다닐 때, 혼자 공부하는 시간(온라인 학습 제외)이 하루 평균 어느 정도인지 체크해 보세요.
 * ① 전혀 안함 ② 1시간 미만 ③ 1시간 이상~2시간 미만 ④ 2시간 이상~3시간 미만 ⑤ 3시간 이상
 */
export type SelfStudyTime = 'none' | 'under1h' | '1-2h' | '2-3h' | 'over3h';

/**
 * 124. 공부와 관련된 고민이 있을 때, 가장 많이 상담하는 사람 1명을 체크해 주세요.
 * ① 친구 ② 선생님 ③ 가족 ④ 상담 전문가 ⑤ 기타
 */
export type LearningCounselor = 'friend' | 'teacher' | 'family' | 'counselor' | 'etc';

/** 학습 현황 */
export interface LearningStatus {
  academicAchievement: AcademicAchievement;
  gradeSatisfaction: GradeSatisfaction;
  learningMotivation: LearningMotivation;
  selfStudyTime: SelfStudyTime;
  learningCounselor: LearningCounselor;
}

/** 학습 현황 라벨 */
export const LEARNING_STATUS_LABELS = {
  // 120. 내 학업 성적은 어느 정도인지 체크해 주세요.
  academicAchievement: {
    'very-low': '매우 낮음',
    'low': '낮음',
    'mid': '보통',
    'high': '높음',
    'very-high': '매우 높음',
  },
  // 121. 나의 성적에 어느 정도 만족하는지 체크해 주세요.
  gradeSatisfaction: {
    'very-low': '매우 낮음',
    'low': '낮음',
    'mid': '보통',
    'high': '높음',
    'very-high': '매우 높음',
  },
  // 122. 다음 중 내가 공부하는 가장 중요한 이유 1가지를 체크해 주세요.
  learningMotivation: {
    'interest': '공부에 흥미를 느껴서',
    'future': '나의 미래를 위해서',
    'college': '대학을 가기 위해서',
    'expectations': '주변 사람들의 기대 때문에',
    'unknown': '솔직히 왜 하는지 모르겠다',
  },
  // 123. 학교 다닐 때, 혼자 공부하는 시간(온라인 학습 제외)이 하루 평균 어느 정도인지 체크해 보세요.
  selfStudyTime: {
    'none': '전혀 안함',
    'under1h': '1시간 미만',
    '1-2h': '1시간 이상~2시간 미만',
    '2-3h': '2시간 이상~3시간 미만',
    'over3h': '3시간 이상',
  },
  // 124. 공부와 관련된 고민이 있을 때, 가장 많이 상담하는 사람 1명을 체크해 주세요.
  learningCounselor: {
    'friend': '친구',
    'teacher': '선생님',
    'family': '가족',
    'counselor': '상담 전문가',
    'etc': '기타',
  },
} as const;

/** 학생 변화 추적 데이터 */
export interface StudentChangeData {
  id: string;
  number: number;
  name: string;
  /** 1차 검사 점수 (평균 T점수) */
  round1Score: number | null;
  /** 2차 검사 점수 (평균 T점수) */
  round2Score: number | null;
  /** 변화량 */
  change: number | null;
  /** 변화 방향 */
  changeDirection: ChangeDirection | null;
  /** 1차 유형 */
  round1Type: string | null;
  /** 2차 유형 */
  round2Type: string | null;
  /** 유형 변화 여부 */
  typeChanged: boolean;
  /** 1차 요인별 T점수 (38개) */
  round1TScores: number[] | null;
  /** 2차 요인별 T점수 (38개) */
  round2TScores: number[] | null;
  /** 1차 유형 확률 (LPA) */
  round1TypeProbabilities: Record<string, number> | null;
  /** 2차 유형 확률 (LPA) */
  round2TypeProbabilities: Record<string, number> | null;
  /** 1차 학습 현황 */
  round1LearningStatus: LearningStatus | null;
  /** 2차 학습 현황 */
  round2LearningStatus: LearningStatus | null;
}

/** 반 변화 요약 */
export interface ClassChangeSummary {
  /** 반 ID */
  classId: string;
  /** 반 이름 */
  className: string;
  /** 1차 평균 */
  round1Avg: number;
  /** 2차 평균 */
  round2Avg: number;
  /** 평균 변화량 */
  avgChange: number;
  /** 상승 학생 수 */
  upCount: number;
  /** 유지 학생 수 */
  sameCount: number;
  /** 하락 학생 수 */
  downCount: number;
  /** 전체 학생 수 */
  totalCount: number;
  /** 2차 응시 학생 수 */
  round2Count: number;
}

/** 개입 유형 */
export type InterventionType = 'counseling' | 'lesson' | 'class_coaching' | 'individual_coaching';

/** 개입 유형 라벨 */
export const INTERVENTION_TYPE_LABELS: Record<InterventionType, string> = {
  counseling: '상담',
  lesson: '수업',
  class_coaching: '학급 코칭',
  individual_coaching: '개별 코칭',
};

/** 코칭 유형 설명 */
export const COACHING_TYPE_DESCRIPTIONS: Record<'class_coaching' | 'individual_coaching', string> = {
  class_coaching: '학급 대표 전략 코칭',
  individual_coaching: '유형 대비 강점 확인과 인정, 맞춤 코칭 제안',
};

/** 개입 이력 항목 */
export interface InterventionHistory {
  id: string;
  date?: string;
  type: InterventionType;
  title: string;
  description?: string;
}

// ============================================================
// 결과보기 - 학생 결과 (화면 5번)
// ============================================================

/** 학생 검사 결과 */
export interface StudentExamResult {
  id: string;
  number: number;
  name: string;
  /** 학교급 */
  schoolLevel: SchoolLevel;
  /** LPA 유형 (현재 회차 기준) */
  predictedType: StudentType;
  /** 1차 검사 LPA 유형 (미응시 시 undefined) */
  lpaType1?: StudentType;
  /** 2차 검사 LPA 유형 (미응시 시 undefined) */
  lpaType2?: StudentType;
  /** 유형 확률 */
  typeProbabilities: Record<string, number>;
  /** 38개 요인 T점수 */
  tScores: number[];
  /** 평균 T점수 */
  avgTScore: number;
  /** 관심 필요 여부 */
  needsAttention: boolean;
  /** 관심 필요 사유 */
  attentionReason?: string;
  /** 신뢰도 주의 여부 (응답 일관성 부족 등) */
  hasReliabilityWarning: boolean;
  /** 신뢰도 주의 사유 */
  reliabilityWarningReason?: string;
  /** 검사일 */
  assessedAt?: Date;
  /** 회차 */
  round: 0 | 1 | 2;
  /** 1차 결과 (비교용) */
  prevResult?: {
    predictedType: StudentType;
    typeProbabilities: Record<string, number>;
    tScores: number[];
    avgTScore: number;
  };
}
