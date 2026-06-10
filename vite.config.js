import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BASE_PATH env var lets different hosts use the right sub-path:
//   Netlify / custom domain  →  BASE_PATH=/   (default)
//   GitHub Pages             →  BASE_PATH=/data-os-portfolio/
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
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
    cssCodeSplit: true,
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/.test(id)) {
            return 'vendor-react';
          }
          if (/[\\/]node_modules[\\/]framer-motion[\\/]/.test(id)) {
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
