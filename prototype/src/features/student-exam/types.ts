/**
 * 학생용 검사 목록 타입 정의
 */

/** 검사 상태 */
export type ExamStatus = 'waiting' | 'in_progress' | 'completed' | 'result_ready';

/** 학생 검사 목록 아이템 (UI용) */
export interface StudentExamListItem {
  dgnssId: number;
  dgnssResultId: number;
  /** 검사 회차 (1차, 2차...) */
  ordNo: number;
  /** 검사명 */
  name: string;
  /** 상태 */
  status: ExamStatus;
  /** 진행률 (0~100) */
  progress: number;
  /** 응답 완료 문항 수 */
  answeredCount: number;
  /** 총 문항 수 */
  totalQuestions: number;
  /** 제출일 */
  submittedAt: string | null;
  /** 결과 조회 가능 여부 */
  hasResult: boolean;
}

/** API 응답 → UI 타입 변환 헬퍼 */
export function mapExamStatus(
  dgnssAt: 'Y' | 'N',
  submAt: 'Y' | 'N',
  eakAt: 'Y' | 'N'
): ExamStatus {
  if (submAt === 'Y' && eakAt === 'Y') return 'result_ready';
  if (submAt === 'Y') return 'completed';
  if (dgnssAt === 'Y') return 'in_progress';
  return 'waiting';
}
