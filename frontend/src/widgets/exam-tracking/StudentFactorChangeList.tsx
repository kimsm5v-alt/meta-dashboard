import styled from '@emotion/styled';
import { useTheme } from '@emotion/react';
import { Card } from '@shared/components';
import { FACTOR_DEFINITIONS } from '@shared/data/factors';
import { FactorBar } from '@features/class-dashboard/ui/detail/FactorBar';
import type { FactorCategory } from '@shared/types';

const Title = styled.h3`
  margin: 0 0 4px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Subtitle = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const CategoryHeading = styled.p`
  margin: ${({ theme }) => theme.spacing.md} 0 6px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};

  &:first-of-type {
    margin-top: 0;
  }
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 6px 0;
`;

const Label = styled.span`
  flex-shrink: 0;
  width: 90px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ScoreText = styled.span`
  flex-shrink: 0;
  width: 70px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  text-align: right;
`;

const CATEGORY_DOMAIN_KEY: Record<
  FactorCategory,
  'self' | 'stepping' | 'positive' | 'obstacle' | 'negative'
> = {
  자아강점: 'self',
  학습디딤돌: 'stepping',
  긍정적공부마음: 'positive',
  학습걸림돌: 'obstacle',
  부정적공부마음: 'negative',
};

interface StudentFactorChangeListProps {
  round1TScores: number[];
  round2TScores: number[];
}

export const StudentFactorChangeList = ({
  round1TScores,
  round2TScores,
}: StudentFactorChangeListProps) => {
  const theme = useTheme();

  return (
    <Card>
      <Title>38개 요인 비교</Title>
      <Subtitle>1차 대비 2차 검사의 요인별 T점수 변화입니다.</Subtitle>
      {FACTOR_DEFINITIONS.map((factor, index) => {
        const showHeading = factor.category !== FACTOR_DEFINITIONS[index - 1]?.category;
        return (
          <div key={factor.index}>
            {showHeading && <CategoryHeading>{factor.category}</CategoryHeading>}
            <Row>
              <Label>{factor.name}</Label>
              <FactorBar
                score={round2TScores[factor.index]}
                prevScore={round1TScores[factor.index]}
                color={theme.colors.domain[CATEGORY_DOMAIN_KEY[factor.category]]}
                height='sm'
              />
              <ScoreText>
                {round1TScores[factor.index]} → {round2TScores[factor.index]}
              </ScoreText>
            </Row>
          </div>
        );
      })}
    </Card>
  );
};
