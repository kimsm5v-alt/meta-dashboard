import styled from '@emotion/styled';

import { EXAM_STATUS_LABELS } from '../constants';
import type { ExamSlotState, ExamSlotStatus, GroupWithExamState } from '../types';

interface ExamManagementOverviewProps {
  groups: GroupWithExamState[];
  onManageExam: (groupId: string) => void;
  onViewResult: (groupId: string) => void;
}

interface OverviewRow {
  group: GroupWithExamState;
  round1?: ExamSlotState;
  round2?: ExamSlotState;
}

type SummaryTone = 'default' | 'warning' | 'success' | 'error';

const Page = styled.section`
  padding: ${({ theme }) => theme.spacing.md} 20px 0;
`;

const Header = styled.header`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
`;

const Description = styled.p`
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
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

const SummaryCard = styled.article`
  min-width: 0;
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
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
`;

const Unit = styled.span`
  margin-left: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const SummaryDescription = styled.p`
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const TableCard = styled.section`
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const TableTitle = styled.h2`
  margin: 0;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const TableScroll = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;

  th:nth-of-type(1) {
    width: 12%;
  }

  th:nth-of-type(2) {
    width: 17%;
  }

  th:nth-of-type(3),
  th:nth-of-type(4) {
    width: 22%;
  }

  th:nth-of-type(5) {
    width: 27%;
  }

  th,
  td {
    padding: 14px ${({ theme }) => theme.spacing.md};
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  }

  th {
    color: ${({ theme }) => theme.colors.gray[500]};
    background: ${({ theme }) => theme.colors.gray[50]};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  }

  td {
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  }

  tbody tr:last-of-type td {
    border-bottom: 0;
  }

  tbody tr:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

const ClassName = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  white-space: nowrap;
`;

const ProgressRow = styled.div`
  display: grid;
  grid-template-columns: auto 38px;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  @media (min-width: ${({ theme }) => theme.breakpoints.xl}) {
    grid-template-columns: auto minmax(72px, 1fr) 38px;
  }
`;

const StatusBadge = styled.span<{ $status: ExamSlotStatus }>`
  display: inline-flex;
  justify-content: center;
  min-width: 54px;
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
  grid-column: 1 / -1;
  height: 8px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.full};

  @media (min-width: ${({ theme }) => theme.breakpoints.xl}) {
    grid-column: auto;
  }
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
  text-align: right;
`;

const Actions = styled.div`
  display: flex;
  justify-content: center;
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
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${({ theme, $primary }) =>
      $primary ? theme.colors.primary[100] : theme.colors.gray[50]};
  }

  &:disabled {
    color: ${({ theme }) => theme.colors.gray[300]};
    background: ${({ theme }) => theme.colors.gray[50]};
    cursor: not-allowed;
  }
`;

const EmptyRow = styled.td`
  padding: 48px 24px !important;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center !important;
`;

const getRate = (slot?: ExamSlotState): number => {
  if (!slot || slot.totalCount === 0) return 0;
  return Math.round((slot.submittedCount / slot.totalCount) * 100);
};

const getLearningSlot = (group: GroupWithExamState, round: 1 | 2) =>
  group.examSlots.find((slot) => slot.slotId === (round === 1 ? 'L1' : 'L2'));

const RoundProgress = ({ slot }: { slot?: ExamSlotState }) => {
  if (!slot) return <span>-</span>;

  const rate = getRate(slot);
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

export const ExamManagementOverview = ({
  groups,
  onManageExam,
  onViewResult,
}: ExamManagementOverviewProps) => {
  const rows: OverviewRow[] = groups.map((group) => ({
    group,
    round1: getLearningSlot(group, 1),
    round2: getLearningSlot(group, 2),
  }));
  const learningSlots = rows.flatMap(({ round1, round2 }) =>
    [round1, round2].filter((slot): slot is ExamSlotState => slot !== undefined),
  );
  const summary = {
    totalClasses: groups.length,
    inProgressExams: learningSlots.filter((slot) => slot.status === 'in_progress').length,
    completedExams: learningSlots.filter((slot) => slot.status === 'completed').length,
    pendingStudents: learningSlots
      .filter((slot) => slot.status === 'in_progress')
      .reduce((total, slot) => total + Math.max(slot.totalCount - slot.submittedCount, 0), 0),
  };

  return (
    <Page>
      <Header>
        <Title>검사관리</Title>
        <Description>반별 검사 현황을 확인하고 관리할 수 있습니다.</Description>
      </Header>

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
          <SummaryDescription>현재 응시 진행 중</SummaryDescription>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>결과 확인 가능</SummaryLabel>
          <SummaryValue $tone='success'>
            {summary.completedExams}
            <Unit>건</Unit>
          </SummaryValue>
          <SummaryDescription>결과보기에서 확인</SummaryDescription>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>미응시 학생</SummaryLabel>
          <SummaryValue $tone='error'>
            {summary.pendingStudents}
            <Unit>명</Unit>
          </SummaryValue>
          <SummaryDescription>응시 독려 필요</SummaryDescription>
        </SummaryCard>
      </SummaryGrid>

      <TableCard>
        <TableTitle>검사 현황</TableTitle>
        <TableScroll>
          <Table>
            <thead>
              <tr>
                <th>반</th>
                <th>검사지</th>
                <th>1차 응시율</th>
                <th>2차 응시율</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <EmptyRow colSpan={5}>표시할 검사 현황이 없습니다.</EmptyRow>
                </tr>
              ) : (
                rows.map(({ group, round1, round2 }) => {
                  const hasCompleted =
                    round1?.status === 'completed' || round2?.status === 'completed';
                  return (
                    <tr key={group.id}>
                      <td>
                        <ClassName>{group.name}</ClassName>
                      </td>
                      <td>학습종합검사</td>
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
                            onClick={() => onViewResult(group.id)}
                          >
                            결과보기
                          </ActionButton>
                          <ActionButton onClick={() => onManageExam(group.id)}>
                            검사관리
                          </ActionButton>
                        </Actions>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </TableScroll>
      </TableCard>
    </Page>
  );
};
