export type ExamStep = 'number' | 'guide' | 'questions' | 'complete';

export interface ExamQuestion {
  NO: number;
  QESITM_NM: string;
  answer: string;
  fullCount: number;
}

export interface ExamState {
  step: ExamStep;
  studentNumber: number | null;
  dgnssResultId: number | null;  // 검사 세션 ID (검사 시작/제출 시 사용)
  currentPage: number;
  answers: Record<number, string>;
  totalQuestions: number;
  omrIdx: number | null;  // 답변 저장용 OMR ID
  isSubmitting: boolean;
  questions: ExamQuestion[];
  totalPages: number;
  answeredCount: number;
}

export interface ExamInfo {
  code: string;
  name: string;
  grade: number;
  classNumber: number;
  round: number;
}

// ============================================================
// API 응답 타입 정의
// ============================================================

/** 공통 API 응답 래퍼 */
export interface ExamAPIResponse<T> {
  success: boolean;
  resultCode: number;
  resultMessage: string;
  resultData: T;
  paramData?: Record<string, string>;
  sTime: string;
  eTime: string;
  hash: string;
  currentTime: string;
}

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
