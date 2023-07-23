import './EditorZone.scss'

import { useEffect, useRef, useState } from 'react'
import type * as monacoEditor from 'monaco-editor'
import Editor, { useMonaco } from '@monaco-editor/react'

import examples from '../examples.ts'

const BORDER_SIZE = 5
const DOUBLE_CLICK_WIDTH = '500px'

const EXAMPLE_CODE = examples.base.ts

// @ts-ignore
const extraModules = EXTRA_MODULES as { content: string, filePath: string }[]
const compilerOptions: monacoEditor.languages.typescript.CompilerOptions = {
  moduleResolution: 2,
}

function copyToClipboard(text: string) {
  const input = document.createElement('input')
  input.value = text
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
}

function addCommands(
  editor: monacoEditor.editor.IStandaloneCodeEditor,
  monaco: typeof monacoEditor
) {
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    history.pushState(null, '', '#' + btoa(encodeURIComponent(editor.getValue())))
    copyToClipboard(location.href)
    editor.focus()
  })
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, function () {
    const code = editor.getValue().trim()
    if (code === '') return

    const extension = editor.getModel()?.uri.path.split('.').pop()
    const type = {
      js: 'javascript',
      ts: 'typescript',
      // TODO support jsx and tsx
      // jsx: 'javascriptXML',
      // tsx: 'typescriptXML',
    }[extension!]
    type
      && dododo(code, type)
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
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor>(null)
  const effectFuncs = useRef<Function[]>([])
  useEffect(() => {
    return () => {
      effectFuncs.current.forEach(func => func())
      effectFuncs.current = []
    }
  }, [])

  const monaco = useMonaco()
  useEffect(() => {
    if (!monaco) return

    const typescriptDefaults = monaco.languages.typescript.typescriptDefaults
    const javascriptDefaults = monaco.languages.typescript.javascriptDefaults
    typescriptDefaults.setCompilerOptions({ ...typescriptDefaults.getCompilerOptions(), ...compilerOptions })
    javascriptDefaults.setCompilerOptions({ ...javascriptDefaults.getCompilerOptions(), ...compilerOptions })
    extraModules.forEach(({ content, filePath }) => {
      monaco.editor.createModel(content, 'typescript', monaco.Uri.parse(filePath))
    })
    return () => {
      monaco.editor.getModels().forEach(model => {
        if (model.uri.path.startsWith('/node_modules/')) model.dispose()
      })
    }
  }, [monaco])

  let innerTheme = 'light'
  useEffect(() => onThemeChange(theme => {
    editorRef.current?.updateOptions({
      theme: theme === 'light' ? 'vs' : 'vs-dark'
    })
    innerTheme = theme
  }), [])
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
                  // set width with !important
                  el.style.setProperty('width', newWidth + 'px', 'important')
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

        dododo(code, 'javascript')
      }}>Execute</button>
    </div>
    <Editor
      // TODO support switch typescript
      language='typescript'
      options={{
        automaticLayout: true,
        scrollbar: {
          vertical: 'hidden',
          verticalSliderSize: 0,
          verticalScrollbarSize: 0,
        }
      }}
      value={code}
      path='file:///index.ts'
      onChange={e => setCode(e ?? '')}
      onMount={(editor, monaco) => {
        // @ts-ignore
        editorRef.current = editor
        editorRef.current.updateOptions({
          theme: innerTheme === 'light' ? 'vs' : 'vs-dark'
        })
        addCommands(editor, monaco)
      }}
    />
  </div>
}
