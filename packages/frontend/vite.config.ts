import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // API requests to the backend (used in local dev and Discord dev mode)
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Socket.IO connection
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
