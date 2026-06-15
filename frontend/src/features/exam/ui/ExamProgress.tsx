import type React from 'react';
import styled from '@emotion/styled';

// 자기조절학습검사 전용 색상
const SRL_COLOR = {
  main: '#009F88',
  dark: '#007a6a',
  light: '#cdf0ec',
} as const;

interface ExamProgressProps {
  currentPage: number;
  totalPages: number;
  answeredCount: number;
  totalQuestions: number;
  paperIdx?: string;
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

const Count = styled.span<{ $isSrl: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ $isSrl, theme }) => ($isSrl ? SRL_COLOR.dark : theme.colors.primary[600])};
`;

const ProgressBarContainer = styled.div`
  position: relative;
  height: 0.5rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.full};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ProgressBarFill = styled.div<{ $percent: number; $isSrl: boolean }>`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: ${({ $isSrl, theme }) =>
    $isSrl
      ? `linear-gradient(to right, ${SRL_COLOR.main}, ${SRL_COLOR.dark})`
      : `linear-gradient(to right, ${theme.colors.primary[400]}, ${theme.colors.primary[600]})`};
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

const PageDot = styled.div<{ $isActive: boolean; $isPast: boolean; $isSrl: boolean }>`
  width: 2rem;
  height: 2rem;
  border-radius: ${({ theme }) => theme.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  transition: all 0.15s ease;
  background: ${({ $isActive, $isPast, $isSrl, theme }) =>
    $isActive
      ? ($isSrl ? SRL_COLOR.main : theme.colors.primary[500])
      : $isPast
        ? ($isSrl ? SRL_COLOR.light : theme.colors.primary[100])
        : theme.colors.gray[100]};
  color: ${({ $isActive, $isPast, $isSrl, theme }) =>
    $isActive
      ? '#ffffff'
      : $isPast
        ? ($isSrl ? SRL_COLOR.dark : theme.colors.primary[600])
        : theme.colors.gray[400]};
  transform: ${({ $isActive }) => ($isActive ? 'scale(1.1)' : 'scale(1)')};
  box-shadow: ${({ $isActive, theme }) => ($isActive ? theme.shadows.md : 'none')};
`;

export const ExamProgress: React.FC<ExamProgressProps> = ({
  currentPage,
  totalPages,
  answeredCount,
  totalQuestions,
  paperIdx = '1',
}) => {
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const isSrl = paperIdx !== '1';

  return (
    <Container>
      <Inner>
        {/* 상단 정보 */}
        <Header>
          <Label>검사 진행 현황</Label>
          <Count $isSrl={isSrl}>
            {answeredCount}/{totalQuestions}
          </Count>
        </Header>

        {/* 진행률 바 */}
        <ProgressBarContainer>
          <ProgressBarFill $percent={progressPercent} $isSrl={isSrl} />
        </ProgressBarContainer>

        {/* 페이지 인디케이터 */}
        <PageIndicators>
          {Array.from({ length: totalPages }, (_, i) => {
            const displayNum = i + 1;
            const isActive = i === currentPage;
            const isPast = i < currentPage;

            return (
              <PageDot key={displayNum} $isActive={isActive} $isPast={isPast} $isSrl={isSrl}>
                {displayNum}
              </PageDot>
            );
          })}
        </PageIndicators>
      </Inner>
    </Container>
  );
};
