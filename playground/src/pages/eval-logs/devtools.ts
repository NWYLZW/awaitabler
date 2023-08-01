import type * as UI from '//chii/ui/legacy/legacy.js'

import { getFiles } from './files.ts'

localStorage.setItem('panel-selectedTab', JSON.stringify('console'))
localStorage.setItem(
  "viewsLocationOverride",
  JSON.stringify({ resources: "none", elements: "none", network: "none", sources: "none" }),
)
localStorage.setItem("consoleShowSettingsToolbar", JSON.stringify(false))

localStorage.setItem('textEditorIndent', JSON.stringify('  '))

const devtools = document.querySelector('iframe')!
type importMap = {
  'ui/legacy/legacy.js': typeof import('//chii/ui/legacy/legacy.js')
  'ui/legacy/theme_support/theme_support.js': typeof import('//chii/ui/legacy/theme_support/theme_support.js')
}
const devtoolsWindow = devtools.contentWindow! as Window & {
  simport: <const T>(path: T) => Promise<
    T extends keyof importMap
      ? importMap[T]
      : T
  >
}
const devtoolsDocument = devtools.contentDocument!

let inited = false
async function checkInspectorViewIsLoaded() {
  const realThemeSupport = await devtoolsWindow.simport('ui/legacy/theme_support/theme_support.js')
  if (!realThemeSupport.ThemeSupport.hasInstance())
    return

  const realUI = await devtoolsWindow.simport('ui/legacy/legacy.js')
  const inspectorView = realUI.InspectorView.InspectorView.instance()
  if (inspectorView && !inited) {
    inited = true
    init(realUI, inspectorView)
  }
}
if (devtoolsDocument.readyState === 'complete') {
  await checkInspectorViewIsLoaded()
} else {
  devtoolsDocument.addEventListener('load', checkInspectorViewIsLoaded, true)
}

function init(realUI: typeof UI, inspectorView: UI.InspectorView.InspectorView) {
  const tabbedPane = inspectorView?.tabbedPane
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
