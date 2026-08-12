/**
 * Emotion Theme Configuration
 * 라이트 모드 테마 — prototype 디자인 기준
 */

export const theme = {
  colors: {
    // Brand Colors
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#6d28d9',
      600: '#5b21b6',
      700: '#4c1d95',
      800: '#3b0f7a',
      900: '#2e0a63',
      1000: '#009f88',
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
      light: '#d1fae5',
      main: '#10b981',
      dark: '#059669',
    },
    warning: {
      light: '#fef3c7',
      main: '#f59e0b',
      dark: '#d97706',
    },
    error: {
      light: '#fee2e2',
      main: '#ef4444',
      dark: '#dc2626',
    },
    info: {
      light: '#e0f2fe',
      main: '#06b6d4',
      dark: '#0891b2',
    },

    // Student Type Colors (LPA 유형)
    type: {
      warning: '#E74C3C', // 자원소진형/무기력형 (빨강)
      balance: '#3498DB', // 안전 균형형 (파랑)
      caution: '#F39C12', // 정서조절 취약형 (주황)
      excellent: '#2ECC71', // 몰입자원 풍부형/자기주도 몰입형 (초록)
    },

    // Domain Colors (5대 영역)
    domain: {
      self: '#059669', // 자아강점 (초록)
      stepping: '#0284c7', // 학습디딤돌 (파랑)
      positive: '#4f46e5', // 긍정적공부마음 (인디고)
      obstacle: '#e11d48', // 학습걸림돌 (로즈)
      negative: '#c026d3', // 부정적공부마음 (퍼플)
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

    // Background — 라이트 모드
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
      elevated: '#f1f5f9',
    },

    // Text — 라이트 모드
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
      disabled: '#94a3b8',
    },

    // Glass Effect — 라이트 모드
    glass: {
      background: 'rgba(255, 255, 255, 0.8)',
      border: 'rgba(0, 0, 0, 0.08)',
      hover: 'rgba(0, 0, 0, 0.04)',
    },
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
    secondary: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
    background: 'linear-gradient(135deg, #f8fafc 0%, #ede9fe 100%)',
    glass: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
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

  // Shadows — 라이트 모드
  shadows: {
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    glass: '0 4px 24px 0 rgba(0, 0, 0, 0.08)',
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
} as const;

export type Theme = typeof theme;
