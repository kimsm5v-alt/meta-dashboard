import { useTeacherClasses } from '@features/api';
import type { Class } from '@shared/types';

export interface UseTrackingClassDataResult {
  classData: Class | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTrackingClassData(classId: string | undefined): UseTrackingClassDataResult {
  const { classes, isLoading, error, refetch } = useTeacherClasses();

  return {
    classData: classId ? (classes.find((c) => c.id === classId) ?? null) : null,
    isLoading,
    error,
    refetch,
  };
}
