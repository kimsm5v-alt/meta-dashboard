/**
 * 학생용 검사 목록 서비스
 *
 * 2종(학습종합검사, 자기조절학습검사) × 2회차 구조 지원
 */

import { fetchStudentExamList } from '@/features/exam/services/examService';
import type { StudentExamItem } from '@/features/exam/types';
import type { StudentExamListItem, ExamType, ExamStatus } from '../types';
import { mapExamStatus, EXAM_TYPE_INFO, EXAM_STATUS_INFO } from '../types';

/**
 * API 응답을 UI 타입으로 변환
 */
function mapToListItem(
  item: StudentExamItem,
  type: ExamType,
  round: number
): StudentExamListItem {
  const status = mapExamStatus(item.dgnssAt, item.submAt, item.eakAt);
  const typeInfo = EXAM_TYPE_INFO[type];
  const roundInfo = typeInfo.rounds.find((r) => r.round === round);

  // 총 문항 수 (검사 종류에 따라 다름)
  const totalQuestions = type === 'comp' ? 124 : 80;

  // 진행률 계산
  let progress = 0;
  let answeredCount = 0;

  if (status === 'awaiting' || status === 'result') {
    progress = 100;
    answeredCount = totalQuestions;
  }

  return {
    dgnssId: item.dgnssId,
    dgnssResultId: item.dgnssResultId,
    type,
    round,
    name: `${round}차 ${typeInfo.name}`,
    status,
    progress,
    answeredCount,
    totalQuestions,
    submittedAt: item.submDt,
    hasResult: status === 'result',
    recommendedMonth: roundInfo?.recommendedMonth || '',
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

  // TODO: 실제 API 응답에서 type/round 정보를 파싱
  // 현재는 순서대로 comp 1차, comp 2차, self 1차, self 2차로 매핑
  return items.map((item, index) => {
    const type: ExamType = index < 2 ? 'comp' : 'self';
    const round = index % 2 === 0 ? 1 : 2;
    return mapToListItem(item, type, round);
  });
}

/**
 * 검사 상태 라벨
 */
export function getStatusLabel(status: ExamStatus): string {
  return EXAM_STATUS_INFO[status]?.label || '알 수 없음';
}

/**
 * 검사 상태 색상
 */
export function getStatusColor(status: ExamStatus): {
  bg: string;
  text: string;
  dot: string;
} {
  const info = EXAM_STATUS_INFO[status];
  if (!info) {
    return { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
  }

  return {
    bg: info.bgClass,
    text: info.textClass,
    dot: info.bgClass.replace('bg-', 'bg-').replace('-50', '-500'),
  };
}

/**
 * 1차 검사 완료 여부 확인 (2차 잠금 해제 조건)
 */
export function isFirstRoundCompleted(
  exams: StudentExamListItem[],
  type: ExamType
): boolean {
  const firstRound = exams.find((e) => e.type === type && e.round === 1);
  if (!firstRound) return false;

  // awaiting 또는 result 상태면 1차 완료
  return firstRound.status === 'awaiting' || firstRound.status === 'result';
}

/**
 * 2차 검사 잠금 상태 적용
 */
export function applySecondRoundLock(
  exams: StudentExamListItem[]
): StudentExamListItem[] {
  return exams.map((exam) => {
    if (exam.round !== 2) return exam;

    const firstCompleted = isFirstRoundCompleted(exams, exam.type);
    if (!firstCompleted && exam.status !== 'locked') {
      return { ...exam, status: 'locked' as ExamStatus };
    }

    return exam;
  });
}
