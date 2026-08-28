import { useMemo } from 'react';
import styled from '@emotion/styled';
import { toast } from 'sonner';
import {
  ResourceCardList,
  useDeleteLibraryItemMutation,
  useLibraryItemInfiniteListQuery,
  mapLibraryItemToLibItem,
} from '@features/lesson';

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

export const LessonMyContents = () => {
  const { data, isPending, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useLibraryItemInfiniteListQuery();
  const { mutate: deleteLibraryItem } = useDeleteLibraryItemMutation();

  const items = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.list).map(mapLibraryItemToLibItem),
    [data],
  );

  const handleDelete = (libraryItemId: string) => {
    if (!libraryItemId) return;
    deleteLibraryItem(libraryItemId, {
      onSuccess: () => {
        toast.message('삭제되었습니다');
      },
      onError: () => {
        toast.error('삭제에 실패했습니다');
      },
    });
  };

  if (isError) {
    return (
      <ListWrap>
        <ErrorText role='alert'>
          {error instanceof Error ? error.message : '자료 목록을 불러오지 못했습니다.'}
        </ErrorText>
      </ListWrap>
    );
  }

  return (
    <ListWrap>
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
    </ListWrap>
  );
};
