import { ErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import type { ReactNode } from 'react';
import { ApiError } from '@shared/api/client';

// ============================================================
// 에러 폴백 UI
// ============================================================

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  const err = error instanceof Error ? error : new Error(String(error));
  const isApiError = err instanceof ApiError;
  const is401 = isApiError && err.statusCode === 401;
  const is403 = isApiError && err.statusCode === 403;
  const is5xx = isApiError && err.statusCode >= 500;

  const title = is401 || is403
    ? '접근 권한이 없습니다'
    : is5xx
      ? '서버 오류가 발생했습니다'
      : '오류가 발생했습니다';

  const description = is401 || is403
    ? '로그인 정보를 확인해주세요.'
    : is5xx
      ? '잠시 후 다시 시도해주세요.'
      : err.message || '알 수 없는 오류입니다.';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '24px',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          {is5xx ? '🔧' : '⚠️'}
        </div>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '8px',
          }}
        >
          {title}
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
          {description}
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            onClick={resetErrorBoundary}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              background: '#8b5cf6',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
          <button
            onClick={() => {
              window.location.href = '/';
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              background: 'white',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Provider
// ============================================================

interface ErrorBoundaryProviderProps {
  children: ReactNode;
}

export const ErrorBoundaryProvider = ({ children }: ErrorBoundaryProviderProps) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        // TODO: 에러 로깅 서비스 연동 (Sentry 등)
        console.error('[ErrorBoundary]', error, info.componentStack);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
