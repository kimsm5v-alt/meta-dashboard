import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { getExamSlots } from '@features/assessment/api/examSlotService';
import {
  cancelExam,
  downloadSampleExcel,
  endExam,
  fetchPaperPermission,
  previewExamStart,
  restartExam,
  startExam,
  uploadAnswersExcel,
  type GradeLevel,
} from './assessmentService';
import { assessmentKeys } from './queryKeys';
import type { Group } from '@shared/types';
import type { PaperIdx } from '../types';

export const usePaperPermissionQuery = (userId: string | undefined) =>
  useQuery({
    queryKey: assessmentKeys.paperPermission(userId ?? ''),
    queryFn: fetchPaperPermission,
    enabled: !!userId,
    staleTime: Number.POSITIVE_INFINITY,
  });

export const useAssessmentSlotsQueries = (
  groups: readonly Group[],
  userId: string | undefined,
  paperIdx?: PaperIdx,
  enabled = true,
) => {
  const results = useQueries({
    queries: groups.map((group) => ({
      queryKey: assessmentKeys.examSlots(group.claId, userId ?? '', paperIdx),
      queryFn: () => getExamSlots(group.claId, userId!, paperIdx),
      enabled: enabled && !!userId && !!group.claId,
    })),
  });

  const dataByClaId = new Map<
    string,
    ReturnType<typeof getExamSlots> extends Promise<infer T> ? T : never
  >();
  groups.forEach((group, index) => {
    const data = results[index]?.data;
    if (data) dataByClaId.set(group.claId, data);
  });

  return {
    results,
    dataByClaId,
    isLoading: results.some((result) => result.isLoading),
    error: results.find((result) => result.error)?.error ?? null,
    refetchAll: () => {
      results.forEach((result) => {
        void result.refetch();
      });
    },
  };
};

const useInvalidateAssessmentGroup = () => {
  const queryClient = useQueryClient();

  return async (claId: string, userId: string) => {
    // 사이드바(useTeacherClassList)도 이제 examSlots 키를 공유하므로 이 무효화 하나로
    // 검사 페이지 + 사이드바가 함께 갱신됨. (구 ['group-dgnss-status'] 키 제거)
    await queryClient.invalidateQueries({
      queryKey: [...assessmentKeys.all, 'exam-slots', claId, userId],
    });
  };
};

export const useStartExamMutation = () => {
  const invalidateAssessmentGroup = useInvalidateAssessmentGroup();

  return useMutation({
    mutationFn: (variables: {
      claId: string;
      tcId: string;
      ordNo: number;
      grade: GradeLevel;
      paperIdx?: string;
    }) =>
      startExam(
        variables.claId,
        variables.tcId,
        variables.ordNo,
        variables.grade,
        variables.paperIdx,
      ),
    onSuccess: async (_data, variables) => {
      await invalidateAssessmentGroup(variables.claId, variables.tcId);
    },
  });
};

export const useEndExamMutation = () => {
  const invalidateAssessmentGroup = useInvalidateAssessmentGroup();

  return useMutation({
    mutationFn: (variables: { dgnssId: number; claId: string; userId: string }) =>
      endExam(variables.dgnssId),
    onSuccess: async (_data, variables) => {
      await invalidateAssessmentGroup(variables.claId, variables.userId);
    },
  });
};

export const useCancelExamMutation = () => {
  const invalidateAssessmentGroup = useInvalidateAssessmentGroup();

  return useMutation({
    mutationFn: (variables: { dgnssId: number; claId: string; userId: string }) =>
      cancelExam(variables.dgnssId),
    onSuccess: async (_data, variables) => {
      await invalidateAssessmentGroup(variables.claId, variables.userId);
    },
  });
};

export const useRestartExamMutation = () => {
  const invalidateAssessmentGroup = useInvalidateAssessmentGroup();

  return useMutation({
    mutationFn: (variables: {
      dgnssId: number;
      claId: string;
      userId: string;
      grade: GradeLevel;
    }) => restartExam(variables.dgnssId, variables.claId, variables.grade),
    onSuccess: async (_data, variables) => {
      await invalidateAssessmentGroup(variables.claId, variables.userId);
    },
  });
};

export const usePreviewExamStartMutation = () =>
  useMutation({
    mutationFn: (variables: { claId: string; paperIdx?: string; ordNo?: number }) =>
      previewExamStart(variables.claId, variables.paperIdx, variables.ordNo),
  });

export const useUploadAnswersExcelMutation = () => {
  const invalidateAssessmentGroup = useInvalidateAssessmentGroup();

  return useMutation({
    mutationFn: (variables: { dgnssId: number; file: File; claId: string; userId: string }) =>
      uploadAnswersExcel(variables.dgnssId, variables.file),
    onSuccess: async (_data, variables) => {
      await invalidateAssessmentGroup(variables.claId, variables.userId);
    },
  });
};

export const useDownloadSampleExcelMutation = () =>
  useMutation({
    mutationFn: (variables: { dgnssId: number }) => downloadSampleExcel(variables.dgnssId),
  });
