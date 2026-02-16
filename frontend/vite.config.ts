import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Для GitHub Pages нужно указать имя репозитория
// Если используете кастомный домен или другой хостинг, установите base: '/'
const repoName = process.env.VITE_REPO_NAME || 'tracker'

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? `/${repoName}/` : '/',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
    },
  },
})
