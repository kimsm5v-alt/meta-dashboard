import styled from '@emotion/styled';

export const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

export const Tab = styled.button<{ $isActive: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: transparent;
  border: none;
  border-bottom: 2px solid
    ${({ theme, $isActive }) => ($isActive ? theme.colors.primary[500] : 'transparent')};
  color: ${({ theme, $isActive }) =>
    $isActive ? theme.colors.primary[500] : theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme, $isActive }) =>
    $isActive ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme, $isActive }) =>
      $isActive ? theme.colors.primary[600] : theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.gray[50]};
  }
`;

export const TabBadge = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  background: ${({ theme }) => theme.colors.error.main};
  color: ${({ theme }) => theme.colors.background.paper};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border-radius: ${({ theme }) => theme.radius.full};
`;
