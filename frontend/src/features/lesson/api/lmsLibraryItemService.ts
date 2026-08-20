import { getAuth } from '@shared/lib/authClient';
import { ENV } from '@shared/config/env';

const BASE = `${ENV.SP_LMS_API_URL}/api/v1/library-items`;

interface LmsApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  errorCode: string | null;
}

export class LmsApiError extends Error {
  readonly errorCode: string | null;

  constructor(message: string, errorCode: string | null) {
    super(message);
    this.name = 'LmsApiError';
    this.errorCode = errorCode;
  }
}

/** store-and-echo options (thumbnailUrl 등, 임의 키 허용) */
export type LibraryItemOptions = {
  thumbnailUrl?: string;
} & Record<string, unknown>;

export interface LibraryItem {
  libraryItemId: string;
  lcmsSetId: string;
  alias?: string;
  labels?: string[];
  options?: LibraryItemOptions | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  hasNext: boolean;
  totalElements?: number;
  totalPages?: number;
}

/** LessonMyPage 호환 — Phase 2에서 infinite query로 전환 예정 */
export interface LibraryItemListData {
  list: LibraryItem[];
  totalCount: number;
  hasNext: boolean;
}

export interface GetLibraryItemsParams {
  page?: number;
  size?: number;
  keyword?: string;
  lcmsSetIds?: string;
  withTotal?: boolean;
}

export type CreateLibraryItemBody = {
  lcmsSetId: string;
  alias?: string;
  labels?: string[];
  options?: LibraryItemOptions;
};

export type UpdateLibraryItemBody = {
  alias?: string;
  labels?: string[];
  options?: LibraryItemOptions;
};

async function lmsFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const auth = getAuth();
  const res = await auth.authorizedFetch(input, init);
  if (!res.ok) throw new LmsApiError(`LMS API 실패: ${res.status}`, null);
  const json = (await res.json()) as LmsApiResponse<T>;
  if (!json.success) {
    throw new LmsApiError(json.message ?? 'LMS API Error', json.errorCode);
  }
  return json.data;
}

function buildListQuery(params: GetLibraryItemsParams = {}): string {
  const search = new URLSearchParams();
  const page = params.page ?? 0;
  const size = params.size ?? 100;
  search.set('page', String(page));
  search.set('size', String(size));
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.lcmsSetIds) search.set('lcmsSetIds', params.lcmsSetIds);
  if (params.withTotal) search.set('withTotal', 'true');
  return search.toString();
}

export async function getLibraryItemList(
  params?: GetLibraryItemsParams,
  signal?: AbortSignal,
): Promise<LibraryItemListData> {
  const query = buildListQuery({ withTotal: true, ...params });
  const page = await lmsFetch<PageResponse<LibraryItem>>(`${BASE}?${query}`, { signal });
  return {
    list: page.content,
    totalCount: page.totalElements ?? page.content.length,
    hasNext: page.hasNext,
  };
}

export async function getLibraryItem(
  libraryItemId: string,
  signal?: AbortSignal,
): Promise<LibraryItem> {
  return lmsFetch<LibraryItem>(`${BASE}/${libraryItemId}`, { signal });
}

export async function findLibraryItemByLcmsSetId(
  lcmsSetId: string,
  signal?: AbortSignal,
): Promise<LibraryItem | undefined> {
  const query = buildListQuery({ lcmsSetIds: lcmsSetId, size: 1 });
  const page = await lmsFetch<PageResponse<LibraryItem>>(`${BASE}?${query}`, { signal });
  return page.content[0];
}

export async function createLibraryItem(body: CreateLibraryItemBody): Promise<{
  item: LibraryItem;
  /** true = HTTP 201 (신규 담김), false = HTTP 200 (이미 담긴 항목) */
  created: boolean;
}> {
  const auth = getAuth();
  const res = await auth.authorizedFetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new LmsApiError(`LMS API 실패: ${res.status}`, null);
  const json = (await res.json()) as LmsApiResponse<LibraryItem>;
  if (!json.success) {
    throw new LmsApiError(json.message ?? 'LMS API Error', json.errorCode);
  }
  return { item: json.data, created: res.status === 201 };
}

export async function updateLibraryItem(
  libraryItemId: string,
  body: UpdateLibraryItemBody,
): Promise<LibraryItem> {
  return lmsFetch<LibraryItem>(`${BASE}/${libraryItemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function deleteLibraryItem(libraryItemId: string): Promise<void> {
  await lmsFetch<null>(`${BASE}/${libraryItemId}`, {
    method: 'DELETE',
  });
}
