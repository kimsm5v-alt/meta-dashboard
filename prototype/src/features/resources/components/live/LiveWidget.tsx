/**
 * 수업 위젯: 타이머(300초 카운트다운) / 스톱워치 (목업 clsTool/renderWidget/cwToggle).
 */
import { useEffect, useRef, useState } from 'react';
import { useResources } from '../../store/ResourcesContext';

const pad = (n: number) => String(n).padStart(2, '0');

export const LiveWidget = ({ mode, onClose }: { mode: 'timer' | 'stop'; onClose: () => void }) => {
  const { toast } = useResources();
  const [sec, setSec] = useState(mode === 'timer' ? 300 : 0);
  const [run, setRun] = useState(false);
  const intRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 모드 변경 시 초기화
  useEffect(() => {
    setSec(mode === 'timer' ? 300 : 0);
    setRun(false);
  }, [mode]);

  useEffect(() => {
    if (!run) {
      if (intRef.current) clearInterval(intRef.current);
      return;
    }
    intRef.current = setInterval(() => {
      setSec((s) => {
        if (mode === 'timer') {
          if (s <= 1) {
            setRun(false);
            toast('타이머 종료');
            return 0;
          }
          return s - 1;
        }
        return s + 1;
      });
    }, 1000);
    return () => { if (intRef.current) clearInterval(intRef.current); };
  }, [run, mode, toast]);

  const reset = () => {
    setRun(false);
    setSec(mode === 'timer' ? 300 : 0);
  };

  return (
    <div className="absolute bottom-6 right-6 z-10 w-44 rounded-2xl bg-gray-900/95 p-4 text-center text-white shadow-xl">
      <div className="text-xs font-semibold text-gray-300">{mode === 'timer' ? '⏱️ 타이머' : '⏲️ 스톱워치'}</div>
      <div className="my-1 text-3xl font-extrabold tabular-nums">{pad(Math.floor(sec / 60))}:{pad(sec % 60)}</div>
      <div className="flex justify-center gap-1.5 text-sm">
        <button onClick={() => setRun((r) => !r)} className="rounded-lg bg-white/15 px-2.5 py-1 font-semibold hover:bg-white/25">{run ? '⏸ 정지' : '▶ 시작'}</button>
        <button onClick={reset} className="rounded-lg bg-white/15 px-2.5 py-1 hover:bg-white/25">↺</button>
        <button onClick={onClose} className="rounded-lg bg-white/15 px-2.5 py-1 hover:bg-white/25">✕</button>
      </div>
    </div>
  );
};
