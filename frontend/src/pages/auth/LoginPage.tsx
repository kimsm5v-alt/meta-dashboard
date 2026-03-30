import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, FlaskConical, User } from 'lucide-react';
import type { User as UserType } from '@shared/types';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Card } from '@shared/components';
import { TestLoginForm, LoginForm } from '@features/auth/ui';
import { useAuth } from '@features/auth/model/AuthContext';
import type { TestCredentials } from '@features/auth/ui';

type LoginMode = 'select' | 'normal' | 'test';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const LoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.gray[50]};
`;

const Spinner = styled.div`
  animation: ${spin} 1s linear infinite;
  border-radius: 50%;
  height: 32px;
  width: 32px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.primary[500]};
`;

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
  padding: 0 ${({ theme }) => theme.spacing.md};
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
  max-width: 448px;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const BackButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[100]};
  }

  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.gray[500]};
  }
`;

const HeaderSection = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding-top: ${({ theme }) => theme.spacing.md};
`;

const HeaderTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const HeaderSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ModeButton = styled.button<{ $colorScheme: 'primary' | 'amber' }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} 20px;
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  background-color: white;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme, $colorScheme }) =>
      $colorScheme === 'primary' ? theme.colors.primary[500] : '#fbbf24'};
    background-color: ${({ theme, $colorScheme }) =>
      $colorScheme === 'primary' ? theme.colors.primary[50] : '#fffbeb'};
  }
`;

const IconWrapper = styled.div<{ $colorScheme: 'primary' | 'amber' }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ $colorScheme }) => ($colorScheme === 'primary' ? '#f3e8ff' : '#fef3c7')};
  transition: background-color ${({ theme }) => theme.transitions.fast};

  ${ModeButton}:hover & {
    background-color: ${({ $colorScheme }) => ($colorScheme === 'primary' ? '#e9d5ff' : '#fde68a')};
  }

  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme, $colorScheme }) =>
      $colorScheme === 'primary' ? theme.colors.primary[600] : '#d97706'};
  }
`;

const ButtonTextWrapper = styled.div`
  text-align: left;
`;

const ButtonTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const ButtonDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const BottomInfo = styled.p`
  margin-top: ${({ theme }) => theme.spacing.xl};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  text-align: center;
  max-width: 384px;
`;

const getRedirectPathByRole = (user: UserType, explicitRedirect: string | null): string => {
  if (explicitRedirect) return explicitRedirect;
  if (user.roleCode === 'STUDENT') return '/student/exams';
  return '/dashboard';
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { isAuthenticated, isLoading, user, loginWithCredentials, loginWithEmail } = useAuth();
  const [loginLoading, setLoginLoading] = useState(false);
  // const [mode, setMode] = useState<LoginMode>('select');

  // 로그인 완료(또는 이미 로그인) 시 역할 기반 리다이렉트
  useEffect(() => {
    if (isAuthenticated && !isLoading && user) {
      navigate(getRedirectPathByRole(user, redirectTo), { replace: true });
    }
  }, [isAuthenticated, isLoading, user, navigate, redirectTo]);

  const handleTestLogin = async (credentials: TestCredentials) => {
    setLoginLoading(true);
    try {
      await loginWithCredentials(credentials);
      toast.success('로그인되었습니다.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleEmailLogin = async (email: string, password: string) => {
    setLoginLoading(true);
    try {
      await loginWithEmail(email, password);
      // 리다이렉트는 useEffect가 처리
    } catch (err) {
      throw err;
    } finally {
      setLoginLoading(false);
    }
  };

  if (isLoading) {
    return (
      <LoadingContainer>
        <Spinner />
      </LoadingContainer>
    );
  }

  return (
    <PageContainer>
      {/* 로고 */}
      <LogoSection>
        <LogoTitle>
          <BrandText>비상교육</BrandText> 학습심리정서검사
        </LogoTitle>
        <LogoSubtitle>AI 기반 맞춤형 학습 코칭 시스템</LogoSubtitle>
      </LogoSection>

      {/* 모드 선택 화면 */}
        {/* <StyledCard>
          <BackButton onClick={() => navigate('/')}>
            <ArrowLeft />
          </BackButton>

          <HeaderSection>
            <HeaderTitle>로그인</HeaderTitle>
            <HeaderSubtitle>로그인 방식을 선택해주세요</HeaderSubtitle>
          </HeaderSection>

          <ButtonGroup>
            <ModeButton $colorScheme='primary' onClick={() => setMode('normal')}>
              <IconWrapper $colorScheme='primary'>
                <User />
              </IconWrapper>
              <ButtonTextWrapper>
                <ButtonTitle>로그인</ButtonTitle>
                <ButtonDescription>이메일과 비밀번호로 로그인</ButtonDescription>
              </ButtonTextWrapper>
            </ModeButton>

            <ModeButton $colorScheme='amber' onClick={() => setMode('test')}>
              <IconWrapper $colorScheme='amber'>
                <FlaskConical />
              </IconWrapper>
              <ButtonTextWrapper>
                <ButtonTitle>테스트 계정 로그인</ButtonTitle>
                <ButtonDescription>API 테스트용 임시 로그인</ButtonDescription>
              </ButtonTextWrapper>
            </ModeButton>
          </ButtonGroup>
        </StyledCard> */}
      

      {/* 일반 로그인 폼 */}
        <StyledCard>
          <BackButton onClick={() => navigate('/')}>
            <ArrowLeft />
          </BackButton>

          <HeaderSection>
            <HeaderTitle>로그인</HeaderTitle>
            <HeaderSubtitle>이메일과 비밀번호를 입력하세요</HeaderSubtitle>
          </HeaderSection>

          <LoginForm onLogin={handleEmailLogin} isLoading={loginLoading} />
        </StyledCard>
      

      {/* 테스트 로그인 폼 */}
      {/* {mode === 'test' && <TestLoginForm onLogin={handleTestLogin} isLoading={loginLoading} />} */}

      {/* 하단 안내 */}
      {/* {mode === 'select' && <BottomInfo>계정이 없으시면 회원가입 후 이용해주세요.</BottomInfo>} */}
    </PageContainer>
  );
};
