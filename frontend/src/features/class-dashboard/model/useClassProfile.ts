import { useMemo } from 'react';
import type { Class } from '@shared/types';
import { FACTOR_DEFINITIONS } from '@shared/data/factors';
import { FACTOR_OPERATIONAL_DEFINITIONS } from '@shared/data/factorDefinitions';

export interface ClassProfileItem {
  factorName: string;
  subCategory: string;
  parentCategory: string;
  avgT: number;
  isPositive: boolean;
  definition: string;
}

export interface ClassProfile {
  strengths: ClassProfileItem[];
  weaknesses: ClassProfileItem[];
}

/**
 * 학급 특성 분석 순수 함수
 * - 소분류 38개 요인 단위로 학급 평균 T점수를 산출 (HSJ-107)
 * - merit score로 강점 TOP 3 / 약점 TOP 3 결정
 * - 부적요인은 T점수가 낮을수록 강점 (meritScore = 100 - avgT)
 * - 신뢰도 주의 학생은 평균 계산에서 제외
 */
export function computeClassProfile(classData: Class, round: 1 | 2 = 1): ClassProfile | null {
  const studentsWithAssessment = classData.students.filter((s) =>
    s.assessments.some((a) => a.round === round),
  );

  if (studentsWithAssessment.length === 0) return null;

  const reliableStudents = studentsWithAssessment.filter((s) => {
    const assessment = s.assessments.find((a) => a.round === round)!;
    return assessment.reliabilityWarnings.length === 0;
  });

  const validStudents = reliableStudents.length > 0 ? reliableStudents : studentsWithAssessment;

  const factorItems = FACTOR_DEFINITIONS.map((factor) => {
    let sum = 0;
    let count = 0;
    for (const student of validStudents) {
      const assessment = student.assessments.find((a) => a.round === round);
      if (assessment && assessment.tScores[factor.index] != null) {
        sum += assessment.tScores[factor.index];
        count++;
      }
    }
    const avgT = count > 0 ? sum / count : 50;
    const meritScore = factor.isPositive ? avgT : 100 - avgT;
    return { factor, avgT, meritScore };
  });

  const sorted = [...factorItems].sort((a, b) => b.meritScore - a.meritScore);
  const strengthItems = sorted.slice(0, 3);
  const weaknessItems = sorted.slice(-3).reverse();

  const toItem = (entry: (typeof sorted)[0]): ClassProfileItem => ({
    factorName: entry.factor.name,
    subCategory: entry.factor.subCategory,
    parentCategory: entry.factor.category,
    avgT: Math.round(entry.avgT),
    isPositive: entry.factor.isPositive,
    definition: FACTOR_OPERATIONAL_DEFINITIONS[entry.factor.name] ?? '',
  });

  return {
    strengths: strengthItems.map(toItem),
    weaknesses: weaknessItems.map(toItem),
  };
}

/**
 * 학급 특성 분석 훅 (computeClassProfile을 useMemo로 래핑)
 */
export function useClassProfile(classData: Class, round: 1 | 2 = 1): ClassProfile | null {
  return useMemo(() => computeClassProfile(classData, round), [classData, round]);
}
