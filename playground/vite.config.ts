import path from 'node:path'
import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'
import { viteExternalsPlugin } from 'vite-plugin-externals'

import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig(env => ({
  base: '/awaitabler/',
  plugins: [
    react(),
    env.mode === 'production' ? viteExternalsPlugin({
      '@babel/standalone': 'Babel',
      'react': 'React',
      'react-dom': 'ReactDOM',
    }) : null
  ],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        'eval-logs': path.resolve(__dirname, 'eval-logs.html')
      },
      plugins: [visualizer()]
    }
  },
  define: {
    MODE: '"esm"'
  }
}))
