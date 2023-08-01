import * as Babel from '@babel/standalone'
import awaitAutoBox from 'awaitabler/await-auto-box.ts'

import { elBridgeC, EvalLogsIframeParentEvent } from './eval-logs-bridge.ts'

export let FILES: (
  & Extract<EvalLogsIframeParentEvent, { type: 'compile-completed' }>['data'][number]
  & { originalText: string }
)[] = []

type Listener = (files: typeof FILES) => void | Promise<void>
const listeners: Listener[] = []
export function getFiles() {
  return [FILES, (callback: Listener) => {
    listeners.push(callback)
    elBridgeC.send('compile')
    return () => {
      const index = listeners.indexOf(callback)
      listeners.splice(index, 1)
    }
  }] as const
}

elBridgeC.on('compile-completed', files => {
  FILES = files.map(({ name, text }) => {
    const filename = name.slice(7)
    const { code } = Babel.transform(text, {
      presets: ['es2015'],
      plugins: [awaitAutoBox],
      filename
    }) ?? {}
    return { name: filename, originalText: text, text: code ?? '' }
  })
  listeners.forEach(func => func(FILES))
})
