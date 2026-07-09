/**
 * 상담·코칭 Feature - Mock 데이터
 *
 * 개발/테스트용 가상 데이터
 */

import type {
  CounselingOverviewSummary,
  CounselingRecord,
  PriorityStudent,
  CounselingStats,
  RecommendedQuestion,
  StudentCounselingSummary,
} from './types';

// ============================================================
// 전체 현황 Mock (화면 7번)
// ============================================================

export const MOCK_COUNSELING_OVERVIEW: CounselingOverviewSummary = {
  targetStudentCount: 8,
  activeCoachingCount: 5,
  scheduledThisWeek: 4,
  completedThisMonth: 12,
};

export const MOCK_RECENT_RECORDS: CounselingRecord[] = [
  {
    id: 'r1',
    studentId: 's4',
    studentName: '최수아',
    studentNumber: 4,
    classId: 'group-1',
    className: '2-3반',
    scheduledAt: new Date('2026-07-08 14:00'),
    duration: 30,
    type: 'initial',
    area: 'emotion',
    status: 'completed',
    reason: '학업 스트레스 상담',
    summary: '학업 스트레스로 인한 불안 호소. 시험 기간 수면 패턴 불규칙.',
    nextSteps: '주 1회 정기 상담 예정, 이완 기법 안내',
    createdAt: new Date('2026-07-08'),
  },
  {
    id: 'r2',
    studentId: 's7',
    studentName: '조민서',
    studentNumber: 7,
    classId: 'group-1',
    className: '2-3반',
    scheduledAt: new Date('2026-07-07 15:30'),
    duration: 25,
    type: 'follow-up',
    area: 'peer',
    status: 'completed',
    reason: '교우관계 후속 상담',
    summary: '친구 관계 개선 노력 중. 소그룹 활동 참여 증가.',
    createdAt: new Date('2026-07-07'),
  },
  {
    id: 'r3',
    studentId: 's21',
    studentName: '허지후',
    studentNumber: 21,
    classId: 'group-1',
    className: '2-3반',
    scheduledAt: new Date('2026-07-05 11:00'),
    duration: 20,
    type: 'regular',
    area: 'academic',
    status: 'completed',
    reason: '학습 동기 부여',
    summary: '학습 목표 설정 진행. 단기 목표 3개 설정.',
    createdAt: new Date('2026-07-05'),
  },
];

export const MOCK_SCHEDULED_RECORDS: CounselingRecord[] = [
  {
    id: 'r4',
    studentId: 's4',
    studentName: '최수아',
    studentNumber: 4,
    classId: 'group-1',
    className: '2-3반',
    scheduledAt: new Date('2026-07-10 14:00'),
    type: 'follow-up',
    area: 'emotion',
    status: 'scheduled',
    reason: '주간 정기 상담',
    createdAt: new Date('2026-07-08'),
  },
  {
    id: 'r5',
    studentId: 's10',
    studentName: '임지아',
    studentNumber: 10,
    classId: 'group-1',
    className: '2-3반',
    scheduledAt: new Date('2026-07-11 10:30'),
    type: 'initial',
    area: 'academic',
    status: 'scheduled',
    reason: '검사 결과 상담',
    createdAt: new Date('2026-07-09'),
  },
  {
    id: 'r6',
    studentId: 's15',
    studentName: '송지원',
    studentNumber: 15,
    classId: 'group-2',
    className: '2-4반',
    scheduledAt: new Date('2026-07-12 13:00'),
    type: 'regular',
    area: 'career',
    status: 'scheduled',
    reason: '진로 상담',
    createdAt: new Date('2026-07-09'),
  },
];

// ============================================================
// 학생 상담 - 반 전체 Mock (화면 8번)
// ============================================================

export const MOCK_PRIORITY_STUDENTS: PriorityStudent[] = [
  {
    id: 's4',
    number: 4,
    name: '최수아',
    category: 'attention',
    reason: '학업소진 T점수 35 이하',
    lpaType: '자원소진형',
    lastCounselingAt: new Date('2026-07-08'),
  },
  {
    id: 's7',
    number: 7,
    name: '조민서',
    category: 'attention',
    reason: '자아존중감 T점수 32',
    lpaType: '자원소진형',
    lastCounselingAt: new Date('2026-07-07'),
  },
  {
    id: 's21',
    number: 21,
    name: '허지후',
    category: 'attention',
    reason: '학업스트레스 T점수 75 이상',
    lpaType: '안전 균형형',
    lastCounselingAt: new Date('2026-07-05'),
  },
  {
    id: 's12',
    number: 12,
    name: '오하린',
    category: 'emotion',
    reason: '감정활용 요인 높음 (T=68)',
    lpaType: '몰입자원 풍부형',
  },
  {
    id: 's18',
    number: 18,
    name: '문채원',
    category: 'emotion',
    reason: '정서조절 요인 높음 (T=65)',
    lpaType: '안전 균형형',
  },
  {
    id: 's10',
    number: 10,
    name: '임지아',
    category: 'reliability',
    reason: '응답 일관성 부족',
    lpaType: '안전 균형형',
  },
];

export const MOCK_COUNSELING_STATS: CounselingStats = {
  totalCount: 15,
  byType: {
    regular: 5,
    urgent: 2,
    'follow-up': 6,
    initial: 2,
  },
  byArea: {
    academic: 4,
    career: 2,
    peer: 3,
    family: 1,
    emotion: 4,
    behavior: 0,
    health: 1,
    other: 0,
  },
  avgDuration: 25,
};

// ============================================================
// 학생 상담 - 학생 선택 Mock (화면 9번)
// ============================================================

export const MOCK_RECOMMENDED_QUESTIONS: RecommendedQuestion[] = [
  {
    id: 'q1',
    category: '정서',
    question: '요즘 기분이 어떤가요? 특별히 힘든 일이 있었나요?',
    purpose: '현재 정서 상태 파악',
  },
  {
    id: 'q2',
    category: '학업',
    question: '공부할 때 가장 어려운 점은 무엇인가요?',
    purpose: '학습 장벽 요인 탐색',
  },
  {
    id: 'q3',
    category: '동기',
    question: '앞으로 어떤 목표를 이루고 싶나요?',
    purpose: '내적 동기 발굴',
  },
  {
    id: 'q4',
    category: '관계',
    question: '학교에서 가장 편하게 이야기할 수 있는 친구가 있나요?',
    purpose: '사회적 지지 체계 확인',
  },
  {
    id: 'q5',
    category: '강점',
    question: '스스로 잘한다고 생각하는 것은 무엇인가요?',
    purpose: '자기효능감 강화',
  },
];

export const MOCK_STUDENT_COUNSELING_SUMMARY: StudentCounselingSummary = {
  studentId: 's4',
  studentName: '최수아',
  studentNumber: 4,
  lpaType: '자원소진형',
  needsAttention: true,
  attentionReason: '학업소진 T점수 35 이하',
  avgTScore: 38,
  strengths: ['회복탄력성', '자기결정성'],
  weaknesses: ['학업소진', '학업스트레스', '시험불안'],
  recommendedQuestions: MOCK_RECOMMENDED_QUESTIONS,
  memos: [
    {
      id: 'm1',
      studentId: 's4',
      content: '시험 기간 수면 패턴이 불규칙함. 새벽까지 공부하다 다음 날 피곤해하는 패턴 반복.',
      createdAt: new Date('2026-07-08'),
      updatedAt: new Date('2026-07-08'),
    },
    {
      id: 'm2',
      studentId: 's4',
      content: '가정에서도 학업 성취에 대한 압박이 있는 것 같음. 부모 상담 고려.',
      createdAt: new Date('2026-07-05'),
      updatedAt: new Date('2026-07-05'),
    },
  ],
  records: MOCK_RECENT_RECORDS.filter((r) => r.studentId === 's4'),
  totalCounselingCount: 5,
  thisTermCount: 3,
  lastCounselingDate: new Date('2026-07-08'),
  mainCounselingArea: '정서·심리',
};

/** 학생 목록 (SchedulePage와 동기화) */
const STUDENT_LIST = [
  { id: 'student-1', number: 1, name: '김민준', lpaType: '자원소진형' as const },
  { id: 'student-2', number: 2, name: '이서연', lpaType: '안전 균형형' as const },
  { id: 'student-3', number: 3, name: '박지호', lpaType: '몰입자원 풍부형' as const },
  { id: 'student-4', number: 4, name: '최수아', lpaType: '자원소진형' as const },
  { id: 'student-5', number: 5, name: '정예준', lpaType: '안전 균형형' as const },
  { id: 'student-6', number: 6, name: '강하은', lpaType: '정서조절 취약형' as const },
  { id: 'student-7', number: 7, name: '조현우', lpaType: '안전 균형형' as const },
  { id: 'student-8', number: 8, name: '윤지민', lpaType: '몰입자원 풍부형' as const },
];

// 학생 ID로 조회
export const getStudentCounselingSummary = (studentId: string): StudentCounselingSummary | undefined => {
  // 기존 s4 학생
  if (studentId === 's4') {
    return MOCK_STUDENT_COUNSELING_SUMMARY;
  }

  // MOCK_PRIORITY_STUDENTS에서 찾기
  const priorityStudent = MOCK_PRIORITY_STUDENTS.find((s) => s.id === studentId);
  if (priorityStudent) {
    return {
      studentId: priorityStudent.id,
      studentName: priorityStudent.name,
      studentNumber: priorityStudent.number,
      lpaType: priorityStudent.lpaType || '안전 균형형',
      needsAttention: priorityStudent.category === 'attention',
      attentionReason: priorityStudent.category === 'attention' ? priorityStudent.reason : undefined,
      avgTScore: 50,
      strengths: ['자아존중감', '학습동기'],
      weaknesses: ['학업스트레스'],
      recommendedQuestions: MOCK_RECOMMENDED_QUESTIONS,
      memos: [],
      records: MOCK_RECENT_RECORDS.filter((r) => r.studentId === studentId),
      totalCounselingCount: 3,
      thisTermCount: 2,
      lastCounselingDate: priorityStudent.lastCounselingAt || null,
      mainCounselingArea: '학업',
    };
  }

  // STUDENT_LIST에서 찾기 (SchedulePage의 MOCK_STUDENTS와 동기화)
  const student = STUDENT_LIST.find((s) => s.id === studentId);
  if (student) {
    const needsAttention = student.lpaType === '자원소진형' || student.lpaType === '정서조절 취약형';
    return {
      studentId: student.id,
      studentName: student.name,
      studentNumber: student.number,
      lpaType: student.lpaType,
      needsAttention,
      attentionReason: needsAttention ? `${student.lpaType} - 관심 필요` : undefined,
      avgTScore: student.lpaType === '자원소진형' ? 38 : student.lpaType === '정서조절 취약형' ? 42 : 55,
      strengths: ['회복탄력성', '학습동기'],
      weaknesses: ['학업스트레스'],
      recommendedQuestions: MOCK_RECOMMENDED_QUESTIONS,
      memos: [],
      records: [],
      totalCounselingCount: Math.floor(Math.random() * 5) + 1,
      thisTermCount: Math.floor(Math.random() * 3),
      lastCounselingDate: new Date('2026-07-05'),
      mainCounselingArea: '학업',
    };
  }

  return undefined;
};
