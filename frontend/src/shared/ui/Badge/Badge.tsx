import styled from '@emotion/styled';

type BadgeVariant = 'warning' | 'balance' | 'excellent' | 'success' | 'error' | 'info' | 'default';
type StudentType =
  | '자원소진형'
  | '안전균형형'
  | '몰입자원풍부형'
  | '무기력형'
  | '정서조절취약형'
  | '자기주도몰입형';

interface BadgeProps {
  variant?: BadgeVariant;
  type?: StudentType;
  children: React.ReactNode;
  className?: string;
}

const StyledBadge = styled.span<{ $variant: BadgeVariant; $type?: StudentType }>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};

  ${({ $variant, $type, theme }) => {
    // type prop이 있으면 type별 색상 사용
    if ($type) {
      const typeColorMap: Record<StudentType, string> = {
        자원소진형: theme.colors.type.warning,
        무기력형: theme.colors.type.warning,
        안전균형형: theme.colors.type.balance,
        정서조절취약형: theme.colors.type.balance,
        몰입자원풍부형: theme.colors.type.excellent,
        자기주도몰입형: theme.colors.type.excellent,
      };
      const color = typeColorMap[$type] || theme.colors.gray[400];
      return `
        background: ${color}20;
        color: ${color};
      `;
    }

    // variant 사용
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

export const Badge = ({ variant = 'default', type, children, className }: BadgeProps) => {
  return (
    <StyledBadge $variant={variant} $type={type} className={className}>
      {children}
    </StyledBadge>
  );
};

export const TypeBadge = ({ type }: { type: StudentType }) => <Badge type={type}>{type}</Badge>;
