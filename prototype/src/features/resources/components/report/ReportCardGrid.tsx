/**
 * 리포트 카드 그리드 (목업 renderReportList). 부록A #6 스코프 필터 + 상태 필터.
 */
import { scopedReports } from '../../utils/format';
import { useResources } from '../../store/ResourcesContext';
import { ReportCard } from './ReportCard';

export const ReportCardGrid = () => {
  const { scope, rsFilter } = useResources();
  let rs = scopedReports(scope); // #6 스코프 필터
  if (rsFilter !== '전체') rs = rs.filter((r) => r.rstatus === rsFilter);

  if (!rs.length) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
        <div className="text-3xl">📭</div>
        <div className="mt-2 text-sm font-medium text-gray-500">해당 상태의 수업 결과가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
      {rs.map((r) => (
        <ReportCard key={r.id} report={r} />
      ))}
    </div>
  );
};
