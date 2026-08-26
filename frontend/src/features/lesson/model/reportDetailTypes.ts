export type ReportDetailTab = 'student' | 'slide';
export type ArticleNature = '개념' | '활동' | '문항';
export type StudentStatusCd = 2 | 3 | 4 | 5;
export type ErrataCd = 1 | 2 | 3 | 4;
export type RenderMode = 'concept' | 'choice' | 'text' | 'drawing' | 'media' | 'plain';

export interface ReportDetailStudent {
  studentId: string;
  no: number;
  studentName: string;
  statusCd: StudentStatusCd;
  score: number | null;
}

export interface ReportDetailArticle {
  id: string;
  order: number;
  title: string;
  nature: ArticleNature;
  selFactor?: string;
  correctAnswer?: string | null;
  gradingType?: number;
}

export interface ReportDetailResponse {
  articleId: string;
  studentId: string;
  submitAnswer?: string;
  errata?: ErrataCd | null;
  captureImage?: string;
  mediaSec?: number;
}

export interface ReportDetailView {
  activityId: string;
  pageCount: number;
  participantCount: number;
  assignedCount: number;
  avgCorrectRate: number | null;
  selFactors: string[];
  className?: string;
  students: ReportDetailStudent[];
  articles: ReportDetailArticle[];
  responses: ReportDetailResponse[];
}

export interface CellInfo {
  submitted: boolean;
  value: string;
  gradable: boolean;
  errata?: ErrataCd;
  correctAnswer?: string;
  manual: boolean;
  mediaSec?: number;
}
