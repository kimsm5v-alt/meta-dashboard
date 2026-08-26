import { useState } from 'react';
import styled from '@emotion/styled';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import type { ActivitySummaryItem, ReportDetailTab } from '@features/lesson';
import { getReportDetailView } from '@features/lesson';
import { ReportSummary } from './ReportSummary';
import { ReportDetailTabBar } from './ReportDetailTabBar';
import { StudentTab } from './StudentTab';
import { PageTab } from './PageTab';

interface ReportDetailProps {
  activityId: string;
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

export const ReportDetail = ({ activityId, activity }: ReportDetailProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<ReportDetailTab>('student');
  const view = getReportDetailView(activityId);

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
      <ReportSummary activity={activity} activityId={activityId} view={view} />
      <ReportDetailTabBar tab={tab} onChange={setTab} />
      {tab === 'slide' ? <PageTab view={view} /> : <StudentTab view={view} />}
    </Root>
  );
};
