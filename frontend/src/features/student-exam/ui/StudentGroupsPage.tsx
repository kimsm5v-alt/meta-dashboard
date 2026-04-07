/**
 * 학생용 그룹 목록 페이지
 * 학생이 가입한 그룹 목록 조회 + 초대코드로 새 그룹 참여
 */

import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, RefreshCw, UserPlus, LogOut, AlertCircle } from 'lucide-react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useAuth } from '@features/auth/model/AuthContext';
import {
  getMyGroups,
  getGroupByInviteCode,
  joinGroup,
  leaveGroup,
} from '@features/groups/api/groupService';
import type { Group } from '@shared/types';

// ============================================================
// Styled Components
// ============================================================

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const PageRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const HeaderIconBox = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
    color: #2563eb;
  }
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const PageSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: 2px;
`;

const HeaderButtons = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const GhostButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const PrimaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: ${({ theme }) => theme.colors.primary[600]};
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  color: white;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary[700]};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const SkeletonCard = styled.div`
  height: 128px;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.xl};
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const EmptyState = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 48px ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

const EmptyIconCircle = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.gray[100]};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  svg {
    width: 32px;
    height: 32px;
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const EmptyTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const EmptyDesc = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const EmptyButton = styled(PrimaryButton)`
  margin: 0 auto;
`;

const GroupGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
`;

const GroupCard = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  transition: box-shadow ${({ theme }) => theme.transitions.fast};

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const GroupCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const GroupCardLeft = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const GroupIconBox = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 24px;
    height: 24px;
    color: #2563eb;
  }
`;

const GroupName = styled.h3`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const GroupMeta = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: 2px;
`;

const GroupDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const GroupCardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[100]};
`;

const GroupStats = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const LeaveButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm};
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.gray[400]};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #ef4444;
    background: #fef2f2;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

// Modal
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: ${({ theme }) => theme.spacing.md};
`;

const ModalCard = styled.div`
  background: ${({ theme }) => theme.colors.background.paper};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  width: 100%;
  max-width: 448px;
  box-shadow: ${({ theme }) => theme.shadows.xl};
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const ModalIconBox = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.xl};
  background: #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
    color: #2563eb;
  }
`;

const ModalTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ModalSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const FormLabel = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const CodeInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.xl};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  text-transform: uppercase;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;

const ErrorBox = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: #b91c1c;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

const HintBox = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: #1d4ed8;
`;

const ModalFooter = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.sm};
`;

const OutlineButton = styled.button`
  flex: 1;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radius.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[50]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const JoinButton = styled.button`
  flex: 1;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  background: #2563eb;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  color: white;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ModalFormStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

// ============================================================
// Helpers
// ============================================================

const getSchoolLevelLabel = (level: string | undefined): string => {
  switch (level?.toLowerCase()) {
    case 'elementary':
      return '초등학교';
    case 'middle':
      return '중학교';
    case 'high':
      return '고등학교';
    default:
      return level ?? '';
  }
};

// ============================================================
// Component
// ============================================================

export const StudentGroupsPage: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const loadGroups = useCallback(
    async (showRefreshIndicator = false) => {
      if (!user?.id) return;

      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const data = await getMyGroups(user.id);
        setGroups(data.filter((g) => g.myRole === 'member'));
      } catch {
        setGroups([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      setJoinError('초대 코드를 입력해주세요.');
      return;
    }
    if (!user?.id || !user?.name) {
      setJoinError('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    setIsJoining(true);
    setJoinError('');

    try {
      const groupInfo = await getGroupByInviteCode(inviteCode.trim().toUpperCase());

      if (!groupInfo) {
        setJoinError('유효하지 않은 초대 코드입니다.');
        return;
      }

      await joinGroup({ inviteCode }, user.id, user.name);
      setShowJoinModal(false);
      setInviteCode('');
      loadGroups(true);
    } catch {
      setJoinError('그룹 가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveGroup = async (group: Group) => {
    if (!user?.id) return;
    if (!window.confirm(`"${group.name}" 그룹을 탈퇴하시겠습니까?`)) return;

    try {
      await leaveGroup(group.id, user.id);
      loadGroups(true);
    } catch {
      alert('그룹 탈퇴에 실패했습니다.');
    }
  };

  const closeModal = () => {
    setShowJoinModal(false);
    setInviteCode('');
    setJoinError('');
  };

  if (isLoading) {
    return (
      <PageRoot>
        <PageHeader>
          <HeaderLeft>
            <div>
              <PageTitle>나의 그룹</PageTitle>
              <PageSubtitle>가입한 그룹을 확인하세요</PageSubtitle>
            </div>
          </HeaderLeft>
        </PageHeader>
        <SkeletonGrid>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </SkeletonGrid>
      </PageRoot>
    );
  }

  return (
    <PageRoot>
      <PageHeader>
        <HeaderLeft>
          <HeaderIconBox>
            <Users />
          </HeaderIconBox>
          <div>
            <PageTitle>나의 그룹</PageTitle>
            <PageSubtitle>가입한 그룹을 확인하세요</PageSubtitle>
          </div>
        </HeaderLeft>
        <HeaderButtons>
          <GhostButton onClick={() => loadGroups(true)} disabled={isRefreshing}>
            <RefreshCw
              style={isRefreshing ? { animation: 'spin 1s linear infinite' } : undefined}
            />
            새로고침
          </GhostButton>
          <PrimaryButton onClick={() => setShowJoinModal(true)}>
            <Plus />
            그룹 가입
          </PrimaryButton>
        </HeaderButtons>
      </PageHeader>

      {groups.length === 0 ? (
        <EmptyState>
          <EmptyIconCircle>
            <Users />
          </EmptyIconCircle>
          <EmptyTitle>가입한 그룹이 없습니다</EmptyTitle>
          <EmptyDesc>초대 코드를 입력하여 그룹에 참여하세요</EmptyDesc>
          <EmptyButton onClick={() => setShowJoinModal(true)}>
            <UserPlus />
            그룹 가입하기
          </EmptyButton>
        </EmptyState>
      ) : (
        <GroupGrid>
          {groups.map((group) => (
            <GroupCard key={group.id}>
              <GroupCardHeader>
                <GroupCardLeft>
                  <GroupIconBox>
                    <Users />
                  </GroupIconBox>
                  <div>
                    <GroupName>{group.name}</GroupName>
                    <GroupMeta>
                      {group.schoolName && `${group.schoolName} • `}
                      {getSchoolLevelLabel(group.schoolLevel)} {group.grade}학년 {group.classNumber}
                      반
                    </GroupMeta>
                  </div>
                </GroupCardLeft>
              </GroupCardHeader>

              {group.description && <GroupDescription>{group.description}</GroupDescription>}

              <GroupCardFooter>
                <GroupStats>
                  <span>멤버 {group.memberCount}명</span>
                  <span>초대코드: {group.inviteCode}</span>
                </GroupStats>
                <LeaveButton onClick={() => handleLeaveGroup(group)} title='그룹 탈퇴'>
                  <LogOut />
                </LeaveButton>
              </GroupCardFooter>
            </GroupCard>
          ))}
        </GroupGrid>
      )}

      {showJoinModal && (
        <Overlay>
          <ModalCard>
            <ModalHeader>
              <ModalIconBox>
                <UserPlus />
              </ModalIconBox>
              <div>
                <ModalTitle>그룹 가입</ModalTitle>
                <ModalSubtitle>초대 코드를 입력하세요</ModalSubtitle>
              </div>
            </ModalHeader>

            <ModalFormStack>
              <div>
                <FormLabel>초대 코드</FormLabel>
                <CodeInput
                  type='text'
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value.toUpperCase());
                    setJoinError('');
                  }}
                  placeholder='예: ABC123'
                  maxLength={10}
                  autoFocus
                />
              </div>

              {joinError && (
                <ErrorBox>
                  <AlertCircle />
                  {joinError}
                </ErrorBox>
              )}

              <HintBox>선생님이 공유한 초대 코드를 입력하면 그룹에 참여할 수 있습니다.</HintBox>

              <ModalFooter>
                <OutlineButton onClick={closeModal} disabled={isJoining}>
                  취소
                </OutlineButton>
                <JoinButton onClick={handleJoinGroup} disabled={isJoining || !inviteCode.trim()}>
                  {isJoining ? '가입 중...' : '가입하기'}
                </JoinButton>
              </ModalFooter>
            </ModalFormStack>
          </ModalCard>
        </Overlay>
      )}
    </PageRoot>
  );
};
