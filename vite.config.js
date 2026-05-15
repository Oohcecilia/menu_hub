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
        target: 'https://pp.d3.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  ssr: {
    noExternal: [],
  },
})
