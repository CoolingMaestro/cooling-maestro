// Vite konfigürasyon dosyası
// React ve gerekli plugin ayarlarını içerir

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Çözümleme ayarları
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
    },
  },
  
  // Sunucu ayarları
  server: {
    port: 3000,
    open: true, // Tarayıcıyı otomatik aç
    host: true, // Ağdaki diğer cihazlardan erişime izin ver
    cors: true,
    proxy: {
      '/nominatim': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nominatim/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            // Set proper headers for Nominatim
            proxyReq.setHeader('User-Agent', 'CoolingMaestro/1.0 (Contact: your-email@example.com)');
            proxyReq.setHeader('Referer', 'http://localhost:3000');
          });
        },
      },
    },
  },
  
  // Build ayarları
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Chunk boyutu uyarısı limiti (kB)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Chunk'ları mantıklı şekilde böl
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
          'chart-vendor': ['echarts'],
          'swiper-vendor': ['swiper'],
        },
      },
    },
  },
  
  // CSS ayarları
  css: {
    postcss: './postcss.config.js',
  },
  
  // Ortam değişkenleri için prefix
  envPrefix: 'VITE_',
})