export const assessmentKeys = {
  all: ['assessment'] as const,
  paperPermission: (userId: string) => [...assessmentKeys.all, 'paper-permission', userId] as const,
  examSlots: (claId: string, userId: string, paperIdx?: string) =>
    [...assessmentKeys.all, 'exam-slots', claId, userId, paperIdx ?? 'all'] as const,
};
