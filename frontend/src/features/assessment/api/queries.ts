import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { getGroupDetail } from '@features/groups/api/groupService';
import { getExamSlots } from '@features/assessment-v2/api/examSlotService';
import {
  cancelExam,
  downloadSampleExcel,
  endExam,
  fetchExamList,
  previewExamStart,
  restartExam,
  startExam,
  uploadAnswersExcel,
  type ExamListItem,
  type GradeLevel,
} from './assessmentService';
import { assessmentKeys } from './queryKeys';
import type { Group } from '@shared/types';

export const useAssessmentExamListByGroupsQuery = (
  groups: readonly Group[],
  tcId: string,
  paperIdx = '1',
) => {
  const claIds = groups.map((g) => g.claId);

  return useQuery<ExamListItem[]>({
    queryKey: assessmentKeys.examListByGroups(claIds, tcId, paperIdx),
    enabled: groups.length > 0 && !!tcId,
    queryFn: async () => {
      const results = await Promise.all(groups.map((g) => fetchExamList(g.claId, tcId, paperIdx)));
      const seen = new Set<number>();
      return results.flat().filter((item) => {
        if (seen.has(item.dgnssId)) return false;
        seen.add(item.dgnssId);
        return true;
      });
    },
  });
};

export const useAssessmentSlotsQueries = (groups: readonly Group[], userId: string | undefined) => {
  const results = useQueries({
    queries: groups.map((group) => ({
      queryKey: assessmentKeys.examSlots(group.claId, userId ?? ''),
      queryFn: () => getExamSlots(group.claId, userId!),
      enabled: !!userId && !!group.claId,
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

export const useAssessmentGroupMembersQuery = (
  groupId: string | null | undefined,
  userId: string | undefined,
) =>
  useQuery({
    queryKey: assessmentKeys.groupMembers(groupId ?? '', userId ?? ''),
    enabled: !!groupId && !!userId,
    queryFn: async () => {
      const result = await getGroupDetail(groupId!, userId!);
      return result?.members ?? [];
    },
  });

const useInvalidateAssessmentGroup = () => {
  const queryClient = useQueryClient();

  return async (claId: string, userId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: assessmentKeys.examSlots(claId, userId) }),
      queryClient.invalidateQueries({ queryKey: assessmentKeys.examLists() }),
      queryClient.invalidateQueries({ queryKey: ['group-dgnss-status'] }),
    ]);
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
