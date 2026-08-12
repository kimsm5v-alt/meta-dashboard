/**
 * 리포트 상태 필터 칩 (목업 toggleRs). 전체/진행중/진행예정/완료.
 * 각 칩에 해당 상태의 활동 수를 함께 표시 — 누르기 전에 몇 건인지 보이게 한다.
 */
import { scopedReports } from '../../utils/format';
import { useResources, type RsFilter } from '../../store/ResourcesContext';

const FILTERS: RsFilter[] = ['전체', '진행중', '진행예정', '완료'];

export const ReportFilterChips = () => {
  const { rsFilter, setRsFilter, scope } = useResources();
  const rs = scopedReports(scope); // 카드 그리드와 동일한 스코프 기준
  const countOf = (f: RsFilter) => (f === '전체' ? rs.length : rs.filter((r) => r.rstatus === f).length);

  return (
    <div className="mt-5 flex flex-wrap gap-1.5">
      {FILTERS.map((f) => {
        const active = rsFilter === f;
        const n = countOf(f);
        return (
          <button
            key={f}
            data-rs={f}
            onClick={() => setRsFilter(f)}
            disabled={n === 0 && f !== '전체'}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
              active
                ? 'border-primary-500 bg-primary-50 text-primary-600'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200'
            }`}
          >
            {f}
            <span
              className={`rounded-full px-1.5 text-xs font-bold tabular-nums ${
                active ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {n}
            </span>
          </button>
        );
      })}
    </div>
  );
};
