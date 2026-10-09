import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // /api/products -> http://localhost:3000/api/products (la API tiene el prefijo /api). Mismo origen
      // que el front: las cookies de sesión funcionan sin CORS ni SameSite=None.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
