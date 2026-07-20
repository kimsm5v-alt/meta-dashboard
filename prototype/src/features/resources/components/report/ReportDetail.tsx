/**
 * 리포트 상세 (목업 renderReportDetail). ★기획서 7장 ReportDetail
 * 돌아가기 + 내보내기 + 요약 + 탭(슬라이드별/학생별).
 */
import { REPORTS } from '../../mock-data';
import { useResources } from '../../store/ResourcesContext';
import { ReportSummary } from './ReportSummary';
import { RdTabBar } from './RdTabBar';
import { SlideTab } from './SlideTab';
import { StudentTab } from './StudentTab';

export const ReportDetail = () => {
  const { rdReport, rdTab, closeReport, toast } = useResources();
  const report = REPORTS.find((r) => r.id === rdReport);
  if (!report) return null;

  return (
    <div className="mt-5">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={closeReport}
          className="flex items-center gap-1 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700"
        >
          <span className="text-lg leading-none">‹</span> 수업 결과보기로 돌아가기
        </button>
        <button
          onClick={() => toast('결과 내보내기: PDF / 공유 링크')}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          ↗ 내보내기
        </button>
      </div>

      <ReportSummary report={report} />
      <RdTabBar />
      {rdTab === 'slide' ? <SlideTab report={report} /> : <StudentTab report={report} />}
    </div>
  );
};
