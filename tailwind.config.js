/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 비바샘 브랜드 컬러
        primary: {
          50: '#EBF0FA',
          100: '#D6E0F5',
          200: '#ADC1EB',
          300: '#84A2E0',
          400: '#5B83D6',
          500: '#3351A4',  // 메인
          600: '#2A4490',
          700: '#21367A',
          800: '#182864',
          900: '#0F1A4E',
        },
        // 유형 색상
        type: {
          warning: '#F97316',   // 자원소진형/무기력형
          balance: '#14B8A6',   // 안전균형형/정서조절취약형
          excellent: '#3351A4', // 몰입자원풍부형/자기주도몰입형
        },
        // 요인 색상
        factor: {
          positive: '#3B82F6',
          negative: '#EF4444',
        },
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
