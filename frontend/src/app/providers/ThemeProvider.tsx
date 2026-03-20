import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import type { ReactNode } from 'react';
import { theme, GlobalStyles } from '@app/styles';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  return (
    <EmotionThemeProvider theme={theme}>
      <GlobalStyles theme={theme} />
      {children}
    </EmotionThemeProvider>
  );
};
