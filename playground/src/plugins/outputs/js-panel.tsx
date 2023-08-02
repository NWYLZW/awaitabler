import { useEffect, useMemo, useRef, useState } from 'react'

import { ReactRender } from '../index.tsx'
import { useFiles } from '../../pages/eval-logs/files.ts'

type CodeHighlighter = typeof import('//chii/ui/components/code_highlighter/CodeHighlighter.ts')

export default (function ({ UI, devtoolsWindow: { simport } }) {
  const [highlightNodeRef, setHighlightNodeRef] = useState<
    CodeHighlighter['highlightNode'] | undefined
  >(undefined)
  simport<CodeHighlighter>('ui/components/code_highlighter/CodeHighlighter.js')
    .then(({ highlightNode }) => setHighlightNodeRef(() => highlightNode))

  const preEleRef = useRef<HTMLPreElement>(null)

  const files = useFiles()
  const textContent = useMemo(
    () => files.map(({ name, originalText }) => `// @filename:${name}\n${originalText}`).join('\n\n'),
    [files]
  )
  useEffect(() => {
    const preEle = preEleRef.current
    if (!preEle) return

    preEle.textContent = textContent
    highlightNodeRef?.(preEle, 'text/javascript')
  }, [textContent, highlightNodeRef])

  return <pre
    ref={preEleRef}
    style={{
      cursor: 'text',
      userSelect: 'text',
      whiteSpace: 'pre-wrap',
      margin: '0',
      padding: '0 4px'
    }}
  />
}) as ReactRender
