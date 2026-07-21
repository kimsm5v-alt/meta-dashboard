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
