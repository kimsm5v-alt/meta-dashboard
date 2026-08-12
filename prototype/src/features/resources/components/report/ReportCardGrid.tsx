/**
 * 리포트 카드 그리드 (목업 renderReportList). 부록A #6 스코프 필터 + 상태 필터.
 * highlightStudent 가 있으면 그 학생이 미제출인 활동 카드에 테두리를 준다
 * (요약 패널에서 학생 이름을 눌렀을 때 — 필터가 아니라 강조라 상태 필터와 충돌하지 않는다).
 */
import { scopedReports } from '../../utils/format';
import { studentsOf } from '../../utils/aggregation';
import { useResources } from '../../store/ResourcesContext';
import { ReportCard } from './ReportCard';
import type { Report } from '../../types';

const isPendingFor = (r: Report, name: string) =>
  studentsOf(r).some((s) => s.studentName === name && s.statusCd === 2);

export const ReportCardGrid = ({ highlightStudent }: { highlightStudent?: string | null }) => {
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
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {rs.map((r) => (
        <ReportCard key={r.id} report={r} highlight={!!highlightStudent && isPendingFor(r, highlightStudent)} />
      ))}
    </div>
  );
};
