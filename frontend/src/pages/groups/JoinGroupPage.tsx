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
import type { GroupInviteInfo, SchoolLevelCode } from '@shared/types';

type PageStep = 'loading' | 'info' | 'guest-form' | 'joining' | 'success' | 'error';

/** 학교급 라벨 */
const SCHOOL_LEVEL_LABELS: Record<SchoolLevelCode, string> = {
  elementary: '초등',
  middle: '중등',
  high: '고등',
};

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
    ${({ theme }) => theme.colors.indigo?.[50] || '#eef2ff'}
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
        return `background: ${theme.colors.red?.[100] || '#fee2e2'};`;
      case 'success':
        return `background: ${theme.colors.green?.[100] || '#dcfce7'};`;
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
  color: ${({ theme }) => theme.colors.red?.[600] || '#dc2626'};
`;

const SuccessIcon = styled(CheckCircle)`
  width: 2.5rem;
  height: 2.5rem;
  color: ${({ theme }) => theme.colors.green?.[600] || '#16a34a'};
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
  color: ${({ theme }) => theme.colors.red?.[500] || '#ef4444'};
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
  color: ${({ theme }) => theme.colors.red?.[600] || '#dc2626'};
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

// ============================================================
// Component
// ============================================================

export const JoinGroupPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, loginWithEmail } = useAuth();

  const [step, setStep] = useState<PageStep>('loading');
  const [groupInfo, setGroupInfo] = useState<GroupInviteInfo | null>(null);
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // 게스트 가입 폼
  const [guestNickname, setGuestNickname] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // 그룹 정보 로드
  useEffect(() => {
    const loadGroupInfo = async () => {
      if (!code || authLoading) return;

      setStep('loading');
      try {
        const info = await groupService.getGroupByInviteCode(code, user?.id);

        if (!info) {
          setError('유효하지 않은 초대 코드입니다. 코드를 확인해주세요.');
          setStep('error');
          return;
        }

        if (info.alreadyJoined) {
          setError('이미 가입된 그룹입니다.');
          setStep('error');
          return;
        }

        setGroupInfo(info);
        setStep('info');
      } catch {
        setError('그룹 정보를 불러오는데 실패했습니다.');
        setStep('error');
      }
    };

    loadGroupInfo();
  }, [code, user?.id, authLoading]);

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
      await groupService.joinGroup(groupInfo.id, {}, user.id, user.name);
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

  // 게스트 가입 처리 (닉네임 + 이메일)
  const handleGuestJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupInfo) return;

    if (!guestNickname.trim() || guestNickname.trim().length < 2) {
      setError('닉네임을 2자 이상 입력해주세요.');
      return;
    }
    if (!guestEmail.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setError('');
    setStep('joining');

    try {
      await groupService.joinGroupAsGuest(groupInfo.id, {
        email: guestEmail.trim(),
        name: guestNickname.trim(),
      });
      setStep('success');
    } catch {
      setError('그룹 가입에 실패했습니다. 다시 시도해주세요.');
      setStep('error');
    }
  };

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
          <IconCircle $variant="error">
            <ErrorIcon />
          </IconCircle>
          <Title>오류 발생</Title>
          <Subtitle>{error}</Subtitle>
          <ButtonGroup>
            <Button onClick={() => navigate('/groups')} className="w-full justify-center">
              그룹 목록으로
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setError('');
                setStep('loading');
                window.location.reload();
              }}
              className="w-full justify-center"
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
          <IconCircle $variant="success">
            <SuccessIcon />
          </IconCircle>
          <Title>가입 완료!</Title>
          <Subtitle>
            <GroupNameText>{groupInfo?.name}</GroupNameText>에 성공적으로 가입되었습니다.
          </Subtitle>
          {isAuthenticated ? (
            <Button
              onClick={() => navigate(`/groups/${groupInfo?.id}`)}
              className="w-full justify-center"
            >
              그룹 보기
              <SmallArrowIcon />
            </Button>
          ) : (
            <ButtonGroup>
              <InfoBox $variant="blue">
                <InfoText $variant="blue">
                  선생님이 검사를 시작하면 <InfoEmail>{guestEmail}</InfoEmail>으로 검사 응시 안내
                  메일이 발송됩니다.
                </InfoText>
              </InfoBox>
              <Button
                variant="secondary"
                onClick={() => navigate('/login')}
                className="w-full justify-center"
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
            <SmallIconCircle $variant="gray">
              <UserPlusIcon />
            </SmallIconCircle>
            <SmallTitle>게스트 로그인</SmallTitle>
            <GroupInfoText>
              <PrimaryName>{groupInfo.name}</PrimaryName> ({groupInfo.ownerName})
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
                    type="text"
                    value={guestNickname}
                    onChange={(e) => {
                      setGuestNickname(e.target.value);
                      setError('');
                    }}
                    placeholder="닉네임을 입력하세요"
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
                    type="email"
                    value={guestEmail}
                    onChange={(e) => {
                      setGuestEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="example@email.com"
                    required
                  />
                </InputWrapper>
                <HelpText>검사 응시 안내 메일이 이 주소로 발송됩니다.</HelpText>
              </FormGroup>
            </FormFields>

            {error && (
              <ErrorText>
                <ErrorSmallIcon />
                {error}
              </ErrorText>
            )}

            {/* 안내 */}
            <InfoBox $variant="amber" style={{ marginBottom: '1.5rem' }}>
              <InfoText $variant="amber">
                게스트로 참가하면 이 기기에서만 검사 결과를 확인할 수 있습니다. 회원가입하면 모든
                기기에서 결과를 확인할 수 있습니다.
              </InfoText>
            </InfoBox>

            <FormButtonGroup>
              <SubmitButton type="submit">
                게스트로 참가하기
                <ArrowIcon />
              </SubmitButton>

              <BackButton
                type="button"
                onClick={() => {
                  setStep('info');
                  setError('');
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
          <SmallIconCircle $variant="primary">
            <UsersIcon />
          </SmallIconCircle>
          <SmallTitle>그룹 가입</SmallTitle>
          {groupInfo && (
            <GroupInfoText>
              <PrimaryName>{groupInfo.name}</PrimaryName> ({groupInfo.ownerName})
            </GroupInfoText>
          )}
        </HeaderSection>

        {groupInfo && (
          <MainCard>
            {/* 그룹 정보 요약 */}
            <GroupSummary>
              <SummaryText>
                {SCHOOL_LEVEL_LABELS[groupInfo.schoolLevel]} {groupInfo.grade}학년{' '}
                {groupInfo.classNumber}반
              </SummaryText>
              <SummaryText>현재 멤버 {groupInfo.memberCount}명</SummaryText>
            </GroupSummary>

            {isAuthenticated && user ? (
              // ── 로그인 상태: 바로 가입 ──
              <AuthSection>
                <UserInfoBox>
                  <UserInfoText>
                    <UserName>{user.name}</UserName>님으로 가입합니다.
                  </UserInfoText>
                </UserInfoBox>

                <SubmitButton onClick={handleMemberJoin} type="button">
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
                  onGuestLogin={() => setStep('guest-form')}
                  redirectPath={`/join/${code}`}
                />
              </div>
            )}
          </MainCard>
        )}

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
