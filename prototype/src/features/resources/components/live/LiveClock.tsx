/**
 * 실시간 수업 시계 (목업 startLiveClock/tickLiveClock).
 * 시작 시각 + 진행 경과(mm:ss), 1초 틱.
 */
import { useEffect, useRef, useState } from 'react';

const pad = (n: number) => String(n).padStart(2, '0');

export const LiveClock = () => {
  const startRef = useRef(new Date());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const start = startRef.current;
  return (
    <span className="text-xs font-semibold text-gray-300">
      시작 {pad(start.getHours())}:{pad(start.getMinutes())} · 진행 {pad(Math.floor(elapsed / 60))}:{pad(elapsed % 60)}
    </span>
  );
};
