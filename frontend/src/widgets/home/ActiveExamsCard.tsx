import styled from '@emotion/styled';
import { Loader2, RefreshCw } from 'lucide-react';
import { Card } from '@shared/components';
import { EXAM_SLOTS } from '@features/assessment/constants';
import { useHomeExamStats, getLearningSlot } from '@features/home/model/useHomeExamStats';
import type { GroupWithExamState } from '@features/assessment/types';

const Title = styled.h3`
  margin: 0 0 4px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const CenterBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
`;

const EmptyText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: 6px 12px;
  color: ${({ theme }) => theme.colors.primary[700]};
  background: ${({ theme }) => theme.colors.primary[50]};
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  cursor: pointer;
`;

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Row = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};

  &:last-of-type {
    border-bottom: none;
  }
`;

const RowLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const RowRate = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const MoreLink = styled.button`
  align-self: flex-start;
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: 0;
  color: ${({ theme }) => theme.colors.primary[600]};
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

interface InProgressItem {
  key: string;
  className: string;
  examLabel: string;
  rate: number;
  submitted: number;
  total: number;
}

const buildInProgressItems = (groups: GroupWithExamState[]): InProgressItem[] => {
  const items: InProgressItem[] = [];
  groups.forEach((group) => {
    ([1, 2] as const).forEach((round) => {
      const slot = getLearningSlot(group, round);
      if (slot && slot.status === 'in_progress') {
        const def = EXAM_SLOTS.find((d) => d.id === slot.slotId);
        items.push({
          key: `${group.id}-${slot.slotId}`,
          className: group.name,
          examLabel: `${round}차 · ${def?.label ?? '검사'}`,
          rate:
            slot.totalCount === 0 ? 0 : Math.round((slot.submittedCount / slot.totalCount) * 100),
          submitted: slot.submittedCount,
          total: slot.totalCount,
        });
      }
    });
  });
  return items;
};

const handleScrollToOverview = () => {
  document.getElementById('exam-overview')?.scrollIntoView({ behavior: 'smooth' });
};

export const ActiveExamsCard = () => {
  const { groups, isLoading, error, refetch } = useHomeExamStats();

  if (isLoading) {
    return (
      <Card>
        <Title>진행 중인 검사</Title>
        <CenterBox>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </CenterBox>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Title>진행 중인 검사</Title>
        <CenterBox style={{ flexDirection: 'column' }}>
          <EmptyText>검사 현황을 불러오지 못했습니다.</EmptyText>
          <RetryButton onClick={refetch}>
            <RefreshCw size={14} /> 다시 시도
          </RetryButton>
        </CenterBox>
      </Card>
    );
  }

  const items = buildInProgressItems(groups);

  return (
    <Card>
      <Title>진행 중인 검사</Title>
      {items.length === 0 ? (
        <EmptyText>진행 중인 검사가 없습니다.</EmptyText>
      ) : (
        <>
          <List>
            {items.map((item) => (
              <Row key={item.key}>
                <RowLabel>
                  {item.className} · {item.examLabel}
                </RowLabel>
                <RowRate>
                  {item.rate}% ({item.submitted}/{item.total})
                </RowRate>
              </Row>
            ))}
          </List>
          <MoreLink onClick={handleScrollToOverview}>
            진행 중 검사 {items.length}건 모두 보기 →
          </MoreLink>
        </>
      )}
    </Card>
  );
};
