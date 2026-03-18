import styled from '@emotion/styled'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  MessageSquare,
  BookOpen,
  Bot,
  X,
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: ${({ theme }) => theme.zIndex.modal - 1};
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  visibility: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
  transition: all ${({ theme }) => theme.transitions.normal};

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`

const StyledSidebar = styled.aside<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 260px;
  height: 100vh;
  background: ${({ theme }) => theme.colors.background.paper};
  border-right: 1px solid ${({ theme }) => theme.colors.gray[700]};
  z-index: ${({ theme }) => theme.zIndex.modal};
  transform: translateX(${({ $isOpen }) => ($isOpen ? '0' : '-100%')});
  transition: transform ${({ theme }) => theme.transitions.normal};

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    position: sticky;
    top: 0;
    transform: none;
  }
`

const SidebarHeader = styled.div`
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[700]};
`

const Logo = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.text.secondary};

  &:hover {
    background: ${({ theme }) => theme.colors.glass.hover};
    color: ${({ theme }) => theme.colors.text.primary};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`

const Nav = styled.nav`
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`

const NavSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const NavSectionTitle = styled.span`
  display: block;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.radius.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.glass.hover};
    color: ${({ theme }) => theme.colors.text.primary};
  }

  &.active {
    background: ${({ theme }) => theme.colors.primary[600]}20;
    color: ${({ theme }) => theme.colors.primary[400]};
  }
`

const navItems = [
  {
    section: '대시보드',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: '전체 현황' },
      { to: '/dashboard/class', icon: Users, label: '학급 관리' },
    ],
  },
  {
    section: '검사 관리',
    items: [
      { to: '/assessment', icon: ClipboardList, label: '검사 관리' },
      { to: '/groups', icon: Users, label: '그룹 관리' },
    ],
  },
  {
    section: '상담',
    items: [
      { to: '/schedule', icon: Calendar, label: '상담 일정' },
      { to: '/counseling', icon: MessageSquare, label: '상담 기록' },
    ],
  },
  {
    section: '콘텐츠',
    items: [
      { to: '/resources', icon: BookOpen, label: '학습 자료' },
      { to: '/ai-room', icon: Bot, label: 'AI 어시스턴트' },
    ],
  },
]

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  return (
    <>
      <Overlay $isOpen={isOpen} onClick={onClose} />
      <StyledSidebar $isOpen={isOpen}>
        <SidebarHeader>
          <Logo>META</Logo>
          <CloseButton onClick={onClose} aria-label="사이드바 닫기">
            <X size={20} />
          </CloseButton>
        </SidebarHeader>
        <Nav>
          {navItems.map((section) => (
            <NavSection key={section.section}>
              <NavSectionTitle>{section.section}</NavSectionTitle>
              {section.items.map((item) => (
                <StyledNavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                >
                  <item.icon size={20} />
                  {item.label}
                </StyledNavLink>
              ))}
            </NavSection>
          ))}
        </Nav>
      </StyledSidebar>
    </>
  )
}
