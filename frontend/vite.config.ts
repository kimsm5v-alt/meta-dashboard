import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://t-meta-api.vsaidt.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://t-meta-api.vsaidt.com');
          });
        },
      },
    },
  },
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@widgets': path.resolve(__dirname, 'src/widgets'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@entities': path.resolve(__dirname, 'src/entities'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 정적 데이터 파일 — 별도 청크로 분리 (번들 크기 감소)
          if (id.includes('shared/data/aiPrompts')) return 'data-ai-prompts';
          if (id.includes('shared/data/schoolRecordSentences')) return 'data-school-record';
          if (id.includes('shared/data/knowledgeGraph')) return 'data-knowledge-graph';
          if (id.includes('shared/data/lpaProfiles')) return 'data-lpa-profiles';
          // 주요 라이브러리 청크 분리
          if (id.includes('node_modules/recharts')) return 'vendor-recharts';
          if (id.includes('node_modules/@emotion')) return 'vendor-emotion';
          if (id.includes('node_modules/react-router')) return 'vendor-router';
        },
      },
    },
  },
});
