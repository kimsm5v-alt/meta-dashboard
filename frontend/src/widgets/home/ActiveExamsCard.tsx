import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import { Card } from '@shared/components';
import { EXAM_SLOTS } from '@features/assessment/constants';
import { useHomeExamStats, getLearningSlot } from '@features/home/model/useHomeExamStats';
import type { GroupWithExamState } from '@features/assessment/types';

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Pills = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Pill = styled.span<{ $muted?: boolean }>`
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme, $muted }) => ($muted ? theme.colors.gray[400] : theme.colors.gray[600])};
  background: ${({ theme, $muted }) => ($muted ? theme.colors.gray[50] : theme.colors.gray[200])};
  white-space: nowrap;
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

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  text-align: center;
`;

const EmptyTitle = styled.p`
  margin: 0 0 8px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const EmptyDescription = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const StartButton = styled.button`
  width: 100%;
  padding: 10px;
  color: white;
  background: ${({ theme }) => theme.colors.primary[500]};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const SingleWrap = styled.div`
  padding: ${({ theme }) => theme.spacing.md} 0;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const SingleHeadRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const SingleClassName = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const RoundBadge = styled.span`
  flex-shrink: 0;
  padding: 2px 8px;
  color: ${({ theme }) => theme.colors.gray[600]};
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  white-space: nowrap;
`;

const SingleMeta = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const ProgressRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Track = styled.div<{ $height: number }>`
  flex: 1;
  height: ${({ $height }) => $height}px;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.full};
  overflow: hidden;
`;

const Fill = styled.div<{ $percentage: number; $tone: 'single' | 'strong' | 'default' }>`
  height: 100%;
  width: ${({ $percentage }) => `${$percentage}%`};
  background: ${({ theme, $tone }) => {
    if ($tone === 'single') return theme.colors.gray[500];
    if ($tone === 'strong') return theme.colors.gray[600];
    return theme.colors.gray[400];
  }};
  border-radius: inherit;
  transition: width 0.3s ease;
`;

const RateText = styled.span`
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  white-space: nowrap;
`;

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Row = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 10px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};

  &:first-of-type {
    border-top: none;
  }
`;

const RowClassName = styled.span`
  flex-shrink: 0;
  width: 44px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const RowRate = styled.span`
  flex-shrink: 0;
  width: 92px;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-align: right;
`;

const MoreLink = styled.button`
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} 0 0;
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.primary[600]};
  background: none;
  text-align: left;
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
  round: 1 | 2;
  examLabel: string;
  startDate?: Date;
  rate: number;
  submitted: number;
  total: number;
}

const formatMonthDay = (date: Date): string =>
  `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

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
          round,
          examLabel: def?.label ?? '검사',
          startDate: slot.startDate,
          rate:
            slot.totalCount === 0 ? 0 : Math.round((slot.submittedCount / slot.totalCount) * 100),
          submitted: slot.submittedCount,
          total: slot.totalCount,
        });
      }
    });
  });
  return items.sort((a, b) => a.rate - b.rate);
};

interface ActiveExamsCardProps {
  onViewAll: () => void;
}

export const ActiveExamsCard = ({ onViewAll }: ActiveExamsCardProps) => {
  const { groups, summary, isLoading, error, refetch } = useHomeExamStats();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <Title>진행 중인 검사</Title>
        <CenterBox>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
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
      <Header>
        <Title>진행 중인 검사</Title>
        <Pills>
          <Pill>진행 {items.length}건</Pill>
          <Pill $muted>완료 {summary.completedExams}건</Pill>
        </Pills>
      </Header>

      {items.length === 0 && (
        <EmptyState>
          <EmptyTitle>진행 중인 검사가 없습니다</EmptyTitle>
          <EmptyDescription>
            반을 선택해 학습심리정서검사를 시작하면
            <br />
            여기에 응시 현황이 표시됩니다
          </EmptyDescription>
          <StartButton onClick={() => navigate('/exam/management')}>검사 시작하기</StartButton>
        </EmptyState>
      )}

      {items.length === 1 && (
        <SingleWrap>
          <SingleHeadRow>
            <SingleClassName>{items[0].className}</SingleClassName>
            <RoundBadge>{items[0].round}차</RoundBadge>
            <SingleMeta>
              {items[0].examLabel}
              {items[0].startDate && ` · ${formatMonthDay(items[0].startDate)} 시작`}
            </SingleMeta>
          </SingleHeadRow>
          <ProgressRow>
            <Track $height={8}>
              <Fill $percentage={items[0].rate} $tone='single' />
            </Track>
            <RateText>
              {items[0].rate}% {items[0].submitted}/{items[0].total}
            </RateText>
          </ProgressRow>
        </SingleWrap>
      )}

      {items.length >= 2 && (
        <>
          <List>
            {items.slice(0, 3).map((item) => (
              <Row key={item.key}>
                <RowClassName>{item.className}</RowClassName>
                <RoundBadge>{item.round}차</RoundBadge>
                <Track $height={6}>
                  <Fill $percentage={item.rate} $tone={item.rate >= 90 ? 'strong' : 'default'} />
                </Track>
                <RowRate>
                  {item.rate}% {item.submitted}/{item.total}
                </RowRate>
              </Row>
            ))}
          </List>
          <MoreLink onClick={onViewAll}>진행 중 검사 {items.length}건 모두 보기 →</MoreLink>
        </>
      )}
    </Card>
  );
};
