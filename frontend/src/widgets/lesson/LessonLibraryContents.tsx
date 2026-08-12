import styled from '@emotion/styled';

const Contents = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
`;

const Description = styled.p`
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

export const LessonLibraryContents = () => {

  return (
    <Contents>
      <Title>전체 자료실</Title>
      <Description>검증 · 비검증 · 내외부 SEL 콘텐츠를 함께 탐색합니다.</Description>
    </Contents>
  );
};

export default LessonLibraryContents;
