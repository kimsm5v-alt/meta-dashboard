import type { ExamSlotState, ExamSlotStatus, GroupWithExamState } from './types';

export function getSlotStatus(
  slotId: string,
  slotState: ExamSlotState | undefined,
  allSlots: ExamSlotState[],
): ExamSlotStatus {
  if (slotId === 'L2') {
    const l1 = allSlots.find((s) => s.slotId === 'L1');
    if (!l1 || l1.status !== 'completed') return 'locked';
  }
  if (slotId === 'S2') {
    const s1 = allSlots.find((s) => s.slotId === 'S1');
    if (!s1 || s1.status !== 'completed') return 'locked';
  }
  return slotState?.status ?? 'not_started';
}

export function calculateProgress(submitted: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((submitted / total) * 100);
}

export function formatDateRange(start?: Date, end?: Date): string {
  if (!start) return '—';
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  if (end) return `${fmt(start)} ~ ${fmt(end)}`;
  return `${fmt(start)} ~`;
}

export function generateGroupName(grade: number, classNumber: number): string {
  return `${grade}학년 ${classNumber}반`;
}

export function getGroupStatusSummary(group: GroupWithExamState): {
  label: string;
  className: string;
} {
  const { inProgressCount, completedCount, examSlots } = group;
  if (inProgressCount > 0) return { label: '진행 중', className: 'live' };
  if (
    completedCount >= examSlots.filter((s) => !s.slotId.startsWith('S')).length &&
    completedCount > 0
  ) {
    return { label: '완료', className: 'alldone' };
  }
  if (completedCount > 0) return { label: '일부 완료', className: 'alldone' };
  return { label: '대기 중', className: 'none' };
}
