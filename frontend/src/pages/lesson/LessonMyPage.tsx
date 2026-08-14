import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { toast } from 'sonner';
import { Button } from '@shared/ui/Button/Button';
import { MOCK_LIBRARY_ITEMS, ResourceCardList, useRefSetListQuery } from '@features/lesson';
import type { LibItem } from '@features/lesson';

const SLIDE_ID = 'slide_123';

const Page = styled.section``;

const ContentsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ContentsHeaderLeft = styled.div``;

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

const ListWrap = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

export const LessonMyPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<LibItem[]>(MOCK_LIBRARY_ITEMS);

  // GET /api/ref-set 데이터 확인용 (ResultData.list 취득까지만 구현)
  // TODO: refSetData?.list -> mapRefSetToLibItem -> ResourceCardList 연결 (추후 Phase)
  const {
    data: refSetData,
    isLoading: isRefSetLoading,
    isError: isRefSetError,
  } = useRefSetListQuery();

  console.log('[LessonMyPage] refSetData', refSetData, { isRefSetLoading, isRefSetError });

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.message('삭제되었습니다', {
      position: 'bottom-center',
      unstyled: true,
      style: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '9999px',
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: 500,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
    });
  };

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
          onClick={() => navigate('/lesson/editor')}
          type='button'
        >
          + 새로 만들기
        </Button>
      </ContentsHeader>

      <ListWrap>
        <ResourceCardList items={items} variant='my' onDelete={handleDelete} />
      </ListWrap>

      <Toolbar>
        <Button
          variant='outline'
          size='md'
          onClick={() => navigate(`/lesson/viewer/${SLIDE_ID}`)}
          type='button'
        >
          수업하기
        </Button>
      </Toolbar>
    </Page>
  );
};

export default LessonMyPage;
