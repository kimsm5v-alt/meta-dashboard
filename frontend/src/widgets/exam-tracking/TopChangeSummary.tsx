import styled from '@emotion/styled';
import type { Class } from '@shared/types';
import { computeClassProfile } from '@features/class-dashboard/model/useClassProfile';
import { diffTop3, type Top3ChangeItem } from '@features/exam-tracking/utils/diffTop3';
import { Card } from '@shared/components';

const Title = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const ColumnTitle = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const SubBlock = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SubBlockLabel = styled.p<{ $tone: 'strength' | 'weakness' }>`
  margin: 0 0 6px;
  color: ${({ theme, $tone }) =>
    $tone === 'strength' ? theme.colors.success.dark : theme.colors.error.dark};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ItemRow = styled.div<{ $tone: 'strength' | 'weakness' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  margin-bottom: 4px;
  background: ${({ theme, $tone }) =>
    $tone === 'strength' ? theme.colors.success.light : theme.colors.error.light};
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const ItemName = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const NewBadge = styled.span`
  padding: 1px 6px;
  color: white;
  background: ${({ theme }) => theme.colors.success.main};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const EmptyText = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.lg} 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

const TopList = ({
  label,
  tone,
  items,
}: {
  label: string;
  tone: 'strength' | 'weakness';
  items: Top3ChangeItem[];
}) => (
  <SubBlock>
    <SubBlockLabel $tone={tone}>{label}</SubBlockLabel>
    {items.map((item) => (
      <ItemRow key={item.factorName} $tone={tone}>
        <ItemName>{item.factorName}</ItemName>
        {item.isNew && <NewBadge>NEW</NewBadge>}
      </ItemRow>
    ))}
  </SubBlock>
);

interface TopChangeSummaryProps {
  classData: Class;
}

export const TopChangeSummary = ({ classData }: TopChangeSummaryProps) => {
  const round1Profile = computeClassProfile(classData, 1);
  const round2Profile = computeClassProfile(classData, 2);

  if (!round1Profile || !round2Profile) {
    return (
      <Card>
        <Title>강점/보완점 Top3 변화</Title>
        <EmptyText>1차·2차 검사를 모두 응시한 학생이 있어야 비교할 수 있습니다.</EmptyText>
      </Card>
    );
  }

  const strengthDiff = diffTop3(round1Profile.strengths, round2Profile.strengths);
  const weaknessDiff = diffTop3(round1Profile.weaknesses, round2Profile.weaknesses);

  return (
    <Card>
      <Title>강점/보완점 Top3 변화</Title>
      <Columns>
        <div>
          <ColumnTitle>1차 검사</ColumnTitle>
          <TopList label='주요 강점' tone='strength' items={strengthDiff.round1} />
          <TopList label='주요 보완점' tone='weakness' items={weaknessDiff.round1} />
        </div>
        <div>
          <ColumnTitle>2차 검사</ColumnTitle>
          <TopList label='주요 강점' tone='strength' items={strengthDiff.round2} />
          <TopList label='주요 보완점' tone='weakness' items={weaknessDiff.round2} />
        </div>
      </Columns>
    </Card>
  );
};
