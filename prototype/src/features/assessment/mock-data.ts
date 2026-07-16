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
  totalClasses: 3,
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
  // group-1: 1차만 완료된 반 (일부 학생 미응시)
  'group-1': MOCK_STUDENTS_CLASS_1.slice(0, 26).map((s, i) => {
    // 14번, 17번 학생은 미응시
    if (s.number === 14 || s.number === 17) {
      return generateStudentResult(`sr1-${i + 1}`, s.number, s.name, 0);
    }
    return generateStudentResult(`sr1-${i + 1}`, s.number, s.name, 1);
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
};

/** 학생 ID로 결과 조회 */
export const getStudentResultById = (groupId: string, studentId: string): StudentExamResult | undefined => {
  const results = MOCK_STUDENT_RESULTS[groupId];
  return results?.find(r => r.id === studentId);
};
