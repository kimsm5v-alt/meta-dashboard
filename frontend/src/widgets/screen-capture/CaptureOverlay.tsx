import { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { toast } from 'sonner';
import { captureRegion } from '@shared/lib/captureRegion';
import { useCaptureStore } from '@shared/store/useCaptureStore';

const MIN_SIZE = 20;

interface DragRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const Backdrop = styled.div<{ $dimmed: boolean }>`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.tooltip + 10};
  cursor: crosshair;
  background: ${({ $dimmed }) => ($dimmed ? 'transparent' : 'rgba(0, 0, 0, 0.4)')};
`;

const Hint = styled.div`
  position: fixed;
  top: ${({ theme }) => theme.spacing.lg};
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: 13px;
  font-weight: 500;
  pointer-events: none;
`;

const Selection = styled.div<{ $x: number; $y: number; $w: number; $h: number }>`
  position: absolute;
  left: ${({ $x }) => $x}px;
  top: ${({ $y }) => $y}px;
  width: ${({ $w }) => $w}px;
  height: ${({ $h }) => $h}px;
  border: 2px solid ${({ theme }) => theme.colors.primary[400]};
  border-radius: 4px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4);
`;

const toRect = (start: { x: number; y: number }, current: { x: number; y: number }): DragRect => ({
  x: Math.min(start.x, current.x),
  y: Math.min(start.y, current.y),
  w: Math.abs(current.x - start.x),
  h: Math.abs(current.y - start.y),
});

const OverlayContent = () => {
  const closeOverlay = useCaptureStore((s) => s.closeOverlay);
  const setPendingImage = useCaptureStore((s) => s.setPendingImage);

  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useState<DragRect | null>(null);
  const [capturing, setCapturing] = useState(false);
  /**
   * html2canvas는 도중에 취소할 수 없는 비동기 작업이라, "이 특정 캡처 시도가 여전히
   * 유효한지"를 매 시도마다 새로 발급하는 토큰으로 추적한다. ESC로 취소한 뒤 곧바로
   * 오버레이를 다시 열어 새 캡처를 시작해도, 이전 시도의 프로미스가 뒤늦게 끝나면서
   * "취소 안 됨"으로 잘못 되돌아가는 일이 없도록 세션 단위가 아니라 시도 단위로 검증한다.
   */
  const captureTokenRef = useRef(0);
  const invalidateCurrentCapture = () => {
    captureTokenRef.current += 1;
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        invalidateCurrentCapture();
        closeOverlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeOverlay]);

  // 언마운트 시(로그아웃 등으로 ProtectedLayout 자체가 사라지는 경우) 진행 중이던 캡처를 무효화
  useEffect(() => () => invalidateCurrentCapture(), []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (capturing) return;
    const point = { x: e.clientX, y: e.clientY };
    setStart(point);
    setRect({ x: point.x, y: point.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!start || capturing) return;
    setRect(toRect(start, { x: e.clientX, y: e.clientY }));
  };

  const handleMouseUp = async () => {
    // 캡처가 이미 진행 중일 때의 뒤늦은/의도치 않은 mouseup은 무시한다.
    // 여기서 closeOverlay를 호출하면 사용자가 응답을 기다리며 초조하게 다시 클릭했을 때
    // 진행 중이던 정상 캡처가 아무 설명 없이 취소되는 것처럼 보인다(ESC만 진짜 취소로 취급).
    if (capturing) return;
    if (!rect) {
      closeOverlay();
      return;
    }
    if (rect.w < MIN_SIZE || rect.h < MIN_SIZE) {
      setStart(null);
      setRect(null);
      return;
    }
    setCapturing(true);
    const myToken = ++captureTokenRef.current;
    try {
      const result = await captureRegion(rect);
      if (captureTokenRef.current !== myToken) return; // 그 사이 취소되었거나 새 시도로 대체됨
      setPendingImage(result.dataUri, { w: result.w, h: result.h });
    } catch (error) {
      if (captureTokenRef.current !== myToken) return;
      console.error('화면 캡처 실패:', error);
      const message = error instanceof Error ? error.message : '화면 캡처에 실패했습니다.';
      toast.error(message);
      closeOverlay();
    }
  };

  return (
    <Backdrop
      $dimmed={!!rect}
      data-capture-ignore='true'
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {!rect && <Hint>질문할 영역을 드래그하세요 · ESC로 취소</Hint>}
      {rect && <Selection $x={rect.x} $y={rect.y} $w={rect.w} $h={rect.h} />}
      {capturing && <Hint>캡처 중입니다...</Hint>}
    </Backdrop>
  );
};

export const CaptureOverlay = () => {
  const overlayOpen = useCaptureStore((s) => s.overlayOpen);

  if (!overlayOpen) return null;
  return <OverlayContent />;
};
