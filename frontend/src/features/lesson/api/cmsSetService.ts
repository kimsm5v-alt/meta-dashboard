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

  const auth = getAuth();
  const res = await auth.authorizedFetch(`${ENV.CMS_API_URL}/api/sets?${qs}`, {
    signal,
    headers: { accept: '*/*' },
  });
  if (!res.ok) {
    let message = `CMS sets 조회 실패: ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }
  return (await res.json()) as CmsSetListData;
}
