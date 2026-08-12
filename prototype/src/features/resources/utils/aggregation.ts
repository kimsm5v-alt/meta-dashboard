/**
 * 리포트 집계 — 순수 함수 (REPORT_SPEC_v2, Article/ResponseData/StudentActivity 기반).
 * 목록 카드·상세 요약·페이지/학생 뷰가 이 함수들을 단일 소스로 사용 → 수치 정합.
 */
import type { Report, Article, StudentActivity, ResponseData, StudentSummary } from '../types';

/** 아티클(페이지) 정의 — 미연결(진행예정) 리포트는 빈 배열 */
export function articlesOf(r: Report): Article[] {
  return r.articles ?? [];
}

/** 학생 활동 목록 */
export function studentsOf(r: Report): StudentActivity[] {
  return r.students ?? [];
}

/** 응답 목록 */
export function responsesOf(r: Report): ResponseData[] {
  return r.responses ?? [];
}

/** 특정 학생의 특정 아티클 응답 */
export function responseOf(r: Report, articleId: string, studentId: string): ResponseData | undefined {
  return responsesOf(r).find((x) => x.articleId === articleId && x.studentId === studentId);
}

/** 배정 인원 (상세 연결 시 학생 수, 아니면 total fallback) */
export function assignedCount(r: Report): number {
  return studentsOf(r).length || r.total;
}

/** 참여 인원 = 하나라도 제출 (statusCd ∈ {3,4,5}) */
export function participantCount(r: Report): number {
  return studentsOf(r).filter((s) => s.statusCd === 3 || s.statusCd === 4 || s.statusCd === 5).length;
}

/** 미제출 학생 수 (statusCd=2) */
export function unsubmittedCount(r: Report): number {
  return studentsOf(r).filter((s) => s.statusCd === 2).length;
}

/** 정답 있는 문항(채점 가능) */
export function gradableArticles(r: Report): Article[] {
  return articlesOf(r).filter((a) => a.nature === '문항' && a.correctAnswer != null);
}

/** 채점 가능 문항 존재 여부 (정답률 표시 조건) */
export function hasGradedItems(r: Report): boolean {
  return gradableArticles(r).length > 0;
}

/** 평균 정답률(%) — 정답 있는 문항만. 없으면 null */
export function avgCorrectRate(r: Report): number | null {
  const arts = gradableArticles(r);
  if (!arts.length) return null;
  const ids = new Set(arts.map((a) => a.id));
  const rs = responsesOf(r).filter((x) => ids.has(x.articleId));
  if (!rs.length) return 0;
  const correct = rs.filter((x) => x.errata === 1).length;
  return Math.round((correct / rs.length) * 100);
}

/**
 * 교사 수동 채점 대상 응답 — 제출된 '활동'(gradingType=2).
 * 개념은 조회 여부만 보므로 채점 대상에서 제외한다.
 */
export function manualGradingTargets(r: Report, articleId?: string): ResponseData[] {
  const manual = new Set(
    articlesOf(r)
      .filter((a) => a.nature === '활동' && a.gradingType === 2)
      .map((a) => a.id),
  );
  return responsesOf(r).filter((x) => manual.has(x.articleId) && (!articleId || x.articleId === articleId));
}

/** 아티클 단위 응답 인원 */
export function articleResponded(r: Report, articleId: string): number {
  return responsesOf(r).filter((x) => x.articleId === articleId).length;
}

/** 한 학생의 리포트 요약 (학생별 보기) */
export function studentSummary(r: Report, studentId: string): StudentSummary {
  const arts = articlesOf(r);
  const mine = responsesOf(r).filter((x) => x.studentId === studentId);
  const stu = studentsOf(r).find((s) => s.studentId === studentId);
  const gradable = new Set(gradableArticles(r).map((a) => a.id));
  const gradedResp = mine.filter((x) => gradable.has(x.articleId));
  return {
    submittedArticles: mine.length,
    totalArticles: arts.length,
    correctN: gradedResp.filter((x) => x.errata === 1).length,
    gradedN: gradedResp.length,
    duration: stu?.duration ?? 0,
    submittedAt: stu?.submittedAt,
    statusCd: stu?.statusCd ?? 2,
  };
}
