import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // Usando el plugin oficial y actual

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})