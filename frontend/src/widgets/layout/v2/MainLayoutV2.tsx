import styled from '@emotion/styled';
import type React from 'react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Home, PanelLeft, PanelLeftClose } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { buildScopeQueryString } from '@shared/scope';
import { useStreamGuardStore } from '@shared/store/useStreamGuardStore';
import { StreamGuardDialog } from '@shared/ui/StreamGuardDialog';
import { FloatingAssistant } from '@widgets/floating-assistant';

import { GnbHeader, GNB_HEADER_HEIGHT } from './GnbHeader';
import { GNB_ITEMS, getActiveGnbId, getActiveSubTabId } from './gnbConfig';
import { LayoutProvider, useLayoutContext } from './LayoutContext';
import { ScopeTree } from './ScopeTree';

const SCOPE_TREE_WIDTH = 210;
const COLLAPSED_SCOPE_TREE_WIDTH = 64;

const LayoutRoot = styled.div<{ $lockViewport: boolean }>`
  min-height: 100vh;
  height: ${({ $lockViewport }) => ($lockViewport ? '100vh' : 'auto')};
  overflow: ${({ $lockViewport }) => ($lockViewport ? 'hidden' : 'visible')};
  background-color: #fbfbfc;
`;

const ScopeSidebar = styled.aside<{ $collapsed: boolean }>`
  position: fixed;
  top: ${GNB_HEADER_HEIGHT}px;
  left: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  width: ${({ $collapsed }) => ($collapsed ? COLLAPSED_SCOPE_TREE_WIDTH : SCOPE_TREE_WIDTH)}px;
  background-color: #fafafa;
  border-right: 1px solid ${({ theme }) => theme.colors.gray[200]};
  overflow: hidden;
  transition: width 200ms ease;
`;

const SidebarControls = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'space-between')};
  padding: ${({ theme }) => theme.spacing.md} 12px;
`;

const SidebarControlButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  padding: 0;
  color: ${({ theme }) => theme.colors.gray[500]};
  background-color: transparent;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  transition:
    color ${({ theme }) => theme.transitions.fast},
    background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[100]};
  }
`;

const ScopeTreeArea = styled.div`
  flex: 1;
  min-height: 0;
  padding: 0 12px ${({ theme }) => theme.spacing.md};
  overflow: hidden;
`;

const MainContent = styled.main<{ $sidebarCollapsed: boolean }>`
  min-width: 0;
  min-height: calc(100vh - ${GNB_HEADER_HEIGHT}px);
  margin-top: ${GNB_HEADER_HEIGHT}px;
  margin-left: ${({ $sidebarCollapsed }) =>
    $sidebarCollapsed ? COLLAPSED_SCOPE_TREE_WIDTH : SCOPE_TREE_WIDTH}px;
  padding: 0 40px 60px;
  transition: margin-left 200ms ease;
`;

const FullWidthContent = styled.main<{ $lockViewport: boolean }>`
  min-width: 0;
  min-height: calc(100vh - ${GNB_HEADER_HEIGHT}px);
  height: ${({ $lockViewport }) =>
    $lockViewport ? `calc(100vh - ${GNB_HEADER_HEIGHT}px)` : 'auto'};
  overflow: ${({ $lockViewport }) => ($lockViewport ? 'hidden' : 'visible')};
  margin-top: ${GNB_HEADER_HEIGHT}px;
  background-color: ${({ theme }) => theme.colors.background.paper};
`;

const SubTabNav = styled.nav`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: 30px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const SubTabButton = styled.button<{ $active: boolean }>`
  margin-bottom: -1px;
  padding: 15px ${({ theme }) => theme.spacing.md} 12px;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme, $active }) => ($active ? theme.colors.primary[600] : theme.colors.gray[500])};
  background: none;
  border: none;
  border-bottom: 2px solid
    ${({ theme, $active }) => ($active ? theme.colors.primary[600] : 'transparent')};
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.gray[700]};
  }
`;

interface MainLayoutV2Props {
  children: ReactNode;
}

const MainLayoutV2Content: React.FC<MainLayoutV2Props> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { scope, selectAll } = useLayoutContext();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const guardedNavigate = useStreamGuardStore((s) => s.guardedNavigate);

  const isFullWidth =
    location.pathname === '/home' || location.pathname.startsWith('/ai-assistant');
  const isAiAssistant = location.pathname.startsWith('/ai-assistant');
  const activeGnbId = getActiveGnbId(location.pathname);
  const activeGnb = GNB_ITEMS.find((item) => item.id === activeGnbId);
  const activeSubTabId = activeGnb ? getActiveSubTabId(activeGnb, location.pathname) : null;

  const handleSubTabClick = (path: string) => {
    guardedNavigate(() => navigate(`${path}${buildScopeQueryString(scope)}`));
  };

  const handleHomeClick = () => {
    guardedNavigate(() => {
      selectAll();
      navigate('/home');
    });
  };

  return (
    <LayoutRoot $lockViewport={isAiAssistant}>
      <GnbHeader />
      <StreamGuardDialog />
      {isFullWidth ? (
        <FullWidthContent $lockViewport={isAiAssistant}>{children}</FullWidthContent>
      ) : (
        <>
          <ScopeSidebar $collapsed={isSidebarCollapsed} aria-label='조회 범위 선택'>
            <SidebarControls $collapsed={isSidebarCollapsed}>
              {!isSidebarCollapsed && (
                <SidebarControlButton
                  type='button'
                  title='홈'
                  aria-label='홈'
                  onClick={handleHomeClick}
                >
                  <Home size={18} aria-hidden='true' />
                </SidebarControlButton>
              )}
              <SidebarControlButton
                type='button'
                title={isSidebarCollapsed ? '펼치기' : '접기'}
                aria-label={isSidebarCollapsed ? 'LNB 펼치기' : 'LNB 접기'}
                aria-expanded={!isSidebarCollapsed}
                onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
              >
                {isSidebarCollapsed ? (
                  <PanelLeft size={18} aria-hidden='true' />
                ) : (
                  <PanelLeftClose size={18} aria-hidden='true' />
                )}
              </SidebarControlButton>
            </SidebarControls>
            {!isSidebarCollapsed && (
              <ScopeTreeArea>
                <ScopeTree />
              </ScopeTreeArea>
            )}
          </ScopeSidebar>
          <MainContent $sidebarCollapsed={isSidebarCollapsed}>
            {activeGnb && activeGnb.subTabs.length > 0 && (
              <SubTabNav aria-label={`${activeGnb.label} 하위 메뉴`}>
                {activeGnb.subTabs.map((tab) => {
                  const isActive = activeSubTabId === tab.id;
                  return (
                    <SubTabButton
                      key={tab.id}
                      $active={isActive}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => handleSubTabClick(tab.path)}
                    >
                      {tab.label}
                    </SubTabButton>
                  );
                })}
              </SubTabNav>
            )}
            {children}
          </MainContent>
        </>
      )}
      {!location.pathname.startsWith('/ai-assistant') && <FloatingAssistant />}
    </LayoutRoot>
  );
};

export const MainLayoutV2: React.FC<MainLayoutV2Props> = ({ children }) => (
  <LayoutProvider>
    <MainLayoutV2Content>{children}</MainLayoutV2Content>
  </LayoutProvider>
);
