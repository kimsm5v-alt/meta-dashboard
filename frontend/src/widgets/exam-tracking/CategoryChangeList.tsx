import styled from '@emotion/styled';
import { useTheme } from '@emotion/react';
import { Card } from '@shared/components';
import { SUB_CATEGORY_ORDER } from '@shared/utils/classComparisonUtils';
import { calculateSubCategoryAveragesByRound } from '@features/exam-tracking/utils/calculateSubCategoryAveragesByRound';
import { FactorBar } from '@features/class-dashboard/ui/detail/FactorBar';
import type { Class } from '@shared/types';

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

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 8px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};

  &:first-of-type {
    border-top: none;
  }
`;

const Label = styled.span`
  flex-shrink: 0;
  width: 100px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ScoreText = styled.span`
  flex-shrink: 0;
  width: 90px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  text-align: right;
`;

const EmptyText = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.lg} 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

interface CategoryChangeListProps {
  classData: Class;
}

export const CategoryChangeList = ({ classData }: CategoryChangeListProps) => {
  const theme = useTheme();
  const round1 = calculateSubCategoryAveragesByRound(classData, 1);
  const round2 = calculateSubCategoryAveragesByRound(classData, 2);

  if (!round1 || !round2) {
    return (
      <Card>
        <Title>요인별 변화 비교</Title>
        <EmptyText>1차·2차 검사를 모두 응시한 학생이 있어야 비교할 수 있습니다.</EmptyText>
      </Card>
    );
  }

  return (
    <Card>
      <Title>요인별 변화 비교</Title>
      <Subtitle>11개 중분류의 1차 대비 2차 평균 T점수 변화입니다.</Subtitle>
      {SUB_CATEGORY_ORDER.map((sub) => (
        <Row key={sub}>
          <Label>{sub}</Label>
          <FactorBar
            score={round2[sub]}
            prevScore={round1[sub]}
            color={theme.colors.primary[500]}
          />
          <ScoreText>
            {round1[sub]} → {round2[sub]}
          </ScoreText>
        </Row>
      ))}
    </Card>
  );
};
