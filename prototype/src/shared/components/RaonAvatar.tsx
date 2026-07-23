import { useState, useEffect } from 'react';

// SVG 에셋 임포트
import raonFull from '@/assets/raon/raon.svg';
import raonIdle from '@/assets/raon/raon-state-idle.svg';
import raonThinking from '@/assets/raon/raon-state-thinking.svg';
import raonAnswering from '@/assets/raon/raon-state-answering.svg';

export type RaonState = 'idle' | 'thinking' | 'answering';
export type RaonVariant = 'full' | 'head';

interface RaonAvatarProps {
  state?: RaonState;
  variant?: RaonVariant;
  size?: number;
  className?: string;
  animate?: boolean;
}

const STATE_ASSETS: Record<RaonState, string> = {
  idle: raonIdle,
  thinking: raonThinking,
  answering: raonAnswering,
};

/**
 * 라온 AI 어시스턴트 캐릭터 아바타
 *
 * variant:
 * - full: 전신 버전 (viewBox 220x220)
 * - head: 머리만 버전 (viewBox 120x120, 상태별 표정)
 *
 * 상태 머신 (head variant):
 * - idle: 기본 대기 상태 (반짝 눈 + 미소, 상하 플로팅 애니메이션)
 * - thinking: AI 응답 대기 중 (시선 위로, 생각 말풍선 점 3개)
 * - answering: AI 답변 중 (활짝 웃는 눈 + 반짝임)
 */
export const RaonAvatar: React.FC<RaonAvatarProps> = ({
  state = 'idle',
  variant = 'full',
  size = 32,
  className = '',
  animate = true,
}) => {
  const [currentState, setCurrentState] = useState(state);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 상태 전환 시 크로스페이드 처리 (head variant만)
  useEffect(() => {
    if (variant === 'head' && state !== currentState) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setCurrentState(state);
        setIsTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [state, currentState, variant]);

  // variant에 따라 에셋 선택
  const src = variant === 'full' ? raonFull : STATE_ASSETS[currentState];

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt="라온"
        role="img"
        aria-label={`라온 AI 어시스턴트${
          variant === 'head' ? ` - ${
            currentState === 'idle' ? '대기 중' :
            currentState === 'thinking' ? '생각 중' :
            '답변 중'
          }` : ''
        }`}
        className={`w-full h-full transition-opacity duration-150 ease-out ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        } ${animate ? 'animate-float' : ''}`}
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(91, 75, 153, 0.25))',
        }}
      />
    </div>
  );
};

export default RaonAvatar;
