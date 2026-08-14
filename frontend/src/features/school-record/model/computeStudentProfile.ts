import type { Student } from '@shared/types';
import { FACTOR_DEFINITIONS } from '@shared/data/factors';
import type { StudentProfile, StudentProfileItem } from '../types';

/**
 * 학생 1명의 강점/보완 요인 TOP3 — 반 평균 랭킹(computeClassProfile)과 동일한
 * merit-score 규칙(부적 요인은 100-avgT)을 단일 학생의 한 라운드 T점수에 적용한다.
 * 라운드: 2차가 있으면 2차, 없으면 1차.
 */
export function computeStudentProfile(student: Student): StudentProfile | null {
  const round2 = student.assessments.find((a) => a.round === 2);
  const round1 = student.assessments.find((a) => a.round === 1);
  const assessment = round2 ?? round1;
  if (!assessment) return null;

  const items = FACTOR_DEFINITIONS.map((factor) => {
    const avgT = assessment.tScores[factor.index] ?? 50;
    const meritScore = factor.isPositive ? avgT : 100 - avgT;
    return { factor, avgT, meritScore };
  });

  const sorted = [...items].sort((a, b) => b.meritScore - a.meritScore);

  const toItem = (entry: (typeof sorted)[number]): StudentProfileItem => ({
    factorName: entry.factor.name,
    avgT: Math.round(entry.avgT),
    isPositive: entry.factor.isPositive,
  });

  return {
    strengths: sorted.slice(0, 3).map(toItem),
    weaknesses: sorted.slice(-3).reverse().map(toItem),
  };
}
