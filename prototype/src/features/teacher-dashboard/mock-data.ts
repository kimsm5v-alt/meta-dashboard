/**
 * 홈 페이지 목업 데이터
 */

// Section 1: 주요 지표
export const HOME_KEY_METRICS = {
  totalClasses: 4,
  inProgressExams: 3,
  completedExams: 5,
  pendingStudents: 12,
};

// Section 2: 진행 중 검사 (1차/2차 구분)
export const HOME_ACTIVE_EXAMS = [
  {
    className: '2-3반',
    round1: {
      status: 'in_progress' as const,
      submittedCount: 28,
      totalCount: 30,
      submissionRate: 93,
    },
    round2: {
      status: 'completed' as const,
      submittedCount: 30,
      totalCount: 30,
      submissionRate: 100,
    },
  },
  {
    className: '2-4반',
    round1: {
      status: 'in_progress' as const,
      submittedCount: 25,
      totalCount: 32,
      submissionRate: 78,
    },
    round2: {
      status: 'not_started' as const,
      submittedCount: 0,
      totalCount: 32,
      submissionRate: 0,
    },
  },
  {
    className: '2-5반',
    round1: {
      status: 'completed' as const,
      submittedCount: 28,
      totalCount: 28,
      submissionRate: 100,
    },
    round2: {
      status: 'in_progress' as const,
      submittedCount: 20,
      totalCount: 28,
      submissionRate: 71,
    },
  },
  {
    className: '2-6반',
    round1: {
      status: 'completed' as const,
      submittedCount: 31,
      totalCount: 31,
      submissionRate: 100,
    },
    round2: {
      status: 'not_started' as const,
      submittedCount: 0,
      totalCount: 31,
      submissionRate: 0,
    },
  },
];

// Section 3: 수업 슬롯 - 새로운 구조

// 1순위: 진행 중인 세션 데이터
export const HOME_LESSON_ACTIVE_SESSION = {
  id: 'session-1',
  contentName: '감정 일기 쓰기',
  className: '2-3반',
  startTime: '14:30',
  connectedStudents: 24,
  totalStudents: 30,
  participationCode: 'ABC123',
};

// 2순위: 예정된 수업 데이터
export const HOME_LESSON_SCHEDULED = [
  {
    id: 'sched-1',
    scheduledDate: '2026-08-07',
    className: '2-3반',
    contentName: '나의 강점 찾기',
    isPrepared: true,
  },
  {
    id: 'sched-2',
    scheduledDate: '2026-08-08',
    className: '2-4반',
    contentName: '스트레스 관리법',
    isPrepared: false,
  },
  {
    id: 'sched-3',
    scheduledDate: '2026-08-10',
    className: '2-5반',
    contentName: '목표 설정 워크숍',
    isPrepared: true,
  },
];

// 3순위: 최근 수업 기록 데이터
export const HOME_LESSON_RECENT = [
  {
    id: 'recent-1',
    className: '2-3반',
    contentName: '감정 일기 쓰기',
    date: '2024.03.15',
    participationRate: 90,
  },
  {
    id: 'recent-2',
    className: '2-4반',
    contentName: '나의 강점 찾기',
    date: '2024.03.14',
    participationRate: 87,
  },
];

// 수업 미진행 반 목록
export const HOME_LESSON_CLASSES_WITHOUT = [
  { className: '2-5반' },
  { className: '2-6반' },
];

// 현재 표시할 슬롯 상태 (1: 진행중, 2: 예정, 3: 최근)
// 아래 값을 변경하면 다른 상태를 볼 수 있음
export const HOME_LESSON_SLOT_STATE = 1 as 1 | 2 | 3;

export const HOME_LESSON_SLOT = {
  activeSession: HOME_LESSON_SLOT_STATE === 1 ? HOME_LESSON_ACTIVE_SESSION : null,
  scheduledLessons: HOME_LESSON_SLOT_STATE === 2 ? HOME_LESSON_SCHEDULED : [],
  recentLessons: HOME_LESSON_RECENT,
  classesWithoutLesson: HOME_LESSON_CLASSES_WITHOUT,
};

// Section 3-2: 사회정서역량별 반별 수업 이력 매트릭스
export const HOME_SEL_COMPETENCY_MATRIX = [
  {
    className: '2-3반',
    selfAwareness: 3,      // 자기인식
    selfManagement: 2,     // 자기관리
    socialAwareness: 1,    // 사회적 인식
    relationshipSkills: 4, // 관계기술
    responsibleDecision: 0, // 책임 있는 의사결정
    mentalHealth: 2,       // 마음 건강
  },
  {
    className: '2-4반',
    selfAwareness: 2,
    selfManagement: 3,
    socialAwareness: 2,
    relationshipSkills: 1,
    responsibleDecision: 1,
    mentalHealth: 0,
  },
  {
    className: '2-5반',
    selfAwareness: 1,
    selfManagement: 1,
    socialAwareness: 0,
    relationshipSkills: 2,
    responsibleDecision: 1,
    mentalHealth: 3,
  },
  {
    className: '2-6반',
    selfAwareness: 4,
    selfManagement: 2,
    socialAwareness: 3,
    relationshipSkills: 2,
    responsibleDecision: 2,
    mentalHealth: 1,
  },
];

// Section 3-3: 반별 추천 콘텐츠 카드 (4개)
export const HOME_RECOMMENDED_CONTENTS = [
  {
    id: 'rec-1',
    className: '2-3반',
    contentName: '스트레스 관리법',
    category: '정서조절',
    reason: '학업스트레스 점수가 높은 학생이 많아요',
    thumbnail: '/images/content-1.png',
  },
  {
    id: 'rec-2',
    className: '2-4반',
    contentName: '목표 설정 워크숍',
    category: '학습동기',
    reason: '자기효능감 향상이 필요한 학생이 있어요',
    thumbnail: '/images/content-2.png',
  },
  {
    id: 'rec-3',
    className: '2-5반',
    contentName: '친구와 소통하기',
    category: '대인관계',
    reason: '또래관계 역량 강화를 추천해요',
    thumbnail: '/images/content-3.png',
  },
  {
    id: 'rec-4',
    className: '2-6반',
    contentName: '시간 관리 비법',
    category: '학습기술',
    reason: '시간관리 점수가 낮은 학생이 있어요',
    thumbnail: '/images/content-4.png',
  },
];

// Section 4: 반별 현황 요약
export const HOME_CLASS_SUMMARY = [
  {
    id: 'class-1',
    name: '2-3반',
    totalStudents: 30,
    round1Rate: 93,
    round2Rate: 100,
  },
  {
    id: 'class-2',
    name: '2-4반',
    totalStudents: 32,
    round1Rate: 78,
    round2Rate: 0,
  },
  {
    id: 'class-3',
    name: '2-5반',
    totalStudents: 28,
    round1Rate: 100,
    round2Rate: 71,
  },
  {
    id: 'class-4',
    name: '2-6반',
    totalStudents: 31,
    round1Rate: 100,
    round2Rate: 0,
  },
];

// Section 5: 반별 학습 특성 비교 (5개 영역)
export const HOME_LEARNING_CHARACTERISTICS = [
  {
    category: '자아강점',
    '2-3반': 58,
    '2-4반': 52,
    '2-5반': 55,
    '2-6반': 60,
  },
  {
    category: '학습디딤돌',
    '2-3반': 54,
    '2-4반': 50,
    '2-5반': 52,
    '2-6반': 56,
  },
  {
    category: '긍정적공부마음',
    '2-3반': 56,
    '2-4반': 48,
    '2-5반': 54,
    '2-6반': 58,
  },
  {
    category: '학습걸림돌',
    '2-3반': 45,
    '2-4반': 52,
    '2-5반': 48,
    '2-6반': 42,
  },
  {
    category: '부정적공부마음',
    '2-3반': 42,
    '2-4반': 50,
    '2-5반': 46,
    '2-6반': 40,
  },
];

// Section 6: 학생 유형 분포 (1차/2차 구분)
export const HOME_STUDENT_TYPE_DISTRIBUTION = [
  {
    className: '2-3반',
    round1: {
      types: [
        { name: '몰입자원 풍부형', count: 12, color: '#10B981' },
        { name: '안전 균형형', count: 15, color: '#F59E0B' },
        { name: '자원소진형', count: 3, color: '#EF4444' },
      ],
    },
    round2: {
      types: [
        { name: '몰입자원 풍부형', count: 14, color: '#10B981' },
        { name: '안전 균형형', count: 13, color: '#F59E0B' },
        { name: '자원소진형', count: 3, color: '#EF4444' },
      ],
    },
  },
  {
    className: '2-4반',
    round1: {
      types: [
        { name: '몰입자원 풍부형', count: 8, color: '#10B981' },
        { name: '안전 균형형', count: 18, color: '#F59E0B' },
        { name: '자원소진형', count: 6, color: '#EF4444' },
      ],
    },
    round2: {
      types: null, // 검사 미실시
    },
  },
  {
    className: '2-5반',
    round1: {
      types: [
        { name: '몰입자원 풍부형', count: 10, color: '#10B981' },
        { name: '안전 균형형', count: 14, color: '#F59E0B' },
        { name: '자원소진형', count: 4, color: '#EF4444' },
      ],
    },
    round2: {
      types: [
        { name: '몰입자원 풍부형', count: 12, color: '#10B981' },
        { name: '안전 균형형', count: 12, color: '#F59E0B' },
        { name: '자원소진형', count: 4, color: '#EF4444' },
      ],
    },
  },
  {
    className: '2-6반',
    round1: {
      types: [
        { name: '몰입자원 풍부형', count: 15, color: '#10B981' },
        { name: '안전 균형형', count: 12, color: '#F59E0B' },
        { name: '자원소진형', count: 4, color: '#EF4444' },
      ],
    },
    round2: {
      types: null, // 검사 미실시
    },
  },
];

// Section 7: 최근 활동
export const HOME_RECENT_ACTIVITIES = [
  {
    id: 'activity-1',
    type: 'exam' as const,
    title: '2-3반 1차 검사 결과 확인',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15분 전
  },
  {
    id: 'activity-2',
    type: 'coaching' as const,
    title: '김철수 학생 코칭 기록 작성',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
  },
  {
    id: 'activity-3',
    type: 'lesson' as const,
    title: '감정 일기 쓰기 활동 배포',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5시간 전
  },
  {
    id: 'activity-4',
    type: 'exam' as const,
    title: '2-5반 학생 검사 독려',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1일 전
  },
  {
    id: 'activity-5',
    type: 'lesson' as const,
    title: '나의 강점 찾기 결과 확인',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2일 전
  },
];
