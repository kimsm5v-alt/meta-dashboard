import type { ReactNode } from 'react'
import { ThemeProvider } from './ThemeProvider'
import { QueryProvider } from './QueryProvider'

interface AppProvidersProps {
  children: ReactNode
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <QueryProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </QueryProvider>
  )
}

export { ThemeProvider } from './ThemeProvider'
export { QueryProvider } from './QueryProvider'
