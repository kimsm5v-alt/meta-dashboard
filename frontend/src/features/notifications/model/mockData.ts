import type { Notification } from './types';

const now = new Date();

export const mockTeacherNotifications: Notification[] = [
  {
    id: 't1-001',
    eventType: 'T1',
    category: 'exam',
    message: '3학년 2반 1차 검사가 시작되었습니다.',
    highlights: ['3학년 2반', '1차 검사'],
    link: '/dashboard',
    isRead: false,
    createdAt: new Date(now.getTime() - 2 * 60 * 1000).toISOString(), // 2분 전
  },
  {
    id: 't2-001',
    eventType: 'T2',
    category: 'exam',
    message: '김철수 학생이 검사를 완료했습니다.',
    highlights: ['김철수'],
    link: '/dashboard',
    isRead: false,
    createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30분 전
  },
  {
    id: 't3-001',
    eventType: 'T3',
    category: 'exam',
    message: '3학년 2반 1차 검사가 마감되었습니다.',
    highlights: ['3학년 2반', '1차 검사', '마감'],
    link: '/dashboard',
    isRead: true,
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2시간 전
  },
  {
    id: 't4-001',
    eventType: 'T4',
    category: 'group',
    message: '3학년 2반에 새로운 학생이 참여했습니다.',
    highlights: ['3학년 2반', '새로운 학생'],
    link: '/groups',
    isRead: false,
    createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), // 5시간 전
  },
  {
    id: 't5-001',
    eventType: 'T5',
    category: 'group',
    message: '이영희 학생이 3학년 1반에서 탈퇴했습니다.',
    highlights: ['이영희', '3학년 1반'],
    link: '/groups',
    isRead: true,
    createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 어제
  },
  {
    id: 't6-001',
    eventType: 'T6',
    category: 'group',
    message: '김철수 학생과의 상담이 내일 오후 2시로 예정되어 있습니다.',
    highlights: ['김철수', '상담', '내일 오후 2시'],
    link: '/schedule',
    isRead: false,
    createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(), // 2일 전
  },
];

export const mockStudentNotifications: Notification[] = [
  {
    id: 's1-001',
    eventType: 'S1',
    category: 'exam',
    message: '1차 심리검사가 시작되었습니다. 검사를 시작해주세요.',
    highlights: ['1차 심리검사'],
    link: '/student/exams',
    isRead: false,
    createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5분 전
  },
  {
    id: 's2-001',
    eventType: 'S2',
    category: 'exam',
    message: '1차 심리검사가 3일 후 마감됩니다.',
    highlights: ['1차 심리검사', '3일 후 마감'],
    link: '/student/exams',
    isRead: false,
    createdAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(), // 45분 전
  },
  {
    id: 's3-001',
    eventType: 'S3',
    category: 'group',
    message: '3학년 2반 그룹에 초대되었습니다.',
    highlights: ['3학년 2반', '초대'],
    link: '/student/groups',
    isRead: true,
    createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), // 3시간 전
  },
  {
    id: 's4-001',
    eventType: 'S4',
    category: 'group',
    message: '3학년 1반 그룹에서 탈퇴되었습니다.',
    highlights: ['3학년 1반', '탈퇴'],
    link: '/student/groups',
    isRead: true,
    createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 어제
  },
  {
    id: 's5-001',
    eventType: 'S5',
    category: 'group',
    message: '김선생님과의 상담이 내일 오후 2시로 확정되었습니다.',
    highlights: ['김선생님', '상담', '내일 오후 2시'],
    link: '/student/groups',
    isRead: false,
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2일 전
  },
  {
    id: 's6-001',
    eventType: 'S6',
    category: 'group',
    message: '김선생님과의 상담 일정이 모레 오후 3시로 변경되었습니다.',
    highlights: ['김선생님', '상담 일정 변경', '모레 오후 3시'],
    link: '/student/groups',
    isRead: true,
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3일 전
  },
];
