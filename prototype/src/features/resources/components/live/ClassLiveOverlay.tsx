/**
 * 실시간 수업 진행 오버레이 (목업 fsClass + renderClsSlide/clsMove/도구/종료).
 * ★부록A #8: 대상 반 = liveClassName (scope 반, 전체면 기본 2-3반).
 */
import { useState } from 'react';
import { CLASSES, MY } from '../../mock-data';
import { findContent } from '../../utils/format';
import { useResources } from '../../store/ResourcesContext';
import { LiveClock } from './LiveClock';
import { LiveWidget } from './LiveWidget';
import { MonitorPanel } from './MonitorPanel';

const SLIDE_COUNT = 4;

/** 슬라이드 내용 (목업 slideContentHTML): 1=제목, 그 외=문항 */
const SlideStage = ({ n, title }: { n: number; title: string }) => {
  if (n === 1) {
    return (
      <div className="text-center text-white">
        <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">SEL 활동</span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-3 text-white/70">함께 감정을 나누고 생각해봐요 · 정답은 없어요</p>
      </div>
    );
  }
  const opts = ['😊 기쁨', '😌 편안', '😟 걱정', '😴 피곤'];
  return (
    <div className="text-center text-white">
      <div className="text-sm font-semibold text-white/60">문항 {n - 1}</div>
      <h2 className="mt-2 text-3xl font-bold">오늘 나의 감정에 가장 가까운 것은?</h2>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {opts.map((o) => (
          <span key={o} className="rounded-xl bg-white/15 px-5 py-3 text-lg font-semibold">{o}</span>
        ))}
      </div>
    </div>
  );
};

export const ClassLiveOverlay = () => {
  const { overlay, closeOverlay, toast, setTab, scope } = useResources();
  const contentId = overlay?.contentId ?? null;
  const item = contentId ? MY.find((x) => x.id === contentId) || findContent(contentId) : null;
  const title = item?.title ?? '수업';
  const className = CLASSES.includes(scope) ? scope : '2-3반'; // #8

  const [slide, setSlide] = useState(1);
  const [monitorOpen, setMonitorOpen] = useState(false);
  const [penOpen, setPenOpen] = useState(false);
  const [widget, setWidget] = useState<'timer' | 'stop' | null>(null);
  const [endAsk, setEndAsk] = useState(false);

  const move = (d: number) => setSlide((s) => Math.min(SLIDE_COUNT, Math.max(1, s + d)));

  const endClass = () => {
    closeOverlay();
    setTab('results');
    toast('수업 종료 · 결과가 리포트에 반영되었습니다');
  };

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-gray-950">
      {/* 상단 바 */}
      <div className="flex flex-none items-center gap-3 border-b border-gray-800 bg-gray-900 px-4 py-2.5 text-white">
        <span className="rounded bg-red-500 px-2 py-0.5 text-xs font-bold">LIVE</span>
        <span className="font-bold">{title}</span>
        <span className="text-sm text-gray-400"><b className="text-white">{slide}</b> / {SLIDE_COUNT} 페이지</span>
        <LiveClock />
        <span className="ml-auto flex gap-2">
          <button
            onClick={() => setMonitorOpen((o) => !o)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${monitorOpen ? 'bg-primary-500 text-white' : 'bg-white/10 text-gray-200 hover:bg-white/20'}`}
          >
            🖥 모니터링
          </button>
          <button onClick={() => setEndAsk(true)} className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-600">■ 수업 종료하기</button>
        </span>
      </div>

      {/* 본문 */}
      <div className="flex min-h-0 flex-1">
        <div className="relative flex min-w-0 flex-1 flex-col items-center">
          {/* 수업 도구 */}
          <div className="mt-4 flex items-center gap-2 rounded-full bg-gray-900/80 px-3 py-1.5 text-sm text-gray-200">
            <button onClick={() => setPenOpen((o) => !o)} className={`rounded-lg px-2.5 py-1 font-semibold ${penOpen ? 'bg-primary-500 text-white' : 'hover:bg-white/10'}`}>🖊️ 펜툴</button>
            {penOpen && (
              <span className="flex gap-1">
                {[['펜', '🖊️'], ['형광펜', '🖍️'], ['지우개', '🧽']].map(([label, ic]) => (
                  <button key={label} onClick={() => toast(`${label} 선택 · 슬라이드에 필기`)} className="rounded px-1.5 py-1 hover:bg-white/10">{ic}</button>
                ))}
                <button onClick={() => toast('텍스트 상자 추가')} className="rounded px-1.5 py-1 hover:bg-white/10">🅃</button>
              </span>
            )}
            <span className="mx-1 h-4 w-px bg-gray-700" />
            <button onClick={() => setWidget('timer')} className={`rounded-lg px-2.5 py-1 font-semibold ${widget === 'timer' ? 'bg-primary-500 text-white' : 'hover:bg-white/10'}`}>⏱️ 타이머</button>
            <button onClick={() => setWidget('stop')} className={`rounded-lg px-2.5 py-1 font-semibold ${widget === 'stop' ? 'bg-primary-500 text-white' : 'hover:bg-white/10'}`}>⏲️ 스톱워치</button>
          </div>

          {/* 슬라이드 무대 */}
          <div className="flex w-full flex-1 items-center justify-center p-8">
            <div className="flex aspect-video w-full max-w-4xl items-center justify-center rounded-2xl bg-gradient-to-br from-primary-700 to-primary-500 p-10">
              <SlideStage n={slide} title={title} />
            </div>
          </div>

          {widget && <LiveWidget mode={widget} onClose={() => setWidget(null)} />}
        </div>

        {monitorOpen && <MonitorPanel className={className} classSlide={slide} notes="" />}
      </div>

      {/* 하단: 페이지 네비 + 썸네일 */}
      <div className="flex flex-none items-center gap-3 border-t border-gray-800 bg-gray-900 px-4 py-3">
        <button onClick={() => move(-1)} className="rounded-lg bg-white/10 px-3 py-2 text-white hover:bg-white/20" aria-label="이전">‹</button>
        <div className="flex flex-1 gap-2 overflow-x-auto">
          {Array.from({ length: SLIDE_COUNT }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setSlide(n)}
              className={`flex flex-none items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${n === slide ? 'bg-primary-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded bg-black/20">{n}</span> 슬라이드 {n}
            </button>
          ))}
        </div>
        <button onClick={() => move(1)} className="rounded-lg bg-white/10 px-3 py-2 text-white hover:bg-white/20" aria-label="다음">›</button>
      </div>

      {/* 종료 확인 */}
      {endAsk && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 p-6">
          <div className="w-[360px] max-w-full rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-extrabold text-gray-900">수업을 종료하시겠습니까?</h3>
            <p className="mt-1 text-sm text-gray-500">종료하면 실시간 수업이 끝나고, 결과가 리포트에 반영됩니다.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEndAsk(false)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">취소</button>
              <button onClick={endClass} className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600">종료하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
