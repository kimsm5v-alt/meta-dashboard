import styled from '@emotion/styled';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw } from 'lucide-react';
import { Card } from '@shared/components';
import { buildScopeQueryString } from '@shared/scope';
import { EXAM_STATUS_LABELS } from '@features/assessment/constants';
import { useHomeExamStats, getLearningSlot } from '@features/home/model/useHomeExamStats';
import type { ExamSlotState, ExamSlotStatus, GroupWithExamState } from '@features/assessment/types';

const Section = styled.section`
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  @media (min-width: ${({ theme }) => theme.breakpoints.xl}) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

type SummaryTone = 'default' | 'warning' | 'success' | 'error';

const SummaryCard = styled.div`
  padding: 20px;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const SummaryLabel = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const SummaryValue = styled.p<{ $tone: SummaryTone }>`
  margin: 0;
  color: ${({ theme, $tone }) => {
    if ($tone === 'warning') return theme.colors.warning.dark;
    if ($tone === 'success') return theme.colors.success.dark;
    if ($tone === 'error') return theme.colors.error.main;
    return theme.colors.text.primary;
  }};
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Unit = styled.span`
  margin-left: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

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
    white-space: nowrap;
  }

  th {
    color: ${({ theme }) => theme.colors.gray[500]};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  }

  td {
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }
`;

const ClassName = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const StatusBadge = styled.span<{ $status: ExamSlotStatus }>`
  display: inline-flex;
  min-width: 54px;
  justify-content: center;
  padding: 4px 8px;
  margin-right: ${({ theme }) => theme.spacing.sm};
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

const RoundCell = ({ slot }: { slot?: ExamSlotState }) => {
  if (!slot) return <span>-</span>;
  const rate =
    slot.totalCount === 0 ? 0 : Math.round((slot.submittedCount / slot.totalCount) * 100);
  return (
    <span>
      <StatusBadge $status={slot.status}>{EXAM_STATUS_LABELS[slot.status]}</StatusBadge>
      {rate}% ({slot.submittedCount}/{slot.totalCount}명)
    </span>
  );
};

export const ExamOverviewSection = () => {
  const navigate = useNavigate();
  const { groups, summary, isLoading, error, refetch } = useHomeExamStats();

  const goToResult = (group: GroupWithExamState) =>
    navigate(`/exam/result${buildScopeQueryString({ level: 'class', classId: group.id })}`);
  const goToManagement = (group: GroupWithExamState) =>
    navigate(`/exam/management${buildScopeQueryString({ level: 'class', classId: group.id })}`);

  if (isLoading) {
    return (
      <Section id='exam-overview'>
        <CenterBox>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </CenterBox>
      </Section>
    );
  }

  if (error) {
    return (
      <Section id='exam-overview'>
        <CenterBox style={{ flexDirection: 'column' }}>
          <EmptyText style={{ padding: 0 }}>검사 현황을 불러오지 못했습니다.</EmptyText>
          <RetryButton onClick={refetch}>
            <RefreshCw size={14} /> 다시 시도
          </RetryButton>
        </CenterBox>
      </Section>
    );
  }

  return (
    <Section id='exam-overview'>
      <SummaryGrid>
        <SummaryCard>
          <SummaryLabel>관리 중인 반</SummaryLabel>
          <SummaryValue $tone='default'>
            {summary.totalClasses}
            <Unit>개</Unit>
          </SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>진행 중 검사</SummaryLabel>
          <SummaryValue $tone='warning'>
            {summary.inProgressExams}
            <Unit>건</Unit>
          </SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>결과 확인 가능</SummaryLabel>
          <SummaryValue $tone='success'>
            {summary.completedExams}
            <Unit>건</Unit>
          </SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>미응시 학생</SummaryLabel>
          <SummaryValue $tone='error'>
            {summary.pendingStudents}
            <Unit>명</Unit>
          </SummaryValue>
        </SummaryCard>
      </SummaryGrid>

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
                  <th>액션</th>
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
                        <RoundCell slot={round1} />
                      </td>
                      <td>
                        <RoundCell slot={round2} />
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
                          <ActionButton onClick={() => goToManagement(group)}>
                            검사관리
                          </ActionButton>
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
    </Section>
  );
};
