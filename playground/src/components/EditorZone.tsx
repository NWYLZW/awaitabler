import './EditorZone.scss'

import { useEffect, useRef, useState } from 'react'
import * as monaco from 'monaco-editor'

import Editor from '@monaco-editor/react'

const BORDER_SIZE = 5
const DOUBLE_CLICK_WIDTH = '500px'

const EXAMPLE_CODE = `// try it, press \`(Ctrl|Cmd) + E\` to run
import Awaitabler from 'awaitabler'

Awaitabler.registerAll()

async function main() {
    const resp = /** @type {Response} */ (
        await 'https://jsonplaceholder.typicode.com/todos/1'
    )
    console.log(resp.status)
    console.log(await resp.json())
}

main()
`

function copyToClipboard(text: string) {
  const input = document.createElement('input')
  input.value = text
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
}

function addCommands(editor: monaco.editor.IStandaloneCodeEditor) {
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    location.hash = `#${btoa(encodeURIComponent(editor.getValue()))}`
    copyToClipboard(location.href)
  })
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, function () {
    const code = editor.getValue().trim()
    if (code === '') return

    run(code, 'javascript')
  })
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.UpArrow, function () {
    // 当光标位于第一行时触发
  })
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.DownArrow, function () {
    // 当光标位于最后一行时触发
  })
  editor.focus()
}

export default function EditorZone() {
  const hash = location.hash.slice(1)
  const [code, setCode] = useState<string>(hash ? decodeURIComponent(atob(hash)) : EXAMPLE_CODE)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>(null)
  const effectFuncs = useRef<Function[]>([])
  useEffect(() => {
    return () => {
      effectFuncs.current.forEach(func => func())
      effectFuncs.current = []
    }
  }, [])

  return <div className='editor-zone'
              ref={async ele => {
                // wait monaco editor mount
                let el: HTMLDivElement

                do {
                  await new Promise(re => setTimeout(re, 100))
                  el = ele?.querySelector<HTMLDivElement>(':scope > section > div')!
                } while (el?.innerText === 'Loading...')
                if (!el) return

                let mPos: number
                let isClick = false

                function resize(e: MouseEvent) {
                  const dx = e.x - mPos
                  const newWidth = (parseInt(getComputedStyle(el, '').width) + dx)

                  mPos = e.x
                  el.style.width = newWidth + 'px'
                  el.style.minWidth = '5px'
                }
                function elMouseDown(e: MouseEvent) {
                  if (e.offsetX > el.offsetWidth - BORDER_SIZE) {
                    mPos = e.x
                    if (!isClick) {
                      isClick = true
                      setTimeout(() => isClick = false, 1000)
                    } else {
                      el.style.width = DOUBLE_CLICK_WIDTH
                    }
                    document.querySelectorAll('iframe').forEach(e => {
                      e.style.pointerEvents = 'none'
                    })
                    document.addEventListener('mousemove', resize, false)
                    el.style.userSelect = 'none'
                  }
                }
                function onGlobalMouseUp() {
                  el.style.userSelect = 'auto'
                  document.removeEventListener('mousemove', resize, false)
                  document.querySelectorAll('iframe').forEach(e => {
                    e.style.pointerEvents = 'auto'
                  })
                }

                el.addEventListener('mousedown', elMouseDown, false)
                document.addEventListener('mouseup', onGlobalMouseUp)
                // 使用 ref + el 的方式会在热载（或其他组件重载的情况下）后产生副作用未被收集的问题
                // 在这里我们可以注册一个副作用数组，在每次卸载的时候将副作用清理一遍
                effectFuncs.current.push(() => {
                  el.removeEventListener('mousedown', elMouseDown)
                  document.removeEventListener('mouseup', onGlobalMouseUp)
                })
              }}>
    <div className='menu'>
      <button className='excute' onClick={() => {
        const code = editorRef.current?.getValue().trim()
        if (code === '' || code === undefined) return

        run(code, 'javascript')
      }}>Execute</button>
    </div>
    <Editor
      language='javascript'
      options={{ automaticLayout: true }}
      value={code}
      onChange={e => setCode(e ?? '')}
      onMount={editor => {
        // @ts-ignore
        editorRef.current = editor
        addCommands(editor)
      }}
    />
  </div>
}
