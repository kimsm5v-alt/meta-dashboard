/**
 * InfoTooltip 컴포넌트
 * - ⓘ 아이콘 hover/tap 시 조작적 정의 표시
 * - 데스크톱: hover, 모바일: tap
 * - 위치 자동 조정 (오른쪽 우선, 공간 부족 시 상단)
 */

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string | ReactNode;
  /** 아이콘 크기 (기본값: 14) */
  iconSize?: number;
  /** 아이콘 색상 (기본값: text-slate-400) */
  iconClassName?: string;
  /** 툴팁 최대 너비 (기본값: 320px) */
  maxWidth?: number;
}

type TooltipPosition = 'right' | 'top' | 'left' | 'bottom';

export const InfoTooltip = ({
  content,
  iconSize = 14,
  iconClassName = 'text-slate-400 hover:text-slate-600',
  maxWidth = 320,
}: InfoTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>('right');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 위치 계산
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 8;

    // 오른쪽 공간 체크
    const rightSpace = viewportWidth - triggerRect.right;
    // 상단 공간 체크
    const topSpace = triggerRect.top;
    // 왼쪽 공간 체크
    const leftSpace = triggerRect.left;
    // 하단 공간 체크
    const bottomSpace = viewportHeight - triggerRect.bottom;

    // 우선순위: 오른쪽 → 하단 → 왼쪽 → 상단
    if (rightSpace >= tooltipRect.width + padding) {
      setPosition('right');
    } else if (bottomSpace >= tooltipRect.height + padding) {
      setPosition('bottom');
    } else if (leftSpace >= tooltipRect.width + padding) {
      setPosition('left');
    } else if (topSpace >= tooltipRect.height + padding) {
      setPosition('top');
    } else {
      setPosition('right'); // 기본값
    }
  }, []);

  // 툴팁 표시 시 위치 계산
  useEffect(() => {
    if (isVisible) {
      // 다음 프레임에서 위치 계산 (DOM 렌더링 후)
      requestAnimationFrame(calculatePosition);
    }
  }, [isVisible, calculatePosition]);

  // 외부 클릭 시 닫기 (모바일용)
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isVisible]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!isVisible) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsVisible(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isVisible]);

  // 위치별 스타일
  const positionStyles: Record<TooltipPosition, string> = {
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  };

  // 화살표 위치별 스타일
  const arrowStyles: Record<TooltipPosition, string> = {
    right: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45',
    top: 'left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 rotate-45',
    left: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 rotate-45',
    bottom: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rotate-45',
  };

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={triggerRef}
        type="button"
        className={`inline-flex items-center justify-center cursor-help ${iconClassName}`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible((prev) => !prev);
        }}
        aria-label="정보 보기"
        aria-expanded={isVisible}
      >
        <Info size={iconSize} />
      </button>

      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`
            absolute z-50
            w-max
            px-3 py-2
            bg-slate-800 text-white text-sm leading-relaxed
            rounded-lg shadow-lg
            ${positionStyles[position]}
          `}
          style={{ maxWidth }}
        >
          {/* 화살표 */}
          <span
            className={`
              absolute w-2 h-2 bg-slate-800
              ${arrowStyles[position]}
            `}
          />
          {content}
        </div>
      )}
    </span>
  );
};

export default InfoTooltip;
