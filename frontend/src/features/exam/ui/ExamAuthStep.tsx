import type React from 'react';
import { useState } from 'react';
import styled from '@emotion/styled';
import { LoginForm } from '@features/auth/ui/LoginForm';

interface ExamAuthStepProps {
  examName: string;
  examCode: string;
  onGuestStart: () => void;
}

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(
    to bottom right,
    ${({ theme }) => theme.colors.primary[50]},
    white,
    #eef2ff
  );
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 28rem;
`;

const HeaderSection = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary[100]};
  color: ${({ theme }) => theme.colors.primary[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const FormCard = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: 1rem;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: ${({ theme }) => theme.spacing.xl};
`;

export const ExamAuthStep: React.FC<ExamAuthStepProps> = ({ examName, examCode, onGuestStart }) => {
  const [loginLoading] = useState(false);

  const handleLogin = async () => {
    // SSO 전환: Auth 서버로 리다이렉트
    const { getAuth } = await import('@shared/lib/authClient');
    const auth = getAuth();
    await auth.login({ redirectPath: window.location.pathname });
  };

  return (
    <PageContainer>
      <ContentWrapper>
        {/* 검사 정보 */}
        <HeaderSection>
          <Badge>META 학습종합검사</Badge>
          <Title>{examName}</Title>
          <Subtitle>검사를 응시하려면 로그인해주세요</Subtitle>
        </HeaderSection>

        {/* 로그인 폼 */}
        <FormCard>
          <LoginForm
            onLogin={handleLogin}
            isLoading={loginLoading}
            onGuestLogin={onGuestStart}
            redirectPath={`/exam/${examCode}`}
          />
        </FormCard>
      </ContentWrapper>
    </PageContainer>
  );
};
