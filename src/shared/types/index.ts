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
  reliabilityWarnings: string[];
  attentionResult: AttentionResult;
}

// 관심 필요 판별 결과
export interface AttentionReason {
  category: FactorCategory;
  factors: { name: string; score: number }[];
  direction: 'low' | 'high';
}

export interface AttentionResult {
  needsAttention: boolean;
  reasons: AttentionReason[];
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
  factors: string[];
  factorCategories: Record<string, number[]>;
  '초등': SchoolProfileData;
  '중등': SchoolProfileData;
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

// ============================================================
// 인증 관련 타입
// ============================================================

export type MemberType = 'vivasam' | 'general';
export type OAuthProvider = 'vivasam' | 'google' | 'kakao' | 'naver';

export interface User {
  id: string;
  name: string;
  email: string;
  memberType: MemberType;
  provider: OAuthProvider;
  schoolName?: string;
  profileImage?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============================================================
// 검사 관리 관련 타입
// ============================================================

export interface ManagedAssessment {
  id: string;
  name: string;
  code: string;
  grade: number;
  classNumber: number;
  studentCount: number;
  completedCount: number;
  round: 1 | 2;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  ownerId: string;
}

export interface CreateAssessmentInput {
  name: string;
  grade: number;
  classNumber: number;
  studentCount: number;
  round: 1 | 2;
}

// ============================================================
// 상담일정 관련 타입
// ============================================================

export type ScheduleType = 'regular' | 'urgent' | 'follow-up' | 'initial';
export type CounselingArea = 'academic' | 'career' | 'peer' | 'family' | 'emotion' | 'behavior' | 'health' | 'other';
export type CounselingMethod = 'face-to-face' | 'phone' | 'video' | 'group';

export interface Schedule {
  id: string;
  students: ScheduleStudent[];
  classId: string;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:mm'
  type: ScheduleType;
  area: CounselingArea;
  method: CounselingMethod;
  reason?: string;
  createdAt: Date;
}

export interface ScheduleStudent {
  id: string;
  name: string;
  number: number;
  classId: string;
}

export interface CreateScheduleInput {
  students: ScheduleStudent[];
  classId: string;
  date: string;
  time: string;
  type: ScheduleType;
  area: CounselingArea;
  method: CounselingMethod;
  reason?: string;
}

// 상담유형 라벨
export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  regular: '정기상담',
  urgent: '긴급상담',
  'follow-up': '후속상담',
  initial: '초기상담',
};

// 상담영역 라벨
export const COUNSELING_AREA_LABELS: Record<CounselingArea, string> = {
  academic: '학업',
  career: '진로',
  peer: '교우관계',
  family: '가정',
  emotion: '정서·심리',
  behavior: '행동',
  health: '건강',
  other: '기타',
};

// 상담방법 라벨
export const COUNSELING_METHOD_LABELS: Record<CounselingMethod, string> = {
  'face-to-face': '대면상담',
  phone: '전화상담',
  video: '화상상담',
  group: '집단상담',
};

// 학급별 색상
export const CLASS_COLORS: Record<string, string> = {
  '2-3': '#3b82f6', // 파랑
  '2-5': '#8b5cf6', // 보라
  '3-1': '#10b981', // 초록
  '3-4': '#f59e0b', // 주황
};

// ============================================================
// 상담 기록 관련 타입
// ============================================================

export interface CounselingRecord {
  id: string;
  studentId: string;
  classId: string;
  scheduledAt: string;          // 'YYYY-MM-DD HH:mm'
  duration: number;             // 상담 시간 (분)
  type: ScheduleType;
  area: CounselingArea;
  method: CounselingMethod;
  summary: string;              // 상담 내용 요약
  nextSteps?: string;           // 후속 조치
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCounselingRecordInput {
  studentId: string;
  classId: string;
  scheduledAt: string;
  duration: number;
  type: ScheduleType;
  area: CounselingArea;
  method: CounselingMethod;
  summary: string;
  nextSteps?: string;
}

export interface UpdateCounselingRecordInput {
  scheduledAt?: string;
  duration?: number;
  type?: ScheduleType;
  area?: CounselingArea;
  method?: CounselingMethod;
  summary?: string;
  nextSteps?: string;
}

// ============================================================
// 관찰 메모 관련 타입
// ============================================================

export type MemoCategory = 'behavior' | 'academic' | 'social' | 'emotion' | 'other';

export const MEMO_CATEGORY_LABELS: Record<MemoCategory, string> = {
  behavior: '행동',
  academic: '학습',
  social: '교우관계',
  emotion: '정서',
  other: '기타',
};

export const MEMO_CATEGORY_COLORS: Record<MemoCategory, string> = {
  behavior: 'bg-amber-100 text-amber-700',
  academic: 'bg-blue-100 text-blue-700',
  social: 'bg-green-100 text-green-700',
  emotion: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-700',
};

export interface ObservationMemo {
  id: string;
  studentId: string;
  classId: string;
  date: string;                 // 'YYYY-MM-DD'
  category: MemoCategory;
  content: string;
  isImportant: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateObservationMemoInput {
  studentId: string;
  classId: string;
  date: string;
  category: MemoCategory;
  content: string;
  isImportant?: boolean;
}

export interface UpdateObservationMemoInput {
  date?: string;
  category?: MemoCategory;
  content?: string;
  isImportant?: boolean;
}

// ============================================================
// 생활기록부 AI 문구 관련 타입
// ============================================================

export type SchoolRecordCategory =
  | 'comprehensive'     // 종합 의견
  | 'learning'          // 학습 태도
  | 'personality'       // 성격 특성
  | 'socialSkills'      // 대인관계
  | 'selfManagement';   // 자기관리

export const SCHOOL_RECORD_CATEGORY_LABELS: Record<SchoolRecordCategory, string> = {
  comprehensive: '종합 의견',
  learning: '학습 태도',
  personality: '성격 특성',
  socialSkills: '대인관계',
  selfManagement: '자기관리',
};

export interface SchoolRecordRequest {
  studentId: string;
  tScores: number[];
  predictedType: string;
  category: SchoolRecordCategory;
  customPrompt?: string;
}

export interface SchoolRecordResponse {
  category: SchoolRecordCategory;
  content: string;
  generatedAt: Date;
}

export interface SavedSchoolRecord {
  id: string;
  studentId: string;
  classId: string;
  category: SchoolRecordCategory;
  content: string;
  createdAt: Date;
}
