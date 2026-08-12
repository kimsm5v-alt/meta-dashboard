/**
 * 리포트 카드 (목업 renderReportList 카드). 진행예정→"시작 전", 그 외→"참여 p/배정".
 */
import { Calendar, BarChart3 } from 'lucide-react';
import { participantCount, assignedCount, studentsOf } from '../../utils/aggregation';
import { fmtDate } from '../../utils/format';
import { useResources } from '../../store/ResourcesContext';
import type { Report } from '../../types';
import { RsBadge, ClassBadge } from './badges';
import { CardThumb } from '../common/CardThumb';
import { CARD_SHELL, CARD_BTN_PRIMARY } from '../common/cardStyles';

export const ReportCard = ({ report, highlight }: { report: Report; highlight?: boolean }) => {
  const { openReport } = useResources();
  const p = participantCount(report);
  const metric = report.rstatus === '진행예정' ? '시작 전' : `참여 ${p}/${assignedCount(report)}명`;

  const open = () => {
    // 끝까지 제출한 학생을 기본 선택 — 진행중 학생이 걸리면 상세가 '미제출'로만 채워진다
    const ss = studentsOf(report);
    const first = ss.find((s) => s.statusCd === 5 || s.statusCd === 3) ?? ss[0];
    openReport(report.id, first?.studentId ?? null);
  };

  return (
    <div className={`${CARD_SHELL} ${highlight ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}>
      <CardThumb g={report.g} thumb={report.thumb} alt={report.title} />
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="line-clamp-1 text-sm font-bold text-gray-900" title={report.title}>
          {report.title}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <RsBadge status={report.rstatus} />
          <ClassBadge cls={report.cls} />
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="h-3.5 w-3.5 flex-none text-gray-400" />
          {fmtDate(report.start)} ~ {fmtDate(report.end)} · {metric}
        </div>
        <button onClick={open} className={`mt-auto flex items-center justify-center gap-1.5 ${CARD_BTN_PRIMARY}`}>
          <BarChart3 className="h-4 w-4" />
          리포트
        </button>
      </div>
    </div>
  );
};
