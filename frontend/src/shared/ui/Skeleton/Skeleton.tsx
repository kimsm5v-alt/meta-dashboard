import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
}

export const Skeleton = styled.div<SkeletonProps>`
  width: ${({ width }) => width ?? '100%'};
  height: ${({ height }) => height ?? '1rem'};
  border-radius: ${({ borderRadius, theme }) => borderRadius ?? theme.radius.md};
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.gray[100]} 25%,
    ${({ theme }) => theme.colors.gray[200]} 50%,
    ${({ theme }) => theme.colors.gray[100]} 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
`;
