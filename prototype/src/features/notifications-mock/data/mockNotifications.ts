import type { Notification } from '../types/notification';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const now = Date.now();
const iso = (offsetMs: number) => new Date(now - offsetMs).toISOString();

const TEACHER_EXAM_LINK = '/assessment';
const TEACHER_GROUP_LINK = '/groups/3-2';
const STUDENT_EXAM_LINK = '/student/exams';
const STUDENT_GROUP_LINK = '/student/groups';

export const teacherMockNotifications: Notification[] = [
  {
    id: 't-1',
    eventType: 'T4',
    category: 'exam',
    message: '3학년 2반 1차 학습종합검사 전원 제출이 완료되었습니다. 검사 종료 시 리포트가 생성됩니다.',
    highlights: ['3학년 2반', '1차 학습종합검사'],
    link: TEACHER_EXAM_LINK,
    isRead: false,
    createdAt: iso(5 * MINUTE),
  },
  {
    id: 't-2',
    eventType: 'T1',
    category: 'group',
    message: "박지훈 학생이 '3학년 2반' 그룹에 참여했습니다.",
    highlights: ['박지훈', '3학년 2반'],
    link: TEACHER_GROUP_LINK,
    isRead: false,
    createdAt: iso(10 * MINUTE),
  },
  {
    id: 't-3',
    eventType: 'T5',
    category: 'exam',
    message: '3학년 2반 1차 학습종합검사 기한 마감 1일 전입니다. 미제출한 학생이 있다면 검사 진행을 안내해 주세요.',
    highlights: ['3학년 2반', '1차 학습종합검사'],
    link: TEACHER_EXAM_LINK,
    isRead: false,
    createdAt: iso(1 * HOUR),
  },
  {
    id: 't-4',
    eventType: 'T3',
    category: 'exam',
    message: '김민수 학생이 1차 학습종합검사를 제출했습니다.',
    highlights: ['김민수', '1차 학습종합검사'],
    link: TEACHER_EXAM_LINK,
    isRead: false,
    createdAt: iso(2 * HOUR),
  },
  {
    id: 't-5',
    eventType: 'T3',
    category: 'exam',
    message: '이지은 학생이 1차 학습종합검사를 제출했습니다.',
    highlights: ['이지은', '1차 학습종합검사'],
    link: TEACHER_EXAM_LINK,
    isRead: true,
    createdAt: iso(1 * DAY),
  },
  {
    id: 't-6',
    eventType: 'T2',
    category: 'group',
    message: '정수아 학생이 그룹을 탈퇴했습니다.',
    highlights: ['정수아'],
    link: TEACHER_GROUP_LINK,
    isRead: true,
    createdAt: iso(2 * DAY),
  },
  {
    id: 't-7',
    eventType: 'T3',
    category: 'exam',
    message: '최유진 학생이 1차 학습종합검사를 제출했습니다.',
    highlights: ['최유진', '1차 학습종합검사'],
    link: TEACHER_EXAM_LINK,
    isRead: true,
    createdAt: iso(3 * DAY),
  },
  {
    id: 't-8',
    eventType: 'T6',
    category: 'exam',
    message: '3학년 2반 1차 학습종합검사 리포트가 생성되었습니다. 대시보드에서 결과를 확인해 보세요.',
    highlights: ['3학년 2반', '1차 학습종합검사'],
    link: TEACHER_EXAM_LINK,
    isRead: true,
    createdAt: iso(14 * DAY),
  },
];

export const studentMockNotifications: Notification[] = [
  {
    id: 's-1',
    eventType: 'S4',
    category: 'group',
    message: '3학년 2반 그룹에 초대 되었어요.',
    highlights: ['3학년 2반'],
    link: STUDENT_GROUP_LINK,
    isRead: false,
    createdAt: iso(30 * MINUTE),
  },
  {
    id: 's-2',
    eventType: 'S1',
    category: 'exam',
    message: '3학년 2반 1차 학습종합검사 검사가 시작되었어요.',
    highlights: ['3학년 2반', '1차 학습종합검사'],
    link: STUDENT_EXAM_LINK,
    isRead: false,
    createdAt: iso(2 * HOUR),
  },
  {
    id: 's-3',
    eventType: 'S2',
    category: 'exam',
    message: '3학년 2반 1차 학습종합검사 검사 종료까지 1일 남았어요.',
    highlights: ['3학년 2반', '1차 학습종합검사'],
    link: STUDENT_EXAM_LINK,
    isRead: false,
    createdAt: iso(1 * DAY),
  },
  {
    id: 's-4',
    eventType: 'S5',
    category: 'group',
    message: '3학년 2반 그룹에서 퇴장 되었어요.',
    highlights: ['3학년 2반'],
    link: STUDENT_GROUP_LINK,
    isRead: true,
    createdAt: iso(5 * DAY),
  },
  {
    id: 's-5',
    eventType: 'S3',
    category: 'exam',
    message: '3학년 2반 1차 학습종합검사 리포트가 생성되었어요. 대시보드에서 결과를 확인해 보세요.',
    highlights: ['3학년 2반', '1차 학습종합검사'],
    link: STUDENT_EXAM_LINK,
    isRead: true,
    createdAt: iso(7 * DAY),
  },
  {
    id: 's-6',
    eventType: 'S6',
    category: 'exam',
    message: '선생님이 1차 학습종합검사 다시 한번 응시를 요청했어요.',
    highlights: ['1차 학습종합검사'],
    link: STUDENT_EXAM_LINK,
    isRead: true,
    createdAt: iso(14 * DAY),
  },
];
