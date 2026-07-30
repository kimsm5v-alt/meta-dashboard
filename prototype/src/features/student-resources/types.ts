/**
 * 학생 수업 자료실(student-resources) 도메인 타입.
 * 교사용 resources 에서 분리한 학생 모드 전용 (self-contained).
 */

/** 학생에게 배포된 과제 (진행중 배너/목록 배지용) */
export interface StudentTask {
  t: string;
  st: '미제출' | '완료';
  dd: string; // 마감 'MM/DD'
}

// ============================================
// 학생 리포트 (REPORT_SPEC_v2 화면5)
// ============================================

/** 콘텐츠 성격 */
export type Nature = '개념' | '활동' | '문항';

/** 정오 코드: 1=정답, 2=오답, 3=부분정답, 4=채점불가 */
export type Errata = 1 | 2 | 3 | 4;

/** 학생 활동 상태 */
export type StudentStatus = '완료' | '진행중' | '미제출' | '대기';

/** 5-1 대시보드 목록 항목 */
export interface StudentReportItem {
  id: string;
  title: string;
  status: StudentStatus;
  due: string; // 마감 'MM/DD'
  correctRate?: number | null; // 제출 & 정답 있는 문항 있을 때만
}

/** 학생 본인 아티클(페이지) */
export interface StudentArticle {
  id: string;
  order: number;
  nature: Nature;
  itemType: string;
  title: string;
  correctAnswer?: string; // 문항만
}

/** 학생 본인 응답 */
export interface StudentResponse {
  articleId: string;
  submitAnswer: string;
  errata: Errata;
  captureImage?: string; // 뷰어 캡처 (placeholder)
}

/** 5-2 상세 리포트 */
export interface StudentReportDetail {
  id: string;
  title: string;
  summary: {
    pages: number; // 제출 페이지
    totalPages: number; // 전체 페이지
    correctN: number; // 맞춘 문항
    gradedN: number; // 채점 가능 문항
    durationSec: number;
    submittedAt?: string;
  };
  articles: StudentArticle[];
  responses: StudentResponse[];
}
