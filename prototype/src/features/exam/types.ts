/**
 * 학생용 검사 응시 타입 정의
 *
 * API 공통 타입은 @/shared/services/apiClient 참조
 */

// ============================================================
// 검사 응시 상태
// ============================================================

/** 검사 단계 */
export type ExamStep = 'auth' | 'guest-entry' | 'number' | 'resume-choice' | 'guide' | 'questions' | 'complete';

/** 검사 응시 상태 */
export interface ExamState {
  step: ExamStep;
  studentNumber: number | null;
  dgnssResultId: number | null;
  currentPage: number;
  answers: Record<number, string>;
  totalQuestions: number;
  omrIdx: number | null;
  isSubmitting: boolean;
  questions: ExamQuestion[];
  totalPages: number;
  answeredCount: number;
}

/** 검사 정보 */
export interface ExamInfo {
  code: string;
  name: string;
  grade: number;
  classNumber: number;
  round: number;
}

// ============================================================
// 검사 문항
// ============================================================

/** 검사 문항 */
export interface ExamQuestion {
  NO: number;
  QESITM_NM: string;
  answer: string;
  fullCount: number;
}

// ============================================================
// API 응답 타입 (도메인 특화)
// ============================================================

/** 문항 조회 API 응답 데이터 */
export interface QuestionsResponseData {
  omrIdx: number;
  dgnssQuesList: ExamQuestion[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
  stAnsCnt: number;
}

/** 제출 API 응답 데이터 */
export interface SubmitResponseData {
  submit: boolean;
}

/** 학생 검사 목록 항목 */
export interface StudentExamItem {
  dgnssId: number;
  dgnssResultId: number;
  paperIdx: string;
  ordNo: number;
  /** 검사 진행 상태 */
  dgnssAt: 'Y' | 'N';
  /** 제출 여부 */
  submAt: 'Y' | 'N';
  /** 제출일 */
  submDt: string | null;
  /** 결과 생성 완료 여부 */
  eakAt: 'Y' | 'N';
}

/** 학생 검사 목록 API 응답 */
export type StudentExamListResponse = StudentExamItem[];
