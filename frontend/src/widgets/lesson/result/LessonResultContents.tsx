import { useState } from 'react';
import styled from '@emotion/styled';
import { useMyGroupsQuery } from '@features/api';
import { Loading } from '@shared/ui/Loading';
import { StatusPanel } from './StatusPanel';
import { ReportFilterChips } from './ReportFilterChips';
import { ReportCardList } from './ReportCardList';
import type { RsFilter } from './types';

interface LessonResultContentsProps {
  classId?: string;
}

const LoadingBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.md};
`;

const GuardBox = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: 64px ${({ theme }) => theme.spacing.md};
  border: 1px dashed ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.gray[50]};
  text-align: center;
`;

const GuardText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const RetryButton = styled.button`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: 6px 14px;
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.background.paper};
  color: ${({ theme }) => theme.colors.primary[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[50]};
  }
`;

export const LessonResultContents = ({ classId }: LessonResultContentsProps) => {
  const {
    data: groups = [],
    isLoading: groupsLoading,
    isError: groupsError,
    refetch: refetchGroups,
  } = useMyGroupsQuery();
  const [highlightParticipant, setHighlightParticipant] = useState<string | null>(null);
  const [highlightActivityIds, setHighlightActivityIds] = useState<string[]>([]);
  const [rsFilter, setRsFilter] = useState<RsFilter>('전체');

  const className = classId ? groups.find((group) => group.id === classId)?.name : undefined;

  const handleSelectStudent = (participant: string | null, missingActivityIds: string[]) => {
    setHighlightParticipant(participant);
    setHighlightActivityIds(participant ? missingActivityIds : []);
    if (participant !== null) setRsFilter('진행중');
  };

  if (groupsLoading) {
    return (
      <LoadingBox role='status' aria-busy='true'>
        <Loading size='md' text='불러오는 중...' />
      </LoadingBox>
    );
  }

  if (groupsError) {
    return (
      <GuardBox role='alert'>
        <GuardText>반을 선택해야 결과를 볼 수 있습니다</GuardText>
        <RetryButton type='button' onClick={() => void refetchGroups()}>
          다시 시도
        </RetryButton>
      </GuardBox>
    );
  }

  if (groups.length === 0) {
    return (
      <GuardBox>
        <GuardText>반을 선택해야 결과를 볼 수 있습니다</GuardText>
      </GuardBox>
    );
  }

  const isCurrentClassValid = Boolean(classId && groups.some((group) => group.id === classId));
  if (!isCurrentClassValid || !classId) {
    return (
      <LoadingBox role='status' aria-busy='true'>
        <Loading size='md' text='불러오는 중...' />
      </LoadingBox>
    );
  }

  return (
    <>
      <StatusPanel
        classId={classId}
        className={className}
        selected={highlightParticipant}
        onSelect={handleSelectStudent}
      />
      <ReportFilterChips filter={rsFilter} onFilterChange={setRsFilter} />
      <ReportCardList
        classId={classId}
        filter={rsFilter}
        highlightActivityIds={highlightActivityIds}
      />
    </>
  );
};
