/**
 * 수업 위젯: 타이머(카운트다운) / 스톱워치.
 * 타이머·스톱워치는 각각 독립 인스턴스로 렌더된다 — 하나를 켜도 다른 하나가 리셋되지 않는다.
 * 헤더를 잡고 드래그해 옮길 수 있고, 타이머는 종료 시각(endAt) 기준으로 계산해
 * 탭이 백그라운드로 가도 시간이 밀리지 않는다.
 */
import { useEffect, useRef, useState } from 'react';
import { GripHorizontal, Pause, Play, RotateCcw, X } from 'lucide-react';
import { useResources } from '../../store/ResourcesContext';
import { useDraggable, type Pos } from './useDraggable';

const pad = (n: number) => String(n).padStart(2, '0');
/** 타이머 프리셋 (분) */
const PRESETS = [1, 3, 5, 10];
const DEFAULT_TIMER_SEC = 300;

interface LiveWidgetProps {
  mode: 'timer' | 'stop';
  initialPos: () => Pos;
  z: number;
  onFocus: () => void;
  onClose: () => void;
}

export const LiveWidget = ({ mode, initialPos, z, onFocus, onClose }: LiveWidgetProps) => {
  const { toast } = useResources();
  const { pos, elRef, handleProps } = useDraggable(initialPos);

  const [sec, setSec] = useState(mode === 'timer' ? DEFAULT_TIMER_SEC : 0);
  const [run, setRun] = useState(false);
  const [ended, setEnded] = useState(false);
  /** 실행 기준 시각: 타이머=종료 시각, 스톱워치=시작 시각 */
  const anchorRef = useRef(0);

  useEffect(() => {
    if (!run) return;
    const id = setInterval(() => {
      if (mode === 'timer') {
        const left = Math.max(0, Math.ceil((anchorRef.current - Date.now()) / 1000));
        setSec(left);
        if (left === 0) {
          setRun(false);
          setEnded(true);
          toast('타이머 종료');
        }
      } else {
        setSec(Math.floor((Date.now() - anchorRef.current) / 1000));
      }
    }, 250);
    return () => clearInterval(id);
  }, [run, mode, toast]);

  // 종료 강조는 잠깐만
  useEffect(() => {
    if (!ended) return;
    const id = setTimeout(() => setEnded(false), 6000);
    return () => clearTimeout(id);
  }, [ended]);

  const toggleRun = () => {
    if (run) {
      setRun(false);
      return;
    }
    if (mode === 'timer') {
      if (sec <= 0) return;
      anchorRef.current = Date.now() + sec * 1000;
    } else {
      anchorRef.current = Date.now() - sec * 1000;
    }
    setEnded(false);
    setRun(true);
  };

  const reset = () => {
    setRun(false);
    setEnded(false);
    setSec(mode === 'timer' ? DEFAULT_TIMER_SEC : 0);
  };

  const setPreset = (min: number) => {
    setRun(false);
    setEnded(false);
    setSec(min * 60);
  };

  const label = mode === 'timer' ? '타이머' : '스톱워치';

  return (
    <div
      ref={elRef}
      onPointerDown={onFocus}
      style={{ left: pos.x, top: pos.y, zIndex: z }}
      className="fixed w-48 overflow-hidden rounded-2xl bg-gray-900/95 text-center text-white shadow-xl ring-1 ring-white/10"
    >
      {/* 드래그 핸들 — 여기만 잡아야 내부 버튼이 계속 눌린다 */}
      <div
        {...handleProps}
        className="flex cursor-move touch-none select-none items-center gap-1.5 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-300"
      >
        <GripHorizontal className="h-3.5 w-3.5 text-gray-500" />
        {label}
        <button onClick={onClose} aria-label={`${label} 닫기`} className="ml-auto rounded p-0.5 hover:bg-white/15">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-3">
        <div className={`my-1 text-3xl font-extrabold tabular-nums ${ended ? 'animate-pulse text-red-400' : ''}`}>
          {pad(Math.floor(sec / 60))}:{pad(sec % 60)}
        </div>

        {mode === 'timer' && !run && (
          <div className="mb-2 flex justify-center gap-1">
            {PRESETS.map((m) => (
              <button
                key={m}
                onClick={() => setPreset(m)}
                className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition-colors ${
                  sec === m * 60 ? 'bg-primary-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {m}분
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-center gap-1.5 text-sm">
          <button
            onClick={toggleRun}
            className="flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 font-semibold hover:bg-white/25"
          >
            {run ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {run ? '정지' : '시작'}
          </button>
          <button onClick={reset} aria-label="초기화" className="rounded-lg bg-white/15 px-2.5 py-1 hover:bg-white/25">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
