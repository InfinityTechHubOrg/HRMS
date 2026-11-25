import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages project site: https://infinitytechhuborg.github.io/HRMS/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/HRMS/' : '/',
  plugins: [react(), tailwindcss()],
}))
