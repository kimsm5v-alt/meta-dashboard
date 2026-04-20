import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { User as UserType } from '@shared/types';
import styled from '@emotion/styled';
import { Card } from '@shared/components';
import { useAuth } from '@features/auth/model/AuthContext';
import { useSpAuth } from '@shared/hooks/useSpAuth';

// ============================================================
// 스타일
// ============================================================

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    to bottom right,
    ${({ theme }) => theme.colors.gray[50]},
    ${({ theme }) => theme.colors.gray[100]}
  );
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.md};
`;

const LogoSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

const LogoTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const BrandText = styled.span`
  color: ${({ theme }) => theme.colors.primary[500]};
`;

const LogoSubtitle = styled.p`
  margin-top: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  padding: ${({ theme }) => theme.spacing['2xl']};
  text-align: center;
`;

const SsoButton = styled.button`
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const GuestLink = styled.button`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.lg};
  background: transparent;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;
  width: 100%;
  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

// ============================================================
// 헬퍼
// ============================================================

const getRedirectPathByRole = (user: UserType, explicitRedirect: string | null): string => {
  if (explicitRedirect) return explicitRedirect;
  if (user.roleCode === 'STUDENT') return '/student/exams';
  return '/dashboard';
};

// ============================================================
// 컴포넌트
// ============================================================

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { isAuthenticated, isLoading, user } = useAuth();
  const { login } = useSpAuth();

  // 이미 로그인 상태면 역할 기반 리다이렉트
  useEffect(() => {
    if (isAuthenticated && !isLoading && user) {
      navigate(getRedirectPathByRole(user, redirectTo), { replace: true });
    }
  }, [isAuthenticated, isLoading, user, navigate, redirectTo]);

  const handleSsoLogin = () => {
    // returnPath를 지정하지 않으면 main.tsx에서 역할 기반 리다이렉트
    login(redirectTo || undefined);
  };

  const handleGuestEntry = () => {
    navigate('/exam');
  };

  if (isLoading) return null;
  if (isAuthenticated) return null;

  return (
    <PageContainer>
      <LogoSection>
        <LogoTitle>
          <BrandText>META</BrandText> 학습심리검사
        </LogoTitle>
        <LogoSubtitle>학습 습관과 마음 상태를 이해하고 성장을 돕습니다</LogoSubtitle>
      </LogoSection>

      <StyledCard>
        <SsoButton onClick={handleSsoLogin}>로그인</SsoButton>
        <GuestLink onClick={handleGuestEntry}>게스트로 참여하기</GuestLink>
      </StyledCard>
    </PageContainer>
  );
};

export default LoginPage;
