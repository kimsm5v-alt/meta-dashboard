import type { ReactNode } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  User,
  UserCog,
  ChevronRight,
  ChevronDown,
  LogOut,
  ClipboardList,
  Calendar,
  PanelLeftClose,
  PanelLeft,
  Loader2,
  BarChart3,
  BookOpen,
  Bot,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@features/auth';
import { useTeacherClasses } from '@features/api';
import { BellWithPanel } from '@features/notifications';
import { ApiTooltip } from '@shared/components/api-tooltip';
import { API_TEACHER_ME } from '@shared/data/apiDefinitions';
import { FEATURES, type FeatureKey } from '@shared/config/features';
import { ENV } from '@shared/config/env';
import serviceLogo from '@/assets/logo_2.png';

// ============================================================================
// Types
// ============================================================================

interface LayoutProps {
  children: ReactNode;
}

interface NavSubItem {
  label: string;
  path: string;
}

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  feature?: FeatureKey;
  subItems?: NavSubItem[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

// ============================================================================
// Constants
// ============================================================================

const DASHBOARD_SUB_ITEMS: NavSubItem[] = [
  { label: '학습종합검사', path: '/dashboard/comprehensive' },
  { label: '자기조절학습검사', path: '/dashboard/selfreg' },
];

const navGroups: NavGroup[] = [
  {
    title: '검사',
    items: [
      { icon: ClipboardList, label: '검사하기', path: '/assessment', feature: 'ASSESSMENT' },
      {
        icon: LayoutDashboard,
        label: '결과보기',
        path: '/dashboard',
        feature: 'DASHBOARD',
        subItems: DASHBOARD_SUB_ITEMS,
      },
    ],
  },
  {
    title: '상담',
    items: [
      { icon: Calendar, label: '상담일정', path: '/schedule', feature: 'SCHEDULE' },
      {
        icon: BarChart3,
        label: '상담 대시보드',
        path: '/counseling-dashboard',
        feature: 'COUNSELING_DASHBOARD',
      },
    ],
  },
  {
    title: '콘텐츠',
    items: [
      { icon: BookOpen, label: '교육 자료실', path: '/resources', feature: 'RESOURCES' },
      { icon: MessageSquare, label: '교사 커뮤니티', path: '/community', feature: 'COMMUNITY' },
    ],
  },
  {
    title: 'AI',
    items: [{ icon: Bot, label: 'AI 어시스턴트', path: '/ai-room', feature: 'AI_ROOM' }],
  },
];

// ============================================================================
// Styled Components - Header
// ============================================================================

const HeaderWrapper = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background-color: ${({ theme }) => theme.colors.background.paper};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  z-index: ${({ theme }) => theme.zIndex.sticky};
`;

const HeaderContent = styled.div`
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
  height: 20px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const IconButton = styled.button`
  position: relative;
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.gray[500]};
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.gray[700]};
    background-color: ${({ theme }) => theme.colors.gray[100]};
  }

  svg {
    width: 20px;
    height: 20px;
  }
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
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.full};
  object-fit: cover;
`;

const UserAvatarPlaceholder = styled.div`
  width: 36px;
  height: 36px;
  background-color: ${({ theme }) => theme.colors.primary[100]};
  border-radius: ${({ theme }) => theme.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const LogoutButton = styled.button`
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
    width: 20px;
    height: 20px;
  }
`;

// ============================================================================
// Styled Components - Sidebar
// ============================================================================

const SidebarWrapper = styled.aside<{ $isCollapsed: boolean }>`
  position: fixed;
  left: 0;
  top: 64px;
  bottom: 0;
  width: ${({ $isCollapsed }) => ($isCollapsed ? '64px' : '256px')};
  background-color: ${({ theme }) => theme.colors.background.paper};
  border-right: 1px solid ${({ theme }) => theme.colors.gray[200]};
  display: flex;
  flex-direction: column;
  transition: width ${({ theme }) => theme.transitions.normal};
`;

const SidebarNav = styled.nav<{ $isCollapsed: boolean }>`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme, $isCollapsed }) =>
    $isCollapsed ? `${theme.spacing.md} ${theme.spacing.sm}` : theme.spacing.md};
`;

const NavGroupContainer = styled.div<{ $hasMargin: boolean }>`
  margin-top: ${({ $hasMargin, theme }) => ($hasMargin ? theme.spacing.md : '0')};
`;

const NavGroupDivider = styled.div<{ $isCollapsed: boolean }>`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  margin: 0 ${({ $isCollapsed, theme }) => ($isCollapsed ? theme.spacing.xs : theme.spacing.sm)};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const NavGroupTitle = styled.h3`
  padding: 0 ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[400]};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const NavItemButton = styled.button<{ $isActive: boolean; $isCollapsed: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme, $isCollapsed }) => ($isCollapsed ? `10px 0` : `10px ${theme.spacing.md}`)};
  justify-content: ${({ $isCollapsed }) => ($isCollapsed ? 'center' : 'flex-start')};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background-color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary[50] : 'transparent'};
  color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary[600] : theme.colors.gray[600]};
  border: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ $isActive, theme }) =>
      $isActive ? theme.colors.primary[50] : theme.colors.gray[50]};
  }

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
`;

const NavItemLabel = styled.span`
  flex: 1;
  text-align: left;
`;

const NavItemChevron = styled(ChevronRight)`
  width: 16px;
  height: 16px;
`;

const NavChevronDown = styled(ChevronDown, {
  shouldForwardProp: (prop) => prop !== '$open',
})<{ $open: boolean }>`
  width: 16px !important;
  height: 16px !important;
  transition: transform 0.2s;
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
`;

const SubNavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 2px 0 0 32px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SubNavButton = styled.button<{ $isActive: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  padding: 8px ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: none;
  background: ${({ $isActive, theme }) => ($isActive ? theme.colors.primary[50] : 'transparent')};
  color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.primary[600] : theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ $isActive, theme }) =>
    $isActive ? theme.typography.fontWeight.medium : theme.typography.fontWeight.normal};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  text-align: left;

  &:hover {
    background: ${({ $isActive, theme }) =>
      $isActive ? theme.colors.primary[50] : theme.colors.gray[50]};
  }
`;

// ============================================================================
// Styled Components - Class List Section
// ============================================================================

const ClassSectionContainer = styled.div<{ $isCollapsed: boolean }>`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const ClassSectionCollapsed = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const ClassSectionTitle = styled.h3`
  padding: 0 ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[400]};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md} 0;
`;

const SpinnerIcon = styled(Loader2)`
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.colors.gray[400]};
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.span`
  margin-left: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const EmptyMessage = styled.p`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.gray[400]};
  margin: 0;
`;

const ClassList = styled.ul<{ $isCollapsed: boolean }>`
  list-style: none;
  margin: ${({ $isCollapsed }) => ($isCollapsed ? '0' : '8px 0 0 0')};
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ClassItemButton = styled.button<{ $isCollapsed: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme, $isCollapsed }) =>
    $isCollapsed ? `${theme.spacing.sm} 0` : `${theme.spacing.sm} ${theme.spacing.md}`};
  justify-content: ${({ $isCollapsed }) => ($isCollapsed ? 'center' : 'flex-start')};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  background: none;
  border: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[50]};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ClassBadge = styled.span`
  width: 24px;
  height: 24px;
  background-color: ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

// ============================================================================
// Styled Components - Toggle Button
// ============================================================================

const ToggleSection = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding: ${({ theme }) => theme.spacing.sm};
`;

const ToggleButton = styled.button<{ $isCollapsed: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => `10px ${theme.spacing.md}`};
  justify-content: ${({ $isCollapsed }) => ($isCollapsed ? 'center' : 'flex-start')};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.gray[500]};
  background: none;
  border: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[100]};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

// ============================================================================
// Styled Components - Main Layout
// ============================================================================

const LayoutContainer = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.gray[50]};
`;

const FlexContainer = styled.div`
  display: flex;
`;

const MainContent = styled.main<{ $isCollapsed: boolean }>`
  flex: 1;
  /* flex 자식이 콘텐츠(차트 SVG) min-content 폭으로 팽창하지 않도록 */
  min-width: 0;
  margin-top: 64px;
  margin-left: ${({ $isCollapsed }) => ($isCollapsed ? '64px' : '256px')};
  padding: ${({ theme }) => theme.spacing.lg};
  transition: margin-left ${({ theme }) => theme.transitions.normal};
`;

// ============================================================================
// Header Component
// ============================================================================

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // SP 마이페이지로 이동 — 같은 탭, client_id + return_to(현재 URL) query
  // 참조: superplatform-mypage/docs/mypage-integration-guide.html
  const openMypage = () => {
    const params = new URLSearchParams({
      client_id: ENV.SP_CLIENT_ID,
      return_to: window.location.href,
    });
    window.location.href = `${ENV.SP_MYPAGE_URL}/?${params}`;
  };

  return (
    <HeaderWrapper>
      <HeaderContent>
        <LogoButton onClick={() => navigate('/')}>
          <LogoImage src={serviceLogo} alt='학습심리정서검사' />
        </LogoButton>
        <HeaderActions>
          <BellWithPanel />
          <IconButton onClick={openMypage} title='내 정보 설정' aria-label='내 정보 설정'>
            <UserCog />
          </IconButton>
          <UserSection>
            <ApiTooltip {...API_TEACHER_ME} position='bottom-right'>
              <UserName>{user?.name || '사용자'}</UserName>
            </ApiTooltip>
            {user?.profileImage ? (
              <UserAvatar src={user.profileImage} alt={user.name} />
            ) : (
              <UserAvatarPlaceholder>
                <User />
              </UserAvatarPlaceholder>
            )}
            <LogoutButton onClick={handleLogout} title='로그아웃'>
              <LogOut />
            </LogoutButton>
          </UserSection>
        </HeaderActions>
      </HeaderContent>
    </HeaderWrapper>
  );
};

// ============================================================================
// Sidebar Component
// ============================================================================

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { classes, isLoading, examStatus } = useTeacherClasses();
  const isActive = (path: string) => location.pathname.startsWith(path);

  const isDashboardPath = location.pathname.startsWith('/dashboard');
  const [isDashboardOpen, setIsDashboardOpen] = useState(isDashboardPath);

  useEffect(() => {
    if (isDashboardPath) setIsDashboardOpen(true);
  }, [isDashboardPath]);

  // 현재 URL에서 testId 추출 (담당 학급 클릭 시 사용)
  const currentTestId = location.pathname.startsWith('/dashboard/selfreg') ? 'selfreg' : 'comprehensive';

  // Feature Flag에 따라 네비게이션 필터링
  const filteredNavGroups = useMemo(() => {
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.feature || FEATURES[item.feature]),
      }))
      .filter((group) => group.items.length > 0);
  }, []);

  // 담당 학급 섹션 렌더링
  const renderClassList = () => {
    if (isLoading) {
      return (
        <LoadingContainer>
          <SpinnerIcon />
          {!isCollapsed && <LoadingText>로딩 중...</LoadingText>}
        </LoadingContainer>
      );
    }

    if (examStatus === 'no-exams') {
      if (isCollapsed) return null;
      return <EmptyMessage>생성된 검사가 없습니다</EmptyMessage>;
    }

    if (examStatus === 'in-progress') {
      if (isCollapsed) return null;
      return <EmptyMessage>진행 중인 검사만 있습니다</EmptyMessage>;
    }

    if (classes.length === 0) {
      if (isCollapsed) return null;
      return <EmptyMessage>종료된 검사가 없습니다</EmptyMessage>;
    }

    return (
      <ClassList $isCollapsed={isCollapsed}>
        {classes.map((cls) => (
          <li key={cls.id}>
            <ClassItemButton
              $isCollapsed={isCollapsed}
              onClick={() => navigate(`/dashboard/${currentTestId}/class/${cls.id}`)}
              title={`${cls.grade}-${cls.classNumber}반`}
            >
              {isCollapsed ? (
                <ClassBadge>{cls.classNumber}</ClassBadge>
              ) : (
                <>
                  <Users />
                  <span>{`${cls.grade}-${cls.classNumber}반`}</span>
                </>
              )}
            </ClassItemButton>
          </li>
        ))}
      </ClassList>
    );
  };

  return (
    <SidebarWrapper $isCollapsed={isCollapsed}>
      <SidebarNav $isCollapsed={isCollapsed}>
        {filteredNavGroups.map((group, groupIndex) => (
          <NavGroupContainer key={group.title} $hasMargin={groupIndex > 0}>
            {/* 그룹 구분선 (첫 번째 그룹 제외) */}
            {groupIndex > 0 && <NavGroupDivider $isCollapsed={isCollapsed} />}

            {/* 그룹 제목 (Collapsed 상태에서는 숨김) */}
            {!isCollapsed && <NavGroupTitle>{group.title}</NavGroupTitle>}

            <NavList>
              {group.items.map((item) => {
                const Icon = item.icon;
                const hasSubItems = Boolean(item.subItems?.length);
                const active = isActive(item.path);

                if (hasSubItems) {
                  const isOpen = isDashboardOpen;
                  return (
                    <li key={item.path}>
                      <NavItemButton
                        $isActive={active}
                        $isCollapsed={isCollapsed}
                        onClick={() => {
                          if (isCollapsed) {
                            const activeSub = item.subItems!.find((s) => isActive(s.path));
                            navigate(activeSub?.path ?? item.subItems![0].path);
                          } else {
                            setIsDashboardOpen((p) => !p);
                          }
                        }}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon />
                        {!isCollapsed && (
                          <>
                            <NavItemLabel>{item.label}</NavItemLabel>
                            <NavChevronDown $open={isOpen} />
                          </>
                        )}
                      </NavItemButton>
                      {!isCollapsed && isOpen && (
                        <SubNavList>
                          {item.subItems!.map((sub) => (
                            <li key={sub.path}>
                              <SubNavButton
                                $isActive={isActive(sub.path)}
                                onClick={() => navigate(sub.path)}
                              >
                                {sub.label}
                              </SubNavButton>
                            </li>
                          ))}
                        </SubNavList>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={item.path}>
                    <NavItemButton
                      $isActive={active}
                      $isCollapsed={isCollapsed}
                      onClick={() => navigate(item.path)}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon />
                      {!isCollapsed && (
                        <>
                          <NavItemLabel>{item.label}</NavItemLabel>
                          {active && <NavItemChevron />}
                        </>
                      )}
                    </NavItemButton>
                  </li>
                );
              })}
            </NavList>
          </NavGroupContainer>
        ))}

        {/* 담당 학급 섹션 */}
        {!isCollapsed ? (
          <ClassSectionContainer $isCollapsed={isCollapsed}>
            <ClassSectionTitle>담당 학급</ClassSectionTitle>
            {renderClassList()}
          </ClassSectionContainer>
        ) : (
          <ClassSectionCollapsed>{renderClassList()}</ClassSectionCollapsed>
        )}
      </SidebarNav>

      {/* 접기/펼치기 버튼 - 하단 고정 */}
      <ToggleSection>
        <ToggleButton
          $isCollapsed={isCollapsed}
          onClick={onToggle}
          title={isCollapsed ? '메뉴 펼치기' : '메뉴 접기'}
        >
          {isCollapsed ? (
            <PanelLeft />
          ) : (
            <>
              <PanelLeftClose />
              <span>메뉴 접기</span>
            </>
          )}
        </ToggleButton>
      </ToggleSection>
    </SidebarWrapper>
  );
};

// ============================================================================
// MainLayout Component
// ============================================================================

export const MainLayout: React.FC<LayoutProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggle = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <LayoutContainer>
      <Header />
      <FlexContainer>
        <Sidebar isCollapsed={isCollapsed} onToggle={handleToggle} />
        <MainContent $isCollapsed={isCollapsed}>{children}</MainContent>
      </FlexContainer>
    </LayoutContainer>
  );
};

export default MainLayout;
