import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { Bell, Check, Clock, Search } from 'lucide-react';

import { EXAM_SLOTS, EXAM_STATUS_LABELS } from '../constants';
import { calculateProgress, getSlotStatus } from '../utils';
import type {
  ExamSlotDefinition,
  ExamSlotState,
  ExamSlotStatus,
  GroupMember,
  GroupWithExamState,
  PaperIdx,
} from '../types';

interface ExamClassManagementViewProps {
  group: GroupWithExamState;
  members: GroupMember[];
  paperIdx: PaperIdx;
  canSwitchPaper: boolean;
  onPaperChange: (paperIdx: PaperIdx) => void;
  onStartExam: (slotId: string) => void;
  onEndExam: (slotId: string, dgnssId: number) => void;
  onCancelExam: (slotId: string, dgnssId: number) => void;
  onViewResult: (slotId: string, dgnssId: number) => void;
  onRestartExam: (slotId: string, dgnssId: number) => void;
  isMembersLoading?: boolean;
  isActionPending?: boolean;
}

type StudentFilter = 'all' | 'submitted' | 'pending';

const Page = styled.section`
  padding: ${({ theme }) => `${theme.spacing.md} 20px 0`};
`;

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: 18px;
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
`;

const Description = styled.p`
  margin: 6px 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const PaperSwitch = styled.div`
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const PaperButton = styled.button<{ $active: boolean; $paperIdx: PaperIdx }>`
  padding: 8px 13px;
  color: ${({ $active, $paperIdx, theme }) =>
    $active
      ? $paperIdx === '2'
        ? theme.colors.primary[1000]
        : theme.colors.primary[600]
      : theme.colors.gray[500]};
  background: ${({ $active, theme }) => ($active ? theme.colors.background.paper : 'transparent')};
  border: 0;
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ $active, theme }) => ($active ? theme.shadows.sm : 'none')};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme, $active }) =>
    $active ? theme.typography.fontWeight.bold : theme.typography.fontWeight.medium};
  cursor: pointer;
`;

const RoundTabs = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  max-width: 560px;
  gap: 6px;
  padding: 6px;
  margin-bottom: 16px;
  background: #f0eef6;
  border-radius: 14px;
`;

const RoundTab = styled.button<{ $active: boolean }>`
  min-height: 52px;
  padding: 10px 18px;
  color: ${({ $active }) => ($active ? '#6b46f2' : '#75717f')};
  background: ${({ $active }) => ($active ? '#fff' : 'transparent')};
  border: 0;
  border-radius: 10px;
  box-shadow: ${({ $active }) => ($active ? '0 1px 4px rgba(20, 10, 60, 0.1)' : 'none')};
  font-size: 15px;
  font-weight: ${({ $active }) => ($active ? 800 : 600)};
  cursor: pointer;

  &:disabled {
    opacity: 0.48;
    cursor: not-allowed;
  }
`;

const TabContent = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
`;

const StatusBadge = styled.span<{ $status: ExamSlotStatus }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  color: ${({ $status }) => {
    if ($status === 'completed') return '#12915c';
    if ($status === 'in_progress') return '#c47b1d';
    return '#8a8798';
  }};
  background: ${({ $status }) => {
    if ($status === 'completed') return '#e6f7ee';
    if ($status === 'in_progress') return '#fff3dd';
    return '#f0eef6';
  }};
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
`;

const Panel = styled.section`
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid #ececf1;
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 15px 20px;
  border-bottom: 1px solid #ececf1;

  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const Summary = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
`;

const PanelTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 17px;
  font-weight: 800;
`;

const Divider = styled.span`
  width: 1px;
  height: 22px;
  background: ${({ theme }) => theme.colors.gray[200]};
`;

const ProgressRing = styled.div<{ $progress: number; $accent: string }>`
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  background: conic-gradient(
    ${({ $accent }) => $accent} ${({ $progress }) => $progress}%,
    #e5e7eb 0
  );
  border-radius: 50%;

  &::before {
    grid-area: 1 / 1;
    width: 38px;
    height: 38px;
    content: '';
    background: #fff;
    border-radius: 50%;
  }

  span {
    z-index: 1;
    grid-area: 1 / 1;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    font-weight: 800;
  }
`;

const Counts = styled.div`
  display: flex;
  gap: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  b {
    color: ${({ theme }) => theme.colors.text.primary};
  }

  .submitted {
    color: #6b46f2;
  }

  .pending {
    color: #e8890c;
  }
`;

const Dates = styled.div`
  margin-top: 7px;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
`;

const Button = styled.button<{ $primary?: boolean }>`
  min-width: 108px;
  padding: 9px 16px;
  color: ${({ $primary }) => ($primary ? '#fff' : '#55525f')};
  background: ${({ $primary }) => ($primary ? '#6b46f2' : '#fff')};
  border: 1px solid ${({ $primary }) => ($primary ? '#6b46f2' : '#e3e1ec')};
  border-radius: 9px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    color: #a09db0;
    background: #e3e1ec;
    border-color: #e3e1ec;
    cursor: not-allowed;
  }
`;

const PendingBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  color: #c47b1d;
  background: #fff8ef;
  border-bottom: 1px solid #fdeeea;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: 600;
`;

const PendingStudents = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
`;

const PendingChip = styled.span`
  padding: 4px 8px;
  color: #b47722;
  background: #fff;
  border: 1px solid #f8ead5;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const NotificationButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 11px;
  color: #a09db0;
  background: #e3e1ec;
  border: 0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: not-allowed;
`;

const TableToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const TableSectionTitle = styled.h2`
  margin: 0;
  padding: 17px 20px 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 16px;
  font-weight: 800;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 3px;
  padding: 3px;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.md};
`;

const FilterButton = styled.button<{ $active: boolean }>`
  padding: 6px 11px;
  color: ${({ $active, theme }) => ($active ? theme.colors.text.primary : theme.colors.gray[500])};
  background: ${({ $active }) => ($active ? '#fff' : 'transparent')};
  border: 0;
  border-radius: 6px;
  box-shadow: ${({ $active }) => ($active ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none')};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
`;

const SearchBox = styled.label`
  display: flex;
  align-items: center;
  width: 230px;
  gap: 7px;
  padding: 7px 10px;
  color: ${({ theme }) => theme.colors.gray[400]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.md};

  input {
    width: 100%;
    color: ${({ theme }) => theme.colors.text.primary};
    background: transparent;
    border: 0;
    outline: 0;
    font-size: 13px;
  }
`;

const TableScroll = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 12px 20px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
    font-size: 13px;
    text-align: left;
  }

  th {
    color: ${({ theme }) => theme.colors.gray[500]};
    background: ${({ theme }) => theme.colors.gray[50]};
    font-weight: 600;
  }

  td {
    color: ${({ theme }) => theme.colors.text.secondary};
  }

  tbody tr:last-of-type td {
    border-bottom: 0;
  }
`;

const NumberCircle = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: ${({ theme }) => theme.colors.gray[600]};
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 50%;
  font-weight: 600;
`;

const SubmissionBadge = styled.span<{ $submitted: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 9px;
  color: ${({ $submitted }) => ($submitted ? '#2563eb' : '#64748b')};
  background: ${({ $submitted }) => ($submitted ? '#dbeafe' : '#f1f5f9')};
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
`;

const EmptyRow = styled.td`
  padding: 42px 20px !important;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center !important;
`;

const formatDateTime = (value?: Date) => {
  if (!value) return null;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(value);
};

const getMemberName = (member: GroupMember) =>
  member.maskedReason && member.maskedReason !== 'NONE' ? '****' : member.name;

export const ExamClassManagementView = ({
  group,
  members,
  paperIdx,
  canSwitchPaper,
  onPaperChange,
  onStartExam,
  onEndExam,
  onCancelExam,
  onViewResult,
  onRestartExam,
  isMembersLoading = false,
  isActionPending = false,
}: ExamClassManagementViewProps) => {
  const [selectedRound, setSelectedRound] = useState<1 | 2>(1);
  const [filter, setFilter] = useState<StudentFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const definitions = EXAM_SLOTS.filter((slot) => slot.paperIdx === paperIdx);
  const selectedDefinition =
    definitions.find((slot) => slot.round === selectedRound) ?? definitions[0];
  const selectedSlot = group.examSlots.find((slot) => slot.slotId === selectedDefinition.id);
  const status = getSlotStatus(selectedDefinition.id, selectedSlot, group.examSlots);
  const progress = calculateProgress(
    selectedSlot?.submittedCount ?? 0,
    selectedSlot?.totalCount ?? 0,
  );
  const pendingCount = Math.max(
    0,
    (selectedSlot?.totalCount ?? 0) - (selectedSlot?.submittedCount ?? 0),
  );
  const accent = paperIdx === '2' ? '#009f88' : '#6b46f2';
  const activeMembers = useMemo(
    () => members.filter((member) => member.status === 'active'),
    [members],
  );
  const missingIdentifiers = new Set(selectedSlot?.notSubmittedStudents ?? []);
  const hasStarted = status === 'in_progress' || status === 'completed';
  const hasIdentifiableSubmissionState = missingIdentifiers.size > 0 || pendingCount === 0;
  const studentRows = activeMembers.map((member, index) => {
    const isMissing =
      missingIdentifiers.has(member.stdtId) ||
      missingIdentifiers.has(member.name) ||
      missingIdentifiers.has(getMemberName(member));
    return {
      member,
      number: member.memberNo ?? index + 1,
      name: getMemberName(member),
      submitted: hasStarted && hasIdentifiableSubmissionState && !isMissing,
    };
  });
  const filteredRows = studentRows.filter((row) => {
    if (filter === 'submitted' && !row.submitted) return false;
    if (filter === 'pending' && row.submitted) return false;
    const term = searchTerm.trim().toLocaleLowerCase('ko-KR');
    return (
      !term ||
      row.name.toLocaleLowerCase('ko-KR').includes(term) ||
      String(row.number).includes(term)
    );
  });
  const pendingRows = studentRows.filter((row) => !row.submitted);
  const startedAt = formatDateTime(selectedSlot?.startDate);
  const endedAt = formatDateTime(selectedSlot?.endDate);

  const renderActions = (slotDef: ExamSlotDefinition, slot?: ExamSlotState) => {
    const dgnssId = slot?.dgnssId;
    if (status === 'not_started') {
      return (
        <Button $primary onClick={() => onStartExam(slotDef.id)} disabled={isActionPending}>
          검사 시작
        </Button>
      );
    }
    if (status === 'locked') {
      return <Button disabled>검사 시작</Button>;
    }
    if (status === 'in_progress') {
      return (
        <>
          <Button
            $primary
            onClick={() => dgnssId && onEndExam(slotDef.id, dgnssId)}
            disabled={isActionPending || !dgnssId || (slot?.submittedCount ?? 0) === 0}
          >
            검사 종료
          </Button>
          <Button
            onClick={() => dgnssId && onCancelExam(slotDef.id, dgnssId)}
            disabled={isActionPending || !dgnssId}
          >
            검사 취소
          </Button>
        </>
      );
    }
    return (
      <>
        <Button
          $primary
          onClick={() => dgnssId && onViewResult(slotDef.id, dgnssId)}
          disabled={!dgnssId}
        >
          결과 보기
        </Button>
        <Button
          onClick={() => dgnssId && onRestartExam(slotDef.id, dgnssId)}
          disabled={isActionPending || !dgnssId}
        >
          추가 진행
        </Button>
      </>
    );
  };

  return (
    <Page>
      <Header>
        <div>
          <Title>{group.name}</Title>
          <Description>
            {[group.schoolName, `${group.grade}학년`, `${group.classNumber}반`]
              .filter(Boolean)
              .join(' · ')}
          </Description>
        </div>
        {canSwitchPaper && (
          <PaperSwitch aria-label='검사 유형 선택'>
            <PaperButton
              $active={paperIdx === '1'}
              $paperIdx='1'
              onClick={() => onPaperChange('1')}
            >
              학습종합검사
            </PaperButton>
            <PaperButton
              $active={paperIdx === '2'}
              $paperIdx='2'
              onClick={() => onPaperChange('2')}
            >
              자기조절학습검사
            </PaperButton>
          </PaperSwitch>
        )}
      </Header>

      <RoundTabs aria-label='검사 회차 선택'>
        {definitions.map((definition) => {
          const slot = group.examSlots.find((item) => item.slotId === definition.id);
          const tabStatus = getSlotStatus(definition.id, slot, group.examSlots);
          const tabProgress = calculateProgress(slot?.submittedCount ?? 0, slot?.totalCount ?? 0);
          return (
            <RoundTab
              key={definition.id}
              $active={definition.round === selectedRound}
              disabled={tabStatus === 'locked'}
              onClick={() => setSelectedRound(definition.round)}
            >
              <TabContent>
                {definition.round}차 검사
                <StatusBadge $status={tabStatus}>
                  {tabStatus === 'locked' ? '미시작' : EXAM_STATUS_LABELS[tabStatus]}
                </StatusBadge>
                {(tabStatus === 'in_progress' || tabStatus === 'completed') && (
                  <b>{tabProgress}%</b>
                )}
              </TabContent>
            </RoundTab>
          );
        })}
      </RoundTabs>

      <Panel>
        <PanelHeader>
          <div>
            <Summary>
              <PanelTitle>{selectedRound}차 검사 관리</PanelTitle>
              <StatusBadge $status={status}>{EXAM_STATUS_LABELS[status]}</StatusBadge>
              <Divider />
              <ProgressRing $progress={progress} $accent={accent}>
                <span>{progress}%</span>
              </ProgressRing>
              <Counts>
                <span>
                  전체 <b>{selectedSlot?.totalCount ?? activeMembers.length}명</b>
                </span>
                <span className='submitted'>
                  제출 <b>{selectedSlot?.submittedCount ?? 0}명</b>
                </span>
                <span className='pending'>
                  미제출 <b>{hasStarted ? pendingCount : activeMembers.length}명</b>
                </span>
              </Counts>
            </Summary>
            {(startedAt || endedAt) && (
              <Dates>
                {startedAt && <span>시작: {startedAt}</span>}
                {endedAt && <span> · 종료: {endedAt}</span>}
              </Dates>
            )}
          </div>
          <Actions>{renderActions(selectedDefinition, selectedSlot)}</Actions>
        </PanelHeader>

        {status === 'in_progress' && pendingCount > 0 && (
          <PendingBanner>
            <PendingStudents>
              <span>미제출 학생 {pendingCount}명</span>
              {pendingRows.map((row) => (
                <PendingChip key={row.member.id}>
                  {row.number}. {row.name}
                </PendingChip>
              ))}
            </PendingStudents>
            <NotificationButton disabled title='미제출 학생 알림 API 준비 중'>
              <Bell size={14} /> 알림 전송
            </NotificationButton>
          </PendingBanner>
        )}

        <TableSectionTitle>학생 제출 현황</TableSectionTitle>
        <TableToolbar>
          <FilterGroup>
            {(
              [
                ['all', '전체'],
                ['submitted', '제출'],
                ['pending', '미제출'],
              ] as const
            ).map(([value, label]) => (
              <FilterButton key={value} $active={filter === value} onClick={() => setFilter(value)}>
                {label}
              </FilterButton>
            ))}
          </FilterGroup>
          <SearchBox>
            <Search size={14} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder='이름 또는 번호 검색...'
            />
          </SearchBox>
        </TableToolbar>

        <TableScroll>
          <Table>
            <thead>
              <tr>
                <th>번호 ↕</th>
                <th>이름 ↕</th>
                <th>제출상태 ↕</th>
                <th>제출일시 ↕</th>
              </tr>
            </thead>
            <tbody>
              {isMembersLoading ? (
                <tr>
                  <EmptyRow colSpan={4}>학생 목록을 불러오는 중입니다.</EmptyRow>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <EmptyRow colSpan={4}>해당 조건에 맞는 학생이 없습니다.</EmptyRow>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.member.id}>
                    <td>
                      <NumberCircle>{row.number}</NumberCircle>
                    </td>
                    <td>{row.name}</td>
                    <td>
                      <SubmissionBadge $submitted={row.submitted}>
                        {row.submitted ? <Check size={13} /> : <Clock size={13} />}
                        {row.submitted ? '제출 완료' : '미제출'}
                      </SubmissionBadge>
                    </td>
                    <td>-</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </TableScroll>
      </Panel>
    </Page>
  );
};
