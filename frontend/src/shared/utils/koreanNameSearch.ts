import { getChoseong } from 'es-hangul';

/**
 * 이름 검색에 초성 검색을 더한다. 일반 부분일치와 초성 부분일치 중 하나라도
 * 맞으면 true를 반환한다(예: "나연"과 "ㄴㅇ" 모두 "김나연"과 매칭).
 */
export const matchesNameSearch = (name: string, keyword: string): boolean => {
  if (!keyword) return true;
  if (name.includes(keyword)) return true;
  return getChoseong(name).includes(getChoseong(keyword));
};
