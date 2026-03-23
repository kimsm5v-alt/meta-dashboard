import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 모노레포 루트의 .env 파일 사용
  envDir: path.resolve(__dirname, '..'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@data': path.resolve(__dirname, './src/data'),
      '@services': path.resolve(__dirname, './src/services'),
    },
  },
  server: {
    open: true,
    proxy: {
      // DGNSS (심리검사) API
      '/api/dgnss': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('[Proxy Request]', req.method, req.url, '→', proxyReq.path);
            const authHeader = proxyReq.getHeader('Authorization');
            console.log('[Proxy Auth]', authHeader ? 'Bearer token present' : 'No auth header');
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('[Proxy Response]', req.url, '→', proxyRes.statusCode);
          });
          proxy.on('error', (err) => {
            console.error('[Proxy Error]', err.message);
          });
        },
      },
      // 상담 API
      '/api/counseling': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      // 메모 API
      '/api/memos': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      // 회원 API (로컬 백엔드 - DB 설정 필요)
      '/member': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      // 그룹 API
      '/group': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
