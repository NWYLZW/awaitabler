import { useMemo } from 'react'

import { ReactRender } from '../index.tsx'
import { useFiles } from '../../pages/eval-logs/files.ts'
import CodeHighlighter from './code-highlighter.tsx'

export default (function ({ UI, devtoolsWindow: { simport } }) {
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
}) as ReactRender
