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
  // 由于加载顺序的不可靠，可能出现 monaco 先被加载，而旁边的 devtools 随后加载
  // 这种情况下，monaco editor 初始化的代码内容不会被 devtools 所感知
  // 需要主动向父级申请下发最新数据
  // 为了逻辑的简便性，强制所有的初始化都会尝试去获取一遍最新的数据
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
