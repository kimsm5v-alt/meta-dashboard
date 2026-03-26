import styled from '@emotion/styled';
import { PlayCircle, RefreshCw, Loader2 } from 'lucide-react';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(to bottom right, ${({ theme }) => theme.colors.primary[50]}, #ffffff, #eef2ff);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
`;

const Wrapper = styled.div`
  width: 100%;
  max-width: 28rem;
`;

const InfoSection = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const ExamBadge = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => `0.5rem ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary[100]};
  color: ${({ theme }) => theme.colors.primary[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ExamName = styled.h1`
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const InfoText = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ProgressCard = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: 1rem;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const ProgressStats = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ProgressNumber = styled.div`
  font-size: 2.25rem;
  line-height: 2.5rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary[600]};
  margin-bottom: 0.25rem;
`;

const ProgressTotal = styled.span`
  font-size: 1.5rem;
  line-height: 2rem;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const ProgressLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 0.75rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.full};
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressBarFill = styled.div<{ $width: number }>`
  height: 100%;
  background: linear-gradient(to right, ${({ theme }) => theme.colors.primary[500]}, ${({ theme }) => theme.colors.primary[600]});
  border-radius: ${({ theme }) => theme.radius.full};
  width: ${({ $width }) => $width}%;
  transition: width 0.3s ease;
`;

const ProgressPercent = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
  text-align: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ResumeButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: ${({ theme }) => `${theme.spacing.md} 1.5rem`};
  background: ${({ theme }) => theme.colors.primary[600]};
  color: #ffffff;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border-radius: ${({ theme }) => theme.radius.xl};
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary[700]};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.gray[300]};
    cursor: not-allowed;
  }
`;

const RestartButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: ${({ theme }) => `${theme.spacing.md} 1.5rem`};
  background: ${({ theme }) => theme.colors.background.paper};
  color: ${({ theme }) => theme.colors.gray[700]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.gray[300]};
    background: ${({ theme }) => theme.colors.gray[50]};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.gray[100]};
    cursor: not-allowed;
  }
`;

const WarningText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

interface ResumeChoiceStepProps {
  examName: string;
  answeredCount: number;
  totalQuestions: number;
  onResume: () => void;
  onRestart: () => void;
  isLoading: boolean;
}

export const ResumeChoiceStep: React.FC<ResumeChoiceStepProps> = ({
  examName,
  answeredCount,
  totalQuestions,
  onResume,
  onRestart,
  isLoading,
}) => {
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <Container>
      <Wrapper>
        {/* 검사 정보 */}
        <InfoSection>
          <ExamBadge>META 학습종합검사</ExamBadge>
          <ExamName>{examName}</ExamName>
          <InfoText>이전에 응답한 내용이 있습니다</InfoText>
        </InfoSection>

        {/* 진행 상황 카드 */}
        <ProgressCard>
          <ProgressStats>
            <ProgressNumber>
              {answeredCount}
              <ProgressTotal>/{totalQuestions}</ProgressTotal>
            </ProgressNumber>
            <ProgressLabel>문항 응답 완료</ProgressLabel>
          </ProgressStats>

          {/* 프로그레스 바 */}
          <ProgressBarContainer>
            <ProgressBarFill $width={progressPercent} />
          </ProgressBarContainer>
          <ProgressPercent>{progressPercent}% 완료</ProgressPercent>
        </ProgressCard>

        {/* 선택 버튼 */}
        <ButtonGroup>
          <ResumeButton onClick={onResume} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className='w-5 h-5 animate-spin' />
            ) : (
              <PlayCircle className='w-5 h-5' />
            )}
            이어하기
          </ResumeButton>

          <RestartButton onClick={onRestart} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className='w-5 h-5 animate-spin' />
            ) : (
              <RefreshCw className='w-5 h-5' />
            )}
            새로하기
          </RestartButton>
        </ButtonGroup>

        <WarningText>새로하기를 선택하면 기존 응답이 모두 삭제됩니다</WarningText>
      </Wrapper>
    </Container>
  );
};
