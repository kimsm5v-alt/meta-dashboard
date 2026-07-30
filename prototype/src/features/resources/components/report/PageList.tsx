/**
 * 페이지별 보기 좌측 — 페이지 목록 (번호 + 성격 배지 + 응답 수).
 */
import { articlesOf, articleResponded, assignedCount } from '../../utils/aggregation';
import { useResources } from '../../store/ResourcesContext';
import type { Report } from '../../types';
import { NatureBadge } from './badges';

export const PageList = ({ report }: { report: Report }) => {
  const { rdSlide, selectSlide } = useResources();
  const arts = articlesOf(report);
  const cur = rdSlide >= arts.length ? 0 : rdSlide;
  const assigned = assignedCount(report);

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-gray-100 bg-white p-2">
      <div className="px-2 py-1.5 text-xs font-bold text-gray-500">
        페이지 <span className="font-semibold text-gray-400">({arts.length})</span>
      </div>
      {arts.map((a, i) => {
        const on = i === cur;
        const resp = articleResponded(report, a.id);
        return (
          <button
            key={a.id}
            onClick={() => selectSlide(i)}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
              on ? 'bg-primary-50' : 'hover:bg-gray-50'
            }`}
          >
            <span
              className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg text-xs font-bold ${
                on ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {a.order}
            </span>
            <span className="min-w-0 flex-1">
              <span className="mb-0.5 flex items-center gap-1.5">
                <NatureBadge nature={a.nature} />
              </span>
              <span className="block truncate text-sm font-semibold text-gray-800">{a.title}</span>
              <span className="block text-xs text-gray-500">
                응답 {resp}/{assigned}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
