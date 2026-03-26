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
  eakAt: number
): ExamStatus {
  // eakAt 상태: 1:응시전, 2:응시중, 3:제출완료, 4:채점중, 5:채점완료

  // 채점 완료 (결과 확인 가능)
  if (eakAt === 5) return 'result_ready';

  // 제출 완료 또는 채점 중 (결과 준비 중)
  if (eakAt === 3 || eakAt === 4 || submAt === 'Y') return 'completed';

  // 응시 중 (학생이 답변 시작함)
  if (eakAt === 2) return 'in_progress';

  // 응시 전 (교사가 검사 배부했지만 학생이 아직 시작 안 함)
  // dgnssAt='Y': 검사 배부됨, eakAt=1: 응시 전
  return 'waiting';
}
