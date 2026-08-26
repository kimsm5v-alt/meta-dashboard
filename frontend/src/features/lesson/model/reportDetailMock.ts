import type { ReportDetailView } from './reportDetailTypes';

/** 레이아웃 확인용 목업 키. 실제 활동 id에는 붙이지 않는다. */
export const MOCK_REPORT_DETAIL_ACTIVITY_ID = 'mock-report-detail';

const MOCK_REPORT_DETAIL: ReportDetailView = {
  activityId: MOCK_REPORT_DETAIL_ACTIVITY_ID,
  pageCount: 4,
  participantCount: 2,
  assignedCount: 3,
  avgCorrectRate: 50,
  selFactors: ['자기인식'],
  className: '2학년 3반',
  students: [
    { studentId: 'st-1', no: 1, studentName: '이민준', statusCd: 5, score: 90 },
    { studentId: 'st-2', no: 2, studentName: '박서연', statusCd: 3, score: 70 },
    { studentId: 'st-3', no: 3, studentName: '최하준', statusCd: 2, score: null },
  ],
  articles: [
    { id: 'a-1', order: 1, title: '마음 살펴보기', nature: '개념', selFactor: '자기인식' },
    { id: 'a-2', order: 2, title: '갈등 장면 그리기', nature: '활동', gradingType: 2 },
    { id: 'a-3', order: 3, title: '감정 고르기', nature: '문항', correctAnswer: '기쁨' },
    { id: 'a-4', order: 4, title: '내 생각 쓰기', nature: '문항' },
  ],
  responses: [
    { articleId: 'a-1', studentId: 'st-1', submitAnswer: '조회함' },
    { articleId: 'a-2', studentId: 'st-1', submitAnswer: '제출함', errata: 1 },
    { articleId: 'a-3', studentId: 'st-1', submitAnswer: '기쁨', errata: 1 },
    { articleId: 'a-4', studentId: 'st-1', submitAnswer: '친구와 이야기했다' },
    { articleId: 'a-1', studentId: 'st-2', submitAnswer: '조회함' },
    { articleId: 'a-2', studentId: 'st-2', submitAnswer: '제출함' },
    { articleId: 'a-3', studentId: 'st-2', submitAnswer: '슬픔', errata: 2 },
  ],
};

export const emptyReportDetail = (activityId: string): ReportDetailView => ({
  activityId,
  pageCount: 0,
  participantCount: 0,
  assignedCount: 0,
  avgCorrectRate: null,
  selFactors: [],
  students: [],
  articles: [],
  responses: [],
});

export const getReportDetailView = (activityId: string): ReportDetailView => {
  return MOCK_REPORT_DETAIL;
  // if (activityId === MOCK_REPORT_DETAIL.activityId) return MOCK_REPORT_DETAIL;
  // return emptyReportDetail(activityId);
};
