/**
 * 수업 결과보기 (목업 renderResults). 목록 ↔ 상세 인라인 전환.
 * rdReport 있으면 리포트 상세(Phase 5), 없으면 현황 + 목록.
 */
import { useResources } from '../../store/ResourcesContext';
import { StatusPanel } from './StatusPanel';
import { ReportFilterChips } from './ReportFilterChips';
import { ReportCardGrid } from './ReportCardGrid';
import { ReportDetail } from './ReportDetail';

export const ResultsView = () => {
  const { rdReport } = useResources();

  if (rdReport) return <ReportDetail />;

  return (
    <div>
      <StatusPanel />
      <ReportFilterChips />
      <ReportCardGrid />
    </div>
  );
};
