// ============================================================
// 비상교육 학습심리정서검사 - 타입 정의
// ============================================================

// API 타입 (향후 백엔드 연동용)
export * from './api';

// 학교급
export type SchoolLevel = '초등' | '중등';

// LPA 유형
export type ElementaryType = '자원소진형' | '안전균형형' | '몰입자원풍부형';
export type MiddleSchoolType = '무기력형' | '정서조절취약형' | '자기주도몰입형';
export type StudentType = ElementaryType | MiddleSchoolType;

// 검사 상태
export type ExamStatus = '시작전' | '진행중' | '종료';

export interface ExamPeriodStatus {
  round1: ExamStatus;
  round2: ExamStatus;
}

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
  examStatus: ExamPeriodStatus;
  round2SubmittedCount: number;
  /** API 검사 ID (회차별) - L2 대시보드 API 호출에 필요 */
  dgnssIds?: {
    round1?: number;
    round2?: number;
  };
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
  round2Submitted?: boolean;
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
  beta?: number;                                      // 효과크기 (|β|, 양수로 저장)
  source?: 'KG' | 'KG_INTERVENTION' | 'INFERRED';    // 데이터 출처
}

export type EffectType =
  | '직접효과'
  | '완전매개'
  | '긍정강화'
  | '부정강화'
  | '긍정완충'
  | '부정완충'
  | '촉진'
  | '억제';

// 개인별 랭킹된 개입 전략
export interface RankedIntervention {
  intervention: Intervention;
  relevanceScore: number;
  relevanceReason: string;
  involvedFactors: Array<{
    name: string;
    score: number;
    typeMean: number | null;
  }>;
  scoreBreakdown?: {
    needScore: number;
    deviationScore: number;
    betaBoost: number;
  };
}

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

export type MemberType = 'vivasam' | 'general' | 'guest';
export type OAuthProvider = 'vivasam' | 'google' | 'kakao' | 'naver';
export type UserRole = 'TEACHER' | 'STUDENT' | 'GUEST' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  memberType: MemberType;
  provider: OAuthProvider;
  schoolName?: string;
  profileImage?: string;
  /** 사용자 역할 (TEACHER/STUDENT/ADMIN) */
  roleCode?: UserRole;
  /** 교사 ID (교사인 경우) */
  tcId?: string;
  /** 학생 ID (학생인 경우) */
  stdtId?: string;
  /** 학급 ID (학생인 경우) */
  classId?: string;
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
  code: string;                 // QR 코드 값: {dgnssId}-{studentCount} (레거시, 사용하지 않음)
  dgnssId: number;              // 검사 ID (학급 단위, /tc/start API에서 반환)
  grade: number;
  classNumber: number;
  studentCount: number;
  completedCount: number;
  round: 1 | 2;
  startDate: Date;
  endDate?: Date;               // 종료일 (API에서는 null일 수 있음)
  createdAt: Date;
  ownerId: string;
  isActive?: boolean;           // 진행 중 여부 (dgnssAt === 'Y')
  groupName?: string;           // 소속 그룹명
  claId?: string;               // 소속 그룹 claId
  inviteCode?: string;          // 소속 그룹 초대 코드 (학생 참가용)
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
// 통합 상담 기록 관련 타입 (상담 일정 + 학생 대시보드 연동)
// ============================================================

export type CounselingStatus = 'scheduled' | 'completed' | 'cancelled';

export interface CounselingStudent {
  id: string;
  name: string;
  number: number;
  classId: string;
}

export interface UnifiedCounselingRecord {
  id: string;
  students: CounselingStudent[];     // 1명 이상
  classId: string;
  scheduledAt: string;               // 'YYYY-MM-DD HH:mm'
  duration?: number;                 // 완료 시 기록 (분)
  types: ScheduleType[];             // 복수 선택 가능
  areas: CounselingArea[];           // 복수 선택 가능
  methods: CounselingMethod[];       // 복수 선택 가능
  status: CounselingStatus;
  reason?: string;                   // 예정 시 메모 (사유)
  summary?: string;                  // 완료 시 상담 내용
  nextSteps?: string;                // 후속 조치
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUnifiedCounselingInput {
  students: CounselingStudent[];
  classId: string;
  scheduledAt: string;
  duration?: number;
  types: ScheduleType[];
  areas: CounselingArea[];
  methods: CounselingMethod[];
  status: CounselingStatus;
  reason?: string;
  summary?: string;
  nextSteps?: string;
}

export interface UpdateUnifiedCounselingInput {
  students?: CounselingStudent[];
  classId?: string;
  scheduledAt?: string;
  duration?: number;
  types?: ScheduleType[];
  areas?: CounselingArea[];
  methods?: CounselingMethod[];
  status?: CounselingStatus;
  reason?: string;
  summary?: string;
  nextSteps?: string;
}

export interface CompleteUnifiedCounselingInput {
  duration: number;
  summary: string;
  nextSteps?: string;
}

// ============================================================
// 상담 기록 관련 타입 (레거시 - 호환성 유지용)
// ============================================================

export interface CounselingRecord {
  id: string;
  studentId: string;
  classId: string;
  scheduledAt: string;          // 'YYYY-MM-DD HH:mm'
  duration: number;             // 상담 시간 (분)
  types: ScheduleType[];        // 복수 선택 가능
  areas: CounselingArea[];      // 복수 선택 가능
  methods: CounselingMethod[];  // 복수 선택 가능
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
  types: ScheduleType[];
  areas: CounselingArea[];
  methods: CounselingMethod[];
  summary: string;
  nextSteps?: string;
}

export interface UpdateCounselingRecordInput {
  scheduledAt?: string;
  duration?: number;
  types?: ScheduleType[];
  areas?: CounselingArea[];
  methods?: CounselingMethod[];
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

// ============================================================
// 생활기록부 AI 문구 생성 파라미터 (recordGenerator용)
// ============================================================

export type SchoolLevelKr = '초등' | '중등' | '고등';

export type RecordFactorType = 'positive' | 'negative';

export interface RecordStrengthItem {
  name: string;
  tScore: number;
  normalizedScore?: number;
  level: string;
  type: RecordFactorType;
}

export interface RecordChangeItem {
  category: string;
  from: number;
  to: number;
  change: string;
  direction: 'positive' | 'negative';
  interpretation: '개선' | '하락';
}

export interface RecordPromptParams {
  schoolLevel: SchoolLevelKr;
  grade: number;
  topStrengths: RecordStrengthItem[];
  hasChange: boolean;
  changes: RecordChangeItem[];
  typeChange?: {
    from: string;
    to: string;
    changed: boolean;
  };
  selectedSentences?: string[];
}

// ============================================================
// 그룹 관련 타입 (통합 로그인 연동)
// ============================================================

/** 그룹 내 역할 */
export type GroupRole = 'owner' | 'member';

/** 그룹 멤버 유형 */
export type GroupMemberType = 'member' | 'guest';

/** 그룹 멤버 상태 */
export type GroupMemberStatus = 'active' | 'left';

/** 학교급 (영문) - API 통신용 */
export type SchoolLevelCode = 'elementary' | 'middle' | 'high';

/** 학교급 한/영 변환 */
export const SCHOOL_LEVEL_MAP: Record<SchoolLevelCode, SchoolLevel> = {
  elementary: '초등',
  middle: '중등',
  high: '중등', // 고등도 중등으로 처리 (검사 기준)
};

export const SCHOOL_LEVEL_REVERSE_MAP: Record<SchoolLevel, SchoolLevelCode> = {
  '초등': 'elementary',
  '중등': 'middle',
};

/** 학교급 라벨 */
export const SCHOOL_LEVEL_LABELS: Record<SchoolLevelCode, string> = {
  elementary: '초등학교',
  middle: '중학교',
  high: '고등학교',
};

/** 그룹 (방) */
export interface Group {
  id: string;
  name: string;
  schoolLevel: SchoolLevelCode;
  grade: number;
  classNumber: number;
  description?: string;
  schoolName?: string;
  inviteCode: string;

  // API 매핑
  claId: string;

  // 관계
  ownerId: string;
  ownerName: string;
  ownerTcId: string;
  memberCount: number;

  // 현재 사용자 역할 정보
  myRole: GroupRole;
  myTcId?: string;   // 방장인 경우
  myStdtId?: string; // 멤버인 경우

  // 상태
  createdAt: Date;
  updatedAt: Date;
}

/** 그룹 멤버 */
export interface GroupMember {
  id: string;
  groupId: string;
  userId: string | null; // 게스트면 null
  stdtId: string;

  name: string;
  email?: string;
  studentNumber?: number;

  memberType: GroupMemberType;
  status: GroupMemberStatus;

  // 검사 상태
  examStatus?: {
    round1Completed: boolean;
    round2Completed: boolean;
  };

  joinedAt: Date;
  leftAt?: Date;
}

/** 그룹 생성 요청 */
export interface CreateGroupInput {
  name: string;
  schoolLevel: SchoolLevelCode;
  grade: number;
  classNumber: number;
  description?: string;
  schoolName?: string;
}

/** 그룹 수정 요청 */
export interface UpdateGroupInput {
  name?: string;
  description?: string;
  schoolName?: string;
}

/** 그룹 가입 요청 (회원) */
export interface JoinGroupInput {
  inviteCode: string;
  studentNumber?: number;
}

/** 그룹 가입 요청 (게스트) */
export interface GuestJoinGroupInput {
  inviteCode: string;
  email: string;
  name: string;
  gender?: 'M' | 'F';
  studentNumber?: number;
}

/** 초대 코드로 조회한 그룹 정보 */
export interface GroupInviteInfo {
  id: string;
  name: string;
  schoolLevel: SchoolLevelCode;
  grade: number;
  classNumber: number;
  ownerName: string;
  memberCount: number;
  alreadyJoined?: boolean;
}

/** 게스트 기록 (회원 전환 시) */
export interface GuestRecord {
  guestId: string;
  email: string;
  groupName: string;
  examResults: Array<{
    round: 1 | 2;
    completedAt: string;
  }>;
}

/** 이메일 초대 상태 */
export type EmailInvitationStatus = 'pending' | 'sent' | 'accepted' | 'expired';

/** 이메일 초대 */
export interface EmailInvitation {
  id: string;
  groupId: string;
  email: string;
  invitedBy: string; // userId
  status: EmailInvitationStatus;
  sentAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
}

/** 이메일 초대 요청 */
export interface SendEmailInvitationInput {
  groupId: string;
  email: string;
}

// ============================================================
// 차트 관련 타입 (FactorHeatmapSection 등에서 사용)
// ============================================================

export type TLevel = '매우낮음' | '낮음' | '보통' | '높음' | '매우높음';

export interface FactorAvgData {
  index: number;
  name: string;
  category: FactorCategory;
  subCategory: string;
  isPositive: boolean;
  avgTScore: number;
  level: TLevel;
}

export interface SubCategoryData {
  name: string;
  displayName: string;
  isPositive: boolean;
  avgTScore: number;
  level: TLevel;
  color: string;
  factors: FactorAvgData[];
}

export interface DomainData {
  category: FactorCategory;
  icon: string;
  isPositive: boolean;
  subCategories: SubCategoryData[];
}
