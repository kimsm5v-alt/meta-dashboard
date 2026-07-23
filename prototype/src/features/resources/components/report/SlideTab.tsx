/**
 * 슬라이드별 보기 (목업 renderRdSlides + slideDetailHTML). ★기획서 7장 SlideTab
 * 조건분기(부록B-P5):
 *  - participation===0 → 빈상태
 *  - 문항형 → 선택지 분포 막대 + 정답률(정답 초록)
 *  - 활동형 → 서술 답안 기본 숨김 → "응답 내용 보기" 펼침
 */
import { useState } from 'react';
import {
  slideSet,
  slideResponded,
  slideDist,
  slideSamples,
  slideAccuracy,
  participation,
} from '../../utils/aggregation';
import { useResources } from '../../store/ResourcesContext';
import type { Report } from '../../types';

/** 우측 상세 — key={rdSlide} 로 마운트되어 펼침 상태가 슬라이드 전환 시 초기화 */
const SlideDetail = ({ report, i }: { report: Report; i: number }) => {
  const { toast } = useResources();
  const [reveal, setReveal] = useState(false);
  const s = slideSet(report)[i];
  const resp = slideResponded(report, i);
  const w = Math.round((resp / Math.max(1, report.total)) * 100);

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-gray-100 text-xs font-bold text-gray-600">S{i + 1}</span>
          <b className="text-sm font-bold text-gray-900">{s.t}</b>
          {s.k === '문항형' ? (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">문항</span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">서술</span>
          )}
        </div>
        <div className="flex flex-none gap-1.5">
          <button onClick={() => toast(`🖼 S${i + 1} "${s.t}" 응답 캡처 이미지 (목업)`)} className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50">🖼 캡처</button>
          <button onClick={() => toast(`▶ S${i + 1} "${s.t}" 활동 과정 다시보기 (목업)`)} className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50">▶ 활동</button>
        </div>
      </div>

      <div className="mt-3 text-xs font-semibold text-gray-500">응답 <b className="text-gray-900">{resp}</b>/{report.total}명</div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-primary-500" style={{ width: `${w}%` }} />
      </div>

      {s.k === '문항형' ? (
        <QuestionDist report={report} i={i} />
      ) : (
        <div className="mt-4">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <span className="text-xs font-semibold text-gray-500">🔒 서술형 답안은 개인정보 보호를 위해 기본 숨김</span>
            <button onClick={() => setReveal((v) => !v)} className="text-xs font-bold text-primary-600 hover:underline">
              {reveal ? '응답 숨기기 ▴' : '응답 내용 보기 ▾'}
            </button>
          </div>
          {reveal && <OpenAnswers report={report} i={i} resp={resp} />}
        </div>
      )}
    </div>
  );
};

const QuestionDist = ({ report, i }: { report: Report; i: number }) => {
  const s = slideSet(report)[i];
  if (s.k !== '문항형') return null;
  const d = slideDist(report, i);
  const ans = Math.max(1, d.answered);
  return (
    <div className="mt-4">
      <div className="flex flex-col gap-2">
        {s.options.map((op, oi) => {
          const c = d.counts[oi];
          const pctc = Math.round((c / ans) * 100);
          const isC = oi === s.correct;
          return (
            <div key={oi} className="grid grid-cols-[1fr_auto] items-center gap-2">
              <div className="text-xs font-medium text-gray-700">
                {isC && <span className="mr-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-600">정답</span>}
                {op}
              </div>
              <div className="text-xs font-semibold tabular-nums text-gray-500">{pctc}%</div>
              <div className="col-span-2 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full" style={{ width: `${pctc}%`, background: isC ? '#10b981' : '#7c3aed' }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-xs font-semibold text-gray-600">이 문항 정답률 <b className="text-emerald-600">{slideAccuracy(report, i)}%</b></div>
    </div>
  );
};

const OpenAnswers = ({ report, i, resp }: { report: Report; i: number; resp: number }) => {
  const rows = slideSamples(report, i, 10);
  const more = Math.max(0, resp - rows.length);
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {rows.map((x, k) => (
        <div key={k} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
          <span className="w-16 flex-none font-semibold text-gray-500">{x.s}</span>
          <span className="text-gray-800">{x.v}</span>
        </div>
      ))}
      {more > 0 && (
        <div className="px-1 text-xs text-gray-500">외 {more}명 · 개별 답안은 <b>학생별 보기</b>에서 확인</div>
      )}
    </div>
  );
};

export const SlideTab = ({ report }: { report: Report }) => {
  const { rdSlide, selectSlide } = useResources();

  if (participation(report) === 0) {
    return (
      <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
        <div className="text-3xl">🕒</div>
        <div className="mt-2 text-sm font-medium text-gray-500">아직 제출된 응답이 없습니다. (진행 예정)</div>
      </div>
    );
  }

  const set = slideSet(report);
  const cur = rdSlide >= set.length ? 0 : rdSlide;

  return (
    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[300px_1fr]">
      <div className="flex flex-col gap-1.5 rounded-xl border border-gray-100 bg-white p-2">
        <div className="px-2 py-1.5 text-xs font-bold text-gray-500">슬라이드 <span className="font-semibold text-gray-400">({set.length})</span></div>
        {set.map((s, i) => {
          const resp = slideResponded(report, i);
          const on = i === cur;
          return (
            <button
              key={i}
              onClick={() => selectSlide(i)}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${on ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
            >
              <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg text-xs font-bold ${on ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}>S{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-gray-800">{s.t}</span>
                <span className="block text-xs text-gray-500">{s.k === '문항형' ? '문항' : '서술'} · 응답 {resp}/{report.total}</span>
              </span>
            </button>
          );
        })}
      </div>
      <SlideDetail key={cur} report={report} i={cur} />
    </div>
  );
};
