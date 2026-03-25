import styled from '@emotion/styled';
import { Menu, Bell, User } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

const StyledHeader = styled.header`
  height: 64px;
  background: ${({ theme }) => theme.colors.glass.background};
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.glass.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  position: sticky;
  top: 0;
  z-index: ${({ theme }) => theme.zIndex.sticky};
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const MenuButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.glass.hover};
    color: ${({ theme }) => theme.colors.text.primary};
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: none;
  }
`;

const Logo = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  background: ${({ theme }) => theme.gradients.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.radius.full};
  color: ${({ theme }) => theme.colors.text.secondary};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.glass.hover};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const UserButton = styled(IconButton)`
  background: ${({ theme }) => theme.colors.primary[600]};
  color: white;

  &:hover {
    background: ${({ theme }) => theme.colors.primary[500]};
  }
`;

export const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <StyledHeader>
      <LeftSection>
        <MenuButton onClick={onMenuClick} aria-label='메뉴 열기'>
          <Menu size={24} />
        </MenuButton>
        <Logo>META Dashboard</Logo>
      </LeftSection>
      <RightSection>
        <IconButton aria-label='알림'>
          <Bell size={20} />
        </IconButton>
        <UserButton aria-label='사용자 메뉴'>
          <User size={20} />
        </UserButton>
      </RightSection>
    </StyledHeader>
  );
};
