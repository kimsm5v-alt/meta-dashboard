import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
      '/etc/meta': {
        target: 'https://t-vcloudapi.vsaidt.com',
        changeOrigin: true,
        secure: true,
        headers: {
          // 프록시 요청에 Origin 헤더 추가 (CORS 회피)
          'Origin': 'https://t-vcloudapi.vsaidt.com',
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('[Proxy Request]', req.method, req.url, '→', proxyReq.path);
            // 헤더 로깅
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
    },
  },
})
