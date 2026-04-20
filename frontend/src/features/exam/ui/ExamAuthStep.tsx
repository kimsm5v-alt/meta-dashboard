import type React from 'react';
import styled from '@emotion/styled';

interface ExamAuthStepProps {
  examName: string;
  examCode: string;
  onGuestStart: () => void;
}

const PageContainer = styled.div`
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const ContentWrapper = styled.div`
  width: 100%;
  max-width: 480px;
  text-align: center;
`;
const HeaderSection = styled.div`
  margin-bottom: 2rem;
`;
const Badge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.primary[50]};
  color: ${({ theme }) => theme.colors.primary[600]};
  font-size: 0.8125rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
`;
const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
`;
const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.5rem;
`;
const FormCard = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: 1rem;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;
const SsoButton = styled.button`
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.primary[600]}; }
`;
const GuestButton = styled.button`
  width: 100%;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 0.75rem;
  background: transparent;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: 0.875rem;
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.gray[50]}; }
`;

export const ExamAuthStep: React.FC<ExamAuthStepProps> = ({ examName, examCode, onGuestStart }) => {
  const handleLogin = async () => {
    const { getAuth } = await import('@shared/lib/authClient');
    const auth = getAuth();
    await auth.login({ redirectPath: `/exam/${examCode}` });
  };

  return (
    <PageContainer>
      <ContentWrapper>
        <HeaderSection>
          <Badge>META 학습종합검사</Badge>
          <Title>{examName}</Title>
          <Subtitle>검사를 응시하려면 로그인해주세요</Subtitle>
        </HeaderSection>

        <FormCard>
          <SsoButton onClick={handleLogin}>
            로그인 / 회원가입
          </SsoButton>
          <GuestButton onClick={onGuestStart}>
            게스트로 참여하기
          </GuestButton>
        </FormCard>
      </ContentWrapper>
    </PageContainer>
  );
};
