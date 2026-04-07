import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import {
  Users,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Mail,
  User,
} from 'lucide-react';
import { Button } from '@shared/components';
import { LoginForm } from '@features/auth/ui/LoginForm';
import { groupService } from '@features/groups/api/groupService';
import { useAuth } from '@features/auth/model/AuthContext';
import type { GroupInviteInfo } from '@shared/types';

type PageStep =
  | 'email-input' // 이메일 입력 단계 (비로그인 사용자)
  | 'email-verification' // 이메일 인증 단계 (신규 게스트)
  | 'loading'
  | 'info'
  | 'guest-form'
  | 'joining'
  | 'success'
  | 'error';

// ============================================================
// Animations
// ============================================================

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// ============================================================
// Styled Components
// ============================================================

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
  padding: 1rem;
`;

const CenterContent = styled.div`
  text-align: center;
`;

const SpinnerIcon = styled(Loader2)`
  width: 3rem;
  height: 3rem;
  color: ${({ theme }) => theme.colors.primary[500]};
  animation: ${spin} 1s linear infinite;
  margin: 0 auto 1rem;
`;

const LoadingText = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 28rem;
  text-align: center;
`;

const IconCircle = styled.div<{ $variant: 'error' | 'success' | 'primary' | 'gray' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  border-radius: 9999px;
  margin-bottom: 1.5rem;

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'error':
        return `background: #fee2e2;`;
      case 'success':
        return `background: #dcfce7;`;
      case 'primary':
        return `background: ${theme.colors.primary[100]};`;
      case 'gray':
        return `background: ${theme.colors.gray[100]};`;
    }
  }}
`;

const SmallIconCircle = styled.div<{ $variant: 'primary' | 'gray' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 9999px;
  margin-bottom: 0.75rem;

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'primary':
        return `background: ${theme.colors.primary[100]};`;
      case 'gray':
        return `background: ${theme.colors.gray[100]};`;
    }
  }}
`;

const ErrorIcon = styled(AlertCircle)`
  width: 2.5rem;
  height: 2.5rem;
  color: #dc2626;
`;

const SuccessIcon = styled(CheckCircle)`
  width: 2.5rem;
  height: 2.5rem;
  color: #16a34a;
`;

const UsersIcon = styled(Users)`
  width: 2rem;
  height: 2rem;
  color: ${({ theme }) => theme.colors.primary[600]};
`;

const UserPlusIcon = styled(UserPlus)`
  width: 2rem;
  height: 2rem;
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: 1.5rem;
`;

const GroupNameText = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const InfoBox = styled.div<{ $variant: 'blue' | 'amber' }>`
  border-radius: 0.75rem;
  padding: 1rem;
  ${({ $variant }) => {
    switch ($variant) {
      case 'blue':
        return 'background: #eff6ff;';
      case 'amber':
        return 'background: #fffbeb;';
    }
  }}
`;

const InfoText = styled.p<{ $variant: 'blue' | 'amber' }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  ${({ $variant }) => {
    switch ($variant) {
      case 'blue':
        return 'color: #1d4ed8;';
      case 'amber':
        return 'color: #b45309;';
    }
  }}
`;

const InfoEmail = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const HeaderSection = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const SmallTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.25rem;
`;

const GroupInfoText = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const PrimaryName = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary[600]};
`;

const FormCard = styled.form`
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
`;

const FormFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div``;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.25rem;
`;

const Required = styled.span`
  color: #ef4444;
`;

const InputWrapper = styled.div`
  position: relative;
`;

const InputIcon = styled.div`
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
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500]}33;
  }
`;

const HelpText = styled.p`
  margin-top: 0.25rem;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ErrorText = styled.p`
  margin-bottom: 1rem;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: #dc2626;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ErrorSmallIcon = styled(AlertCircle)`
  width: 1rem;
  height: 1rem;
`;

const SubmitButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: ${({ theme }) => theme.colors.primary[600]};
  color: white;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border-radius: 0.75rem;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[700]};
  }
`;

const BackButton = styled.button`
  width: 100%;
  padding: 0.75rem 1.5rem;
  color: ${({ theme }) => theme.colors.gray[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.gray[900]};
  }
`;

const FormButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const MainCard = styled.div`
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 1rem;
`;

const GroupSummary = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const SummaryText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 0.25rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const AuthSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const UserInfoBox = styled.div`
  background: #eff6ff;
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
`;

const UserInfoText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: #1d4ed8;
`;

const UserName = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const LoginPrompt = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: 1rem;
`;

const InviteCodeText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const InviteCode = styled.span`
  font-family: monospace;
`;

const ArrowIcon = styled(ArrowRight)`
  width: 1.25rem;
  height: 1.25rem;
`;

const SmallArrowIcon = styled(ArrowRight)`
  width: 1rem;
  height: 1rem;
  margin-left: 0.5rem;
`;

const GenderButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const GenderButton = styled.button<{ $isSelected: boolean }>`
  flex: 1;
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 2px solid
    ${({ $isSelected, theme }) =>
      $isSelected ? theme.colors.primary[500] : theme.colors.gray[300]};
  background: ${({ $isSelected, theme }) =>
    $isSelected ? theme.colors.primary[50] : 'white'};
  color: ${({ $isSelected, theme }) =>
    $isSelected ? theme.colors.primary[600] : theme.colors.gray[700]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ $isSelected, theme }) =>
      $isSelected ? theme.colors.primary[500] : theme.colors.gray[400]};
  }
`;

// ============================================================
// Component
// ============================================================

export const JoinGroupPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, loginWithEmail, loginAsGuest } = useAuth();

  const [step, setStep] = useState<PageStep>(isAuthenticated ? 'loading' : 'info');
  const [groupInfo, setGroupInfo] = useState<GroupInviteInfo | null>(null);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // 게스트 가입 폼
  const [guestNickname, setGuestNickname] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestGender, setGuestGender] = useState<'M' | 'F' | ''>('');

  // 이메일 인증 관련 상태
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeSentMessage, setCodeSentMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // 재발송 쿨다운 타이머
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // 그룹 정보 로드 (인증된 사용자만)
  useEffect(() => {
    const loadGroupInfo = async () => {
      if (!code || authLoading) return;

      // 로그인된 사용자만 그룹 정보 로드
      if (isAuthenticated && user) {
        setStep('loading');
        try {
          const info = await groupService.getGroupByInviteCode(code, user.id);

          if (!info) {
            setError('유효하지 않은 초대 코드입니다. 코드를 확인해주세요.');
            setStep('error');
            return;
          }

          setGroupInfo(info);
          setStep('info');
        } catch {
          setError('그룹 정보를 불러오는데 실패했습니다.');
          setStep('error');
        }
      }
    };

    loadGroupInfo();
  }, [code, user?.id, authLoading, isAuthenticated]);

  // 이메일 제출 처리 (비로그인 사용자)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !guestEmail.trim()) return;

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    setStep('loading');
    setError('');

    try {
      const info = await groupService.getGuestGroupInfo(code, guestEmail.trim());

      if (!info) {
        setError('유효하지 않은 초대 코드입니다. 코드를 확인해주세요.');
        setStep('error');
        return;
      }

      setGroupInfo({
        groupId: '',
        claId: info.claId,
        name: info.groupNm,
        inviteCode: code,
      });

      setAlreadyJoined(info.exists);

      // 신규/기존 상관없이 이메일 인증 필요
      setStep('email-verification');
    } catch {
      setError('그룹 정보를 불러오는데 실패했습니다.');
      setStep('error');
    }
  };

  // 인증코드 발송
  const handleSendCode = async () => {
    if (!guestEmail.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setIsSendingCode(true);
    setError('');
    setCodeSentMessage('');

    try {
      await groupService.apiClient.post('/member/send-code', { email: guestEmail.trim() });
      setCodeSentMessage('인증코드가 발송되었습니다. 이메일을 확인해주세요.');
      setResendCooldown(60); // 1분 재발송 제한
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증코드 발송에 실패했습니다.');
    } finally {
      setIsSendingCode(false);
    }
  };

  // 인증코드 확인
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('인증코드를 입력해주세요.');
      return;
    }

    setIsVerifyingCode(true);
    setError('');

    try {
      await groupService.apiClient.post('/member/verify-code', {
        email: guestEmail.trim(),
        code: verificationCode.trim(),
      });
      setIsEmailVerified(true);
      setCodeSentMessage('');

      // 신규 게스트는 닉네임/성별 입력, 기존 게스트는 바로 가입
      if (alreadyJoined) {
        // 기존 게스트 - 재인증 후 바로 가입
        handleExistingGuestJoin();
      } else {
        // 신규 게스트 - 닉네임/성별 입력 폼으로
        setStep('guest-form');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증코드 확인에 실패했습니다.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // 로그인 처리 (로그인 성공 후 자동 가입)
  const handleLogin = async (email: string, password: string) => {
    setLoginLoading(true);
    try {
      await loginWithEmail(email, password);
      // 로그인 성공 → useEffect에서 isAuthenticated 변경 감지 → 자동 가입 처리
    } finally {
      setLoginLoading(false);
    }
  };

  // 로그인 후 자동 가입
  useEffect(() => {
    if (isAuthenticated && user && groupInfo && step === 'info') {
      handleMemberJoin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, groupInfo]);

  // 회원 가입 처리
  const handleMemberJoin = async () => {
    if (!groupInfo || !user) return;

    setStep('joining');
    try {
      await groupService.joinGroup({ inviteCode: groupInfo.inviteCode }, user.id, user.name);
      setStep('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage === 'ALREADY_JOINED') {
        setError('이미 가입된 그룹입니다.');
      } else {
        setError('그룹 가입에 실패했습니다. 다시 시도해주세요.');
      }
      setStep('error');
    }
  };

  // 기존 게스트 재인증 후 가입
  const handleExistingGuestJoin = async () => {
    if (!groupInfo || !code) return;

    setStep('joining');
    try {
      const result = await groupService.apiClient.post<{
        claId: string;
        stdtId: string;
        groupNm: string;
        email: string;
        accessToken: string;
        refreshToken: string;
      }>('/guest/auth', {
        inviteCode: code,
        email: guestEmail.trim(),
      });

      if (!result.resultData) {
        throw new Error('재인증 실패');
      }

      // AuthContext에 게스트 로그인 상태 반영
      loginAsGuest({
        stdtId: result.resultData.stdtId,
        claId: result.resultData.claId,
        groupNm: result.resultData.groupNm || groupInfo.name,
        email: result.resultData.email,
        accessToken: result.resultData.accessToken,
        refreshToken: result.resultData.refreshToken,
      });

      // 게스트 검사 목록으로 이동
      navigate('/guest/exams');
    } catch {
      setError('그룹 가입에 실패했습니다. 다시 시도해주세요.');
      setStep('error');
    }
  };

  // 게스트 가입 처리 (닉네임 + 이메일 + 성별)
  const handleGuestJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupInfo || !code) return;

    if (!guestNickname.trim() || guestNickname.trim().length < 2) {
      setError('닉네임을 2자 이상 입력해주세요.');
      return;
    }
    if (!guestEmail.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }
    if (!guestGender) {
      setError('성별을 선택해주세요.');
      return;
    }

    setError('');
    setStep('joining');

    try {
      const result = await groupService.joinGroupAsGuest({
        inviteCode: groupInfo.inviteCode,
        nickname: guestNickname.trim(),
        email: guestEmail.trim(),
        gender: guestGender,
      });

      // AuthContext에 게스트 로그인 상태 반영
      loginAsGuest({
        stdtId: result.stdtId,
        claId: result.groupId,
        groupNm: groupInfo.name,
        email: guestEmail.trim(),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      // 게스트 검사 목록으로 이동
      navigate('/guest/exams');
    } catch {
      setError('그룹 가입에 실패했습니다. 다시 시도해주세요.');
      setStep('error');
    }
  };

  // ── 이메일 입력 (비로그인 사용자) ──
  if (step === 'email-input' && !isAuthenticated) {
    return (
      <PageContainer>
        <ContentWrapper>
          <FormCard as='form' onSubmit={handleEmailSubmit}>
            <HeaderSection>
              <SmallIconCircle $variant='gray'>
                <UserPlusIcon />
              </SmallIconCircle>
              <SmallTitle>그룹 초대</SmallTitle>
              <Subtitle>이메일을 입력하여 그룹 정보를 확인하세요</Subtitle>
            </HeaderSection>

            <FormFields>
              <FormGroup>
                <Label>
                  이메일 <Required>*</Required>
                </Label>
                <InputWrapper>
                  <InputIcon>
                    <Mail size={20} />
                  </InputIcon>
                  <Input
                    type='email'
                    value={guestEmail}
                    onChange={(e) => {
                      setGuestEmail(e.target.value);
                      setError('');
                    }}
                    placeholder='example@email.com'
                    required
                    autoFocus
                  />
                </InputWrapper>
                <HelpText>그룹 참가 확인을 위해 이메일이 필요합니다.</HelpText>
              </FormGroup>
            </FormFields>

            {error && (
              <ErrorText>
                <ErrorSmallIcon />
                {error}
              </ErrorText>
            )}

            <ButtonGroup>
              <Button type='submit' className='justify-center w-full'>
                다음
                <SmallArrowIcon />
              </Button>
            </ButtonGroup>
          </FormCard>
        </ContentWrapper>
      </PageContainer>
    );
  }

  // ── 이메일 인증 (신규 게스트) ──
  if (step === 'email-verification' && !isAuthenticated) {
    return (
      <PageContainer>
        <ContentWrapper>
          <FormCard as='form' onSubmit={(e) => e.preventDefault()}>
            <HeaderSection>
              <SmallIconCircle $variant='gray'>
                <Mail size={32} />
              </SmallIconCircle>
              <SmallTitle>이메일 인증</SmallTitle>
              <Subtitle>
                {groupInfo?.name}에 참가하려면
                <br />
                이메일 인증이 필요합니다
              </Subtitle>
            </HeaderSection>

            <FormFields>
              {/* 이메일 (읽기 전용) */}
              <FormGroup>
                <Label>
                  이메일 <Required>*</Required>
                  {isEmailVerified && (
                    <span
                      style={{
                        marginLeft: '0.5rem',
                        color: '#16a34a',
                        fontSize: '0.75rem',
                        fontWeight: 'normal',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <CheckCircle size={14} />
                      인증완료
                    </span>
                  )}
                </Label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <InputWrapper style={{ flex: 1 }}>
                    <InputIcon>
                      <Mail size={20} />
                    </InputIcon>
                    <Input
                      type='email'
                      value={guestEmail}
                      disabled
                      style={{
                        backgroundColor: isEmailVerified ? '#dcfce7' : '#f3f4f6',
                        borderColor: isEmailVerified ? '#16a34a' : '#d1d5db',
                        cursor: 'not-allowed',
                      }}
                    />
                  </InputWrapper>
                  <Button
                    type='button'
                    onClick={handleSendCode}
                    disabled={isSendingCode || resendCooldown > 0 || isEmailVerified}
                    style={{
                      minWidth: '5rem',
                      backgroundColor: isEmailVerified
                        ? '#16a34a'
                        : isSendingCode || resendCooldown > 0
                        ? '#f3f4f6'
                        : undefined,
                      color: isEmailVerified
                        ? 'white'
                        : isSendingCode || resendCooldown > 0
                        ? '#9ca3af'
                        : undefined,
                      cursor:
                        isSendingCode || resendCooldown > 0 || isEmailVerified
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    {isEmailVerified ? (
                      <CheckCircle size={20} />
                    ) : isSendingCode ? (
                      <Loader2
                        size={20}
                        style={{ animation: 'spin 1s linear infinite' }}
                      />
                    ) : resendCooldown > 0 ? (
                      `${resendCooldown}초`
                    ) : (
                      '인증'
                    )}
                  </Button>
                </div>

                {/* 인증코드 발송 성공 메시지 */}
                {codeSentMessage && !isEmailVerified && (
                  <HelpText style={{ color: '#16a34a', marginTop: '0.5rem' }}>
                    {codeSentMessage}
                  </HelpText>
                )}

                {/* 인증코드 입력 필드 */}
                {codeSentMessage && !isEmailVerified && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <Input
                      type='text'
                      value={verificationCode}
                      onChange={(e) =>
                        setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))
                      }
                      placeholder='6자리 인증코드 입력'
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        letterSpacing: '0.1em',
                        fontFamily: 'monospace',
                      }}
                      maxLength={6}
                      disabled={isVerifyingCode}
                      autoFocus
                    />
                    <Button
                      type='button'
                      onClick={handleVerifyCode}
                      disabled={verificationCode.length !== 6 || isVerifyingCode}
                      style={{
                        minWidth: '4rem',
                        backgroundColor:
                          verificationCode.length !== 6 || isVerifyingCode ? '#f3f4f6' : undefined,
                        color:
                          verificationCode.length !== 6 || isVerifyingCode ? '#9ca3af' : undefined,
                        cursor:
                          verificationCode.length !== 6 || isVerifyingCode
                            ? 'not-allowed'
                            : 'pointer',
                      }}
                    >
                      {isVerifyingCode ? (
                        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        '확인'
                      )}
                    </Button>
                  </div>
                )}

                {/* 인증코드 안내 */}
                {codeSentMessage && !isEmailVerified && (
                  <HelpText style={{ marginTop: '0.5rem' }}>
                    인증코드는 5분간 유효합니다.
                  </HelpText>
                )}
              </FormGroup>
            </FormFields>

            {error && (
              <ErrorText>
                <ErrorSmallIcon />
                {error}
              </ErrorText>
            )}

            <ButtonGroup>
              <Button
                type='button'
                variant='secondary'
                onClick={() => {
                  setStep('email-input');
                  setError('');
                  setVerificationCode('');
                  setCodeSentMessage('');
                  setResendCooldown(0);
                }}
                className='justify-center w-full'
              >
                뒤로
              </Button>
            </ButtonGroup>
          </FormCard>
        </ContentWrapper>
      </PageContainer>
    );
  }

  // ── 로딩 ──
  if (step === 'loading') {
    return (
      <PageContainer>
        <CenterContent>
          <SpinnerIcon />
          <LoadingText>그룹 정보를 불러오는 중...</LoadingText>
        </CenterContent>
      </PageContainer>
    );
  }

  // ── 에러 ──
  if (step === 'error') {
    return (
      <PageContainer>
        <ContentWrapper>
          <IconCircle $variant='error'>
            <ErrorIcon />
          </IconCircle>
          <Title>오류 발생</Title>
          <Subtitle>{error}</Subtitle>
          <ButtonGroup>
            <Button onClick={() => navigate('/groups')} className='justify-center w-full'>
              그룹 목록으로
            </Button>
            <Button
              variant='secondary'
              onClick={() => {
                setError('');
                setStep('loading');
                window.location.reload();
              }}
              className='justify-center w-full'
            >
              다시 시도
            </Button>
          </ButtonGroup>
        </ContentWrapper>
      </PageContainer>
    );
  }

  // ── 가입 성공 ──
  if (step === 'success') {
    return (
      <PageContainer>
        <ContentWrapper>
          <IconCircle $variant='success'>
            <SuccessIcon />
          </IconCircle>
          <Title>가입 완료!</Title>
          <Subtitle>
            <GroupNameText>{groupInfo?.name}</GroupNameText>에 성공적으로 가입되었습니다.
          </Subtitle>
          {isAuthenticated ? (
            <Button
              onClick={() => navigate(`/groups/${groupInfo?.claId}`)}
              className='justify-center w-full'
            >
              그룹 보기
              <SmallArrowIcon />
            </Button>
          ) : (
            <ButtonGroup>
              <InfoBox $variant='blue'>
                <InfoText $variant='blue'>
                  선생님이 검사를 시작하면 <InfoEmail>{guestEmail}</InfoEmail>으로 검사 응시 안내
                  메일이 발송됩니다.
                </InfoText>
              </InfoBox>
              <Button
                variant='secondary'
                onClick={() => navigate('/login')}
                className='justify-center w-full'
              >
                로그인하고 결과 확인하기
              </Button>
            </ButtonGroup>
          )}
        </ContentWrapper>
      </PageContainer>
    );
  }

  // ── 가입 중 ──
  if (step === 'joining') {
    return (
      <PageContainer>
        <CenterContent>
          <SpinnerIcon />
          <LoadingText>가입 처리 중...</LoadingText>
        </CenterContent>
      </PageContainer>
    );
  }

  // ── 게스트 폼 (닉네임 + 이메일) ──
  if (step === 'guest-form' && groupInfo) {
    return (
      <PageContainer>
        <ContentWrapper>
          {/* 그룹 정보 헤더 */}
          <HeaderSection>
            <SmallIconCircle $variant='gray'>
              <UserPlusIcon />
            </SmallIconCircle>
            <SmallTitle>게스트 로그인</SmallTitle>
            <GroupInfoText>
              <PrimaryName>{groupInfo.name}</PrimaryName>
            </GroupInfoText>
          </HeaderSection>

          {/* 폼 */}
          <FormCard onSubmit={handleGuestJoin}>
            <FormFields>
              {/* 닉네임 */}
              <FormGroup>
                <Label>
                  닉네임 <Required>*</Required>
                </Label>
                <InputWrapper>
                  <InputIcon>
                    <User size={20} />
                  </InputIcon>
                  <Input
                    type='text'
                    value={guestNickname}
                    onChange={(e) => {
                      setGuestNickname(e.target.value);
                      setError('');
                    }}
                    placeholder='닉네임을 입력하세요'
                    required
                    minLength={2}
                    autoFocus
                  />
                </InputWrapper>
              </FormGroup>

              {/* 이메일 */}
              <FormGroup>
                <Label>
                  이메일 <Required>*</Required>
                </Label>
                <InputWrapper>
                  <InputIcon>
                    <Mail size={20} />
                  </InputIcon>
                  <Input
                    type='email'
                    value={guestEmail}
                    disabled
                    style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                  />
                </InputWrapper>
                <HelpText>검사 응시 안내 메일이 이 주소로 발송됩니다.</HelpText>
              </FormGroup>

              {/* 성별 */}
              <FormGroup>
                <Label>
                  성별 <Required>*</Required>
                </Label>
                <GenderButtonGroup>
                  <GenderButton
                    type='button'
                    $isSelected={guestGender === 'M'}
                    onClick={() => {
                      setGuestGender('M');
                      setError('');
                    }}
                  >
                    남성
                  </GenderButton>
                  <GenderButton
                    type='button'
                    $isSelected={guestGender === 'F'}
                    onClick={() => {
                      setGuestGender('F');
                      setError('');
                    }}
                  >
                    여성
                  </GenderButton>
                </GenderButtonGroup>
              </FormGroup>
            </FormFields>

            {error && (
              <ErrorText>
                <ErrorSmallIcon />
                {error}
              </ErrorText>
            )}

            {/* 안내 */}
            <InfoBox $variant='amber' style={{ marginBottom: '1.5rem' }}>
              <InfoText $variant='amber'>
                게스트로 참가하면 이 기기에서만 검사 결과를 확인할 수 있습니다. 회원가입하면 모든
                기기에서 결과를 확인할 수 있습니다.
              </InfoText>
            </InfoBox>

            <FormButtonGroup>
              <SubmitButton type='submit'>
                게스트로 참가하기
                <ArrowIcon />
              </SubmitButton>

              <BackButton
                type='button'
                onClick={() => {
                  setStep('email-input');
                  setError('');
                  setGuestNickname('');
                  setGuestGender('');
                }}
              >
                뒤로
              </BackButton>
            </FormButtonGroup>
          </FormCard>
        </ContentWrapper>
      </PageContainer>
    );
  }

  // ── 메인: 그룹 정보 + 로그인 폼 (비로그인) / 가입 버튼 (로그인) ──
  return (
    <PageContainer>
      <ContentWrapper>
        {/* 그룹 정보 헤더 */}
        <HeaderSection>
          <SmallIconCircle $variant='primary'>
            <UsersIcon />
          </SmallIconCircle>
          <SmallTitle>그룹 가입</SmallTitle>
          {groupInfo && (
            <GroupInfoText>
              <PrimaryName>{groupInfo.name}</PrimaryName>
            </GroupInfoText>
          )}
        </HeaderSection>

        <MainCard>
          {/* 그룹 정보 요약 (로그인 사용자만) */}
          {groupInfo && (
            <GroupSummary>
              <SummaryText>초대코드: {groupInfo.inviteCode}</SummaryText>
            </GroupSummary>
          )}

          {/* 이미 참가한 경우 경고 */}
          {alreadyJoined && (
            <InfoBox $variant='amber' style={{ marginBottom: '1.5rem' }}>
              <InfoText $variant='amber'>
                이 이메일로 이미 그룹에 참가하셨습니다. 다시 가입하면 기존 데이터가 초기화될 수
                있습니다.
              </InfoText>
            </InfoBox>
          )}

          {isAuthenticated && user ? (
            // ── 로그인 상태: 바로 가입 ──
            <AuthSection>
              <UserInfoBox>
                <UserInfoText>
                  <UserName>{user.name}</UserName>님으로 가입합니다.
                </UserInfoText>
              </UserInfoBox>

              <SubmitButton onClick={handleMemberJoin} type='button'>
                그룹 가입하기
                <ArrowIcon />
              </SubmitButton>
            </AuthSection>
          ) : (
            // ── 비로그인 상태: 로그인 폼 바로 표시 ──
            <div>
              <LoginPrompt>그룹에 가입하려면 로그인해주세요</LoginPrompt>
              <LoginForm
                onLogin={handleLogin}
                isLoading={loginLoading}
                onGuestLogin={() => setStep('email-input')}
                redirectPath={`/join/${code}`}
              />
            </div>
          )}
        </MainCard>

        {/* 초대 코드 표시 */}
        <CenterContent>
          <InviteCodeText>
            초대 코드: <InviteCode>{code}</InviteCode>
          </InviteCodeText>
        </CenterContent>
      </ContentWrapper>
    </PageContainer>
  );
};
