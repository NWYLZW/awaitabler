import type * as UI from '//chii/ui/legacy/legacy.js'
import type * as ThemeSupport from '//chii/ui/legacy/theme_support/theme_support.js'

import { getFiles } from './files.ts'

localStorage.setItem('panel-selectedTab', JSON.stringify('console'))
localStorage.setItem(
  "viewsLocationOverride",
  JSON.stringify({ resources: "none", elements: "none", network: "none", sources: "none" }),
)
localStorage.setItem("consoleShowSettingsToolbar", JSON.stringify(false))

localStorage.setItem('textEditorIndent', JSON.stringify('  '))

const devtools = document.querySelector('iframe')!
const devtoolsWindow = devtools.contentWindow! as Window & {
  importUI: () => Promise<typeof UI>
  importThemeSupport: () => Promise<typeof ThemeSupport>
}
const devtoolsDocument = devtools.contentDocument!

let inited = false
async function init() {
  const realThemeSupport = await devtoolsWindow.importThemeSupport()
  if (!realThemeSupport.ThemeSupport.hasInstance())
    return

  const realUI = await devtoolsWindow.importUI()
  const chiiSidebar = realUI.InspectorView.InspectorView.instance()
  if (chiiSidebar && !inited) {
    inited = true

    const tabbedPane = chiiSidebar?.tabbedPane
    tabbedPane.appendTab('.js', '.JS', new class JSOutput extends realUI.Widget.Widget {
      constructor() {
        super()
        const text = document.createElement('pre')
        text.style.cursor = 'text'
        text.style.userSelect = 'text'
        text.style.whiteSpace = 'pre-wrap'
        text.style.margin = '0'
        text.innerText = ''
        const [FILES, onFiles] = getFiles()
        function update(files = FILES) {
          text.innerText = files.map(({ name, originalText }) => `// @filename:${name}\n${originalText}`).join('\n\n')
        }
        update()
        onFiles(update)
        this.contentElement.appendChild(text)
      }
    }())
  }
}
if (devtoolsDocument.readyState === 'complete') {
  await init()
} else {
  devtoolsDocument.addEventListener('load', init, true)
}
