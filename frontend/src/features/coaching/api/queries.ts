import { useQuery } from '@tanstack/react-query';
import { fetchStudentCoaching } from './coachingService';

export const coachingKeys = {
  student: (answerIdx: number) => ['coaching', 'student', answerIdx] as const,
};

export function useStudentCoachingQuery(answerIdx: number | null | undefined) {
  return useQuery({
    queryKey: coachingKeys.student(answerIdx ?? -1),
    queryFn: () => fetchStudentCoaching(answerIdx!),
    enabled: typeof answerIdx === 'number',
  });
}
