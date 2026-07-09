import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memoService } from '@shared/services/memoService';
import type { CreateObservationMemoInput, UpdateObservationMemoInput } from '@shared/types';
import { studentMemoKeys } from './queryKeys';

export const useStudentMemosQuery = (studentId: string) =>
  useQuery({
    queryKey: studentMemoKeys.byStudent(studentId),
    queryFn: () => memoService.getByStudentId(studentId),
    enabled: !!studentId,
  });

export const useCreateMemoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateObservationMemoInput) => memoService.create(input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: studentMemoKeys.byStudent(variables.studentId),
      });
    },
  });
};

export const useUpdateMemoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string; studentId: string; input: UpdateObservationMemoInput }) =>
      memoService.update(variables.id, variables.input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: studentMemoKeys.byStudent(variables.studentId),
      });
    },
  });
};

export const useDeleteMemoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string; studentId: string }) => memoService.delete(variables.id),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: studentMemoKeys.byStudent(variables.studentId),
      });
    },
  });
};

export const useToggleMemoImportantMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string; studentId: string; isImportant: boolean }) =>
      memoService.toggleImportant(variables.id, variables.isImportant),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: studentMemoKeys.byStudent(variables.studentId),
      });
    },
  });
};
