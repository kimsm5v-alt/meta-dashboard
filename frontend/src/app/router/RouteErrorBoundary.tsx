import type { ReactNode } from 'react';
import { ErrorBoundary } from '@suspensive/react';
import { useLocation } from 'react-router-dom';
import { ErrorFallback } from '@app/providers/ErrorBoundaryProvider';

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

/** 경로가 바뀌면 실패한 화면의 ErrorBoundary를 자동으로 초기화한다. */
export const RouteErrorBoundary = ({ children }: RouteErrorBoundaryProps) => {
  const location = useLocation();

  return (
    <ErrorBoundary fallback={ErrorFallback} resetKeys={[location.pathname, location.search]}>
      {children}
    </ErrorBoundary>
  );
};
