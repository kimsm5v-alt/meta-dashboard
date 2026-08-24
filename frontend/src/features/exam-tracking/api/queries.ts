import { useQuery } from '@tanstack/react-query';
import { trackingKeys } from './queryKeys';
import { fetchStudentLearningStatus } from './studentLearningStatusService';

export const useStudentLearningStatusQuery = (
  classId: string | undefined,
  studentId: string | undefined,
  paperIdx = 1,
) =>
  useQuery({
    queryKey: trackingKeys.studentLearningStatus(classId ?? '', studentId ?? '', paperIdx),
    queryFn: () => fetchStudentLearningStatus(classId!, studentId!, paperIdx),
    enabled: !!classId && !!studentId,
  });
