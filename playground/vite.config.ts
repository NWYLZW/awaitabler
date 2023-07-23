import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'

function findFilesBy(
  dirPath: string,
  extensions: string[],
  callback?: (filePath: string) => void
) {
  const files = fs.readdirSync(dirPath)
  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const stats = fs.statSync(filePath)
    if (stats.isDirectory()) {
      findFilesBy(filePath, extensions, callback)
    } else if (stats.isFile() && extensions?.some(ext => filePath.endsWith(ext))) {
      callback?.(filePath)
    }
  }
}

function commonInjectOptionsData() {
  const EXTRA_MODULES: { content: string, filePath: string }[] = []

  function importTSFiles(module: string, targetPath: string) {
    function addDtsFileContent(filePath: string) {
      const content = fs.readFileSync(filePath, 'utf-8')
      EXTRA_MODULES.push({
        content,
        filePath: filePath.replace(targetPath, `file:///node_modules/${module}`)
      })
    }
    findFilesBy(targetPath, ['.ts', '.d.ts'], addDtsFileContent)
  }

  importTSFiles('awaitabler', path.join(__dirname, '../node_modules', 'awaitabler'))
  return {
    EXTRA_MODULES: JSON.stringify(EXTRA_MODULES)
  }
}

const { EXTRA_MODULES } = commonInjectOptionsData()

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
  },
  define: {
    MODE: '"esm"',
    EXTRA_MODULES: EXTRA_MODULES
  }
})
