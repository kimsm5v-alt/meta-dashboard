import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { ArrowLeft, Send, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { Card } from '@shared/components';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom right, ${({ theme }) => theme.colors.gray[50]}, ${({ theme }) => theme.colors.gray[100]});
  padding: 0 1rem;
`;

const LogoSection = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

const LogoTitle = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const BrandText = styled.span`
  color: ${({ theme }) => theme.colors.primary[500]};
`;

const LogoSubtitle = styled.p`
  margin-top: 0.5rem;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 28rem;
  padding: 2rem;
  position: relative;
`;

const BackButton = styled.button`
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background-color 0.15s ease;
  background: transparent;
  border: none;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const BackIcon = styled(ArrowLeft)`
  width: 1.25rem;
  height: 1.25rem;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const SuccessSection = styled.div`
  text-align: center;
  padding: 1rem 0;
`;

const SuccessIconCircle = styled.div`
  width: 4rem;
  height: 4rem;
  border-radius: 9999px;
  background: #d1fae5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
`;

const SuccessIcon = styled(CheckCircle)`
  width: 2rem;
  height: 2rem;
  color: #10b981;
`;

const SuccessTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const SuccessMessage = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
`;

const EmailText = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const SpamNotice = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-bottom: 1.5rem;
`;

const BackToLoginLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 500;
  background: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const FormHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  padding-top: 1rem;
`;

const FormTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const FormSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.25rem;
  font-size: 0.875rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div``;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.25rem;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const MailIcon = styled(Mail)`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: 0.75rem;
  outline: none;
  transition: all 0.15s ease;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorAlert = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #dc2626;
  background: #fef2f2;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
`;

const ErrorIcon = styled(AlertCircle)`
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
`;

const SubmitButton = styled.button<{ $isLoading: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border-radius: 0.75rem;
  font-weight: 500;
  background: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.25), 0 4px 6px -4px rgba(139, 92, 246, 0.25);

  &:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
  }

  ${({ $isLoading }) =>
    $isLoading &&
    `
    opacity: 0.5;
    cursor: not-allowed;
  `}
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const LoadingSpinner = styled.div`
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 9999px;
  animation: ${spin} 1s linear infinite;
`;

const SendIcon = styled(Send)`
  width: 1.25rem;
  height: 1.25rem;
`;

const LoginPrompt = styled.p`
  text-align: center;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  padding-top: 0.25rem;
`;

const LoginLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary[500]};
  font-weight: 500;
  text-decoration: none;
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: 실제 비밀번호 재설정 API 호출
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      {/* 로고 */}
      <LogoSection>
        <LogoTitle>
          <BrandText>비상교육</BrandText> 학습심리정서검사
        </LogoTitle>
        <LogoSubtitle>AI 기반 맞춤형 학습 코칭 시스템</LogoSubtitle>
      </LogoSection>

      <StyledCard>
        {/* 뒤로가기 */}
        <BackButton onClick={() => navigate('/login')}>
          <BackIcon />
        </BackButton>

        {/* 전송 완료 상태 */}
        {isSent ? (
          <SuccessSection>
            <SuccessIconCircle>
              <SuccessIcon />
            </SuccessIconCircle>
            <SuccessTitle>이메일을 확인하세요</SuccessTitle>
            <SuccessMessage>
              <EmailText>{email}</EmailText>으로
              <br />
              비밀번호 재설정 링크를 보냈습니다.
            </SuccessMessage>
            <SpamNotice>이메일이 도착하지 않았다면 스팸 폴더를 확인해주세요.</SpamNotice>
            <BackToLoginLink to='/login'>로그인으로 돌아가기</BackToLoginLink>
          </SuccessSection>
        ) : (
          <>
            {/* 헤더 */}
            <FormHeader>
              <FormTitle>비밀번호 찾기</FormTitle>
              <FormSubtitle>
                가입한 이메일을 입력하시면
                <br />
                비밀번호 재설정 링크를 보내드립니다.
              </FormSubtitle>
            </FormHeader>

            {/* 폼 */}
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor='reset-email'>이메일</Label>
                <InputWrapper>
                  <MailIcon />
                  <Input
                    id='reset-email'
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='example@email.com'
                    disabled={isLoading}
                    autoComplete='email'
                    autoFocus
                  />
                </InputWrapper>
              </FormGroup>

              {/* 에러 메시지 */}
              {error && (
                <ErrorAlert>
                  <ErrorIcon />
                  {error}
                </ErrorAlert>
              )}

              {/* 전송 버튼 */}
              <SubmitButton type='submit' disabled={isLoading} $isLoading={isLoading}>
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <SendIcon />
                    <span>재설정 링크 보내기</span>
                  </>
                )}
              </SubmitButton>

              {/* 로그인 링크 */}
              <LoginPrompt>
                비밀번호가 기억나셨나요? <LoginLink to='/login'>로그인</LoginLink>
              </LoginPrompt>
            </Form>
          </>
        )}
      </StyledCard>
    </PageContainer>
  );
};
