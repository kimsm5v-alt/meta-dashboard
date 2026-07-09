/**
 * 교사 학급 목록 훅 (L1 대시보드용)
 *
 * 교사의 학급 목록을 조회합니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { getAuthTokens } from '@/shared/services/apiClient';
import { fetchTeacherExams, buildClassFromAPI } from '@/shared/services/dashboardService';
import { getMyGroups } from '@/features/groups/services/groupService';
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
    // Mock 모드면 API 호출 스킵 (VITE_USE_API=false 또는 VITE_USE_MOCK_DATA=true)
    const useApi = import.meta.env.VITE_USE_API !== 'false';
    const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';
    if (!useApi || useMockData) {
      setApiClasses([]);
      setExamStatus('completed');
      return;
    }

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

      // 1. 교사의 그룹 목록을 먼저 조회하여 claId 목록 및 학년/반/학교급 정보 확보
      let claIds: string[] = [];
      const groupMap = new Map<string, { grade: number; classNumber: number; schoolLevel: SchoolLevel }>();

      if (claId) {
        // useCredentials에서 claId가 있으면 그것 사용
        claIds = [claId];
      } else {
        // 그룹 목록에서 claId 목록 가져오기
        try {
          const groups = await getMyGroups(effectiveTcId);
          claIds = groups.map(g => g.claId);
          // 그룹 정보를 Map에 저장 (claId -> {grade, classNumber, schoolLevel})
          groups.forEach(g => {
            groupMap.set(g.claId, {
              grade: g.grade,
              classNumber: g.classNumber,
              schoolLevel: g.schoolLevel
            });
          });
        } catch (err) {
          console.warn('Failed to fetch groups, trying without claId:', err);
          claIds = ['']; // fallback
        }
      }

      // 2. 각 claId에 대해 검사 목록 조회 후 병합
      const allExams: Awaited<ReturnType<typeof fetchTeacherExams>> = [];
      for (const cId of claIds) {
        try {
          const exams = await fetchTeacherExams(cId, effectiveTcId, '1');
          allExams.push(...exams);
        } catch (err) {
          console.warn(`Failed to fetch exams for claId ${cId}:`, err);
        }
      }

      const exams = allExams;

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
        // groupMap에서 학년/반/학교급 정보 가져오기, 없으면 기본값 사용
        const groupInfo = groupMap.get(examClaId);
        const grade = groupInfo?.grade ?? 1;
        const classNumber = groupInfo?.classNumber ?? 1;
        const schoolLevel = groupInfo?.schoolLevel ?? credSchoolLevel;

        const primaryDgnssId = dgnssIds.round1 ?? dgnssIds.round2;
        if (!primaryDgnssId) return null;

        return buildClassFromAPI(
          examClaId,
          grade,
          classNumber,
          schoolLevel,
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
