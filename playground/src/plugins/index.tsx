import type * as UITypes from '//chii/ui/legacy/legacy.js'
import type { ReactElement } from 'react'

import { DevtoolsWindow } from '../pages/eval-logs/devtools.ts'

type Render = (devtoolsWindow: DevtoolsWindow, UI: typeof UITypes) => typeof UITypes.Widget.Widget
type ReactRender = (props: { devtoolsWindow: Window, UI: typeof UITypes }) => ReactElement

type PanelMeta = {
  id: string
  type?: 'react'
  title: string
}

type Panel = PanelMeta & Render

function isReactRender(
  tuple: readonly [type: string, render: Render | ReactRender]
): tuple is ['react', ReactRender] {
  const [type, render] = tuple
  return type === 'react' && typeof render === 'function'
}

export function defineDevtoolsPanel(
  id: string, title: string, render: Render
): PanelMeta & Render
export function defineDevtoolsPanel(
  id: string, title: string, type: 'react', render: ReactRender
): PanelMeta & Render & { type: 'react' }
export function defineDevtoolsPanel(
  id: string, title: string, typeOrRender: string | Render, render?: Render | ReactRender
): Panel {
  if (typeof typeOrRender === 'string') {
    if (!render)
      throw new Error('render is required')

    const tuple = [typeOrRender, render] as const
    if (isReactRender(tuple)) {
      const [type, Render] = tuple
      const newRender: Render = (devtoolsWindow, UI) => {
        return class extends UI.Widget.Widget {
        }
      }
      return Object.assign(newRender, { id, type, title })
    }
    throw new Error('render must be a function')
  }
  const rtRender = typeOrRender as PanelMeta & Render
  rtRender.id = id
  rtRender.title = title
  return rtRender
}

export function definePlugins(props: {
  monaco?: {},
  devtools?: {
    panels?: Panel[]
  }
}) { return props }
