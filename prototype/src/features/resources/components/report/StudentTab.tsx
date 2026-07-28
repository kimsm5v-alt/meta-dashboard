/**
 * 학생별 보기 (R8 통일) — 좌 학생 카드 리스트 / 우 학습요약 3카드 + 정오 요약 표 + 통일 카드 목록.
 * 페이지·학생 어디서나 동일한 UnifiedResponseCard 사용(성격 무관, 해당 없는 슬롯 비활성).
 */
import { Clock } from 'lucide-react';
import { studentsOf, articlesOf, responseOf, studentSummary, hasGradedItems, participantCount } from '../../utils/aggregation';
import { fmtTime, pct } from '../../utils/format';
import { useResources } from '../../store/ResourcesContext';
import type { Report, StatusCd } from '../../types';
import { StatusBadge } from './badges';
import { UnifiedResponseCard } from './detail/UnifiedResponseCard';
import { ErrataSummaryTable } from './detail/ErrataSummaryTable';
import { responseCell } from './detail/shared';

const SUBMITTED: StatusCd[] = [3, 4, 5];

export const StudentTab = ({ report }: { report: Report }) => {
  const { rdStu, selectStudent, rdSlide, selectSlide, toast } = useResources();

  if (participantCount(report) === 0) {
    return (
      <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
        <Clock className="mx-auto h-8 w-8 text-gray-300" />
        <div className="mt-2 text-sm font-medium text-gray-500">아직 참여한 학생이 없습니다. (진행 예정)</div>
      </div>
    );
  }

  const students = studentsOf(report);
  const arts = articlesOf(report);
  const firstSubmitted = students.find((s) => SUBMITTED.includes(s.statusCd));
  const curId =
    rdStu && students.some((s) => s.studentId === rdStu)
      ? rdStu
      : firstSubmitted?.studentId ?? students[0]?.studentId ?? '';
  const cur = students.find((s) => s.studentId === curId);

  const sum = studentSummary(report, curId);
  const graded = hasGradedItems(report);
  const submittedCount = students.filter((s) => SUBMITTED.includes(s.statusCd)).length;

  const tiles: { lbl: string; val: string; sub?: string }[] = [
    { lbl: '활동 페이지', val: `${sum.submittedArticles}/${sum.totalArticles} p` },
  ];
  if (graded) tiles.push({ lbl: '정답률 / 맞춘 문제', val: `${pct(sum.correctN, sum.gradedN)}%`, sub: `${sum.correctN}/${sum.gradedN}개` });
  tiles.push({ lbl: '활동 시간 / 제출', val: fmtTime(sum.duration), sub: sum.submittedAt ?? '미제출' });

  return (
    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[240px_1fr]">
      {/* 학생 카드 리스트 */}
      <div className="flex flex-col gap-1 rounded-xl border border-gray-100 bg-white p-2">
        <div className="px-2 py-1.5 text-xs font-bold text-gray-500">
          참여 학생 <span className="font-semibold text-gray-400">({submittedCount}/{students.length})</span>
        </div>
        {students.map((s) => {
          const on = s.studentId === curId;
          return (
            <button
              key={s.studentId}
              onClick={() => selectStudent(s.studentId)}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
                on ? 'bg-primary-50' : 'hover:bg-gray-50'
              }`}
            >
              <span className="flex-1 truncate text-sm font-semibold text-gray-800">{s.studentName}</span>
              <StatusBadge statusCd={s.statusCd} />
            </button>
          );
        })}
      </div>

      {/* 학생 상세 */}
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-base font-extrabold text-gray-900">
            {cur?.studentName}
            {cur && <StatusBadge statusCd={cur.statusCd} />}
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0,1fr))` }}>
            {tiles.map((t) => (
              <div key={t.lbl} className="rounded-xl bg-gray-50 p-3">
                <div className="text-xs font-semibold text-gray-500">{t.lbl}</div>
                <div className="mt-0.5 text-lg font-extrabold text-gray-900">{t.val}</div>
                {t.sub && <div className="text-xs text-gray-500">{t.sub}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* 정오 요약 표 */}
        <ErrataSummaryTable report={report} studentId={curId} selectedIndex={rdSlide} onSelect={selectSlide} />

        {/* 상세보기 (페이지별 통일 카드) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="mb-2 text-sm font-bold text-gray-700">페이지별 상세</div>
          <div className="flex flex-col gap-2">
            {arts.map((a, i) => {
              const resp = responseOf(report, a.id, curId);
              return (
                <UnifiedResponseCard
                  key={a.id}
                  primary={`${a.order}. ${a.title}`}
                  nature={a.nature}
                  cell={responseCell(a, resp)}
                  highlight={i === rdSlide}
                  onReplay={() => toast(`${cur?.studentName} · ${a.title} 캡처 보기 (목업)`)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
