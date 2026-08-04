/**
 * 코칭 관련 타입 정의
 *
 * 코칭 페이지 구조:
 * - 탭 1: 학급 코칭 - 학급 전체 대상 코칭 정보
 * - 탭 2: 학생 코칭 - 개별 학생 대상 코칭 정보
 */

/** LPA 유형 (중등) */
export type LPATypeMiddle =
  | '냉소적 무기력형'
  | '정서조절 취약형'
  | '자기주도 몰입형';

/** LPA 유형 (초등) */
export type LPATypeElementary =
  | '자원소진형'
  | '안전 균형형'
  | '몰입자원 풍부형';

/** LPA 유형 통합 */
export type LPAType = LPATypeMiddle | LPATypeElementary;

/** LPA 유형별 색상 */
export const LPA_TYPE_COLORS: Record<string, string> = {
  // 초등 (공백 있는 버전)
  '자원소진형': '#EF4444',
  '안전 균형형': '#F59E0B',
  '몰입자원 풍부형': '#10B981',
  // 초등 (공백 없는 버전 - mock 데이터 호환)
  '안전균형형': '#F59E0B',
  '몰입자원풍부형': '#10B981',
  // 중등
  '냉소적 무기력형': '#EF4444',
  '정서조절 취약형': '#F59E0B',
  '자기주도 몰입형': '#10B981',
};

/** LPA 유형 순서 (중등) */
export const LPA_TYPE_ORDER_MIDDLE: LPATypeMiddle[] = [
  '자기주도 몰입형',
  '정서조절 취약형',
  '냉소적 무기력형',
];

/** LPA 유형 순서 (초등) */
export const LPA_TYPE_ORDER_ELEMENTARY: LPATypeElementary[] = [
  '몰입자원 풍부형',
  '안전 균형형',
  '자원소진형',
];

// ============================================================
// 학급 코칭 탭 관련 타입
// ============================================================

/** 검사별 유형 분포 */
export interface ClassLPADistribution {
  totalStudents: number;
  completedStudents: number;
  distribution: Record<string, number>; // 유형명: 인원수
}

/**
 * 유형별 특징 및 코칭 전략
 *
 * [학급전략DB 엑셀 필드 매핑]
 * - characteristics: 섹션=유형특징, 항목=본문
 * - strategyTitle: 섹션=대표전략, 항목=제목
 * - strategyDescription: 섹션=대표전략, 항목=리드
 * - actionItems[0]: 섹션=대표전략, 항목=단계(수업 도입부), 순번=1
 * - actionItems[1]: 섹션=대표전략, 항목=단계(학급 운영), 순번=2
 * - actionItems[2]: 섹션=대표전략, 항목=단계(교사의 말·피드백), 순번=3
 * - successIndicators: 섹션=관찰지표, 항목=2주 관찰 지표 (3건)
 * - noteForOtherTypes: 섹션=타유형영향, 항목=운영 유의점
 * - advancedStrategies: 섹션=심화코칭1, 심화코칭2 (각 제목+리드+단계4개)
 */
export interface LPATypeStrategy {
  type: LPAType;
  /** [유형특징 > 본문] 유형 특징 설명 */
  characteristics: string;
  /** [대표전략 > 제목] 코칭 전략 제목 */
  strategyTitle: string;
  /** [대표전략 > 리드] 코칭 전략 설명 (STEP 1에만 노출, STEP 2,3 미노출) */
  strategyDescription: string;
  /**
   * [대표전략 > 단계] 실천 방법 리스트 (순서 고정)
   * - [0]: 단계(수업 도입부) - 순번 1
   * - [1]: 단계(학급 운영) - 순번 2
   * - [2]: 단계(교사의 말·피드백) - 순번 3
   */
  actionItems: string[];
  /** [관찰지표 > 2주 관찰 지표] 성공 지표 (순번 1~3, STEP 1에만 노출) */
  successIndicators?: string[];
  /** [타유형영향 > 운영 유의점] 다른 유형에게 미치는 영향 */
  noteForOtherTypes?: string;
  /** [심화코칭1, 심화코칭2] 심화 코칭 전략 (STEP 1에만 노출, 접이식) */
  advancedStrategies?: AdvancedStrategy[];
}

/**
 * 심화 코칭 전략
 *
 * [학급전략DB 엑셀 필드 매핑 - 섹션=심화코칭1 또는 심화코칭2]
 * - title: 항목=제목
 * - description: 항목=리드
 * - actionItems: 항목=단계, 순번=1~4 (4개)
 */
export interface AdvancedStrategy {
  /** [심화코칭 > 제목] */
  title: string;
  /** [심화코칭 > 리드] */
  description: string;
  /** [심화코칭 > 단계] 순번 1~4 (4개) */
  actionItems: string[];
}

/** 학급 코칭 데이터 */
export interface ClassCoachingData {
  /** 검사별 유형 분포 */
  lpaDistribution: ClassLPADistribution;
  /** 우세 유형 (가장 많은 유형) */
  dominantType: LPAType;
  /** 우세 유형 특징 */
  dominantTypeCharacteristics: string;
  /** 학급 추천 전략 (우세 유형 기반) */
  recommendedStrategy: LPATypeStrategy;
  /** 추가 코칭 전략 (나머지 유형) */
  additionalStrategies: LPATypeStrategy[];
}

// ============================================================
// 학생 코칭 탭 관련 타입
// ============================================================

/** 학생 유형 확률 분포 */
export interface StudentLPAProbabilities {
  probabilities: Record<string, number>; // 유형명: 확률(%)
  predictedType: LPAType;
}

/** 유형 정보 */
export interface LPATypeInfo {
  type: LPAType;
  description: string;
  characteristics: string[];
}

/**
 * 강점 칭찬 포인트
 *
 * [그래프DB 속성 매핑 - GROUP_TSCORE 관계]
 * - factor: f.name (요인명)
 * - area: 요인 특성 (정적요인/개인요인 등)
 * - observation: r.strength_observation (강점 관찰)
 * - praiseLine: r.strength_line (칭찬 멘트)
 * - praiseQuestion: r.strength_question (강점 질문, v4 신규)
 */
export interface StrengthPraise {
  /** 강점 요인명 (f.name) */
  factor: string;
  /** 영역 (요인 특성: 정적요인/개인요인 등) */
  area: string;
  /** 강점 관찰 (r.strength_observation) - [학생명] 치환 포함, "다행히" 표현 */
  observation: string;
  /** 칭찬 멘트 (r.strength_line) - 프론트에서 따옴표 렌더링 */
  praiseLine: string;
  /** 강점 질문 (r.strength_question) - v4 신규 속성, 프론트에서 따옴표 렌더링 */
  praiseQuestion: string;
}

/**
 * 학생 코칭 경로 정보 (보완점 기반 맞춤 코칭)
 *
 * [그래프DB 속성 매핑 - ModerationPath 노드]
 * - weakFactor: f.name (Z보완점)
 * - focusFactor: x.name (X초점요인)
 * - targetFactor: Y (학업성취도 등)
 * - interpretation: p.interpretation (해석)
 * - coaching1Method: p.coaching1_method
 * - coaching1Line: p.coaching1_line
 * - coaching2Action: p.coaching2_action
 * - coaching2Line: p.coaching2_line
 */
export interface CoachingPathway {
  /** Z보완점 요인명 (f.name) - 배지 옆 굵은 요인명 */
  weakFactor: string;
  /** X초점요인 (x.name) - 괄호 안 부제 첫번째 */
  focusFactor: string;
  /** Y 타겟요인 (학업성취도 등) - 괄호 안 부제 두번째 */
  targetFactor: string;
  /** 해석 (p.interpretation) - [학생명] 치환 포함, 본문 문단 */
  interpretation: string;
  /** 코칭1 방법 (p.coaching1_method) - 번호① 텍스트 */
  coaching1Method: string;
  /** 코칭1 멘트 (p.coaching1_line) - 번호① 말풍선, 프론트에서 따옴표 렌더링 */
  coaching1Line: string;
  /** 코칭2 행동 (p.coaching2_action) - 번호② 텍스트 */
  coaching2Action: string;
  /** 코칭2 멘트 (p.coaching2_line) - 번호② 말풍선, 프론트에서 따옴표 렌더링 */
  coaching2Line: string;
}

/** 학생 코칭 데이터 */
export interface StudentCoachingData {
  /** 학생 ID */
  studentId: string;
  /** 학생 이름 */
  studentName: string;
  /** 번호 */
  studentNumber: number;
  /** 유형 확률 분포 */
  lpaData: StudentLPAProbabilities;
  /** 유형 정보 */
  typeInfo: LPATypeInfo;
  /** 강점 칭찬 포인트 (Top 1, 2) */
  strengthPraises: StrengthPraise[];
  /** 코칭 경로 (약점 Top 1 기반) */
  coachingPathway: CoachingPathway;
}

// ============================================================
// 상담 기준 필터 및 태그
// ============================================================

/** 상담 기준 필터 */
export type CounselingFilter = 'all' | 'priority' | 'reliability' | 'strength';

export const COUNSELING_FILTER_LABELS: Record<CounselingFilter, string> = {
  all: '전체 학생',
  priority: '상담 우선',
  reliability: '응답 신뢰도 확인 필요',
  strength: '강점 활용 가능',
};

export const COUNSELING_FILTER_DESCRIPTIONS: Record<CounselingFilter, string> = {
  all: '우리 반 전체 학생',
  priority: '먼저 대화로 맥락 확인이 필요한 학생',
  reliability: '검사 결과 단정 전 응답 상황 확인 필요 학생',
  strength: '강점 언어로 상담 시작하기 좋은 학생',
};

/** 상담 이유 태그 */
export type CounselingReasonTag = 'reliability' | 'burden' | 'obstacle' | 'strength';

export const COUNSELING_TAG_LABELS: Record<CounselingReasonTag, string> = {
  reliability: '응답 신뢰도 확인 필요',
  burden: '공부부담 신호',
  obstacle: '학습 방해 요인',
  strength: '강점 활용',
};

export const COUNSELING_TAG_COLORS: Record<CounselingReasonTag, { bg: string; text: string }> = {
  reliability: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  burden: { bg: 'bg-red-100', text: 'text-red-700' },
  obstacle: { bg: 'bg-orange-100', text: 'text-orange-700' },
  strength: { bg: 'bg-green-100', text: 'text-green-700' },
};

export const COUNSELING_TAG_DESCRIPTIONS: Record<CounselingReasonTag, string> = {
  reliability: '응답 상황과 현재 맥락 확인이 필요한 경우',
  burden: '고갈, 무능감, 학업스트레스, 성적부담 등 학습 부담 신호가 있는 경우',
  obstacle: '스마트폰, 게임, 시간관리, 수업태도, 공부환경 등 학습 흐름 방해 요인이 있는 경우',
  strength: '상담을 강점에서 시작할 수 있는 뚜렷한 긍정 요인이 있는 경우',
};

/** 학생 목록 아이템 */
export interface CoachingStudentItem {
  id: string;
  number: number;
  name: string;
  lpaType: LPAType;
  tags: CounselingReasonTag[];
  lastCounselingDate?: string;
  counselingCount: number;
}

// ============================================================
// 레거시 타입 (기존 호환성 유지)
// ============================================================

/** SEL(사회정서학습) 콘텐츠 카테고리 */
export type SELCategory =
  | 'self-awareness'      // 자기인식
  | 'self-management'     // 자기관리
  | 'social-awareness'    // 사회적 인식
  | 'relationship'        // 관계기술
  | 'decision-making';    // 책임있는 의사결정

export const SEL_CATEGORY_LABELS: Record<SELCategory, string> = {
  'self-awareness': '자기인식',
  'self-management': '자기관리',
  'social-awareness': '사회적 인식',
  'relationship': '관계기술',
  'decision-making': '책임있는 의사결정',
};

/** SEL 콘텐츠 아이템 */
export interface SELContent {
  id: string;
  title: string;
  category: SELCategory;
  description: string;
  duration: number; // 분
  targetLPATypes: LPAType[];
  tags: string[];
}

/** 반 특성 분석 (레거시) */
export interface ClassCharacteristics {
  totalStudents: number;
  lpaDistribution: Record<LPAType, number>;
  dominantType: LPAType;
  strengths: string[];
  challenges: string[];
  recommendedFocus: string[];
}

/** 반 운영 전략 (레거시) */
export interface ClassStrategy {
  id: string;
  title: string;
  description: string;
  targetArea: string;
  activities: string[];
  expectedOutcomes: string[];
}

/** 학생별 코칭 전략 (레거시) */
export interface StudentCoachingStrategy {
  studentId: string;
  studentName: string;
  studentNumber: number;
  lpaType: LPAType;
  keyStrengths: string[];
  growthAreas: string[];
  teacherGuidelines: string[];
  studentGuidelines: string[];
  parentGuidelines: string[];
}

/** 코칭 진행 현황 (레거시) */
export interface CoachingProgress {
  studentId: string;
  studentName: string;
  studentNumber: number;
  lpaType: LPAType;
  startDate: Date;
  currentPhase: string;
  completedActivities: number;
  totalActivities: number;
  lastActivityDate: Date;
  nextActivityDue: Date;
}
