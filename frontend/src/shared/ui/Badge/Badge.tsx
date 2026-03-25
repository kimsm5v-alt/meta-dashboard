import styled from '@emotion/styled';

type BadgeVariant = 'warning' | 'balance' | 'excellent' | 'success' | 'error' | 'info' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const StyledBadge = styled.span<{ $variant: BadgeVariant }>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};

  ${({ $variant, theme }) => {
    const colorMap: Record<BadgeVariant, string> = {
      warning: theme.colors.type.warning,
      balance: theme.colors.type.balance,
      excellent: theme.colors.type.excellent,
      success: theme.colors.success.main,
      error: theme.colors.error.main,
      info: theme.colors.info.main,
      default: theme.colors.gray[400],
    };
    const color = colorMap[$variant];
    return `
      background: ${color}20;
      color: ${color};
    `;
  }}
`;

export const Badge = ({ variant = 'default', children }: BadgeProps) => {
  return <StyledBadge $variant={variant}>{children}</StyledBadge>;
};
