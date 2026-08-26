/**
 * 리포트 카드 목록 — 서버 필터링(availability) + 무한스크롤.
 * 필터 탭 전환 시 queryKey가 바뀌어 page 0부터 재조회된다.
 * highlightStudent: 미제출 학생 강조 — /progress API 연동 보류, 현재 미사용.
 */
import { useEffect, useMemo, useRef } from 'react';
import styled from '@emotion/styled';
import { Loading } from '@shared/ui/Loading';
import { useActivityListQuery } from '@features/lesson';
import type { ActivityAvailability } from '@features/lesson';
import { ReportCard } from './ReportCard';
import type { RsFilter } from './types';

interface ReportCardListProps {
  filter: RsFilter;
  highlightStudent: string | null;
}

const FILTER_TO_AV: Record<RsFilter, ActivityAvailability | undefined> = {
  전체: undefined,
  진행중: 'OPEN',
  진행예정: 'NOT_STARTED',
  완료: 'CLOSED',
};

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Grid = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.sm};

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const LoadingBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.md};
`;

const RefetchBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xs} 0;
`;

const FetchMoreBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.sm} 0;
`;

const Sentinel = styled.div`
  width: 100%;
  height: 1px;
`;

const EmptyBox = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: 64px 0;
  border: 1px dashed ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.gray[50]};
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 30px;
  line-height: 1;
`;

const EmptyText = styled.div`
  margin-top: 8px;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ErrorText = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.error.main};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

export const ReportCardList = ({ filter }: ReportCardListProps) => {
  const availability = FILTER_TO_AV[filter];
  const {
    data,
    isPending,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
  } = useActivityListQuery(availability);

  const items = useMemo(() => (data?.pages ?? []).flatMap((page) => page.content), [data]);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 },
    );
    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isError && items.length === 0) {
    return (
      <EmptyBox role='alert'>
        <ErrorText>
          {error instanceof Error ? error.message : '목록을 불러오지 못했습니다.'}
        </ErrorText>
      </EmptyBox>
    );
  }

  if (isPending) {
    return (
      <LoadingBox role='status' aria-busy='true'>
        <Loading size='md' text='불러오는 중...' />
      </LoadingBox>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyBox>
        <EmptyIcon>📭</EmptyIcon>
        <EmptyText>해당 상태의 수업 결과가 없습니다.</EmptyText>
      </EmptyBox>
    );
  }

  return (
    <Shell>
      {isFetching && !isFetchingNextPage ? (
        <RefetchBar role='status' aria-busy='true'>
          <Loading size='sm' text='갱신 중...' />
        </RefetchBar>
      ) : null}
      <Grid>
        {items.map((activity) => (
          <ReportCard key={activity.activityId} activity={activity} highlight={false} />
        ))}
      </Grid>
      {hasNextPage ? <Sentinel ref={sentinelRef} aria-hidden /> : null}
      {isFetchingNextPage ? (
        <FetchMoreBar role='status' aria-busy='true'>
          <Loading size='sm' text='추가 불러오는 중...' />
        </FetchMoreBar>
      ) : null}
    </Shell>
  );
};
