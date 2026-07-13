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
  CounselingStudentItem,
  CounselingReasonTag,
  LearningStatus,
  AcademicAchievement,
  GradeSatisfaction,
  LearningMotivation,
  SelfStudyTime,
  LearningCounselor,
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
// 학생 상담 - 반 전체 Mock (화면 7번)
// ============================================================

/** 반 전체 학생 목록 (상담 기준 필터용) */
export const MOCK_CLASS_COUNSELING_STUDENTS: CounselingStudentItem[] = [
  {
    id: 's1',
    number: 1,
    name: '김민준',
    lpaType: '몰입자원 풍부형',
    avgTScore: 58,
    tags: ['strength'],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's2',
    number: 2,
    name: '이서연',
    lpaType: '안전 균형형',
    avgTScore: 52,
    tags: [],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's3',
    number: 3,
    name: '박지호',
    lpaType: '몰입자원 풍부형',
    avgTScore: 61,
    tags: ['strength'],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's4',
    number: 4,
    name: '최수아',
    lpaType: '자원소진형',
    avgTScore: 38,
    tags: ['burden'],
    lastCounselingAt: new Date('2026-07-08'),
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's5',
    number: 5,
    name: '정예준',
    lpaType: '안전 균형형',
    avgTScore: 50,
    tags: [],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's6',
    number: 6,
    name: '강하은',
    lpaType: '안전 균형형',
    avgTScore: 48,
    tags: ['obstacle'],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's7',
    number: 7,
    name: '조민서',
    lpaType: '자원소진형',
    avgTScore: 35,
    tags: ['burden'],
    lastCounselingAt: new Date('2026-07-07'),
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's8',
    number: 8,
    name: '윤지민',
    lpaType: '몰입자원 풍부형',
    avgTScore: 62,
    tags: ['strength'],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's9',
    number: 9,
    name: '한소희',
    lpaType: '안전 균형형',
    avgTScore: 55,
    tags: [],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's10',
    number: 10,
    name: '임지아',
    lpaType: '안전 균형형',
    avgTScore: 47,
    tags: ['reliability'],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's11',
    number: 11,
    name: '권도현',
    lpaType: '안전 균형형',
    avgTScore: 51,
    tags: [],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's12',
    number: 12,
    name: '오하린',
    lpaType: '몰입자원 풍부형',
    avgTScore: 68,
    tags: ['strength'],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's13',
    number: 13,
    name: '서준혁',
    lpaType: '안전 균형형',
    avgTScore: 49,
    tags: ['obstacle'],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's14',
    number: 14,
    name: '남유진',
    lpaType: '안전 균형형',
    avgTScore: 53,
    tags: [],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's15',
    number: 15,
    name: '송지원',
    lpaType: '안전 균형형',
    avgTScore: 54,
    tags: [],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's16',
    number: 16,
    name: '백서윤',
    lpaType: '몰입자원 풍부형',
    avgTScore: 59,
    tags: ['strength'],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's17',
    number: 17,
    name: '안재민',
    lpaType: '안전 균형형',
    avgTScore: 46,
    tags: [],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's18',
    number: 18,
    name: '문채원',
    lpaType: '안전 균형형',
    avgTScore: 65,
    tags: ['strength'],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's19',
    number: 19,
    name: '황민재',
    lpaType: '안전 균형형',
    avgTScore: 50,
    tags: [],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's20',
    number: 20,
    name: '노은서',
    lpaType: '안전 균형형',
    avgTScore: 52,
    tags: [],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's21',
    number: 21,
    name: '허지후',
    lpaType: '안전 균형형',
    avgTScore: 41,
    tags: ['burden'],
    lastCounselingAt: new Date('2026-07-05'),
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's22',
    number: 22,
    name: '류시우',
    lpaType: '안전 균형형',
    avgTScore: 55,
    tags: [],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's23',
    number: 23,
    name: '장하영',
    lpaType: '몰입자원 풍부형',
    avgTScore: 60,
    tags: ['strength'],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's24',
    number: 24,
    name: '배민석',
    lpaType: '안전 균형형',
    avgTScore: 48,
    tags: [],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's25',
    number: 25,
    name: '조아린',
    lpaType: '안전 균형형',
    avgTScore: 51,
    tags: ['reliability'],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
  {
    id: 's26',
    number: 26,
    name: '신태윤',
    lpaType: '안전 균형형',
    avgTScore: 49,
    tags: [],
    round: 1,
    assessedAt: new Date('2026-07-01'),
  },
];

/** 반별 상담 현황 (전체 현황용) */
export const MOCK_CLASS_COUNSELING_STATUS = [
  {
    classId: 'group-1',
    className: '2-3반',
    totalStudents: 26,
    priorityCount: 4,
    strengthCount: 7,
    reliabilityCount: 2,
    counseledThisMonth: 8,
  },
  {
    classId: 'group-2',
    className: '2-4반',
    totalStudents: 25,
    priorityCount: 2,
    strengthCount: 8,
    reliabilityCount: 1,
    counseledThisMonth: 5,
  },
  {
    classId: 'group-3',
    className: '2-5반',
    totalStudents: 24,
    priorityCount: 3,
    strengthCount: 6,
    reliabilityCount: 0,
    counseledThisMonth: 6,
  },
];

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
  // 신규 필드
  reasonTags: ['burden'],
  round: 1,
  assessedAt: new Date('2026-07-01'),
  aiSummary: '최수아 학생은 현재 학업 소진 상태에 있는 것으로 보입니다. 학업스트레스와 학업소진 점수가 높아 즉각적인 관심이 필요합니다. 먼저 학생의 현재 상태를 공감하고, 충분한 휴식과 함께 작은 성취 경험을 통해 자신감을 회복할 수 있도록 도와주세요.',
  keywords: ['학업소진', '스트레스', '휴식 필요', '정서 지원'],
  reliability: {
    consistencyIndex: 0.82,
    nonResponseRate: 0.02,
    warnings: [],
  },
  history: {
    round1TScore: 38,
    change: 'same',
  },
  strengthDetails: [
    {
      factorName: '회복탄력성',
      parentCategory: '자아강점',
      avgT: 52,
      definition: '어려운 상황이나 실패를 겪어도 다시 일어날 수 있는 심리적 회복력',
    },
    {
      factorName: '자기결정성',
      parentCategory: '자아강점',
      avgT: 48,
      definition: '스스로 선택하고 결정하며 주도적으로 행동하려는 의지',
    },
    {
      factorName: '대인관계',
      parentCategory: '자아강점',
      avgT: 45,
      definition: '다른 사람들과 원만하게 관계를 맺고 유지하는 능력',
    },
  ],
  weaknessDetails: [
    {
      factorName: '학업소진',
      parentCategory: '부정적공부마음',
      avgT: 72,
      definition: '공부 때문에 지쳐서 아무 즐거움이나 흥미가 없는 피로 상태',
    },
    {
      factorName: '학업스트레스',
      parentCategory: '학습걸림돌',
      avgT: 68,
      definition: '공부와 관련하여 느끼는 심리적 부담감과 압박감',
    },
    {
      factorName: '시험불안',
      parentCategory: '부정적공부마음',
      avgT: 65,
      definition: '시험을 앞두고 느끼는 불안, 긴장, 두려움의 정도',
    },
  ],
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

// 상담 이유 태그 → 추천 질문 맵핑
const getRecommendedQuestionsForTags = (tags: CounselingReasonTag[]): RecommendedQuestion[] => {
  const questions: RecommendedQuestion[] = [];

  if (tags.includes('burden')) {
    questions.push(
      {
        id: 'q-burden-1',
        category: '공부부담',
        question: '요즘 공부할 때 가장 힘든 점은 무엇인가요?',
        purpose: '학업 부담 정도 파악',
      },
      {
        id: 'q-burden-2',
        category: '공부부담',
        question: '시험 기간에 잠은 잘 자고 있나요?',
        purpose: '신체적 소진 상태 확인',
      }
    );
  }

  if (tags.includes('obstacle')) {
    questions.push(
      {
        id: 'q-obstacle-1',
        category: '학습방해',
        question: '공부하다가 집중이 안 될 때 주로 무엇을 하게 되나요?',
        purpose: '방해 요인 파악',
      },
      {
        id: 'q-obstacle-2',
        category: '학습방해',
        question: '하루에 스마트폰을 얼마나 사용하나요?',
        purpose: '스마트폰 사용 패턴 확인',
      }
    );
  }

  if (tags.includes('reliability')) {
    questions.push(
      {
        id: 'q-reliability-1',
        category: '응답확인',
        question: '검사할 때 어려웠던 점이 있었나요?',
        purpose: '검사 상황 맥락 확인',
      },
      {
        id: 'q-reliability-2',
        category: '응답확인',
        question: '질문 중에 이해가 잘 안 됐던 것이 있었나요?',
        purpose: '응답 신뢰도 맥락 파악',
      }
    );
  }

  if (tags.includes('strength')) {
    questions.push(
      {
        id: 'q-strength-1',
        category: '강점',
        question: '스스로 잘한다고 생각하는 것은 무엇인가요?',
        purpose: '강점 인식 확인',
      },
      {
        id: 'q-strength-2',
        category: '강점',
        question: '공부할 때 가장 재미있는 과목은 무엇인가요?',
        purpose: '학습 흥미 영역 발굴',
      }
    );
  }

  // 기본 질문 추가
  if (questions.length < 3) {
    questions.push(...MOCK_RECOMMENDED_QUESTIONS.slice(0, 3 - questions.length));
  }

  return questions.slice(0, 5);
};

// 학생 ID로 조회
export const getStudentCounselingSummary = (studentId: string): StudentCounselingSummary | undefined => {
  // 기존 s4 학생
  if (studentId === 's4') {
    return MOCK_STUDENT_COUNSELING_SUMMARY;
  }

  // MOCK_CLASS_COUNSELING_STUDENTS에서 찾기 (신규)
  const counselingStudent = MOCK_CLASS_COUNSELING_STUDENTS.find((s) => s.id === studentId);
  if (counselingStudent) {
    const needsAttention = counselingStudent.tags.includes('burden') || counselingStudent.avgTScore < 40;
    const tags = counselingStudent.tags as CounselingReasonTag[];

    return {
      studentId: counselingStudent.id,
      studentName: counselingStudent.name,
      studentNumber: counselingStudent.number,
      lpaType: counselingStudent.lpaType,
      needsAttention,
      attentionReason: needsAttention ? '공부부담 신호 감지' : undefined,
      avgTScore: counselingStudent.avgTScore,
      strengths: tags.includes('strength') ? ['자기효능감', '성장마인드셋', '학습동기'] : ['회복탄력성'],
      weaknesses: tags.includes('burden') ? ['학업소진', '학업스트레스'] : [],
      recommendedQuestions: getRecommendedQuestionsForTags(tags),
      memos: [],
      records: MOCK_RECENT_RECORDS.filter((r) => r.studentId === studentId),
      totalCounselingCount: Math.floor(Math.random() * 5) + 1,
      thisTermCount: Math.floor(Math.random() * 3),
      lastCounselingDate: counselingStudent.lastCounselingAt || null,
      mainCounselingArea: tags.includes('burden') ? '정서·심리' : '학업',
      reasonTags: tags,
      round: counselingStudent.round,
      assessedAt: counselingStudent.assessedAt,
      aiSummary: generateAISummary(counselingStudent.name, tags, counselingStudent.avgTScore),
      keywords: generateKeywords(tags),
      reliability: {
        consistencyIndex: tags.includes('reliability') ? 0.65 : 0.88,
        nonResponseRate: tags.includes('reliability') ? 0.08 : 0.01,
        warnings: tags.includes('reliability') ? ['일부 문항 응답 일관성 낮음'] : [],
      },
      history: {
        round1TScore: counselingStudent.avgTScore,
        change: 'same',
      },
      strengthDetails: tags.includes('strength')
        ? [
            { factorName: '자기효능감', parentCategory: '자아강점', avgT: 65, definition: '자신이 어떤 일을 성공적으로 수행할 수 있다는 믿음' },
            { factorName: '성장마인드셋', parentCategory: '긍정적공부마음', avgT: 62, definition: '능력이 노력을 통해 성장할 수 있다는 믿음' },
            { factorName: '학습동기', parentCategory: '학습디딤돌', avgT: 60, definition: '배움에 대한 내적 동기와 흥미' },
          ]
        : [],
      weaknessDetails: tags.includes('burden')
        ? [
            { factorName: '학업소진', parentCategory: '부정적공부마음', avgT: 70, definition: '공부로 인한 피로와 무기력감' },
            { factorName: '학업스트레스', parentCategory: '학습걸림돌', avgT: 68, definition: '공부와 관련된 심리적 부담감' },
          ]
        : [],
      learningStatus: generateLearningStatus(counselingStudent.id, tags, counselingStudent.avgTScore),
    };
  }

  // MOCK_PRIORITY_STUDENTS에서 찾기 (레거시 호환)
  const priorityStudent = MOCK_PRIORITY_STUDENTS.find((s) => s.id === studentId);
  if (priorityStudent) {
    const tags: CounselingReasonTag[] = priorityStudent.category === 'attention' ? ['burden'] : priorityStudent.category === 'reliability' ? ['reliability'] : ['strength'];

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
      recommendedQuestions: getRecommendedQuestionsForTags(tags),
      memos: [],
      records: MOCK_RECENT_RECORDS.filter((r) => r.studentId === studentId),
      totalCounselingCount: 3,
      thisTermCount: 2,
      lastCounselingDate: priorityStudent.lastCounselingAt || null,
      mainCounselingArea: '학업',
      reasonTags: tags,
      round: 1,
      assessedAt: new Date('2026-07-01'),
      aiSummary: generateAISummary(priorityStudent.name, tags, 50),
      keywords: generateKeywords(tags),
      learningStatus: generateLearningStatus(priorityStudent.id, tags, 50),
    };
  }

  // STUDENT_LIST에서 찾기 (SchedulePage의 MOCK_STUDENTS와 동기화)
  const student = STUDENT_LIST.find((s) => s.id === studentId);
  if (student) {
    const needsAttention = student.lpaType === '자원소진형' || student.lpaType === '정서조절 취약형';
    const tags: CounselingReasonTag[] = needsAttention ? ['burden'] : [];

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
      recommendedQuestions: getRecommendedQuestionsForTags(tags),
      memos: [],
      records: [],
      totalCounselingCount: Math.floor(Math.random() * 5) + 1,
      thisTermCount: Math.floor(Math.random() * 3),
      lastCounselingDate: new Date('2026-07-05'),
      mainCounselingArea: '학업',
      reasonTags: tags,
      round: 1,
      assessedAt: new Date('2026-07-01'),
      aiSummary: generateAISummary(student.name, tags, student.lpaType === '자원소진형' ? 38 : 55),
      keywords: generateKeywords(tags),
      learningStatus: generateLearningStatus(student.id, tags, student.lpaType === '자원소진형' ? 38 : 55),
    };
  }

  return undefined;
};

// AI 분석 총평 생성 (Mock)
const generateAISummary = (name: string, tags: CounselingReasonTag[], avgT: number): string => {
  if (tags.includes('burden')) {
    return `${name} 학생은 현재 학업 관련 부담을 느끼고 있는 것으로 보입니다. 평균 T점수 ${avgT}점으로 또래 대비 낮은 편이며, 먼저 학생의 현재 상태를 공감하고 충분한 휴식과 함께 작은 성취 경험을 통해 자신감을 회복할 수 있도록 도와주세요.`;
  }
  if (tags.includes('obstacle')) {
    return `${name} 학생은 학습 흐름을 방해하는 요인이 감지되었습니다. 스마트폰 사용이나 시간 관리 등에서 어려움을 겪고 있을 수 있으니, 구체적인 방해 요인을 파악하고 함께 개선 방안을 찾아보세요.`;
  }
  if (tags.includes('reliability')) {
    return `${name} 학생의 검사 응답에서 일부 일관성이 낮은 부분이 확인되었습니다. 검사 당시 상황이나 문항 이해도를 먼저 확인해보시고, 결과 해석 시 주의가 필요합니다.`;
  }
  if (tags.includes('strength')) {
    return `${name} 학생은 긍정적인 학습 자원을 풍부하게 갖추고 있습니다. 평균 T점수 ${avgT}점으로 안정적인 학습 심리 상태를 보이며, 현재의 강점을 유지하면서 더 높은 목표에 도전할 수 있도록 격려해주세요.`;
  }
  return `${name} 학생은 전반적으로 안정적인 학습 심리 상태를 보이고 있습니다. 특별히 우려되는 영역은 없으며, 현재의 학습 패턴을 유지하면서 강점 영역을 더욱 발전시킬 수 있도록 격려해주세요.`;
};

// 핵심 키워드 생성 (Mock)
const generateKeywords = (tags: CounselingReasonTag[]): string[] => {
  const keywordMap: Record<CounselingReasonTag, string[]> = {
    burden: ['학업부담', '스트레스', '휴식 필요', '정서 지원'],
    obstacle: ['학습방해', '시간관리', '집중력', '환경개선'],
    reliability: ['응답확인', '맥락파악', '재검사 고려'],
    strength: ['강점활용', '자기효능감', '동기강화', '목표설정'],
  };

  const keywords: string[] = [];
  tags.forEach((tag) => {
    keywords.push(...keywordMap[tag]);
  });

  return keywords.length > 0 ? keywords : ['안정적', '균형잡힌', '관찰필요'];
};

// 개인학습현황 생성 (Mock) - 문항 120~124번
const generateLearningStatus = (studentId: string, tags: CounselingReasonTag[], avgTScore: number): LearningStatus => {
  // 학생 특성에 따라 다양한 학습 현황 생성
  const hasBurden = tags.includes('burden');
  const hasStrength = tags.includes('strength');
  const hasObstacle = tags.includes('obstacle');

  // 학업성취도 (성적 수준)
  const achievementOptions: AcademicAchievement[] = ['top10', 'top30', 'middle', 'bottom30', 'bottom10'];
  let academicAchievement: AcademicAchievement;
  if (avgTScore >= 60) academicAchievement = 'top10';
  else if (avgTScore >= 55) academicAchievement = 'top30';
  else if (avgTScore >= 45) academicAchievement = 'middle';
  else if (avgTScore >= 40) academicAchievement = 'bottom30';
  else academicAchievement = 'bottom10';

  // 성적만족도 (burden 태그일 경우 불만족 경향)
  const satisfactionOptions: GradeSatisfaction[] = ['very_satisfied', 'satisfied', 'neutral', 'dissatisfied', 'very_dissatisfied'];
  let gradeSatisfaction: GradeSatisfaction;
  if (hasBurden) {
    gradeSatisfaction = satisfactionOptions[Math.floor(Math.random() * 2) + 3]; // dissatisfied or very_dissatisfied
  } else if (hasStrength) {
    gradeSatisfaction = satisfactionOptions[Math.floor(Math.random() * 2)]; // very_satisfied or satisfied
  } else {
    gradeSatisfaction = satisfactionOptions[Math.floor(Math.random() * 3) + 1]; // satisfied, neutral, dissatisfied
  }

  // 학습동기 (강점 태그일 경우 내재적 동기 경향)
  const motivationOptions: LearningMotivation[] = ['interest', 'future', 'parents', 'peers', 'none'];
  let learningMotivation: LearningMotivation;
  if (hasStrength) {
    learningMotivation = motivationOptions[Math.floor(Math.random() * 2)]; // interest or future
  } else if (hasBurden) {
    learningMotivation = motivationOptions[Math.floor(Math.random() * 2) + 2]; // parents or peers
  } else {
    learningMotivation = motivationOptions[Math.floor(Math.random() * 3) + 1]; // future, parents, peers
  }

  // 혼공시간 (obstacle 태그일 경우 짧은 시간 경향)
  const studyTimeOptions: SelfStudyTime[] = ['none', 'under1h', '1to2h', '2to3h', 'over3h'];
  let selfStudyTime: SelfStudyTime;
  if (hasObstacle) {
    selfStudyTime = studyTimeOptions[Math.floor(Math.random() * 2)]; // none or under1h
  } else if (hasStrength) {
    selfStudyTime = studyTimeOptions[Math.floor(Math.random() * 2) + 3]; // 2to3h or over3h
  } else {
    selfStudyTime = studyTimeOptions[Math.floor(Math.random() * 3) + 1]; // under1h, 1to2h, 2to3h
  }

  // 학습고민상담사 (burden 태그일 경우 상담 안 하는 경향)
  const counselorOptions: LearningCounselor[] = ['parents', 'teacher', 'friends', 'self', 'none'];
  let learningCounselor: LearningCounselor;
  if (hasBurden) {
    learningCounselor = counselorOptions[Math.floor(Math.random() * 2) + 3]; // self or none
  } else {
    learningCounselor = counselorOptions[Math.floor(Math.random() * 3)]; // parents, teacher, friends
  }

  return {
    academicAchievement,
    gradeSatisfaction,
    learningMotivation,
    selfStudyTime,
    learningCounselor,
  };
};
