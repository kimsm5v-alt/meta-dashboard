/**
 * API 클라이언트 - 공통 HTTP 요청 처리
 *
 * 교사용/학생용 API 서비스에서 공통으로 사용하는 API 설정 및 요청 함수
 */

// ============================================================
// 환경 설정
// ============================================================

export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '',
  useApi: import.meta.env.VITE_USE_API === 'true',
  jwtToken: import.meta.env.VITE_JWT_TOKEN || '',
} as const;

// ============================================================
// 공통 타입
// ============================================================

/** API 응답 공통 구조 */
export interface APIResponse<T> {
  success: boolean;
  resultCode: number;
  resultMessage: string;
  resultData: T;
  paramData?: Record<string, string>;
  sTime?: string;
  eTime?: string;
  hash?: string;
  currentTime?: string;
}

/** API 에러 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public resultCode?: number
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// ============================================================
// API 요청 함수
// ============================================================

interface RequestOptions extends RequestInit {
  /** 디버그 로깅 활성화 (기본: false) */
  debug?: boolean;
}

/**
 * 공통 API 요청 함수
 * JWT 토큰 자동 추가, 에러 처리 포함
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<APIResponse<T>> {
  const { debug = false, ...fetchOptions } = options;
  const url = `${API_CONFIG.baseUrl}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // JWT 토큰 추가
  if (API_CONFIG.jwtToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${API_CONFIG.jwtToken}`;
  }

  if (debug) {
    console.log('[API Request]', {
      url,
      method: fetchOptions.method || 'GET',
      hasJWT: !!API_CONFIG.jwtToken,
    });
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    throw new APIError(
      `API 요청 실패: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  const data = await response.json();

  if (debug) {
    console.log('[API Response]', endpoint, data);
  }

  if (!data.success) {
    throw new APIError(
      data.resultMessage || 'API 요청 실패',
      response.status,
      data.resultCode
    );
  }

  return data;
}

// ============================================================
// 유틸리티
// ============================================================

/** Mock API 지연 시뮬레이션 */
export const mockDelay = (ms: number = 300): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/** API 모드 여부 확인 */
export const isApiMode = (): boolean => API_CONFIG.useApi;
