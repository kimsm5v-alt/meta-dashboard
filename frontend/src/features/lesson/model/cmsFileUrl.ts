import { ENV } from '@shared/config/env';

/** CMS 상대 경로를 파일 서버 URL로 붙인다. 이미 http(s)면 그대로. */
export function resolveCmsFileUrl(path?: string | null): string | undefined {
  const raw = path?.trim();
  if (!raw) return undefined;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  const base = ENV.CMS_FILE_URL;
  if (!base) return raw;
  return raw.startsWith('/') ? `${base}${raw}` : `${base}/${raw}`;
}
