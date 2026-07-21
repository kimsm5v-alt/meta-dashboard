/**
 * 학생별 보기 (목업 renderRdStudents). ★기획서 7장 StudentTab
 * 조건분기(부록B-P5):
 *  - participation===0 → 빈상태
 *  - 학생 리스트 점: 제출(초록)/미제출(빨강)
 *  - 타임라인: 제출 여부 + respBadge(미제출/정답/오답/제출) + 문항형 정답 색
 *  - graded 있을 때만 정답률 타일
 */
import { STUDENTS } from '../../mock-data';
import { submitters, studentStats, hasGraded, slideSet, participation } from '../../utils/aggregation';
import { fmtTime } from '../../utils/format';
import { useResources } from '../../store/ResourcesContext';
import type { Report, SlideKind, SlideResponse } from '../../types';

/** 응답 배지 (목업 respBadge) */
const RespTag = ({ rr, k }: { rr: SlideResponse; k: SlideKind }) => {
  if (!rr.submitted) return <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-bold text-gray-500">미제출</span>;
  if (k === '문항형')
    return rr.correct
      ? <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-600">정답</span>
      : <span className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-bold text-red-600">오답</span>;
  return <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-bold text-blue-600">제출</span>;
};

export const StudentTab = ({ report }: { report: Report }) => {
  const { rdStu, selectStudent, toast } = useResources();

  if (participation(report) === 0) {
    return (
      <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
        <div className="text-3xl">🕒</div>
        <div className="mt-2 text-sm font-medium text-gray-500">아직 참여한 학생이 없습니다. (진행 예정)</div>
      </div>
    );
  }

  const all = STUDENTS[report.cls] || [];
  const sub = submitters(report);
  const cur = rdStu && all.includes(rdStu) ? rdStu : sub[0] || all[0];

  const set = slideSet(report);
  const st = studentStats(report, cur);
  const graded = hasGraded(report);

  const tiles: { lbl: string; val: string }[] = [
    { lbl: '응답 슬라이드', val: `${st.answered}/${st.total}` },
    { lbl: '활동 시간', val: fmtTime(st.timeSec) },
  ];
  if (graded) tiles.push({ lbl: '정답률', val: `${st.gradedTotal ? Math.round((st.correctN / st.gradedTotal) * 100) : 0}%` });

  return (
    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[240px_1fr]">
      {/* 학생 리스트 */}
      <div className="flex flex-col gap-1 rounded-xl border border-gray-100 bg-white p-2">
        <div className="px-2 py-1.5 text-xs font-bold text-gray-500">참여 학생 <span className="font-semibold text-gray-400">({sub.length}/{all.length})</span></div>
        {all.map((s) => {
          const joined = sub.includes(s);
          const on = s === cur;
          return (
            <button
              key={s}
              onClick={() => selectStudent(s)}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${on ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
            >
              <span className={`h-2 w-2 flex-none rounded-full ${joined ? 'bg-emerald-500' : 'bg-red-400'}`} />
              <span className="flex-1 text-sm font-semibold text-gray-800">{s}</span>
              <span className="text-xs text-gray-400">{joined ? '제출' : '미제출'}</span>
            </button>
          );
        })}
      </div>

      {/* 학생 상세 */}
      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <div className="mb-3 text-base font-extrabold text-gray-900">
          🧑 {cur} <span className="text-xs font-semibold text-gray-500">· {sub.includes(cur) ? '제출 완료' : '미제출'}</span>
        </div>
        <div className="mb-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0,1fr))` }}>
          {tiles.map((t) => (
            <div key={t.lbl} className="rounded-xl bg-gray-50 p-3">
              <div className="text-xs font-semibold text-gray-500">{t.lbl}</div>
              <div className="mt-0.5 text-lg font-extrabold text-gray-900">{t.val}</div>
            </div>
          ))}
        </div>

        <div className="mb-2 text-sm font-bold text-gray-700">슬라이드별 응답</div>
        <div className="flex flex-col gap-2">
          {set.map((s, i) => {
            const rr = st.resps[i];
            const valColor = rr.submitted ? (s.k === '문항형' ? (rr.correct ? 'text-emerald-600' : 'text-red-600') : 'text-gray-800') : 'text-gray-400';
            return (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2">
                <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold text-white ${rr.submitted ? 'bg-emerald-500' : 'bg-red-400'}`}>
                  {rr.submitted ? '✓' : '!'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-gray-500">S{i + 1} · {s.t}{rr.submitted ? ` · ${fmtTime(rr.timeSec)}` : ''}</div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-semibold ${valColor}`}>{rr.submitted ? rr.value : '미응답'}</span>
                    <RespTag rr={rr} k={s.k} />
                  </div>
                </div>
                <div className="flex flex-none gap-1">
                  <button onClick={() => toast(`🖼 ${cur} S${i + 1} 응답 캡처 (목업)`)} className="rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-50">🖼</button>
                  <button onClick={() => toast(`▶ ${cur} S${i + 1} 활동 다시보기 (목업)`)} className="rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-50">▶</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
