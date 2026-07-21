/**
 * 코칭 Mock 데이터
 *
 * 코칭 페이지 구조:
 * - 탭 1: 학급 코칭 - 학급 전체 대상 코칭 정보
 * - 탭 2: 학생 코칭 - 개별 학생 대상 코칭 정보
 */

import type {
  ClassCoachingData,
  StudentCoachingData,
  LPATypeStrategy,
  CoachingStudentItem,
  // 레거시 타입
  SELContent,
  ClassCharacteristics,
  ClassStrategy,
  StudentCoachingStrategy,
  CoachingProgress,
} from './types';

// ============================================================
// LPA 유형별 전략 데이터 (중등 기준)
// ============================================================

/** LPA 유형별 전략 데이터 */
export const LPA_TYPE_STRATEGIES: Record<string, LPATypeStrategy> = {
  '자기주도 몰입형': {
    type: '자기주도 몰입형',
    characteristics:
      '심리·정서적 자원이 풍부하고 자기주도적 몰입 가능성이 높은 유형입니다. 학습에 대한 내적 동기가 강하고, 스스로 계획하고 실행하는 능력이 뛰어납니다.',
    strategyTitle: '심화 학습 기회 확대',
    strategyDescription:
      '현재의 강점을 유지하면서 도전 목표와 심화 학습 기회를 제공해주세요. 자기주도 몰입형 학생들은 더 높은 수준의 과제와 프로젝트를 통해 성장할 수 있습니다.',
    actionItems: [
      '학생 주도의 프로젝트 학습 기회 제공',
      '심화 과제나 추가 학습 자료 안내',
      '또래 멘토링에서 리더 역할 부여',
      '학습 목표 수립 및 자기 점검 기회 제공',
    ],
  },
  '정서조절 취약형': {
    type: '정서조절 취약형',
    characteristics:
      '학습 자원은 일정 수준 있으나, 성적 압박과 소진을 크게 느끼는 유형입니다. 감정 기복이 있을 수 있으며, 스트레스 상황에서 조절이 어려울 수 있습니다.',
    strategyTitle: '정서 조절 및 스트레스 관리 지원',
    strategyDescription:
      '학습 전략뿐 아니라 감정 조절과 부담 관리 방법을 함께 지원해주세요. 안정적인 정서 상태에서 학습 효과가 높아집니다.',
    actionItems: [
      '감정 인식 및 표현 연습 기회 제공',
      '스트레스 상황 대처 전략 함께 탐색',
      '작은 성공 경험을 통한 자신감 회복',
      '또래 관계에서의 긍정적 경험 지원',
    ],
  },
  '냉소적 무기력형': {
    type: '냉소적 무기력형',
    characteristics:
      '심리·정서적 자원이 상대적으로 낮고, 성적과 공부 부담을 크게 느끼는 유형입니다. 학습에 대한 의욕이 저하되어 있을 수 있습니다.',
    strategyTitle: '작은 성공 경험과 정서적 회복 지원',
    strategyDescription:
      '먼저 부담을 낮추고 정서적 회복감과 작은 성취 경험을 만들어주세요. 즉각적인 학업 향상보다 심리적 안정이 우선입니다.',
    actionItems: [
      '달성 가능한 작은 목표부터 시작',
      '과정 중심의 구체적 칭찬 제공',
      '학생의 강점과 관심사 발견 및 활용',
      '안전하고 수용적인 학급 분위기 조성',
    ],
  },
  // 초등용 유형
  '몰입자원풍부형': {
    type: '몰입자원 풍부형',
    characteristics:
      '긍정적 학습 자원이 풍부하고 몰입 가능성이 높은 유형입니다. 학습에 대한 흥미와 자신감이 높습니다.',
    strategyTitle: "시험 전 15분, '시험 = 성장 확인'으로 재구성해주세요",
    strategyDescription:
      '몰입자원풍부형 학생은 도전적 과제와 성장 관점의 피드백을 통해 더욱 성장합니다.',
    actionItems: [
      '시험 전 수업 도입 15분, "이 시험으로 무엇을 확인하려는 걸까?" 학급 대화 (예: 범위 나누기·시간 배분도 함께)',
      '시험 후 성찰 포트폴리오 운영 (예: 오답 분석 → 배운 점 → 다음 목표 한 장)',
      '점수가 아닌 성장을 짚어 말하기 — "틀렸던 유형을 이번엔 맞혔네!"',
    ],
    successIndicators: [
      '새로운 도전에 적극적으로 참여함',
      '다른 친구를 돕는 모습이 자주 보임',
      '스스로 목표를 높이려는 시도가 있음',
    ],
    noteForOtherTypes: '전 유형에 유익해요. 특히 자원소진형에게는 점수 비교 압박을 낮추는 보호 효과가 있어요.',
  },
  '몰입자원 풍부형': {
    type: '몰입자원 풍부형',
    characteristics:
      '긍정적 학습 자원이 풍부하고 몰입 가능성이 높은 유형입니다. 학습에 대한 흥미와 자신감이 높습니다.',
    strategyTitle: "시험 전 15분, '시험 = 성장 확인'으로 재구성해주세요",
    strategyDescription:
      '몰입자원풍부형 학생은 도전적 과제와 성장 관점의 피드백을 통해 더욱 성장합니다.',
    actionItems: [
      '시험 전 수업 도입 15분, "이 시험으로 무엇을 확인하려는 걸까?" 학급 대화 (예: 범위 나누기·시간 배분도 함께)',
      '시험 후 성찰 포트폴리오 운영 (예: 오답 분석 → 배운 점 → 다음 목표 한 장)',
      '점수가 아닌 성장을 짚어 말하기 — "틀렸던 유형을 이번엔 맞혔네!"',
    ],
    successIndicators: [
      '새로운 도전에 적극적으로 참여함',
      '다른 친구를 돕는 모습이 자주 보임',
      '스스로 목표를 높이려는 시도가 있음',
    ],
    noteForOtherTypes: '전 유형에 유익해요. 특히 자원소진형에게는 점수 비교 압박을 낮추는 보호 효과가 있어요.',
  },
  '안전균형형': {
    type: '안전 균형형',
    characteristics:
      '전반적으로 안정적인 학습 상태를 보이지만, 스스로 점검하고 조절하는 힘은 더 키워야 할 수 있습니다.',
    strategyTitle: "금요일 10분, '무엇을 + 언제' 주간 플래너 루틴을 만들어주세요",
    strategyDescription:
      '안전균형형 학생은 안정적이지만 더 성장하려면 자기주도적 점검 습관이 필요합니다.',
    actionItems: [
      '월요일 수업 시작 3분, 지난주 계획 실행 여부 셀프 체크로 열기 (예: 지킨 칸에 동그라미만)',
      '금요일 종례 전 10분 주간 플래너 작성 (예: "숙제 30분-복습 15분" 시간 블록)',
      "'끝났다' 대신 '확인했다'를 묻기 — \"어디까지 점검해봤어?\"",
    ],
    successIndicators: [
      '스스로 계획을 세우려는 시도가 보임',
      '실수에도 크게 동요하지 않음',
      '친구들과 협력하는 모습이 자연스러움',
    ],
    noteForOtherTypes: "자원소진형에게는 계획 자체가 부담일 수 있어요. 소진형 학생은 '한 칸만 쓰기'부터 허용해주세요.",
  },
  '안전 균형형': {
    type: '안전 균형형',
    characteristics:
      '전반적으로 안정적인 학습 상태를 보이지만, 스스로 점검하고 조절하는 힘은 더 키워야 할 수 있습니다.',
    strategyTitle: "금요일 10분, '무엇을 + 언제' 주간 플래너 루틴을 만들어주세요",
    strategyDescription:
      '안전균형형 학생은 안정적이지만 더 성장하려면 자기주도적 점검 습관이 필요합니다.',
    actionItems: [
      '월요일 수업 시작 3분, 지난주 계획 실행 여부 셀프 체크로 열기 (예: 지킨 칸에 동그라미만)',
      '금요일 종례 전 10분 주간 플래너 작성 (예: "숙제 30분-복습 15분" 시간 블록)',
      "'끝났다' 대신 '확인했다'를 묻기 — \"어디까지 점검해봤어?\"",
    ],
    successIndicators: [
      '스스로 계획을 세우려는 시도가 보임',
      '실수에도 크게 동요하지 않음',
      '친구들과 협력하는 모습이 자연스러움',
    ],
    noteForOtherTypes: "자원소진형에게는 계획 자체가 부담일 수 있어요. 소진형 학생은 '한 칸만 쓰기'부터 허용해주세요.",
  },
  '자원소진형': {
    type: '자원소진형',
    characteristics:
      '학습에 필요한 심리·정서적 자원이 상대적으로 낮고, 기대나 부담은 크게 느끼는 유형입니다.',
    strategyTitle: "아침 5분, '작은 성공 루틴'으로 하루를 열어주세요",
    strategyDescription:
      '매일 반복되는 작은 성공 경험이 "나도 할 수 있다"는 마음을 천천히 회복시켜요.',
    actionItems: [
      '아침 5분, 누구나 해낼 수 있는 미니 과제 1개로 시작하기 (예: 어제 배운 내용 O·X 3문제)',
      "교실 게시판에 성공 기록판 운영, 매일 스티커 누적 (예: 칠판 구석 '우리 반 해냄' 칸)",
      '점수 대신 과정을 짚어 말하기 — "세 번이나 다시 도전했구나"',
    ],
    successIndicators: [
      '아침 과제를 거부하거나 멍하게 앉아 있는 학생 수가 줄어요',
      '"못 하겠어요" 대신 "다 했어요"라는 말이 들리기 시작해요',
      '기록판 스티커를 아이들이 먼저 챙겨 붙이려고 해요',
    ],
    noteForOtherTypes: "안전균형·몰입자원풍부형에게도 워밍업으로 무해해요. 몰입형이 지루해하면 '도전 1문항'을 선택 과제로 얹어주세요.",
    advancedStrategies: [
      {
        title: '감정 체크인 루틴',
        description: '하루 시작 시 오늘의 기분을 이모지로 표현하게 하고, 선생님이 개별적으로 한마디씩 건네주세요.',
        actionItems: [
          '칠판에 기분 이모지 선택지 마련',
          '개별 반응이 어려우면 전체적으로 "오늘 기분 좋은 사람?" 질문',
        ],
      },
      {
        title: '1:1 짧은 대화 시간',
        description: '쉬는 시간 2분, 아무 주제나 학생과 대화하세요. 학업 얘기가 아니어도 괜찮습니다.',
        actionItems: [
          '좋아하는 게임, 음악, 유튜브 등 관심사 물어보기',
          '주 1회 이상 개별 대화 시도',
        ],
      },
    ],
  },
};

// ============================================================
// 학급 코칭 Mock 데이터
// ============================================================

/** 학급 코칭 데이터 (초등 기준 - 자원소진형 중심) */
export const MOCK_CLASS_COACHING_DATA: ClassCoachingData = {
  lpaDistribution: {
    totalStudents: 26,
    completedStudents: 24,
    distribution: {
      '자원소진형': 10,
      '안전균형형': 8,
      '몰입자원 풍부형': 6,
    },
  },
  dominantType: '자원소진형',
  dominantTypeCharacteristics:
    "'할 수 있다'는 믿음이 약해져 있는 유형이에요. 자기효능감·자아존중감 같은 마음의 자원이 다른 유형보다 눈에 띄게 낮고, 학업 부담과 압박감은 가장 높아요. 하고 싶은 마음도 실행할 힘도 함께 지쳐 있는 상태라, 공부법을 가르치기 전에 \"나도 되는구나\" 하는 경험부터 회복시켜 주세요.",
  recommendedStrategy: LPA_TYPE_STRATEGIES['자원소진형'],
  additionalStrategies: [
    LPA_TYPE_STRATEGIES['안전균형형'],
    LPA_TYPE_STRATEGIES['몰입자원 풍부형'],
  ],
};

// ============================================================
// 학생 코칭 Mock 데이터
// ============================================================

/** 학생 코칭 데이터 샘플 */
export const MOCK_STUDENT_COACHING_DATA: StudentCoachingData = {
  studentId: 'student-1',
  studentName: '김민준',
  studentNumber: 1,
  lpaData: {
    probabilities: {
      '냉소적 무기력형': 98.8,
      '정서조절 취약형': 1.2,
      '자기주도 몰입형': 0,
    },
    predictedType: '냉소적 무기력형',
  },
  typeInfo: {
    type: '냉소적 무기력형',
    description:
      '심리·정서적 자원이 상대적으로 낮고, 성적과 공부 부담을 크게 느끼는 유형입니다. 먼저 부담을 낮추고 정서적 회복감과 작은 성취 경험을 만들어주세요.',
    characteristics: [
      '학습에 대한 의욕이 저하되어 있을 수 있음',
      '성적과 공부에 대한 부담감이 높음',
      '자기효능감 회복이 필요함',
      '안전하고 수용적인 환경에서 회복 가능',
    ],
  },
  strengthPraises: [
    {
      factor: '끈기',
      area: '자아강점',
      reason:
        '어려운 상황에서도 포기하지 않고 끝까지 해내려는 모습이 또래 평균보다 높게 나타났습니다. 이는 민준이가 힘든 상황에서도 버틸 수 있는 내적 힘을 가지고 있음을 의미합니다.',
      praiseScript:
        '"민준아, 네가 힘들어도 끝까지 해내려고 하는 모습이 정말 대단해. 그 끈기가 너의 큰 강점이야."',
    },
    {
      factor: '책임감',
      area: '자아강점',
      reason:
        '맡은 일에 대한 책임감이 높아, 자신의 역할을 성실히 수행하려는 경향이 있습니다. 이러한 책임감은 향후 학습과 생활에서 신뢰를 쌓는 밑거름이 됩니다.',
      praiseScript:
        '"민준아, 네가 맡은 일은 항상 끝까지 해내더라. 그런 책임감 있는 모습이 선생님은 참 믿음직스러워."',
    },
  ],
  coachingPathway: {
    weakFactor: '자기효능감',
    area: '긍정적공부마음',
    pathwayDescription:
      '자기효능감이 낮으면 "나는 할 수 없어"라는 생각이 학습 시도 자체를 어렵게 만들 수 있어요. 작은 성공 경험을 쌓으면 "나도 할 수 있다"는 믿음이 생기고, 이것이 더 큰 도전으로 이어집니다.',
    coachingPoints: [
      {
        method: '달성 가능한 아주 작은 목표부터 시작하기',
        teacherScript:
          '"민준아, 오늘은 이 문제 하나만 같이 풀어보자. 하나씩 해보면 돼."',
      },
      {
        method: '과정에서의 작은 성취를 즉시 인정해주기',
        teacherScript:
          '"아까보다 더 잘 했네! 이렇게 조금씩 나아지는 거야. 네가 노력하고 있다는 거 선생님은 알아."',
      },
    ],
  },
};

/** 학생별 코칭 데이터 맵 */
export const MOCK_STUDENT_COACHING_MAP: Record<string, StudentCoachingData> = {
  's1': MOCK_STUDENT_COACHING_DATA,
  's2': {
    studentId: 's2',
    studentName: '이서연',
    studentNumber: 2,
    lpaData: {
      probabilities: {
        '자기주도 몰입형': 75.5,
        '정서조절 취약형': 20.3,
        '냉소적 무기력형': 4.2,
      },
      predictedType: '자기주도 몰입형',
    },
    typeInfo: {
      type: '자기주도 몰입형',
      description:
        '심리·정서적 자원이 풍부하고 자기주도적 몰입 가능성이 높은 유형입니다. 현재의 강점을 유지하면서 도전 목표와 심화 학습 기회를 제공해주세요.',
      characteristics: [
        '학습에 대한 내적 동기가 강함',
        '스스로 계획하고 실행하는 능력이 뛰어남',
        '도전적인 과제를 선호함',
        '적절한 자율성이 주어질 때 높은 성취를 보임',
      ],
    },
    strengthPraises: [
      {
        factor: '학습몰입',
        area: '학습디딤돌',
        reason:
          '공부에 집중할 때 시간 가는 줄 모르고 빠져드는 몰입 경험이 또래보다 높습니다. 이런 몰입 능력은 깊이 있는 학습의 기반이 됩니다.',
        praiseScript:
          '"서연아, 네가 공부에 집중하는 모습이 정말 대단해. 그렇게 몰입할 수 있는 건 큰 재능이야."',
      },
      {
        factor: '자기조절',
        area: '학습디딤돌',
        reason:
          '스스로 계획을 세우고 실행하는 능력이 뛰어나, 주어진 과제를 효율적으로 관리할 수 있습니다.',
        praiseScript:
          '"서연아, 네가 스스로 계획 세워서 하는 모습이 참 멋져. 그 습관 계속 유지하렴."',
      },
    ],
    coachingPathway: {
      weakFactor: '스트레스 관리',
      area: '부정적공부마음',
      pathwayDescription:
        '높은 목표 의식이 때로는 과도한 압박으로 이어질 수 있어요. 적절한 휴식과 스트레스 해소 방법을 함께 찾으면 더 오래, 더 건강하게 학습할 수 있습니다.',
      coachingPoints: [
        {
          method: '학습과 휴식의 균형 점검하기',
          teacherScript:
            '"서연아, 열심히 하는 건 좋은데 쉬는 것도 중요해. 오늘 쉬는 시간에 뭐 했어?"',
        },
        {
          method: '완벽하지 않아도 괜찮다는 메시지 전달하기',
          teacherScript:
            '"가끔은 80점도 충분히 잘한 거야. 항상 100점이 아니어도 괜찮아."',
        },
      ],
    },
  },
  's3': {
    studentId: 's3',
    studentName: '박지호',
    studentNumber: 3,
    lpaData: {
      probabilities: {
        '정서조절 취약형': 65.2,
        '냉소적 무기력형': 28.5,
        '자기주도 몰입형': 6.3,
      },
      predictedType: '정서조절 취약형',
    },
    typeInfo: {
      type: '정서조절 취약형',
      description:
        '학습 자원은 일정 수준 있으나, 성적 압박과 소진을 크게 느끼는 유형입니다. 학습 전략뿐 아니라 감정 조절과 부담 관리 방법을 함께 지원해주세요.',
      characteristics: [
        '감정 기복이 있을 수 있음',
        '스트레스 상황에서 조절이 어려울 수 있음',
        '학습 능력은 있으나 정서적 안정이 필요',
        '지지적 환경에서 잠재력 발휘 가능',
      ],
    },
    strengthPraises: [
      {
        factor: '창의성',
        area: '자아강점',
        reason:
          '새로운 아이디어를 떠올리고 다양한 방식으로 문제를 해결하려는 경향이 높습니다. 이런 창의성은 학습에서 독창적인 접근을 가능하게 합니다.',
        praiseScript:
          '"지호야, 네가 생각하는 방식이 참 독특하고 창의적이야. 그런 생각을 할 수 있는 게 큰 장점이야."',
      },
      {
        factor: '호기심',
        area: '긍정적공부마음',
        reason:
          '새로운 것에 대한 관심과 탐구 의욕이 높아, 다양한 분야에 흥미를 느낍니다.',
        praiseScript:
          '"지호야, 네가 궁금한 게 많고 알고 싶어하는 모습이 참 좋아. 그 호기심을 계속 유지하렴."',
      },
    ],
    coachingPathway: {
      weakFactor: '감정조절',
      area: '부정적공부마음',
      pathwayDescription:
        '감정이 격해지면 학습에 집중하기 어려워질 수 있어요. 자신의 감정을 알아차리고 조절하는 방법을 연습하면, 더 안정적으로 학습할 수 있습니다.',
      coachingPoints: [
        {
          method: '감정 상태 확인하고 이름 붙여주기',
          teacherScript:
            '"지호야, 지금 기분이 어때? 조금 답답한 것 같아 보이는데, 맞아?"',
        },
        {
          method: '감정이 격해질 때 잠시 멈추는 연습',
          teacherScript:
            '"화가 날 때는 잠깐 숨을 크게 쉬어보자. 그러면 조금 진정될 수 있어."',
        },
      ],
    },
  },
};

// ============================================================
// 학생 목록 Mock 데이터
// ============================================================

/** 코칭 학생 목록 */
export const MOCK_COACHING_STUDENTS: CoachingStudentItem[] = [
  {
    id: 's1',
    number: 1,
    name: '김민준',
    lpaType: '냉소적 무기력형',
    tags: ['burden', 'reliability'],
    lastCounselingDate: '2026-07-10',
    counselingCount: 3,
  },
  {
    id: 's2',
    number: 2,
    name: '이서연',
    lpaType: '자기주도 몰입형',
    tags: ['strength'],
    lastCounselingDate: '2026-07-08',
    counselingCount: 2,
  },
  {
    id: 's3',
    number: 3,
    name: '박지호',
    lpaType: '정서조절 취약형',
    tags: ['burden', 'obstacle'],
    lastCounselingDate: '2026-07-05',
    counselingCount: 4,
  },
  {
    id: 's4',
    number: 4,
    name: '최수아',
    lpaType: '자기주도 몰입형',
    tags: ['strength'],
    counselingCount: 1,
  },
  {
    id: 's5',
    number: 5,
    name: '정예준',
    lpaType: '정서조절 취약형',
    tags: ['reliability'],
    lastCounselingDate: '2026-07-12',
    counselingCount: 2,
  },
  {
    id: 's6',
    number: 6,
    name: '강하은',
    lpaType: '냉소적 무기력형',
    tags: ['burden'],
    counselingCount: 0,
  },
  {
    id: 's7',
    number: 7,
    name: '윤도현',
    lpaType: '자기주도 몰입형',
    tags: [],
    lastCounselingDate: '2026-07-01',
    counselingCount: 1,
  },
  {
    id: 's8',
    number: 8,
    name: '임서진',
    lpaType: '정서조절 취약형',
    tags: ['obstacle'],
    counselingCount: 0,
  },
];

/** 학생 코칭 데이터 조회 함수 */
export function getStudentCoachingData(studentId: string): StudentCoachingData | null {
  return MOCK_STUDENT_COACHING_MAP[studentId] || null;
}

// ============================================================
// 레거시 Mock 데이터 (기존 호환성 유지)
// ============================================================

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
