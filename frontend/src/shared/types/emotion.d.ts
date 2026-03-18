import '@emotion/react'
import type { Theme as AppTheme } from '@app/styles/theme'

declare module '@emotion/react' {
  export interface Theme extends AppTheme {}
}
