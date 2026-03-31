import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  GraduationCap,
  BookOpen,
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
// 역할 선택
// ============================================================

const RoleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const RoleButton = styled.button<{ $selected: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} 20px;
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 2px solid
    ${({ theme, $selected }) => ($selected ? theme.colors.primary[500] : theme.colors.gray[200])};
  background-color: ${({ theme, $selected }) =>
    $selected ? theme.colors.primary[50] : 'white'};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  text-align: left;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    background-color: ${({ theme }) => theme.colors.primary[50]};
  }
`;

const RoleIcon = styled.div<{ $selected: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background-color: ${({ theme, $selected }) =>
    $selected ? theme.colors.primary[100] : theme.colors.gray[100]};
  transition: background-color ${({ theme }) => theme.transitions.fast};

  svg {
    width: 24px;
    height: 24px;
    color: ${({ theme, $selected }) =>
      $selected ? theme.colors.primary[600] : theme.colors.gray[400]};
  }
`;

const RoleTextWrapper = styled.div``;

const RoleTitle = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const RoleDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 2px;
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

const VerifiedBadge = styled.span`
  margin-left: ${({ theme }) => theme.spacing.sm};
  color: #16a34a;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
  display: inline-flex;
  align-items: center;
  gap: 2px;

  svg {
    width: 14px;
    height: 14px;
  }
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

const Input = styled.input<{
  $hasLeftIcon?: boolean;
  $hasRightIcon?: boolean;
  $verified?: boolean;
}>`
  width: 100%;
  padding: 12px ${({ theme }) => theme.spacing.md};
  padding-left: ${({ $hasLeftIcon }) => ($hasLeftIcon ? '48px' : undefined)};
  padding-right: ${({ $hasRightIcon }) => ($hasRightIcon ? '48px' : undefined)};
  border: 1px solid
    ${({ theme, $verified }) => ($verified ? '#16a34a' : theme.colors.gray[300])};
  border-radius: ${({ theme }) => theme.radius.xl};
  outline: none;
  transition: all ${({ theme }) => theme.transitions.fast};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  background-color: ${({ $verified }) => ($verified ? '#f0fdf4' : 'white')};
  box-sizing: border-box;

  &:focus {
    border-color: ${({ theme, $verified }) =>
      $verified ? '#16a34a' : theme.colors.primary[500]};
    box-shadow: ${({ theme, $verified }) =>
      $verified
        ? '0 0 0 2px rgba(22, 163, 74, 0.2)'
        : `0 0 0 2px ${theme.colors.primary[200]}`};
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

// ============================================================
// 이메일 인증
// ============================================================

const EmailRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const SendCodeButton = styled.button<{ $verified?: boolean }>`
  flex-shrink: 0;
  min-width: 64px;
  height: 48px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.xl};
  border: 1px solid
    ${({ $verified }) => ($verified ? '#16a34a' : undefined)};
  border-color: ${({ theme, $verified }) =>
    $verified ? '#16a34a' : theme.colors.primary[500]};
  background: ${({ $verified }) => ($verified ? '#16a34a' : 'white')};
  color: ${({ theme, $verified }) =>
    $verified ? 'white' : theme.colors.primary[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: ${({ $verified }) => ($verified ? 'default' : 'pointer')};
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${({ theme }) => theme.transitions.fast};

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover:not(:disabled):not([data-verified='true']) {
    background-color: ${({ theme }) => theme.colors.primary[50]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HintText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const HintSuccess = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: #16a34a;
  margin-top: ${({ theme }) => theme.spacing.xs};
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
// 하단 공통
// ============================================================

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

const PrimaryButton = styled.button`
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

const SmallSpinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid currentColor;
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
// 컴포넌트
// ============================================================

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, sendCode, verifyCode, isAuthenticated, user } = useAuth();

  const [step, setStep] = useState<'role-select' | 'form'>('role-select');
  const [selectedRole, setSelectedRole] = useState<'TEACHER' | 'STUDENT' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 이메일 인증 상태
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeSentMessage, setCodeSentMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // 폼 데이터
  const [form, setForm] = useState({
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '' as 'M' | 'F' | '',
  });

  // 재발송 쿨다운 타이머
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // 회원가입 완료(자동 로그인) 후 역할 기반 리다이렉트
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.roleCode === 'STUDENT' ? '/student/exams' : '/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleEmailChange = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, email: value }));
    setIsEmailVerified(false);
    setVerificationCode('');
    setCodeSentMessage('');
    setResendCooldown(0);
  }, []);

  const updateField = (field: 'nickname' | 'password' | 'confirmPassword', value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ── 인증코드 발송 ──────────────────────────────────────────

  const handleSendCode = async () => {
    if (!form.email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setIsSendingCode(true);
    setError('');
    setCodeSentMessage('');

    try {
      await sendCode(form.email.trim());
      setCodeSentMessage('인증코드가 발송되었습니다. 이메일을 확인해주세요.');
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증코드 발송에 실패했습니다.');
    } finally {
      setIsSendingCode(false);
    }
  };

  // ── 인증코드 확인 ──────────────────────────────────────────

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('인증코드를 입력해주세요.');
      return;
    }

    setIsVerifyingCode(true);
    setError('');

    try {
      await verifyCode(form.email.trim(), verificationCode.trim());
      setIsEmailVerified(true);
      setCodeSentMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증코드가 올바르지 않습니다.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // ── 회원가입 제출 ─────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }
    if (!form.email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    if (!isEmailVerified) {
      setError('이메일 인증이 필요합니다.');
      return;
    }
    if (!form.gender) {
      setError('성별을 선택해주세요.');
      return;
    }
    if (!form.password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }
    if (form.password.length < 10 || form.password.length > 64) {
      setError('비밀번호는 10자 이상 64자 이하여야 합니다.');
      return;
    }
    const charTypes = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) =>
      r.test(form.password),
    ).length;
    if (charTypes < 2) {
      setError('영문 대/소문자, 숫자, 특수문자 중 2가지 이상을 조합해주세요.');
      return;
    }
    if (/(.)\1{3}/.test(form.password)) {
      setError('동일한 문자를 4회 이상 연속으로 사용할 수 없습니다.');
      return;
    }
    const emailId = form.email.split('@')[0].toLowerCase();
    if (emailId && form.password.toLowerCase().includes(emailId)) {
      setError('비밀번호에 이메일 주소를 포함할 수 없습니다.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      await signUp({
        name: form.nickname.trim(),
        email: form.email.trim(),
        password: form.password,
        gender: form.gender as 'M' | 'F',
        roleCode: selectedRole!,
      });
      // 자동 로그인 후 리다이렉트는 useEffect가 처리
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
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
            if (step === 'form') {
              setStep('role-select');
              setError('');
            } else {
              navigate('/login');
            }
          }}
        >
          <ArrowLeft />
        </BackButton>

        {/* ── 역할 선택 ── */}
        {step === 'role-select' && (
          <>
            <HeaderSection>
              <HeaderTitle>회원가입</HeaderTitle>
              <HeaderSubtitle>계정 유형을 선택해주세요</HeaderSubtitle>
            </HeaderSection>

            <RoleGroup>
              <RoleButton
                type='button'
                $selected={selectedRole === 'TEACHER'}
                onClick={() => {
                  setSelectedRole('TEACHER');
                  setStep('form');
                }}
              >
                <RoleIcon $selected={selectedRole === 'TEACHER'}>
                  <GraduationCap />
                </RoleIcon>
                <RoleTextWrapper>
                  <RoleTitle>교사</RoleTitle>
                  <RoleDescription>학생 관리 및 검사 진행</RoleDescription>
                </RoleTextWrapper>
              </RoleButton>

              <RoleButton
                type='button'
                $selected={selectedRole === 'STUDENT'}
                onClick={() => {
                  setSelectedRole('STUDENT');
                  setStep('form');
                }}
              >
                <RoleIcon $selected={selectedRole === 'STUDENT'}>
                  <BookOpen />
                </RoleIcon>
                <RoleTextWrapper>
                  <RoleTitle>학생</RoleTitle>
                  <RoleDescription>검사 참여 및 결과 확인</RoleDescription>
                </RoleTextWrapper>
              </RoleButton>
            </RoleGroup>

            <LoginLink style={{ paddingTop: '24px' }}>
              이미 계정이 있으신가요? <StyledLink to='/login'>로그인</StyledLink>
            </LoginLink>
          </>
        )}

        {/* ── 정보 입력 폼 ── */}
        {step === 'form' && selectedRole && (
          <>
            <HeaderSection>
              <HeaderTitle>회원가입</HeaderTitle>
              <HeaderSubtitle>
                {selectedRole === 'TEACHER' ? '교사' : '학생'} 계정 정보를 입력하세요
              </HeaderSubtitle>
            </HeaderSection>

            <Form onSubmit={handleSubmit}>
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
                    value={form.nickname}
                    onChange={(e) => updateField('nickname', e.target.value)}
                    placeholder='닉네임을 입력하세요'
                    disabled={isLoading}
                    autoComplete='nickname'
                    $hasLeftIcon
                  />
                </InputWrapper>
              </FormGroup>

              {/* 이메일 + 인라인 인증 */}
              <FormGroup>
                <Label htmlFor='email'>
                  이메일 <RequiredMark>*</RequiredMark>
                  {isEmailVerified && (
                    <VerifiedBadge>
                      <CheckCircle />
                      인증완료
                    </VerifiedBadge>
                  )}
                </Label>
                <EmailRow>
                  <InputWrapper style={{ flex: 1 }}>
                    <InputIcon>
                      <Mail />
                    </InputIcon>
                    <Input
                      id='email'
                      type='email'
                      value={form.email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder='example@email.com'
                      disabled={isLoading}
                      autoComplete='email'
                      $hasLeftIcon
                      $verified={isEmailVerified}
                    />
                  </InputWrapper>
                  <SendCodeButton
                    type='button'
                    onClick={isEmailVerified ? undefined : handleSendCode}
                    disabled={isLoading || isSendingCode || resendCooldown > 0}
                    $verified={isEmailVerified}
                  >
                    {isEmailVerified ? (
                      <CheckCircle />
                    ) : isSendingCode ? (
                      <SmallSpinner />
                    ) : resendCooldown > 0 ? (
                      `${resendCooldown}초`
                    ) : (
                      '인증'
                    )}
                  </SendCodeButton>
                </EmailRow>

                {codeSentMessage && !isEmailVerified && (
                  <HintSuccess>{codeSentMessage}</HintSuccess>
                )}

                {/* 인증코드 입력 */}
                {codeSentMessage && !isEmailVerified && (
                  <>
                    <EmailRow style={{ marginTop: '8px' }}>
                      <Input
                        type='text'
                        inputMode='numeric'
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) =>
                          setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        placeholder='6자리 인증코드 입력'
                        disabled={isVerifyingCode}
                        style={{ flex: 1, textAlign: 'center', letterSpacing: '0.2em' }}
                      />
                      <SendCodeButton
                        type='button'
                        onClick={handleVerifyCode}
                        disabled={verificationCode.length !== 6 || isVerifyingCode}
                      >
                        {isVerifyingCode ? <SmallSpinner /> : '확인'}
                      </SendCodeButton>
                    </EmailRow>
                    <HintText>인증코드는 5분간 유효합니다.</HintText>
                  </>
                )}
              </FormGroup>

              {/* 성별 */}
              <FormGroup>
                <Label>
                  성별 <RequiredMark>*</RequiredMark>
                </Label>
                <GenderGroup>
                  <GenderButton
                    type='button'
                    $selected={form.gender === 'M'}
                    onClick={() => setForm((prev) => ({ ...prev, gender: 'M' }))}
                    disabled={isLoading}
                  >
                    남성
                  </GenderButton>
                  <GenderButton
                    type='button'
                    $selected={form.gender === 'F'}
                    onClick={() => setForm((prev) => ({ ...prev, gender: 'F' }))}
                    disabled={isLoading}
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
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder='10자 이상, 영문/숫자/특수문자 중 2가지 이상'
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
                <HintText>10~64자, 영문 대/소문자·숫자·특수문자 중 2가지 이상</HintText>
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
                    <span>회원가입</span>
                  </>
                )}
              </PrimaryButton>

              <LoginLink>
                이미 계정이 있으신가요? <StyledLink to='/login'>로그인</StyledLink>
              </LoginLink>
            </Form>
          </>
        )}
      </StyledCard>
    </PageContainer>
  );
};
