/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 비상교육 브랜드 컬러 스케일
        visang: {
          50: '#cffafe',
          100: '#a5f3fc',
          200: '#67e8f9',
          300: '#22d3ee',
          400: '#06b6d4',
          500: '#8b5cf6',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // META 검사 브랜드 컬러 스케일
        meta: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a78bfa',
          600: '#8b5cf6',
          700: '#7c3aed',
          800: '#6d28d9',
          900: '#5b21b6',
        },
        // Primary alias (META Purple)
        primary: {
          DEFAULT: '#6d28d9',
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
        },
        // Secondary alias (META Purple)
        secondary: {
          DEFAULT: '#8b5cf6',
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a78bfa',
          600: '#8b5cf6',
          700: '#7c3aed',
          800: '#6d28d9',
          900: '#5b21b6',
        },
        // Accent colors
        accent: {
          cyan: '#0891b2',
          purple: '#a78bfa',
        },
        // Functional colors
        success: {
          DEFAULT: '#10b981',
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981',
          700: '#059669',
        },
        warning: {
          DEFAULT: '#f59e0b',
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f59e0b',
          700: '#ea580c',
        },
        error: {
          DEFAULT: '#ef4444',
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          700: '#dc2626',
        },
        info: {
          DEFAULT: '#06b6d4',
          50: '#ecfeff',
          100: '#cffafe',
          500: '#06b6d4',
          700: '#0891b2',
        },
        // 유형 색상
        type: {
          warning: '#F97316',   // 자원소진형/무기력형
          balance: '#14B8A6',   // 안전균형형/정서조절취약형
          excellent: '#3B82F6', // 몰입자원풍부형/자기주도몰입형
        },
        // 요인 색상
        factor: {
          positive: '#3B82F6',
          negative: '#EF4444',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #8b5cf6 100%)',
        'cyan-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #0891b2 100%)',
        'purple-gradient': 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
        'sky-purple-gradient': 'linear-gradient(135deg, #06b6d4 0%, #a78bfa 100%)',
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
