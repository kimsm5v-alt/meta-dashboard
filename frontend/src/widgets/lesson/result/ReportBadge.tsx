import styled from '@emotion/styled';
import { Users } from 'lucide-react';
import type {
  ActivityAvailability,
  ArticleNature,
  ErrataCd,
  ParticipationStatus,
  StudentStatusCd,
} from '@features/lesson';

const AV_LABEL: Record<ActivityAvailability, string> = {
  OPEN: '진행중',
  NOT_STARTED: '진행예정',
  CLOSED: '완료',
  NOT_AVAILABLE: '발행 전',
};

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const AvPill = styled(Pill)<{ $av: ActivityAvailability }>`
  background: ${({ theme, $av }) =>
    $av === 'OPEN'
      ? theme.colors.success.light
      : $av === 'NOT_STARTED'
        ? theme.colors.warning.light
        : theme.colors.gray[100]};
  color: ${({ theme, $av }) =>
    $av === 'OPEN'
      ? theme.colors.success.dark
      : $av === 'NOT_STARTED'
        ? theme.colors.warning.dark
        : theme.colors.gray[600]};
`;

const Dot = styled.span<{ $av: ActivityAvailability }>`
  width: 6px;
  height: 6px;
  border-radius: ${({ theme }) => theme.radius.full};
  flex-shrink: 0;
  background: ${({ theme, $av }) =>
    $av === 'OPEN'
      ? theme.colors.success.main
      : $av === 'NOT_STARTED'
        ? theme.colors.warning.main
        : theme.colors.gray[400]};
`;

export const ActivityStatusBadge = ({ availability }: { availability: ActivityAvailability }) => (
  <AvPill $av={availability}>
    <Dot $av={availability} />
    {AV_LABEL[availability]}
  </AvPill>
);

const ClassPill = styled(Pill)`
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ClassIcon = styled(Users)`
  width: 12px;
  height: 12px;
`;

export const ClassBadge = ({ cls }: { cls: string }) => (
  <ClassPill>
    <ClassIcon />
    {cls}
  </ClassPill>
);

const NaturePill = styled(Pill)<{ $tone: ArticleNature }>`
  background: ${({ theme, $tone }) =>
    $tone === '활동'
      ? theme.colors.success.light
      : $tone === '문항'
        ? theme.colors.primary[50]
        : theme.colors.gray[100]};
  color: ${({ theme, $tone }) =>
    $tone === '활동'
      ? theme.colors.success.dark
      : $tone === '문항'
        ? theme.colors.primary[700]
        : theme.colors.gray[600]};
`;

export const NatureBadge = ({ nature }: { nature: ArticleNature }) => (
  <NaturePill $tone={nature}>{nature}</NaturePill>
);

const ERRATA: Record<ErrataCd, { label: string; tone: 'info' | 'error' | 'warning' | 'gray' }> = {
  1: { label: 'O', tone: 'info' },
  2: { label: 'X', tone: 'error' },
  3: { label: '△', tone: 'warning' },
  4: { label: '–', tone: 'gray' },
};

const ErrataMark = styled.span<{ $tone: 'info' | 'error' | 'warning' | 'gray' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  background: ${({ theme, $tone }) =>
    $tone === 'info'
      ? theme.colors.info.light
      : $tone === 'error'
        ? theme.colors.error.light
        : $tone === 'warning'
          ? theme.colors.warning.light
          : theme.colors.gray[50]};
  color: ${({ theme, $tone }) =>
    $tone === 'info'
      ? theme.colors.info.dark
      : $tone === 'error'
        ? theme.colors.error.dark
        : $tone === 'warning'
          ? theme.colors.warning.dark
          : theme.colors.gray[400]};
`;

export const ErrataBadge = ({ errata }: { errata: ErrataCd }) => {
  const m = ERRATA[errata];
  return <ErrataMark $tone={m.tone}>{m.label}</ErrataMark>;
};

const STATUS: Record<
  StudentStatusCd,
  { label: string; tone: 'success' | 'warning' | 'info' | 'gray' }
> = {
  5: { label: '완료', tone: 'success' },
  4: { label: '진행중', tone: 'warning' },
  3: { label: '제출', tone: 'info' },
  2: { label: '미제출', tone: 'gray' },
};

const StatusPill = styled(Pill)<{ $tone: 'success' | 'warning' | 'info' | 'gray' }>`
  background: ${({ theme, $tone }) =>
    $tone === 'success'
      ? theme.colors.success.light
      : $tone === 'warning'
        ? theme.colors.warning.light
        : $tone === 'info'
          ? theme.colors.info.light
          : theme.colors.gray[50]};
  color: ${({ theme, $tone }) =>
    $tone === 'success'
      ? theme.colors.success.dark
      : $tone === 'warning'
        ? theme.colors.warning.dark
        : $tone === 'info'
          ? theme.colors.info.dark
          : theme.colors.gray[400]};
`;

export const StudentStatusBadge = ({ statusCd }: { statusCd: StudentStatusCd }) => {
  const m = STATUS[statusCd];
  return <StatusPill $tone={m.tone}>{m.label}</StatusPill>;
};

const PARTICIPATION_STATUS: Record<
  ParticipationStatus,
  { label: string; tone: 'success' | 'warning' | 'info' | 'gray' }
> = {
  SUBMITTED: { label: '완료', tone: 'success' },
  IN_PROGRESS: { label: '진행중', tone: 'warning' },
  NOT_STARTED: { label: '미제출', tone: 'gray' },
};

export const ParticipationStatusBadge = ({ status }: { status: ParticipationStatus }) => {
  const m = PARTICIPATION_STATUS[status];
  return <StatusPill $tone={m.tone}>{m.label}</StatusPill>;
};
