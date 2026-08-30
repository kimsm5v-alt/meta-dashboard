import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { Calendar } from 'lucide-react';
import { useMyGroupsQuery } from '@features/api';
import type {
  ActivityDetail,
  ActivityProgress,
  ActivityStatistics,
  ActivitySummaryItem,
} from '@features/lesson';
import {
  classIdsFromOptions,
  filterParticipantsByClass,
  fmtDotDate,
  isActivityAvailability,
  pct,
  resolveClassNames,
  useClassMemberSubsQuery,
} from '@features/lesson';
import { ActivityStatusBadge, ClassBadge } from './ReportBadge';

interface ReportSummaryProps {
  activityId: string;
  classId?: string;
  fallback?: ActivitySummaryItem;
  detail?: ActivityDetail;
  progress?: ActivityProgress;
  statistics?: ActivityStatistics;
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

const thumbnailOf = (
  detail?: ActivityDetail,
  fallback?: ActivitySummaryItem,
): string | undefined => {
  const fromDetail = detail?.options?.thumbnailUrl;
  if (typeof fromDetail === 'string' && fromDetail.length > 0) return fromDetail;
  const fromFallback = fallback?.options?.thumbnailUrl;
  return typeof fromFallback === 'string' && fromFallback.length > 0 ? fromFallback : undefined;
};

const buildDateLine = (openAt?: string, closeAt?: string, pageCount = 0): string => {
  const startStr = openAt ? fmtDotDate(openAt) : '';
  const endStr = closeAt ? fmtDotDate(closeAt) : '';
  const range = [startStr, endStr].filter(Boolean).join(' ~ ');
  const pages = `${pageCount}개 페이지`;
  return range ? `배포 ${range} · ${pages}` : pages;
};

export const ReportSummary = ({
  activityId,
  classId,
  fallback,
  detail,
  progress,
  statistics,
}: ReportSummaryProps) => {
  const [imgFailed, setImgFailed] = useState(false);
  const { data: groups = [] } = useMyGroupsQuery();
  const classMembers = useClassMemberSubsQuery(classId);
  const title = detail?.title || fallback?.title || activityId;
  const thumbnailUrl = thumbnailOf(detail, fallback);
  const availability = detail?.availability ?? fallback?.availability;
  const openAt = detail?.openAt ?? fallback?.openAt ?? undefined;
  const closeAt = detail?.closeAt ?? fallback?.closeAt ?? undefined;
  const labels = detail?.labels ?? [];
  const pageCount = detail?.items?.length ?? 0;
  const dateLine = buildDateLine(openAt ?? undefined, closeAt ?? undefined, pageCount);
  const classNames = resolveClassNames(
    classIdsFromOptions(detail?.options ?? fallback?.options),
    groups,
  );

  const classRows = useMemo(
    () =>
      classMembers.isPending ? [] : filterParticipantsByClass(progress?.rows, classMembers.subs),
    [classMembers.isPending, classMembers.subs, progress?.rows],
  );
  const assignedCount = classRows.length;
  const startedCount = classRows.filter((row) => row.status !== 'NOT_STARTED').length;
  const showParticipation = !classMembers.isPending && assignedCount > 0;
  const rate = showParticipation ? pct(startedCount, assignedCount) : 0;
  const averageScore = statistics?.averageScore;

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
            {availability && isActivityAvailability(availability) ? (
              <ActivityStatusBadge availability={availability} />
            ) : null}
            {classNames.map((name) => (
              <ClassBadge key={name} cls={name} />
            ))}
          </BadgeRow>
          <Title>{title}</Title>
          <DateRow>
            <DateIcon />
            {dateLine}
          </DateRow>
          {labels.length > 0 ? (
            <SelRow>
              {labels.map((label) => (
                <SelChip key={label}>{label}</SelChip>
              ))}
            </SelRow>
          ) : null}
        </Meta>
      </Left>
      <Metrics>
        <Metric>
          <MetricLabel>참여 인원</MetricLabel>
          <MetricValue>
            {showParticipation ? (
              <>
                {startedCount}
                <MetricSub>
                  /{assignedCount}명 · {rate}%
                </MetricSub>
              </>
            ) : (
              <Dash>–</Dash>
            )}
          </MetricValue>
        </Metric>
        <Metric>
          <MetricLabel>평균 정답률</MetricLabel>
          <MetricValue>{averageScore == null ? <Dash>–</Dash> : averageScore}</MetricValue>
        </Metric>
      </Metrics>
    </Card>
  );
};
