export const assessmentKeys = {
  all: ['assessment'] as const,
  examSlots: (claId: string, userId: string) =>
    [...assessmentKeys.all, 'exam-slots', claId, userId] as const,
};
