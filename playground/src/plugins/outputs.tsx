import { defineDevtoolsPanel, definePlugins } from './index.tsx'
import { getFiles } from '../pages/eval-logs/files.ts'

const JSPanel = defineDevtoolsPanel('outputs.js', '.JS', (devtoolsWindow, UI) => class extends UI.Widget.Widget {
  constructor() {
    super()
    const text = document.createElement('pre')
    text.style.cursor = 'text'
    text.style.userSelect = 'text'
    text.style.whiteSpace = 'pre-wrap'
    text.style.margin = '0'
    text.style.padding = '0 4px'
    text.textContent = ''
    text.removeChildren = () => {
      text.textContent = ''
    }
    text.traverseNextNode = () => {
      return null
    }
    let highlightNodeRef: CodeHighlighter['highlightNode'] | undefined = undefined
    const [FILES, onFiles] = getFiles()
    function update(files = FILES) {
      text.textContent = files.map(({ name, originalText }) => `// @filename:${name}\n${originalText}`).join('\n\n')
      if (highlightNodeRef) {
        highlightNodeRef(text, 'text/javascript')
      }
    }
    update()
    onFiles(update)
    this.contentElement.appendChild(text)

    type CodeHighlighter = typeof import('//chii/ui/components/code_highlighter/CodeHighlighter.ts')
    devtoolsWindow.simport<CodeHighlighter>('ui/components/code_highlighter/CodeHighlighter.js')
      .then(({ highlightNode }) => {
        highlightNodeRef = highlightNode
        highlightNode(text, 'text/javascript')
      })
  }
})
// DTS
const DTSPanel = defineDevtoolsPanel('outputs.d.ts', '.DTS', 'react', ({ devtoolsWindow, UI }) => {
  return <>This is DTS panel</>
})
// Errors
// AST

export default definePlugins({
  devtools: {
    panels: [JSPanel, DTSPanel]
  }
})
