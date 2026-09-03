import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    assetsInclude: ['**/*.md'],
    server: {
      port: 3000,
      proxy: {
        // '/api'로 시작하는 요청을 감시
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
          // ✅ 디버깅을 위한 로그 추가: 터미널에서 확인 가능
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('❌ 프록시 에러:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('🚀 백엔드로 요청 보냄:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('✅ 백엔드로부터 응답 받음:', proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
  }
})