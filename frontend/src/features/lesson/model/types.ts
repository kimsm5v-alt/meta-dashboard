/**
 * 자료실 다축 필터 축 (영문 키).
 * 한글 라벨·옵션 목록은 `filterTaxonomy.ts`의 FILTER_AXIS_LABELS 참고.
 */
export type FilterAxis = 'provider' | 'selArea' | 'level' | 'grade' | 'duration' | 'factor';

/** 축별 선택 값 (빈 배열 = 해당 축 미적용). 값은 taxonomy option의 value */
export type LibFilters = Record<FilterAxis, string[]>;

/** 자료실 정렬 (프로토타입: 인기순 / 최신순 / 저장순) */
export type SortKey = 'popular' | 'newest' | 'saved';

export const EMPTY_FILTERS: LibFilters = {
  level: [],
  grade: [],
  provider: [],
  selArea: [],
  duration: [],
  factor: [],
};

/** FilterPanel 제어 props (상태는 위젯/훅 소유) */
export interface FilterPanelProps {
  filters: LibFilters;
  sort: SortKey;
  onToggle: (axis: FilterAxis, value: string) => void;
  onClear: () => void;
  onSort: (value: SortKey) => void;
}
