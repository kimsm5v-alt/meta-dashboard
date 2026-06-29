import { useMemo } from 'react';
import type { Class } from '@/shared/types';
import { FACTOR_DEFINITIONS } from '@/shared/data/factors';
import { SELFREG_FACTOR_DEFINITIONS, SELFREG_DOMAIN_STRUCTURE } from '@/shared/data/selfregFactors';
import { getFactorDefinition } from '@/shared/data/factorDefinitions';
import { convertToSelfregScores } from '@/shared/utils/classComparisonUtils';

type TestId = 'comprehensive' | 'selfreg';

// 자기조절학습검사 중분류 → 대분류 매핑
const SELFREG_SUB_TO_MAIN: Record<string, string> = {};
SELFREG_DOMAIN_STRUCTURE.forEach(domain => {
  domain.subCategories.forEach(subCat => {
    SELFREG_SUB_TO_MAIN[subCat.name] = domain.id;
  });
});

// 자기조절학습검사 중분류별 요인 매핑
const SELFREG_SUB_CAT_FACTORS: Record<string, string[]> = {};
SELFREG_DOMAIN_STRUCTURE.forEach(domain => {
  domain.subCategories.forEach(subCat => {
    SELFREG_SUB_CAT_FACTORS[subCat.name] = subCat.factors.map(f => f.name);
  });
});

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

// 제거됨: 이제 소분류 단위가 아닌 개별 요인 단위로 TOP3 산출하므로 불필요

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
 * 자기조절학습검사용 학급 특성 분석 순수 함수
 * - 중분류 6개 단위로 학급 평균 T점수를 산출
 * - 자기조절학습검사는 모두 positive이므로 높을수록 강점
 */
export function computeSelfregClassProfile(
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

  // 20개 요인별 평균 계산
  const factorAvgs: Record<string, number> = {};
  for (const factor of SELFREG_FACTOR_DEFINITIONS) {
    let sum = 0;
    let count = 0;
    for (const student of validStudents) {
      const assessment = student.assessments.find((a) => a.round === round);
      if (assessment && assessment.tScores) {
        const selfregScores = convertToSelfregScores(assessment.tScores);
        if (selfregScores[factor.index] != null) {
          sum += selfregScores[factor.index];
          count++;
        }
      }
    }
    factorAvgs[factor.name] = count > 0 ? sum / count : 50;
  }

  const categoryData: CategoryDataItem[] = [];

  for (const [cat, factorNames] of Object.entries(SELFREG_SUB_CAT_FACTORS)) {
    const isPositive = true; // 자기조절학습검사는 모두 positive

    const factorTs = factorNames.map((fn) => factorAvgs[fn] ?? 50);
    const avgT = factorTs.reduce((a, b) => a + b, 0) / factorTs.length;
    const meritScore = avgT; // positive이므로 높을수록 좋음

    const factors = factorNames.map((fn) => ({
      name: fn,
      avgT: factorAvgs[fn] ?? 50,
    }));

    categoryData.push({ category: cat, avgT, isPositive, meritScore, factors });
  }

  const sorted = [...categoryData].sort((a, b) => b.meritScore - a.meritScore);

  const strengths = sorted.slice(0, 3);
  const weaknesses = sorted.slice(-3).reverse();

  // toProfileItem을 자기조절 버전으로 대체
  const toSelfregProfileItem = (
    item: CategoryDataItem,
    type: 'strength' | 'weakness',
  ): ClassProfileItem => {
    const top = pickTopFactor(item, type);
    return {
      category: item.category,
      parentCategory: SELFREG_SUB_TO_MAIN[item.category] ?? '',
      avgT: Math.round(item.avgT),
      isPositive: item.isPositive,
      categoryScript: '', // 자기조절은 별도 스크립트 없음
      topFactor: top.name,
      topFactorT: Math.round(top.avgT),
      topFactorScript: '',
    };
  };

  return {
    strengths: strengths.map((s) => toSelfregProfileItem(s, 'strength')),
    weaknesses: weaknesses.map((w) => toSelfregProfileItem(w, 'weakness')),
  };
}

/**
 * 학급 특성 분석 훅 (computeClassProfile을 useMemo로 래핑)
 */
export function useClassProfile(
  classData: Class | undefined | null,
  round: 1 | 2 | null = 1,
  testId: TestId = 'comprehensive',
): ClassProfile | null {
  return useMemo(() => {
    if (!classData || round === null) return null;
    if (testId === 'selfreg') {
      return computeSelfregClassProfile(classData, round);
    }
    return computeClassProfile(classData, round);
  }, [classData, round, testId]);
}
