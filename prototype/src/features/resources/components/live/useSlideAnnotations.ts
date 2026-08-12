/**
 * 슬라이드별 필기 저장소.
 * ClassLiveOverlay 에 두어 캔버스가 리마운트돼도 필기가 살아남게 한다.
 */
import { useCallback, useState } from 'react';
import { NO_STROKES, type SlideStrokes, type Stroke } from './annotationTypes';

export function useSlideAnnotations() {
  const [bySlide, setBySlide] = useState<SlideStrokes>({});

  const strokesFor = useCallback((slide: number): Stroke[] => bySlide[slide] ?? NO_STROKES, [bySlide]);

  const addStroke = useCallback((slide: number, s: Stroke) => {
    setBySlide((prev) => ({ ...prev, [slide]: [...(prev[slide] ?? []), s] }));
  }, []);

  const undo = useCallback((slide: number) => {
    setBySlide((prev) => {
      const cur = prev[slide];
      if (!cur?.length) return prev;
      return { ...prev, [slide]: cur.slice(0, -1) };
    });
  }, []);

  const clearSlide = useCallback((slide: number) => {
    setBySlide((prev) => (prev[slide]?.length ? { ...prev, [slide]: [] } : prev));
  }, []);

  return { strokesFor, addStroke, undo, clearSlide };
}
