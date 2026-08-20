import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import type { CSSObject } from '@emotion/react';
import { toast } from 'sonner';
import { theme } from '@app/styles/theme';
import { Button } from '@shared/ui/Button/Button';
import {
  ResourceCardList,
  useLibraryItemInfiniteListQuery,
  useDeleteLibraryItemMutation,
  mapLibraryItemToLibItem,
  // MOCK_LIBRARY_ITEMS,
} from '@features/lesson';
// import type { LibItem } from '@features/lesson';

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

const ListWrap = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ErrorText = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.error.main};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

export const LessonMyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isPending, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useLibraryItemInfiniteListQuery();
  const { mutate: deleteLibraryItem } = useDeleteLibraryItemMutation();

  const items = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.list).map(mapLibraryItemToLibItem),
    [data],
  );

  // --- MOCK 경로 (필요 시 아래 주석 해제 + 위 API 훅 비활성) ---
  // const [items, setItems] = useState<LibItem[]>(MOCK_LIBRARY_ITEMS);
  // -----------------------------------------------------------

  const handleDelete = (libraryItemId: string) => {
    if (!libraryItemId) return;
    deleteLibraryItem(libraryItemId, {
      onSuccess: () => {
        toast.message('삭제되었습니다', {
          // position: 'bottom-center',
          // unstyled: true,
          // style: {
          //   backgroundColor: 'rgba(15, 23, 42, 0.9)',
          //   color: '#ffffff',
          //   border: 'none',
          //   borderRadius: '9999px',
          //   padding: '10px 20px',
          //   fontSize: '14px',
          //   fontWeight: 500,
          //   boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
          // },
        });
      },
      onError: () => {
        toast.error('삭제에 실패했습니다');
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
          onClick={() => navigate(`/lesson/editor${location.search}`)}
          type='button'
          css={BUTTON_PRIMARY_CSS}
        >
          + 새로 만들기
        </Button>
      </ContentsHeader>

      <ListWrap>
        {isError ? (
          <ErrorText role='alert'>
            {error instanceof Error ? error.message : '자료 목록을 불러오지 못했습니다.'}
          </ErrorText>
        ) : (
          <ResourceCardList
            items={items}
            variant='my'
            onDelete={handleDelete}
            isLoading={isPending}
            hasMore={Boolean(hasNextPage)}
            isFetchingMore={isFetchingNextPage}
            onEndReached={() => {
              if (hasNextPage) void fetchNextPage();
            }}
            emptyMessage='저장된 자료가 없습니다'
          />
        )}
      </ListWrap>
    </Page>
  );
};

export default LessonMyPage;
