/**
 * Emotion Theme Configuration
 * Glass-morphism 기반 프리미엄 다크 모드 테마
 */

export const theme = {
  colors: {
    // Brand Colors
    primary: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
    secondary: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
    },

    // Semantic Colors
    success: {
      light: '#4ade80',
      main: '#22c55e',
      dark: '#16a34a',
    },
    warning: {
      light: '#fbbf24',
      main: '#f59e0b',
      dark: '#d97706',
    },
    error: {
      light: '#f87171',
      main: '#ef4444',
      dark: '#dc2626',
    },
    info: {
      light: '#38bdf8',
      main: '#0ea5e9',
      dark: '#0284c7',
    },

    // Student Type Colors (LPA 유형)
    type: {
      warning: '#F97316', // 자원소진형/무기력형 (주황)
      balance: '#14B8A6', // 안전균형형/정서조절취약형 (틸)
      excellent: '#3B82F6', // 몰입자원풍부형/자기주도몰입형 (파랑)
    },

    // Domain Colors (5대 영역)
    domain: {
      self: '#00D282', // 자아강점 (초록)
      stepping: '#4BC1FF', // 학습디딤돌 (하늘)
      positive: '#67A7FF', // 긍정적공부마음 (파랑)
      obstacle: '#FF849F', // 학습걸림돌 (분홍)
      negative: '#FF87D4', // 부정적공부마음 (분홍)
    },

    // Grayscale
    gray: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },

    // Background
    background: {
      default: '#0f172a',
      paper: '#1e293b',
      elevated: '#334155',
    },

    // Text
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
      disabled: '#64748b',
    },

    // Glass Effect
    glass: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.1)',
      hover: 'rgba(255, 255, 255, 0.08)',
    },
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)',
    secondary: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
    glass: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  },

  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  // Border Radius
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  },

  // Typography
  typography: {
    fontFamily: {
      sans: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace",
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Transitions
  transitions: {
    fast: '150ms ease',
    normal: '300ms ease',
    slow: '500ms ease',
  },

  // Z-Index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const

export type Theme = typeof theme
