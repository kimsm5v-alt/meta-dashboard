/**
 * 통합 에러 핸들러
 *
 * API 에러 및 일반 에러를 일관된 방식으로 처리합니다.
 */

import { APIError } from '@/shared/services/apiClient';

// ============================================================
// 에러 타입 정의
// ============================================================

/** 에러 심각도 레벨 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/** 에러 카테고리 */
export type ErrorCategory =
  | 'network'      // 네트워크 연결 문제
  | 'auth'         // 인증/권한 문제
  | 'validation'   // 입력 데이터 유효성 문제
  | 'server'       // 서버 내부 오류
  | 'client'       // 클라이언트 오류
  | 'unknown';     // 알 수 없는 오류

/** 표준화된 에러 정보 */
export interface StandardizedError {
  message: string;
  userMessage: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  statusCode?: number;
  resultCode?: number;
  originalError: unknown;
  timestamp: Date;
  recoverable: boolean;
  retryable: boolean;
}

// ============================================================
// 에러 메시지 매핑
// ============================================================

/** HTTP 상태 코드별 사용자 메시지 */
const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: '잘못된 요청입니다. 입력 내용을 확인해 주세요.',
  401: '로그인이 필요합니다.',
  403: '접근 권한이 없습니다.',
  404: '요청한 정보를 찾을 수 없습니다.',
  408: '요청 시간이 초과되었습니다. 다시 시도해 주세요.',
  409: '데이터 충돌이 발생했습니다. 이미 등록된 정보일 수 있습니다.',
  422: '입력 내용이 올바르지 않습니다.',
  429: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  502: '서버 연결에 실패했습니다.',
  503: '서비스를 일시적으로 사용할 수 없습니다.',
  504: '서버 응답 시간이 초과되었습니다.',
};

/** 네트워크 에러 메시지 */
const NETWORK_ERROR_MESSAGES: Record<string, string> = {
  'Failed to fetch': '네트워크 연결을 확인해 주세요.',
  'NetworkError': '네트워크 오류가 발생했습니다.',
  'TypeError: Failed to fetch': '서버에 연결할 수 없습니다.',
};

// ============================================================
// 에러 분류 함수
// ============================================================

/**
 * HTTP 상태 코드로 에러 카테고리 결정
 */
function getCategoryByStatusCode(statusCode: number): ErrorCategory {
  if (statusCode === 401 || statusCode === 403) return 'auth';
  if (statusCode >= 400 && statusCode < 500) return 'client';
  if (statusCode >= 500) return 'server';
  return 'unknown';
}

/**
 * HTTP 상태 코드로 에러 심각도 결정
 */
function getSeverityByStatusCode(statusCode: number): ErrorSeverity {
  if (statusCode === 401) return 'warning';
  if (statusCode === 403) return 'error';
  if (statusCode >= 500) return 'critical';
  return 'error';
}

/**
 * 재시도 가능 여부 결정
 */
function isRetryable(statusCode?: number): boolean {
  if (!statusCode) return true; // 네트워크 에러는 재시도 가능
  // 5xx 에러와 타임아웃은 재시도 가능
  return statusCode >= 500 || statusCode === 408 || statusCode === 429;
}

/**
 * 복구 가능 여부 결정
 */
function isRecoverable(category: ErrorCategory): boolean {
  return category !== 'auth' && category !== 'validation';
}

// ============================================================
// 메인 에러 핸들러
// ============================================================

/**
 * 에러를 표준화된 형식으로 변환
 */
export function standardizeError(error: unknown): StandardizedError {
  const timestamp = new Date();

  // APIError 처리
  if (error instanceof APIError) {
    const category = getCategoryByStatusCode(error.statusCode || 500);
    const severity = getSeverityByStatusCode(error.statusCode || 500);
    const userMessage = error.statusCode
      ? HTTP_STATUS_MESSAGES[error.statusCode] || error.message
      : error.message;

    return {
      message: error.message,
      userMessage,
      category,
      severity,
      statusCode: error.statusCode,
      resultCode: error.resultCode,
      originalError: error,
      timestamp,
      recoverable: isRecoverable(category),
      retryable: isRetryable(error.statusCode),
    };
  }

  // 일반 Error 처리
  if (error instanceof Error) {
    // 네트워크 에러 확인
    const networkMessage = NETWORK_ERROR_MESSAGES[error.message];
    if (networkMessage || error.message.includes('fetch')) {
      return {
        message: error.message,
        userMessage: networkMessage || '네트워크 연결을 확인해 주세요.',
        category: 'network',
        severity: 'error',
        originalError: error,
        timestamp,
        recoverable: true,
        retryable: true,
      };
    }

    return {
      message: error.message,
      userMessage: '오류가 발생했습니다. 다시 시도해 주세요.',
      category: 'unknown',
      severity: 'error',
      originalError: error,
      timestamp,
      recoverable: true,
      retryable: true,
    };
  }

  // 알 수 없는 에러 처리
  return {
    message: String(error),
    userMessage: '알 수 없는 오류가 발생했습니다.',
    category: 'unknown',
    severity: 'error',
    originalError: error,
    timestamp,
    recoverable: true,
    retryable: true,
  };
}

/**
 * 에러 로깅 (개발 환경에서만 상세 로그)
 */
export function logError(error: StandardizedError, context?: string): void {
  const prefix = context ? `[${context}]` : '[Error]';

  if (import.meta.env.DEV) {
    console.error(prefix, {
      message: error.message,
      category: error.category,
      severity: error.severity,
      statusCode: error.statusCode,
      timestamp: error.timestamp,
      originalError: error.originalError,
    });
  } else {
    // 프로덕션에서는 간략한 로그만
    console.error(prefix, error.message);
  }
}

/**
 * 사용자에게 표시할 에러 메시지 반환
 */
export function getUserErrorMessage(error: unknown): string {
  const standardized = standardizeError(error);
  return standardized.userMessage;
}

/**
 * 에러 핸들링 헬퍼 (try-catch 래퍼)
 */
export async function handleAsync<T>(
  asyncFn: () => Promise<T>,
  context?: string
): Promise<{ data: T | null; error: StandardizedError | null }> {
  try {
    const data = await asyncFn();
    return { data, error: null };
  } catch (err) {
    const error = standardizeError(err);
    logError(error, context);
    return { data: null, error };
  }
}

/**
 * 인증 에러 여부 확인
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof APIError) {
    return error.statusCode === 401 || error.statusCode === 403;
  }
  return false;
}

/**
 * 네트워크 에러 여부 확인
 */
export function isNetworkError(error: unknown): boolean {
  const standardized = standardizeError(error);
  return standardized.category === 'network';
}
