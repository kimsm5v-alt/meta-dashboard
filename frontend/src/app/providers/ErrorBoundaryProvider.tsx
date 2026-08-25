import type { ReactNode } from 'react';
import { ErrorBoundary } from '@suspensive/react';
import type { ErrorBoundaryFallbackProps } from '@suspensive/react';
import styled from '@emotion/styled';
import { ApiError } from '@shared/api/client';

const FullPage = styled.main`
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 1.5rem;
  background: #f8fafc;
`;

const Card = styled.section`
  width: min(100%, 30rem);
  padding: 2rem;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08);
  text-align: center;
`;

const Icon = styled.div`
  margin-bottom: 1rem;
  font-size: 2.5rem;
`;

const Title = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 1.25rem;
`;

const Description = styled.p`
  margin: 0.5rem 0 1.5rem;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.6;
  word-break: keep-all;
`;

const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
`;

const Button = styled.button<{ $primary?: boolean }>`
  min-height: 2.5rem;
  padding: 0 1rem;
  border: ${({ $primary }) => ($primary ? '1px solid transparent' : '1px solid #d1d5db')};
  border-radius: 0.5rem;
  background: ${({ $primary }) => ($primary ? '#7c3aed' : '#fff')};
  color: ${({ $primary }) => ($primary ? '#fff' : '#374151')};
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
`;

const ErrorDetail = styled.details`
  margin-top: 1rem;
  color: #6b7280;
  font-size: 0.75rem;
  text-align: left;

  pre {
    max-height: 12rem;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
`;

export const ErrorFallback = ({ error, reset }: ErrorBoundaryFallbackProps) => {
  const isApiError = error instanceof ApiError;
  const isAuthorizationError = isApiError && (error.statusCode === 401 || error.statusCode === 403);
  const isServerError = isApiError && error.statusCode >= 500;
  const title = isAuthorizationError
    ? '접근 권한이 없습니다'
    : isServerError
      ? '서버 오류가 발생했습니다'
      : '잠시 문제가 생겼어요';
  const description = isAuthorizationError
    ? '로그인 정보 또는 이용 권한을 확인해 주세요.'
    : isServerError
      ? '잠시 후 다시 시도해 주세요.'
      : '작업 중이던 화면에서 문제가 발생했어요.';

  return (
    <FullPage>
      <Card aria-labelledby='app-error-title'>
        <Icon aria-hidden='true'>{isServerError ? '🔧' : '⚠️'}</Icon>
        <Title id='app-error-title'>{title}</Title>
        <Description>{description}</Description>
        <Actions>
          <Button type='button' $primary onClick={reset}>
            다시 시도
          </Button>
          <Button type='button' onClick={() => window.location.assign('/home')}>
            홈으로 이동
          </Button>
        </Actions>
        {import.meta.env.DEV && error.stack && (
          <ErrorDetail>
            <summary>개발용 오류 정보</summary>
            <pre>{error.stack}</pre>
          </ErrorDetail>
        )}
      </Card>
    </FullPage>
  );
};

interface ErrorBoundaryProviderProps {
  children: ReactNode;
}

/** Provider·인증 등 앱 최상단 렌더 오류를 복구한다. */
export const ErrorBoundaryProvider = ({ children }: ErrorBoundaryProviderProps) => (
  <ErrorBoundary
    fallback={ErrorFallback}
    onError={(error, info) => {
      console.error('[AppErrorBoundary]', error, info.componentStack);
    }}
  >
    {children}
  </ErrorBoundary>
);
