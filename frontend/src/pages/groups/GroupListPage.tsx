import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Search, QrCode, Crown, User } from 'lucide-react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { Card, Button } from '@shared/components';
import { CreateGroupModal, GroupInviteModal, JoinCodeModal } from '@features/groups/ui';
import { groupService } from '@features/groups/api/groupService';
import { useAuth } from '@features/auth/model/AuthContext';
import type { Group, GroupRole, SchoolLevelCode } from '@shared/types';
import type { GroupFormData } from '@features/groups/ui/CreateGroupModal';

/** 학교급 라벨 */
const SCHOOL_LEVEL_LABELS: Record<SchoolLevelCode, string> = {
  elementary: '초등',
  middle: '중등',
  high: '고등',
};

// Animations
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// Layout Components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderContent = styled.div``;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const PageSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.25rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// Search Components
const SearchWrapper = styled.div`
  position: relative;
  max-width: 28rem;
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary[500]};
    border-color: transparent;
  }
`;

// Grid Components
const GroupGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

// Role Badge Components
const RoleBadgeStyled = styled.span<{ $variant: 'owner' | 'member' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};

  ${({ $variant }) => {
    if ($variant === 'owner') {
      return `
        background: #fef3c7;
        color: #b45309;
      `;
    }
    return `
      background: #dbeafe;
      color: #1d4ed8;
    `;
  }}
`;

const BadgeIcon = styled.span`
  width: 0.75rem;
  height: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/** 역할 배지 컴포넌트 */
const RoleBadge: React.FC<{ role: GroupRole }> = ({ role }) => {
  if (role === 'owner') {
    return (
      <RoleBadgeStyled $variant='owner'>
        <BadgeIcon>
          <Crown size={12} />
        </BadgeIcon>
        방장
      </RoleBadgeStyled>
    );
  }
  return (
    <RoleBadgeStyled $variant='member'>
      <BadgeIcon>
        <User size={12} />
      </BadgeIcon>
      참가자
    </RoleBadgeStyled>
  );
};

// Onboarding Components
const OnboardingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 0 1rem;
`;

const OnboardingHeader = styled.div`
  text-align: center;
  margin-bottom: 2.5rem;
`;

const OnboardingIconCircle = styled.div<{ $variant: 'primary' | 'amber' | 'blue' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  margin-bottom: 1.5rem;

  ${({ $variant }) => {
    switch ($variant) {
      case 'primary':
        return `
          width: 5rem;
          height: 5rem;
          background: #ede9fe;
        `;
      case 'amber':
        return `
          width: 4rem;
          height: 4rem;
          background: #fef3c7;
        `;
      case 'blue':
        return `
          width: 4rem;
          height: 4rem;
          background: #dbeafe;
        `;
    }
  }}
`;

const OnboardingTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const OnboardingSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const OnboardingGrid = styled.div`
  display: flex;
`;

const OnboardingCardContent = styled.div`
  text-align: center;
  padding: 1rem 0;
`;

const OnboardingCardTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const OnboardingCardDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 1rem;
`;

const FullWidthButton = styled(Button)`
  width: 100%;
  justify-content: center;
`;

// Skeleton Components
const SkeletonContainer = styled.div`
  animation: ${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

const SkeletonCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const SkeletonRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SkeletonAvatar = styled.div`
  width: 3rem;
  height: 3rem;
  background: ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.75rem;
`;

const SkeletonText = styled.div<{ $width: string; $height?: string }>`
  width: ${({ $width }) => $width};
  height: ${({ $height }) => $height || '1rem'};
  background: ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.25rem;
`;

const SkeletonBadge = styled.div`
  width: 3.5rem;
  height: 1.5rem;
  background: ${({ theme }) => theme.colors.gray[200]};
  border-radius: 9999px;
`;

/** 그룹 카드 스켈레톤 */
const GroupCardSkeleton: React.FC = () => (
  <Card>
    <SkeletonContainer>
      <SkeletonCardHeader>
        <SkeletonRow>
          <SkeletonAvatar />
          <div>
            <SkeletonText $width='6rem' $height='1.25rem' style={{ marginBottom: '0.5rem' }} />
            <SkeletonText $width='4rem' />
          </div>
        </SkeletonRow>
        <SkeletonBadge />
      </SkeletonCardHeader>
      <SkeletonText $width='8rem' />
    </SkeletonContainer>
  </Card>
);

// Group Card Components
const GroupCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const GroupCardInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const GroupIconCircle = styled.div`
  width: 3rem;
  height: 3rem;
  background: ${({ theme }) => theme.colors.primary[100]};
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GroupName = styled.h3`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const GroupLevel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const GroupCardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const GroupStats = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const MemberCount = styled.span`
  color: ${({ theme }) => theme.colors.gray[600]};
`;

const MemberNumber = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const InviteCode = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-family: monospace;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const GroupCardActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InviteButton = styled.button`
  padding: 0.375rem;
  color: ${({ theme }) => theme.colors.gray[400]};
  border-radius: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.primary[600]};
    background: ${({ theme }) => theme.colors.primary[50]};
  }
`;

const DetailLink = styled.span`
  color: ${({ theme }) => theme.colors.primary[600]};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};

  &:hover {
    color: ${({ theme }) => theme.colors.primary[700]};
  }
`;

const OwnerInfo = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
  margin-top: 0.5rem;
`;

// No Results Components
const NoResultsContainer = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  text-align: center;
`;

const NoResultsIcon = styled(Search)`
  width: 3rem;
  height: 3rem;
  color: ${({ theme }) => theme.colors.gray[300]};
  margin-bottom: 1rem;
`;

const NoResultsText = styled.p`
  color: ${({ theme }) => theme.colors.gray[500]};
`;

/** 온보딩 화면 (그룹 없는 사용자) */
const OnboardingView: React.FC<{
  onCreateClick: () => void;
  onJoinClick: () => void;
}> = ({ onCreateClick, onJoinClick: _onJoinClick }) => {
  return (
    <OnboardingContainer>
      <OnboardingHeader>
        <OnboardingIconCircle $variant='primary'>
          <Users size={40} color='#7c3aed' />
        </OnboardingIconCircle>
        <OnboardingTitle>학습심리정서검사 시작하기</OnboardingTitle>
        <OnboardingSubtitle>그룹을 만들거나 참가하여 검사를 시작하세요</OnboardingSubtitle>
      </OnboardingHeader>

      <OnboardingGrid>
        {/* 그룹 만들기 */}
        <Card hoverable onClick={onCreateClick} style={{ cursor: 'pointer' }}>
          <OnboardingCardContent>
            <OnboardingIconCircle $variant='amber'>
              <Crown size={32} color='#d97706' />
            </OnboardingIconCircle>
            <OnboardingCardTitle>그룹 만들기</OnboardingCardTitle>
            <OnboardingCardDescription>
              학급을 만들고 학생들을 초대하세요.
              <br />
              검사를 생성하고 결과를 확인할 수 있습니다.
            </OnboardingCardDescription>
            <FullWidthButton>
              <Plus size={16} style={{ marginRight: '0.5rem' }} />
              시작하기
            </FullWidthButton>
          </OnboardingCardContent>
        </Card>

        {/* 그룹 참가 */}
        {/* <Card hoverable onClick={onJoinClick} style={{ cursor: 'pointer' }}>
          <OnboardingCardContent>
            <OnboardingIconCircle $variant='blue'>
              <LogIn size={32} color='#2563eb' />
            </OnboardingIconCircle>
            <OnboardingCardTitle>그룹 참가</OnboardingCardTitle>
            <OnboardingCardDescription>
              초대 코드로 그룹에 가입하세요.
              <br />
              선생님이 시작한 검사에 참여할 수 있습니다.
            </OnboardingCardDescription>
            <FullWidthButton variant='secondary'>
              <QrCode size={16} style={{ marginRight: '0.5rem' }} />
              참가하기
            </FullWidthButton>
          </OnboardingCardContent>
        </Card> */}
      </OnboardingGrid>
    </OnboardingContainer>
  );
};

export const GroupListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 모달 상태
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // 그룹 목록 로드
  useEffect(() => {
    const loadGroups = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const data = await groupService.getMyGroups(user.id);
        setGroups(data);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load groups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGroups();
  }, [user]);

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCreateGroup = async (data: GroupFormData) => {
    if (!user) return;

    try {
      const newGroup = await groupService.createGroup(
        {
          name: data.name,
          schoolLevel: data.schoolLevel,
          grade: data.grade,
          classNumber: data.classNumber,
          description: data.description,
          schoolName: data.schoolName,
        },
        user.id,
        user.name,
      );

      // 생성 후 그룹 상세 화면으로 이동
      navigate(`/groups/${newGroup.id}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create group:', error);
    }
  };

  const handleOpenInviteModal = (group: Group, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedGroup(group);
    setIsInviteModalOpen(true);
  };

  const handleJoinSuccess = (groupId: string) => {
    // 가입 성공 시 그룹 목록 새로고침
    if (user) {
      groupService.getMyGroups(user.id).then(setGroups);
    }
    navigate(`/groups/${groupId}`);
  };

  // 로딩 중
  if (isLoading) {
    return (
      <PageContainer>
        <HeaderRow>
          <HeaderContent>
            <PageTitle>그룹 관리</PageTitle>
            <PageSubtitle>학급(그룹)을 생성하고 학생을 초대하세요</PageSubtitle>
          </HeaderContent>
        </HeaderRow>
        <GroupGrid>
          {[1, 2, 3].map((i) => (
            <GroupCardSkeleton key={i} />
          ))}
        </GroupGrid>
      </PageContainer>
    );
  }

  // 그룹이 없으면 온보딩 화면
  if (groups.length === 0) {
    return (
      <>
        <OnboardingView
          onCreateClick={() => setIsCreateModalOpen(true)}
          onJoinClick={() => setIsJoinCodeModalOpen(true)}
        />

        <CreateGroupModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateGroup}
        />

        <JoinCodeModal
          isOpen={isJoinCodeModalOpen}
          onClose={() => setIsJoinCodeModalOpen(false)}
          onJoinSuccess={handleJoinSuccess}
        />
      </>
    );
  }

  return (
    <PageContainer>
      {/* 헤더 */}
      <HeaderRow>
        <HeaderContent>
          <PageTitle>그룹 관리</PageTitle>
          <PageSubtitle>학급(그룹)을 생성하고 학생을 초대하세요</PageSubtitle>
        </HeaderContent>
        <ButtonGroup>
          {/* <Button variant="secondary" onClick={() => setIsJoinCodeModalOpen(true)}>
            <LogIn size={16} style={{ marginRight: '0.5rem' }} />
            그룹 참가
          </Button> */}
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} style={{ marginRight: '0.5rem' }} />
            그룹 생성
          </Button>
        </ButtonGroup>
      </HeaderRow>

      {/* 검색 */}
      <SearchWrapper>
        <SearchIcon />
        <SearchInput
          type='text'
          placeholder='그룹 검색...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchWrapper>

      {/* 그룹 카드 그리드 */}
      <GroupGrid>
        {filteredGroups.map((group) => (
          <Card key={group.id} hoverable onClick={() => navigate(`/groups/${group.id}`)}>
            <GroupCardHeader>
              <GroupCardInfo>
                <GroupIconCircle>
                  <Users size={24} color='#7c3aed' />
                </GroupIconCircle>
                <div>
                  <GroupName>{group.name}</GroupName>
                  <GroupLevel>
                    {SCHOOL_LEVEL_LABELS[group.schoolLevel]} {group.grade}학년
                  </GroupLevel>
                </div>
              </GroupCardInfo>
              <RoleBadge role={group.myRole} />
            </GroupCardHeader>

            <GroupCardFooter>
              <GroupStats>
                <MemberCount>
                  멤버 <MemberNumber>{group.memberCount}명</MemberNumber>
                </MemberCount>
                {group.myRole === 'owner' && <InviteCode>{group.inviteCode}</InviteCode>}
              </GroupStats>
              <GroupCardActions>
                {group.myRole === 'owner' && (
                  <InviteButton onClick={(e) => handleOpenInviteModal(group, e)} title='초대 코드'>
                    <QrCode size={16} />
                  </InviteButton>
                )}
                <DetailLink>상세보기</DetailLink>
              </GroupCardActions>
            </GroupCardFooter>

            {/* 멤버가 아닌 경우 방장 이름 표시 */}
            {group.myRole === 'member' && group.ownerName && (
              <OwnerInfo>방장: {group.ownerName}</OwnerInfo>
            )}
          </Card>
        ))}

        {/* 검색 결과 없음 */}
        {filteredGroups.length === 0 && searchTerm && (
          <NoResultsContainer>
            <NoResultsIcon />
            <NoResultsText>"{searchTerm}"에 대한 검색 결과가 없습니다</NoResultsText>
          </NoResultsContainer>
        )}
      </GroupGrid>

      {/* 모달 */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateGroup}
      />

      {selectedGroup && (
        <GroupInviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          group={{
            id: selectedGroup.id,
            name: selectedGroup.name,
            grade: selectedGroup.grade,
            classNumber: selectedGroup.classNumber,
            inviteCode: selectedGroup.inviteCode,
            studentCount: selectedGroup.memberCount,
          }}
        />
      )}

      <JoinCodeModal
        isOpen={isJoinCodeModalOpen}
        onClose={() => setIsJoinCodeModalOpen(false)}
        onJoinSuccess={handleJoinSuccess}
      />
    </PageContainer>
  );
};
