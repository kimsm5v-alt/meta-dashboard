export const studentMemoKeys = {
  all: ['student-memos'] as const,
  byStudent: (studentId: string) => [...studentMemoKeys.all, studentId] as const,
};

export const counselingKeys = {
  all: ['counseling-records'] as const,
  byStudent: (studentId: string) => [...counselingKeys.all, 'student', studentId] as const,
  byClass: (classId: string) => [...counselingKeys.all, 'class', classId] as const,
};
