import path from 'node:path'
import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/awaitabler/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        'eval-logs': path.resolve(__dirname, 'eval-logs.html')
      }
    }
  }
})
