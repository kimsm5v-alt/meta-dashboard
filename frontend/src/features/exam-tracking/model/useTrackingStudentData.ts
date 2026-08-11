import { useTeacherClasses } from '@features/api';
import type { Class, Student } from '@shared/types';

export interface UseTrackingStudentDataResult {
  classData: Class | null;
  student: Student | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTrackingStudentData(
  classId: string | undefined,
  studentId: string | undefined,
): UseTrackingStudentDataResult {
  const { classes, isLoading, error, refetch } = useTeacherClasses();

  const classData = classId ? (classes.find((c) => c.id === classId) ?? null) : null;
  const student =
    classData && studentId ? (classData.students.find((s) => s.id === studentId) ?? null) : null;

  return { classData, student, isLoading, error, refetch };
}
