import * as Babel from '@babel/standalone'
import awaitAutoBox from 'awaitabler/await-auto-box.ts'

import { elBridgeC, EvalLogsIframeParentEvent } from './bridge.ts'
import { useSyncExternalStore } from 'react'

export let Files: (
  & Extract<EvalLogsIframeParentEvent, { type: 'compile-completed' }>['data'][number]
  & { originalText: string }
)[] = []

type Listener = (files: typeof Files) => void | Promise<void>
const listeners: Listener[] = []
const getFilesSubscribe = (callback: Listener) => {
  listeners.push(callback)
  elBridgeC.send('compile')
  return () => {
    const index = listeners.indexOf(callback)
    listeners.splice(index, 1)
  }
}
export function useFiles() {
  return useSyncExternalStore<typeof Files>(getFilesSubscribe, () => Files)
}

elBridgeC.on('compile-completed', files => {
  Files = files.map(({ name, text }) => {
    let code = text
    const filename = name.slice(7)
    if (filename.endsWith('.js')) {
      try {
        code = Babel.transform(text, {
          presets: ['es2015'],
          plugins: [awaitAutoBox],
          filename
        })?.code ?? ''
      } catch (e) {
        return {
          name: `${filename} (compile error)`,
          originalText: text,
          // @ts-ignore
          text: e!.message!
        }
      }
    }
    return { name: filename, originalText: text, text: code ?? '' }
  })
  listeners.forEach(func => func(Files))
})
