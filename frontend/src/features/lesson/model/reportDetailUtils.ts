import type {
  CellInfo,
  ErrataCd,
  RenderMode,
  ReportDetailArticle,
  ReportDetailResponse,
  ReportDetailStudent,
  ReportDetailView,
  StudentStatusCd,
} from './reportDetailTypes';

export const SUBMITTED_STATUS: StudentStatusCd[] = [3, 4, 5];

export const pct = (n: number, d: number): number => (d <= 0 ? 0 : Math.round((n / d) * 100));

export const fmtDotDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

export const fmtDuration = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}분 ${String(s).padStart(2, '0')}초`;
};

export const fmtDurationMs = (ms: number): string => fmtDuration(Math.floor(ms / 1000));

export const fmtDateTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const date = fmtDotDate(iso);
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${date} ${time}`;
};

export const responseOf = (
  view: ReportDetailView,
  articleId: string,
  studentId: string,
): ReportDetailResponse | undefined =>
  view.responses.find((r) => r.articleId === articleId && r.studentId === studentId);

export const articleResponded = (view: ReportDetailView, articleId: string): number =>
  view.responses.filter((r) => r.articleId === articleId).length;

export const hasGradedItems = (view: ReportDetailView): boolean =>
  view.articles.some((a) => a.nature === '문항' && a.correctAnswer != null);

export const studentSummary = (view: ReportDetailView, studentId: string) => {
  const totalArticles = view.articles.length;
  const submittedArticles = view.articles.filter((a) => responseOf(view, a.id, studentId)).length;
  const gradedArticles = view.articles.filter(
    (a) => a.nature === '문항' && a.correctAnswer != null,
  );
  const gradedN = gradedArticles.length;
  const correctN = gradedArticles.filter((a) => {
    const resp = responseOf(view, a.id, studentId);
    return resp?.errata === 1;
  }).length;
  return { totalArticles, submittedArticles, gradedN, correctN };
};

export const renderMode = (article: ReportDetailArticle): RenderMode => {
  if (article.nature === '개념') return 'concept';
  if (article.nature === '문항' && article.correctAnswer != null) return 'choice';
  if (article.nature === '문항') return 'text';
  return 'plain';
};

export const responseCell = (
  article: ReportDetailArticle,
  resp?: ReportDetailResponse,
  grade?: ErrataCd,
): CellInfo => {
  const submitted = resp != null;
  const auto = article.nature === '문항' && article.correctAnswer != null;
  const manual = submitted && article.nature === '활동' && article.gradingType === 2;

  let value: string;
  if (article.nature === '개념') value = submitted ? '조회함' : '안 봄';
  else if (!submitted) value = '미제출';
  else value = resp.submitAnswer || '제출함';

  const errata = auto && submitted ? (resp.errata ?? undefined) : manual ? grade : undefined;

  return {
    submitted,
    value,
    gradable: auto || (manual && grade != null),
    errata: errata ?? undefined,
    correctAnswer: article.correctAnswer ?? undefined,
    manual,
    mediaSec: resp?.mediaSec,
  };
};

export const submittedStudentCount = (students: ReportDetailStudent[]): number =>
  students.filter((s) => SUBMITTED_STATUS.includes(s.statusCd)).length;
