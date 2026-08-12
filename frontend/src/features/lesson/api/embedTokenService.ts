import { getAuth } from '@shared/lib/authClient';

export type EmbedTokenScope = 'editor' | 'viewer';

export type FetchEmbedTokenParams = {
  scope: EmbedTokenScope;
  slideId?: string;
};

type EmbedTokenResponse = {
  token?: string;
  resultData?: { token?: string };
};

/**
 * 자사 BE가 Platform `POST /v1/embed-tokens`로 발급한 단기 embed token을 조달한다.
 * BE 경로·envelope는 확정 전 PoC — 응답 shape는 flat/envelope 둘 다 허용.
 */
export async function fetchEmbedToken({ scope, slideId }: FetchEmbedTokenParams): Promise<string> {
  const qs = new URLSearchParams({ scope });
  if (slideId) qs.set('slideId', slideId);

  const auth = getAuth();
  const res = await auth.authorizedFetch(`/api/everyclass/embed-token?${qs}`);
  if (!res.ok) {
    throw new Error(`embed-token 발급 실패: ${res.status}`);
  }

  const json = (await res.json()) as EmbedTokenResponse;
  const token = json.token ?? json.resultData?.token;
  if (!token) {
    throw new Error('embed-token 응답에 token이 없습니다.');
  }
  return token;
}
