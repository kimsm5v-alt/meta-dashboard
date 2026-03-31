import type React from 'react';
import styled from '@emotion/styled';

interface ExamProgressProps {
  currentPage: number;
  totalPages: number;
  answeredCount: number;
  totalQuestions: number;
}

const Container = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.md}`};
  position: sticky;
  top: 0;
  z-index: 10;
`;

const Inner = styled.div`
  max-width: 56rem;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Label = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const Count = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary[600]};
`;

const ProgressBarContainer = styled.div`
  position: relative;
  height: 0.5rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.full};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ProgressBarFill = styled.div<{ $percent: number }>`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(
    to right,
    ${({ theme }) => theme.colors.primary[400]},
    ${({ theme }) => theme.colors.primary[600]}
  );
  border-radius: ${({ theme }) => theme.radius.full};
  transition: width 0.3s ease;
  width: ${({ $percent }) => $percent}%;
`;

const PageIndicators = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const PageDot = styled.div<{ $isActive: boolean; $isPast: boolean }>`
  width: 2rem;
  height: 2rem;
  border-radius: ${({ theme }) => theme.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  transition: all 0.15s ease;
  background: ${({ $isActive, $isPast, theme }) =>
    $isActive
      ? theme.colors.primary[500]
      : $isPast
        ? theme.colors.primary[100]
        : theme.colors.gray[100]};
  color: ${({ $isActive, $isPast, theme }) =>
    $isActive ? '#ffffff' : $isPast ? theme.colors.primary[600] : theme.colors.gray[400]};
  transform: ${({ $isActive }) => ($isActive ? 'scale(1.1)' : 'scale(1)')};
  box-shadow: ${({ $isActive, theme }) => ($isActive ? theme.shadows.md : 'none')};
`;

export const ExamProgress: React.FC<ExamProgressProps> = ({
  currentPage,
  totalPages,
  answeredCount,
  totalQuestions,
}) => {
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <Container>
      <Inner>
        {/* 상단 정보 */}
        <Header>
          <Label>검사 진행 현황</Label>
          <Count>
            {answeredCount}/{totalQuestions}
          </Count>
        </Header>

        {/* 진행률 바 */}
        <ProgressBarContainer>
          <ProgressBarFill $percent={progressPercent} />
        </ProgressBarContainer>

        {/* 페이지 인디케이터 */}
        <PageIndicators>
          {Array.from({ length: totalPages }, (_, i) => {
            const displayNum = i + 1;
            const isActive = i === currentPage;
            const isPast = i < currentPage;

            return (
              <PageDot key={displayNum} $isActive={isActive} $isPast={isPast}>
                {displayNum}
              </PageDot>
            );
          })}
        </PageIndicators>
      </Inner>
    </Container>
  );
};
