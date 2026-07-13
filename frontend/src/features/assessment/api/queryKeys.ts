export const assessmentKeys = {
  all: ['assessment'] as const,
  examLists: () => [...assessmentKeys.all, 'exam-list'] as const,
  examListByGroups: (claIds: readonly string[], tcId: string, paperIdx: string = '1') =>
    [...assessmentKeys.examLists(), { claIds: [...claIds].sort(), tcId, paperIdx }] as const,
  examSlots: (claId: string, userId: string) =>
    [...assessmentKeys.all, 'exam-slots', claId, userId] as const,
  groupMembers: (groupId: string, userId: string) =>
    [...assessmentKeys.all, 'group-members', groupId, userId] as const,
};
