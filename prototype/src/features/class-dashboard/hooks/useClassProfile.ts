import { useMemo } from 'react';
import type { Class } from '@/shared/types';
import { FACTOR_DEFINITIONS } from '@/shared/data/factors';
import { getFactorDefinition } from '@/shared/data/factorDefinitions';

// 제거됨: 이제 소분류 단위가 아닌 개별 요인 단위로 TOP3 산출

export interface ClassProfileItem {
  factorName: string; // 소분류 요인명 (예: 자아존중감, 성적부담 등)
  category: string; // 대분류 (예: 자아강점, 학습걸림돌 등)
  subCategory: string; // 중분류 (예: 긍정적자아, 학업스트레스 등)
  avgT: number; // 학급 평균 T점수
  isPositive: boolean; // 정적요인(true) / 부적요인(false)
  definition: string; // 요인 정의 (조작적 정의)
}

export interface ClassProfile {
  strengths: ClassProfileItem[];
  weaknesses: ClassProfileItem[];
}

// 제거됨: 스크립트 매칭 함수 불필요 (요인 정의로 대체)

/**
 * 학급 특성 분석 순수 함수 (소분류 38개 요인 기준)
 * - 소분류 38개 단위로 학급 평균 T점수를 산출
 * - merit score로 강점 TOP 3 / 약점 TOP 3 결정
 * - 신뢰도 주의(🔴) 학생은 평균 계산에서 제외
 */
export function computeClassProfile(
  classData: Class,
  round: 1 | 2 = 1,
): ClassProfile | null {
  const studentsWithAssessment = classData.students.filter((s) =>
    s.assessments.some((a) => a.round === round),
  );

  if (studentsWithAssessment.length === 0) return null;

  const reliableStudents = studentsWithAssessment.filter((s) => {
    const assessment = s.assessments.find((a) => a.round === round)!;
    return assessment.reliabilityWarnings.length === 0;
  });

  const validStudents = reliableStudents.length > 0 ? reliableStudents : studentsWithAssessment;

  // 1) 38개 요인별 학급 평균 T점수 계산
  const factorData: Array<{
    factorName: string;
    category: string;
    subCategory: string;
    avgT: number;
    isPositive: boolean;
    meritScore: number;
    definition: string;
  }> = [];

  for (const factor of FACTOR_DEFINITIONS) {
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
    const definition = getFactorDefinition(factor.name);

    factorData.push({
      factorName: factor.name,
      category: factor.category,
      subCategory: factor.subCategory,
      avgT,
      isPositive: factor.isPositive,
      meritScore,
      definition,
    });
  }

  // 2) merit score 기준으로 정렬
  const sorted = [...factorData].sort((a, b) => b.meritScore - a.meritScore);

  // 3) 강점 TOP 3 (merit 높은 순)
  const strengths = sorted.slice(0, 3).map((item) => ({
    factorName: item.factorName,
    category: item.category,
    subCategory: item.subCategory,
    avgT: Math.round(item.avgT),
    isPositive: item.isPositive,
    definition: item.definition,
  }));

  // 4) 약점 TOP 3 (merit 낮은 순)
  const weaknesses = sorted
    .slice(-3)
    .reverse()
    .map((item) => ({
      factorName: item.factorName,
      category: item.category,
      subCategory: item.subCategory,
      avgT: Math.round(item.avgT),
      isPositive: item.isPositive,
      definition: item.definition,
    }));

  return {
    strengths,
    weaknesses,
  };
}

/**
 * 학급 특성 분석 훅 (computeClassProfile을 useMemo로 래핑)
 */
export function useClassProfile(
  classData: Class,
  round: 1 | 2 = 1,
): ClassProfile | null {
  return useMemo(() => computeClassProfile(classData, round), [classData, round]);
}
