import { useState } from 'react';
import { useTeacherClasses } from '@features/api';
import { aggregateTypeDistributionByRound } from '@features/home/utils/aggregateTypeDistributionByRound';
import type { Class, SchoolLevel } from '@shared/types';
import { rankTypes } from '../data/lpaTypeOrder';
import type { RankedType } from '../types';

export interface UseClassCoachingDataResult {
  classData: Class | null;
  schoolLevel: SchoolLevel | null;
  isHighSchool: boolean;
  round: 1 | 2;
  setRound: (round: 1 | 2) => void;
  round2Available: boolean;
  rankedTypes: RankedType[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useClassCoachingData(classId: string | undefined): UseClassCoachingDataResult {
  const { classes, isLoading, error, refetch } = useTeacherClasses();
  const [round, setRound] = useState<1 | 2>(1);

  const classData = classId ? (classes.find((c) => c.id === classId) ?? null) : null;
  const schoolLevel = classData?.schoolLevel ?? null;
  const isHighSchool = schoolLevel === '고등';

  const round2Available =
    classData?.students.some((student) =>
      student.assessments.some((assessment) => assessment.round === 2),
    ) ?? false;

  let rankedTypes: RankedType[] = [];
  if (classData && (schoolLevel === '초등' || schoolLevel === '중등')) {
    const [distribution] = aggregateTypeDistributionByRound([classData]);
    const counts = (round === 1 ? distribution.round1.types : distribution.round2.types) ?? [];
    rankedTypes = rankTypes(counts, schoolLevel);
  }

  return {
    classData,
    schoolLevel,
    isHighSchool,
    round,
    setRound,
    round2Available,
    rankedTypes,
    isLoading,
    error,
    refetch,
  };
}
