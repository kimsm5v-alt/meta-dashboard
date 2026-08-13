import { useMemo } from 'react';
import styled from '@emotion/styled';
import {
  ResourceCardList,
  MOCK_LIBRARY_ITEMS,
  matchLibraryItem,
  sortLibraryItems,
} from '@features/lesson';
import type { LibFilters, SortKey } from '@features/lesson';

interface LessonLibraryContentsProps {
  filters: LibFilters;
  sort: SortKey;
}

const Contents = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

export const LessonLibraryContents = ({ filters, sort }: LessonLibraryContentsProps) => {
  const items = useMemo(
    () =>
      sortLibraryItems(
        MOCK_LIBRARY_ITEMS.filter((item) => matchLibraryItem(item, filters)),
        sort,
      ),
    [filters, sort],
  );

  return (
    <Contents>
      <ResourceCardList items={items} />
    </Contents>
  );
};

export default LessonLibraryContents;
