import { useAuth } from '@features/auth/model/AuthContext';
import { useMyGroupsQuery } from '@features/api';
import { useAssessmentSlotsQueries } from '@features/assessment/api/queries';
import { EXAM_SLOTS } from '@features/assessment/constants';
import type { ExamSlotState, GroupWithExamState } from '@features/assessment/types';
import type { Group } from '@shared/types';

const emptySlots = (): ExamSlotState[] =>
  EXAM_SLOTS.map((def) => ({
    slotId: def.id,
    status: 'not_started' as const,
    submittedCount: 0,
    totalCount: 0,
  }));

const buildGroupWithExamState = (group: Group, examSlots: ExamSlotState[]): GroupWithExamState => ({
  ...group,
  examSlots,
  inProgressCount: examSlots.filter((s) => s.status === 'in_progress').length,
  completedCount: examSlots.filter((s) => s.status === 'completed').length,
  activeMemberCount: group.memberCount,
});

export const getLearningSlot = (
  group: GroupWithExamState,
  round: 1 | 2,
): ExamSlotState | undefined =>
  group.examSlots.find((slot) => slot.slotId === (round === 1 ? 'L1' : 'L2'));

export interface HomeExamSummary {
  totalClasses: number;
  inProgressExams: number;
  completedExams: number;
  pendingStudents: number;
}

export interface UseHomeExamStatsResult {
  groups: GroupWithExamState[];
  summary: HomeExamSummary;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useHomeExamStats(): UseHomeExamStatsResult {
  const { user } = useAuth();
  const {
    data: rawGroups = [],
    isLoading: isGroupsLoading,
    error: groupsError,
    refetch: refetchGroups,
  } = useMyGroupsQuery();

  const slotsQueryState = useAssessmentSlotsQueries(rawGroups, user?.id);

  const groups: GroupWithExamState[] = rawGroups.map((g) =>
    buildGroupWithExamState(g, slotsQueryState.dataByClaId.get(g.claId) ?? emptySlots()),
  );

  const learningSlots = groups.flatMap((group) => {
    const round1 = getLearningSlot(group, 1);
    const round2 = getLearningSlot(group, 2);
    return [round1, round2].filter((slot): slot is ExamSlotState => slot !== undefined);
  });

  const summary: HomeExamSummary = {
    totalClasses: groups.length,
    inProgressExams: learningSlots.filter((slot) => slot.status === 'in_progress').length,
    completedExams: learningSlots.filter((slot) => slot.status === 'completed').length,
    pendingStudents: learningSlots
      .filter((slot) => slot.status === 'in_progress')
      .reduce((total, slot) => total + Math.max(slot.totalCount - slot.submittedCount, 0), 0),
  };

  return {
    groups,
    summary,
    isLoading: isGroupsLoading || slotsQueryState.isLoading,
    error: groupsError ?? (slotsQueryState.error || null),
    refetch: () => {
      void refetchGroups();
      slotsQueryState.refetchAll();
    },
  };
}
