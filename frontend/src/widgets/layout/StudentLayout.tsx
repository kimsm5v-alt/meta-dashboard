/**
 * 학생용 레이아웃
 * - 간단한 사이드바 (나의 그룹, 검사하기, 대시보드)
 * - 학생 정보 표시 헤더
 */

import { useState, useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  BarChart3,
  Users,
  ChevronRight,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  UserCircle,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import styled from '@emotion/styled';
import { BellWithPanel } from '@features/notifications';
import { useAuth } from '@features/auth/model/AuthContext';
import { getMyGroups } from '@features/groups/api/groupService';
import { openMypageGroups } from '@shared/lib/mypage';
import { ENV } from '@shared/config/env';

// ============================================================
// 타입
// ============================================================

interface NavSubItem {
  label: string;
  path: string;
}

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  subItems?: NavSubItem[];
  /** true면 학심정 라우팅 대신 SSO(mypage) 페이지로 전환한다. (group-from-idp) */
  external?: boolean;
}

const RESULT_SUB_ITEMS: NavSubItem[] = [
  { label: '학습종합검사', path: '/student/result/comprehensive' },
  { label: '자기조절학습검사', path: '/student/result/selfreg' },
];

const studentNavItems: NavItem[] = [
  // '나의 그룹'은 학심정 내부 페이지 대신 SSO(mypage) 내 그룹으로 전환한다. (group-from-idp)
  { icon: Users, label: '나의 그룹', path: '/student/groups', external: true },
  { icon: ClipboardList, label: '검사하기', path: '/student/exams' },
  { icon: BarChart3, label: '결과보기', path: '/student/result', subItems: RESULT_SUB_ITEMS },
];

// ============================================================
// Styled Components
// ============================================================

const LayoutRoot = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background.default};
`;

const StyledHeader = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: ${({ theme }) => theme.colors.background.paper};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.spacing.xl};
`;

const HeaderTitle = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary[600]};
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-left: ${({ theme }) => theme.spacing.md};
  border-left: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const UserDetails = styled.div`
  text-align: right;
`;

const UserName = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const UserRole = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const AvatarCircle = styled.div`
  width: 36px;
  height: 36px;
  background: #dbeafe;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
    color: #2563eb;
  }
`;

const IconButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm};
  background: none;
  border: none;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.gray[400]};
  transition: all ${({ theme }) => theme.transitions.fast};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #ef4444;
    background: #fef2f2;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const MypageButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm};
  background: none;
  border: none;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.gray[500]};
  transition: all ${({ theme }) => theme.transitions.fast};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${({ theme }) => theme.colors.gray[700]};
    background: ${({ theme }) => theme.colors.gray[100]};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const StyledAside = styled.aside<{ $collapsed: boolean }>`
  position: fixed;
  left: 0;
  top: 64px;
  bottom: 0;
  width: ${({ $collapsed }) => ($collapsed ? '64px' : '256px')};
  background: ${({ theme }) => theme.colors.background.paper};
  border-right: 1px solid ${({ theme }) => theme.colors.gray[200]};
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
`;

const NavScrollArea = styled.nav<{ $collapsed: boolean }>`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.md};
  padding-left: ${({ $collapsed }) => ($collapsed ? '8px' : undefined)};
  padding-right: ${({ $collapsed }) => ($collapsed ? '8px' : undefined)};
`;

const StudentProfileCard = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md};
  background: linear-gradient(to right, #eff6ff, #eef2ff);
  border-radius: ${({ theme }) => theme.radius.xl};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ProfileAvatar = styled.div`
  width: 40px;
  height: 40px;
  background: #dbeafe;
  border-radius: 50%;
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

const ProfileName = styled.p`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

const ProfileSub = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const NavSectionTitle = styled.h3`
  padding: 0 ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.gray[400]};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const NavItemButton = styled.button<{ $active: boolean; $collapsed: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 10px ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: none;
  background: ${({ $active }) => ($active ? '#eff6ff' : 'transparent')};
  color: ${({ $active, theme }) => ($active ? '#2563eb' : theme.colors.text.secondary)};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};

  &:hover {
    background: ${({ $active }) => ($active ? '#eff6ff' : '#f9fafb')};
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

const NavChevron = styled(ChevronRight)`
  width: 16px !important;
  height: 16px !important;
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

const SubNavButton = styled.button<{ $active: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  padding: 8px ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: none;
  background: ${({ $active }) => ($active ? '#dbeafe' : 'transparent')};
  color: ${({ $active, theme }) => ($active ? '#1d4ed8' : theme.colors.text.secondary)};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ $active, theme }) =>
    $active ? theme.typography.fontWeight.medium : theme.typography.fontWeight.normal};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  text-align: left;

  &:hover {
    background: ${({ $active }) => ($active ? '#dbeafe' : '#f9fafb')};
  }
`;

const CollapseArea = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding: ${({ theme }) => theme.spacing.sm};
`;

const CollapseButton = styled.button<{ $collapsed: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 10px ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};

  &:hover {
    background: ${({ theme }) => theme.colors.gray[100]};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const MainArea = styled.div`
  display: flex;
`;

const MainContent = styled.main<{ $collapsed: boolean }>`
  flex: 1;
  /* flex 자식이 콘텐츠(차트 SVG) min-content 폭으로 팽창하지 않도록 */
  min-width: 0;
  margin-top: 64px;
  margin-left: ${({ $collapsed }) => ($collapsed ? '64px' : '256px')};
  padding: ${({ theme }) => theme.spacing.xl};
  transition: margin-left 0.3s ease;
  min-height: calc(100vh - 64px);
`;

// ============================================================
// Header
// ============================================================

const StudentHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    <StyledHeader>
      <HeaderTitle onClick={() => navigate('/student/exams')}>학습심리정서검사</HeaderTitle>
      <HeaderRight>
        <BellWithPanel />
        <MypageButton onClick={openMypage} title='내 정보 설정' aria-label='내 정보 설정'>
          <UserCog />
        </MypageButton>
        <UserInfo>
          <UserDetails>
            <UserName>{user?.name ?? '학생'}</UserName>
            <UserRole>학생</UserRole>
          </UserDetails>
          <AvatarCircle>
            <UserCircle />
          </AvatarCircle>
          <IconButton
            onClick={() => {
              logout();
              navigate('/');
            }}
            title='로그아웃'
          >
            <LogOut />
          </IconButton>
        </UserInfo>
      </HeaderRight>
    </StyledHeader>
  );
};

// ============================================================
// Sidebar
// ============================================================

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const StudentSidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isResultPath = location.pathname.startsWith('/student/result');
  const [isResultsOpen, setIsResultsOpen] = useState(isResultPath);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isResultPath) setIsResultsOpen(true);
  }, [isResultPath]);

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <StyledAside $collapsed={isCollapsed}>
      <NavScrollArea $collapsed={isCollapsed}>
        {!isCollapsed && (
          <StudentProfileCard>
            <ProfileAvatar>
              <UserCircle />
            </ProfileAvatar>
            <div>
              <ProfileName>{user?.name ?? '학생'}</ProfileName>
              <ProfileSub>학습심리정서검사</ProfileSub>
            </div>
          </StudentProfileCard>
        )}

        {!isCollapsed && <NavSectionTitle>메뉴</NavSectionTitle>}

        <NavList>
          {studentNavItems.map((item) => {
            const Icon = item.icon;
            const hasSubItems = Boolean(item.subItems?.length);
            const active = isActive(item.path);

            if (hasSubItems) {
              return (
                <li key={item.path}>
                  <NavItemButton
                    $active={active}
                    $collapsed={isCollapsed}
                    onClick={() => {
                      if (isCollapsed) {
                        const activeSubPath =
                          item.subItems!.find((s) => isActive(s.path))?.path ??
                          item.subItems![0].path;
                        navigate(activeSubPath);
                      } else {
                        setIsResultsOpen((p) => !p);
                      }
                    }}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon />
                    {!isCollapsed && (
                      <>
                        <NavItemLabel>{item.label}</NavItemLabel>
                        <NavChevronDown $open={isResultsOpen} />
                      </>
                    )}
                  </NavItemButton>
                  {!isCollapsed && isResultsOpen && (
                    <SubNavList>
                      {item.subItems!.map((sub) => (
                        <li key={sub.path}>
                          <SubNavButton
                            $active={isActive(sub.path)}
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
                  $active={item.external ? false : active}
                  $collapsed={isCollapsed}
                  onClick={() => (item.external ? openMypageGroups() : navigate(item.path))}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon />
                  {!isCollapsed && (
                    <>
                      <NavItemLabel>{item.label}</NavItemLabel>
                      {active && <NavChevron />}
                    </>
                  )}
                </NavItemButton>
              </li>
            );
          })}
        </NavList>
      </NavScrollArea>

      <CollapseArea>
        <CollapseButton
          $collapsed={isCollapsed}
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
        </CollapseButton>
      </CollapseArea>
    </StyledAside>
  );
};

// ============================================================
// StudentLayout
// ============================================================

interface StudentLayoutProps {
  children: ReactNode;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, updateUser } = useAuth();

  // 학생 계정에서 classId가 없으면 그룹 조회해서 설정
  useEffect(() => {
    const loadStudentGroup = async () => {
      if (user?.roleCode === 'STUDENT' && user?.stdtId && !user?.classId && user?.id) {
        try {
          const groups = await getMyGroups(user.id);
          const memberGroup = groups.find((g) => g.myRole === 'member');
          if (memberGroup) {
            updateUser({ classId: memberGroup.claId });
          }
        } catch {
          // 로드 실패는 무시 — 검사 페이지에서 다시 시도
        }
      }
    };

    loadStudentGroup();
  }, [user?.roleCode, user?.stdtId, user?.classId, user?.id, updateUser]);

  return (
    <LayoutRoot>
      <StudentHeader />
      <MainArea>
        <StudentSidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed((p) => !p)} />
        <MainContent $collapsed={isCollapsed}>{children}</MainContent>
      </MainArea>
    </LayoutRoot>
  );
};
