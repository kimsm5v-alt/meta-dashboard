/**
 * 리포트 카드 — 배포된 활동 1건의 요약 카드.
 * highlight가 true이면 amber 링 테두리로 강조한다
 * (미제출 학생 강조 기능 — 현재 보류, 추후 /progress API 연동 시 활성화).
 */
import { useState } from 'react';
import styled from '@emotion/styled';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, BarChart3 } from 'lucide-react';
import type { ActivitySummaryItem, ActivityAvailability } from '@features/lesson';

interface ReportCardProps {
  activity: ActivitySummaryItem;
  highlight?: boolean;
}

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const AV_STYLE: Record<ActivityAvailability, { bg: string; color: string; dot: string }> = {
  OPEN: { bg: '#d1fae5', color: '#059669', dot: '#10b981' },
  NOT_STARTED: { bg: '#fef3c7', color: '#d97706', dot: '#f59e0b' },
  CLOSED: { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
  NOT_AVAILABLE: { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
};

const AV_LABEL: Record<ActivityAvailability, string> = {
  OPEN: '진행중',
  NOT_STARTED: '진행예정',
  CLOSED: '완료',
  NOT_AVAILABLE: '완료',
};

const CardRoot = styled.div<{ $highlight: boolean }>`
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  overflow: hidden;
  ${({ $highlight, theme }) =>
    $highlight &&
    `
    outline: 2px solid ${theme.colors.warning.main};
    outline-offset: 2px;
  `}
`;

const Thumb = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: ${({ theme }) =>
    `linear-gradient(135deg, ${theme.colors.gray[100]} 0%, ${theme.colors.gray[200]} 100%)`};
  flex-shrink: 0;
  overflow: hidden;
`;

const ThumbImg = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ThumbTitleFallback = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  text-align: center;
  overflow: hidden;
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  padding: ${({ theme }) => theme.spacing.sm};
`;

const CardTitle = styled.div`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
`;

const StatusBadge = styled.span<{ $av: ActivityAvailability }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $av }) => AV_STYLE[$av].bg};
  color: ${({ $av }) => AV_STYLE[$av].color};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const StatusDot = styled.span<{ $av: ActivityAvailability }>`
  width: 6px;
  height: 6px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $av }) => AV_STYLE[$av].dot};
  flex-shrink: 0;
`;

const DateRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const DateIcon = styled(Calendar)`
  width: 14px;
  height: 14px;
  color: ${({ theme }) => theme.colors.gray[400]};
  flex-shrink: 0;
`;

const ReportButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: auto;
  width: 100%;
  padding: 6px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.primary[500]};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const BarIcon = styled(BarChart3)`
  width: 14px;
  height: 14px;
`;

export const ReportCard = ({ activity, highlight = false }: ReportCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [imgFailed, setImgFailed] = useState(false);
  const thumbnailUrl =
    typeof activity.options?.thumbnailUrl === 'string' ? activity.options.thumbnailUrl : undefined;

  const startStr = activity.openAt ? fmtDate(activity.openAt) : '';
  const endStr = activity.closeAt ? fmtDate(activity.closeAt) : '';
  const dateStr = [startStr, endStr].filter(Boolean).join(' ~ ') || '실시간 수업';

  const av = activity.availability;

  return (
    <CardRoot $highlight={highlight}>
      <Thumb>
        {thumbnailUrl && !imgFailed ? (
          <ThumbImg
            src={thumbnailUrl}
            alt={activity.title}
            loading='lazy'
            onError={() => setImgFailed(true)}
          />
        ) : null}
        {!thumbnailUrl || imgFailed ? (
          <ThumbTitleFallback title={activity.title}>{activity.title}</ThumbTitleFallback>
        ) : null}
      </Thumb>
      <Body>
        <CardTitle title={activity.title}>{activity.title}</CardTitle>
        <BadgeRow>
          <StatusBadge $av={av}>
            <StatusDot $av={av} />
            {AV_LABEL[av]}
          </StatusBadge>
        </BadgeRow>
        <DateRow>
          <DateIcon />
          {dateStr}
        </DateRow>
        <ReportButton
          type='button'
          onClick={() =>
            navigate(`/lesson/result/${activity.activityId}${location.search}`, {
              state: { activity },
            })
          }
        >
          <BarIcon />
          리포트
        </ReportButton>
      </Body>
    </CardRoot>
  );
};
