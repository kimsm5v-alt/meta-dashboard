import type {
  StudentReportArticle,
  StudentReportDetailView,
  StudentReportListItem,
  StudentReportResponse,
} from './studentReportTypes';

const LIST: StudentReportListItem[] = [
  { id: 'sr-1', title: '갈등 해결 시나리오', status: '완료', due: '07/22', correctRate: 100 },
  { id: 'sr-2', title: '자기인식 워크시트', status: '미제출', due: '07/24' },
  { id: 'sr-3', title: '자기관리 목표 세우기', status: '대기', due: '07/27' },
  { id: 'sr-4', title: '정서 안정 호흡 활동', status: '완료', due: '07/03', correctRate: null },
];

const SR1_ARTICLES: StudentReportArticle[] = [
  { id: 'art-1', order: 1, nature: '개념', itemType: '-', title: '갈등이란 무엇일까?' },
  {
    id: 'art-2',
    order: 2,
    nature: '문항',
    itemType: 'choice',
    title: '갈등 상황 파악하기',
    correctAnswer: '3',
  },
  { id: 'art-3', order: 3, nature: '활동', itemType: 'essay', title: '나의 갈등 경험 쓰기' },
  { id: 'art-4', order: 4, nature: '활동', itemType: 'drawing', title: '갈등 해결 방법 그리기' },
  {
    id: 'art-5',
    order: 5,
    nature: '문항',
    itemType: 'ox',
    title: '갈등 해결 O/X 퀴즈',
    correctAnswer: 'O',
  },
  { id: 'art-6', order: 6, nature: '활동', itemType: 'audio', title: '친구에게 사과 녹음하기' },
];

const SR1_RESPONSES: StudentReportResponse[] = [
  { articleId: 'art-1', submitAnswer: '', errata: 4, captureImage: '개념 캡처' },
  { articleId: 'art-2', submitAnswer: '3', errata: 1, captureImage: '선택형 캡처' },
  {
    articleId: 'art-3',
    submitAnswer: '친구와 다퉜을 때 먼저 사과했다',
    errata: 4,
    captureImage: '서술형 캡처',
  },
  { articleId: 'art-4', submitAnswer: 'drawing-url-001', errata: 4, captureImage: '그리기 캡처' },
  { articleId: 'art-5', submitAnswer: 'O', errata: 1, captureImage: 'OX 캡처' },
  { articleId: 'art-6', submitAnswer: 'audio-url-001', errata: 4, captureImage: '녹음 캡처' },
];

const SR4_ARTICLES: StudentReportArticle[] = [
  { id: 'b-1', order: 1, nature: '개념', itemType: '-', title: '호흡과 마음의 관계' },
  { id: 'b-2', order: 2, nature: '활동', itemType: 'essay', title: '지금 나의 기분 적기' },
  { id: 'b-3', order: 3, nature: '활동', itemType: 'drawing', title: '호흡 후 마음 그리기' },
];

const SR4_RESPONSES: StudentReportResponse[] = [
  { articleId: 'b-1', submitAnswer: '', errata: 4, captureImage: '개념 캡처' },
  { articleId: 'b-2', submitAnswer: '차분해졌다', errata: 4, captureImage: '서술형 캡처' },
  { articleId: 'b-3', submitAnswer: 'drawing-url-101', errata: 4, captureImage: '그리기 캡처' },
];

const DETAILS: Record<string, StudentReportDetailView> = {
  'sr-1': {
    id: 'sr-1',
    title: '갈등 해결 시나리오',
    summary: {
      pages: 6,
      totalPages: 6,
      correctN: 2,
      gradedN: 2,
      durationSec: 320,
      submittedAt: '2026-07-18 14:23',
    },
    articles: SR1_ARTICLES,
    responses: SR1_RESPONSES,
  },
  'sr-4': {
    id: 'sr-4',
    title: '정서 안정 호흡 활동',
    summary: {
      pages: 3,
      totalPages: 3,
      correctN: 0,
      gradedN: 0,
      durationSec: 240,
      submittedAt: '2026-07-03 10:12',
    },
    articles: SR4_ARTICLES,
    responses: SR4_RESPONSES,
  },
};

export const getStudentReportList = (): StudentReportListItem[] => LIST;

export const getStudentReportDetail = (id: string): StudentReportDetailView | undefined =>
  DETAILS[id];

export const hasStudentReportDetail = (id: string): boolean => getStudentReportDetail(id) != null;
