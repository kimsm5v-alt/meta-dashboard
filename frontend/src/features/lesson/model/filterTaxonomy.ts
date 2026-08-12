import type { FilterAxis, SortKey } from './types';

/** 제공처처럼 value ≠ label일 때만 사용 */
export type FilterOption = readonly [value: string, label: string];

/** FilterAxis → 한글 축 라벨 */
export const FILTER_AXIS_LABELS: Record<FilterAxis, string> = {
  level: '학교급',
  grade: '추천학년',
  provider: '제공처',
  selArea: 'SEL영역',
  duration: '수업시간',
  factor: '검사요인',
};

/** 학교급 */
export const LEVELS = ['초', '중', '고'] as const;

/** 추천학년 */
export const GRADES = [
  '초3',
  '초4',
  '초5',
  '초6',
  '중1',
  '중2',
  '중3',
  '고1',
  '고2',
  '고3',
] as const;

/** 제공처 — (상세 — 임시 taxonomy) */
export const PROVIDERS = ['피어나다', '온리원', '비상', '연구단', '교육청'] as const;

/** SEL영역 (상세 — 임시 taxonomy) */
export const SEL_AREAS = [
  '자기인식',
  '자기관리',
  '사회적인식',
  '관계기술',
  '책임있는의사결정',
] as const;

/** 수업시간 (상세 — 임시 taxonomy) */
export const DURATIONS = ['5분', '40분', '45분', '50분', '80분'] as const;

/** 검사요인 (상세 — 임시 taxonomy) */
export const FACTORS = [
  '감정인식',
  '감정조절',
  '공감',
  '의사소통',
  '갈등해결',
  '목표설정',
  '강점인식',
  '문제해결',
] as const;

/** 정렬 축 라벨 (FilterAxis 밖) */
export const SORT_AXIS_LABEL = '정렬';
/** 정렬 */
/** SortKey → 한글 정렬 라벨 */
export const SORT_KEYS_LABELS: Record<SortKey, string> = {
  popular: '인기순',
  newest: '최신순',
  saved: '저장순',
};
export const SORT_KEYS: SortKey[] = ['popular', 'newest', 'saved'];
