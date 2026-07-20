/**
 * 리포트 요약 (목업 renderRdSummary). ★기획서 7장
 * 정합성: 참여수는 카드와 동일한 participation(report) 사용 → 목록 카드 = 상세 요약 일치.
 * 조건부: 문항형(hasGraded) 있을 때만 정답률 타일 + "📝 문항 포함" 배지.
 */
import type { ReactNode } from 'react';
import { GROUP_BG } from '../../mock-data';
import { participation, completeness, avgTime, accuracy, hasGraded, slideSet } from '../../utils/aggregation';
import { fmtTime } from '../../utils/format';
import type { Report } from '../../types';
import { RsBadge, ClassBadge } from './badges';

interface Tile {
  lbl: string;
  val: ReactNode;
  hl?: boolean;
}

export const ReportSummary = ({ report }: { report: Report }) => {
  const p = participation(report); // ← 카드와 동일 소스 (정합성)
  const pct = Math.round((p / Math.max(1, report.total)) * 100);
  const set = slideSet(report);
  const graded = hasGraded(report);
  const acc = graded ? accuracy(report) : null;

  const tiles: Tile[] = [
    { lbl: '참여 / 제출', val: <>{p}<small className="ml-0.5 text-sm font-semibold text-gray-500">/{report.total}명 · {pct}%</small></>, hl: true },
    { lbl: '응답 완성도', val: <>{completeness(report)}<small className="ml-0.5 text-sm font-semibold text-gray-500">%</small></> },
    { lbl: '평균 활동 시간', val: fmtTime(avgTime(report)) },
  ];
  if (graded) tiles.push({ lbl: '정답률', val: <>{acc}<small className="ml-0.5 text-sm font-semibold text-gray-500">%</small></> });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 flex-none items-center justify-center rounded-xl text-3xl" style={{ background: GROUP_BG[report.g] }}>
          {report.em}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <RsBadge status={report.rstatus} />
            <ClassBadge cls={report.cls} />
            {graded ? (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">📝 문항 포함</span>
            ) : (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">🎨 활동 중심</span>
            )}
          </div>
          <div className="text-lg font-extrabold tracking-tight text-gray-900">{report.title}</div>
          <div className="mt-0.5 text-xs text-gray-500">📅 배포 {report.start} ~ {report.end} · {set.length}개 슬라이드</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0,1fr))` }}>
        {tiles.map((t) => (
          <div key={t.lbl} className={`rounded-xl p-4 ${t.hl ? 'bg-primary-50' : 'bg-gray-50'}`}>
            <div className="text-xs font-semibold text-gray-500">{t.lbl}</div>
            <div className="mt-1 text-2xl font-extrabold text-gray-900">{t.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
