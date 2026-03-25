import styled from '@emotion/styled';

export type TLevel = '매우높음' | '높음' | '보통' | '낮음' | '매우낮음';

interface LevelBadgeProps {
  level: TLevel;
  isPositive: boolean;
  size?: 'sm' | 'md';
}

interface ColorConfig {
  bg: string;
  text: string;
}

/**
 * 정적 요인: 높을수록 좋음 → 높음=초록, 낮음=빨강
 * 부적 요인: 낮을수록 좋음 → 높음=빨강, 낮음=초록 (색상 반전)
 */
export const COLORS_POSITIVE: Record<TLevel, ColorConfig> = {
  매우높음: { bg: '#d1fae5', text: '#047857' },
  높음: { bg: '#d1f4e0', text: '#059669' },
  보통: { bg: '#f1f5f9', text: '#64748b' },
  낮음: { bg: '#fed7aa', text: '#ea580c' },
  매우낮음: { bg: '#fee2e2', text: '#b91c1c' },
};

export const COLORS_NEGATIVE: Record<TLevel, ColorConfig> = {
  매우높음: { bg: '#fee2e2', text: '#b91c1c' },
  높음: { bg: '#fed7aa', text: '#ea580c' },
  보통: { bg: '#f1f5f9', text: '#64748b' },
  낮음: { bg: '#d1f4e0', text: '#059669' },
  매우낮음: { bg: '#d1fae5', text: '#047857' },
};

const Badge = styled.span<{ $bg: string; $text: string; $size: 'sm' | 'md' }>`
  display: inline-block;
  background-color: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  font-size: ${({ $size }) => ($size === 'sm' ? '10px' : '12px')};
  padding: ${({ $size }) => ($size === 'sm' ? '2px 6px' : '2px 8px')};
  border-radius: ${({ theme }) => theme.radius.full};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  white-space: nowrap;
`;

export const LevelBadge = ({ level, isPositive, size = 'md' }: LevelBadgeProps) => {
  const colors = isPositive ? COLORS_POSITIVE[level] : COLORS_NEGATIVE[level];

  return (
    <Badge $bg={colors.bg} $text={colors.text} $size={size}>
      {level}
    </Badge>
  );
};
