/**
 * 코칭 Mock 데이터
 */

import type {
  SELContent,
  ClassCharacteristics,
  ClassStrategy,
  StudentCoachingStrategy,
  CoachingProgress,
} from './types';

/** 반 특성 분석 Mock */
export const MOCK_CLASS_CHARACTERISTICS: ClassCharacteristics = {
  totalStudents: 28,
  lpaDistribution: {
    '자원소진형': 3,
    '안전 균형형': 12,
    '몰입자원 풍부형': 8,
    '냉소적 무기력형': 0,
    '정서조절 취약형': 0,
    '자기주도 몰입형': 5,
  },
  dominantType: '안전 균형형',
  strengths: [
    '전반적으로 안정적인 정서 상태 유지',
    '협동 활동에 대한 높은 참여도',
    '자기주도 몰입형 학생들의 리더십',
  ],
  challenges: [
    '자원소진형 학생 3명에 대한 집중 지원 필요',
    '새로운 도전에 대한 전반적인 소극적 태도',
    '학업 스트레스 관리 지원 필요',
  ],
  recommendedFocus: [
    '자원소진형 학생 회복 지원',
    '성장 마인드셋 함양 활동',
    '협동 학습 기회 확대',
  ],
};

/** SEL 콘텐츠 추천 Mock */
export const MOCK_SEL_CONTENTS: SELContent[] = [
  {
    id: 'sel-1',
    title: '나의 감정 일기장',
    category: 'self-awareness',
    description: '매일 자신의 감정을 기록하고 패턴을 인식하는 활동입니다.',
    duration: 15,
    targetLPATypes: ['자원소진형', '정서조절 취약형'],
    tags: ['감정인식', '자기성찰', '일상활동'],
  },
  {
    id: 'sel-2',
    title: '스트레스 관리 기법',
    category: 'self-management',
    description: '호흡법, 이완 기법 등 스트레스 상황에서 활용할 수 있는 기법을 학습합니다.',
    duration: 30,
    targetLPATypes: ['자원소진형', '정서조절 취약형', '냉소적 무기력형'],
    tags: ['스트레스', '이완', '호흡'],
  },
  {
    id: 'sel-3',
    title: '강점 발견 워크숍',
    category: 'self-awareness',
    description: '자신의 강점을 발견하고 활용하는 방법을 탐색합니다.',
    duration: 45,
    targetLPATypes: ['자원소진형', '안전 균형형', '냉소적 무기력형'],
    tags: ['강점', '자존감', '자기효능감'],
  },
  {
    id: 'sel-4',
    title: '공감 대화 연습',
    category: 'social-awareness',
    description: '타인의 감정을 이해하고 공감하는 대화 기술을 연습합니다.',
    duration: 40,
    targetLPATypes: ['안전 균형형', '몰입자원 풍부형', '자기주도 몰입형'],
    tags: ['공감', '의사소통', '관계'],
  },
  {
    id: 'sel-5',
    title: '목표 설정과 계획',
    category: 'decision-making',
    description: 'SMART 목표 설정법을 배우고 실천 계획을 수립합니다.',
    duration: 35,
    targetLPATypes: ['안전 균형형', '몰입자원 풍부형', '자기주도 몰입형'],
    tags: ['목표', '계획', '실행'],
  },
  {
    id: 'sel-6',
    title: '갈등 해결 역할극',
    category: 'relationship',
    description: '다양한 갈등 상황에서의 해결 전략을 역할극으로 연습합니다.',
    duration: 50,
    targetLPATypes: ['안전 균형형', '정서조절 취약형'],
    tags: ['갈등해결', '역할극', '협동'],
  },
];

/** 반 운영 전략 Mock */
export const MOCK_CLASS_STRATEGIES: ClassStrategy[] = [
  {
    id: 'strategy-1',
    title: '협동 학습 강화 프로그램',
    description: '학생들 간의 협력을 촉진하고 상호 지원 문화를 형성합니다.',
    targetArea: '관계 형성',
    activities: [
      '주 1회 모둠 프로젝트 활동',
      '또래 멘토링 시스템 운영',
      '협동 게임 및 팀 빌딩 활동',
    ],
    expectedOutcomes: [
      '학생 간 긍정적 상호작용 증가',
      '고립 학생 감소',
      '학급 응집력 향상',
    ],
  },
  {
    id: 'strategy-2',
    title: '자원소진형 학생 회복 지원',
    description: '자원소진형 학생들을 위한 집중 지원 프로그램입니다.',
    targetArea: '개별 지원',
    activities: [
      '주 2회 개별 체크인 상담',
      '작은 성공 경험 기회 제공',
      '스트레스 관리 기법 교육',
    ],
    expectedOutcomes: [
      '자기효능감 회복',
      '학교생활 적응도 향상',
      '긍정적 정서 증가',
    ],
  },
  {
    id: 'strategy-3',
    title: '성장 마인드셋 함양',
    description: '도전을 두려워하지 않는 성장 지향적 태도를 기릅니다.',
    targetArea: '학습 태도',
    activities: [
      '실패 경험 공유 및 학습 활동',
      '과정 중심 피드백 강화',
      '성장 마인드셋 관련 독서 토론',
    ],
    expectedOutcomes: [
      '새로운 도전에 대한 적극적 태도',
      '실패에 대한 건강한 인식',
      '학습 동기 향상',
    ],
  },
];

/** 학생별 코칭 전략 Mock */
export const MOCK_STUDENT_COACHING_STRATEGIES: StudentCoachingStrategy[] = [
  {
    studentId: 'student-1',
    studentName: '김민준',
    studentNumber: 1,
    lpaType: '자원소진형',
    keyStrengths: ['끈기', '성실함', '책임감'],
    growthAreas: ['자기효능감', '스트레스 관리', '긍정적 자기 대화'],
    teacherGuidelines: [
      '작은 성공 경험을 자주 제공해주세요',
      '과정 중심의 구체적인 칭찬을 해주세요',
      '실수에 대해 수용적인 분위기를 만들어주세요',
    ],
    studentGuidelines: [
      '매일 잘한 점 3가지 적어보기',
      '힘들 때 선생님께 도움 요청하기',
      '작은 목표부터 차근차근 도전하기',
    ],
    parentGuidelines: [
      '결과보다 노력과 과정을 칭찬해주세요',
      '비교 없이 자녀의 성장에 집중해주세요',
      '충분한 휴식과 여가 시간을 보장해주세요',
    ],
  },
  {
    studentId: 'student-2',
    studentName: '이서연',
    studentNumber: 2,
    lpaType: '안전 균형형',
    keyStrengths: ['안정감', '협동심', '배려심'],
    growthAreas: ['새로운 도전', '자기표현', '리더십'],
    teacherGuidelines: [
      '안전한 환경에서 새로운 역할을 시도하게 해주세요',
      '의견을 물어보고 경청해주세요',
      '점진적으로 책임을 늘려가주세요',
    ],
    studentGuidelines: [
      '새로운 것 한 가지 시도해보기',
      '친구들 앞에서 발표 연습하기',
      '모둠 활동에서 작은 역할 맡아보기',
    ],
    parentGuidelines: [
      '새로운 경험을 격려해주세요',
      '실패해도 괜찮다는 메시지를 전달해주세요',
      '자녀의 의견을 존중해주세요',
    ],
  },
];

/** 코칭 진행 현황 Mock */
export const MOCK_COACHING_PROGRESS: CoachingProgress[] = [
  {
    studentId: 'student-1',
    studentName: '김민준',
    studentNumber: 1,
    lpaType: '자원소진형',
    startDate: new Date('2026-03-01'),
    currentPhase: '자기효능감 회복',
    completedActivities: 4,
    totalActivities: 8,
    lastActivityDate: new Date('2026-03-15'),
    nextActivityDue: new Date('2026-03-22'),
  },
  {
    studentId: 'student-3',
    studentName: '박지호',
    studentNumber: 3,
    lpaType: '자원소진형',
    startDate: new Date('2026-03-05'),
    currentPhase: '스트레스 관리',
    completedActivities: 2,
    totalActivities: 6,
    lastActivityDate: new Date('2026-03-12'),
    nextActivityDue: new Date('2026-03-19'),
  },
  {
    studentId: 'student-6',
    studentName: '강하은',
    studentNumber: 6,
    lpaType: '정서조절 취약형',
    startDate: new Date('2026-02-28'),
    currentPhase: '감정 조절 기법',
    completedActivities: 5,
    totalActivities: 7,
    lastActivityDate: new Date('2026-03-16'),
    nextActivityDue: new Date('2026-03-20'),
  },
];
