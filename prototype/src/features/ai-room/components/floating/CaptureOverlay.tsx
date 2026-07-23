import { useState } from 'react';

export interface CaptureData {
  /** 선택 영역 픽셀 크기 */
  w: number;
  h: number;
}

interface CaptureOverlayProps {
  onComplete: (data: CaptureData) => void;
  onCancel: () => void;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 화면 캡처 영역 선택 오버레이 (A-5)
 * - crosshair 커서, 드래그로 영역 선택, 선택 영역은 구멍 뚫듯 강조
 * - 프로토타입: 실제 이미지 캡처 없이 선택 완료만 처리
 */
export const CaptureOverlay: React.FC<CaptureOverlayProps> = ({ onComplete, onCancel }) => {
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);

  const handleDown = (e: React.MouseEvent) => {
    setStart({ x: e.clientX, y: e.clientY });
    setRect({ x: e.clientX, y: e.clientY, w: 0, h: 0 });
  };

  const handleMove = (e: React.MouseEvent) => {
    if (!start) return;
    const x = Math.min(start.x, e.clientX);
    const y = Math.min(start.y, e.clientY);
    const w = Math.abs(e.clientX - start.x);
    const h = Math.abs(e.clientY - start.y);
    setRect({ x, y, w, h });
  };

  const handleUp = () => {
    if (rect && rect.w >= 20 && rect.h >= 20) {
      onComplete({ w: Math.round(rect.w), h: Math.round(rect.h) });
    } else {
      onCancel();
    }
    setStart(null);
    setRect(null);
  };

  return (
    <div
      className="fixed inset-0 z-[100] cursor-crosshair"
      style={{ background: rect ? 'transparent' : 'rgba(0,0,0,0.4)' }}
      onMouseDown={handleDown}
      onMouseMove={handleMove}
      onMouseUp={handleUp}
    >
      {/* 안내 */}
      {!rect && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[13px] px-4 py-2 rounded-full">
          질문할 영역을 드래그하세요 · ESC로 취소
        </div>
      )}
      {/* 선택 영역 (구멍 뚫듯 강조) */}
      {rect && (
        <div
          className="absolute border-2 border-primary-400 rounded-sm"
          style={{
            left: rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
          }}
        />
      )}
    </div>
  );
};
