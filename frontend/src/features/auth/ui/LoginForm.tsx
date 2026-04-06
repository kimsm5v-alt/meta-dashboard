import type React from 'react';
import { useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Link } from 'react-router-dom';
import { LogIn, AlertCircle, Eye, EyeOff, Mail, Lock, UserPlus } from 'lucide-react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  /** 게스트 로그인 콜백 (있으면 게스트 로그인 버튼 표시) */
  onGuestLogin?: () => void;
  /** redirect 경로 (비밀번호찾기/회원가입 링크에 쿼리파라미터로 전달) */
  redirectPath?: string;
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const FormGroup = styled.div``;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const InputWrapper = styled.div`
  position: relative;
`;

const InputIcon = styled.span`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  display: inline-flex;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const Input = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid
    ${({ theme, $hasError }) => ($hasError ? '#dc2626' : theme.colors.gray[300])};
  border-radius: 0.75rem;
  outline: none;
  transition: all 0.15s ease;

  &:focus {
    outline: 2px solid
      ${({ theme, $hasError }) => ($hasError ? '#dc2626' : theme.colors.primary[500])};
    outline-offset: 2px;
    border-color: ${({ theme, $hasError }) =>
      $hasError ? '#dc2626' : theme.colors.primary[500]};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &[type='password'] {
    padding-right: 3rem;
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.gray[400]};
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s ease;
  padding: 0;
  width: 1.25rem;
  height: 1.25rem;
  display: inline-flex;

  &:hover {
    color: ${({ theme }) => theme.colors.gray[600]};
  }

  svg {
    width: 100%;
    height: 100%;
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: #dc2626;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  background: #fef2f2;
  padding: 0.75rem ${({ theme }) => theme.spacing.md};
  border-radius: 0.75rem;
`;

const ErrorIcon = styled.span`
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  display: inline-flex;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const SubmitButton = styled.button<{ $isLoading: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 0.875rem ${({ theme }) => theme.spacing.md};
  border-radius: 0.75rem;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.25);
  opacity: ${({ $isLoading }) => ($isLoading ? 0.5 : 1)};
  cursor: ${({ $isLoading }) => ($isLoading ? 'not-allowed' : 'pointer')};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const ButtonIcon = styled.span`
  width: 1.25rem;
  height: 1.25rem;
  display: inline-flex;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.div`
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: ${({ theme }) => theme.radius.full};
  animation: ${spin} 1s linear infinite;
`;

const LinksContainer = styled.div<{ $hasGuest: boolean }>`
  display: flex;
  align-items: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  padding-top: ${({ theme }) => theme.spacing.xs};
  justify-content: ${({ $hasGuest }) => ($hasGuest ? 'center' : 'space-between')};
  gap: ${({ $hasGuest, theme }) => ($hasGuest ? theme.spacing.md : 0)};
`;

const StyledLink = styled(Link)<{ $isPrimary?: boolean }>`
  color: ${({ $isPrimary, theme }) => ($isPrimary ? theme.colors.primary[500] : theme.colors.gray[500])};
  font-weight: ${({ $isPrimary, theme }) =>
    $isPrimary ? theme.typography.fontWeight.medium : theme.typography.fontWeight.normal};
  transition: color 0.15s ease;
  text-decoration: none;

  &:hover {
    color: ${({ $isPrimary, theme }) => ($isPrimary ? theme.colors.primary[600] : theme.colors.primary[500])};
  }
`;

const Divider = styled.span`
  color: ${({ theme }) => theme.colors.gray[300]};
`;

const GuestButton = styled.button`
  color: ${({ theme }) => theme.colors.gray[500]};
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.15s ease;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[500]};
  }
`;

const GuestIcon = styled.span`
  width: 0.875rem;
  height: 0.875rem;
  display: inline-flex;

  svg {
    width: 100%;
    height: 100%;
  }
`;

export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  isLoading,
  onGuestLogin,
  redirectPath,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  // 서버 인증 실패 시 두 필드 모두 강조
  const [authFailed, setAuthFailed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthFailed(false);

    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    try {
      await onLogin(email.trim(), password.trim());
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그인에 실패했습니다.';
      setError(message);
      setAuthFailed(true);
    }
  };

  const forgotPasswordUrl = redirectPath
    ? `/forgot-password?redirect=${encodeURIComponent(redirectPath)}`
    : '/forgot-password';
  const signupUrl = redirectPath
    ? `/signup?redirect=${encodeURIComponent(redirectPath)}`
    : '/signup';

  return (
    <Form onSubmit={handleSubmit}>
      {/* 이메일 */}
      <FormGroup>
        <Label htmlFor='email'>이메일</Label>
        <InputWrapper>
          <InputIcon>
            <Mail />
          </InputIcon>
          <Input
            id='email'
            type='email'
            value={email}
            onChange={(e) => { setEmail(e.target.value); setAuthFailed(false); setError(''); }}
            placeholder='example@email.com'
            disabled={isLoading}
            autoComplete='email'
            $hasError={authFailed}
          />
        </InputWrapper>
      </FormGroup>

      {/* 비밀번호 */}
      <FormGroup>
        <Label htmlFor='password'>비밀번호</Label>
        <InputWrapper>
          <InputIcon>
            <Lock />
          </InputIcon>
          <Input
            id='password'
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setAuthFailed(false); setError(''); }}
            placeholder='비밀번호를 입력하세요'
            disabled={isLoading}
            autoComplete='current-password'
            $hasError={authFailed}
          />
          <PasswordToggle type='button' onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
            {showPassword ? <EyeOff /> : <Eye />}
          </PasswordToggle>
        </InputWrapper>
      </FormGroup>

      {/* 에러 메시지 */}
      {error && (
        <ErrorMessage>
          <ErrorIcon>
            <AlertCircle />
          </ErrorIcon>
          {error}
        </ErrorMessage>
      )}

      {/* 로그인 버튼 */}
      <SubmitButton type='submit' disabled={isLoading} $isLoading={isLoading}>
        {isLoading ? (
          <Spinner />
        ) : (
          <>
            <ButtonIcon>
              <LogIn />
            </ButtonIcon>
            <span>로그인</span>
          </>
        )}
      </SubmitButton>

      {/* 비밀번호 찾기 / 회원가입 / 게스트 로그인 */}
      <LinksContainer $hasGuest={!!onGuestLogin}>
        <StyledLink to={forgotPasswordUrl}>비밀번호 찾기</StyledLink>
        {onGuestLogin && <Divider>|</Divider>}
        <StyledLink to={signupUrl} $isPrimary>
          회원가입
        </StyledLink>
        {onGuestLogin && (
          <>
            <Divider>|</Divider>
            <GuestButton type='button' onClick={onGuestLogin}>
              <GuestIcon>
                <UserPlus />
              </GuestIcon>
              게스트 로그인
            </GuestButton>
          </>
        )}
      </LinksContainer>
    </Form>
  );
};
