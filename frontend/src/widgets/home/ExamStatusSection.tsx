import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import { Card } from '@shared/components';
import { buildScopeQueryString } from '@shared/scope';
import { EXAM_STATUS_LABELS } from '@features/assessment/constants';
import { useHomeExamStats, getLearningSlot } from '@features/home/model/useHomeExamStats';
import type { ExamSlotState, ExamSlotStatus, GroupWithExamState } from '@features/assessment/types';

const TableTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const TableScroll = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 14px ${({ theme }) => theme.spacing.md};
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  }

  th {
    color: ${({ theme }) => theme.colors.gray[500]};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
    white-space: nowrap;
  }

  td {
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const ClassName = styled.span`
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const ProgressRow = styled.div`
  display: grid;
  grid-template-columns: auto minmax(72px, 1fr) 38px;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  min-width: 220px;
`;

const StatusBadge = styled.span<{ $status: ExamSlotStatus }>`
  display: inline-flex;
  min-width: 54px;
  justify-content: center;
  padding: 4px 8px;
  color: ${({ theme, $status }) => {
    if ($status === 'completed') return theme.colors.success.dark;
    if ($status === 'in_progress') return theme.colors.warning.dark;
    return theme.colors.gray[500];
  }};
  background: ${({ theme, $status }) => {
    if ($status === 'completed') return theme.colors.success.light;
    if ($status === 'in_progress') return theme.colors.warning.light;
    return theme.colors.gray[100];
  }};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  white-space: nowrap;
`;

const Track = styled.div`
  height: 8px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.full};
`;

const Fill = styled.div<{ $rate: number; $status: ExamSlotStatus }>`
  width: ${({ $rate }) => `${$rate}%`};
  height: 100%;
  background: ${({ theme, $status }) =>
    $status === 'completed' ? theme.colors.success.main : theme.colors.primary[500]};
  border-radius: inherit;
`;

const Rate = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-align: right;
`;

const Count = styled.p`
  margin: 5px 0 0;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ActionButton = styled.button<{ $primary?: boolean }>`
  padding: 6px 8px;
  color: ${({ theme, $primary }) =>
    $primary ? theme.colors.primary[700] : theme.colors.gray[700]};
  background: ${({ theme, $primary }) =>
    $primary ? theme.colors.primary[50] : theme.colors.background.paper};
  border: 1px solid
    ${({ theme, $primary }) => ($primary ? theme.colors.primary[200] : theme.colors.gray[200])};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  white-space: nowrap;
  cursor: pointer;

  &:disabled {
    color: ${({ theme }) => theme.colors.gray[300]};
    background: ${({ theme }) => theme.colors.gray[50]};
    cursor: not-allowed;
  }
`;

const CenterBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
`;

const EmptyText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  padding: 48px 0;
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

const RoundProgress = ({ slot }: { slot?: ExamSlotState }) => {
  if (!slot) return <span>-</span>;
  const rate =
    slot.totalCount === 0 ? 0 : Math.round((slot.submittedCount / slot.totalCount) * 100);
  return (
    <div>
      <ProgressRow>
        <StatusBadge $status={slot.status}>{EXAM_STATUS_LABELS[slot.status]}</StatusBadge>
        <Track>
          <Fill $rate={rate} $status={slot.status} />
        </Track>
        <Rate>{rate}%</Rate>
      </ProgressRow>
      <Count>
        {slot.submittedCount} / {slot.totalCount}명
      </Count>
    </div>
  );
};

export const ExamStatusSection = () => {
  const navigate = useNavigate();
  const { groups, isLoading, error, refetch } = useHomeExamStats();

  const goToResult = (group: GroupWithExamState) =>
    navigate(`/exam/result${buildScopeQueryString({ level: 'class', classId: group.id })}`);
  const goToManagement = (group: GroupWithExamState) =>
    navigate(`/exam/management${buildScopeQueryString({ level: 'class', classId: group.id })}`);

  if (isLoading) {
    return (
      <Card>
        <CenterBox>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </CenterBox>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CenterBox style={{ flexDirection: 'column' }}>
          <EmptyText style={{ padding: 0 }}>검사 현황을 불러오지 못했습니다.</EmptyText>
          <RetryButton onClick={refetch}>
            <RefreshCw size={14} /> 다시 시도
          </RetryButton>
        </CenterBox>
      </Card>
    );
  }

  return (
    <Card>
      <TableTitle>검사 현황</TableTitle>
      {groups.length === 0 ? (
        <EmptyText>표시할 검사 현황이 없습니다.</EmptyText>
      ) : (
        <TableScroll>
          <Table>
            <thead>
              <tr>
                <th>반</th>
                <th>1차 응시율</th>
                <th>2차 응시율</th>
                <th>바로가기</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const round1 = getLearningSlot(group, 1);
                const round2 = getLearningSlot(group, 2);
                const hasCompleted =
                  round1?.status === 'completed' || round2?.status === 'completed';
                return (
                  <tr key={group.id}>
                    <td>
                      <ClassName>{group.name}</ClassName>
                    </td>
                    <td>
                      <RoundProgress slot={round1} />
                    </td>
                    <td>
                      <RoundProgress slot={round2} />
                    </td>
                    <td>
                      <Actions>
                        <ActionButton
                          $primary
                          disabled={!hasCompleted}
                          onClick={() => goToResult(group)}
                        >
                          결과보기
                        </ActionButton>
                        <ActionButton onClick={() => goToManagement(group)}>검사관리</ActionButton>
                        <ActionButton disabled title='준비 중'>
                          독려알림
                        </ActionButton>
                      </Actions>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableScroll>
      )}
    </Card>
  );
};
