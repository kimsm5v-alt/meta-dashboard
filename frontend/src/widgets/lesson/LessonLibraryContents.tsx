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
  margin-bottom: ${({ theme }) => theme.spacing.lg};
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

const GridWrap = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
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
      <Title>전체 자료실</Title>
      <Description>검증 · 비검증 · 내외부 SEL 콘텐츠를 함께 탐색합니다.</Description>
      <GridWrap>
        <ResourceCardList items={items} />
      </GridWrap>
    </Contents>
  );
};

export default LessonLibraryContents;
