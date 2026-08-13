import styled from '@emotion/styled';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@shared/components';
import { FACTOR_DEFINITIONS } from '@shared/data/factors';
import type { Class } from '@shared/types';

const Title = styled.h3`
  margin: 0 0 4px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

const Subtitle = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const ChangeCard = styled.div<{ $improved: boolean }>`
  position: relative;
  padding: 12px 12px 12px 16px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.md};

  &::before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 4px;
    content: '';
    background: ${({ theme, $improved }) =>
      $improved ? theme.colors.success.main : theme.colors.warning.main};
  }
`;

const Category = styled.p`
  margin: 0 0 4px;
  color: ${({ theme }) => theme.colors.primary[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Name = styled.p`
  margin: 0 0 8px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Scores = styled.div<{ $improved: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};

  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  strong {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: ${({ theme, $improved }) =>
      $improved ? theme.colors.success.dark : theme.colors.warning.dark};
  }
`;

const EmptyText = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.lg} 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

interface SignificantFactorChangesProps {
  classData: Class;
}

export const SignificantFactorChanges = ({ classData }: SignificantFactorChangesProps) => {
  const pairedStudents = classData.students.filter(
    (student) =>
      student.assessments.some((assessment) => assessment.round === 1) &&
      student.assessments.some((assessment) => assessment.round === 2),
  );

  const changes = FACTOR_DEFINITIONS.map((factor) => {
    const round1Scores = pairedStudents
      .map(
        (student) =>
          student.assessments.find((assessment) => assessment.round === 1)?.tScores[factor.index],
      )
      .filter((score): score is number => score != null);
    const round2Scores = pairedStudents
      .map(
        (student) =>
          student.assessments.find((assessment) => assessment.round === 2)?.tScores[factor.index],
      )
      .filter((score): score is number => score != null);
    const round1 = Math.round(
      round1Scores.reduce((sum, score) => sum + score, 0) / round1Scores.length,
    );
    const round2 = Math.round(
      round2Scores.reduce((sum, score) => sum + score, 0) / round2Scores.length,
    );
    return { factor, round1, round2, change: round2 - round1 };
  })
    .filter((item) => Number.isFinite(item.round1) && Number.isFinite(item.round2))
    .filter((item) => Math.abs(item.change) >= 3)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 6);

  return (
    <Card>
      <Title>유의미한 요인 변화</Title>
      <Subtitle>T점수가 3점 이상 변화한 요인들입니다.</Subtitle>
      {changes.length === 0 ? (
        <EmptyText>유의미하게 변화한 요인이 없습니다.</EmptyText>
      ) : (
        <Grid>
          {changes.map(({ factor, round1, round2, change }) => {
            const improved = factor.isPositive ? change > 0 : change < 0;
            const ChangeIcon = change > 0 ? TrendingUp : TrendingDown;
            return (
              <ChangeCard key={factor.index} $improved={improved}>
                <Category>#{factor.category}</Category>
                <Name>{factor.name}</Name>
                <Scores $improved={improved}>
                  <span>
                    {round1} <ArrowRight size={12} /> {round2}
                  </span>
                  <strong>
                    <ChangeIcon size={13} />
                    {change > 0 ? '+' : ''}
                    {change}
                  </strong>
                </Scores>
              </ChangeCard>
            );
          })}
        </Grid>
      )}
    </Card>
  );
};
