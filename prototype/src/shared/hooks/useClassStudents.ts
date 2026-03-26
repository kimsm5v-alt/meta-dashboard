/**
 * 학급 학생 목록 훅 (L2 대시보드용)
 *
 * 학급 학생 목록을 조회합니다 (검사 결과 포함).
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchTeacherExams,
  fetchL2DashboardData,
  type L2DashboardData,
} from '@/shared/services/dashboardService';
import type { Student } from '@/shared/types';
import { useData } from '@/shared/contexts/DataContext';
import { useCredentials } from './useCredentials';

export interface UseClassStudentsResult {
  students: Student[];
  l2Data: L2DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * 학급 학생 목록 조회 (검사 결과 포함)
 */
export function useClassStudents(classId: string | undefined): UseClassStudentsResult {
  const { getClassById } = useData();
  const { tcId, claId, schoolLevel: credSchoolLevel, hasCredentials } = useCredentials();
  const [students, setStudents] = useState<Student[]>([]);
  const [l2Data, setL2Data] = useState<L2DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!classId) {
      setStudents([]);
      setL2Data(null);
      return;
    }

    const classData = getClassById(classId);

    // credentials 없으면 DataContext fallback
    if (!hasCredentials) {
      setStudents(classData?.students ?? []);
      setL2Data(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const exams = await fetchTeacherExams(claId, tcId, '1');
      const completedRound1 = exams.find(
        exam => exam.dgnssAt === 'N' && exam.ordNo === 1
      );

      if (!completedRound1) {
        setStudents(classData?.students ?? []);
        setL2Data(null);
        setIsLoading(false);
        return;
      }

      const dgnssId = completedRound1.dgnssId;
      const grade = classData?.grade ?? 1;

      const data = await fetchL2DashboardData(
        dgnssId,
        classId,
        credSchoolLevel,
        grade
      );

      setL2Data(data);
      setStudents(data.students);
    } catch (err) {
      console.error('Failed to fetch L2 dashboard data:', err);
      setError(err instanceof Error ? err.message : 'API 호출 실패');
      setStudents(classData?.students ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [classId, getClassById, tcId, claId, credSchoolLevel, hasCredentials]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    students,
    l2Data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
