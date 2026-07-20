/**
 * 공유 자료실 — 전체 스코프 (목업 renderLibrary 의 전체 분기).
 * 히어로 배너 + 다축 필터 + 전체 자료실 그리드.
 * (반 스코프 큐레이팅은 Phase 2 ClassCurationView)
 */
import { useMemo, useState } from 'react';
import { LIB } from '../../mock-data';
import type { LibItem } from '../../types';
import { HeroBanner } from './HeroBanner';
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
    <div className="mt-5 flex flex-col gap-5">
      <HeroBanner />
      <FilterPanel filters={filters} onToggle={toggle} onClear={clear} sort={sort} onSort={setSort} />
      <div>
        <div className="mb-1 text-lg font-extrabold tracking-tight text-gray-900">전체 자료실</div>
        <p className="mb-3 text-sm text-gray-500">검증 · 비검증 · 내외부 SEL 콘텐츠를 함께 탐색합니다.</p>
        <ResourceGrid items={items} />
      </div>
    </div>
  );
};
