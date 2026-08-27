import type { QueryClient } from '@tanstack/react-query';
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { getCmsArticle, getCmsSet, getCmsSetList } from './cmsSetService';
import type { CmsArticleInfo, CmsSetListData } from './cmsSetService';
import {
  createLibraryItem,
  deleteLibraryItem,
  getLibraryItem,
  getLibraryItemList,
  updateLibraryItem,
} from './lmsLibraryItemService';
import type { LibraryItem, LibraryItemListData, LibraryItemOptions } from './lmsLibraryItemService';
import {
  fetchActivityEntry,
  getActivities,
  getActivity,
  getActivityAssignees,
  getActivityProgress,
  getActivityStatistics,
  getTeacherParticipationResult,
  LmsHttpError,
  startParticipation,
} from './lmsActivityService';
import type {
  ActivitiesPageResponse,
  ActivityAvailability,
  ActivityDetail,
  ActivityProgress,
  ActivityStatistics,
  ParticipationResult,
} from './lmsActivityService';
// import { CMS_BRAND_ID } from '../model/constants';
import type { LibFilters, SortKey } from '../model/types';
import { lessonKeys } from './queryKeys';
import { useAuth } from '@features/auth';
import { resolveAssigneeNamesFromGroups } from '../model/resolveAssigneeNamesFromGroups';
import type { AssigneeNameInfo } from '../model/resolveAssigneeNamesFromGroups';

const CMS_SETS_DEFAULT = {
  pageNo: 0,
  pageSize: 10,
  brandId: 18,
  // brandId: CMS_BRAND_ID,
  serviceType: 131132, // 추후 수정 필요
} as const;

const LIBRARY_ITEMS_DEFAULT = {
  page: 0,
  size: 10,
  withTotal: true,
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
  const cached = queryClient.getQueryData<unknown>(lessonKeys.libraryItems());

  // useQuery 형태: { list, totalCount, hasNext }
  const singleList = (cached as LibraryItemListData | null | undefined)?.list;
  if (Array.isArray(singleList)) {
    return singleList.find((item) => item.lcmsSetId === lcmsSetId);
  }

  // useInfiniteQuery 형태: { pages: [{ list, ... }, ...] }
  const pages = (cached as { pages?: Array<LibraryItemListData> } | null | undefined)?.pages;
  const mergedList = pages?.flatMap((p) => p.list) ?? [];
  return mergedList.find((item) => item.lcmsSetId === lcmsSetId);
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

export function useLibraryItemInfiniteListQuery() {
  return useInfiniteQuery<LibraryItemListData>({
    queryKey: lessonKeys.libraryItems(),
    queryFn: ({ pageParam, signal }) =>
      getLibraryItemList(
        {
          page: Number(pageParam),
          size: LIBRARY_ITEMS_DEFAULT.size,
          withTotal: LIBRARY_ITEMS_DEFAULT.withTotal,
        },
        signal,
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.hasNext ? allPages.length : undefined),
    placeholderData: keepPreviousData,
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

/** GET /entry/{accessKey} */
export function useActivityEntryQuery(
  accessKey: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: lessonKeys.activityEntry(accessKey ?? ''),
    queryFn: ({ signal }) => fetchActivityEntry(accessKey!, signal),
    enabled: Boolean(accessKey) && (options?.enabled ?? true),
    retry: false,
  });
}

/**
 * POST /participations — entry availability === OPEN 일 때만.
 * content.lcmsSetId → embed slideId.
 */
export function useStartParticipationQuery(
  accessKey: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: lessonKeys.participation(accessKey ?? ''),
    queryFn: () => startParticipation(accessKey!),
    enabled: Boolean(accessKey) && (options?.enabled ?? true),
    retry: false,
  });
}

function getThisWeekRange(): { openFrom: string; openTo: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  return {
    openFrom: monday.toISOString(),
    openTo: nextMonday.toISOString(),
  };
}

/** 이번 주 배포 건수 — openFrom/openTo 기준, totalElements만 사용 */
export function useThisWeekCountQuery() {
  const { openFrom, openTo } = getThisWeekRange();
  return useQuery({
    queryKey: lessonKeys.thisWeekCount(),
    queryFn: ({ signal }) => getActivities({ openFrom, openTo, withTotal: true, size: 1 }, signal),
    select: (data) => data.totalElements ?? 0,
  });
}

/** 진행 중 활동 건수 — availability=OPEN, totalElements만 사용 */
export function useRunningCountQuery() {
  return useQuery({
    queryKey: lessonKeys.runningCount(),
    queryFn: ({ signal }) =>
      getActivities({ availability: 'OPEN', withTotal: true, size: 1 }, signal),
    select: (data) => data.totalElements ?? 0,
  });
}

/**
 * 활동 목록 무한 스크롤 쿼리.
 * availability가 undefined이면 전체 조회 (필터 '전체').
 * 필터 변경 시 queryKey가 바뀌어 page 0부터 재조회된다.
 */
export function useActivityListQuery(availability: ActivityAvailability | undefined) {
  return useInfiniteQuery<ActivitiesPageResponse>({
    queryKey: lessonKeys.activitiesByFilter(availability ?? 'ALL'),
    queryFn: ({ pageParam, signal }) =>
      getActivities({ availability, page: Number(pageParam), size: 20 }, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
}

const retryUnlessNotFound = (failureCount: number, error: unknown): boolean => {
  if (error instanceof LmsHttpError && (error.status === 404 || error.status === 409)) {
    return false;
  }
  return failureCount < 1;
};

export function useActivityDetailQuery(activityId: string | undefined) {
  return useQuery<ActivityDetail>({
    queryKey: lessonKeys.activityDetail(activityId ?? ''),
    queryFn: ({ signal }) => getActivity(activityId!, signal),
    enabled: Boolean(activityId),
    retry: retryUnlessNotFound,
  });
}

export function useActivityProgressQuery(activityId: string | undefined) {
  return useQuery<ActivityProgress>({
    queryKey: lessonKeys.activityProgress(activityId ?? ''),
    queryFn: ({ signal }) => getActivityProgress(activityId!, signal),
    enabled: Boolean(activityId),
    retry: retryUnlessNotFound,
  });
}

export function useActivityStatisticsQuery(activityId: string | undefined) {
  return useQuery<ActivityStatistics>({
    queryKey: lessonKeys.activityStatistics(activityId ?? ''),
    queryFn: ({ signal }) => getActivityStatistics(activityId!, signal),
    enabled: Boolean(activityId),
    retry: retryUnlessNotFound,
  });
}

export function useActivityAssigneesQuery(activityId: string | undefined) {
  return useQuery<string[]>({
    queryKey: lessonKeys.activityAssignees(activityId ?? ''),
    queryFn: ({ signal }) => getActivityAssignees(activityId!, signal),
    enabled: Boolean(activityId),
    retry: retryUnlessNotFound,
  });
}

export function useTeacherParticipationQuery(
  activityId: string | undefined,
  participationId: string | undefined,
) {
  return useQuery<ParticipationResult>({
    queryKey: lessonKeys.activityParticipation(activityId ?? '', participationId ?? ''),
    queryFn: ({ signal }) => getTeacherParticipationResult(activityId!, participationId!, signal),
    enabled: Boolean(activityId) && Boolean(participationId),
    retry: retryUnlessNotFound,
  });
}

export function useAssigneeDirectoryQuery(enabled: boolean) {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery<Map<string, AssigneeNameInfo>>({
    queryKey: lessonKeys.assigneeDirectory(userId ?? ''),
    queryFn: () => resolveAssigneeNamesFromGroups(userId!),
    enabled: enabled && Boolean(userId),
  });
}

export function useCmsArticleMapQuery(articleIds: string[]) {
  const unique = [...new Set(articleIds.filter((id) => id.length > 0))];
  const results = useQueries({
    queries: unique.map((id) => ({
      queryKey: lessonKeys.cmsArticle(id),
      queryFn: ({ signal }: { signal?: AbortSignal }) => getCmsArticle(id, signal),
      retry: 1,
    })),
  });

  const map = new Map<string, CmsArticleInfo>();
  unique.forEach((id, index) => {
    const data = results[index]?.data;
    if (data) map.set(id, data);
  });

  return {
    map,
    isPending: unique.length > 0 && results.some((result) => result.isPending),
  };
}
