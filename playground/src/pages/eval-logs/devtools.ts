import type * as UI from '//chii/ui/legacy/legacy.js'

import { elBridgeC } from './bridge.ts'

const storageInited = localStorage.getItem('storageInited')
if (!storageInited) {
  localStorage.setItem('storageInited', JSON.stringify(true))

  localStorage.setItem('textEditorIndent', JSON.stringify('  '))
}
localStorage.setItem('consoleShowSettingsToolbar', JSON.stringify(false))
localStorage.setItem(
  'viewsLocationOverride',
  JSON.stringify({ resources: 'none', elements: 'none', network: 'none', sources: 'none' }),
)
localStorage.setItem('panel-selectedTab', JSON.stringify('console'))

type ImportMap = {
  'ui/legacy/legacy.js': typeof import('//chii/ui/legacy/legacy.js')
  'core/common/common.js': typeof import('//chii/core/common/common.js')
  'ui/legacy/theme_support/theme_support.js': typeof import('//chii/ui/legacy/theme_support/theme_support.js')
}

export type DevtoolsWindow = Window & {
  simport: <R = never, const T extends keyof ImportMap | (string & {}) = string>(path: T) => Promise<
    [R] extends [never]
      ? T extends keyof ImportMap ? ImportMap[T] : unknown
      : R
  >
}

const devtools = document.querySelector('iframe')!
const devtoolsWindow = devtools.contentWindow as DevtoolsWindow
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
    await init(realUI, inspectorView)
  }
}
;(async () => {
  if (devtoolsDocument.readyState === 'complete') {
    await checkInspectorViewIsLoaded()
  } else {
    devtoolsDocument.addEventListener('load', checkInspectorViewIsLoaded, true)
  }
})()

async function init(realUI: typeof UI, inspectorView: UI.InspectorView.InspectorView) {
  const tabbedPane = inspectorView?.tabbedPane

  const { default: OutputsPlugin } = await import('../../plugins/outputs')
  OutputsPlugin.devtools?.panels?.forEach(panel => {
    const Widget = panel(devtoolsWindow, realUI)
    tabbedPane?.appendTab(panel.id, panel.title, new Widget())
  })

  const Utils = await devtoolsWindow.simport<
    typeof import('//chii/ui/legacy/components/utils/utils')
  >('ui/legacy/components/utils/utils.js')

  const Common = await devtoolsWindow.simport('core/common/common.js')
  const ThemeSupport = await devtoolsWindow.simport('ui/legacy/theme_support/theme_support.js')
  const Settings = Common.Settings.Settings.instance()

  elBridgeC.on('update:localStorage', ([key, value]) => {
    if (key === 'uiTheme') {
      // TODO make it reactive not reload devtools
      // const uiTheme = Settings.moduleSetting('uiTheme')
      // if (uiTheme.get() === value) return
      //
      // console.log('set uiTheme', value)
      // Settings.moduleSetting('uiTheme').set(value)
      // ThemeSupport.ThemeSupport.instance().applyTheme(devtoolsDocument)
      // reload devtools
      devtoolsWindow.location.reload()
    }
  })
}
