/**
 * 리포트 상태 필터 칩 (목업 toggleRs). 전체/진행중/진행예정/완료.
 */
import { useResources, type RsFilter } from '../../store/ResourcesContext';

const FILTERS: RsFilter[] = ['전체', '진행중', '진행예정', '완료'];

export const ReportFilterChips = () => {
  const { rsFilter, setRsFilter } = useResources();
  return (
    <div className="mt-5 flex flex-wrap gap-1.5">
      {FILTERS.map((f) => {
        const active = rsFilter === f;
        return (
          <button
            key={f}
            data-rs={f}
            onClick={() => setRsFilter(f)}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
              active
                ? 'border-primary-500 bg-primary-50 text-primary-600'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            {f}
          </button>
        );
      })}
    </div>
  );
};
