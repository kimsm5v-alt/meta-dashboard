import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Sparkles } from 'lucide-react';
import { generateSelfregAISummary } from '@shared/utils/selfregSummaryGenerator';

const Container = styled.div``;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const HeaderIcon = styled(Sparkles)`
  width: 1.25rem;
  height: 1.25rem;
  color: #6366f1;
`;

const HeaderTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[800]};
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 8rem;
`;

const LoadingContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  animation: ${spin} 1s linear infinite;
  border-radius: ${({ theme }) => theme.radius.full};
  height: 2rem;
  width: 2rem;
  border-bottom: 2px solid #6366f1;
`;

const LoadingText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const SummaryCard = styled.div`
  position: relative;
  background: linear-gradient(to bottom right, #eef2ff, #dbeafe, #f3e8ff);
  border-radius: 0.75rem;
  padding: 1.5rem;
  border: 1px solid #e0e7ff;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const SummaryText = styled.p`
  color: ${({ theme }) => theme.colors.gray[800]};
  white-space: pre-line;
  line-height: 1.625;
  font-size: 15px;
`;

interface SelfregDiagnosisSummaryProps {
  tScores: number[];
}

export const SelfregDiagnosisSummary: React.FC<SelfregDiagnosisSummaryProps> = ({ tScores }) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const aiSummary = await generateSelfregAISummary(tScores);
        setSummary(aiSummary);
      } catch {
        setSummary('총평을 생성하는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [tScores]);

  return (
    <Container>
      <Header>
        <HeaderIcon />
        <HeaderTitle>AI 분석 총평</HeaderTitle>
      </Header>
      {loading ? (
        <LoadingContainer>
          <LoadingContent>
            <Spinner />
            <LoadingText>AI가 분석 중입니다...</LoadingText>
          </LoadingContent>
        </LoadingContainer>
      ) : (
        <SummaryCard>
          <SummaryText>{summary}</SummaryText>
        </SummaryCard>
      )}
    </Container>
  );
};

export default SelfregDiagnosisSummary;
