import type { Class, FactorCategory, ClassCategoryAverage, CategoryChartData } from '../types';
import type { SelfregCategory } from '../data/selfregFactors';

// ============================================================
// 학습종합검사 (38개 요인)
// ============================================================

// 5대 영역별 인덱스 매핑
export const MAIN_CATEGORY_INDICES: Record<FactorCategory, number[]> = {
  '자아강점': [0, 1, 2, 3, 4, 5, 6],
  '학습디딤돌': [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  '긍정적공부마음': [19, 20, 21, 22, 23, 24],
  '학습걸림돌': [25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
  '부정적공부마음': [35, 36, 37],
};

// 11개 중분류별 인덱스 매핑
export const SUB_CATEGORY_INDICES: Record<string, number[]> = {
  '긍정적자아': [0, 1, 2],
  '대인관계능력': [3, 4, 5, 6],
  '메타인지': [7, 8, 9],
  '학습기술': [10, 11, 12, 13, 14],
  '지지적관계': [15, 16, 17, 18],
  '학업열의': [19, 20, 21],
  '성장력': [22, 23, 24],
  '학업스트레스': [25, 26, 27],
  '학습방해물': [28, 29],
  '학업관계스트레스': [30, 31, 32, 33, 34],
  '학업소진': [35, 36, 37],
};

// 11개 중분류 순서
export const SUB_CATEGORY_ORDER = [
  '긍정적자아', '대인관계능력', '메타인지', '학습기술', '지지적관계',
  '학업열의', '성장력', '학업스트레스', '학습방해물', '학업관계스트레스', '학업소진',
];

// ============================================================
// 자기조절학습검사 (20개 요인)
// ============================================================

// 학습종합검사 38개 → 자기조절학습검사 20개 요인 변환 매핑
const SELFREG_MAPPING: Array<number | number[]> = [
  2,           // 0. 성장마인드셋 <- 성장마인드셋(2)
  1,           // 1. 학업효능감 <- 자기효능감(1)
  [19, 20],    // 2. 학습동기 <- 활기(19), 몰두(20) 평균
  25,          // 3. 성적부담조절 <- 성적부담(25) 역산
  26,          // 4. 공부부담조절 <- 공부부담(26) 역산
  [35, 36],    // 5. 실패부담조절 <- 고갈(35), 무능감(36) 평균 역산
  7,           // 6. 계획능력 <- 계획능력(7)
  8,           // 7. 점검능력 <- 점검능력(8)
  9,           // 8. 조절능력 <- 조절능력(9)
  [7, 8, 9],   // 9. 이해기술 <- 메타인지 평균
  [0, 1],      // 10. 기억기술 <- 자아존중감(0), 자기효능감(1) 평균
  [19, 20, 21], // 11. 집중기술 <- 학업열의 평균
  22,          // 12. 자기칭찬 <- 자율성(22)
  [17, 18],    // 13. 도움구하기 <- 친구정서지지(17), 교사정서지지(18) 평균
  [19, 21],    // 14. 학습지속성 <- 활기(19), 의미감(21) 평균
  10,          // 15. 공부환경 <- 공부환경(10)
  11,          // 16. 시간관리 <- 시간관리(11)
  12,          // 17. 수업태도 <- 수업태도(12)
  13,          // 18. 노트하기 <- 노트하기(13)
  14,          // 19. 시험준비 <- 시험준비(14)
];

// 부적 요인 인덱스 (역산 필요)
const SELFREG_NEGATIVE_SOURCES = [25, 26, 35, 36];

/**
 * 학습종합검사 38개 T점수를 자기조절학습검사 20개로 변환
 */
export const convertToSelfregScores = (tScores: number[]): number[] => {
  return SELFREG_MAPPING.map((source) => {
    if (typeof source === 'number') {
      const val = tScores[source] ?? 50;
      // 부적 요인은 역산
      if (SELFREG_NEGATIVE_SOURCES.includes(source)) {
        return Math.round(100 - val);
      }
      return Math.round(val);
    } else {
      // 배열인 경우 평균
      const avg = source.reduce((sum, i) => sum + (tScores[i] ?? 50), 0) / source.length;
      // 부적 요인 포함 시 역산
      if (source.some(i => SELFREG_NEGATIVE_SOURCES.includes(i))) {
        return Math.round(100 - avg);
      }
      return Math.round(avg);
    }
  });
};

// 자기조절학습검사 3대 영역별 인덱스 매핑
export const SELFREG_MAIN_CATEGORY_INDICES: Record<SelfregCategory, number[]> = {
  '동기전략': [0, 1, 2, 3, 4, 5],
  '인지전략': [6, 7, 8, 9, 10, 11],
  '행동전략': [12, 13, 14, 15, 16, 17, 18, 19],
};

// 자기조절학습검사 6개 중분류별 인덱스 매핑
export const SELFREG_SUB_CATEGORY_INDICES: Record<string, number[]> = {
  '학습원동력': [0, 1, 2],
  '정서조절': [3, 4, 5],
  '메타인지': [6, 7, 8],
  '인지적학습기술': [9, 10, 11],
  '행동조절': [12, 13, 14],
  '행동적학습기술': [15, 16, 17, 18, 19],
};

// 자기조절학습검사 6개 중분류 순서
export const SELFREG_SUB_CATEGORY_ORDER = [
  '학습원동력', '정서조절', '메타인지', '인지적학습기술', '행동조절', '행동적학습기술',
];

// 자기조절학습검사 3대 영역 순서
export const SELFREG_MAIN_CATEGORY_ORDER: SelfregCategory[] = ['동기전략', '인지전략', '행동전략'];

/**
 * 학급의 5대 영역별 평균 T점수 계산
 */
export const calculateCategoryAverages = (classData: Class): ClassCategoryAverage => {
  const categoryAverages: Record<FactorCategory, number> = {
    '자아강점': 0,
    '학습디딤돌': 0,
    '학습걸림돌': 0,
    '긍정적공부마음': 0,
    '부정적공부마음': 0,
  };

  // 검사 완료 학생만 필터링
  const assessedStudents = classData.students.filter(s => s.assessments.length > 0);
  if (assessedStudents.length === 0) {
    return {
      classId: classData.id,
      className: `${classData.grade}학년 ${classData.classNumber}반`,
      categoryAverages,
    };
  }

  // 각 영역별 평균 계산
  Object.entries(MAIN_CATEGORY_INDICES).forEach(([category, indices]) => {
    let sum = 0;
    let count = 0;

    assessedStudents.forEach(student => {
      // 최신 검사 결과 (round 2 우선, 없으면 round 1)
      const assessment = student.assessments.find(a => a.round === 2) || student.assessments[0];

      // 해당 영역의 T점수 평균
      const categoryScores = indices.map(i => assessment.tScores[i]);
      const studentAvg = categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length;

      sum += studentAvg;
      count++;
    });

    categoryAverages[category as FactorCategory] = Math.round(sum / count);
  });

  return {
    classId: classData.id,
    className: `${classData.grade}학년 ${classData.classNumber}반`,
    categoryAverages,
  };
};

/**
 * 반별 5대 영역 데이터를 Recharts용 배열로 변환
 */
export const transformToCategoryChartData = (
  classesData: ClassCategoryAverage[]
): CategoryChartData[] => {
  const categories: FactorCategory[] = [
    '자아강점',
    '학습디딤돌',
    '긍정적공부마음',
    '학습걸림돌',
    '부정적공부마음',
  ];

  return categories.map(category => {
    const dataPoint: CategoryChartData = { category };
    classesData.forEach(cls => {
      dataPoint[cls.className] = cls.categoryAverages[category];
    });
    return dataPoint;
  });
};

/**
 * 학급의 11개 중분류별 평균 T점수 계산
 */
export const calculateSubCategoryAverages = (classData: Class): Record<string, number> => {
  const subCategoryAverages: Record<string, number> = {};

  // 검사 완료 학생만 필터링
  const assessedStudents = classData.students.filter(s => s.assessments.length > 0);
  if (assessedStudents.length === 0) {
    SUB_CATEGORY_ORDER.forEach(sub => {
      subCategoryAverages[sub] = 0;
    });
    return subCategoryAverages;
  }

  // 각 중분류별 평균 계산
  Object.entries(SUB_CATEGORY_INDICES).forEach(([subCategory, indices]) => {
    let sum = 0;
    let count = 0;

    assessedStudents.forEach(student => {
      const assessment = student.assessments.find(a => a.round === 2) || student.assessments[0];
      const subCategoryScores = indices.map(i => assessment.tScores[i]);
      const studentAvg = subCategoryScores.reduce((a, b) => a + b, 0) / subCategoryScores.length;

      sum += studentAvg;
      count++;
    });

    subCategoryAverages[subCategory] = Math.round(sum / count);
  });

  return subCategoryAverages;
};

/**
 * 반별 11개 중분류 데이터를 Recharts용 배열로 변환
 */
export const transformToSubCategoryChartData = (
  classes: Class[]
): Array<{ category: string; [key: string]: string | number }> => {
  const classSubAverages = classes.map(cls => ({
    className: `${cls.grade}학년 ${cls.classNumber}반`,
    averages: calculateSubCategoryAverages(cls),
  }));

  return SUB_CATEGORY_ORDER.map(subCategory => {
    const dataPoint: { category: string; [key: string]: string | number } = { category: subCategory };
    classSubAverages.forEach(cls => {
      dataPoint[cls.className] = cls.averages[subCategory];
    });
    return dataPoint;
  });
};

// ============================================================
// 자기조절학습검사용 계산 함수들
// ============================================================

/**
 * 학급의 자기조절학습검사 3대 영역별 평균 T점수 계산
 */
export const calculateSelfregCategoryAverages = (classData: Class): {
  classId: string;
  className: string;
  categoryAverages: Record<SelfregCategory, number>;
} => {
  const categoryAverages: Record<SelfregCategory, number> = {
    '동기전략': 0,
    '인지전략': 0,
    '행동전략': 0,
  };

  const assessedStudents = classData.students.filter(s => s.assessments.length > 0);
  if (assessedStudents.length === 0) {
    return {
      classId: classData.id,
      className: `${classData.grade}학년 ${classData.classNumber}반`,
      categoryAverages,
    };
  }

  Object.entries(SELFREG_MAIN_CATEGORY_INDICES).forEach(([category, indices]) => {
    let sum = 0;
    let count = 0;

    assessedStudents.forEach(student => {
      const assessment = student.assessments.find(a => a.round === 2) || student.assessments[0];
      // 38개 T점수를 20개로 변환
      const selfregScores = convertToSelfregScores(assessment.tScores);
      const categoryScores = indices.map(i => selfregScores[i]);
      const studentAvg = categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length;

      sum += studentAvg;
      count++;
    });

    categoryAverages[category as SelfregCategory] = Math.round(sum / count);
  });

  return {
    classId: classData.id,
    className: `${classData.grade}학년 ${classData.classNumber}반`,
    categoryAverages,
  };
};

/**
 * 반별 자기조절학습검사 3대 영역 데이터를 Recharts용 배열로 변환
 */
export const transformToSelfregCategoryChartData = (
  classes: Class[]
): CategoryChartData[] => {
  const classAverages = classes.map(calculateSelfregCategoryAverages);

  return SELFREG_MAIN_CATEGORY_ORDER.map(category => {
    const dataPoint: CategoryChartData = { category };
    classAverages.forEach(cls => {
      dataPoint[cls.className] = cls.categoryAverages[category];
    });
    return dataPoint;
  });
};

/**
 * 학급의 자기조절학습검사 6개 중분류별 평균 T점수 계산
 */
export const calculateSelfregSubCategoryAverages = (classData: Class): Record<string, number> => {
  const subCategoryAverages: Record<string, number> = {};

  const assessedStudents = classData.students.filter(s => s.assessments.length > 0);
  if (assessedStudents.length === 0) {
    SELFREG_SUB_CATEGORY_ORDER.forEach(sub => {
      subCategoryAverages[sub] = 0;
    });
    return subCategoryAverages;
  }

  Object.entries(SELFREG_SUB_CATEGORY_INDICES).forEach(([subCategory, indices]) => {
    let sum = 0;
    let count = 0;

    assessedStudents.forEach(student => {
      const assessment = student.assessments.find(a => a.round === 2) || student.assessments[0];
      const selfregScores = convertToSelfregScores(assessment.tScores);
      const subCategoryScores = indices.map(i => selfregScores[i]);
      const studentAvg = subCategoryScores.reduce((a, b) => a + b, 0) / subCategoryScores.length;

      sum += studentAvg;
      count++;
    });

    subCategoryAverages[subCategory] = Math.round(sum / count);
  });

  return subCategoryAverages;
};

/**
 * 반별 자기조절학습검사 6개 중분류 데이터를 Recharts용 배열로 변환
 */
export const transformToSelfregSubCategoryChartData = (
  classes: Class[]
): Array<{ category: string; [key: string]: string | number }> => {
  const classSubAverages = classes.map(cls => ({
    className: `${cls.grade}학년 ${cls.classNumber}반`,
    averages: calculateSelfregSubCategoryAverages(cls),
  }));

  return SELFREG_SUB_CATEGORY_ORDER.map(subCategory => {
    const dataPoint: { category: string; [key: string]: string | number } = { category: subCategory };
    classSubAverages.forEach(cls => {
      dataPoint[cls.className] = cls.averages[subCategory];
    });
    return dataPoint;
  });
};
