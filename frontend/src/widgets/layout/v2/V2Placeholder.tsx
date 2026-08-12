import styled from '@emotion/styled';
import type React from 'react';

const Container = styled.section`
  padding: ${({ theme }) => theme.spacing['2xl']};
  background-color: ${({ theme }) => theme.colors.background.paper};
  border: 1px solid ${({ theme }) => theme.colors.gray[100]};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const Title = styled.h1`
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  color: ${({ theme }) => theme.colors.gray[900]};
`;

const Description = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

interface V2PlaceholderProps {
  title: string;
  description?: string;
}

export const V2Placeholder: React.FC<V2PlaceholderProps> = ({ title, description }) => (
  <Container>
    <Title>{title}</Title>
    <Description>{description ?? '다음 구현 단계에서 이 화면의 기능을 연결합니다.'}</Description>
  </Container>
);
