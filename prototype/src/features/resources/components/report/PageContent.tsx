/**
 * 페이지별 보기 우측 — 페이지 정보 + 제출/채점 요약 + 학생별 응답 격자.
 * 성격·유형 구분 없이 ResponseGrid 하나로 그린다(캡처가 곧 응답). 타일을 누르면 캡처 뷰어.
 */
import { articlesOf, studentsOf, responseOf } from '../../utils/aggregation';
import { useResources, gradeKey } from '../../store/ResourcesContext';
import type { Report } from '../../types';
import { NatureBadge } from './badges';
import { SummaryStrip } from './detail/SummaryStrip';
import { ResponseGrid, type GridItem } from './detail/ResponseGrid';
import { responseCell, renderMode } from './detail/shared';

export const PageContent = ({ report }: { report: Report }) => {
  const { rdSlide, grades, openCapture } = useResources();
  const arts = articlesOf(report);
  const cur = rdSlide >= arts.length ? 0 : rdSlide;
  const a = arts[cur];
  if (!a) return null;

  const mode = renderMode(a);
  const items: GridItem[] = studentsOf(report).map((s) => {
    const resp = responseOf(report, a.id, s.studentId);
    return {
      key: s.studentId,
      primary: `${s.no}. ${s.studentName}`,
      nature: a.nature,
      mode,
      cell: responseCell(a, resp, grades[gradeKey(a.id, s.studentId)]),
      capture: resp?.captureImage,
      showNature: false,
      onOpen: () => openCapture(a.id, s.studentId, 'student'),
    };
  });

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

      <SummaryStrip report={report} article={a} />

      <div>
        <div className="mb-2 text-sm font-bold text-gray-700">
          학생별 응답 <span className="font-semibold text-gray-400">({items.length})</span>
        </div>
        <ResponseGrid items={items} />
      </div>
    </div>
  );
};
