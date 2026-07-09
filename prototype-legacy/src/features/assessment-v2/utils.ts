/**
 * 검사하기 V2 - 유틸리티 함수
 */

import { EXAM_SLOTS } from './constants';
import type {
  GroupWithExamState,
  GroupStatusSummary,
  ExamSlotState,
  ExamSlotStatus,
  ExamKind,
} from './types';

// ============================================================
// 그룹 상태 요약
// ============================================================

/**
 * 그룹의 검사 상태 요약 계산
 */
export function getGroupStatusSummary(group: GroupWithExamState): GroupStatusSummary {
  const slots = group.examSlots || [];

  // 진행 중인 검사 찾기
  const inProgressSlot = slots.find((s) => s.status === 'in_progress');
  if (inProgressSlot) {
    const slotDef = EXAM_SLOTS.find((d) => d.id === inProgressSlot.slotId);
    return {
      type: 'in_progress',
      label: '진행중',
      examName: slotDef?.shortLabel,
      examRound: slotDef?.round,
      progress: inProgressSlot.totalCount > 0
        ? Math.round((inProgressSlot.submittedCount / inProgressSlot.totalCount) * 100)
        : 0,
      submittedCount: inProgressSlot.submittedCount,
      totalCount: inProgressSlot.totalCount,
    };
  }

  // 모든 검사 완료 확인
  const completedCount = slots.filter((s) => s.status === 'completed').length;
  if (completedCount >= 4) {
    return {
      type: 'all_done',
      label: '완료',
    };
  }

  // 대기 상태
  return {
    type: 'waiting',
    label: '대기',
  };
}

// ============================================================
// 검사 슬롯 상태 계산
// ============================================================

/**
 * 2차 검사 잠금 여부 확인
 * 같은 종류의 1차가 완료되어야 2차 시작 가능
 */
export function isSlotLocked(
  slotId: string,
  examSlots: ExamSlotState[]
): boolean {
  const slotDef = EXAM_SLOTS.find((d) => d.id === slotId);
  if (!slotDef || slotDef.round !== 2) return false;

  // 같은 종류의 1차 검사 찾기
  const round1SlotId = slotDef.kind === 'learning' ? 'L1' : 'S1';
  const round1State = examSlots.find((s) => s.slotId === round1SlotId);

  // 1차가 완료되지 않았으면 잠금
  return !round1State || round1State.status !== 'completed';
}

/**
 * 슬롯 상태 결정
 */
export function getSlotStatus(
  slotId: string,
  slotState: ExamSlotState | undefined,
  allSlots: ExamSlotState[]
): ExamSlotStatus {
  // 기존 상태가 있으면 그대로 사용
  if (slotState?.status === 'in_progress') return 'in_progress';
  if (slotState?.status === 'completed') return 'completed';

  // 2차 잠금 확인
  if (isSlotLocked(slotId, allSlots)) return 'locked';

  return 'not_started';
}

// ============================================================
// 진행률 계산
// ============================================================

/**
 * 제출률 퍼센트 계산
 */
export function calculateProgress(submitted: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((submitted / total) * 100);
}

// ============================================================
// 포맷 함수
// ============================================================

/**
 * 날짜 포맷
 */
export function formatDate(date: Date | string | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/**
 * 날짜 범위 포맷
 */
export function formatDateRange(start?: Date, end?: Date): string {
  if (!start) return '-';
  const startStr = formatDate(start);
  if (!end) return `${startStr} ~`;
  return `${startStr} ~ ${formatDate(end)}`;
}

// ============================================================
// 검사 종류 라벨
// ============================================================

export function getExamKindLabel(kind: ExamKind): string {
  return kind === 'learning' ? '학습종합검사' : '자기조절학습검사';
}

export function getExamKindColor(kind: ExamKind): string {
  return kind === 'learning' ? '#9D53E1' : '#009F88';
}

// ============================================================
// 그룹명 자동 생성
// ============================================================

export function generateGroupName(grade: number, classNumber: number): string {
  return `${grade}학년 ${classNumber}반`;
}

// ============================================================
// 검사 시작 가능 여부
// ============================================================

export function canStartExam(
  slotId: string,
  examSlots: ExamSlotState[],
  memberCount: number
): { canStart: boolean; reason?: string } {
  // 멤버가 없으면 시작 불가
  if (memberCount === 0) {
    return { canStart: false, reason: '학생이 없습니다. 먼저 학생을 초대해주세요.' };
  }

  // 잠금 상태 확인
  if (isSlotLocked(slotId, examSlots)) {
    const slotDef = EXAM_SLOTS.find((d) => d.id === slotId);
    const kind = slotDef?.kind === 'learning' ? '학습종합검사' : '자기조절학습검사';
    return { canStart: false, reason: `${kind} 1차 종료 후 진행 가능합니다.` };
  }

  // 이미 진행 중인 검사가 있는지 확인
  const inProgress = examSlots.find((s) => s.status === 'in_progress');
  if (inProgress) {
    return { canStart: false, reason: '진행 중인 검사를 먼저 종료해주세요.' };
  }

  return { canStart: true };
}
