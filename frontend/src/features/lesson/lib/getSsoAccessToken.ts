import { getAuth } from '@shared/lib/authClient';

/**
 * SlideEditor CBS 완성형 콘텐츠 조회용 v-school SSO AT.
 * embed token(`getToken`)과 별개 — Viewer에는 전달하지 않는다.
 */
export async function getSsoAccessToken(): Promise<string> {
  const auth = getAuth();
  let token = auth.getAccessToken();
  if (!token) {
    token = await auth.refreshAccessToken();
  }
  if (!token) {
    throw new Error('SSO 토큰을 가져올 수 없습니다.');
  }
  return token;
}
