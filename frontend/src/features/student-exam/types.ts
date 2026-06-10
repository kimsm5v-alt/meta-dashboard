/**
 * 학생용 검사 목록 타입 정의
 */

/** 검사 상태 */
export type ExamStatus =
  | 'waiting' // 시작 전 (eakAt=N, submAt=N, dgnssAt=Y)
  | 'in_progress' // 응시 중 (eakAt=Y, submAt=N, dgnssAt=Y)
  | 'completed' // 제출 완료 (eakAt=Y, submAt=Y, dgnssAt=Y)
  | 'result_ready' // 검사 종료 (eakAt=Y, submAt=Y, dgnssAt=N)
  | 'not_submitted'; // 미제출 (eakAt=N, submAt=N, dgnssAt=N)

/** 학생 검사 목록 아이템 (UI용) */
export interface StudentExamListItem {
  dgnssId: number;
  dgnssResultId: number;
  /** 검사 회차 (1차, 2차...) */
  ordNo: number;
  /** 검사지 종류 ('1': 학습종합검사, '2': 자기조절학습검사) */
  paperIdx: string;
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

/** API 응답 → UI 상태 변환 헬퍼 */
export function mapExamStatus(dgnssAt: 'Y' | 'N', submAt: 'Y' | 'N', eakAt: 'Y' | 'N'): ExamStatus {
  if (dgnssAt === 'N') {
    return submAt === 'Y' ? 'result_ready' : 'not_submitted';
  }
  if (eakAt === 'Y') {
    return submAt === 'Y' ? 'completed' : 'in_progress';
  }
  return 'waiting';
}
