/**
 * 리포트 카드 (목업 renderReportList 카드). 진행예정→"시작 전", 그 외→"참여 p/배정".
 */
import { Calendar, BarChart3 } from 'lucide-react';
import { participantCount, assignedCount, studentsOf } from '../../utils/aggregation';
import { useResources } from '../../store/ResourcesContext';
import type { Report } from '../../types';
import { RsBadge, ClassBadge } from './badges';
import { CardThumb } from '../common/CardThumb';
import { CARD_SHELL, CARD_BTN_PRIMARY } from '../common/cardStyles';

export const ReportCard = ({ report }: { report: Report }) => {
  const { openReport } = useResources();
  const p = participantCount(report);
  const metric = report.rstatus === '진행예정' ? '시작 전' : `참여 ${p}/${assignedCount(report)}명`;

  const open = () => {
    const first = studentsOf(report)[0]?.studentId ?? null;
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
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="h-3.5 w-3.5 flex-none text-gray-400" />
          {report.start} ~ {report.end} · {metric}
        </div>
        <button onClick={open} className={`mt-auto flex items-center justify-center gap-1.5 ${CARD_BTN_PRIMARY}`}>
          <BarChart3 className="h-4 w-4" />
          리포트
        </button>
      </div>
    </div>
  );
};
