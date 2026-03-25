import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  School,
} from 'lucide-react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Card } from '@shared/components';
import { useAuth } from '@features/auth/model/AuthContext';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
  max-width: 448px;
  padding: ${({ theme }) => theme.spacing.xl};
  position: relative;
`;

const BackButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.lg};
  left: ${({ theme }) => theme.spacing.lg};
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

const RequiredMark = styled.span`
  color: ${({ theme }) => theme.colors.error.main};
`;

const OptionalMark = styled.span`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const InputWrapper = styled.div`
  position: relative;
`;

const InputIcon = styled.div`
  position: absolute;
  left: ${({ theme }) => theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);

  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const Input = styled.input<{ $hasLeftIcon?: boolean; $hasRightIcon?: boolean }>`
  width: 100%;
  padding: 12px ${({ theme }) => theme.spacing.md};
  padding-left: ${({ $hasLeftIcon }) => ($hasLeftIcon ? '48px' : undefined)};
  padding-right: ${({ $hasRightIcon }) => ($hasRightIcon ? '48px' : undefined)};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.xl};
  outline: none;
  transition: all ${({ theme }) => theme.transitions.fast};
  font-size: ${({ theme }) => theme.typography.fontSize.base};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[200]};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.gray[100]};
    cursor: not-allowed;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: ${({ theme }) => theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color ${({ theme }) => theme.transitions.fast};
  color: ${({ theme }) => theme.colors.gray[400]};

  &:hover {
    color: ${({ theme }) => theme.colors.gray[600]};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.error.main};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  background-color: ${({ theme }) => theme.colors.error.light};
  padding: 12px ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.xl};

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

const SubmitButton = styled.button<{ $isLoading?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 14px ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background-color: ${({ theme }) => theme.colors.primary[500]};
  color: white;
  border: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.normal};
  box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.25);

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary[600]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoginLink = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  padding-top: ${({ theme }) => theme.spacing.xs};
`;

const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary[500]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  transition: color ${({ theme }) => theme.transitions.fast};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    schoolName: '',
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (!form.email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    if (!form.password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }
    if (form.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      await signUp({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        schoolName: form.schoolName.trim() || undefined,
      });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
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
          <ArrowLeft />
        </BackButton>

        {/* 헤더 */}
        <HeaderSection>
          <HeaderTitle>회원가입</HeaderTitle>
          <HeaderSubtitle>새 계정을 만들어주세요</HeaderSubtitle>
        </HeaderSection>

        {/* 폼 */}
        <Form onSubmit={handleSubmit}>
          {/* 이름 */}
          <FormGroup>
            <Label htmlFor='name'>
              이름 <RequiredMark>*</RequiredMark>
            </Label>
            <InputWrapper>
              <InputIcon>
                <User />
              </InputIcon>
              <Input
                id='name'
                type='text'
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder='홍길동'
                disabled={isLoading}
                autoComplete='name'
                $hasLeftIcon
              />
            </InputWrapper>
          </FormGroup>

          {/* 이메일 */}
          <FormGroup>
            <Label htmlFor='email'>
              이메일 <RequiredMark>*</RequiredMark>
            </Label>
            <InputWrapper>
              <InputIcon>
                <Mail />
              </InputIcon>
              <Input
                id='email'
                type='email'
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder='example@email.com'
                disabled={isLoading}
                autoComplete='email'
                $hasLeftIcon
              />
            </InputWrapper>
          </FormGroup>

          {/* 비밀번호 */}
          <FormGroup>
            <Label htmlFor='signup-password'>
              비밀번호 <RequiredMark>*</RequiredMark>
            </Label>
            <InputWrapper>
              <InputIcon>
                <Lock />
              </InputIcon>
              <Input
                id='signup-password'
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder='8자 이상 입력하세요'
                disabled={isLoading}
                autoComplete='new-password'
                $hasLeftIcon
                $hasRightIcon
              />
              <PasswordToggle
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </PasswordToggle>
            </InputWrapper>
          </FormGroup>

          {/* 비밀번호 확인 */}
          <FormGroup>
            <Label htmlFor='confirmPassword'>
              비밀번호 확인 <RequiredMark>*</RequiredMark>
            </Label>
            <InputWrapper>
              <InputIcon>
                <Lock />
              </InputIcon>
              <Input
                id='confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder='비밀번호를 다시 입력하세요'
                disabled={isLoading}
                autoComplete='new-password'
                $hasLeftIcon
                $hasRightIcon
              />
              <PasswordToggle
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff /> : <Eye />}
              </PasswordToggle>
            </InputWrapper>
          </FormGroup>

          {/* 학교명 (선택) */}
          <FormGroup>
            <Label htmlFor='schoolName'>
              학교명 <OptionalMark>(선택)</OptionalMark>
            </Label>
            <InputWrapper>
              <InputIcon>
                <School />
              </InputIcon>
              <Input
                id='schoolName'
                type='text'
                value={form.schoolName}
                onChange={(e) => updateField('schoolName', e.target.value)}
                placeholder='소속 학교명'
                disabled={isLoading}
                $hasLeftIcon
              />
            </InputWrapper>
          </FormGroup>

          {/* 에러 메시지 */}
          {error && (
            <ErrorMessage>
              <AlertCircle />
              {error}
            </ErrorMessage>
          )}

          {/* 가입 버튼 */}
          <SubmitButton type='submit' disabled={isLoading} $isLoading={isLoading}>
            {isLoading ? (
              <Spinner />
            ) : (
              <>
                <UserPlus />
                <span>회원가입</span>
              </>
            )}
          </SubmitButton>

          {/* 로그인 링크 */}
          <LoginLink>
            이미 계정이 있으신가요? <StyledLink to='/login'>로그인</StyledLink>
          </LoginLink>
        </Form>
      </StyledCard>
    </PageContainer>
  );
};
