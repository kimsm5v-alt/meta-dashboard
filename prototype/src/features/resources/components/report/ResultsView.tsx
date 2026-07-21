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
      <div className="mt-5">
        <h2 className="text-lg font-extrabold tracking-tight text-gray-900">수업 결과보기</h2>
        <p className="mt-0.5 text-sm text-gray-500">배포한 활동의 참여 현황을 한눈에 보고, 활동별 리포트로 상세 결과를 확인하세요.</p>
      </div>
      <StatusPanel />
      <ReportFilterChips />
      <ReportCardGrid />
    </div>
  );
};
