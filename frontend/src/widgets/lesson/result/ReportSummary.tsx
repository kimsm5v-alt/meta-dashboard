import { useState } from 'react';
import styled from '@emotion/styled';
import { Calendar } from 'lucide-react';
import type { ActivitySummaryItem, ReportDetailView } from '@features/lesson';
import { fmtDotDate, pct } from '@features/lesson';
import { ActivityStatusBadge, ClassBadge } from './reportBadges';

interface ReportSummaryProps {
  activity?: ActivitySummaryItem;
  activityId: string;
  view: ReportDetailView;
}

const Card = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  align-items: stretch;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 20px;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius['2xl']};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Left = styled.div`
  display: flex;
  align-items: stretch;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Thumb = styled.div`
  flex: none;
  align-self: stretch;
  width: 224px;
  min-height: 132px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: ${({ theme }) =>
    `linear-gradient(135deg, ${theme.colors.gray[100]} 0%, ${theme.colors.gray[200]} 100%)`};
`;

const ThumbImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ThumbFallback = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 132px;
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-align: center;
`;

const Meta = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  justify-content: center;
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
`;

const Title = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extraBold};
  letter-spacing: -0.02em;
`;

const DateRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const DateIcon = styled(Calendar)`
  width: 14px;
  height: 14px;
  color: ${({ theme }) => theme.colors.gray[400]};
  flex-shrink: 0;
`;

const SelRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const SelChip = styled.span`
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary[50]};
  color: ${({ theme }) => theme.colors.primary[700]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Metrics = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-self: stretch;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.xl};
`;

const Metric = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md} 20px;

  & + & {
    border-left: 1px solid ${({ theme }) => theme.colors.gray[200]};
  }
`;

const MetricLabel = styled.div`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const MetricValue = styled.div`
  margin-top: 4px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extraBold};
`;

const MetricSub = styled.small`
  margin-left: 2px;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Dash = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const thumbnailOf = (activity?: ActivitySummaryItem): string | undefined => {
  const url = activity?.options?.thumbnailUrl;
  return typeof url === 'string' && url.length > 0 ? url : undefined;
};

export const ReportSummary = ({ activity, activityId, view }: ReportSummaryProps) => {
  const [imgFailed, setImgFailed] = useState(false);
  const title = activity?.title || activityId;
  const thumbnailUrl = thumbnailOf(activity);
  const startStr = activity?.openAt ? fmtDotDate(activity.openAt) : '';
  const endStr = activity?.closeAt ? fmtDotDate(activity.closeAt) : '';
  const range = [startStr, endStr].filter(Boolean).join(' ~ ');
  const pageCount = view.pageCount;
  const dateLine = range ? `배포 ${range} · ${pageCount}개 페이지` : `${pageCount}개 페이지`;

  const assigned = view.assignedCount;
  const participated = view.participantCount;
  const rate = assigned > 0 ? pct(participated, assigned) : 0;

  return (
    <Card>
      <Left>
        <Thumb>
          {thumbnailUrl && !imgFailed ? (
            <ThumbImg src={thumbnailUrl} alt={title} onError={() => setImgFailed(true)} />
          ) : (
            <ThumbFallback>{title}</ThumbFallback>
          )}
        </Thumb>
        <Meta>
          <BadgeRow>
            {activity ? <ActivityStatusBadge availability={activity.availability} /> : null}
            {view.className ? <ClassBadge cls={view.className} /> : null}
          </BadgeRow>
          <Title>{title}</Title>
          <DateRow>
            <DateIcon />
            {dateLine}
          </DateRow>
          {view.selFactors.length > 0 ? (
            <SelRow>
              {view.selFactors.map((f) => (
                <SelChip key={f}>{f}</SelChip>
              ))}
            </SelRow>
          ) : null}
        </Meta>
      </Left>
      <Metrics>
        <Metric>
          <MetricLabel>참여 인원</MetricLabel>
          <MetricValue>
            {assigned === 0 ? (
              <Dash>–</Dash>
            ) : (
              <>
                {participated}
                <MetricSub>
                  /{assigned}명 · {rate}%
                </MetricSub>
              </>
            )}
          </MetricValue>
        </Metric>
        <Metric>
          <MetricLabel>평균 정답률</MetricLabel>
          <MetricValue>
            {view.avgCorrectRate == null ? (
              <Dash>–</Dash>
            ) : (
              <>
                {view.avgCorrectRate}
                <MetricSub>%</MetricSub>
              </>
            )}
          </MetricValue>
        </Metric>
      </Metrics>
    </Card>
  );
};
