import styled from '@emotion/styled';
import { useLayoutContext } from '@widgets/layout/v2/LayoutContext';
import { LessonResultContents } from '@widgets/lesson';

const Page = styled.section``;

const ContentsHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extraBold};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
`;

const Description = styled.p`
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

export const LessonResultPage = () => {
  const { scope } = useLayoutContext();

  return (
    <Page>
      <ContentsHeader>
        <Title>수업 결과보기</Title>
        <Description>
          배포한 활동의 참여 현황을 한눈에 보고, 활동별 리포트로 상세 결과를 확인하세요.
        </Description>
      </ContentsHeader>
      <LessonResultContents classId={scope.classId} />
    </Page>
  );
};

export default LessonResultPage;
