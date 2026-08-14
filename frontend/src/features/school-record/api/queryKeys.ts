export const schoolRecordKeys = {
  all: ['school-record'] as const,
  classList: (classId: string) => ['school-record', 'class', classId] as const,
  studentDraft: (studentId: string) => ['school-record', 'student', studentId] as const,
};
