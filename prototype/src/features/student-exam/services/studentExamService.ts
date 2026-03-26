/**
 * 학생용 검사 목록 서비스
 */

import { fetchStudentExamList } from '@/features/exam/services/examService';
import type { StudentExamItem } from '@/features/exam/types';
import type { StudentExamListItem } from '../types';
import { mapExamStatus } from '../types';

/**
 * API 응답을 UI 타입으로 변환
 */
function mapToListItem(item: StudentExamItem, ordNo: number): StudentExamListItem {
  const status = mapExamStatus(item.dgnssAt, item.submAt, item.eakAt);
  const totalQuestions = 124; // 고정값 (실제 API에서 받아올 수 있음)

  // 진행률 계산
  // 주의: 실제 답변 개수는 /api/dgnss/st/start API에서만 제공됨 (stAnsCnt)
  // 목록 API에서는 제공되지 않으므로, 완료된 검사만 100%로 표시
  let progress = 0;
  let answeredCount = 0;

  if (status === 'completed' || status === 'result_ready') {
    // 제출 완료한 검사만 100% 진행률 표시
    progress = 100;
    answeredCount = totalQuestions;
  }
  // waiting, in_progress 상태는 진행률 0% (실제 답변 개수를 알 수 없음)

  return {
    dgnssId: item.dgnssId,
    dgnssResultId: item.dgnssResultId,
    ordNo,
    name: `${ordNo}차 학습심리정서검사`,
    status,
    progress,
    answeredCount,
    totalQuestions,
    submittedAt: item.submDt,
    hasResult: item.eakAt === 'Y',
  };
}

/**
 * 학생 검사 목록 조회
 */
export async function getStudentExamList(
  claId: string,
  stdtId: string
): Promise<StudentExamListItem[]> {
  const items = await fetchStudentExamList(claId, stdtId);
  return items.map((item, index) => mapToListItem(item, index + 1));
}

/**
 * 검사 상태 라벨
 */
export function getStatusLabel(status: StudentExamListItem['status']): string {
  switch (status) {
    case 'waiting':
      return '대기중';
    case 'in_progress':
      return '진행중';
    case 'completed':
      return '완료';
    case 'result_ready':
      return '결과 확인 가능';
    default:
      return '알 수 없음';
  }
}

/**
 * 검사 상태 색상
 */
export function getStatusColor(status: StudentExamListItem['status']): {
  bg: string;
  text: string;
  dot: string;
} {
  switch (status) {
    case 'waiting':
      return { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
    case 'in_progress':
      return { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' };
    case 'completed':
      return { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' };
    case 'result_ready':
      return { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
  }
}
