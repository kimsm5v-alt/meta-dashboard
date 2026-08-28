import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { Clock } from 'lucide-react';
import { Loading } from '@shared/ui/Loading';
import type { ActivityItem, ActivityParticipationRow, AssigneeNameInfo } from '@features/lesson';
import {
  articleTypeToNature,
  cellFromParticipationItem,
  isNotSubmittedError,
  participationItemOf,
  sortActivityItems,
  summarizeParticipation,
  useActivityParticipationsQuery,
  useAssigneeDirectoryQuery,
  useCmsArticleMapQuery,
  useTeacherParticipationQuery,
} from '@features/lesson';
import { ResponseGrid } from './ResponseGrid';
import type { GridItem } from './ResponseGrid';
import { ParticipationStatusBadge } from './ReportBadge';

interface StudentTabProps {
  activityId: string;
  items: ActivityItem[];
}

const Empty = styled.div`
  margin-top: 20px;
  padding: 64px 0;
  border: 1px dashed ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.gray[50]};
  text-align: center;
`;

const EmptyIcon = styled(Clock)`
  display: block;
  width: 32px;
  height: 32px;
  margin: 0 auto;
  color: ${({ theme }) => theme.colors.gray[300]};
`;

const EmptyText = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const LoadingBox = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 64px 0;
`;

const ErrorText = styled.div`
  margin-top: 20px;
  padding: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.error.main};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: 20px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 260px 1fr;
  }
`;

const List = styled.div`
  display: flex;
  max-height: 600px;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const ListHead = styled.div`
  padding: 6px ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const ListCount = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const StudentBtn = styled.button<{ $on: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: ${({ theme }) => theme.spacing.sm};
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme, $on }) => ($on ? theme.colors.primary[50] : 'transparent')};
  text-align: left;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme, $on }) => ($on ? theme.colors.primary[50] : theme.colors.gray[50])};
  }
`;

const No = styled.span`
  flex: none;
  width: 20px;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-variant-numeric: tabular-nums;
  text-align: right;
`;

const Name = styled.span`
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.gray[800]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Score = styled.span`
  flex: none;
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-variant-numeric: tabular-nums;
`;

const DetailCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Card = styled.div`
  padding: 20px;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius['2xl']};
`;

const DetailHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: 12px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extraBold};
`;

const HeadNo = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const TileGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const Tile = styled.div`
  padding: 12px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const TileLabel = styled.div`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const TileValue = styled.div`
  margin-top: 2px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extraBold};
`;

const TileSub = styled.div`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const SectionTitle = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.gray[700]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Count = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const Dash = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
`;

type StudentRow = {
  participant: string;
  name: string;
  memberNo?: number;
  totalScore?: number | null;
  status: ActivityParticipationRow['status'];
  participationId?: string;
};

const rowName = (
  row: ActivityParticipationRow,
  directory: Map<string, AssigneeNameInfo> | undefined,
): string => {
  const info = directory?.get(row.participant);
  if (info?.name) return info.name;
  const displayName = row.displayName?.trim();
  if (displayName) return displayName;
  return row.participant;
};

export const StudentTab = ({ activityId, items }: StudentTabProps) => {
  const participationsQuery = useActivityParticipationsQuery(activityId);
  const rows = useMemo(() => participationsQuery.data ?? [], [participationsQuery.data]);
  const directoryQuery = useAssigneeDirectoryQuery(rows.length > 0);
  const directory = directoryQuery.data;

  const students = useMemo<StudentRow[]>(() => {
    const mapped = rows.map((row) => {
      const info = directory?.get(row.participant);
      return {
        participant: row.participant,
        name: rowName(row, directory),
        memberNo: info?.memberNo,
        totalScore: row.totalScore,
        status: row.status,
        participationId: row.participationId,
      };
    });
    return mapped.sort((a, b) => {
      const an = a.memberNo ?? Number.MAX_SAFE_INTEGER;
      const bn = b.memberNo ?? Number.MAX_SAFE_INTEGER;
      if (an !== bn) return an - bn;
      return a.name.localeCompare(b.name, 'ko');
    });
  }, [rows, directory]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const curId = students.some((s) => s.participant === selectedId)
    ? (selectedId as string)
    : (students[0]?.participant ?? '');
  const cur = students.find((s) => s.participant === curId);

  const participationId = cur?.status === 'NOT_STARTED' ? undefined : cur?.participationId;
  const participationQuery = useTeacherParticipationQuery(activityId, participationId);
  const participation =
    participationQuery.isError && isNotSubmittedError(participationQuery.error)
      ? undefined
      : participationQuery.data;
  const summary = summarizeParticipation(participation);

  const activityItems = useMemo(() => sortActivityItems(items), [items]);
  const articleIds = useMemo(
    () => activityItems.map((item) => item.lcmsArticleId),
    [activityItems],
  );
  const { map: articleMap } = useCmsArticleMapQuery(articleIds);

  const gridItems: GridItem[] = activityItems.map((item) => {
    const article = articleMap.get(item.lcmsArticleId);
    const nature = articleTypeToNature(article?.articleType);
    const name = article?.name?.trim() || item.lcmsArticleId;
    const pItem = participationItemOf(participation, item.activityItemId);
    return {
      key: item.activityItemId,
      title: `${item.seq}. ${name}`,
      nature,
      mode: 'plain',
      cell: cellFromParticipationItem(pItem),
      showNature: Boolean(nature),
    };
  });

  if (participationsQuery.isPending) {
    return (
      <LoadingBox role='status' aria-busy='true'>
        <Loading size='md' text='불러오는 중...' />
      </LoadingBox>
    );
  }

  if (participationsQuery.isError) {
    return (
      <ErrorText role='alert'>
        {participationsQuery.error instanceof Error
          ? participationsQuery.error.message
          : '학생 명단을 불러오지 못했습니다.'}
      </ErrorText>
    );
  }

  if (students.length === 0) {
    return (
      <Empty>
        <EmptyIcon />
        <EmptyText>아직 참여한 학생이 없습니다.</EmptyText>
      </Empty>
    );
  }

  return (
    <Layout>
      <List>
        <ListHead>
          참여 학생 <ListCount>({students.length})</ListCount>
        </ListHead>
        {students.map((s) => {
          const on = s.participant === curId;
          return (
            <StudentBtn
              key={s.participant}
              type='button'
              $on={on}
              onClick={() => setSelectedId(s.participant)}
            >
              <No>{s.memberNo ?? ''}</No>
              <Name>{s.name}</Name>
              <Score>{s.totalScore == null ? '–' : s.totalScore}</Score>
              <ParticipationStatusBadge status={s.status} />
            </StudentBtn>
          );
        })}
      </List>
      <DetailCol>
        <Card>
          <DetailHead>
            {cur?.memberNo != null ? <HeadNo>{cur.memberNo}.</HeadNo> : null}
            {cur?.name}
            {cur ? <ParticipationStatusBadge status={cur.status} /> : null}
          </DetailHead>
          <TileGrid>
            <Tile>
              <TileLabel>활동 페이지</TileLabel>
              <TileValue>
                {participation ? `${summary.answered}/${summary.total} p` : <Dash>–</Dash>}
              </TileValue>
            </Tile>
            <Tile>
              <TileLabel>정답률 / 맞춘 문제</TileLabel>
              <TileValue>{summary.hasGraded ? `${summary.rate}%` : <Dash>–</Dash>}</TileValue>
              {summary.hasGraded ? (
                <TileSub>
                  {summary.correctN}/{summary.gradedN}개
                </TileSub>
              ) : null}
            </Tile>
          </TileGrid>
        </Card>
        <Card>
          <SectionTitle>
            페이지별 상세 <Count>({gridItems.length})</Count>
          </SectionTitle>
          <ResponseGrid items={gridItems} showSummary={false} />
        </Card>
      </DetailCol>
    </Layout>
  );
};
