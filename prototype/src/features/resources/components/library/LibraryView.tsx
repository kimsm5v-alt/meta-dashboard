/**
 * 공유 자료실 — 전체 콘텐츠 탐색 (목업 renderLibrary 의 전체 분기).
 * 제목 + 다축 필터 + 전체 자료실 그리드.
 * 반 스코프에서는 ClassCurationView(맞춤 추천 패널) 아래에 이어 붙는다.
 */
import { useMemo, useState } from 'react';
import { LIB } from '../../mock-data';
import type { LibItem } from '../../types';
import { FilterPanel, EMPTY_FILTERS, type FilterAxis, type LibFilters, type SortKey } from './FilterPanel';
import { ResourceGrid } from './ResourceGrid';

/** 목업 matchLibF — 축별 교집합 (빈 축은 통과) */
function matchLibF(item: LibItem, f: LibFilters): boolean {
  const A: Record<FilterAxis, string[]> = {
    provider: item.provider ? [item.provider] : [],
    casel: [item.sel],
    level: item.level ?? [],
    grade: item.grade ?? [],
    duration: item.duration ? [item.duration] : [],
    factor: item.factors ?? [],
  };
  return (Object.keys(f) as FilterAxis[]).every(
    (k) => f[k].length === 0 || A[k].some((v) => f[k].includes(v)),
  );
}

function sortItems(items: LibItem[], sort: SortKey): LibItem[] {
  if (sort === '인기순') return [...items].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
  if (sort === '저장순') return [...items].sort((a, b) => (b.saves ?? 0) - (a.saves ?? 0));
  return items; // 최신순: 원본 순서 유지
}

export const LibraryView = () => {
  const [filters, setFilters] = useState<LibFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>('인기순');

  const toggle = (axis: FilterAxis, val: string) =>
    setFilters((f) => ({
      ...f,
      [axis]: f[axis].includes(val) ? f[axis].filter((v) => v !== val) : [...f[axis], val],
    }));
  const clear = () => setFilters(EMPTY_FILTERS);

  const items = useMemo(() => sortItems(LIB.filter((d) => matchLibF(d, filters)), sort), [filters, sort]);

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div>
        <div className="text-lg font-extrabold tracking-tight text-gray-900">전체 자료실</div>
        <p className="mt-0.5 text-sm text-gray-500">검증 · 비검증 · 내외부 SEL 콘텐츠를 함께 탐색합니다.</p>
      </div>
      <FilterPanel filters={filters} onToggle={toggle} onClear={clear} sort={sort} onSort={setSort} />
      <ResourceGrid items={items} />
    </div>
  );
};
