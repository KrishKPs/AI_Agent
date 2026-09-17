import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Dev: proxy /api to the FastAPI backend so the app can be opened straight
// from `npm run dev` without touching server.py's CORS.
// Build: emit into ../static, which server.py already mounts and serves.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
  build: {
    outDir: '../static',
    emptyOutDir: true,
  },
})
