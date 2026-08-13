/**
 * 실시간 수업 진행 오버레이 (목업 fsClass + renderClsSlide/clsMove/도구/종료).
 * ★부록A #8: 대상 반 = liveClassName (scope 반, 전체면 기본 2-3반).
 *
 * 수업 도구: 필기(AnnotationCanvas) · 타이머/스톱워치(LiveWidget, 동시 사용 가능)
 * 모니터링은 학생별 민감 정보라 **별도 창**으로 띄운다 (차단 시 사이드 패널 폴백).
 */
import { useEffect, useRef, useState } from 'react';
import { Monitor, Square } from 'lucide-react';
import { CLASSES, MY, LESSON_DECKS } from '../../mock-data';
import { findContent } from '../../utils/format';
import { useResources } from '../../store/ResourcesContext';
import { LiveClock } from './LiveClock';
import { LiveWidget } from './LiveWidget';
import { MonitorPanel } from './MonitorPanel';
import { MonitorContent } from './MonitorContent';
import { PopoutWindow } from './PopoutWindow';
import { useMonitorWindow } from './useMonitorWindow';
import { AnnotationCanvas } from './AnnotationCanvas';
import { PenToolbar } from './PenToolbar';
import { useSlideAnnotations } from './useSlideAnnotations';
import { PEN_COLORS, colorsFor, type ToolId } from './annotationTypes';

/** 실제 콘텐츠 덱이 없는 경우의 더미 슬라이드 수 */
const FALLBACK_SLIDE_COUNT = 4;

/** 슬라이드 내용: 실제 콘텐츠면 페이지 이미지, 아니면 목업(1=제목, 그 외=문항) */
const SlideStage = ({ n, title, page }: { n: number; title: string; page?: string }) => {
  if (page) {
    return <img src={page} alt={`${title} ${n}페이지`} draggable={false} className="h-full w-full object-contain" />;
  }
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

  // 실제 콘텐츠(PDF 활동지)면 그 페이지를 그대로 넘겨 보여준다.
  const deck = (contentId ? LESSON_DECKS[contentId] : undefined) ?? [];
  const slideCount = deck.length || FALLBACK_SLIDE_COUNT;

  const [slide, setSlide] = useState(1);
  const [endAsk, setEndAsk] = useState(false);
  const [notes, setNotes] = useState('');

  // 필기
  const [tool, setTool] = useState<ToolId | null>(null);
  const [color, setColor] = useState(PEN_COLORS[0]);
  const { strokesFor, addStroke, undo, clearSlide } = useSlideAnnotations();
  const strokes = strokesFor(slide);

  const pickTool = (t: ToolId | null) => {
    setTool(t);
    if (t) setColor((c) => (colorsFor(t).includes(c) ? c : colorsFor(t)[0]));
  };

  // 위젯 — 각각 독립 인스턴스라 하나를 켜도 다른 하나가 리셋되지 않는다
  const [timerOpen, setTimerOpen] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);
  const [zTop, setZTop] = useState(130);
  const [timerZ, setTimerZ] = useState(130);
  const [stopZ, setStopZ] = useState(131);
  const focusWidget = (set: (z: number) => void) => {
    const next = zTop + 1;
    setZTop(next);
    set(next);
  };

  // 모니터링 팝업 (차단되면 사이드 패널)
  const [panelFallback, setPanelFallback] = useState(false);
  const { win: monitorWin, open: openMonitor, close: closeMonitor } = useMonitorWindow(() => {
    toast('팝업이 차단되어 사이드 패널로 표시합니다');
    setPanelFallback(true);
  });
  const monitorOn = !!monitorWin || panelFallback;
  const toggleMonitor = () => {
    if (panelFallback) { setPanelFallback(false); return; }
    if (monitorWin) { closeMonitor(); return; }
    openMonitor();
  };

  const move = (d: number) => setSlide((s) => Math.min(slideCount, Math.max(1, s + d)));
  const moveRef = useRef(move);
  moveRef.current = move;

  // 키보드 / 프리젠터 리모컨
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { moveRef.current(1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { moveRef.current(-1); e.preventDefault(); }
      else if (e.key === 'Escape') { setEndAsk((a) => (a ? false : a)); setTool(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const endClass = () => {
    closeMonitor();
    closeOverlay();
    setTab('results');
    toast('수업 종료 · 결과가 리포트에 반영되었습니다');
  };

  const monitorBody = (
    <MonitorContent className={className} classSlide={slide} notes={notes} onNotesChange={setNotes} />
  );

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-gray-950">
      {/* 상단 바 */}
      <div className="flex flex-none items-center gap-3 border-b border-gray-800 bg-gray-900 px-4 py-2.5 text-white">
        <span className="rounded bg-red-500 px-2 py-0.5 text-xs font-bold">LIVE</span>
        <span className="font-bold">{title}</span>
        <span className="text-sm text-gray-400"><b className="text-white">{slide}</b> / {slideCount} 페이지</span>
        <LiveClock />
        <span className="ml-auto flex gap-2">
          <button
            onClick={toggleMonitor}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${monitorOn ? 'bg-primary-500 text-white' : 'bg-white/10 text-gray-200 hover:bg-white/20'}`}
          >
            <Monitor className="h-4 w-4" />
            모니터링
          </button>
          <button onClick={() => setEndAsk(true)} className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-600">
            <Square className="h-3.5 w-3.5 fill-current" />
            수업 종료하기
          </button>
        </span>
      </div>

      {/* 본문 */}
      <div className="flex min-h-0 flex-1">
        <div className="relative flex min-w-0 flex-1 flex-col items-center">
          {/* 수업 도구 */}
          <div className="mt-4 flex items-center gap-1.5 rounded-full bg-gray-900/80 px-3 py-1.5 text-sm text-gray-200">
            <PenToolbar
              tool={tool}
              onTool={pickTool}
              color={color}
              onColor={setColor}
              canUndo={strokes.length > 0}
              onUndo={() => undo(slide)}
              onClear={() => clearSlide(slide)}
            />
            <span className="mx-1 h-4 w-px bg-gray-700" />
            <button onClick={() => setTimerOpen((o) => !o)} className={`rounded-lg px-2.5 py-1 font-semibold ${timerOpen ? 'bg-primary-500 text-white' : 'hover:bg-white/10'}`}>⏱️ 타이머</button>
            <button onClick={() => setStopOpen((o) => !o)} className={`rounded-lg px-2.5 py-1 font-semibold ${stopOpen ? 'bg-primary-500 text-white' : 'hover:bg-white/10'}`}>⏲️ 스톱워치</button>
          </div>

          {/* 슬라이드 무대 — aspect-video 고정은 필기 좌표계(정규화)의 전제다 */}
          <div className="flex w-full flex-1 items-center justify-center p-8">
            <div
              className={`relative flex aspect-video w-full max-w-4xl items-center justify-center overflow-hidden rounded-2xl ${
                deck.length ? 'bg-black' : 'bg-gradient-to-br from-primary-700 to-primary-500 p-10'
              }`}
            >
              <SlideStage n={slide} title={title} page={deck[slide - 1]} />
              <AnnotationCanvas strokes={strokes} slide={slide} tool={tool} color={color} onCommit={addStroke} />
            </div>
          </div>
        </div>

        {panelFallback && (
          <MonitorPanel className={className} classSlide={slide} notes={notes} onNotesChange={setNotes} />
        )}
      </div>

      {/* 하단: 페이지 네비 + 썸네일 */}
      <div className="flex flex-none items-center gap-3 border-t border-gray-800 bg-gray-900 px-4 py-3">
        <button onClick={() => move(-1)} className="rounded-lg bg-white/10 px-3 py-2 text-white hover:bg-white/20" aria-label="이전">‹</button>
        <div className="flex flex-1 gap-2 overflow-x-auto">
          {Array.from({ length: slideCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setSlide(n)}
              className={`flex flex-none items-center gap-1.5 rounded-lg p-1 text-xs font-semibold ${n === slide ? 'bg-primary-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
            >
              {deck[n - 1] ? (
                <img src={deck[n - 1]} alt="" className="h-10 w-[71px] rounded object-cover" />
              ) : (
                <span className="flex h-4 w-4 items-center justify-center rounded bg-black/20">{n}</span>
              )}
              <span className="pr-2">{n}</span>
            </button>
          ))}
        </div>
        <button onClick={() => move(1)} className="rounded-lg bg-white/10 px-3 py-2 text-white hover:bg-white/20" aria-label="다음">›</button>
      </div>

      {/* 위젯 — 오버레이 바깥에 fixed 로 뜬다 */}
      {timerOpen && (
        <LiveWidget
          mode="timer"
          z={timerZ}
          onFocus={() => focusWidget(setTimerZ)}
          initialPos={() => ({ x: Math.max(8, window.innerWidth - 220), y: Math.max(8, window.innerHeight - 260) })}
          onClose={() => setTimerOpen(false)}
        />
      )}
      {stopOpen && (
        <LiveWidget
          mode="stop"
          z={stopZ}
          onFocus={() => focusWidget(setStopZ)}
          initialPos={() => ({ x: Math.max(8, window.innerWidth - 220), y: Math.max(8, window.innerHeight - 460) })}
          onClose={() => setStopOpen(false)}
        />
      )}

      {/* 모니터링 팝업 */}
      {monitorWin && (
        <PopoutWindow win={monitorWin} title={`모니터링 · ${className}`} bodyClassName="h-full bg-gray-900 text-gray-100">
          <div className="flex h-full flex-col gap-3 p-4">
            <div className="text-sm font-bold text-gray-200">
              {className} · <span className="text-gray-400">{slide} / {slideCount} 페이지</span>
            </div>
            {monitorBody}
          </div>
        </PopoutWindow>
      )}

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
