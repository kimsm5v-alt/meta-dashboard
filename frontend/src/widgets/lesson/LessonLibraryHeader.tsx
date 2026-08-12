import styled from '@emotion/styled';
import { FilterPanel, useLibraryFilters } from '@features/lesson';

const Header = styled.header`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

export const LessonLibraryHeader = () => {
  const { filters, sort, onToggle, onClear, onSort } = useLibraryFilters();

  return (
    <FilterPanel
      filters={filters}
      sort={sort}
      onToggle={onToggle}
      onClear={onClear}
      onSort={onSort}
    />
  );
};

export default LessonLibraryHeader;
