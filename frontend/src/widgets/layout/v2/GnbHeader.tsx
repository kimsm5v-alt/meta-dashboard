/**
 * v2 GNB 헤더 (P1-4)
 *
 * 좌: 로고(→ /home) · 중앙: GNB pill(검사·코칭·수업) · 우: 알림벨 + AI어시스턴트 + 유저메뉴.
 * 활성 GNB는 컨텍스트가 아니라 현재 경로(pathname)에서 파생하며,
 * 메뉴 이동 시 현재 스코프 쿼리(?class=&student=)를 유지한다.
 */

import styled from '@emotion/styled';
import type React from 'react';
import { ChevronRight, LogOut, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import aiOwlIcon from '@/assets/raon/ai-owl-icon.png';
import serviceLogo from '@/assets/allvia-sel-teal.svg';
import { useAuth } from '@features/auth';
import { BellWithPanel } from '@features/notifications';
import { ENV } from '@shared/config/env';
import { buildScopeQueryString } from '@shared/scope';
import { useStreamGuardStore } from '@shared/store/useStreamGuardStore';
import { IaV2Toggle } from '@shared/ui/IaV2Toggle';

import { useLayoutContext } from './LayoutContext';
import { GNB_ITEMS, getActiveGnbId, type GnbItem } from './gnbConfig';

export const GNB_HEADER_HEIGHT = 58;

// ============================================================================
// Styled Components
// ============================================================================

const HeaderWrapper = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: ${GNB_HEADER_HEIGHT}px;
  background-color: ${({ theme }) => theme.colors.background.paper};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  z-index: ${({ theme }) => theme.zIndex.sticky};
`;

const HeaderContent = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 ${({ theme }) => theme.spacing.lg};
`;

const LogoButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
`;

const LogoImage = styled.img`
  height: 22px;
  width: auto;
`;

// --- 중앙 GNB pill ---

const GnbNav = styled.nav`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.xs};
  background-color: ${({ theme }) => theme.colors.primary[50]};
  border-radius: ${({ theme }) => theme.radius.full};
`;

const GnbPillItem = styled.div`
  display: flex;
  align-items: center;
`;

const GnbButton = styled.button<{ $active: boolean }>`
  padding: 7px 20px;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border: none;
  border-radius: ${({ theme }) => theme.radius.full};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  background-color: ${({ theme, $active }) =>
    $active ? theme.colors.background.paper : 'transparent'};
  color: ${({ theme, $active }) => ($active ? theme.colors.primary[600] : theme.colors.gray[500])};
  box-shadow: ${({ theme, $active }) => ($active ? theme.shadows.sm : 'none')};

  &:hover {
    color: ${({ theme, $active }) =>
      $active ? theme.colors.primary[600] : theme.colors.gray[700]};
  }
`;

const ChevronSep = styled(ChevronRight)`
  width: 14px;
  height: 14px;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

// --- 우측 액션 ---

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-left: auto;
`;

const OwlButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  box-shadow: ${({ theme, $active }) =>
    $active ? `0 0 0 2px ${theme.colors.primary[300]}` : 'none'};
  transition: transform ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: scale(1.05);
  }
`;

const OwlIcon = styled.img`
  display: block;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.lg};
  object-fit: cover;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding-left: ${({ theme }) => theme.spacing.md};
  border-left: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const UserName = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin: 0;
`;

const UserAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radius.full};
  object-fit: cover;
`;

const UserAvatarPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: ${({ theme }) => theme.colors.primary[100]};
  border-radius: ${({ theme }) => theme.radius.full};

  svg {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.gray[400]};
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.error.main};
    background-color: ${({ theme }) => theme.colors.error.light};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

// ============================================================================
// Component
// ============================================================================

export const GnbHeader: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { scope } = useLayoutContext();
  const { user, logout } = useAuth();
  const guardedNavigate = useStreamGuardStore((s) => s.guardedNavigate);

  const activeGnbId = getActiveGnbId(pathname);
  const isAssistantActive = pathname === '/ai-assistant' || pathname.startsWith('/ai-assistant/');
  const scopeQuery = buildScopeQueryString(scope);

  const handleGnbClick = (item: GnbItem) => {
    const target = item.subTabs[0]?.path ?? item.path;
    guardedNavigate(() => navigate(`${target}${scopeQuery}`));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <HeaderWrapper>
      <HeaderContent>
        <LogoButton onClick={() => guardedNavigate(() => navigate('/home'))} aria-label='홈'>
          <LogoImage src={serviceLogo} alt='AllviA SEL' />
        </LogoButton>

        <GnbNav aria-label='주요 메뉴'>
          {GNB_ITEMS.map((item, index) => (
            <GnbPillItem key={item.id}>
              <GnbButton $active={activeGnbId === item.id} onClick={() => handleGnbClick(item)}>
                {item.label}
              </GnbButton>
              {index < GNB_ITEMS.length - 1 && <ChevronSep />}
            </GnbPillItem>
          ))}
        </GnbNav>

        <HeaderActions>
          {ENV.IS_DEV_MODE && <IaV2Toggle />}
          <BellWithPanel />
          <OwlButton
            $active={isAssistantActive}
            onClick={() => guardedNavigate(() => navigate(`/ai-assistant${scopeQuery}`))}
            title='AI 어시스턴트'
            aria-label='AI 어시스턴트'
          >
            <OwlIcon src={aiOwlIcon} alt='' />
          </OwlButton>
          <UserSection>
            <UserName>{user?.name || '사용자'}</UserName>
            {user?.profileImage ? (
              <UserAvatar src={user.profileImage} alt={user.name} />
            ) : (
              <UserAvatarPlaceholder>
                <User />
              </UserAvatarPlaceholder>
            )}
            <LogoutButton onClick={handleLogout} title='로그아웃' aria-label='로그아웃'>
              <LogOut />
            </LogoutButton>
          </UserSection>
        </HeaderActions>
      </HeaderContent>
    </HeaderWrapper>
  );
};
