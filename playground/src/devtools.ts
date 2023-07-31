import * as UI from '//chii/ui/legacy/legacy.js'

class Output extends UI.Widget.Widget {
  constructor() {
    super()
    const text = document.createElement('pre')
    text.innerText = 'no Output'
    window.onOutPutCodeChange((code: string) => {
      code && (this.contentElement.innerText = code)
    })
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
      const { sidebarWidgetInternal: { tabbedPane } } = chiiWidget
      tabbedPane.appendTab('output', 'Output', new Output())
    }
  }
  if (devtools.readyState === 'complete') {
    init()
  } else {
    devtools.addEventListener('load', init, true)
  }
})()
