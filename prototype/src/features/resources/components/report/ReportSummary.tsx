/**
 * 리포트 상세 상단.
 * 좌측 절반 = 콘텐츠 활동 요약(썸네일·상태·제목·배포 기간·SEL 역량),
 * 우측 절반 = 핵심 지표 2종(참여 인원 · 평균 정답률)만.
 * 참여수는 목록 카드와 같은 participantCount(report) 를 쓴다 → 카드 = 상세 일치.
 */
import { Calendar } from 'lucide-react';
import { GROUP_BG } from '../../mock-data';
import { participantCount, assignedCount, avgCorrectRate, articlesOf } from '../../utils/aggregation';
import { fmtDate, pct } from '../../utils/format';
import type { Report } from '../../types';
import { RsBadge, ClassBadge } from './badges';

export const ReportSummary = ({ report }: { report: Report }) => {
  const p = participantCount(report);
  const assigned = assignedCount(report);
  const acc = avgCorrectRate(report); // 정답 있는 문항 없으면 null
  const pageCount = articlesOf(report).length;

  return (
    <div className="grid grid-cols-1 items-stretch gap-4 rounded-2xl border border-gray-200 bg-white p-5 md:grid-cols-2">
      {/* 좌: 콘텐츠 활동 요약 — 썸네일이 카드 높이를 꽉 채운다 */}
      <div className="flex items-stretch gap-4">
        <div
          className="min-h-[132px] w-56 flex-none self-stretch overflow-hidden rounded-xl"
          style={{ background: GROUP_BG[report.g] }}
        >
          {report.thumb && (
            <img src={report.thumb} alt={report.title} className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <RsBadge status={report.rstatus} />
            <ClassBadge cls={report.cls} />
          </div>
          <div className="text-lg font-extrabold tracking-tight text-gray-900">{report.title}</div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5 flex-none text-gray-400" />
            배포 {fmtDate(report.start)} ~ {fmtDate(report.end)} · {pageCount}개 페이지
          </div>
          {report.selFactors && report.selFactors.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {report.selFactors.map((f) => (
                <span key={f} className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 우: 핵심 지표 2종 — 한 패널 안에서 연한 세로선으로만 구분 */}
      <div className="grid grid-cols-2 divide-x divide-gray-200 self-stretch rounded-xl bg-gray-50">
        <div className="flex flex-col justify-center px-5 py-4">
          <div className="text-xs font-semibold text-gray-500">참여 인원</div>
          <div className="mt-1 text-2xl font-extrabold text-gray-900">
            {p}
            <small className="ml-0.5 text-sm font-semibold text-gray-500">
              /{assigned}명 · {pct(p, assigned)}%
            </small>
          </div>
        </div>
        <div className="flex flex-col justify-center px-5 py-4">
          <div className="text-xs font-semibold text-gray-500">평균 정답률</div>
          <div className="mt-1 text-2xl font-extrabold text-gray-900">
            {acc == null ? (
              <span className="text-gray-400">–</span>
            ) : (
              <>
                {acc}
                <small className="ml-0.5 text-sm font-semibold text-gray-500">%</small>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
