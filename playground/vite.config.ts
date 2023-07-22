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
  const MONACO_DTS_FILES: { content: string, filePath: string }[] = []

  function importDTSFiles(module: string, targetPath: string) {
    function addDtsFileContent(filePath: string) {
      const content = fs.readFileSync(filePath, 'utf-8')
      MONACO_DTS_FILES.push({
        content,
        filePath: filePath.replace(targetPath, `file:///node_modules/@types/${module}`)
      })
    }
    findFilesBy(targetPath, ['.ts', '.d.ts'], addDtsFileContent)
  }

  importDTSFiles('awaitabler', path.join(__dirname, '../node_modules', 'awaitabler', 'dist'))
  return {
    MONACO_DTS_FILES: JSON.stringify(MONACO_DTS_FILES)
  }
}

const { MONACO_DTS_FILES } = commonInjectOptionsData()

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
    MONACO_DTS_FILES
  }
})
