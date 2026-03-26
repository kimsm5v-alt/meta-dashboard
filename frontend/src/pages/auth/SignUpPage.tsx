import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  CheckCircle,
} from 'lucide-react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Card } from '@shared/components';
import { useAuth } from '@features/auth/model/AuthContext';

// ============================================================
// 애니메이션
// ============================================================

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ============================================================
// 레이아웃
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

// ============================================================
// 단계 표시
// ============================================================

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const StepDot = styled.div<{ $active: boolean; $done: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  transition: all ${({ theme }) => theme.transitions.normal};

  background-color: ${({ theme, $active, $done }) =>
    $done
      ? theme.colors.primary[500]
      : $active
        ? theme.colors.primary[500]
        : theme.colors.gray[200]};
  color: ${({ $active, $done }) => ($active || $done ? 'white' : '#9ca3af')};

  svg {
    width: 16px;
    height: 16px;
  }
`;

const StepLine = styled.div<{ $done: boolean }>`
  width: 48px;
  height: 2px;
  background-color: ${({ theme, $done }) =>
    $done ? theme.colors.primary[500] : theme.colors.gray[200]};
  transition: background-color ${({ theme }) => theme.transitions.normal};
`;

// ============================================================
// 폼 공통
// ============================================================

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  animation: ${fadeIn} 0.2s ease;
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

const InputWrapper = styled.div`
  position: relative;
`;

const InputIcon = styled.div`
  position: absolute;
  left: ${({ theme }) => theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;

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
  background-color: white;
  box-sizing: border-box;

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

const PrimaryButton = styled.button<{ $isLoading?: boolean }>`
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

// ============================================================
// 이메일 인증 관련
// ============================================================

const EmailRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const EmailInputWrapper = styled(InputWrapper)`
  flex: 1;
`;

const SendCodeButton = styled.button`
  flex-shrink: 0;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 1px solid ${({ theme }) => theme.colors.primary[500]};
  background: white;
  color: ${({ theme }) => theme.colors.primary[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  white-space: nowrap;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary[50]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CodeInputRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const CodeInput = styled(Input)`
  flex: 1;
  letter-spacing: 0.25em;
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const TimerText = styled.span<{ $warning: boolean }>`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme, $warning }) =>
    $warning ? theme.colors.error.main : theme.colors.gray[500]};
  min-width: 40px;
`;

const HintText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const SuccessBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: #16a34a;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  background-color: #f0fdf4;
  padding: 12px ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.xl};

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

// ============================================================
// 성별 선택
// ============================================================

const GenderGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const GenderButton = styled.button<{ $selected: boolean }>`
  flex: 1;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 1px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.primary[500] : theme.colors.gray[300]};
  background-color: ${({ theme, $selected }) =>
    $selected ? theme.colors.primary[50] : 'white'};
  color: ${({ theme, $selected }) =>
    $selected ? theme.colors.primary[600] : theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme, $selected }) =>
    $selected
      ? theme.typography.fontWeight.semibold
      : theme.typography.fontWeight.normal};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[400]};
    background-color: ${({ theme }) => theme.colors.primary[50]};
  }
`;

// ============================================================
// 타입
// ============================================================

type Step = 1 | 2 | 3;

// ============================================================
// 컴포넌트
// ============================================================

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [_searchParams] = useSearchParams();
  const { signUp, sendCode, verifyCode } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Step 2
  const [code, setCode] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);

  // Step 3
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<'M' | 'F' | ''>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ============================================================
  // 타이머
  // ============================================================

  const startTimer = () => {
    setTimer(300); // 5분
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startResendCooldown = () => {
    setResendCooldown(60); // 1분
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ============================================================
  // Step 1: 인증코드 발송
  // ============================================================

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await sendCode(email);
      setCodeSent(true);
      startTimer();
      startResendCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증코드 발송에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextToStep2 = () => {
    if (!codeSent) {
      setError('인증코드를 먼저 발송해주세요.');
      return;
    }
    setError('');
    setStep(2);
  };

  // ============================================================
  // Step 2: 인증코드 확인
  // ============================================================

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      setError('6자리 인증코드를 입력해주세요.');
      return;
    }
    if (timer === 0) {
      setError('인증코드가 만료되었습니다. 다시 발송해주세요.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await verifyCode(email, code);
      setCodeVerified(true);
      setTimeout(() => setStep(3), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증코드가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // Step 3: 회원가입 완료
  // ============================================================

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }
    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }
    if (password.length < 10 || password.length > 64) {
      setError('비밀번호는 10자 이상 64자 이하여야 합니다.');
      return;
    }
    const charTypes = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) =>
      r.test(password),
    ).length;
    if (charTypes < 2) {
      setError('영문 대/소문자, 숫자, 특수문자 중 2가지 이상을 조합해주세요.');
      return;
    }
    if (/(.)\1{3}/.test(password)) {
      setError('동일한 문자를 4회 이상 연속으로 사용할 수 없습니다.');
      return;
    }
    const emailId = email.split('@')[0].toLowerCase();
    if (emailId && password.toLowerCase().includes(emailId)) {
      setError('비밀번호에 이메일 주소를 포함할 수 없습니다.');
      return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      await signUp({
        name: nickname.trim(),
        email,
        password,
        gender: gender || undefined,
      });
      toast.success('회원가입이 완료되었습니다. 로그인해주세요.');
      navigate('/login', { replace: true, state: { signUpSuccess: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // 단계별 제목
  // ============================================================

  const stepTitles: Record<Step, { title: string; subtitle: string }> = {
    1: { title: '이메일 인증', subtitle: '가입할 이메일로 인증코드를 받으세요' },
    2: { title: '코드 확인', subtitle: `${email}으로 발송된 6자리 코드를 입력하세요` },
    3: { title: '정보 입력', subtitle: '계정 정보를 입력해주세요' },
  };

  return (
    <PageContainer>
      <LogoSection>
        <LogoTitle>
          <BrandText>비상교육</BrandText> 학습심리정서검사
        </LogoTitle>
        <LogoSubtitle>AI 기반 맞춤형 학습 코칭 시스템</LogoSubtitle>
      </LogoSection>

      <StyledCard>
        <BackButton
          onClick={() => {
            if (step === 1) {
              navigate('/login');
            } else if (step === 3) {
              setCodeVerified(false);
              setCode('');
              setError('');
              setStep(2);
            } else {
              setError('');
              setStep((step - 1) as Step);
            }
          }}
        >
          <ArrowLeft />
        </BackButton>

        <HeaderSection>
          <StepIndicator>
            <StepDot $active={step === 1} $done={step > 1}>
              {step > 1 ? <CheckCircle /> : '1'}
            </StepDot>
            <StepLine $done={step > 1} />
            <StepDot $active={step === 2} $done={step > 2}>
              {step > 2 ? <CheckCircle /> : '2'}
            </StepDot>
            <StepLine $done={step > 2} />
            <StepDot $active={step === 3} $done={false}>
              3
            </StepDot>
          </StepIndicator>
          <HeaderTitle>{stepTitles[step].title}</HeaderTitle>
          <HeaderSubtitle>{stepTitles[step].subtitle}</HeaderSubtitle>
        </HeaderSection>

        {/* ── Step 1: 이메일 입력 ── */}
        {step === 1 && (
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              handleNextToStep2();
            }}
          >
            <FormGroup>
              <Label htmlFor='email'>
                이메일 <RequiredMark>*</RequiredMark>
              </Label>
              <EmailRow>
                <EmailInputWrapper>
                  <InputIcon>
                    <Mail />
                  </InputIcon>
                  <Input
                    id='email'
                    type='email'
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setCodeSent(false);
                    }}
                    placeholder='example@email.com'
                    disabled={isLoading}
                    autoComplete='email'
                    $hasLeftIcon
                  />
                </EmailInputWrapper>
                <SendCodeButton
                  type='button'
                  onClick={handleSendCode}
                  disabled={isLoading || !email.trim() || resendCooldown > 0}
                >
                  {resendCooldown > 0
                    ? `재발송 (${resendCooldown}s)`
                    : codeSent
                      ? '재발송'
                      : '인증코드 발송'}
                </SendCodeButton>
              </EmailRow>
              {codeSent && (
                <HintText>인증코드가 발송되었습니다. 이메일을 확인해주세요.</HintText>
              )}
            </FormGroup>

            {error && (
              <ErrorMessage>
                <AlertCircle />
                {error}
              </ErrorMessage>
            )}

            <PrimaryButton type='submit' disabled={!codeSent}>
              다음
            </PrimaryButton>

            <LoginLink>
              이미 계정이 있으신가요? <StyledLink to='/login'>로그인</StyledLink>
            </LoginLink>
          </Form>
        )}

        {/* ── Step 2: 인증코드 확인 ── */}
        {step === 2 && (
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyCode();
            }}
          >
            <FormGroup>
              <Label htmlFor='code'>
                인증코드 <RequiredMark>*</RequiredMark>
              </Label>
              <CodeInputRow>
                <CodeInput
                  id='code'
                  type='text'
                  inputMode='numeric'
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder='000000'
                  disabled={isLoading || codeVerified}
                  autoComplete='one-time-code'
                />
                {timer > 0 && (
                  <TimerText $warning={timer <= 60}>{formatTimer(timer)}</TimerText>
                )}
              </CodeInputRow>
              {timer === 0 && !codeVerified && (
                <HintText>
                  코드가 만료되었습니다.{' '}
                  <button
                    type='button'
                    onClick={() => {
                      setStep(1);
                      setCode('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#8b5cf6',
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: 'inherit',
                    }}
                  >
                    이메일 단계로 돌아가기
                  </button>
                </HintText>
              )}
            </FormGroup>

            {codeVerified && (
              <SuccessBanner>
                <CheckCircle />
                인증이 완료되었습니다.
              </SuccessBanner>
            )}

            {error && !codeVerified && (
              <ErrorMessage>
                <AlertCircle />
                {error}
              </ErrorMessage>
            )}

            <PrimaryButton type='submit' disabled={isLoading || codeVerified || code.length !== 6}>
              {isLoading ? <Spinner /> : '인증 확인'}
            </PrimaryButton>
          </Form>
        )}

        {/* ── Step 3: 정보 입력 ── */}
        {step === 3 && (
          <Form onSubmit={handleSignUp}>
            {/* 닉네임 */}
            <FormGroup>
              <Label htmlFor='nickname'>
                닉네임 <RequiredMark>*</RequiredMark>
              </Label>
              <InputWrapper>
                <InputIcon>
                  <User />
                </InputIcon>
                <Input
                  id='nickname'
                  type='text'
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder='홍길동'
                  disabled={isLoading}
                  autoComplete='nickname'
                  $hasLeftIcon
                />
              </InputWrapper>
            </FormGroup>

            {/* 성별 */}
            <FormGroup>
              <Label>성별</Label>
              <GenderGroup>
                <GenderButton
                  type='button'
                  $selected={gender === 'M'}
                  onClick={() => setGender('M')}
                >
                  남성
                </GenderButton>
                <GenderButton
                  type='button'
                  $selected={gender === 'F'}
                  onClick={() => setGender('F')}
                >
                  여성
                </GenderButton>
              </GenderGroup>
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='10자 이상 입력하세요'
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

            {error && (
              <ErrorMessage>
                <AlertCircle />
                {error}
              </ErrorMessage>
            )}

            <PrimaryButton type='submit' disabled={isLoading}>
              {isLoading ? (
                <Spinner />
              ) : (
                <>
                  <UserPlus />
                  <span>가입 완료</span>
                </>
              )}
            </PrimaryButton>

            <LoginLink>
              이미 계정이 있으신가요? <StyledLink to='/login'>로그인</StyledLink>
            </LoginLink>
          </Form>
        )}
      </StyledCard>
    </PageContainer>
  );
};
