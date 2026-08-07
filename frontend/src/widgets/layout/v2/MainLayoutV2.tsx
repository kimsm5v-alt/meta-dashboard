import styled from '@emotion/styled';
import type React from 'react';
import type { ReactNode } from 'react';
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

const LayoutRoot = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.gray[50]};
`;

const ScopeSidebar = styled.aside`
  position: fixed;
  top: ${GNB_HEADER_HEIGHT}px;
  left: 0;
  bottom: 0;
  width: ${SCOPE_TREE_WIDTH}px;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background.paper};
  border-right: 1px solid ${({ theme }) => theme.colors.gray[200]};
  overflow: hidden;
`;

const MainContent = styled.main`
  min-width: 0;
  min-height: calc(100vh - ${GNB_HEADER_HEIGHT}px);
  margin-top: ${GNB_HEADER_HEIGHT}px;
  margin-left: ${SCOPE_TREE_WIDTH}px;
  padding: 0 40px 60px;
`;

const FullWidthContent = styled.main`
  min-width: 0;
  min-height: calc(100vh - ${GNB_HEADER_HEIGHT}px);
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
  const { scope } = useLayoutContext();
  const guardedNavigate = useStreamGuardStore((s) => s.guardedNavigate);

  const isFullWidth =
    location.pathname === '/home' || location.pathname.startsWith('/ai-assistant');
  const activeGnbId = getActiveGnbId(location.pathname);
  const activeGnb = GNB_ITEMS.find((item) => item.id === activeGnbId);
  const activeSubTabId = activeGnb ? getActiveSubTabId(activeGnb, location.pathname) : null;

  const handleSubTabClick = (path: string) => {
    guardedNavigate(() => navigate(`${path}${buildScopeQueryString(scope)}`));
  };

  return (
    <LayoutRoot>
      <GnbHeader />
      <StreamGuardDialog />
      {isFullWidth ? (
        <FullWidthContent>{children}</FullWidthContent>
      ) : (
        <>
          <ScopeSidebar aria-label='조회 범위 선택'>
            <ScopeTree />
          </ScopeSidebar>
          <MainContent>
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
