import type { FilterAxis, LibFilters, LibItem, SortKey } from './types';

/** 축별 교집합 (빈 축은 통과). 목업/클라이언트 필터용 — Phase B API 시 제거 예정 */
export const matchLibraryItem = (item: LibItem, filters: LibFilters): boolean => {
  const axisValues: Record<FilterAxis, string[]> = {
    provider: item.provider ? [item.provider] : [],
    selArea: [item.selArea],
    level: item.level ?? [],
    grade: item.grade ?? [],
    duration: item.duration ? [item.duration] : [],
    factor: item.factors ?? [],
  };

  return (Object.keys(filters) as FilterAxis[]).every(
    (axis) =>
      filters[axis].length === 0 || axisValues[axis].some((value) => filters[axis].includes(value)),
  );
};

export const sortLibraryItems = (items: LibItem[], sort: SortKey): LibItem[] => {
  if (sort === 'popular') {
    return [...items].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
  }
  if (sort === 'saved') {
    return [...items].sort((a, b) => (b.saves ?? 0) - (a.saves ?? 0));
  }
  return items;
};
