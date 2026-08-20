import type { ReactNode } from 'react';
import styled from '@emotion/styled';

const Wrapper = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h1`
  margin: 0 0 ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

interface CoachingPageFrameProps {
  title: string;
  children: ReactNode;
}

export const CoachingPageFrame = ({ title, children }: CoachingPageFrameProps) => (
  <Wrapper>
    <Title>{title}</Title>
    {children}
  </Wrapper>
);
