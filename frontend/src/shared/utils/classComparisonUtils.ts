import type { Class, FactorCategory, ClassCategoryAverage, CategoryChartData } from '../types';
import { SUB_CATEGORY_FACTORS } from '@shared/data/factors';

// 5대 영역별 인덱스 매핑
export const MAIN_CATEGORY_INDICES: Record<FactorCategory, number[]> = {
  자아강점: [0, 1, 2, 3, 4, 5, 6],
  학습디딤돌: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  긍정적공부마음: [19, 20, 21, 22, 23, 24],
  학습걸림돌: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
  부정적공부마음: [35, 36, 37],
};

/**
 * 학급의 5대 영역별 평균 T점수 계산
 */
export const calculateCategoryAverages = (classData: Class): ClassCategoryAverage => {
  const categoryAverages: Record<FactorCategory, number> = {
    자아강점: 0,
    학습디딤돌: 0,
    학습걸림돌: 0,
    긍정적공부마음: 0,
    부정적공부마음: 0,
  };

  // 검사 완료 학생만 필터링
  const assessedStudents = classData.students.filter((s) => s.assessments.length > 0);
  if (assessedStudents.length === 0) {
    return {
      classId: classData.id,
      className: `${classData.grade}-${classData.classNumber}반`,
      categoryAverages,
    };
  }

  // 각 영역별 평균 계산
  Object.entries(MAIN_CATEGORY_INDICES).forEach(([category, indices]) => {
    let sum = 0;
    let count = 0;

    assessedStudents.forEach((student) => {
      // 최신 검사 결과 (round 2 우선, 없으면 round 1)
      const assessment = student.assessments.find((a) => a.round === 2) || student.assessments[0];

      // 해당 영역의 T점수 평균
      const categoryScores = indices.map((i) => assessment.tScores[i]);
      const studentAvg = categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length;

      sum += studentAvg;
      count++;
    });

    categoryAverages[category as FactorCategory] = Math.round(sum / count);
  });

  return {
    classId: classData.id,
    className: `${classData.grade}-${classData.classNumber}반`,
    categoryAverages,
  };
};

/**
 * 반별 5대 영역 데이터를 Recharts용 배열로 변환
 */
export const transformToCategoryChartData = (
  classesData: ClassCategoryAverage[],
): CategoryChartData[] => {
  const categories: FactorCategory[] = [
    '자아강점',
    '학습디딤돌',
    '긍정적공부마음',
    '학습걸림돌',
    '부정적공부마음',
  ];

  return categories.map((category) => {
    const dataPoint: CategoryChartData = { category };
    classesData.forEach((cls) => {
      dataPoint[cls.className] = cls.categoryAverages[category];
    });
    return dataPoint;
  });
};

// ============================================================
// 11개 중분류 유틸리티
// ============================================================

export const SUB_CATEGORY_ORDER = [
  '긍정적자아', '대인관계능력',
  '메타인지', '학습기술', '지지적관계',
  '학업열의', '성장력',
  '학업스트레스', '학습방해물', '학업관계스트레스',
  '학업소진',
];

export const SUB_CATEGORY_POLARITY: Record<string, 'positive' | 'negative'> = {
  긍정적자아: 'positive', 대인관계능력: 'positive',
  메타인지: 'positive', 학습기술: 'positive', 지지적관계: 'positive',
  학업열의: 'positive', 성장력: 'positive',
  학업스트레스: 'negative', 학습방해물: 'negative', 학업관계스트레스: 'negative',
  학업소진: 'negative',
};

export interface SubCategoryAverage {
  classId: string;
  className: string;
  subCategoryAverages: Record<string, number>;
}

export const calculateSubCategoryAverages = (classData: Class): SubCategoryAverage => {
  const subCategoryAverages: Record<string, number> = {};
  const assessedStudents = classData.students.filter((s) => s.assessments.length > 0);

  if (assessedStudents.length === 0) {
    for (const sub of SUB_CATEGORY_ORDER) subCategoryAverages[sub] = 50;
    return {
      classId: classData.id,
      className: `${classData.grade}-${classData.classNumber}반`,
      subCategoryAverages,
    };
  }

  for (const [sub, indices] of Object.entries(SUB_CATEGORY_FACTORS)) {
    let sum = 0, count = 0;
    for (const student of assessedStudents) {
      const assessment = student.assessments.find((a) => a.round === 2) || student.assessments[0];
      const vals = (indices as number[]).map((i) => assessment.tScores[i]);
      sum += vals.reduce((a, b) => a + b, 0) / vals.length;
      count++;
    }
    subCategoryAverages[sub] = Math.round(sum / count);
  }

  return {
    classId: classData.id,
    className: `${classData.grade}-${classData.classNumber}반`,
    subCategoryAverages,
  };
};

export const transformToSubCategoryChartData = (
  classesSubData: SubCategoryAverage[],
): CategoryChartData[] =>
  SUB_CATEGORY_ORDER.map((sub) => {
    const dataPoint: CategoryChartData = { category: sub as FactorCategory };
    classesSubData.forEach((cls) => {
      dataPoint[cls.className] = cls.subCategoryAverages[sub];
    });
    return dataPoint;
  });
