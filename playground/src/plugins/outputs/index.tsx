import { useMemo } from 'react'

import { defineDevtoolsPanel, definePlugins } from '../index.tsx'
import { useFiles } from '../../pages/eval-logs/files.ts'
import CodeHighlighter from './code-highlighter.tsx'

const JSPanel = defineDevtoolsPanel('outputs.js', '.JS', 'react', ({ UI, devtoolsWindow: { simport } }) => {
  const files = useFiles()
  return <CodeHighlighter
    code={useMemo(
      () => files
        .filter(({ name }) => name.endsWith('.js'))
        .map(({ name, text, originalText }) => `// @filename:${name}\n${
          originalText.startsWith('// @devtools.output.compiled\r\n')
            ? text
            : originalText
        }`)
        .join('\n\n'),
      [files]
    )}
    lang='javascript'
    devtoolsWindow={{ simport }}
  />
})
const DTSPanel = defineDevtoolsPanel('outputs.d.ts', '.D.TS', 'react', ({ UI, devtoolsWindow: { simport } }) => {
  const files = useFiles()
  return <CodeHighlighter
    code={useMemo(
      () => files
        .filter(({ name }) => name.endsWith('.d.ts'))
        .map(({ name, text }) => `// @filename:${name}\n${text}`)
        .join('\n\n'),
      [files]
    )}
    lang='typescript'
    devtoolsWindow={{ simport }}
  />
})
// Errors
// AST

export default definePlugins({
  devtools: {
    panels: [JSPanel, DTSPanel]
  }
})
