/**
 * 페이지별 보기 상단 요약 strip.
 * 자동채점 문항은 정오 개수, 그 외는 제출/조회 수. 교사 수동 채점 대상이면 남은 채점 건수를 함께 보여준다.
 */
import { articleResponded, assignedCount, responsesOf, manualGradingTargets } from '../../../utils/aggregation';
import { useResources, gradeKey } from '../../../store/ResourcesContext';
import type { Report, Article } from '../../../types';

export const SummaryStrip = ({ report, article }: { report: Report; article: Article }) => {
  const { grades } = useResources();
  const responded = articleResponded(report, article.id);
  const assigned = assignedCount(report);

  const manual = manualGradingTargets(report, article.id);
  const gradedN = manual.filter((x) => grades[gradeKey(x.articleId, x.studentId)] != null).length;

  const GradingChip = () =>
    manual.length === 0 ? null : (
      <>
        <span className="text-gray-300">·</span>
        <span className="font-semibold text-gray-500">
          채점{' '}
          <b className={gradedN === manual.length ? 'text-emerald-600' : 'text-amber-600'}>{gradedN}</b>/{manual.length}
        </span>
      </>
    );

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

  // 활동 / 개념: 제출·조회 수 (+ 채점 진행률)
  const label = article.nature === '개념' ? '조회' : '제출';
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-gray-50 px-4 py-3 text-sm">
      <span className="font-semibold text-gray-500">
        {label} <b className="text-gray-800">{responded}</b>/{assigned}명
      </span>
      <GradingChip />
    </div>
  );
};
