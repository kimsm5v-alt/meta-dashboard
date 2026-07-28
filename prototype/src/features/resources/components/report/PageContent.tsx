/**
 * 페이지별 보기 우측 (R8 통일) — 페이지 정보 + 요약 strip + 학생별 통일 카드 목록.
 * 성격(개념/문항/활동) 무관 동일 카드 골격 사용(해당 없는 슬롯 비활성).
 */
import { articlesOf, studentsOf, responseOf } from '../../utils/aggregation';
import { useResources } from '../../store/ResourcesContext';
import type { Report } from '../../types';
import { NatureBadge } from './badges';
import { SummaryStrip } from './detail/SummaryStrip';
import { UnifiedResponseCard } from './detail/UnifiedResponseCard';
import { responseCell } from './detail/shared';

export const PageContent = ({ report }: { report: Report }) => {
  const { rdSlide, toast } = useResources();
  const arts = articlesOf(report);
  const cur = rdSlide >= arts.length ? 0 : rdSlide;
  const a = arts[cur];
  if (!a) return null;

  const students = studentsOf(report);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-5">
      {/* 페이지 정보 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-gray-100 text-xs font-bold text-gray-600">
          {a.order}
        </span>
        <b className="text-sm font-bold text-gray-900">{a.title}</b>
        <NatureBadge nature={a.nature} />
        {a.selFactor && (
          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">{a.selFactor}</span>
        )}
      </div>

      {/* 성격별 집계 요약 */}
      <SummaryStrip report={report} article={a} />

      {/* 학생별 통일 카드 */}
      <div>
        <div className="mb-2 text-sm font-bold text-gray-700">
          학생별 응답 <span className="font-semibold text-gray-400">({students.length})</span>
        </div>
        <div className="flex flex-col gap-2">
          {students.map((s) => {
            const resp = responseOf(report, a.id, s.studentId);
            return (
              <UnifiedResponseCard
                key={s.studentId}
                primary={s.studentName}
                nature={a.nature}
                cell={responseCell(a, resp)}
                showNature={false}
                onReplay={() => toast(`${s.studentName} · ${a.title} 캡처 보기 (목업)`)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
