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

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8081',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// 요청 인터셉터 — JWT 자동 주입
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터 — 에러 정규화
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // HTTP 200이지만 success: false인 경우
    const data = response.data as APIResponse<unknown>;
    if (data && data.success === false) {
      const message = data.resultMessage ?? 'API Error';
      return Promise.reject(new ApiError(response.status, message, data.resultCode));
    }
    return response;
  },
  (error) => {
    const status = error.response?.status ?? 0;
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
