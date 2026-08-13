import { getAuth } from '@shared/lib/authClient';
import { ENV } from '@shared/config/env';

const BASE = `${ENV.SP_LMS_API_URL}/api/ref-set`;

interface LmsEnvelope<T> {
  success: boolean;
  resultCode: number;
  resultMessage: string;
  resultData: T;
}

/** GET /api/ref-set 응답 아이템 */
export interface RefSetItem {
  refSetId: string;
  lcmsSetId: string;
  title: string;
  subjectCd: string;
  schoolLevelCd: string;
  makeMethod: number;
  status: number;
  createdAt: string;
}

export interface RefSetListData {
  totalCount: number;
  list: RefSetItem[];
}

/**
 * POST /api/ref-set 요청 body.
 * makeMethod: 1신규직접 2완성형가공 3자료실 4AI생성 5AI가공 — 미전달 시 기본값 3(자료실)
 */
export interface RegisterRefSetBody {
  lcmsSetId: string;
  title?: string;
  subjectCd?: string;
  schoolLevelCd?: string;
  makeMethod?: number;
}

export interface RegisterRefSetResponse {
  refSetId: string;
}

async function lmsFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const auth = getAuth();
  const res = await auth.authorizedFetch(input, init);
  if (!res.ok) throw new Error(`LMS API 실패: ${res.status}`);
  const json = (await res.json()) as LmsEnvelope<T>;
  if (!json.success) throw new Error(json.resultMessage ?? 'LMS API Error');
  return json.resultData;
}

export async function getRefSetList(): Promise<RefSetListData> {
  return lmsFetch<RefSetListData>(BASE);
}

export async function registerRefSet(
  body: RegisterRefSetBody,
): Promise<RegisterRefSetResponse> {
  return lmsFetch<RegisterRefSetResponse>(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
