import type React from 'react';
import styled from '@emotion/styled';
import type { ClassProfileItem } from '../../model/useClassProfile';
import { DOMAIN_COLORS } from '@shared/data/lpaProfiles';

// ============================================================
// 스타일 상수
// ============================================================

// eslint-disable-next-line react-refresh/only-export-components
export const ACCENT_STYLES = {
  emerald: {
    cardBg: 'rgba(16, 185, 129, 0.05)',
    cardBorder: '#a7f3d0',
    rank: '#10b981',
    score: '#059669',
  },
  red: {
    cardBg: 'rgba(239, 68, 68, 0.05)',
    cardBorder: '#fecaca',
    rank: '#ef4444',
    score: '#dc2626',
  },
} as const;

// ============================================================
// Styled Components
// ============================================================

const Card = styled.div<{ $accent: 'emerald' | 'red' }>`
  flex: 1;
  padding: 0.75rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ $accent }) => ACCENT_STYLES[$accent].cardBorder};
  background: ${({ $accent }) => ACCENT_STYLES[$accent].cardBg};
`;

const ParentCategoryLabel = styled.span<{ $color: string }>`
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: 0.25rem;
  display: inline-block;
  color: ${({ $color }) => $color};
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-bottom: 0.25rem;
`;

const RankNumber = styled.span<{ $accent: 'emerald' | 'red' }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ $accent }) => ACCENT_STYLES[$accent].rank};
`;

const CategoryName = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[800]};
`;

const ScoreText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.25rem;
`;

const Delta = styled.span<{ $isPositive: boolean; $isIncrease: boolean }>`
  margin-left: 0.25rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ $isPositive, $isIncrease }) =>
    $isIncrease ? ($isPositive ? '#059669' : '#ef4444') : $isPositive ? '#ef4444' : '#059669'};
`;

const SimpleScoreText = styled.p<{ $accent: 'emerald' | 'red' }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  margin-bottom: 0.25rem;
  color: ${({ $accent }) => ACCENT_STYLES[$accent].score};
`;

const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  line-height: 1.625;
`;

// ============================================================
// Props
// ============================================================

export interface ProfileCardProps {
  item: ClassProfileItem;
  idx: number;
  accent: 'emerald' | 'red';
  prevItems?: ClassProfileItem[];
}

// ============================================================
// 컴포넌트
// ============================================================

export const ProfileCard: React.FC<ProfileCardProps> = ({ item, idx, accent, prevItems }) => {
  const prevMap: Record<string, number> = {};
  if (prevItems) {
    for (const p of prevItems) {
      prevMap[p.factorName] = p.avgT;
    }
  }
  const prevT = prevMap[item.factorName];
  const hasPrev = prevT != null;
  const delta = hasPrev ? Math.round(item.avgT - prevT) : 0;

  return (
    <Card $accent={accent}>
      {item.parentCategory && (
        <ParentCategoryLabel $color={DOMAIN_COLORS[item.parentCategory] ?? '#9CA3AF'}>
          #{item.parentCategory}
        </ParentCategoryLabel>
      )}
      <HeaderRow>
        <RankNumber $accent={accent}>{idx + 1}</RankNumber>
        <CategoryName>{item.factorName}</CategoryName>
      </HeaderRow>
      {hasPrev ? (
        <ScoreText>
          T {prevT} → {item.avgT}
          {delta !== 0 && (
            <Delta $isPositive={item.isPositive} $isIncrease={delta > 0}>
              ({delta > 0 ? '+' : ''}
              {delta})
            </Delta>
          )}
        </ScoreText>
      ) : (
        <SimpleScoreText $accent={accent}>T {item.avgT}</SimpleScoreText>
      )}
      {item.definition && <Description>{item.definition}</Description>}
    </Card>
  );
};
