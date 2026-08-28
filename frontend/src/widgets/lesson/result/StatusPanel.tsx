/**
 * 학습현황 패널 — 숫자 타일 3개(이번 주 진행 / 진행 중 활동 / 미제출) +
 * 미제출 학생 태그 목록.
 * 학생을 누르면 아래 카드 그리드에서 해당 학생이 미제출인 카드에 테두리가 표시된다.
 *
 * - 이번 주 진행: useThisWeekCountQuery (openFrom/openTo + optFilter)
 * - 진행 중 활동: useRunningCountQuery (availability=OPEN + optFilter)
 * - 미제출: GET /activities/progress 묶음 조회
 */
import styled from '@emotion/styled';
import { TrendingUp } from 'lucide-react';
import {
  useActivitiesProgressBundleQuery,
  useAssigneeDirectoryQuery,
  useRunningCountQuery,
  useThisWeekCountQuery,
} from '@features/lesson';

interface StatusPanelProps {
  classId: string;
  className?: string;
  selected: string | null;
  onSelect: (participant: string | null, missingActivityIds: string[]) => void;
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

export const StatusPanel = ({ classId, className, selected, onSelect }: StatusPanelProps) => {
  const { data: thisWeekCount, isPending: weekPending } = useThisWeekCountQuery(classId);
  const { data: runningCount, isPending: runningPending } = useRunningCountQuery(classId);
  const bundleQuery = useActivitiesProgressBundleQuery(classId);
  const students = bundleQuery.data?.notSubmittedStudents ?? [];
  const directoryQuery = useAssigneeDirectoryQuery(students.length > 0);
  const directory = directoryQuery.data;
  const missingCount = bundleQuery.data?.notSubmittedStudentCount;
  const title = className ? `${className} 학습현황` : '학습현황';

  return (
    <Panel>
      <PanelTitle>
        <TitleIcon />
        {title}
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
            {bundleQuery.isPending ? '--' : (missingCount ?? '–')}
            {missingCount != null ? <StatUnit>건</StatUnit> : null}
          </StatValue>
        </StatTile>
      </StatGrid>

      <Divider>
        <StudentHeader>
          <StudentLabel>미제출 학생</StudentLabel>
          <StudentCount>
            {missingCount != null ? `${missingCount}명` : `${students.length}명`}
          </StudentCount>
          <StudentHint>· 진행 중인 활동 기준</StudentHint>
          {students.length > 0 && (
            <StudentHint>이름을 누르면 진행중 목록에서 해당 활동이 표시됩니다</StudentHint>
          )}
        </StudentHeader>

        <TagList>
          {bundleQuery.isError ? (
            <EmptyText>
              {bundleQuery.error instanceof Error
                ? bundleQuery.error.message
                : '미제출 학생을 불러오지 못했습니다.'}
            </EmptyText>
          ) : bundleQuery.isPending || runningPending ? (
            <EmptyText>불러오는 중...</EmptyText>
          ) : (runningCount ?? 0) === 0 ? (
            <EmptyText>진행 중인 활동이 없습니다.</EmptyText>
          ) : students.length === 0 ? (
            <AllSubmittedText>진행 중인 활동을 모두 제출했어요.</AllSubmittedText>
          ) : (
            students.map((s) => {
              const on = selected === s.participant;
              const info = directory?.get(s.participant);
              const name = info?.name || s.displayName?.trim() || s.participant;
              const n = s.missingActivityIds.length;
              return (
                <Tag
                  key={s.participant}
                  $on={on}
                  onClick={() =>
                    onSelect(on ? null : s.participant, on ? [] : s.missingActivityIds)
                  }
                >
                  {name}
                  {n > 1 && <TagCount $on={on}>{n}</TagCount>}
                </Tag>
              );
            })
          )}
        </TagList>
      </Divider>
    </Panel>
  );
};
