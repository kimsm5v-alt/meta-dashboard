import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { counselingService } from '@shared/services/counselingService';
import type {
  CompleteCounselingInput,
  CreateCounselingInput,
  UpdateCounselingInput,
} from '@shared/types';
import { counselingKeys } from './queryKeys';

const invalidateCounselingRecords = async (
  queryClient: ReturnType<typeof useQueryClient>,
  studentId: string,
  classId?: string,
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: counselingKeys.byStudent(studentId) }),
    classId
      ? queryClient.invalidateQueries({ queryKey: counselingKeys.byClass(classId) })
      : Promise.resolve(),
  ]);
};

export const useStudentCounselingRecordsQuery = (studentId: string) =>
  useQuery({
    queryKey: counselingKeys.byStudent(studentId),
    queryFn: () => counselingService.getByStudentId(studentId),
    enabled: !!studentId,
  });

export const useCreateCounselingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { input: CreateCounselingInput; studentId: string; classId: string }) =>
      counselingService.create(variables.input),
    onSuccess: async (_data, variables) => {
      await invalidateCounselingRecords(queryClient, variables.studentId, variables.classId);
    },
  });
};

export const useUpdateCounselingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      id: string;
      input: UpdateCounselingInput;
      studentId: string;
      classId: string;
    }) => counselingService.update(variables.id, variables.input),
    onSuccess: async (_data, variables) => {
      await invalidateCounselingRecords(queryClient, variables.studentId, variables.classId);
    },
  });
};

export const useDeleteCounselingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string; studentId: string; classId: string }) =>
      counselingService.delete(variables.id),
    onSuccess: async (_data, variables) => {
      await invalidateCounselingRecords(queryClient, variables.studentId, variables.classId);
    },
  });
};

export const useCompleteCounselingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      id: string;
      input: CompleteCounselingInput;
      studentId: string;
      classId: string;
    }) => counselingService.complete(variables.id, variables.input),
    onSuccess: async (_data, variables) => {
      await invalidateCounselingRecords(queryClient, variables.studentId, variables.classId);
    },
  });
};
