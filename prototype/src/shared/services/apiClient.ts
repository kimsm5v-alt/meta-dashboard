/**
 * API 클라이언트 - 공통 HTTP 요청 처리
 *
 * 교사용/학생용 API 서비스에서 공통으로 사용하는 API 설정 및 요청 함수
 */

// ============================================================
// 환경 설정
// ============================================================

const CREDENTIALS_STORAGE_KEY = 'meta_test_credentials';
const AUTH_TOKEN_KEY = 'meta_auth_tokens';

/** 저장된 인증 토큰 타입 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** 저장된 JWT 토큰 가져오기 (실제 로그인 우선, 테스트 credentials fallback) */
function getStoredJwtToken(): string {
  try {
    // 1. 실제 로그인 토큰 확인
    const authTokens = localStorage.getItem(AUTH_TOKEN_KEY);
    if (authTokens) {
      const tokens: AuthTokens = JSON.parse(authTokens);
      if (tokens.accessToken) {
        return tokens.accessToken;
      }
    }
    // 2. 테스트 credentials fallback
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

/** 인증 토큰 저장 */
export function saveAuthTokens(tokens: AuthTokens): void {
  localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(tokens));
}

/** 인증 토큰 삭제 */
export function clearAuthTokens(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

/** 저장된 인증 토큰 가져오기 */
export function getAuthTokens(): AuthTokens | null {
  try {
    const stored = localStorage.getItem(AUTH_TOKEN_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return null;
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

// ============================================================
// 인증 API
// ============================================================

/** 로그인 응답 데이터 */
export interface LoginResponseData {
  userNo: number;
  email: string;
  nickname: string;
  gender: string;
  roleCode: string;
  tcId: string | null;
  stdtId: string | null;
  accessToken: string;
  refreshToken: string;
}

/** 토큰 갱신 응답 데이터 */
export interface RefreshTokenResponseData {
  accessToken: string;
  userNo: number;
}

/**
 * 로그인 API
 * @param email 이메일
 * @param password 비밀번호
 * @returns 로그인 응답 (사용자 정보 + 토큰)
 */
export async function loginApi(email: string, password: string): Promise<APIResponse<LoginResponseData>> {
  // baseUrl이 비어있으면 /member/login (프록시용), 있으면 전체 URL
  const url = API_CONFIG.baseUrl ? `${API_CONFIG.baseUrl}/member/login` : '/member/login';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new APIError(
      data.resultMessage || '로그인에 실패했습니다.',
      response.status,
      data.resultCode
    );
  }

  return data;
}

/**
 * 토큰 갱신 API
 * @param refreshToken 리프레시 토큰
 * @returns 새 액세스 토큰
 */
export async function refreshTokenApi(refreshToken: string): Promise<APIResponse<RefreshTokenResponseData>> {
  const url = API_CONFIG.baseUrl ? `${API_CONFIG.baseUrl}/member/token/refresh` : '/member/token/refresh';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new APIError(
      data.resultMessage || '토큰 갱신에 실패했습니다.',
      response.status,
      data.resultCode
    );
  }

  return data;
}

/**
 * 로그아웃 API
 * @param refreshToken 리프레시 토큰
 */
export async function logoutApi(refreshToken: string): Promise<void> {
  const url = API_CONFIG.baseUrl ? `${API_CONFIG.baseUrl}/member/logout` : '/member/logout';

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // 로그아웃 실패해도 로컬 토큰은 삭제
  }
}

// ============================================================
// 회원가입 API
// ============================================================

/** 회원가입 요청 데이터 */
export interface SignupRequestData {
  email: string;
  password: string;
  nickname: string;
  gender: 'M' | 'F';
}

/** 회원가입 응답 데이터 */
export interface SignupResponseData {
  userNo: number;
  email: string;
  nickname: string;
}

/**
 * 회원가입 API
 * 비밀번호 정책: 10~64자, 영문대/소/숫자/특수문자 중 2가지 이상
 */
export async function signupApi(data: SignupRequestData): Promise<APIResponse<SignupResponseData>> {
  const url = API_CONFIG.baseUrl ? `${API_CONFIG.baseUrl}/member/signup` : '/member/signup';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new APIError(
      result.resultMessage || '회원가입에 실패했습니다.',
      response.status,
      result.resultCode
    );
  }

  return result;
}

// ============================================================
// 이메일 인증 API
// ============================================================

/**
 * 이메일 인증코드 발송 API
 * @param email 인증할 이메일 주소
 * @returns 발송 결과 (5분 유효, 1분 재발송 제한)
 */
export async function sendVerificationCodeApi(email: string): Promise<APIResponse<null>> {
  const url = API_CONFIG.baseUrl ? `${API_CONFIG.baseUrl}/member/send-code` : '/member/send-code';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new APIError(
      result.resultMessage || '인증코드 발송에 실패했습니다.',
      response.status,
      result.resultCode
    );
  }

  return result;
}

/**
 * 이메일 인증코드 확인 API
 * @param email 이메일 주소
 * @param code 6자리 인증코드
 * @returns 인증 결과
 */
export async function verifyCodeApi(email: string, code: string): Promise<APIResponse<null>> {
  const url = API_CONFIG.baseUrl ? `${API_CONFIG.baseUrl}/member/verify-code` : '/member/verify-code';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, code }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new APIError(
      result.resultMessage || '인증코드 확인에 실패했습니다.',
      response.status,
      result.resultCode
    );
  }

  return result;
}

