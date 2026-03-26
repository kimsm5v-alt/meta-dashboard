import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || '';

          // Vite 내부 요청, 정적 파일, API 요청은 그대로 통과
          const isViteInternal = url.startsWith('/@') || url.startsWith('/__');
          const isStaticFile = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)(\?.*)?$/.test(url);
          const isApiRequest = url.startsWith('/api/') || url.startsWith('/group/') || url.startsWith('/member');

          // SPA 라우팅이 필요한 경우만 index.html로 리다이렉트
          if (!isViteInternal && !isStaticFile && !isApiRequest && !url.includes('.')) {
            req.url = '/index.html';
          }

          next();
        });
      },
    },
  ],
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
        target: 'https://t-meta-api.vsaidt.com',
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
        target: 'https://t-meta-api.vsaidt.com',
        changeOrigin: true,
        secure: false,
      },
      // 메모 API
      '/api/memos': {
        target: 'https://t-meta-api.vsaidt.com',
        changeOrigin: true,
        secure: false,
      },
      // 회원 API
      '/member': {
        target: 'https://t-meta-api.vsaidt.com',
        changeOrigin: true,
        secure: false,
      },
      // 그룹 API (정확히 /group으로 시작하는 것만 매칭)
      '^/group/': {
        target: 'https://t-meta-api.vsaidt.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
