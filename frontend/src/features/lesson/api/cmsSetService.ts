import { getAuth } from '@shared/lib/authClient';
import { ENV } from '@shared/config/env';

/** GET /api/sets list[] 아이템 (실측 2026-08-14) */
export interface CmsSetItem {
  setId: string;
  title: string;
  thumbnailUrl?: string;
  slideCount?: number;
  createdAt?: string;
}

/** GET /api/sets 페이지 응답 */
export interface CmsSetListData {
  list: CmsSetItem[];
  pageNo: number;
  pageSize: number;
  totalCount: number;
}

export interface CmsSetListParams {
  pageNo: number;
  pageSize: number;
  brandId: number;
  serviceType: number;
  keyword?: string;
  metaId?: string;
  curriYear?: number;
  curriSchool?: number;
  curriSubject?: number;
  curriBook?: number;
  curriUnit1?: number;
  orderBy?: boolean;
}

/** GET /api/sets/{setId} 단건 응답 (DeployPage 미리보기용 최소 필드 + 후속 slides/metas) */
export interface CmsSetDetail {
  setId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  slides?: Array<{
    slideId: string;
    title: string;
    order: number;
    article?: {
      articleId: string;
      title: string;
      contents?: string;
      json?: string;
      type?: string;
    };
  }>;
  metas?: Array<{
    id: number;
    code: string;
    name: string;
    val: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

async function parseCmsError(res: Response, fallback: string): Promise<never> {
  let message = fallback;
  try {
    const body = (await res.json()) as { message?: string };
    if (body.message) message = body.message;
  } catch {
    // ignore parse error
  }
  throw new Error(message);
}

export async function getCmsSetList(
  params: CmsSetListParams,
  signal?: AbortSignal,
): Promise<CmsSetListData> {
  const qs = new URLSearchParams({
    pageNo: String(params.pageNo),
    pageSize: String(params.pageSize),
    brandId: String(params.brandId),
    serviceType: String(params.serviceType),
  });

  if (params.keyword) qs.set('keyword', params.keyword);
  if (params.metaId) qs.set('metaId', params.metaId);
  if (params.curriYear !== undefined) qs.set('curriYear', String(params.curriYear));
  if (params.curriSchool !== undefined) qs.set('curriSchool', String(params.curriSchool));
  if (params.curriSubject !== undefined) qs.set('curriSubject', String(params.curriSubject));
  if (params.curriBook !== undefined) qs.set('curriBook', String(params.curriBook));
  if (params.curriUnit1 !== undefined) qs.set('curriUnit1', String(params.curriUnit1));
  if (params.orderBy !== undefined) qs.set('orderBy', String(params.orderBy));

  const auth = getAuth();
  const res = await auth.authorizedFetch(`${ENV.CMS_API_URL}/api/sets?${qs}`, {
    signal,
    headers: { accept: '*/*' },
  });
  if (!res.ok) {
    await parseCmsError(res, `CMS sets 조회 실패: ${res.status}`);
  }
  return (await res.json()) as CmsSetListData;
}

export async function getCmsSet(setId: string, signal?: AbortSignal): Promise<CmsSetDetail> {
  const auth = getAuth();
  const res = await auth.authorizedFetch(`${ENV.CMS_API_URL}/api/sets/${setId}`, {
    signal,
    headers: { accept: '*/*' },
  });
  if (!res.ok) {
    await parseCmsError(res, `CMS set 조회 실패: ${res.status}`);
  }
  return (await res.json()) as CmsSetDetail;
}

/** GET /api/articles/{articleId} — 리포트 격자에서 쓰는 필드만 */
export interface CmsArticleInfo {
  id?: string;
  name?: string;
  articleType?: number;
  thumbnail?: string;
}

export async function getCmsArticle(
  articleId: string,
  signal?: AbortSignal,
): Promise<CmsArticleInfo> {
  const auth = getAuth();
  const res = await auth.authorizedFetch(
    `${ENV.CMS_API_URL}/api/articles/${encodeURIComponent(articleId)}`,
    {
      signal,
      headers: { accept: '*/*' },
    },
  );
  if (!res.ok) {
    await parseCmsError(res, `CMS article 조회 실패: ${res.status}`);
  }
  return (await res.json()) as CmsArticleInfo;
}
