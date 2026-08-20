import type { QueryClient } from '@tanstack/react-query';
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { getCmsSet, getCmsSetList } from './cmsSetService';
import type { CmsSetListData } from './cmsSetService';
import {
  createLibraryItem,
  deleteLibraryItem,
  getLibraryItem,
  getLibraryItemList,
  updateLibraryItem,
} from './lmsLibraryItemService';
import type { LibraryItem, LibraryItemListData, LibraryItemOptions } from './lmsLibraryItemService';
import type { LibFilters, SortKey } from '../model/types';
import { lessonKeys } from './queryKeys';

const CMS_SETS_DEFAULT = {
  pageNo: 0,
  pageSize: 10,
  brandId: 18,
  serviceType: 131132, // 추후 수정 필요
} as const;

export type SyncLibraryItemOnSaveInput = {
  lcmsSetId: string;
  alias: string;
  labels?: string[];
  options?: LibraryItemOptions;
  libraryItemId?: string | null;
};

function buildSavePayload(input: SyncLibraryItemOnSaveInput): {
  alias: string;
  labels?: string[];
  options?: LibraryItemOptions;
} {
  return {
    alias: input.alias,
    ...(input.labels ? { labels: input.labels } : {}),
    ...(input.options ? { options: input.options } : {}),
  };
}

function findLibraryItemInCache(
  queryClient: QueryClient,
  lcmsSetId: string,
): LibraryItem | undefined {
  const cached = queryClient.getQueryData<LibraryItemListData>(lessonKeys.libraryItems());
  return cached?.list.find((item) => item.lcmsSetId === lcmsSetId);
}

function resolveKnownLibraryItemId(
  queryClient: QueryClient,
  lcmsSetId: string,
  libraryItemId?: string | null,
): string | undefined {
  if (libraryItemId) return libraryItemId;
  return findLibraryItemInCache(queryClient, lcmsSetId)?.libraryItemId;
}

export function useLibraryItemListQuery() {
  return useQuery({
    queryKey: lessonKeys.libraryItems(),
    queryFn: ({ signal }) => getLibraryItemList(undefined, signal),
  });
}

export function useLibraryItemQuery(
  libraryItemId: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: lessonKeys.libraryItem(libraryItemId ?? ''),
    queryFn: ({ signal }) => getLibraryItem(libraryItemId!, signal),
    enabled: Boolean(libraryItemId) && (options?.enabled ?? true),
  });
}

export function useSyncLibraryItemOnSaveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SyncLibraryItemOnSaveInput) => {
      const savePayload = buildSavePayload(input);

      const knownId = resolveKnownLibraryItemId(queryClient, input.lcmsSetId, input.libraryItemId);

      if (knownId) {
        return updateLibraryItem(knownId, savePayload);
      }

      const { item, created } = await createLibraryItem({
        lcmsSetId: input.lcmsSetId,
        ...savePayload,
      });

      if (created) {
        return item;
      }

      // POST 200 — 이미 담긴 항목. body alias/options 무시 → PATCH로 동기화
      return updateLibraryItem(item.libraryItemId, savePayload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: lessonKeys.libraryItems() });
    },
  });
}

export function useDeleteLibraryItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (libraryItemId: string) => deleteLibraryItem(libraryItemId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: lessonKeys.libraryItems() });
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
