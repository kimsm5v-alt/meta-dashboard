import styled from '@emotion/styled';

export const StepDot = styled.div<{ $tone: 1 | 2 | 3 }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: white;
  background: ${({ $tone }) => ($tone === 1 ? '#7C3AED' : $tone === 2 ? '#3B82F6' : '#22C55E')};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

export const OverviewStepDot = styled(StepDot)`
  width: 48px;
  height: 48px;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
`;

export const TimelineList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

export const TimelineRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const TimelineTrack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
`;

export const TimelineLine = styled.div`
  flex: 1;
  width: 1px;
  margin: 8px 0;
  background: #d1d5db;
`;

export const TimelineContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const TimelineHeading = styled.h3`
  margin: 0;
  color: #111827;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;
