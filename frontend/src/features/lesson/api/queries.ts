import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { getCmsSet, getCmsSetList } from './cmsSetService';
import type { CmsSetListData } from './cmsSetService';
import { deleteRefSet, getRefSet, getRefSetList, registerRefSet } from './lmsRefSetService';
import type { RegisterRefSetBody, RefSetListData } from './lmsRefSetService';
import type { LibFilters, SortKey } from '../model/types';
import { lessonKeys } from './queryKeys';

const CMS_SETS_DEFAULT = {
  pageNo: 0,
  pageSize: 10,
  brandId: 18,
  serviceType: 131132, // 추후 수정 필요
} as const;

export function useRefSetListQuery() {
  return useQuery({
    queryKey: lessonKeys.refSets(),
    queryFn: getRefSetList,
  });
}

export function useRefSetQuery(refSetId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: lessonKeys.refSet(refSetId ?? ''),
    queryFn: ({ signal }) => getRefSet(refSetId!, signal),
    enabled: Boolean(refSetId) && (options?.enabled ?? true),
  });
}

export function useRegisterRefSetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RegisterRefSetBody) => {
      // cache 기반 중복 방지: 동일 lcmsSetId 이미 등록된 경우 skip
      const cached = queryClient.getQueryData<RefSetListData>(lessonKeys.refSets());
      const alreadyRegistered = cached?.list.some((item) => item.lcmsSetId === body.lcmsSetId);
      if (alreadyRegistered) return Promise.resolve({ refSetId: '' });
      return registerRefSet(body);
    },
    onSuccess: async (_data, variables) => {
      if (variables.lcmsSetId) {
        await queryClient.invalidateQueries({ queryKey: lessonKeys.refSets() });
      }
    },
  });
}

export function useDeleteRefSetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (refSetId: string) => deleteRefSet(refSetId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: lessonKeys.refSets() });
    },
  });
}

/** filters/sort는 queryKey 트리거용. 이번 Phase에서는 API param에 매핑하지 않음 */
export function useCmsSetListQuery(filters: LibFilters, sort: SortKey) {
  return useInfiniteQuery<CmsSetListData>({
    queryKey: [...lessonKeys.cmsSets(), filters, sort],
    queryFn: ({ pageParam, signal }) =>
      getCmsSetList({ ...CMS_SETS_DEFAULT, pageNo: Number(pageParam) }, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((sum, page) => sum + page.list.length, 0);
      if (loadedCount >= lastPage.totalCount) return undefined;
      if (lastPage.list.length === 0) return undefined;
      return lastPage.pageNo + 1;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCmsSetDetailQuery(setId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: lessonKeys.cmsSet(setId ?? ''),
    queryFn: ({ signal }) => getCmsSet(setId!, signal),
    enabled: Boolean(setId) && (options?.enabled ?? true),
  });
}
