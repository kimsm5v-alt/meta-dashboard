// ============================================================
// META 학습심리정서검사 - 타입 정의
// ============================================================

// 학교급
export type SchoolLevel = '초등' | '중등';

// LPA 유형
export type ElementaryType = '자원소진형' | '안전균형형' | '몰입자원풍부형';
export type MiddleSchoolType = '무기력형' | '정서조절취약형' | '자기주도몰입형';
export type StudentType = ElementaryType | MiddleSchoolType;

// 학급
export interface Class {
  id: string;
  schoolLevel: SchoolLevel;
  grade: number;
  classNumber: number;
  teacherId: string;
  students: Student[];
  stats?: ClassStats;
}

export interface ClassStats {
  totalStudents: number;
  assessedStudents: number;
  typeDistribution: TypeDistribution;
  needAttentionCount: number;
  round1Completed: boolean;
  round2Completed: boolean;
}

export interface TypeDistribution {
  [typeName: string]: {
    count: number;
    percentage: number;
  };
}

// 학생
export interface Student {
  id: string;
  classId: string;
  number: number;
  name: string;
  schoolLevel: SchoolLevel;
  grade: number;
  assessments: Assessment[];
}

// AI 전송용 (PII 제외)
export interface SafeStudentData {
  schoolLevel: SchoolLevel;
  grade: number;
  studentType: string;
  typeConfidence: number;
  tScores: number[];
  strengths: FactorScore[];
  weaknesses: FactorScore[];
}

// 검사 결과
export interface Assessment {
  id: string;
  studentId: string;
  round: 1 | 2;
  assessedAt: Date;
  tScores: number[];
  predictedType: StudentType;
  typeConfidence: number;
  typeProbabilities: Record<string, number>;
  deviations: FactorDeviation[];
}

// 요인
export interface Factor {
  index: number;
  name: string;
  category: FactorCategory;
  subCategory: string;
  isPositive: boolean;
}

export type FactorCategory = 
  | '자아강점'
  | '학습디딤돌'
  | '학습걸림돌'
  | '긍정적공부마음'
  | '부정적공부마음';

export interface FactorScore {
  factor: string;
  score: number;
  category: FactorCategory;
  isPositive: boolean;
}

export interface FactorDeviation {
  index: number;
  factor: string;
  studentScore: number;
  typeMean: number;
  diff: number;
  direction: 'positive' | 'negative';
}

// LPA 프로파일
export interface LPAProfileData {
  [schoolLevel: string]: SchoolProfileData;
  factors: string[];
  factorCategories: Record<string, number[]>;
}

export interface SchoolProfileData {
  types: TypeProfile[];
  priors: Record<string, number>;
}

export interface TypeProfile {
  name: string;
  color: string;
  colorName: string;
  means: number[];
  description: string;
  characteristics: string[];
  interventions: Intervention[];
}

// 개입 전략
export interface Intervention {
  x: string;
  z: string | null;
  y: string;
  effectType: EffectType;
  interpretation: string;
  strategies: string[];
}

export type EffectType = 
  | '직접효과'
  | '긍정강화'
  | '부정강화'
  | '긍정완충'
  | '부정완충'
  | '촉진'
  | '억제';

// 교사
export interface Teacher {
  id: string;
  name: string;
  classes: Class[];
}

// 필터/정렬
export interface FilterOptions {
  type?: StudentType | 'all';
  round?: 1 | 2 | 'both';
  needAttention?: boolean;
}

export interface SortOptions {
  field: 'number' | 'name' | 'type' | 'confidence';
  direction: 'asc' | 'desc';
}

// 반별 비교 분석
export interface ClassCategoryAverage {
  classId: string;
  className: string;
  categoryAverages: Record<FactorCategory, number>;
}

export interface CategoryChartData {
  category: FactorCategory;
  [key: string]: string | number;
}

export interface TypeChartData {
  type: StudentType;
  [key: string]: string | number;
}
