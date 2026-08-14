import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTeacherClasses } from '@features/api';
import { useStudentCounselingRecordsQuery } from '@features/student-dashboard/api/counselingQueries';
import { useStudentMemosQuery } from '@features/student-dashboard/api/memoQueries';
import { COUNSELING_AREA_LABELS, MEMO_CATEGORY_LABELS } from '@shared/types';
import type { Class, Student } from '@shared/types';
import { schoolRecordApi, type SaveDraftPayload } from '../api/schoolRecordApi';
import { schoolRecordKeys } from '../api/queryKeys';
import { computeStudentProfile } from './computeStudentProfile';
import type { CounselingRefOption, RecordDraftDetail, StudentProfile } from '../types';

export interface UseSchoolRecordStudentDataResult {
  classData: Class | null;
  student: Student | null;
  profile: StudentProfile | null;
  draft: RecordDraftDetail | null;
  counselingOptions: CounselingRefOption[];
  isLoading: boolean;
  error: string | null;
  saveDraft: (payload: Omit<SaveDraftPayload, 'studentId' | 'classId'>) => Promise<void>;
  isSaving: boolean;
  deleteDraft: () => Promise<void>;
  isDeleting: boolean;
  refetchDraft: () => void;
}

export function useSchoolRecordStudentData(
  classId: string | undefined,
  studentId: string | undefined,
): UseSchoolRecordStudentDataResult {
  const queryClient = useQueryClient();
  const { classes, isLoading: classesLoading, error } = useTeacherClasses();
  const classData = classId ? (classes.find((c) => c.id === classId) ?? null) : null;
  const student =
    classData && studentId ? (classData.students.find((s) => s.id === studentId) ?? null) : null;

  const draftQuery = useQuery({
    queryKey: schoolRecordKeys.studentDraft(studentId ?? ''),
    queryFn: () => schoolRecordApi.getStudentDraft(studentId!),
    enabled: !!studentId,
  });

  const { data: counselingRecords = [], isLoading: counselingLoading } =
    useStudentCounselingRecordsQuery(studentId ?? '');
  const { data: memos = [], isLoading: memosLoading } = useStudentMemosQuery(studentId ?? '');

  const counselingOptions: CounselingRefOption[] = [
    ...counselingRecords.map((record) => ({
      id: record.id,
      date: record.scheduledAt,
      category: record.areas.map((area) => COUNSELING_AREA_LABELS[area]).join(', ') || '상담',
      summary: record.summary || record.reason || '상담 기록',
    })),
    ...memos.map((memo) => ({
      id: memo.id,
      date: memo.date,
      category: MEMO_CATEGORY_LABELS[memo.category],
      summary: memo.content,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: schoolRecordKeys.studentDraft(studentId ?? '') }),
      classId
        ? queryClient.invalidateQueries({ queryKey: schoolRecordKeys.classList(classId) })
        : Promise.resolve(),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: (payload: Omit<SaveDraftPayload, 'studentId' | 'classId'>) =>
      schoolRecordApi.saveDraft({ ...payload, studentId: studentId!, classId: classId! }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: () => schoolRecordApi.deleteDraft(draftQuery.data!.id),
    onSuccess: invalidate,
  });

  return {
    classData,
    student,
    profile: student ? computeStudentProfile(student) : null,
    draft: draftQuery.data ?? null,
    counselingOptions,
    isLoading: classesLoading || draftQuery.isLoading || counselingLoading || memosLoading,
    error: error ?? (draftQuery.error ? String(draftQuery.error) : null),
    saveDraft: async (payload) => {
      await saveMutation.mutateAsync(payload);
    },
    isSaving: saveMutation.isPending,
    deleteDraft: async () => {
      if (draftQuery.data) {
        await deleteMutation.mutateAsync();
      }
    },
    isDeleting: deleteMutation.isPending,
    refetchDraft: draftQuery.refetch,
  };
}
