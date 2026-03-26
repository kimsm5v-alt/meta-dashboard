/**
 * 교사 학급 목록 훅 (L1 대시보드용)
 *
 * 교사의 학급 목록을 조회합니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { getAuthTokens } from '@/shared/services/apiClient';
import { fetchTeacherExams, buildClassFromAPI } from '@/shared/services/dashboardService';
import type { Class } from '@/shared/types';
import { useData } from '@/shared/contexts/DataContext';
import { useAuth } from '@/features/auth';
import { useCredentials } from './useCredentials';

type ExamStatus = 'completed' | 'in-progress' | 'no-exams';

export interface UseTeacherClassesResult {
  classes: Class[];
  isLoading: boolean;
  error: string | null;
  examStatus: ExamStatus;
  refetch: () => void;
}

/**
 * 교사 학급 목록 조회
 */
export function useTeacherClasses(): UseTeacherClassesResult {
  const { classes: mockClasses } = useData();
  const { user } = useAuth();
  const { tcId, claId, schoolLevel: credSchoolLevel, hasCredentials } = useCredentials();
  const [apiClasses, setApiClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examStatus, setExamStatus] = useState<ExamStatus>('no-exams');
  const [hasFetched, setHasFetched] = useState(false);

  const fetchData = useCallback(async () => {
    const authTokens = getAuthTokens();
    const isApiMode = hasCredentials || !!authTokens?.accessToken;

    // API 모드가 아니면 DataContext fallback
    if (!isApiMode) {
      setApiClasses([]);
      setExamStatus('completed');
      return;
    }

    if (hasFetched) return;

    setIsLoading(true);
    setError(null);

    try {
      // 실제 로그인 사용자의 경우 user에서 tcId, claId 가져오기
      const effectiveTcId = tcId || user?.tcId || '';

      // tcId가 없으면 교사 정보가 없는 것으로 간주
      if (!effectiveTcId) {
        setApiClasses([]);
        setExamStatus('no-exams');
        setError('교사 정보가 없습니다. 관리자에게 문의해주세요.');
        setHasFetched(true);
        setIsLoading(false);
        return;
      }

      const effectiveClaId = claId || ''; // claId는 검사 목록에서 가져옴

      const exams = await fetchTeacherExams(effectiveClaId, effectiveTcId, '1');

      if (exams.length === 0) {
        setApiClasses([]);
        setExamStatus('no-exams');
        setHasFetched(true);
        return;
      }

      const completedExams = exams.filter(exam => exam.dgnssAt === 'N');

      if (completedExams.length === 0) {
        setApiClasses([]);
        setExamStatus('in-progress');
        setHasFetched(true);
        return;
      }

      setExamStatus('completed');

      // claId별로 회차별 dgnssId 그룹화
      const classExamMap = new Map<string, { round1?: number; round2?: number }>();
      for (const exam of completedExams) {
        if (!classExamMap.has(exam.claId)) {
          classExamMap.set(exam.claId, {});
        }
        const entry = classExamMap.get(exam.claId)!;
        if (exam.ordNo === 1) {
          entry.round1 = exam.dgnssId;
        } else if (exam.ordNo === 2) {
          entry.round2 = exam.dgnssId;
        }
      }

      // 학급 데이터 병렬 구축
      const classPromises = Array.from(classExamMap.entries()).map(async ([examClaId, dgnssIds]) => {
        const parts = examClaId.split('-');
        const grade = parseInt(parts[0], 10) || 1;
        const classNumber = parseInt(parts[1], 10) || 1;

        const primaryDgnssId = dgnssIds.round1 ?? dgnssIds.round2;
        if (!primaryDgnssId) return null;

        return buildClassFromAPI(
          examClaId,
          grade,
          classNumber,
          credSchoolLevel,
          primaryDgnssId,
          dgnssIds.round2
        );
      });

      const classResults = await Promise.all(classPromises);
      const validClasses = classResults.filter((c): c is Class => c !== null);

      setApiClasses(validClasses);
      setHasFetched(true);
    } catch (err) {
      console.error('Failed to fetch teacher classes:', err);
      setError(err instanceof Error ? err.message : 'API 호출 실패');
    } finally {
      setIsLoading(false);
    }
  }, [hasFetched, tcId, claId, credSchoolLevel, hasCredentials, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // API 데이터가 있으면 사용, 없으면 mockClasses fallback
  const classes = apiClasses.length > 0 ? apiClasses : mockClasses;

  return {
    classes,
    isLoading,
    error,
    examStatus,
    refetch: () => {
      setHasFetched(false);
      fetchData();
    },
  };
}
