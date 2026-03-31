import type React from 'react';
import styled from '@emotion/styled';
import type { Keyword } from '../lib/typeUtils';

interface KeywordBadgesProps {
  keywords: Keyword[];
}

/** 키워드가 강점인지 약점인지 판별 */
const isStrength = (kw: Keyword): boolean =>
  (kw.isPositive && kw.direction === 'positive') || (!kw.isPositive && kw.direction === 'negative');

const EmptyText = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Badge = styled.span<{ $isStrength: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: 2px ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background: ${({ $isStrength }) => ($isStrength ? '#dbeafe' : '#ffe4e6')};
  color: ${({ $isStrength }) => ($isStrength ? '#1d4ed8' : '#be123c')};
`;

const Dot = styled.span<{ $isStrength: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $isStrength }) => ($isStrength ? '#60a5fa' : '#fb7185')};
`;

export const KeywordBadges: React.FC<KeywordBadgesProps> = ({ keywords }) => {
  if (keywords.length === 0) {
    return <EmptyText>-</EmptyText>;
  }

  return (
    <Container>
      {keywords.map((kw, idx) => {
        const strength = isStrength(kw);
        return (
          <Badge key={idx} $isStrength={strength}>
            <Dot $isStrength={strength} />
            {kw.name}
          </Badge>
        );
      })}
    </Container>
  );
};
