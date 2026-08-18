import { useMemo } from 'react';
import styled from '@emotion/styled';
import {
  ResourceCardList,
  useCmsSetListQuery,
  mapCmsSetToLibItem,
  // MOCK 복구 시 아래 import 주석 해제
  // MOCK_LIBRARY_ITEMS,
  // matchLibraryItem,
  // sortLibraryItems,
} from '@features/lesson';
import type { LibFilters, SortKey } from '@features/lesson';

interface LessonLibraryContentsProps {
  filters: LibFilters;
  sort: SortKey;
}

const Contents = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ErrorText = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.error.main};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-align: center;
`;

export const LessonLibraryContents = ({ filters, sort }: LessonLibraryContentsProps) => {
  const { data, isPending, isFetching, isError, error } = useCmsSetListQuery(filters, sort);
  const items = useMemo(() => (data?.list ?? []).map(mapCmsSetToLibItem), [data]);

  // --- MOCK 경로 (필요 시 아래 주석 해제 + 위 CMS 훅 비활성) ---
  // const items = useMemo(() => {
  //   if (data) {
  //     return data?.list.map(mapCmsSetToLibItem);
  //   }
  //   return sortLibraryItems(
  //     MOCK_LIBRARY_ITEMS.filter((item) => matchLibraryItem(item, filters)),
  //     sort,
  //   );
  // }, [data, filters, sort]);
  // const items = useMemo(
  //   () =>
  //     sortLibraryItems(
  //       MOCK_LIBRARY_ITEMS.filter((item) => matchLibraryItem(item, filters)),
  //       sort,
  //     ),
  //   [filters, sort],
  // );
  // -----------------------------------------------------------

  if (isError && items.length === 0) {
    return (
      <Contents>
        <ErrorText role='alert'>
          {error instanceof Error ? error.message : '자료 목록을 불러오지 못했습니다.'}
        </ErrorText>
      </Contents>
    );
  }

  return (
    <Contents>
      <ResourceCardList
        items={items}
        isLoading={isPending || isFetching}
        emptyMessage='조회된 자료가 없습니다'
      />
    </Contents>
  );
};

export default LessonLibraryContents;
