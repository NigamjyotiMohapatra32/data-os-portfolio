import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Dev proxy: /api/* → Express backend (eliminates CORS issues)
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'oxc',
    sourcemap: false,
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/.test(id)) {
            return 'vendor-react';
          }
          if (/[\\/]node_modules[\\/]three[\\/]/.test(id)) {
            return 'vendor-three';
          }
          if (/[\\/]node_modules[\\/](framer-motion|gsap)[\\/]/.test(id)) {
            return 'vendor-animation';
          }
          if (/[\\/]node_modules[\\/]firebase[\\/]/.test(id)) {
            return 'vendor-firebase';
          }
          if (/[\\/]node_modules[\\/]recharts[\\/]/.test(id)) {
            return 'vendor-charts';
          }
        },
      },
    },
  },
});
