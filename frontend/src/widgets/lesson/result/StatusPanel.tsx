/**
 * 학습현황 패널 — 숫자 타일 3개(이번 주 진행 / 진행 중 활동 / 미제출) +
 * 미제출 학생 태그 목록.
 * 학생을 누르면 아래 카드 그리드에서 해당 학생이 미제출인 카드에 테두리가 표시된다.
 *
 * - 이번 주 진행: useThisWeekCountQuery (openFrom/openTo 기준)
 * - 진행 중 활동: useRunningCountQuery (availability=OPEN 기준)
 * - 미제출 / 미제출 학생: /progress API 연동 보류 — 빈 상태 유지
 */
import styled from '@emotion/styled';
import { TrendingUp } from 'lucide-react';
import { useThisWeekCountQuery, useRunningCountQuery } from '@features/lesson';

interface StatusPanelProps {
  selected: string | null;
  onSelect: (name: string | null) => void;
}

const Panel = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius['2xl']};
`;

const PanelTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extraBold};
  letter-spacing: -0.02em;
`;

const TitleIcon = styled(TrendingUp)`
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.colors.primary[500]};
  flex-shrink: 0;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};
`;

const StatTile = styled.div<{ $hl?: boolean }>`
  padding: 14px ${({ theme }) => theme.spacing.md};
  background: ${({ theme, $hl }) => ($hl ? theme.colors.primary[50] : theme.colors.gray[50])};
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const StatLabel = styled.div`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const StatValue = styled.div<{ $hl?: boolean }>`
  margin-top: 4px;
  color: ${({ theme, $hl }) => ($hl ? theme.colors.primary[700] : theme.colors.text.primary)};
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extraBold};
  line-height: 1;
`;

const StatUnit = styled.span`
  margin-left: 4px;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Divider = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
  padding-top: ${({ theme }) => theme.spacing.sm};
`;

const StudentHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 6px;
`;

const StudentLabel = styled.span`
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const StudentCount = styled.span`
  color: ${({ theme }) => theme.colors.warning.dark};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extraBold};
`;

const StudentHint = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 6px;
  height: 58px;
  overflow-y: auto;
  padding-right: 4px;
`;

const Tag = styled.button<{ $on: boolean }>`
  flex-shrink: 0;
  height: fit-content;
  padding: 4px 10px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme, $on }) => ($on ? theme.colors.warning.main : theme.colors.warning.light)};
  color: ${({ theme, $on }) => ($on ? '#fff' : theme.colors.warning.dark)};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};
  outline: ${({ $on, theme }) => ($on ? `2px solid ${theme.colors.warning.light}` : 'none')};

  &:hover {
    background: ${({ theme, $on }) =>
      $on ? theme.colors.warning.main : theme.colors.warning.dark};
    color: #fff;
  }
`;

const TagCount = styled.span<{ $on: boolean }>`
  margin-left: 4px;
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ $on }) => ($on ? 'rgba(255,255,255,0.8)' : 'inherit')};
`;

const EmptyText = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const AllSubmittedText = styled.span`
  color: ${({ theme }) => theme.colors.success.dark};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

export const StatusPanel = ({ selected, onSelect }: StatusPanelProps) => {
  const { data: thisWeekCount, isPending: weekPending } = useThisWeekCountQuery();
  const { data: runningCount, isPending: runningPending } = useRunningCountQuery();

  // 미제출 학생 목록 — /progress API 연동 보류, 빈 상태 유지
  const students: Array<{ name: string; n: number }> = [];
  const missingCount = 0;

  return (
    <Panel>
      <PanelTitle>
        <TitleIcon />
        전체 학습현황
      </PanelTitle>

      <StatGrid>
        <StatTile>
          <StatLabel>이번 주 진행</StatLabel>
          <StatValue>
            {weekPending ? '--' : (thisWeekCount ?? 0)}
            <StatUnit>건</StatUnit>
          </StatValue>
        </StatTile>
        <StatTile $hl>
          <StatLabel>진행 중 활동</StatLabel>
          <StatValue $hl>
            {runningPending ? '--' : (runningCount ?? 0)}
            <StatUnit>건</StatUnit>
          </StatValue>
        </StatTile>
        <StatTile>
          <StatLabel>미제출</StatLabel>
          <StatValue>
            {missingCount}
            <StatUnit>건</StatUnit>
          </StatValue>
        </StatTile>
      </StatGrid>

      <Divider>
        <StudentHeader>
          <StudentLabel>미제출 학생</StudentLabel>
          <StudentCount>{students.length}명</StudentCount>
          <StudentHint>· 진행 중인 활동 기준</StudentHint>
          {students.length > 0 && (
            <StudentHint>이름을 누르면 진행중 목록에서 해당 활동이 표시됩니다</StudentHint>
          )}
        </StudentHeader>

        <TagList>
          {(runningCount ?? 0) === 0 && !runningPending ? (
            <EmptyText>진행 중인 활동이 없습니다.</EmptyText>
          ) : students.length === 0 ? (
            <AllSubmittedText>진행 중인 활동을 모두 제출했어요.</AllSubmittedText>
          ) : (
            students.map((s) => {
              const on = selected === s.name;
              return (
                <Tag key={s.name} $on={on} onClick={() => onSelect(on ? null : s.name)}>
                  {s.name}
                  {s.n > 1 && <TagCount $on={on}>{s.n}</TagCount>}
                </Tag>
              );
            })
          )}
        </TagList>
      </Divider>
    </Panel>
  );
};
