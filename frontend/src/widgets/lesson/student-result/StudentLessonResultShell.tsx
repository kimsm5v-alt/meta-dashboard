import type { ReactNode } from 'react';
import styled from '@emotion/styled';

interface StudentLessonResultShellProps {
  children: ReactNode;
}

const Root = styled.div`
  margin: 0 auto;
  max-width: 896px;
`;

const Crumb = styled.div`
  color: ${({ theme }) => theme.colors.gray[400]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
`;

export const StudentLessonResultShell = ({ children }: StudentLessonResultShellProps) => (
  <Root>
    <Crumb>수업 › 수업 결과보기</Crumb>
    <Body>{children}</Body>
  </Root>
);
