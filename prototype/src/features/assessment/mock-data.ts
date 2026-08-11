/**
 * 검사 Feature - Mock 데이터
 *
 * 개발/테스트용 가상 데이터
 */

import type { ExamOverviewRow, ExamOverviewSummary, StudentExamStatus, StudentExamResult } from './types';
import type { StudentType } from '@/shared/types';

// ============================================================
// 전체 현황 Mock 데이터
// ============================================================

export const MOCK_EXAM_OVERVIEW_SUMMARY: ExamOverviewSummary = {
  totalClasses: 4,
  inProgressExams: 2,
  completedExams: 4,
  pendingStudents: 8,
};

export const MOCK_EXAM_OVERVIEW_ROWS: ExamOverviewRow[] = [
  {
    id: '1',
    className: '2-3반',
    examName: '학습종합검사',
    round: 1,
    submittedCount: 22,
    totalCount: 26,
    submissionRate: 85,
    status: 'in_progress',
    groupId: 'group-1',
  },
  {
    id: '2',
    className: '2-3반',
    examName: '학습종합검사',
    round: 2,
    submittedCount: 0,
    totalCount: 26,
    submissionRate: 0,
    status: 'not_started',
    groupId: 'group-1',
  },
  {
    id: '3',
    className: '2-4반',
    examName: '학습종합검사',
    round: 1,
    submittedCount: 28,
    totalCount: 28,
    submissionRate: 100,
    status: 'completed',
    groupId: 'group-2',
  },
  {
    id: '4',
    className: '2-4반',
    examName: '학습종합검사',
    round: 2,
    submittedCount: 25,
    totalCount: 28,
    submissionRate: 89,
    status: 'in_progress',
    groupId: 'group-2',
  },
  {
    id: '5',
    className: '2-5반',
    examName: '학습종합검사',
    round: 1,
    submittedCount: 24,
    totalCount: 24,
    submissionRate: 100,
    status: 'completed',
    groupId: 'group-3',
  },
  {
    id: '6',
    className: '2-5반',
    examName: '학습종합검사',
    round: 2,
    submittedCount: 24,
    totalCount: 24,
    submissionRate: 100,
    status: 'completed',
    groupId: 'group-3',
  },
  {
    id: '7',
    className: '2-6반',
    examName: '학습종합검사',
    round: 1,
    submittedCount: 0,
    totalCount: 25,
    submissionRate: 0,
    status: 'not_started',
    groupId: 'group-4',
  },
  {
    id: '8',
    className: '2-6반',
    examName: '학습종합검사',
    round: 2,
    submittedCount: 0,
    totalCount: 25,
    submissionRate: 0,
    status: 'not_started',
    groupId: 'group-4',
  },
];

// ============================================================
// 반별 학생 목록 Mock 데이터
// ============================================================

export const MOCK_STUDENTS_CLASS_1: StudentExamStatus[] = [
  { id: 's1', number: 1, name: '김민준', submitted: true, submittedAt: new Date('2026-07-01 09:30') },
  { id: 's2', number: 2, name: '이서연', submitted: true, submittedAt: new Date('2026-07-01 09:35') },
  { id: 's3', number: 3, name: '박지호', submitted: true, submittedAt: new Date('2026-07-01 09:40') },
  { id: 's4', number: 4, name: '최수아', submitted: false },
  { id: 's5', number: 5, name: '정예준', submitted: true, submittedAt: new Date('2026-07-01 09:45') },
  { id: 's6', number: 6, name: '강하은', submitted: true, submittedAt: new Date('2026-07-01 09:50') },
  { id: 's7', number: 7, name: '조민서', submitted: false },
  { id: 's8', number: 8, name: '윤시우', submitted: true, submittedAt: new Date('2026-07-01 10:00') },
  { id: 's9', number: 9, name: '장도윤', submitted: true, submittedAt: new Date('2026-07-01 10:05') },
  { id: 's10', number: 10, name: '임지아', submitted: false },
  { id: 's11', number: 11, name: '한서준', submitted: true, submittedAt: new Date('2026-07-01 10:10') },
  { id: 's12', number: 12, name: '오하린', submitted: true, submittedAt: new Date('2026-07-01 10:15') },
  { id: 's13', number: 13, name: '신유나', submitted: true, submittedAt: new Date('2026-07-01 10:20') },
  { id: 's14', number: 14, name: '권준우', submitted: true, submittedAt: new Date('2026-07-01 10:25') },
  { id: 's15', number: 15, name: '송지원', submitted: true, submittedAt: new Date('2026-07-01 10:30') },
  { id: 's16', number: 16, name: '백서윤', submitted: true, submittedAt: new Date('2026-07-01 10:35') },
  { id: 's17', number: 17, name: '고은우', submitted: true, submittedAt: new Date('2026-07-01 10:40') },
  { id: 's18', number: 18, name: '문채원', submitted: true, submittedAt: new Date('2026-07-01 10:45') },
  { id: 's19', number: 19, name: '양시온', submitted: true, submittedAt: new Date('2026-07-01 10:50') },
  { id: 's20', number: 20, name: '배하율', submitted: true, submittedAt: new Date('2026-07-01 10:55') },
  { id: 's21', number: 21, name: '허지후', submitted: false },
  { id: 's22', number: 22, name: '남윤서', submitted: true, submittedAt: new Date('2026-07-01 11:00') },
  { id: 's23', number: 23, name: '심현우', submitted: true, submittedAt: new Date('2026-07-01 11:05') },
  { id: 's24', number: 24, name: '안소율', submitted: true, submittedAt: new Date('2026-07-01 11:10') },
  { id: 's25', number: 25, name: '유건우', submitted: true, submittedAt: new Date('2026-07-01 11:15') },
  { id: 's26', number: 26, name: '노이서', submitted: true, submittedAt: new Date('2026-07-01 11:20') },
];

// 2차 검사 학생 데이터 (미시작 상태)
export const MOCK_STUDENTS_CLASS_1_ROUND2: StudentExamStatus[] = MOCK_STUDENTS_CLASS_1.map((s) => ({
  ...s,
  submitted: false,
  submittedAt: undefined,
}));

// ============================================================
// 반별 검사 관리 데이터 (화면 2번용)
// ============================================================

export interface ClassExamData {
  groupId: string;
  className: string;
  rounds: {
    round: 1 | 2;
    status: 'not_started' | 'in_progress' | 'completed';
    submittedCount: number;
    totalCount: number;
    startedAt?: Date;
    endedAt?: Date;
    students: StudentExamStatus[];
  }[];
}

export const MOCK_CLASS_EXAM_DATA: Record<string, ClassExamData> = {
  'group-1': {
    groupId: 'group-1',
    className: '2-3반',
    rounds: [
      {
        round: 1,
        status: 'in_progress',
        submittedCount: 22,
        totalCount: 26,
        startedAt: new Date('2026-07-01 09:00'),
        students: MOCK_STUDENTS_CLASS_1,
      },
      {
        round: 2,
        status: 'not_started',
        submittedCount: 0,
        totalCount: 26,
        students: MOCK_STUDENTS_CLASS_1_ROUND2,
      },
    ],
  },
  'group-2': {
    groupId: 'group-2',
    className: '2-4반',
    rounds: [
      {
        round: 1,
        status: 'completed',
        submittedCount: 28,
        totalCount: 28,
        startedAt: new Date('2026-06-15 09:00'),
        endedAt: new Date('2026-06-20 17:00'),
        students: MOCK_STUDENTS_CLASS_1.slice(0, 28).map((s, i) => ({
          ...s,
          id: `s2-${i + 1}`,
          submitted: true,
          submittedAt: new Date('2026-06-15 09:00'),
        })),
      },
      {
        round: 2,
        status: 'in_progress',
        submittedCount: 25,
        totalCount: 28,
        startedAt: new Date('2026-07-05 09:00'),
        students: MOCK_STUDENTS_CLASS_1.slice(0, 28).map((s, i) => ({
          ...s,
          id: `s2-r2-${i + 1}`,
          submitted: i < 25,
          submittedAt: i < 25 ? new Date('2026-07-05 10:00') : undefined,
        })),
      },
    ],
  },
  'group-3': {
    groupId: 'group-3',
    className: '2-5반',
    rounds: [
      {
        round: 1,
        status: 'completed',
        submittedCount: 24,
        totalCount: 24,
        startedAt: new Date('2026-06-01 09:00'),
        endedAt: new Date('2026-06-05 17:00'),
        students: MOCK_STUDENTS_CLASS_1.slice(0, 24).map((s, i) => ({
          ...s,
          id: `s3-${i + 1}`,
          submitted: true,
          submittedAt: new Date('2026-06-01 10:00'),
        })),
      },
      {
        round: 2,
        status: 'completed',
        submittedCount: 24,
        totalCount: 24,
        startedAt: new Date('2026-07-01 09:00'),
        endedAt: new Date('2026-07-05 17:00'),
        students: MOCK_STUDENTS_CLASS_1.slice(0, 24).map((s, i) => ({
          ...s,
          id: `s3-r2-${i + 1}`,
          submitted: true,
          submittedAt: new Date('2026-07-01 10:00'),
        })),
      },
    ],
  },
  'group-4': {
    groupId: 'group-4',
    className: '2-6반',
    rounds: [
      {
        round: 1,
        status: 'not_started',
        submittedCount: 0,
        totalCount: 25,
        students: MOCK_STUDENTS_CLASS_1.slice(0, 25).map((s, i) => ({
          ...s,
          id: `s4-${i + 1}`,
          submitted: false,
          submittedAt: undefined,
        })),
      },
      {
        round: 2,
        status: 'not_started',
        submittedCount: 0,
        totalCount: 25,
        students: MOCK_STUDENTS_CLASS_1.slice(0, 25).map((s, i) => ({
          ...s,
          id: `s4-r2-${i + 1}`,
          submitted: false,
          submittedAt: undefined,
        })),
      },
    ],
  },
};

// ============================================================
// 학생 결과 Mock 데이터 (결과보기 > 학생)
// ============================================================

const MIDDLE_SCHOOL_TYPES: StudentType[] = ['냉소적 무기력형', '정서조절 취약형', '자기주도 몰입형'];

/** T점수 배열 생성 (38개 요인) */
const generateTScores = (baseLevel: 'high' | 'mid' | 'low'): number[] => {
  const base = baseLevel === 'high' ? 58 : baseLevel === 'mid' ? 50 : 42;
  const variance = baseLevel === 'high' ? 8 : baseLevel === 'mid' ? 10 : 12;

  return Array.from({ length: 38 }, (_, i) => {
    // 부적 요인(25~37)은 반대로
    const isNegative = i >= 25;
    const rawScore = base + Math.floor(Math.random() * variance * 2) - variance;
    if (isNegative && baseLevel === 'high') {
      return Math.max(30, Math.min(70, 100 - rawScore)); // 부적 요인은 낮아야 좋음
    }
    return Math.max(30, Math.min(70, rawScore));
  });
};

/** 유형 확률 생성 */
const generateTypeProbabilities = (mainType: StudentType): Record<string, number> => {
  const mainProb = 50 + Math.floor(Math.random() * 30);
  const remaining = 100 - mainProb;
  const otherTypes = MIDDLE_SCHOOL_TYPES.filter(t => t !== mainType);
  const otherProb1 = Math.floor(remaining * (0.3 + Math.random() * 0.4));
  const otherProb2 = remaining - otherProb1;

  return {
    [mainType]: mainProb,
    [otherTypes[0]]: Math.max(otherProb1, otherProb2),
    [otherTypes[1]]: Math.min(otherProb1, otherProb2),
  };
};

/** 학생 결과 데이터 생성 */
export const generateStudentResult = (
  id: string,
  number: number,
  name: string,
  round: 0 | 1 | 2 = 1,
  /** 1차/2차 미응시 여부 */
  options?: { noRound1?: boolean; noRound2?: boolean },
): StudentExamResult => {
  // 미응시 학생 (round = 0)
  if (round === 0 || (options?.noRound1 && options?.noRound2)) {
    return {
      id,
      number,
      name,
      schoolLevel: '중등',
      predictedType: '정서조절 취약형', // 기본값 (표시되지 않음)
      lpaType1: undefined,
      lpaType2: undefined,
      typeProbabilities: {},
      tScores: [],
      avgTScore: 0,
      needsAttention: false,
      hasReliabilityWarning: false,
      round: 0,
    };
  }

  // 번호에 따라 유형 분배
  const typeIndex = number % 3;
  const predictedType = MIDDLE_SCHOOL_TYPES[typeIndex];
  const baseLevel = typeIndex === 2 ? 'high' : typeIndex === 1 ? 'mid' : 'low';

  const tScores = generateTScores(baseLevel);
  const avgTScore = Math.round(tScores.reduce((a, b) => a + b, 0) / tScores.length);

  // 관심 필요 여부 (자기주도 몰입형은 관심 불필요)
  const needsAttention = typeIndex === 0 || (typeIndex === 1 && Math.random() > 0.5);

  // 신뢰도 주의 여부 (일부 학생에게 무작위 할당)
  const hasReliabilityWarning = number % 7 === 0; // 7번, 14번, 21번 학생

  // 1차 유형 결정
  const lpaType1 = options?.noRound1 ? undefined : MIDDLE_SCHOOL_TYPES[(typeIndex + 1) % 3];

  // 2차 유형 결정 (round >= 2일 때만)
  const lpaType2 = round >= 2 && !options?.noRound2 ? predictedType : undefined;

  const result: StudentExamResult = {
    id,
    number,
    name,
    schoolLevel: '중등',
    predictedType,
    lpaType1,
    lpaType2,
    typeProbabilities: generateTypeProbabilities(predictedType),
    tScores,
    avgTScore,
    needsAttention,
    attentionReason: needsAttention
      ? typeIndex === 0
        ? '학업 스트레스 및 소진 지표가 높습니다.'
        : '정서 조절 관련 요인 확인이 필요합니다.'
      : undefined,
    hasReliabilityWarning,
    reliabilityWarningReason: hasReliabilityWarning ? '응답 일관성이 부족합니다.' : undefined,
    assessedAt: new Date('2026-07-01'),
    round,
  };

  // 2차인 경우 1차 결과 추가
  if (round === 2) {
    const prevTScores = generateTScores(baseLevel);
    const prevAvgT = Math.round(prevTScores.reduce((a, b) => a + b, 0) / prevTScores.length);
    result.prevResult = {
      predictedType: lpaType1 || MIDDLE_SCHOOL_TYPES[(typeIndex + 1) % 3],
      typeProbabilities: generateTypeProbabilities(lpaType1 || MIDDLE_SCHOOL_TYPES[(typeIndex + 1) % 3]),
      tScores: prevTScores,
      avgTScore: prevAvgT,
    };
  }

  return result;
};

/** 반별 학생 결과 목록 */
export const MOCK_STUDENT_RESULTS: Record<string, StudentExamResult[]> = {
  // group-1: 1차/2차 완료 (변화추적 가능)
  'group-1': MOCK_STUDENTS_CLASS_1.slice(0, 26).map((s, i) => {
    // 14번, 17번 학생은 2차 미응시
    if (s.number === 14 || s.number === 17) {
      return generateStudentResult(`sr1-${i + 1}`, s.number, s.name, 1);
    }
    return generateStudentResult(`sr1-${i + 1}`, s.number, s.name, 2);
  }),
  // group-2: 1차 완료, 2차 진행중 (일부 2차 미응시)
  'group-2': MOCK_STUDENTS_CLASS_1.slice(0, 28).map((s, i) => {
    // 5, 10, 19번 학생은 2차 미응시
    if (s.number === 5 || s.number === 10 || s.number === 19) {
      return generateStudentResult(`sr2-${i + 1}`, s.number, s.name, 1);
    }
    return generateStudentResult(`sr2-${i + 1}`, s.number, s.name, 2);
  }),
  // group-3: 1차/2차 모두 완료
  'group-3': MOCK_STUDENTS_CLASS_1.slice(0, 24).map((s, i) =>
    generateStudentResult(`sr3-${i + 1}`, s.number, s.name, 2)
  ),
  // group-4: 1차/2차 모두 미시작
  'group-4': MOCK_STUDENTS_CLASS_1.slice(0, 25).map((s, i) =>
    generateStudentResult(`sr4-${i + 1}`, s.number, s.name, 0)
  ),
};

/** 학생 ID로 결과 조회 */
export const getStudentResultById = (groupId: string, studentId: string): StudentExamResult | undefined => {
  const results = MOCK_STUDENT_RESULTS[groupId];
  return results?.find(r => r.id === studentId);
};

// ============================================================
// 변화추적 Mock 데이터 (화면 6번)
// ============================================================

import type { StudentChangeData, ClassChangeSummary, InterventionHistory, ChangeDirection } from './types';

/** 변화 방향 계산 */
const getChangeDirection = (change: number): ChangeDirection => {
  if (change >= 3) return 'up';
  if (change <= -3) return 'down';
  return 'same';
};

/** Mock 학습 현황 생성 (유형 기반) */
import type { LearningStatus, AcademicAchievement, GradeSatisfaction, LearningMotivation, SelfStudyTime, LearningCounselor } from './types';

const generateMockLearningStatus = (type: string, variation: number = 0): LearningStatus => {
  const isSelfDirected = type === '자기주도 몰입형' || type === '몰입자원 풍부형';
  const isStruggling = type === '냉소적 무기력형' || type === '자원소진형';

  // 120. 학업 성적: ① 매우 낮음 ② 낮음 ③ 보통 ④ 높음 ⑤ 매우 높음
  const achievements: AcademicAchievement[] = ['very-low', 'low', 'mid', 'high', 'very-high'];
  // 121. 성적 만족도: ① 매우 낮음 ② 낮음 ③ 보통 ④ 높음 ⑤ 매우 높음
  const satisfactions: GradeSatisfaction[] = ['very-low', 'low', 'mid', 'high', 'very-high'];
  // 122. 공부 이유: ① 흥미 ② 미래 ③ 대학 ④ 기대 ⑤ 모르겠다
  const motivations: LearningMotivation[] = ['interest', 'future', 'college', 'expectations', 'unknown'];
  // 123. 혼자 공부 시간: ① 전혀 안함 ② 1시간 미만 ③ 1~2시간 ④ 2~3시간 ⑤ 3시간 이상
  const studyTimes: SelfStudyTime[] = ['none', 'under1h', '1-2h', '2-3h', 'over3h'];
  // 124. 상담 대상: ① 친구 ② 선생님 ③ 가족 ④ 상담 전문가 ⑤ 기타
  const counselors: LearningCounselor[] = ['friend', 'teacher', 'family', 'counselor', 'etc'];

  // 기본 인덱스 (유형별)
  let achievementIdx = isSelfDirected ? 3 : isStruggling ? 1 : 2;
  let satisfactionIdx = isSelfDirected ? 3 : isStruggling ? 1 : 2;
  let motivationIdx = isSelfDirected ? 0 : isStruggling ? 4 : 1;
  let studyTimeIdx = isSelfDirected ? 3 : isStruggling ? 1 : 2;
  let counselorIdx = isSelfDirected ? 2 : isStruggling ? 0 : 1; // 자기주도: 가족, 무기력: 친구, 기타: 선생님

  // variation으로 약간의 변화 적용
  achievementIdx = Math.max(0, Math.min(4, achievementIdx + variation));
  satisfactionIdx = Math.max(0, Math.min(4, satisfactionIdx + variation));
  studyTimeIdx = Math.max(0, Math.min(4, studyTimeIdx + variation));

  return {
    academicAchievement: achievements[achievementIdx],
    gradeSatisfaction: satisfactions[satisfactionIdx],
    learningMotivation: motivations[motivationIdx],
    selfStudyTime: studyTimes[studyTimeIdx],
    learningCounselor: counselors[counselorIdx],
  };
};

/** 학생 변화 데이터 생성 */
const generateStudentChangeData = (
  studentResult: StudentExamResult,
): StudentChangeData => {
  // 2차 미응시면 변화 없음
  if (!studentResult.prevResult || studentResult.round < 2) {
    const type = studentResult.prevResult?.predictedType || studentResult.predictedType;
    return {
      id: studentResult.id,
      number: studentResult.number,
      name: studentResult.name,
      round1Score: studentResult.prevResult?.avgTScore || studentResult.avgTScore,
      round2Score: null,
      change: null,
      changeDirection: null,
      round1Type: type,
      round2Type: null,
      typeChanged: false,
      round1TScores: studentResult.prevResult?.tScores || studentResult.tScores,
      round2TScores: null,
      round1TypeProbabilities: studentResult.prevResult?.typeProbabilities || studentResult.typeProbabilities,
      round2TypeProbabilities: null,
      round1LearningStatus: generateMockLearningStatus(type, 0),
      round2LearningStatus: null,
    };
  }

  const round1Score = studentResult.prevResult.avgTScore;
  const round2Score = studentResult.avgTScore;
  const change = round2Score - round1Score;

  // 변화 방향에 따라 학습 현황도 변화
  const variation = change > 3 ? 1 : change < -3 ? -1 : 0;

  return {
    id: studentResult.id,
    number: studentResult.number,
    name: studentResult.name,
    round1Score,
    round2Score,
    change,
    changeDirection: getChangeDirection(change),
    round1Type: studentResult.prevResult.predictedType,
    round2Type: studentResult.predictedType,
    typeChanged: studentResult.prevResult.predictedType !== studentResult.predictedType,
    round1TScores: studentResult.prevResult.tScores,
    round2TScores: studentResult.tScores,
    round1TypeProbabilities: studentResult.prevResult.typeProbabilities,
    round2TypeProbabilities: studentResult.typeProbabilities,
    round1LearningStatus: generateMockLearningStatus(studentResult.prevResult.predictedType, 0),
    round2LearningStatus: generateMockLearningStatus(studentResult.predictedType, variation),
  };
};

/** 반별 학생 변화 데이터 */
export const MOCK_STUDENT_CHANGE_DATA: Record<string, StudentChangeData[]> = {
  // group-1: 2-3반 (1차 완료, 2차 진행중)
  'group-1': MOCK_STUDENT_RESULTS['group-1'].map(generateStudentChangeData),
  // group-2: 1차 완료, 2차 진행중 (일부 2차 미응시)
  'group-2': MOCK_STUDENT_RESULTS['group-2'].map(generateStudentChangeData),
  // group-3: 1차/2차 모두 완료
  'group-3': MOCK_STUDENT_RESULTS['group-3'].map(generateStudentChangeData),
};

/** 반 변화 요약 계산 */
const calculateClassChangeSummary = (
  classId: string,
  className: string,
  students: StudentChangeData[],
): ClassChangeSummary => {
  const withRound2 = students.filter(s => s.round2Score !== null);

  const round1Avg = students.reduce((sum, s) => sum + (s.round1Score || 0), 0) / students.length;
  const round2Avg = withRound2.length > 0
    ? withRound2.reduce((sum, s) => sum + (s.round2Score || 0), 0) / withRound2.length
    : 0;

  const upCount = withRound2.filter(s => s.changeDirection === 'up').length;
  const sameCount = withRound2.filter(s => s.changeDirection === 'same').length;
  const downCount = withRound2.filter(s => s.changeDirection === 'down').length;

  return {
    classId,
    className,
    round1Avg: Math.round(round1Avg * 10) / 10,
    round2Avg: Math.round(round2Avg * 10) / 10,
    avgChange: Math.round((round2Avg - round1Avg) * 10) / 10,
    upCount,
    sameCount,
    downCount,
    totalCount: students.length,
    round2Count: withRound2.length,
  };
};

/** 반 변화 요약 */
export const MOCK_CLASS_CHANGE_SUMMARY: Record<string, ClassChangeSummary> = {
  'group-1': calculateClassChangeSummary('group-1', '2-3반', MOCK_STUDENT_CHANGE_DATA['group-1']),
  'group-2': calculateClassChangeSummary('group-2', '2-4반', MOCK_STUDENT_CHANGE_DATA['group-2']),
  'group-3': calculateClassChangeSummary('group-3', '2-5반', MOCK_STUDENT_CHANGE_DATA['group-3']),
};

/** 개입 이력 Mock 데이터 */
export const MOCK_INTERVENTION_HISTORY: Record<string, InterventionHistory[]> = {
  'group-1': [
    {
      id: 'int-g1-1',
      date: '2026-06-08',
      type: 'counseling',
      title: '1차 검사 결과 상담',
      description: '1차 검사 결과 기반 학급 전체 상담',
    },
    {
      id: 'int-g1-2',
      date: '2026-06-22',
      type: 'lesson',
      title: 'SEL 수업 - 자기이해',
      description: '자기정서인식 및 자기이해 역량 수업',
    },
    {
      id: 'int-g1-3',
      date: '2026-07-05',
      type: 'counseling',
      title: '학습 동기 상담',
      description: '학습 동기 저하 학생 대상 개별 상담',
    },
  ],
  'group-2': [
    // 상담
    {
      id: 'int-1',
      date: '2026-06-10',
      type: 'counseling',
      title: '1차 검사 결과 상담',
      description: '1차 검사 결과 기반 전체 학급 상담',
    },
    {
      id: 'int-2',
      date: '2026-06-20',
      type: 'counseling',
      title: '학업 스트레스 상담',
      description: '시험 기간 스트레스 관리 상담',
    },
    {
      id: 'int-8',
      date: '2026-07-01',
      type: 'counseling',
      title: '진로 상담',
      description: '학습 동기 향상을 위한 진로 탐색 상담',
    },
    // 수업
    {
      id: 'int-3',
      date: '2026-06-15',
      type: 'lesson',
      title: 'SEL 수업 - 감정 인식하기',
      description: '자기정서인식 역량 강화 수업',
    },
    {
      id: 'int-9',
      date: '2026-06-25',
      type: 'lesson',
      title: 'SEL 수업 - 공감 능력',
      description: '타인정서인식 및 공감 역량 수업',
    },
    // 코칭은 검사 시행 시 항상 제공되므로 개입 이력에 포함하지 않음
    // (바로가기 버튼으로만 표시)
  ],
  'group-3': [
    // 상담
    {
      id: 'int-5',
      date: '2026-06-05',
      type: 'counseling',
      title: '위험군 학생 개별 상담',
      description: '관심 필요 학생 5명 개별 상담',
    },
    {
      id: 'int-11',
      date: '2026-06-18',
      type: 'counseling',
      title: '학부모 연계 상담',
      description: '가정 환경 파악 및 협력 방안 논의',
    },
    // 수업
    {
      id: 'int-6',
      date: '2026-06-15',
      type: 'lesson',
      title: 'SEL 수업 - 스트레스 관리',
      description: '학업 스트레스 대처 전략 수업',
    },
    {
      id: 'int-7',
      date: '2026-06-28',
      type: 'lesson',
      title: 'SEL 수업 - 목표 설정하기',
      description: '자기주도 학습 목표 설정 수업',
    },
    // 코칭은 검사 시행 시 항상 제공되므로 개입 이력에 포함하지 않음
    // (바로가기 버튼으로만 표시)
  ],
};

/**
 * 학생별 개입 이력 (학생 ID -> 개입 ID 매핑)
 *
 * 다건 확인용 학생:
 * - sr2-1 (1번 김민준): 상담 3회, 수업 2회, 코칭 2회 = 총 7건
 * - sr3-1 (1번 이서연): 상담 2회, 수업 2회, 코칭 1회 = 총 5건
 */
export const MOCK_STUDENT_INTERVENTIONS: Record<string, string[]> = {
  // group-1 학생들 (2-3반)
  'sr1-1': ['int-g1-1', 'int-g1-2', 'int-g1-3'], // 1번 김민준 - 상담 2회, 수업 1회
  'sr1-2': ['int-g1-1', 'int-g1-2'],
  'sr1-3': ['int-g1-1', 'int-g1-3'],
  // group-2 학생들 (2-4반) - 상담/수업만 포함 (코칭은 바로가기로 제공)
  'sr2-1': ['int-1', 'int-2', 'int-8', 'int-3', 'int-9'], // 1번 김민준 - 상담 3회, 수업 2회
  'sr2-2': ['int-1', 'int-3'],
  'sr2-3': ['int-1', 'int-2', 'int-3'],
  // group-3 학생들 (2-5반)
  'sr3-1': ['int-5', 'int-11', 'int-6', 'int-7'], // 1번 이서연 - 상담 2회, 수업 2회
  'sr3-2': ['int-6', 'int-7'],
  'sr3-3': ['int-5', 'int-6'],
};
