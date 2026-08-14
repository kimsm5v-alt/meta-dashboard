import styled from '@emotion/styled';

const Page = styled.section`
  /* padding: ${({ theme }) => theme.spacing.md} 20px 0; */
`;

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
  return (
    <Page>
      <ContentsHeader>
        <Title>수업 결과보기</Title>
        <Description>
          배포한 활동의 참여 현황을 한눈에 보고, 활동별 리포트로 상세 결과를 확인하세요.
        </Description>
      </ContentsHeader>
    </Page>
  );
};

export default LessonResultPage;
