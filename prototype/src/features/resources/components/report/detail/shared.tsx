/**
 * 리포트 상세 통일(R8) 공용 헬퍼.
 * 성격(개념/문항/활동) 무관하게 응답 1건을 동일 4-슬롯으로 표현하기 위한 매핑.
 */
import { studentsOf, responseOf } from '../../../utils/aggregation';
import type { Report, Article, ResponseData, StudentActivity, Errata } from '../../../types';

/** 제출자만: 학생 + 해당 아티클 응답 */
export function submittedRows(report: Report, article: Article): { s: StudentActivity; resp: ResponseData }[] {
  return studentsOf(report)
    .map((s) => ({ s, resp: responseOf(report, article.id, s.studentId) }))
    .filter((r): r is { s: StudentActivity; resp: ResponseData } => r.resp != null);
}

/** 응답 없음 빈 상태 */
export const NoResponses = () => (
  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-10 text-center text-sm font-medium text-gray-400">
    아직 제출된 응답이 없습니다.
  </div>
);

/** 통일 카드용 셀 정보 — 성격/유형별 표시 규칙을 한 곳에 */
export interface CellInfo {
  submitted: boolean;
  /** 표시용 응답값 (개념=조회함/안 봄, 활동=응답/제출함, 문항=제출한 원본) */
  value: string;
  /** 정답 있는 문항 (정오 슬롯 활성 조건) */
  gradable: boolean;
  /** 제출된 문항일 때만 채워짐 */
  errata?: Errata;
  correctAnswer?: string;
}

export function responseCell(article: Article, resp?: ResponseData): CellInfo {
  const submitted = resp != null;
  const gradable = article.nature === '문항' && article.correctAnswer != null;
  let value: string;
  if (article.nature === '개념') value = submitted ? '조회함' : '안 봄';
  else value = submitted ? resp!.submitAnswer || '제출함' : '미제출';
  return {
    submitted,
    value,
    gradable,
    errata: submitted && gradable ? resp!.errata : undefined,
    correctAnswer: article.correctAnswer,
  };
}
