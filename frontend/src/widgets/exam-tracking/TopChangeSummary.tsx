import styled from '@emotion/styled';
import type { Class } from '@shared/types';
import type {
  ClassProfile,
  ClassProfileItem,
} from '@features/class-dashboard/model/useClassProfile';
import { FACTOR_DEFINITIONS } from '@shared/data/factors';
import { FACTOR_OPERATIONAL_DEFINITIONS } from '@shared/data/factorDefinitions';
import { diffTop3, type Top3ChangeItem } from '@features/exam-tracking/utils/diffTop3';
import { Card } from '@shared/components';

const getTrackingProfile = (classData: Class, round: 1 | 2): ClassProfile | null => {
  const pairedStudents = classData.students.filter(
    (student) =>
      student.assessments.some((assessment) => assessment.round === 1) &&
      student.assessments.some((assessment) => assessment.round === 2),
  );
  if (pairedStudents.length === 0) return null;

  const items: ClassProfileItem[] = FACTOR_DEFINITIONS.map((factor) => {
    const scores = pairedStudents
      .map(
        (student) =>
          student.assessments.find((assessment) => assessment.round === round)?.tScores[
            factor.index
          ],
      )
      .filter((score): score is number => score != null);
    return {
      factorName: factor.name,
      subCategory: factor.subCategory,
      parentCategory: factor.category,
      avgT: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
      isPositive: factor.isPositive,
      definition: FACTOR_OPERATIONAL_DEFINITIONS[factor.name] ?? '',
    };
  }).filter((item) => Number.isFinite(item.avgT));

  return {
    strengths: items
      .filter((item) => item.isPositive)
      .sort((a, b) => b.avgT - a.avgT)
      .slice(0, 3),
    weaknesses: items
      .filter((item) => !item.isPositive)
      .sort((a, b) => b.avgT - a.avgT)
      .slice(0, 3),
  };
};

const Title = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.xl};

  & > div + div {
    padding-left: ${({ theme }) => theme.spacing.xl};
    border-left: 1px solid ${({ theme }) => theme.colors.gray[200]};
  }
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
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0 0 8px;
  color: ${({ theme, $tone }) =>
    $tone === 'strength' ? theme.colors.success.dark : theme.colors.error.dark};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};

  &::before {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: white;
    content: ${({ $tone }) => ($tone === 'strength' ? "'✓'" : "'!'")};
    background: ${({ theme, $tone }) =>
      $tone === 'strength' ? theme.colors.success.main : theme.colors.error.main};
    border-radius: ${({ theme }) => theme.radius.full};
    font-size: 10px;
  }
`;

const ItemRow = styled.div<{ $tone: 'strength' | 'weakness'; $isNew: boolean }>`
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  column-gap: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: ${({ $tone, $isNew }) =>
    $isNew
      ? $tone === 'strength'
        ? '#D1FAE5'
        : '#FEE2E2'
      : $tone === 'strength'
        ? '#F0FDF7'
        : '#FFF7F5'};
  border: 1px solid
    ${({ $tone, $isNew }) =>
      $isNew
        ? $tone === 'strength'
          ? '#34D399'
          : '#FB7185'
        : $tone === 'strength'
          ? '#B7E8D0'
          : '#F6C9C2'};
  box-shadow: ${({ $tone, $isNew }) =>
    $isNew
      ? $tone === 'strength'
        ? '0 0 0 1px rgba(16, 185, 129, 0.1)'
        : '0 0 0 1px rgba(244, 63, 94, 0.1)'
      : 'none'};
  border-radius: ${({ theme }) => theme.radius.sm};
`;

const Rank = styled.span`
  grid-row: span 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: ${({ theme }) => theme.colors.text.secondary};
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ItemName = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const Category = styled.span<{ $tone: 'strength' | 'weakness' }>`
  color: ${({ theme, $tone }) =>
    $tone === 'strength' ? theme.colors.success.dark : theme.colors.error.dark};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const Definition = styled.p`
  grid-column: 2;
  margin: 3px 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 11px;
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
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
    {items.map((item, index) => (
      <ItemRow key={item.factorName} $tone={tone} $isNew={item.isNew}>
        <Rank>{index + 1}</Rank>
        <div>
          <ItemName>{item.factorName}</ItemName>
          {item.isNew && <NewBadge>NEW</NewBadge>}
        </div>
        <Category $tone={tone}>#{item.parentCategory}</Category>
        <Definition>{item.definition}</Definition>
      </ItemRow>
    ))}
  </SubBlock>
);

interface TopChangeSummaryProps {
  classData: Class;
}

export const TopChangeSummary = ({ classData }: TopChangeSummaryProps) => {
  const round1Profile = getTrackingProfile(classData, 1);
  const round2Profile = getTrackingProfile(classData, 2);

  if (!round1Profile || !round2Profile) {
    return (
      <Card>
        <Title>강점/보완점 Top 3 순위 변화</Title>
        <EmptyText>1차·2차 검사를 모두 응시한 학생이 있어야 비교할 수 있습니다.</EmptyText>
      </Card>
    );
  }

  const strengthDiff = diffTop3(round1Profile.strengths, round2Profile.strengths);
  const weaknessDiff = diffTop3(round1Profile.weaknesses, round2Profile.weaknesses);

  return (
    <Card>
      <Title>강점/보완점 Top 3 순위 변화</Title>
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
