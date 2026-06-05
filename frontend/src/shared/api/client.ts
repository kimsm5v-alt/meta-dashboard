import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getAuth } from '@shared/lib/authClient';
import { ENV } from '@shared/config/env';
import { createClientCallId, buildQchRequestHeaders, logApiEvent } from '@shared/logging/qchLogger';

// Axios config에 QCH 메타 추가 (인터셉터 간 공유)
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _qch?: { clientCallId: string; startedAt: number };
  }
}

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
    return this.errorDetail?.name === 'DuplicateKeyException' || this.errorDetail?.code === 'E001';
  }
}

// ============================================================
// Axios 인스턴스
// ============================================================

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: ENV.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true,
});

// 인증 불필요 엔드포인트 (토큰 전송 제외)
const PUBLIC_ENDPOINTS = [
  '/api/v1/auth/',          // SSO 프록시
  '/guest/exists',
  '/guest/auth',
  '/member/send-code',      // 게스트 이메일 인증 (유지)
  '/member/verify-code',    // 게스트 이메일 인증 (유지)
  '/group/join-guest',
];

// 정확한 경로 매칭이 필요한 엔드포인트 (includes 대신 정확 비교)
const PUBLIC_EXACT_ENDPOINTS = [
  '/group/invite',          // 초대 링크 조회 (비로그인 허용) — /group/invite/list 등은 인증 필요
];

// ============================================================
// 요청 인터셉터 — SDK에서 AT 가져와서 주입
// ============================================================

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // FormData는 브라우저가 boundary 포함한 Content-Type을 자동 설정해야 함
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const url = config.url ?? '';
  const isPublic =
    PUBLIC_ENDPOINTS.some((ep) => url.includes(ep)) ||
    PUBLIC_EXACT_ENDPOINTS.some((ep) => url === ep || url.startsWith(ep + '?'));
  if (!isPublic) {
    try {
      const auth = getAuth();
      const token = auth.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // SDK 미초기화 시 토큰 없이 진행
    }
  }

  // QCH: clientCallId 생성 + 시작 시각 기록 + backend 헤더 주입
  const clientCallId = createClientCallId();
  config._qch = { clientCallId, startedAt: performance.now() };
  const qchHeaders = buildQchRequestHeaders(clientCallId);
  Object.assign(config.headers, qchHeaders);

  return config;
});

// ============================================================
// 응답 인터셉터 — 에러 정규화 + SDK refresh
// ============================================================

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data as APIResponse<unknown>;

    // QCH 성공 로그
    const qch = response.config._qch;
    if (qch) {
      const method = (response.config.method ?? 'GET').toUpperCase();
      const endpoint = response.config.url ?? '';
      const durationMs = Math.round(performance.now() - qch.startedAt);
      logApiEvent({
        component: endpoint,
        logType: 'INFO',
        code: 'I_API_CALL_OK',
        message: `${method} ${endpoint} success`,
        clientCallId: qch.clientCallId,
        raw: { method, endpoint, statusCode: response.status, durationMs },
      });
    }

    if (data && data.success === false) {
      const message = data.resultMessage ?? 'API Error';
      return Promise.reject(new ApiError(response.status, message, data.resultCode));
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status ?? 0;

    // 401이고 재시도 아직 안 한 경우 → SDK refresh 시도
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const auth = getAuth();
        const newToken = await auth.refreshAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        }
      } catch {
        // refresh 실패 → SDK가 자동으로 clearTokens + 로그아웃 처리
      }
    }

    // QCH 실패 로그
    const qch = originalRequest._qch;
    if (qch) {
      const method = (originalRequest.method ?? 'GET').toUpperCase();
      const endpoint = originalRequest.url ?? '';
      const durationMs = Math.round(performance.now() - qch.startedAt);
      const isNetworkError = !error.response;
      logApiEvent({
        component: endpoint,
        logType: 'ERROR',
        code: isNetworkError ? 'E_API_NETWORK' : 'E_API_CALL_FAIL',
        message: isNetworkError
          ? `${method} ${endpoint} network error`
          : `${method} ${endpoint} failed: ${status}`,
        clientCallId: qch.clientCallId,
        raw: {
          method,
          endpoint,
          statusCode: status,
          durationMs,
          errorMessage: (error as Error)?.message,
        },
      });
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
  get: <T>(endpoint: string) => axiosInstance.get<APIResponse<T>>(endpoint).then((res) => res.data),
  post: <T>(endpoint: string, body?: unknown) =>
    axiosInstance.post<APIResponse<T>>(endpoint, body).then((res) => res.data),
  put: <T>(endpoint: string, body?: unknown) =>
    axiosInstance.put<APIResponse<T>>(endpoint, body).then((res) => res.data),
  patch: <T>(endpoint: string, body?: unknown) =>
    axiosInstance.patch<APIResponse<T>>(endpoint, body).then((res) => res.data),
  delete: <T>(endpoint: string) =>
    axiosInstance.delete<APIResponse<T>>(endpoint).then((res) => res.data),
};
