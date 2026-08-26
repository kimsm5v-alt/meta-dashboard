import styled from '@emotion/styled';
import type { StudentResultStatus } from '@features/lesson';

const TONE: Record<StudentResultStatus, 'success' | 'warning' | 'gray'> = {
  완료: 'success',
  진행중: 'warning',
  미제출: 'gray',
  대기: 'gray',
};

const Pill = styled.span<{ $tone: 'success' | 'warning' | 'gray' }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  background: ${({ theme, $tone }) =>
    $tone === 'success'
      ? theme.colors.success.light
      : $tone === 'warning'
        ? theme.colors.warning.light
        : theme.colors.gray[50]};
  color: ${({ theme, $tone }) =>
    $tone === 'success'
      ? theme.colors.success.dark
      : $tone === 'warning'
        ? theme.colors.warning.dark
        : theme.colors.gray[400]};
`;

export const StudentResultStatusBadge = ({ status }: { status: StudentResultStatus }) => (
  <Pill $tone={TONE[status]}>{status}</Pill>
);
