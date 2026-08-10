import { useTeacherClasses } from '@features/api';
import type { Class } from '@shared/types';

export interface UseHomeClassStatsResult {
  classes: Class[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const hasAssessedStudents = (cls: Class): boolean =>
  cls.students.some((student) => student.assessments.length > 0);

export function useHomeClassStats(): UseHomeClassStatsResult {
  const { classes, isLoading, error, refetch } = useTeacherClasses();

  return {
    classes: classes.filter(hasAssessedStudents),
    isLoading,
    error,
    refetch,
  };
}
