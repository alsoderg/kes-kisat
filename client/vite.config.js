import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  base: '/',
  server: {
    // Dev: proxy API calls to the Express backend so cookies stay same-origin
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    // Built into server/public so the backend can serve it in production
    outDir: '../server/public',
    emptyOutDir: true,
  },
})
