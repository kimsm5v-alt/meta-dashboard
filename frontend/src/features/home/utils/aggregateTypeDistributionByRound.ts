import type { Class, StudentType } from '@shared/types';

export interface RoundTypeCounts {
  types: { name: StudentType; count: number }[] | null; // null = 해당 회차 검사 미실시
}

export interface ClassRoundDistribution {
  classId: string;
  className: string;
  round1: RoundTypeCounts;
  round2: RoundTypeCounts;
}

const countByType = (classData: Class, round: 1 | 2): RoundTypeCounts => {
  const counts = new Map<StudentType, number>();
  let hasAnyAssessment = false;

  classData.students.forEach((student) => {
    const assessment = student.assessments.find((a) => a.round === round);
    if (!assessment) return;
    hasAnyAssessment = true;
    if (assessment.predictedType === '미지원') return; // 자기조절검사 등 유형 미제공
    counts.set(assessment.predictedType, (counts.get(assessment.predictedType) ?? 0) + 1);
  });

  if (!hasAnyAssessment) {
    return { types: null };
  }

  return {
    types: Array.from(counts.entries()).map(([name, count]) => ({ name, count })),
  };
};

export function aggregateTypeDistributionByRound(classes: Class[]): ClassRoundDistribution[] {
  return classes.map((classData) => ({
    classId: classData.id,
    className: `${classData.grade}-${classData.classNumber}반`,
    round1: countByType(classData, 1),
    round2: countByType(classData, 2),
  }));
}
