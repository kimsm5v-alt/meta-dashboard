import styled from '@emotion/styled';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Search, Loader2, AlertCircle, Users, CheckCircle } from 'lucide-react';
import { Modal, Button } from '@shared/components';
import { groupService } from '../api/groupService';
import { useAuth } from '@features/auth/model/AuthContext';
import type { GroupInviteInfo } from '@shared/types';

interface JoinCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinSuccess?: (groupId: string) => void;
}

type Step = 'input' | 'preview' | 'joining' | 'success' | 'error';

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const InputRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const CodeInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 2px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-family: ${({ theme }) => theme.typography.fontFamily.mono};
  letter-spacing: 0.15em;
  text-align: center;
  text-transform: uppercase;
  outline: none;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[200]};
  }
`;

const ErrorText = styled.p`
  margin-top: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.error.main};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const GuideBox = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.md};
`;

const GuideContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const GuideIcon = styled(QrCode)`
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
`;

const FlexButton = styled(Button)`
  flex: 1;
`;

const GroupPreview = styled.div`
  background: linear-gradient(to bottom right, ${({ theme }) => theme.colors.primary[50]}, #eef2ff);
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  text-align: center;
  border: 1px solid ${({ theme }) => theme.colors.primary[100]};
`;

const IconWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: white;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const GroupTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const GroupMeta = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin-bottom: 12px;
`;


const InfoBox = styled.div<{ $variant: 'blue' | 'amber' }>`
  background: ${({ $variant }) => ($variant === 'blue' ? '#eff6ff' : '#fffbeb')};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ $variant }) => ($variant === 'blue' ? '#1d4ed8' : '#b45309')};
`;

const CenteredContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
`;

const SpinnerIcon = styled(Loader2)`
  color: ${({ theme }) => theme.colors.primary[500]};
  animation: spin 1s linear infinite;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const SuccessIconWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: #dcfce7;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SuccessTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const SuccessText = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const SuccessGroupName = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const ErrorIconWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: #fee2e2;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ErrorTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.gray[600]};
`;

export const JoinCodeModal: React.FC<JoinCodeModalProps> = ({ isOpen, onClose, onJoinSuccess }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [groupInfo, setGroupInfo] = useState<GroupInviteInfo | null>(null);
  const [error, setError] = useState('');

  const resetState = () => {
    setCode('');
    setStep('input');
    setGroupInfo(null);
    setError('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // 초대 코드 검색
  const handleSearch = async () => {
    if (code.trim().length < 4) {
      setError('초대 코드를 입력해주세요.');
      return;
    }

    setError('');
    setStep('joining');

    try {
      const info = await groupService.getGroupByInviteCode(code.trim(), user?.id);

      if (!info) {
        setError('유효하지 않은 초대 코드입니다.');
        setStep('error');
        return;
      }

      if (false) {
        // alreadyJoined 필드 제거됨 — 서버에서 이미 가입된 경우 에러 응답
        setError('이미 가입된 그룹입니다.');
        setStep('error');
        return;
      }

      setGroupInfo(info);
      setStep('preview');
    } catch {
      setError('그룹 정보를 불러오는데 실패했습니다.');
      setStep('error');
    }
  };

  // 그룹 가입
  const handleJoin = async () => {
    if (!groupInfo || !user) return;

    setStep('joining');

    try {
      await groupService.joinGroup(
        { inviteCode: groupInfo.inviteCode },
        user.id,
        user.name,
      );

      setStep('success');

      // 2초 후 자동으로 모달 닫기 및 이동
      setTimeout(() => {
        handleClose();
        if (onJoinSuccess) {
          onJoinSuccess(groupInfo.claId);
        }
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '가입에 실패했습니다.';

      if (errorMessage === 'ALREADY_JOINED') {
        setError('이미 가입된 그룹입니다.');
      } else if (errorMessage === 'GROUP_DELETED') {
        setError('존재하지 않는 그룹입니다.');
      } else {
        setError('그룹 가입에 실패했습니다. 다시 시도해주세요.');
      }
      setStep('error');
    }
  };

  // 비로그인 상태에서는 가입 페이지로 이동
  const handleGuestJoin = () => {
    handleClose();
    navigate(`/join/${code.trim()}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title='그룹 참가' size='md'>
      {/* Step 1: 코드 입력 */}
      {step === 'input' && (
        <ContentWrapper>
          <div>
            <Label>초대 코드</Label>
            <InputRow>
              <CodeInput
                type='text'
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder='예: ABC123'
                maxLength={6}
                autoFocus
              />
            </InputRow>
            {error && (
              <ErrorText>
                <AlertCircle size={16} />
                {error}
              </ErrorText>
            )}
          </div>

          <GuideBox>
            <GuideContent>
              <GuideIcon size={20} />
              <p>방장에게 받은 초대 코드 6자리를 입력하세요.</p>
            </GuideContent>
          </GuideBox>

          <ButtonRow>
            <FlexButton type='button' variant='secondary' onClick={handleClose}>
              취소
            </FlexButton>
            <FlexButton onClick={handleSearch} disabled={code.trim().length < 4}>
              <Search size={16} style={{ marginRight: 8 }} />
              그룹 찾기
            </FlexButton>
          </ButtonRow>
        </ContentWrapper>
      )}

      {/* Step 2: 그룹 미리보기 */}
      {step === 'preview' && groupInfo && (
        <ContentWrapper>
          {/* 그룹 정보 */}
          <GroupPreview>
            <IconWrapper>
              <Users size={32} color='#7c3aed' />
            </IconWrapper>
            <GroupTitle>{groupInfo.name}</GroupTitle>
            <GroupMeta>초대코드: {groupInfo.inviteCode}</GroupMeta>
          </GroupPreview>

          {/* 안내 문구 */}
          {user ? (
            <InfoBox $variant='blue'>
              <p>
                <span style={{ fontWeight: 500 }}>{user.name}</span>님으로 그룹에 가입합니다.
              </p>
            </InfoBox>
          ) : (
            <InfoBox $variant='amber'>
              <p>로그인하지 않은 상태입니다. 게스트로 참가하거나 로그인 후 가입하세요.</p>
            </InfoBox>
          )}

          <ButtonRow>
            <FlexButton
              type='button'
              variant='secondary'
              onClick={() => {
                setStep('input');
                setGroupInfo(null);
              }}
            >
              뒤로
            </FlexButton>
            {user ? (
              <FlexButton onClick={handleJoin}>가입하기</FlexButton>
            ) : (
              <FlexButton onClick={handleGuestJoin}>게스트로 참가</FlexButton>
            )}
          </ButtonRow>
        </ContentWrapper>
      )}

      {/* Step 3: 가입 중 */}
      {step === 'joining' && (
        <CenteredContent>
          <SpinnerIcon size={48} />
          <LoadingText style={{ marginTop: 16 }}>처리 중...</LoadingText>
        </CenteredContent>
      )}

      {/* Step 4: 가입 성공 */}
      {step === 'success' && groupInfo && (
        <CenteredContent style={{ textAlign: 'center' }}>
          <SuccessIconWrapper>
            <CheckCircle size={40} color='#16a34a' />
          </SuccessIconWrapper>
          <SuccessTitle>가입 완료!</SuccessTitle>
          <SuccessText>
            <SuccessGroupName>{groupInfo.name}</SuccessGroupName>에 성공적으로 가입되었습니다.
          </SuccessText>
        </CenteredContent>
      )}

      {/* Step 5: 에러 */}
      {step === 'error' && (
        <ContentWrapper>
          <CenteredContent style={{ padding: '32px 0', textAlign: 'center' }}>
            <ErrorIconWrapper>
              <AlertCircle size={32} color='#dc2626' />
            </ErrorIconWrapper>
            <ErrorTitle>오류 발생</ErrorTitle>
            <ErrorMessage>{error}</ErrorMessage>
          </CenteredContent>

          <ButtonRow>
            <FlexButton type='button' variant='secondary' onClick={handleClose}>
              닫기
            </FlexButton>
            <FlexButton
              onClick={() => {
                setError('');
                setStep('input');
              }}
            >
              다시 시도
            </FlexButton>
          </ButtonRow>
        </ContentWrapper>
      )}
    </Modal>
  );
};
