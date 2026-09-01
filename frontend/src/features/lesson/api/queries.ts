import { useMemo } from 'react';
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
  getActivitiesProgressBundle,
  getActivityParticipationsAll,
  getActivityProgress,
  getActivityStatistics,
  getTeacherParticipationResult,
  getMyActivities,
  getParticipationResult,
  LmsHttpError,
  patchParticipationGrading,
  startParticipation,
} from './lmsActivityService';
import type {
  ActivitiesPageResponse,
  ActivitiesProgressBundle,
  ActivityAvailability,
  ActivityDetail,
  ActivityParticipationRow,
  ActivityProgress,
  ActivityStatistics,
  LmsErrata,
  ParticipationResult,
  MyActivity,
} from './lmsActivityService';
// import { CMS_BRAND_ID } from '../model/constants';
import type { LibFilters, SortKey } from '../model/types';
import { lessonKeys } from './queryKeys';
import { useAuth } from '@features/auth';
import { useGroupMembersQuery } from '@features/groups';
import { resolveAssigneeNamesFromGroups } from '../model/resolveAssigneeNamesFromGroups';
import type { AssigneeNameInfo } from '../model/resolveAssigneeNamesFromGroups';
import { classIdLikeOptFilter } from '../model/classIdOptions';
import { classMemberSubs } from '../model/classMemberSubs';

const CMS_SETS_DEFAULT = {
  pageNo: 0,
  pageSize: 10,
  brandId: 18,
  // brandId: CMS_BRAND_ID,
  serviceType: 131132, // 추후 수정 필요
  orderBy: false, // [임시] 20260901 시연용 코드
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
export function useThisWeekCountQuery(classId: string | undefined) {
  const { openFrom, openTo } = getThisWeekRange();
  const optFilter = classId ? [classIdLikeOptFilter(classId)] : undefined;
  return useQuery({
    queryKey: lessonKeys.thisWeekCount(classId ?? ''),
    queryFn: ({ signal }) =>
      getActivities({ openFrom, openTo, withTotal: true, size: 1, optFilter }, signal),
    select: (data) => data.totalElements ?? 0,
    enabled: Boolean(classId),
  });
}

/** 진행 중 활동 건수 — availability=OPEN, totalElements만 사용 */
export function useRunningCountQuery(classId: string | undefined) {
  const optFilter = classId ? [classIdLikeOptFilter(classId)] : undefined;
  return useQuery({
    queryKey: lessonKeys.runningCount(classId ?? ''),
    queryFn: ({ signal }) =>
      getActivities({ availability: 'OPEN', withTotal: true, size: 1, optFilter }, signal),
    select: (data) => data.totalElements ?? 0,
    enabled: Boolean(classId),
  });
}

/**
 * 활동 목록 무한 스크롤 쿼리.
 * availability가 undefined이면 전체 조회 (필터 '전체').
 * 필터 변경 시 queryKey가 바뀌어 page 0부터 재조회된다.
 */
export function useActivityListQuery(
  availability: ActivityAvailability | undefined,
  classId: string | undefined,
) {
  const optFilter = classId ? [classIdLikeOptFilter(classId)] : undefined;
  return useInfiniteQuery<ActivitiesPageResponse>({
    queryKey: lessonKeys.activitiesByFilter(availability ?? 'ALL', classId ?? ''),
    queryFn: ({ pageParam, signal }) =>
      getActivities(
        {
          availability,
          page: Number(pageParam),
          size: 20,
          optFilter,
          withParticipationSummary: true,
        },
        signal,
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    placeholderData: keepPreviousData,
    enabled: Boolean(classId),
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

export function useActivityParticipationsQuery(activityId: string | undefined) {
  return useQuery<ActivityParticipationRow[]>({
    queryKey: lessonKeys.activityParticipations(activityId ?? ''),
    queryFn: ({ signal }) => getActivityParticipationsAll(activityId!, signal),
    enabled: Boolean(activityId),
    retry: retryUnlessNotFound,
  });
}

export function useActivitiesProgressBundleQuery(classId: string | undefined) {
  const optFilter = classId ? [classIdLikeOptFilter(classId)] : undefined;
  return useQuery<ActivitiesProgressBundle>({
    queryKey: lessonKeys.activitiesProgressBundle(classId ?? ''),
    queryFn: ({ signal }) =>
      getActivitiesProgressBundle({ availability: 'OPEN', optFilter }, signal),
    enabled: Boolean(classId),
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

export type PatchParticipationGradingInput = {
  activityId: string;
  participationId: string;
  activityItemId: string;
  errata: LmsErrata;
  /** 사용자 행위(채점 버튼 클릭) 1회당 1개. 재시도 시 동일 키 유지 */
  idempotencyKey: string;
};

export function usePatchParticipationGradingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PatchParticipationGradingInput) =>
      patchParticipationGrading(
        input.activityId,
        input.participationId,
        [{ activityItemId: input.activityItemId, errata: input.errata }],
        input.idempotencyKey,
      ),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({
        queryKey: lessonKeys.activityParticipation(input.activityId, input.participationId),
      });
      void queryClient.invalidateQueries({
        queryKey: lessonKeys.activityStatistics(input.activityId),
      });
    },
  });
}

/** SUBMITTED 학생만 단건 결과를 병렬 조회. 미제출·미완료 id는 넘기지 말 것. */
export function useTeacherParticipationsMapQuery(
  activityId: string | undefined,
  participationIds: string[],
) {
  const unique = [...new Set(participationIds.filter((id) => id.length > 0))];
  const results = useQueries({
    queries: unique.map((id) => ({
      queryKey: lessonKeys.activityParticipation(activityId ?? '', id),
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        getTeacherParticipationResult(activityId!, id, signal),
      enabled: Boolean(activityId) && Boolean(id),
      retry: retryUnlessNotFound,
    })),
  });

  const map = new Map<string, ParticipationResult>();
  unique.forEach((id, index) => {
    const data = results[index]?.data;
    if (data) map.set(id, data);
  });

  return {
    map,
    isPending: unique.length > 0 && results.some((result) => result.isPending),
  };
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

/** 사이드바에서 고른 반(classId)의 활성 학생 spUserId */
export function useClassMemberSubsQuery(classId: string | undefined) {
  const { user } = useAuth();
  const query = useGroupMembersQuery(classId || null, user?.id);
  const subs = useMemo(() => classMemberSubs(query.data), [query.data]);
  return {
    subs,
    isPending: Boolean(classId) && Boolean(user?.id) && query.isPending,
    isError: query.isError,
  };
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

/** GET /api/v1/my-activities — 학생 수업 결과보기 목록 */
export function useMyActivitiesQuery() {
  return useQuery<MyActivity[]>({
    queryKey: lessonKeys.myActivities(),
    queryFn: ({ signal }) => getMyActivities(signal),
  });
}

/** GET /api/v1/participations/{participationId}/result — 학생 본인 결과 */
export function useParticipationResultQuery(participationId: string | undefined) {
  return useQuery<ParticipationResult>({
    queryKey: lessonKeys.participationResult(participationId ?? ''),
    queryFn: ({ signal }) => getParticipationResult(participationId!, signal),
    enabled: Boolean(participationId),
    retry: (failureCount, error) => {
      if (error instanceof LmsHttpError && (error.status === 403 || error.status === 404)) {
        return false;
      }
      return failureCount < 1;
    },
  });
}
