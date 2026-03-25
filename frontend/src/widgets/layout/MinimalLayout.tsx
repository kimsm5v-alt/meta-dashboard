import styled from '@emotion/styled';
import type { ReactNode } from 'react';

interface MinimalLayoutProps {
  children: ReactNode;
}

const Container = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background.default};
`;

/**
 * 사이드바/헤더 없는 최소 레이아웃
 * 랜딩 페이지, 로그인 페이지 등에서 사용
 */
export const MinimalLayout: React.FC<MinimalLayoutProps> = ({ children }) => {
  return <Container>{children}</Container>;
};
