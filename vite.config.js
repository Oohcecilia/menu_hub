import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  logLevel: 'error',
  plugins: [react()],
  build: {
    sourcemap: true,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // ✅ ADD THIS (IMPORTANT)
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:7777',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  ssr: {
    noExternal: [],
  },
})