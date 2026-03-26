/**
 * 학급 분석 데이터 훅
 *
 * 학급 평균 T점수를 조회합니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchClassAnalysis, fetchClassAnalysisRaw } from '@/shared/services/dashboardService';
import type { AnalysisSectionItem } from '@/shared/types/api';
import { createDefaultTScores } from '@/shared/constants';

export interface UseClassAnalysisResult {
  tScores: number[];
  sections: AnalysisSectionItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * 학급 평균 T점수 조회
 */
export function useClassAnalysis(
  classId: string | undefined,
  round: 1 | 2 = 1
): UseClassAnalysisResult {
  const [tScores, setTScores] = useState<number[]>(createDefaultTScores());
  const [sections, setSections] = useState<AnalysisSectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!classId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [scores, rawSections] = await Promise.all([
        fetchClassAnalysis(classId, '1', round),
        fetchClassAnalysisRaw(classId, '1', round),
      ]);

      setTScores(scores);
      setSections(rawSections);
    } catch (err) {
      console.error('Failed to fetch class analysis:', err);
      setError(err instanceof Error ? err.message : 'API 호출 실패');
    } finally {
      setIsLoading(false);
    }
  }, [classId, round]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    tScores,
    sections,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// ============================================================
// 학급 상세 데이터 훅 (L2.5용)
// ============================================================

export interface UseClassDetailResult {
  classTScores: number[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * 학급 상세 분석용 데이터 조회
 */
export function useClassDetail(
  classId: string | undefined,
  round: 1 | 2 = 1
): UseClassDetailResult {
  const { tScores, isLoading, error, refetch } = useClassAnalysis(classId, round);

  return {
    classTScores: tScores,
    isLoading,
    error,
    refetch,
  };
}
