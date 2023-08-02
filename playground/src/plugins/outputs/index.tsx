import { defineDevtoolsPanel, definePlugins } from '../index.tsx'
import JsPanel from './js-panel.tsx'

const JSPanel = defineDevtoolsPanel('outputs.js', '.JS', 'react', JsPanel)
// DTS
const DTSPanel = defineDevtoolsPanel('outputs.d.ts', '.DTS', 'react', ({ devtoolsWindow, UI }) => {
  return <>This is .DTS panel</>
})
// Errors
// AST

export default definePlugins({
  devtools: {
    panels: [JSPanel, DTSPanel]
  }
})
