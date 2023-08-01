import * as UI from '//chii/ui/legacy/legacy.js'

import { getFiles } from './files.ts'

class JSOutput extends UI.Widget.Widget {
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
}

initChii: (async () => {
  localStorage.setItem('panel-selectedTab', JSON.stringify('console'))
  localStorage.setItem(
    "viewsLocationOverride",
    JSON.stringify({ resources: "none", elements: "none", network: "none", sources: "none" }),
  )
  localStorage.setItem("consoleShowSettingsToolbar", JSON.stringify(false))

  localStorage.setItem('textEditorIndent', JSON.stringify('  '))

  const devtools = document.querySelector('iframe')!.contentDocument!

  function init() {
    // @ts-ignore
    const chiiWidget = devtools.querySelector('.vbox.flex-auto.split-widget')?.__widget
    if (chiiWidget) {
      const tabbedPane = chiiWidget.sidebarWidgetInternal.tabbedPane
      tabbedPane.appendTab('.js', '.JS', new JSOutput())
    }
  }
  if (devtools.readyState === 'complete') {
    init()
  } else {
    devtools.addEventListener('load', init, true)
  }
})()
