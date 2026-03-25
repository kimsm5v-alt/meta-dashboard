import type { ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { QueryProvider } from './QueryProvider';
import { AuthProvider } from '@features/auth/model/AuthContext';
import { DataProvider } from '@shared/contexts/DataContext';
import { ApiDevModeProvider } from '@shared/contexts/ApiDevModeContext';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <ApiDevModeProvider>{children}</ApiDevModeProvider>
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
};

export { ThemeProvider } from './ThemeProvider';
export { QueryProvider } from './QueryProvider';
