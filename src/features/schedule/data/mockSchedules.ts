import type { Schedule, ScheduleStudent } from '@/shared/types';

// 상담일정용 학급 목록
export const SCHEDULE_CLASSES = [
  { id: '2-3', grade: 2, classNumber: 3, label: '2학년 3반' },
  { id: '2-5', grade: 2, classNumber: 5, label: '2학년 5반' },
  { id: '3-1', grade: 3, classNumber: 1, label: '3학년 1반' },
  { id: '3-4', grade: 3, classNumber: 4, label: '3학년 4반' },
];

// 학급별 학생 목록 (상담일정용)
export const SCHEDULE_STUDENTS: Record<string, ScheduleStudent[]> = {
  '2-3': [
    { id: '2-3-01', name: '김민준', number: 1, classId: '2-3' },
    { id: '2-3-02', name: '이서연', number: 2, classId: '2-3' },
    { id: '2-3-03', name: '박지호', number: 3, classId: '2-3' },
    { id: '2-3-04', name: '최수아', number: 4, classId: '2-3' },
    { id: '2-3-05', name: '정예준', number: 5, classId: '2-3' },
    { id: '2-3-06', name: '강하은', number: 6, classId: '2-3' },
    { id: '2-3-07', name: '조민서', number: 7, classId: '2-3' },
    { id: '2-3-08', name: '윤지우', number: 8, classId: '2-3' },
    { id: '2-3-09', name: '임서진', number: 9, classId: '2-3' },
    { id: '2-3-10', name: '한도윤', number: 10, classId: '2-3' },
    { id: '2-3-11', name: '오지민', number: 11, classId: '2-3' },
    { id: '2-3-12', name: '서하늘', number: 12, classId: '2-3' },
    { id: '2-3-13', name: '권예린', number: 13, classId: '2-3' },
    { id: '2-3-14', name: '신동현', number: 14, classId: '2-3' },
    { id: '2-3-15', name: '황지원', number: 15, classId: '2-3' },
    { id: '2-3-16', name: '안서윤', number: 16, classId: '2-3' },
    { id: '2-3-17', name: '송민재', number: 17, classId: '2-3' },
    { id: '2-3-18', name: '전유진', number: 18, classId: '2-3' },
    { id: '2-3-19', name: '장하린', number: 19, classId: '2-3' },
    { id: '2-3-20', name: '유준서', number: 20, classId: '2-3' },
  ],
  '2-5': [
    { id: '2-5-01', name: '남지아', number: 1, classId: '2-5' },
    { id: '2-5-02', name: '홍서영', number: 2, classId: '2-5' },
    { id: '2-5-03', name: '백승우', number: 3, classId: '2-5' },
    { id: '2-5-04', name: '류하윤', number: 4, classId: '2-5' },
    { id: '2-5-05', name: '문도현', number: 5, classId: '2-5' },
    { id: '2-5-06', name: '양시은', number: 6, classId: '2-5' },
    { id: '2-5-07', name: '배준혁', number: 7, classId: '2-5' },
    { id: '2-5-08', name: '곽민아', number: 8, classId: '2-5' },
    { id: '2-5-09', name: '허서준', number: 9, classId: '2-5' },
    { id: '2-5-10', name: '노수빈', number: 10, classId: '2-5' },
    { id: '2-5-11', name: '심지현', number: 11, classId: '2-5' },
    { id: '2-5-12', name: '추민수', number: 12, classId: '2-5' },
    { id: '2-5-13', name: '하윤아', number: 13, classId: '2-5' },
    { id: '2-5-14', name: '진서율', number: 14, classId: '2-5' },
    { id: '2-5-15', name: '엄태윤', number: 15, classId: '2-5' },
    { id: '2-5-16', name: '방예나', number: 16, classId: '2-5' },
    { id: '2-5-17', name: '석주원', number: 17, classId: '2-5' },
    { id: '2-5-18', name: '표하영', number: 18, classId: '2-5' },
  ],
  '3-1': [
    { id: '3-1-01', name: '공민재', number: 1, classId: '3-1' },
    { id: '3-1-02', name: '탁서연', number: 2, classId: '3-1' },
    { id: '3-1-03', name: '길도훈', number: 3, classId: '3-1' },
    { id: '3-1-04', name: '변수아', number: 4, classId: '3-1' },
    { id: '3-1-05', name: '채예준', number: 5, classId: '3-1' },
    { id: '3-1-06', name: '복하은', number: 6, classId: '3-1' },
    { id: '3-1-07', name: '설민서', number: 7, classId: '3-1' },
    { id: '3-1-08', name: '빈지우', number: 8, classId: '3-1' },
    { id: '3-1-09', name: '사서진', number: 9, classId: '3-1' },
    { id: '3-1-10', name: '옥도윤', number: 10, classId: '3-1' },
    { id: '3-1-11', name: '감지민', number: 11, classId: '3-1' },
    { id: '3-1-12', name: '필하늘', number: 12, classId: '3-1' },
    { id: '3-1-13', name: '어예린', number: 13, classId: '3-1' },
    { id: '3-1-14', name: '금동현', number: 14, classId: '3-1' },
    { id: '3-1-15', name: '편지원', number: 15, classId: '3-1' },
    { id: '3-1-16', name: '국서윤', number: 16, classId: '3-1' },
    { id: '3-1-17', name: '연민재', number: 17, classId: '3-1' },
    { id: '3-1-18', name: '영유진', number: 18, classId: '3-1' },
    { id: '3-1-19', name: '현하린', number: 19, classId: '3-1' },
    { id: '3-1-20', name: '봉준서', number: 20, classId: '3-1' },
    { id: '3-1-21', name: '태지아', number: 21, classId: '3-1' },
    { id: '3-1-22', name: '내서영', number: 22, classId: '3-1' },
  ],
  '3-4': [
    { id: '3-4-01', name: '단승우', number: 1, classId: '3-4' },
    { id: '3-4-02', name: '라하윤', number: 2, classId: '3-4' },
    { id: '3-4-03', name: '망도현', number: 3, classId: '3-4' },
    { id: '3-4-04', name: '상시은', number: 4, classId: '3-4' },
    { id: '3-4-05', name: '사준혁', number: 5, classId: '3-4' },
    { id: '3-4-06', name: '인민아', number: 6, classId: '3-4' },
    { id: '3-4-07', name: '정서준', number: 7, classId: '3-4' },
    { id: '3-4-08', name: '조수빈', number: 8, classId: '3-4' },
    { id: '3-4-09', name: '최지현', number: 9, classId: '3-4' },
    { id: '3-4-10', name: '태민수', number: 10, classId: '3-4' },
    { id: '3-4-11', name: '판윤아', number: 11, classId: '3-4' },
    { id: '3-4-12', name: '하서율', number: 12, classId: '3-4' },
    { id: '3-4-13', name: '황태윤', number: 13, classId: '3-4' },
    { id: '3-4-14', name: '고예나', number: 14, classId: '3-4' },
    { id: '3-4-15', name: '구주원', number: 15, classId: '3-4' },
    { id: '3-4-16', name: '나하영', number: 16, classId: '3-4' },
    { id: '3-4-17', name: '도민재', number: 17, classId: '3-4' },
    { id: '3-4-18', name: '로서연', number: 18, classId: '3-4' },
    { id: '3-4-19', name: '모도훈', number: 19, classId: '3-4' },
  ],
};

// 오늘 날짜 기준으로 mock 데이터 생성
const today = new Date();
const getDateString = (daysOffset: number): string => {
  const date = new Date(today);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

// 목업 상담일정 데이터
export const MOCK_SCHEDULES: Schedule[] = [
  // 오늘
  {
    id: 'sch-001',
    students: [SCHEDULE_STUDENTS['2-3'][0]],
    classId: '2-3',
    date: getDateString(0),
    time: '09:30',
    type: 'regular',
    area: 'academic',
    method: 'face-to-face',
    reason: '학업 성취도 점검 및 학습 계획 상담',
    createdAt: new Date(),
  },
  {
    id: 'sch-002',
    students: [SCHEDULE_STUDENTS['2-5'][1], SCHEDULE_STUDENTS['2-5'][2]],
    classId: '2-5',
    date: getDateString(0),
    time: '11:00',
    type: 'urgent',
    area: 'peer',
    method: 'face-to-face',
    reason: '교우관계 갈등 중재',
    createdAt: new Date(),
  },
  {
    id: 'sch-003',
    students: [SCHEDULE_STUDENTS['3-1'][4]],
    classId: '3-1',
    date: getDateString(0),
    time: '14:00',
    type: 'follow-up',
    area: 'emotion',
    method: 'face-to-face',
    reason: '지난 상담 이후 경과 확인',
    createdAt: new Date(),
  },
  // 내일
  {
    id: 'sch-004',
    students: [SCHEDULE_STUDENTS['3-4'][0]],
    classId: '3-4',
    date: getDateString(1),
    time: '10:00',
    type: 'initial',
    area: 'career',
    method: 'face-to-face',
    reason: '진로 탐색 상담',
    createdAt: new Date(),
  },
  {
    id: 'sch-005',
    students: [SCHEDULE_STUDENTS['2-3'][5]],
    classId: '2-3',
    date: getDateString(1),
    time: '13:30',
    type: 'regular',
    area: 'family',
    method: 'phone',
    reason: '가정환경 변화에 따른 적응 상담',
    createdAt: new Date(),
  },
  // 모레
  {
    id: 'sch-006',
    students: [SCHEDULE_STUDENTS['2-5'][7], SCHEDULE_STUDENTS['2-5'][8], SCHEDULE_STUDENTS['2-5'][9]],
    classId: '2-5',
    date: getDateString(2),
    time: '09:00',
    type: 'regular',
    area: 'behavior',
    method: 'group',
    reason: '그룹 행동 개선 프로그램',
    createdAt: new Date(),
  },
  {
    id: 'sch-007',
    students: [SCHEDULE_STUDENTS['3-1'][10]],
    classId: '3-1',
    date: getDateString(2),
    time: '15:00',
    type: 'urgent',
    area: 'health',
    method: 'face-to-face',
    reason: '건강 관련 긴급 상담',
    createdAt: new Date(),
  },
  // 3일 후
  {
    id: 'sch-008',
    students: [SCHEDULE_STUDENTS['3-4'][3]],
    classId: '3-4',
    date: getDateString(3),
    time: '11:30',
    type: 'follow-up',
    area: 'academic',
    method: 'video',
    reason: '학습 전략 점검',
    createdAt: new Date(),
  },
  // 4일 후
  {
    id: 'sch-009',
    students: [SCHEDULE_STUDENTS['2-3'][12]],
    classId: '2-3',
    date: getDateString(4),
    time: '10:30',
    type: 'regular',
    area: 'other',
    method: 'face-to-face',
    createdAt: new Date(),
  },
  {
    id: 'sch-010',
    students: [SCHEDULE_STUDENTS['3-4'][6], SCHEDULE_STUDENTS['3-4'][7]],
    classId: '3-4',
    date: getDateString(4),
    time: '14:30',
    type: 'urgent',
    area: 'peer',
    method: 'face-to-face',
    reason: '또래 갈등 긴급 중재',
    createdAt: new Date(),
  },
  // 다음 주
  {
    id: 'sch-011',
    students: [SCHEDULE_STUDENTS['2-5'][14]],
    classId: '2-5',
    date: getDateString(7),
    time: '09:30',
    type: 'initial',
    area: 'emotion',
    method: 'face-to-face',
    reason: '정서 지원 초기 상담',
    createdAt: new Date(),
  },
  {
    id: 'sch-012',
    students: [SCHEDULE_STUDENTS['3-1'][15]],
    classId: '3-1',
    date: getDateString(8),
    time: '13:00',
    type: 'regular',
    area: 'career',
    method: 'face-to-face',
    reason: '진로 목표 설정 상담',
    createdAt: new Date(),
  },
  {
    id: 'sch-013',
    students: [SCHEDULE_STUDENTS['3-4'][10]],
    classId: '3-4',
    date: getDateString(9),
    time: '15:30',
    type: 'follow-up',
    area: 'family',
    method: 'phone',
    reason: '가정 연계 후속 상담',
    createdAt: new Date(),
  },
  // 이번 주 내 추가
  {
    id: 'sch-014',
    students: [SCHEDULE_STUDENTS['2-3'][3]],
    classId: '2-3',
    date: getDateString(1),
    time: '16:00',
    type: 'regular',
    area: 'academic',
    method: 'face-to-face',
    createdAt: new Date(),
  },
  {
    id: 'sch-015',
    students: [SCHEDULE_STUDENTS['3-1'][2]],
    classId: '3-1',
    date: getDateString(3),
    time: '09:00',
    type: 'urgent',
    area: 'emotion',
    method: 'face-to-face',
    reason: '정서적 어려움 긴급 상담',
    createdAt: new Date(),
  },
];

// 학급별 상담 통계 계산
export const getClassScheduleStats = (schedules: Schedule[]) => {
  const stats: Record<string, { total: number; urgent: number; followUp: number }> = {};

  SCHEDULE_CLASSES.forEach(cls => {
    stats[cls.id] = { total: 0, urgent: 0, followUp: 0 };
  });

  schedules.forEach(schedule => {
    if (stats[schedule.classId]) {
      stats[schedule.classId].total++;
      if (schedule.type === 'urgent') stats[schedule.classId].urgent++;
      if (schedule.type === 'follow-up') stats[schedule.classId].followUp++;
    }
  });

  return stats;
};
