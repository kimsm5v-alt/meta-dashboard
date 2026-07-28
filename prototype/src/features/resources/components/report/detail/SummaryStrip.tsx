/**
 * 페이지별 보기 상단 요약 strip (R8, 통일·단순화).
 * 통계(분포/정답률%) 없이 — 정오 있으면 정오 개수, 아니면 제출/조회 수만.
 */
import { articleResponded, assignedCount, responsesOf } from '../../../utils/aggregation';
import type { Report, Article } from '../../../types';

export const SummaryStrip = ({ report, article }: { report: Report; article: Article }) => {
  const responded = articleResponded(report, article.id);
  const assigned = assignedCount(report);

  // 문항(정답 있음): 정오 개수로
  if (article.nature === '문항' && article.correctAnswer != null) {
    const rs = responsesOf(report).filter((x) => x.articleId === article.id);
    const correct = rs.filter((x) => x.errata === 1).length;
    const wrong = rs.filter((x) => x.errata === 2).length;
    const partial = rs.filter((x) => x.errata === 3).length;
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-gray-50 px-4 py-3 text-sm">
        <span className="font-semibold text-gray-500">
          정답 <b className="text-blue-600">{correct}</b>
        </span>
        <span className="font-semibold text-gray-500">
          오답 <b className="text-red-600">{wrong}</b>
        </span>
        {partial > 0 && (
          <span className="font-semibold text-gray-500">
            부분 <b className="text-amber-600">{partial}</b>
          </span>
        )}
        <span className="text-gray-300">·</span>
        <span className="font-semibold text-gray-500">
          제출 <b className="text-gray-800">{responded}</b>/{assigned}
        </span>
      </div>
    );
  }

  // 활동 / 개념: 제출·조회 수만
  const label = article.nature === '개념' ? '조회' : '제출';
  return (
    <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
      <span className="font-semibold text-gray-500">
        {label} <b className="text-gray-800">{responded}</b>/{assigned}명
      </span>
    </div>
  );
};
