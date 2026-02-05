/**
 * 생활기록부 문구 생성 유틸리티
 *
 * 학생의 검사 결과를 분석하여 강점 영역을 추출하고
 * 해당 영역에 맞는 예시 문장을 필터링합니다.
 */

import type { Student, Assessment, FactorCategory } from '@/shared/types';
import {
  EXAMPLE_SENTENCES,
  POSITIVE_SUB_CATEGORIES,
  NEGATIVE_SUB_CATEGORIES,
  type SubCategory,
  type SchoolLevelKr,
  type ExampleSentence,
  type FactorType,
} from '@/shared/data/schoolRecordSentences';
import { SUB_CATEGORY_FACTORS } from '@/shared/data/factors';

// ============================================================
// 타입 정의
// ============================================================

export interface StrengthItem {
  name: SubCategory;
  tScore: number;
  normalizedScore: number;
  level: string;
  type: FactorType;
}

export interface ChangeItem {
  category: string;
  from: number;
  to: number;
  change: string;
  direction: 'positive' | 'negative';
  interpretation: '개선' | '하락';
}

export interface AnalysisResult {
  hasChange: boolean;
  changes: ChangeItem[];
  typeChange?: {
    from: string;
    to: string;
    changed: boolean;
  };
}

// ============================================================
// 중분류 T점수 계산
// ============================================================

/**
 * 38개 T점수 배열에서 11개 중분류 평균 T점수 계산
 */
export const calculateSubCategoryScores = (
  tScores: number[]
): Record<SubCategory, number> => {
  const result: Partial<Record<SubCategory, number>> = {};

  // SUB_CATEGORY_FACTORS에서 각 중분류의 요인 인덱스를 가져와 평균 계산
  for (const [subCategory, factorIndices] of Object.entries(SUB_CATEGORY_FACTORS)) {
    const scores = factorIndices.map((idx: number) => tScores[idx] ?? 50);
    const avg = scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length;
    result[subCategory as SubCategory] = Math.round(avg * 10) / 10;
  }

  return result as Record<SubCategory, number>;
};

/**
 * T점수를 수준 문자열로 변환
 */
export const tScoreToLevelString = (tScore: number): string => {
  if (tScore >= 70) return '매우높음';
  if (tScore >= 60) return '높음';
  if (tScore >= 40) return '보통';
  if (tScore >= 30) return '낮음';
  return '매우낮음';
};

// ============================================================
// 강점 분석
// ============================================================

/**
 * 학생의 강점 중분류 상위 3개 추출
 *
 * @important 부적 요인은 T점수가 낮을수록 강점!
 * - 정적 요인: T점수 그대로 사용 (높을수록 강점)
 * - 부적 요인: 100 - T점수로 변환 (낮을수록 강점)
 */
export const getTopStrengths = (assessment: Assessment): StrengthItem[] => {
  const tScores = assessment.tScores;
  const subCategoryScores = calculateSubCategoryScores(tScores);

  const allScores: StrengthItem[] = [];

  // 정적 요인: T점수 그대로 사용 (높을수록 강점)
  for (const cat of POSITIVE_SUB_CATEGORIES) {
    const score = subCategoryScores[cat] ?? 50;
    allScores.push({
      name: cat,
      tScore: score,
      normalizedScore: score, // 정적은 그대로
      level: tScoreToLevelString(score),
      type: 'positive',
    });
  }

  // 부적 요인: 100 - T점수로 변환 (낮을수록 강점이므로)
  for (const cat of NEGATIVE_SUB_CATEGORIES) {
    const score = subCategoryScores[cat] ?? 50;
    allScores.push({
      name: cat,
      tScore: score,
      normalizedScore: 100 - score, // 부적은 역전
      level: tScoreToLevelString(score),
      type: 'negative',
    });
  }

  // normalizedScore 높은 순 정렬 후 상위 3개
  return allScores
    .sort((a, b) => b.normalizedScore - a.normalizedScore)
    .slice(0, 3)
    .map((item) => ({
      name: item.name,
      tScore: item.tScore,
      normalizedScore: item.normalizedScore,
      level: item.level,
      type: item.type,
    }));
};

/**
 * Assessment에서 직접 강점 추출 (subCategoryScores가 있는 경우)
 */
export const getTopStrengthsFromAssessment = (
  assessment: Assessment
): StrengthItem[] => {
  return getTopStrengths(assessment);
};

// ============================================================
// 예시 문장 필터링
// ============================================================

/**
 * 강점 중분류에 해당하는 예시 문장 필터링
 */
export const getRecommendedSentences = (
  topStrengths: StrengthItem[],
  schoolLevel: SchoolLevelKr
): ExampleSentence[] => {
  const strengthNames = topStrengths.map((s) => s.name);

  return EXAMPLE_SENTENCES.filter(
    (sentence) =>
      strengthNames.includes(sentence.subCategory) &&
      sentence.schoolLevel === schoolLevel
  );
};

/**
 * 특정 중분류에 해당하는 예시 문장 필터링
 */
export const getSentencesForSubCategory = (
  subCategory: SubCategory,
  schoolLevel: SchoolLevelKr
): ExampleSentence[] => {
  return EXAMPLE_SENTENCES.filter(
    (sentence) =>
      sentence.subCategory === subCategory && sentence.schoolLevel === schoolLevel
  );
};

// ============================================================
// 변화 분석
// ============================================================

/**
 * 5대 영역 T점수 계산 (중분류를 대분류로 합산)
 */
const CATEGORY_MAPPING: Record<FactorCategory, SubCategory[]> = {
  '자아강점': ['긍정적자아', '대인관계능력'],
  '학습디딤돌': ['메타인지', '학습기술', '지지적관계'],
  '긍정적공부마음': ['학업열의', '성장력'],
  '학습걸림돌': ['학업스트레스', '학업관계스트레스', '학습방해물'],
  '부정적공부마음': ['학업소진'],
};

export const calculateCategoryScores = (
  tScores: number[]
): Record<FactorCategory, number> => {
  const subCategoryScores = calculateSubCategoryScores(tScores);
  const result: Partial<Record<FactorCategory, number>> = {};

  for (const [category, subCategories] of Object.entries(CATEGORY_MAPPING)) {
    const scores = subCategories.map((sub) => subCategoryScores[sub as SubCategory] ?? 50);
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    result[category as FactorCategory] = Math.round(avg * 10) / 10;
  }

  return result as Record<FactorCategory, number>;
};

/**
 * 1차 → 2차 변화 분석
 */
export const analyzeChanges = (student: Student): AnalysisResult => {
  const assessments = student.assessments;

  if (assessments.length < 2) {
    return { hasChange: false, changes: [] };
  }

  // 1차와 2차 검사 찾기
  const first = assessments.find((a) => a.round === 1);
  const second = assessments.find((a) => a.round === 2);

  if (!first || !second) {
    return { hasChange: false, changes: [] };
  }

  const firstCategoryScores = calculateCategoryScores(first.tScores);
  const secondCategoryScores = calculateCategoryScores(second.tScores);

  const changes: ChangeItem[] = [];

  // 5대 영역 변화 확인
  const categories: FactorCategory[] = [
    '자아강점',
    '학습디딤돌',
    '긍정적공부마음',
    '학습걸림돌',
    '부정적공부마음',
  ];

  for (const cat of categories) {
    const score1 = firstCategoryScores[cat] ?? 50;
    const score2 = secondCategoryScores[cat] ?? 50;
    const diff = Math.round((score2 - score1) * 10) / 10;

    if (Math.abs(diff) >= 5) {
      // 5점 이상 변화
      changes.push({
        category: cat,
        from: score1,
        to: score2,
        change: diff > 0 ? `+${diff}` : `${diff}`,
        direction: diff > 0 ? 'positive' : 'negative',
        interpretation: diff > 0 ? '개선' : '하락',
      });
    }
  }

  // 유형 변화
  const typeChange = {
    from: first.predictedType,
    to: second.predictedType,
    changed: first.predictedType !== second.predictedType,
  };

  return {
    hasChange: changes.length > 0 || typeChange.changed,
    changes,
    typeChange,
  };
};

// ============================================================
// 학교급 변환
// ============================================================

/**
 * SchoolLevel을 SchoolLevelKr로 변환
 */
export const toSchoolLevelKr = (
  schoolLevel: '초등' | '중등',
  grade?: number
): SchoolLevelKr => {
  if (schoolLevel === '초등') return '초등';
  // 중등이면서 고등학교 학년(1~3)이면 고등으로
  if (grade && grade >= 1 && grade <= 3) {
    // 실제 고등학생인지 판단하는 로직이 필요할 수 있음
    // 현재는 중등으로 통일
    return '중등';
  }
  return '중등';
};

/**
 * SchoolLevelType (ELEMENTARY, MIDDLE, HIGH)을 SchoolLevelKr로 변환
 */
export const schoolLevelTypeToKr = (
  type: 'ELEMENTARY' | 'MIDDLE' | 'HIGH'
): SchoolLevelKr => {
  switch (type) {
    case 'ELEMENTARY':
      return '초등';
    case 'MIDDLE':
      return '중등';
    case 'HIGH':
      return '고등';
    default:
      return '초등';
  }
};

// ============================================================
// 프롬프트 파라미터 생성
// ============================================================

export interface RecordPromptParams {
  schoolLevel: SchoolLevelKr;
  grade: number;
  topStrengths: StrengthItem[];
  hasChange: boolean;
  changes: ChangeItem[];
  typeChange?: {
    from: string;
    to: string;
    changed: boolean;
  };
  selectedSentences?: string[];
}

/**
 * 학생 정보로부터 프롬프트 파라미터 생성
 */
export const buildRecordPromptParams = (
  student: Student,
  selectedSentences?: string[]
): RecordPromptParams => {
  const latestAssessment = student.assessments[student.assessments.length - 1];
  const topStrengths = getTopStrengths(latestAssessment);
  const { hasChange, changes, typeChange } = analyzeChanges(student);
  const schoolLevelKr = toSchoolLevelKr(student.schoolLevel, student.grade);

  return {
    schoolLevel: schoolLevelKr,
    grade: student.grade,
    topStrengths,
    hasChange,
    changes,
    typeChange,
    selectedSentences,
  };
};
