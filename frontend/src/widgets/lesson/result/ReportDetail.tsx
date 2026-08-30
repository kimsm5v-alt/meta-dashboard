import { useState } from 'react';
import styled from '@emotion/styled';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Loading } from '@shared/ui/Loading';
import type { ActivitySummaryItem, ReportDetailTab } from '@features/lesson';
import {
  LmsHttpError,
  useActivityDetailQuery,
  useActivityProgressQuery,
  useActivityStatisticsQuery,
  useCmsSetDetailQuery,
} from '@features/lesson';
import { ReportSummary } from './ReportSummary';
import { ReportDetailTabBar } from './ReportDetailTabBar';
import { StudentTab } from './StudentTab';
import { PageTab } from './PageTab';

interface ReportDetailProps {
  activityId: string;
  classId?: string;
  activity?: ActivitySummaryItem;
}

const Root = styled.div`
  margin-top: 20px;
`;

const BackRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.gray[700]};
  }
`;

const BackIcon = styled(ChevronLeft)`
  width: 16px;
  height: 16px;
`;

const LoadingBox = styled.div`
  display: flex;
  justify-content: center;
  padding: 64px 0;
`;

const ErrorBox = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px dashed ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) => theme.colors.gray[50]};
  color: ${({ theme }) => theme.colors.error.main};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

const detailErrorMessage = (error: unknown): string => {
  if (error instanceof LmsHttpError && error.status === 404) {
    return '활동을 찾을 수 없거나 권한이 없습니다.';
  }
  if (error instanceof Error) return error.message;
  return '활동을 불러오지 못했습니다.';
};

export const ReportDetail = ({ activityId, classId, activity }: ReportDetailProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<ReportDetailTab>('student');

  const detailQuery = useActivityDetailQuery(activityId);
  const progressQuery = useActivityProgressQuery(activityId);
  const statisticsQuery = useActivityStatisticsQuery(activityId);
  const cmsSetQuery = useCmsSetDetailQuery(detailQuery.data?.lcmsSetId);

  const handleBack = () => {
    navigate(`/lesson/result${location.search}`);
  };

  return (
    <Root>
      <BackRow>
        <BackButton type='button' onClick={handleBack}>
          <BackIcon />
          수업 결과보기로 돌아가기
        </BackButton>
      </BackRow>
      {detailQuery.isPending ? (
        <LoadingBox role='status' aria-busy='true'>
          <Loading size='md' text='불러오는 중...' />
        </LoadingBox>
      ) : null}
      {detailQuery.isError ? (
        <ErrorBox role='alert'>{detailErrorMessage(detailQuery.error)}</ErrorBox>
      ) : null}
      {!detailQuery.isPending && !detailQuery.isError ? (
        <>
          <ReportSummary
            activityId={activityId}
            classId={classId}
            fallback={activity}
            detail={detailQuery.data}
            cmsSet={cmsSetQuery.data}
            progress={progressQuery.data}
            statistics={statisticsQuery.data}
          />
          <ReportDetailTabBar tab={tab} onChange={setTab} />
          {tab === 'slide' ? (
            <PageTab activityId={activityId} classId={classId} />
          ) : detailQuery.data ? (
            <StudentTab
              activityId={activityId}
              classId={classId}
              detail={detailQuery.data}
              cmsSet={cmsSetQuery.data}
              cmsSetPending={Boolean(detailQuery.data.lcmsSetId) && cmsSetQuery.isPending}
              cmsSetError={cmsSetQuery.error}
            />
          ) : null}
        </>
      ) : null}
    </Root>
  );
};
