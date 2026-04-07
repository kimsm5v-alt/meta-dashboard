import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// ============================================================
// 공통 응답 타입
// ============================================================

/** 백엔드 공통 응답 구조 */
export interface APIResponse<T> {
  success: boolean;
  resultCode: number;
  resultMessage: string;
  resultData: T;
  paramData?: Record<string, string>;
  currentTime?: string;
}

// ============================================================
// 에러 클래스
// ============================================================

export class ApiError extends Error {
  statusCode: number;
  resultCode?: number;
  errorDetail?: { name?: string; code?: string };
  constructor(statusCode: number, message: string, resultCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.resultCode = resultCode;
  }
  isDuplicateKeyError(): boolean {
    return (
      this.errorDetail?.name === 'DuplicateKeyException' || this.errorDetail?.code === 'E001'
    );
  }
}

// ============================================================
// Axios 인스턴스
// ============================================================

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8081';

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// 인증 불필요 엔드포인트 (토큰 전송 제외)
const PUBLIC_ENDPOINTS = [
  '/member/login',
  '/member/signup',
  '/member/send-code',
  '/member/verify-code',
  '/member/token/refresh',
  '/group/invite', // 초대 링크 접근 (비로그인 허용)
  '/group/join-guest', // 게스트 가입 (비로그인 허용)
];

// ============================================================
// Silent Refresh — 동시 요청 큐
// ============================================================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

const tryRefreshToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) throw new Error('NO_REFRESH_TOKEN');

  // axiosInstance를 거치지 않는 순수 axios 호출 (인터셉터 루프 방지)
  const res = await axios.post<APIResponse<{ accessToken: string; refreshToken?: string }>>(
    `${BASE_URL}/member/token/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  );

  const data = res.data.resultData;
  if (!data?.accessToken) throw new Error('REFRESH_FAILED');

  localStorage.setItem('auth_token', data.accessToken);
  if (data.refreshToken) {
    localStorage.setItem('refresh_token', data.refreshToken);
  }

  return data.accessToken;
};

// ============================================================
// 요청 인터셉터 — JWT 자동 주입
// ============================================================

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const isPublic = PUBLIC_ENDPOINTS.some((ep) => config.url?.includes(ep));
  if (!isPublic) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ============================================================
// 응답 인터셉터 — 에러 정규화 + Silent Refresh
// ============================================================

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data as APIResponse<unknown>;
    if (data && data.success === false) {
      const message = data.resultMessage ?? 'API Error';
      return Promise.reject(new ApiError(response.status, message, data.resultCode));
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status ?? 0;

    // 401이고 재시도 아직 안 한 경우 → refresh 시도
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // 이미 refresh 중이면 큐에 대기
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const newToken = await tryRefreshToken();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // refresh 실패 → 강제 로그아웃
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('meta_auth_user');
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(new ApiError(401, 'SESSION_EXPIRED'));
      } finally {
        isRefreshing = false;
      }
    }

    const message = error.response?.data?.resultMessage ?? error.message ?? 'API Error';
    const resultCode = error.response?.data?.resultCode;
    return Promise.reject(new ApiError(status, message, resultCode));
  },
);

// ============================================================
// API 클라이언트
// ============================================================

export const apiClient = {
  get: <T>(endpoint: string) =>
    axiosInstance.get<APIResponse<T>>(endpoint).then((res) => res.data),
  post: <T>(endpoint: string, body?: unknown) =>
    axiosInstance.post<APIResponse<T>>(endpoint, body).then((res) => res.data),
  put: <T>(endpoint: string, body?: unknown) =>
    axiosInstance.put<APIResponse<T>>(endpoint, body).then((res) => res.data),
  delete: <T>(endpoint: string) =>
    axiosInstance.delete<APIResponse<T>>(endpoint).then((res) => res.data),
};
