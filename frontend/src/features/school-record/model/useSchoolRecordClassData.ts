import { useQuery } from '@tanstack/react-query';
import { useTeacherClasses } from '@features/api';
import type { Class } from '@shared/types';
import { schoolRecordApi } from '../api/schoolRecordApi';
import { schoolRecordKeys } from '../api/queryKeys';
import { computeStudentProfile } from './computeStudentProfile';
import type { DraftStatus } from '../types';

export interface SchoolRecordStudentRow {
  studentId: string;
  no: number;
  name: string;
  strengths: string[];
  improvements: string[];
  status: DraftStatus;
  savedAt: string | null;
}

export interface UseSchoolRecordClassDataResult {
  classData: Class | null;
  rows: SchoolRecordStudentRow[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSchoolRecordClassData(
  classId: string | undefined,
): UseSchoolRecordClassDataResult {
  const {
    classes,
    isLoading: classesLoading,
    error,
    refetch: refetchClasses,
  } = useTeacherClasses();
  const classData = classId ? (classes.find((c) => c.id === classId) ?? null) : null;

  const draftQuery = useQuery({
    queryKey: schoolRecordKeys.classList(classId ?? ''),
    queryFn: () => schoolRecordApi.getClassDraftList(classId!),
    enabled: !!classId,
  });

  const draftByStudentId = new Map(
    (draftQuery.data ?? []).map((draft) => [draft.studentId, draft]),
  );

  const rows: SchoolRecordStudentRow[] = (classData?.students ?? []).map((student) => {
    const profile = computeStudentProfile(student);
    const draft = draftByStudentId.get(student.id);
    return {
      studentId: student.id,
      no: student.number,
      name: student.name,
      strengths: profile?.strengths.map((item) => item.factorName) ?? [],
      improvements: profile?.weaknesses.map((item) => item.factorName) ?? [],
      status: draft?.status ?? 'EMPTY',
      savedAt: draft?.savedAt ?? null,
    };
  });

  return {
    classData,
    rows,
    isLoading: classesLoading || draftQuery.isLoading,
    error: error ?? (draftQuery.error ? String(draftQuery.error) : null),
    refetch: () => {
      refetchClasses();
      draftQuery.refetch();
    },
  };
}
