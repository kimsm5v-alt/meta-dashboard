import type { Student, TypeDistribution } from '@shared/types';

export const getRoundTypeDistribution = (students: Student[], round: 1 | 2): TypeDistribution => {
  const counts: Record<string, number> = {};
  let total = 0;

  for (const student of students) {
    const assessment = student.assessments.find((item) => item.round === round);
    if (!assessment) continue;

    counts[assessment.predictedType] = (counts[assessment.predictedType] ?? 0) + 1;
    total += 1;
  }

  const distribution: TypeDistribution = {};
  for (const [type, count] of Object.entries(counts)) {
    distribution[type] = {
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  }

  return distribution;
};
