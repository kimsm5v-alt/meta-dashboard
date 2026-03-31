/**
 * 학생용 검사 목록 서비스
 * exam/api/examService의 fetchStudentExamList를 재사용하여 UI 타입으로 변환
 */

import { fetchStudentExamList } from '@features/exam/api/examService';
import type { StudentExamItem } from '@features/exam/types';
import type { StudentExamListItem, ExamStatus } from '../types';
import { mapExamStatus } from '../types';

const TOTAL_QUESTIONS = 124;

function mapToListItem(item: StudentExamItem, ordNo: number): StudentExamListItem {
  const status = mapExamStatus(item.dgnssAt, item.submAt, item.eakAt);
  const isFinished = status === 'completed' || status === 'result_ready';

  return {
    dgnssId: item.dgnssId,
    dgnssResultId: item.dgnssResultId,
    ordNo,
    name: `${ordNo}차 학습심리정서검사`,
    status,
    progress: isFinished ? 100 : 0,
    answeredCount: isFinished ? TOTAL_QUESTIONS : 0,
    totalQuestions: TOTAL_QUESTIONS,
    submittedAt: item.submDt,
    hasResult: item.eakAt === 'Y',
  };
}

/** 학생/게스트 검사 목록 조회 */
export async function getStudentExamList(
  claId: string,
  stdtId: string,
): Promise<StudentExamListItem[]> {
  const items = await fetchStudentExamList(claId, stdtId);
  return items.map((item, index) => mapToListItem(item, index + 1));
}

/** 검사 상태 라벨 */
export function getStatusLabel(status: ExamStatus): string {
  switch (status) {
    case 'waiting':
      return '대기중';
    case 'in_progress':
      return '진행중';
    case 'completed':
      return '완료';
    case 'result_ready':
      return '결과 확인 가능';
    case 'not_submitted':
      return '미응시';
    default:
      return '알 수 없음';
  }
}

/** 검사 상태 색상 (Emotion에서 사용할 색상값 직접 반환) */
export function getStatusColor(status: ExamStatus): {
  bg: string;
  text: string;
} {
  switch (status) {
    case 'waiting':
      return { bg: '#dbeafe', text: '#1d4ed8' };
    case 'in_progress':
      return { bg: '#fef3c7', text: '#b45309' };
    case 'completed':
      return { bg: '#f3f4f6', text: '#4b5563' };
    case 'result_ready':
      return { bg: '#dcfce7', text: '#15803d' };
    case 'not_submitted':
      return { bg: '#fee2e2', text: '#b91c1c' };
    default:
      return { bg: '#f3f4f6', text: '#4b5563' };
  }
}
