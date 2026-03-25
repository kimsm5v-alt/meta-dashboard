/**
 * 학생용 검사 목록 서비스
 */

import { fetchStudentExamList } from '@/features/exam/services/examService';
import type { StudentExamItem } from '@/features/exam/types';
import type { StudentExamListItem } from '../types';
import { mapExamStatus } from '../types';

// Mock 데이터 (API 연동 전)
const MOCK_EXAMS: StudentExamListItem[] = [
  {
    dgnssId: 1,
    dgnssResultId: 101,
    ordNo: 1,
    name: '1차 학습심리정서검사',
    status: 'result_ready',
    progress: 100,
    answeredCount: 124,
    totalQuestions: 124,
    submittedAt: '2026-03-15',
    hasResult: true,
  },
  {
    dgnssId: 2,
    dgnssResultId: 102,
    ordNo: 2,
    name: '2차 학습심리정서검사',
    status: 'in_progress',
    progress: 36,
    answeredCount: 45,
    totalQuestions: 124,
    submittedAt: null,
    hasResult: false,
  },
  {
    dgnssId: 3,
    dgnssResultId: 103,
    ordNo: 3,
    name: '3차 학습심리정서검사',
    status: 'waiting',
    progress: 0,
    answeredCount: 0,
    totalQuestions: 124,
    submittedAt: null,
    hasResult: false,
  },
];

/**
 * API 응답을 UI 타입으로 변환
 */
function mapToListItem(item: StudentExamItem, ordNo: number): StudentExamListItem {
  const status = mapExamStatus(item.dgnssAt, item.submAt, item.eakAt);
  const totalQuestions = 124; // 고정값 (실제 API에서 받아올 수 있음)

  // 진행률 계산 (실제로는 API에서 answeredCount를 받아야 함)
  let progress = 0;
  let answeredCount = 0;

  if (status === 'completed' || status === 'result_ready') {
    progress = 100;
    answeredCount = totalQuestions;
  } else if (status === 'in_progress') {
    // 임시로 랜덤 진행률 (실제로는 API에서 받아야 함)
    answeredCount = Math.floor(Math.random() * 100) + 20;
    progress = Math.round((answeredCount / totalQuestions) * 100);
  }

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
  stdtId: string,
  useMock: boolean = true
): Promise<StudentExamListItem[]> {
  if (useMock) {
    // Mock 모드
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_EXAMS), 500);
    });
  }

  // API 모드
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
