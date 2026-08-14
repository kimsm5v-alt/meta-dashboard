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

/** 자료 출처 (표시 라벨은 LIBRARY_SRC_LABELS) */
export type LibrarySrc = 'verified' | 'unverified' | 'external' | 'internal';

export const LIBRARY_SRC_LABELS: Record<LibrarySrc, string> = {
  verified: '검증',
  unverified: '비검증',
  external: '외부',
  internal: '내부',
};

/** 썸네일 파스텔 톤 그룹 */
export type LibraryColorGroup = 'g1' | 'g2' | 'g3' | 'g4' | 'g5' | 'g6';

/**
 * 자료실·나의 자료 카드 모델 (API DTO와 분리 — mapper로 채움).
 * 필수: `id`, `title`. `refSetId`는 나의 자료(ref-set) 연동 시 사용.
 * 그 외(src·selArea·colorGroup 포함)는 선택.
 */
export interface LibItem {
  id: string;
  refSetId?: string;
  title: string;
  /** 카드 썸네일 URL — 선택. UI 반영은 추후 */
  thumbnailUrl?: string;
  src?: LibrarySrc;
  selArea?: string;
  colorGroup?: LibraryColorGroup;
  views?: number;
  saves?: number;
  reason?: string;
  /** 나의 자료(variant=my) 수정일 표시용 — 예: '07/14' */
  updated?: string;
  provider?: string;
  level?: string[];
  grade?: string[];
  duration?: string;
  factors?: string[];
}

/** ResourceCard / ResourceCardList 표시 모드 */
export type ResourceCardVariant = 'library' | 'my';
