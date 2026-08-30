import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { Clock } from 'lucide-react';
import { Loading } from '@shared/ui/Loading';
import {
  mapPageTabGridRows,
  mapPageTabStudents,
  mapStatisticsToPageListItems,
  submittedParticipationIds,
  useActivityParticipationsQuery,
  useActivityStatisticsQuery,
  useAssigneeDirectoryQuery,
  useClassMemberSubsQuery,
  useCmsArticleMapQuery,
  useTeacherParticipationsMapQuery,
} from '@features/lesson';
import { PageList } from './PageList';
import { PageContent } from './PageContent';

interface PageTabProps {
  activityId: string;
  classId?: string;
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

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: 20px;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 300px 1fr;
  }
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

export const PageTab = ({ activityId, classId }: PageTabProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const statsQuery = useActivityStatisticsQuery(activityId);
  const classMembers = useClassMemberSubsQuery(classId);
  const articleIds = useMemo(
    () => (statsQuery.data?.items ?? []).map((item) => item.lcmsArticleId),
    [statsQuery.data?.items],
  );
  const { map: articleMap, isPending: articlesPending } = useCmsArticleMapQuery(articleIds);
  const pages = useMemo(
    () => mapStatisticsToPageListItems(statsQuery.data?.items, articleMap),
    [articleMap, statsQuery.data?.items],
  );

  const participationsQuery = useActivityParticipationsQuery(activityId);
  const directoryQuery = useAssigneeDirectoryQuery(classMembers.subs.size > 0);
  const students = useMemo(
    () =>
      classMembers.isPending
        ? []
        : mapPageTabStudents(classMembers.subs, participationsQuery.data, directoryQuery.data),
    [classMembers.isPending, classMembers.subs, directoryQuery.data, participationsQuery.data],
  );
  const submittedIds = useMemo(() => submittedParticipationIds(students), [students]);
  const { map: participationMap } = useTeacherParticipationsMapQuery(activityId, submittedIds);

  const assignedCount = classMembers.subs.size;
  const safeIndex = pages.length === 0 ? 0 : Math.min(selectedIndex, pages.length - 1);
  const selectedPage = pages[safeIndex];
  const gridRows = useMemo(
    () => (selectedPage ? mapPageTabGridRows(students, selectedPage, participationMap) : []),
    [participationMap, selectedPage, students],
  );

  const isPending =
    statsQuery.isPending ||
    classMembers.isPending ||
    participationsQuery.isPending ||
    (articleIds.length > 0 && articlesPending);

  if (isPending) {
    return (
      <LoadingBox role='status' aria-busy='true'>
        <Loading size='md' text='불러오는 중...' />
      </LoadingBox>
    );
  }

  if (statsQuery.isError) {
    return (
      <ErrorText role='alert'>
        {statsQuery.error instanceof Error
          ? statsQuery.error.message
          : '페이지 현황을 불러오지 못했습니다.'}
      </ErrorText>
    );
  }

  if (pages.length === 0 || !selectedPage) {
    return (
      <Empty>
        <EmptyIcon />
        <EmptyText>표시할 페이지가 없습니다.</EmptyText>
      </Empty>
    );
  }

  return (
    <Layout>
      <PageList
        pages={pages}
        assignedCount={assignedCount}
        selectedIndex={safeIndex}
        onSelect={setSelectedIndex}
      />
      <PageContent page={selectedPage} assignedCount={assignedCount} gridRows={gridRows} />
    </Layout>
  );
};
