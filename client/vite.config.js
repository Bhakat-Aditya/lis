import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/betterstack-api': {
        target: 'https://incidents.betterstack.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/betterstack-api/, ''),
        headers: {
          Authorization: 'Bearer yrbEUMHrbSqwpLYoX2Mjr5Wn',
        },
      },
    },
  },
})
