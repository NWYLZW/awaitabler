import type * as UI from '//chii/ui/legacy/legacy.js'

import { elBridgeC } from './bridge.ts'
import { definePlugins } from '../../plugins'

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
  'ui/legacy/legacy.js': typeof import('//chii/ui/legacy/legacy')
  'core/common/common.js': typeof import('//chii/core/common/common')
  'ui/legacy/theme_support/theme_support.js': typeof import('//chii/ui/legacy/theme_support/theme_support')
}

export type DevtoolsWindow = Window & {
  simport: <R = never, const T extends keyof ImportMap | (string & {}) = string>(path: T) => Promise<
    [R] extends [never]
      ? T extends keyof ImportMap ? ImportMap[T] : unknown
      : R
  >
}

const devtools = document.querySelector('iframe')!
let devtoolsWindow = devtools.contentWindow as DevtoolsWindow
let devtoolsDocument = devtools.contentDocument!

let inited = false
async function checkInspectorViewIsLoaded() {
  const realThemeSupport = await devtoolsWindow.simport('ui/legacy/theme_support/theme_support.js')
  if (!realThemeSupport.ThemeSupport.hasInstance())
    return

  const realUI = await devtoolsWindow.simport('ui/legacy/legacy.js')
  const inspectorView = realUI.InspectorView.InspectorView.instance()
  if (inspectorView && !inited) {
    inited = true
    await init()
  }
}
;(async () => {
  if (devtoolsDocument.readyState === 'complete') {
    await checkInspectorViewIsLoaded()
  } else {
    devtoolsDocument.addEventListener('load', checkInspectorViewIsLoaded, true)
  }
})()

const plugins = import.meta.glob('../../plugins/*/index.ts*', {
  eager: true, import: 'default'
}) as Record<string, ReturnType<typeof definePlugins>>
function registerPlugins(realUI: typeof UI, tabbedPane: UI.TabbedPane.TabbedPane) {
  Object.entries(plugins)
    .forEach(([path, plugin]) => {
      const { devtools } = plugin
      devtools?.panels?.forEach(panel => {
        const Widget = panel(devtoolsWindow, realUI)
        if (tabbedPane.hasTab(panel.id)) {
          return
        }
        tabbedPane?.appendTab(panel.id, panel.title, new Widget())
      })
    })
}

async function init() {
  let isReload = false

  async function loadPlugins() {
    const realUI = await devtoolsWindow.simport('ui/legacy/legacy.js')
    const inspectorView = realUI.InspectorView.InspectorView.instance()
    const tabbedPane = inspectorView?.tabbedPane
    registerPlugins(realUI, tabbedPane)
  }
  await loadPlugins()
  async function reload() {
    devtoolsWindow.location.reload()

    devtools.addEventListener('load', async () => {
      if (
        !devtools.contentDocument
        || devtools.contentDocument.readyState !== 'complete'
      ) return
      devtoolsWindow = devtools.contentWindow as DevtoolsWindow
      devtoolsDocument = devtools.contentDocument!

      await loadPlugins()
      isReload = false
    }, true)
  }

  const Utils = await devtoolsWindow.simport<
    typeof import('//chii/ui/legacy/components/utils/utils')
  >('ui/legacy/components/utils/utils.js')

  const Common = await devtoolsWindow.simport('core/common/common.js')
  const ThemeSupport = await devtoolsWindow.simport('ui/legacy/theme_support/theme_support.js')
  const Settings = Common.Settings.Settings.instance()

  let uiTheme = ''
  elBridgeC.on('update:localStorage', ([key, value]) => {
    if (key === 'uiTheme' && !isReload && uiTheme !== value) {
      // TODO make it reactive not reload devtools
      // const uiTheme = Settings.moduleSetting('uiTheme')
      // if (uiTheme.get() === value) return
      //
      // console.log('set uiTheme', value)
      // Settings.moduleSetting('uiTheme').set(value)
      // ThemeSupport.ThemeSupport.instance().applyTheme(devtoolsDocument)
      // reload devtools
      uiTheme = value
      isReload = true
      reload()
    }
  })
}
