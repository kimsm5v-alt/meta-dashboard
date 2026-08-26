import type { ArticleNature, ErrataCd } from './reportDetailTypes';

export type StudentResultStatus = '완료' | '진행중' | '미제출' | '대기';

export interface StudentReportListItem {
  id: string;
  title: string;
  status: StudentResultStatus;
  due: string;
  correctRate?: number | null;
}

export interface StudentReportArticle {
  id: string;
  order: number;
  nature: ArticleNature;
  itemType: string;
  title: string;
  correctAnswer?: string;
}

export interface StudentReportResponse {
  articleId: string;
  submitAnswer: string;
  errata: ErrataCd;
  captureImage?: string;
}

export interface StudentReportDetailView {
  id: string;
  title: string;
  summary: {
    pages: number;
    totalPages: number;
    correctN: number;
    gradedN: number;
    durationSec: number;
    submittedAt?: string;
  };
  articles: StudentReportArticle[];
  responses: StudentReportResponse[];
}
