import { useLocation, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import type { CSSObject } from '@emotion/react';
import { theme } from '@app/styles/theme';
import { Button } from '@shared/ui/Button/Button';
import { LessonMyContents } from '@widgets/lesson';

const Page = styled.section``;

const ContentsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ContentsHeaderLeft = styled.div``;

const BUTTON_PRIMARY_CSS: CSSObject = {
  flex: 'none',
  borderRadius: '8px',
  border: 'none',
  padding: '8px 14px',
  fontSize: theme.typography.fontSize.sm,
  fontWeight: theme.typography.fontWeight.semibold,
  color: '#ffffff',
  background: theme.colors.primary[500],
  transform: 'none',
  transition: 'color 150ms ease, background-color 150ms ease',
  '&:hover:not(:disabled)': {
    background: theme.colors.primary[600],
    transform: 'none',
  },
};

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

export const LessonMyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Page>
      <ContentsHeader>
        <ContentsHeaderLeft>
          <Title>나의 자료</Title>
          <Description>직접 만든 세트지를 편집하거나 반에 배포하세요.</Description>
        </ContentsHeaderLeft>
        <Button
          variant='primary'
          size='md'
          onClick={() => navigate(`/lesson/editor${location.search}`)}
          type='button'
          css={BUTTON_PRIMARY_CSS}
        >
          + 새로 만들기
        </Button>
      </ContentsHeader>
      <LessonMyContents />
    </Page>
  );
};

export default LessonMyPage;
