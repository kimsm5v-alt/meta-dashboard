export const trackingKeys = {
  all: ['exam-tracking'] as const,
  studentLearningStatus: (classId: string, studentId: string, paperIdx: number) =>
    [...trackingKeys.all, 'student-learning-status', classId, studentId, paperIdx] as const,
};
