import styled from '@emotion/styled';
import { FilterPanel, useLibraryFilters } from '@features/lesson';
import { LessonLibraryContents } from '@widgets/lesson';

const Page = styled.section``;

export const LessonLibraryPage = () => {
  const { filters, sort, onToggle, onClear, onSort } = useLibraryFilters();

  return (
    <Page>
      <FilterPanel
        filters={filters}
        sort={sort}
        onToggle={onToggle}
        onClear={onClear}
        onSort={onSort}
      />
      <LessonLibraryContents filters={filters} sort={sort} />
    </Page>
  );
};

export default LessonLibraryPage;
