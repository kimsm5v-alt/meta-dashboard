import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier/recommended';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // any 타입 금지
      '@typescript-eslint/no-explicit-any': 'error',

      // 미사용 변수: _ prefix는 허용
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // import type 강제 (verbatimModuleSyntax와 일치)
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // 빈 함수 허용 (이벤트 핸들러 stub 등)
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
  // Prettier는 마지막에 — 다른 포맷 규칙 오버라이드
  prettier,
]);
