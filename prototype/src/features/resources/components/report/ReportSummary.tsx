/**
 * 리포트 요약 (REPORT_SPEC_v2 화면2 상단).
 * 활동 정보 + SEL 역량 배지 + 요약 카드 4종(참여 인원 · 평균 정답률 · 제출률 · 평균 활동 시간).
 * 정합성: 참여수는 카드와 동일한 participantCount(report) 사용 → 목록 카드 = 상세 요약 일치.
 */
import type { ReactNode } from 'react';
import { Calendar } from 'lucide-react';
import { GROUP_BG } from '../../mock-data';
import {
  participantCount,
  assignedCount,
  submitRate,
  avgCorrectRate,
  avgDurationSec,
  articlesOf,
} from '../../utils/aggregation';
import { fmtTime, pct } from '../../utils/format';
import type { Report } from '../../types';
import { RsBadge, ClassBadge } from './badges';

interface Tile {
  lbl: string;
  val: ReactNode;
  hl?: boolean;
}

export const ReportSummary = ({ report }: { report: Report }) => {
  const p = participantCount(report); // ← 카드와 동일 소스 (정합성)
  const assigned = assignedCount(report);
  const acc = avgCorrectRate(report); // 정답 있는 문항 없으면 null
  const pageCount = articlesOf(report).length;

  const tiles: Tile[] = [
    {
      lbl: '참여 인원',
      val: (
        <>
          {p}
          <small className="ml-0.5 text-sm font-semibold text-gray-500">
            /{assigned}명 · {pct(p, assigned)}%
          </small>
        </>
      ),
      hl: true,
    },
    {
      lbl: '평균 정답률',
      val:
        acc == null ? (
          <span className="text-gray-400">–</span>
        ) : (
          <>
            {acc}
            <small className="ml-0.5 text-sm font-semibold text-gray-500">%</small>
          </>
        ),
    },
    {
      lbl: '제출률',
      val: (
        <>
          {submitRate(report)}
          <small className="ml-0.5 text-sm font-semibold text-gray-500">%</small>
        </>
      ),
    },
    { lbl: '평균 활동 시간', val: fmtTime(avgDurationSec(report)) },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 flex-none items-center justify-center rounded-xl text-3xl"
          style={{ background: GROUP_BG[report.g] }}
        >
          {report.em}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <RsBadge status={report.rstatus} />
            <ClassBadge cls={report.cls} />
            {report.activityMode && (
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
                {report.activityMode}
              </span>
            )}
          </div>
          <div className="text-lg font-extrabold tracking-tight text-gray-900">{report.title}</div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5 flex-none text-gray-400" />
            배포 {report.start} ~ {report.end} · {pageCount}개 페이지
          </div>
        </div>
      </div>

      {/* SEL 역량 배지 */}
      {report.selFactors && report.selFactors.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-500">SEL 역량</span>
          {report.selFactors.map((f) => (
            <span key={f} className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
              {f}
            </span>
          ))}
        </div>
      )}

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
