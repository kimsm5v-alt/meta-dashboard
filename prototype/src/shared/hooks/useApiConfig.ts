/**
 * API 설정 상태 훅
 *
 * API 설정 정보를 조회합니다.
 */

import { API_CONFIG } from '@/shared/services/apiClient';

export interface UseApiConfigResult {
  hasJwtToken: boolean;
  baseUrl: string;
}

/**
 * API 설정 상태 조회
 */
export function useApiConfig(): UseApiConfigResult {
  return {
    hasJwtToken: !!API_CONFIG.jwtToken,
    baseUrl: API_CONFIG.baseUrl,
  };
}
