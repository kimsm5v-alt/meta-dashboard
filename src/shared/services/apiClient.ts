/**
 * API 클라이언트 - 공통 HTTP 요청 처리
 *
 * 교사용/학생용 API 서비스에서 공통으로 사용하는 API 설정 및 요청 함수
 */

// ============================================================
// 환경 설정
// ============================================================

const CREDENTIALS_STORAGE_KEY = 'meta_test_credentials';

/** 저장된 credentials에서 JWT 토큰 가져오기 */
function getStoredJwtToken(): string {
  try {
    const stored = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (stored) {
      const credentials = JSON.parse(stored);
      return credentials.jwtToken || '';
    }
  } catch {
    // ignore
  }
  return '';
}

export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '',
  /** JWT 토큰 (동적으로 localStorage에서 가져옴) */
  get jwtToken(): string {
    return getStoredJwtToken();
  },
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

/** API 에러 상세 정보 */
export interface APIErrorDetail {
  path?: string;
  code?: string;
  name?: string;
  message?: string;
}

/** API 에러 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public resultCode?: number,
    public errorDetail?: APIErrorDetail
  ) {
    super(message);
    this.name = 'APIError';
  }

  /** DuplicateKeyException 여부 확인 */
  isDuplicateKeyError(): boolean {
    return this.errorDetail?.name === 'DuplicateKeyException' ||
           this.errorDetail?.code === 'E001';
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

  // JWT 토큰 추가 (동적으로 가져옴)
  const jwtToken = API_CONFIG.jwtToken;
  if (jwtToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${jwtToken}`;
  }

  if (debug) {
    console.log('[API Request]', {
      url,
      method: fetchOptions.method || 'GET',
      hasJWT: !!jwtToken,
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
    // resultData에서 에러 상세 정보 추출
    const errorDetail: APIErrorDetail | undefined = data.resultData && typeof data.resultData === 'object'
      ? {
          path: data.resultData.path,
          code: data.resultData.code,
          name: data.resultData.name,
          message: data.resultData.message,
        }
      : undefined;

    throw new APIError(
      data.resultMessage || 'API 요청 실패',
      response.status,
      data.resultCode,
      errorDetail
    );
  }

  return data;
}

