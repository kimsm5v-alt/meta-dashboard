import { FilterPanel, useLibraryFilters } from '@features/lesson';

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
