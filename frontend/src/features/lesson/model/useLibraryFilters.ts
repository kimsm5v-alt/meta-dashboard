import { useState } from 'react';
import { EMPTY_FILTERS, type FilterAxis, type SortKey } from './types';

export const useLibraryFilters = () => {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>('saved');

  const toggle = (axis: FilterAxis, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      newFilters[axis] = newFilters[axis].includes(value)
        ? newFilters[axis].filter((v) => v !== value)
        : [...newFilters[axis], value];
      return newFilters;
    });
  };
  const clear = () => {
    setFilters(EMPTY_FILTERS);
    setSort('saved');
  };

  return {
    filters,
    sort,
    onToggle: toggle,
    onClear: clear,
    onSort: setSort,
  };
};
