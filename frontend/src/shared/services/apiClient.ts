/**
 * 하위 호환 re-export
 * shared/api/client.ts로 통합됨. 기존 import 경로 유지용.
 */
export type { APIResponse } from '@shared/api/client';
export { ApiError as APIError, apiClient, axiosInstance } from '@shared/api/client';

import { axiosInstance } from '@shared/api/client';
import type { APIResponse } from '@shared/api/client';

// ============================================================
// 하위 호환: API_CONFIG
// ============================================================

export const API_CONFIG = {
  get baseUrl(): string {
    return (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8081';
  },
  get jwtToken(): string {
    return localStorage.getItem('auth_token') ?? '';
  },
} as const;

// ============================================================
// 하위 호환: apiRequest (fetch 스타일 옵션 → axios)
// ============================================================

interface LegacyRequestOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
  debug?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: LegacyRequestOptions = {},
): Promise<APIResponse<T>> {
  const { method = 'GET', body, debug = false } = options;

  if (debug) {
    console.log('[API Request]', { endpoint, method });
  }

  const response = await axiosInstance.request<APIResponse<T>>({
    url: endpoint,
    method,
    data: body ? (JSON.parse(body) as unknown) : undefined,
  });

  if (debug) {
    console.log('[API Response]', endpoint, response.data);
  }

  return response.data;
}
