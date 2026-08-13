import { SUB_CATEGORY_FACTORS } from '@shared/data/factors';
import type { Class } from '@shared/types';

/**
 * shared/utils/classComparisonUtils.ts의 calculateSubCategoryAverages는 "최신 검사
 * (2차 우선, 없으면 1차)" 고정이라 라운드별 비교에는 못 쓴다. 이 함수는 라운드를
 * 인자로 받아 그 라운드에 실제로 응시한 학생만으로 11개 중분류 평균을 계산한다.
 */
export function calculateSubCategoryAveragesByRound(
  classData: Class,
  round: 1 | 2,
): Record<string, number> | null {
  const assessedStudents = classData.students.filter((s) =>
    s.assessments.some((a) => a.round === round),
  );
  if (assessedStudents.length === 0) return null;

  // Fix 1: Add reliability filtering (match computeClassProfile)
  const reliableStudents = assessedStudents.filter((s) => {
    const assessment = s.assessments.find((a) => a.round === round)!;
    return assessment.reliabilityWarnings.length === 0;
  });

  const validStudents = reliableStudents.length > 0 ? reliableStudents : assessedStudents;

  const averages: Record<string, number> = {};

  for (const [sub, indices] of Object.entries(SUB_CATEGORY_FACTORS)) {
    let sum = 0;
    let count = 0;
    for (const student of validStudents) {
      const assessment = student.assessments.find((a) => a.round === round);
      if (!assessment) continue;
      // Fix 2: Add null guard on tScores (match computeClassProfile pattern)
      const values = indices.map((i) => assessment.tScores[i]).filter((v) => v != null);
      if (values.length > 0) {
        sum += values.reduce((a, b) => a + b, 0) / values.length;
        count++;
      }
    }
    averages[sub] = count > 0 ? Math.round(sum / count) : 50;
  }

  return averages;
}
