import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api';

/**
 * 학교 검색 — 학심정 BE의 NEIS 프록시(`GET /api/v1/schools/search`) 호출.
 * 검사 기본정보 입력의 학교 검색 모달에서 사용.
 */
export interface SchoolSearchResult {
  code: string; // NEIS 표준학교코드 — 선택 시 검사 schoolCode 로 저장(나이스 연동)
  name: string; // 학교명
  grade: string; // 학교급 ENUM 명 (ELEMENTARY/MIDDLE/HIGH/KINDERGARTEN/SPECIAL/ETC)
  niceKindName: string; // NEIS 원본 학교종류명
  region: string; // 소재지 시도
}

export interface SchoolSearchPage {
  items: SchoolSearchResult[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export const searchSchools = async (
  keyword: string,
  page = 1,
): Promise<SchoolSearchPage> => {
  const res = await apiClient.get<SchoolSearchPage>(
    `/api/v1/schools/search?keyword=${encodeURIComponent(keyword)}&page=${page}`,
  );
  return res.resultData ?? { items: [], totalCount: 0, page, pageSize: 20 };
};

/** NEIS 학교급 ENUM → 학심정 SchoolLevel(elementary/middle/high). 그 외(유치원/특수 등)는 ''. */
export const neisGradeToSchoolLevel = (
  grade: string,
): 'elementary' | 'middle' | 'high' | '' => {
  switch (grade) {
    case 'ELEMENTARY':
      return 'elementary';
    case 'MIDDLE':
      return 'middle';
    case 'HIGH':
      return 'high';
    default:
      return '';
  }
};

/** 학교 검색 — InfiniteQuery("더 보기" 페이지네이션). */
export function useSchoolSearch(keyword: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['school-search', keyword],
    queryFn: ({ pageParam }) => searchSchools(keyword, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.items.length, 0);
      return loaded < lastPage.totalCount ? allPages.length + 1 : undefined;
    },
    enabled: enabled && keyword.trim().length >= 1,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
