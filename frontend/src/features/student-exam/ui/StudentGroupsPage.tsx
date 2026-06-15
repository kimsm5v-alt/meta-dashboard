/**
 * 학생용 그룹 목록 페이지
 * 학생이 가입한 그룹 목록 조회 (참여/탈퇴는 mypage(SSO)로 이관 — group-from-idp)
 */

import { useState, useEffect, useCallback } from 'react';
import { Users, ExternalLink, RefreshCw } from 'lucide-react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { useAuth } from '@features/auth/model/AuthContext';
import { getMyGroups } from '@features/groups/api/groupService';
import { openMypageGroups } from '@shared/lib/mypage';
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

// 그룹 참여/탈퇴 모달·버튼 styled 제거 — mypage(SSO)로 이관 (group-from-idp)

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
  // 참여/탈퇴 모달 state 제거 — mypage(SSO)로 이관 (group-from-idp)

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

  // 참여/탈퇴 핸들러 제거 — mypage(SSO)로 이관 (group-from-idp)

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
          <PrimaryButton onClick={() => openMypageGroups()}>
            그룹 가입
            <ExternalLink />
          </PrimaryButton>
        </HeaderButtons>
      </PageHeader>

      {groups.length === 0 ? (
        <EmptyState>
          <EmptyIconCircle>
            <Users />
          </EmptyIconCircle>
          <EmptyTitle>가입한 그룹이 없습니다</EmptyTitle>
          <EmptyDesc>마이페이지에서 초대 코드를 입력하여 그룹에 참여하세요</EmptyDesc>
          <EmptyButton onClick={() => openMypageGroups()}>
            그룹 가입하기
            <ExternalLink />
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
                </GroupStats>
                {/* 탈퇴 버튼 제거 — 그룹 이탈은 교사 제거(mypage)만 (group-from-idp) */}
              </GroupCardFooter>
            </GroupCard>
          ))}
        </GroupGrid>
      )}

      {/* 그룹 참여 모달 제거 — mypage(SSO)로 이관 (group-from-idp) */}
    </PageRoot>
  );
};
