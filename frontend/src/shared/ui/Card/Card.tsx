import styled from '@emotion/styled';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass';
  hover?: boolean;
  /** Alias for hover */
  hoverable?: boolean;
  children: ReactNode;
}

const StyledCard = styled.div<{
  $variant: 'default' | 'glass';
  $hover: boolean;
}>`
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  transition: all ${({ theme }) => theme.transitions.normal};

  ${({ $variant, theme }) =>
    $variant === 'glass'
      ? `
        background: ${theme.colors.glass.background};
        backdrop-filter: blur(10px);
        border: 1px solid ${theme.colors.glass.border};
        box-shadow: ${theme.shadows.glass};
      `
      : `
        background: ${theme.colors.background.paper};
        border: 1px solid ${theme.colors.gray[100]};
        box-shadow: ${theme.shadows.sm};
      `}

  ${({ $hover, theme }) =>
    $hover &&
    `
    cursor: pointer;
    &:hover {
      border-color: ${theme.colors.gray[200]};
      box-shadow: ${theme.shadows.md};
    }
  `}
`;

const CardHeader = styled.div`
  padding: ${({ theme }) => `${theme.spacing.lg} ${theme.spacing.lg} 0`};
`;

const CardContent = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const CardFooter = styled.div`
  padding: ${({ theme }) => `0 ${theme.spacing.lg} ${theme.spacing.lg}`};
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const Card = ({
  variant = 'default',
  hover = false,
  hoverable,
  children,
  ...props
}: CardProps) => {
  return (
    <StyledCard $variant={variant} $hover={hover || hoverable || false} {...props}>
      {children}
    </StyledCard>
  );
};

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;
