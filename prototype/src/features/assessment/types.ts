/**
 * 검사 Feature - 타입 정의
 *
 * @see prototype/docs/features/EXAM_COUNSELING.md
 */

// ============================================================
// 검사 상태
// ============================================================

/** 검사 진행 상태 */
export type ExamStatus = 'not_started' | 'in_progress' | 'completed';

/** 검사 상태 라벨 */
export const EXAM_STATUS_LABELS: Record<ExamStatus, string> = {
  not_started: '미시작',
  in_progress: '진행중',
  completed: '완료',
};

/** 검사 상태 스타일 */
export const EXAM_STATUS_STYLES: Record<ExamStatus, { bg: string; text: string }> = {
  not_started: { bg: 'bg-gray-100', text: 'text-gray-600' },
  in_progress: { bg: 'bg-amber-100', text: 'text-amber-700' },
  completed: { bg: 'bg-green-100', text: 'text-green-700' },
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
  /** 응시 완료 학생 수 */
  submittedCount: number;
  /** 전체 학생 수 */
  totalCount: number;
  /** 응시율 (0-100) */
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
  /** 미응시 학생 수 */
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
  /** 응시 완료 여부 */
  submitted: boolean;
  /** 응시 일시 */
  submittedAt?: Date;
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
