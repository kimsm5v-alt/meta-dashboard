/**
 * 검사 Feature - Mock 데이터
 *
 * 개발/테스트용 가상 데이터
 */

import type { ExamOverviewRow, ExamOverviewSummary, StudentExamStatus } from './types';

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
    examName: 'META 학습심리정서검사',
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
    examName: 'META 학습심리정서검사',
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
    examName: 'META 학습심리정서검사',
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
    examName: 'META 학습심리정서검사',
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
    examName: 'META 학습심리정서검사',
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
    examName: 'META 학습심리정서검사',
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
