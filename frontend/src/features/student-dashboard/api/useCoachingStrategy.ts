import { useState } from 'react';
import { fetchStudentAnalysis, type ModerationPath } from '@shared/services/dashboardService';

/**
 * 코칭 전략 데이터 훅
 * 버튼 클릭 시 graphYn='Y'로 Neo4j 추천 경로를 조회
 */
export function useCoachingStrategy(
  classId: string,
  studentId: string,
  round: 1 | 2 = 1,
) {
  const [isLoading, setIsLoading] = useState(false);
  const [moderationPaths, setModerationPaths] = useState<ModerationPath[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchCoachingStrategy = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchStudentAnalysis(
        classId,
        studentId,
        '1', // paperIdx
        round,
        'Y', // graphYn='Y' → Neo4j 추천 포함
      );

      if (data.recommendations) {
        const roundKey = String(round);
        const recommendation = data.recommendations[roundKey];
        if (recommendation?.moderationPaths) {
          setModerationPaths(recommendation.moderationPaths);
        } else {
          setModerationPaths([]);
        }
      } else {
        setModerationPaths([]);
      }
    } catch (err) {
      console.error('[useCoachingStrategy] API 호출 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setModerationPaths([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    moderationPaths,
    isLoading,
    error,
    fetchCoachingStrategy,
  };
}
