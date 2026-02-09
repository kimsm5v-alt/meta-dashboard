import type { TLevel } from '../../hooks/useClassDetailData';

interface LevelBadgeProps {
  level: TLevel;
  isPositive: boolean;
  size?: 'sm' | 'md';
}

/**
 * 정적 요인: 높을수록 좋음 → 높음=초록, 낮음=빨강
 * 부적 요인: 낮을수록 좋음 → 높음=빨강, 낮음=초록 (색상 반전)
 */
const COLORS_POSITIVE: Record<TLevel, string> = {
  '매우높음': 'bg-emerald-100 text-emerald-700',
  '높음': 'bg-emerald-50 text-emerald-600',
  '보통': 'bg-gray-100 text-gray-600',
  '낮음': 'bg-orange-50 text-orange-600',
  '매우낮음': 'bg-red-100 text-red-700',
};

const COLORS_NEGATIVE: Record<TLevel, string> = {
  '매우높음': 'bg-red-100 text-red-700',
  '높음': 'bg-orange-50 text-orange-600',
  '보통': 'bg-gray-100 text-gray-600',
  '낮음': 'bg-emerald-50 text-emerald-600',
  '매우낮음': 'bg-emerald-100 text-emerald-700',
};

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, isPositive, size = 'md' }) => {
  const colors = isPositive ? COLORS_POSITIVE[level] : COLORS_NEGATIVE[level];
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span className={`${colors} ${sizeClass} rounded-full font-semibold whitespace-nowrap`}>
      {level}
    </span>
  );
};
