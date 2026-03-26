import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { ThemeProvider } from './ThemeProvider';
import { QueryProvider } from './QueryProvider';
import { ErrorBoundaryProvider } from './ErrorBoundaryProvider';
import { AuthProvider } from '@features/auth/model/AuthContext';
import { DataProvider } from '@shared/contexts/DataContext';
import { ApiDevModeProvider } from '@shared/contexts/ApiDevModeContext';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <ErrorBoundaryProvider>
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>
            <DataProvider>
              <ApiDevModeProvider>{children}</ApiDevModeProvider>
            </DataProvider>
          </AuthProvider>
          <Toaster
            position='top-center'
            toastOptions={{
              style: {
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 500,
              },
            }}
          />
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundaryProvider>
  );
};

export { ThemeProvider } from './ThemeProvider';
export { QueryProvider } from './QueryProvider';
