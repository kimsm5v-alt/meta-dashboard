/**
 * 리포트 카드 (목업 renderReportList 카드). 진행예정→"시작 전", 그 외→"참여 p/total".
 */
import { STUDENTS } from '../../mock-data';
import { participation, submitters } from '../../utils/aggregation';
import { useResources } from '../../store/ResourcesContext';
import type { Report } from '../../types';
import { RsBadge, ClassBadge } from './badges';
import { CardThumb } from '../common/CardThumb';
import { CARD_SHELL } from '../common/cardStyles';

export const ReportCard = ({ report }: { report: Report }) => {
  const { openReport } = useResources();
  const p = participation(report);
  const metric = report.rstatus === '진행예정' ? '시작 전' : `참여 ${p}/${report.total}명`;

  const open = () => {
    const first = submitters(report)[0] || STUDENTS[report.cls]?.[0] || null;
    openReport(report.id, first);
  };

  return (
    <div className={CARD_SHELL}>
      <CardThumb g={report.g} em={report.em} title={report.title} />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <RsBadge status={report.rstatus} />
          <ClassBadge cls={report.cls} />
        </div>
        <div className="text-xs text-gray-500">
          📅 {report.start} ~ {report.end} · {metric}
        </div>
        <button
          onClick={open}
          className="mt-auto rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-600"
        >
          📊 결과보기
        </button>
      </div>
    </div>
  );
};
