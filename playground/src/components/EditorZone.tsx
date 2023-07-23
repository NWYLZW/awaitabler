import './EditorZone.scss'

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { createPortal } from 'react-dom'
import type * as monacoEditor from 'monaco-editor'
import Editor, { useMonaco } from '@monaco-editor/react'

import examples from '../examples.ts'
import Switcher from './Switcher.tsx'

const BORDER_SIZE = 5
const DOUBLE_CLICK_WIDTH = '500px'

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

interface DialogRef {
  open: () => void
  hide: () => void
}

export const HelpDialog = forwardRef<DialogRef>(function HelpDialog({ }, ref) {
  const [open, setOpen] = useState(false)
  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    hide: () => setOpen(false),
  }), [])

  const isMac = navigator.platform.includes('Mac')
  const cmdOrCtrl = isMac ? 'Cmd' : 'Ctrl'

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?') {
        setOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
  useEffect(() => {
    if (open) {
      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false)
      }
      document.addEventListener('keyup', handleKeyUp)
      return () => document.removeEventListener('keyup', handleKeyUp)
    }
  })
  return createPortal(<dialog
    className='help'
    autoFocus
    open={open}
  >
    <div className='dialog__container'>
      <div className='dialog__title'>
        <h1>帮助</h1>
        <button className='dialog__close' onClick={() => setOpen(false)}>×</button>
      </div>
      <div className="dialog__content">
        <h2>快捷键</h2>
        <ul>
          <li><code>{cmdOrCtrl} + S</code>: 保存并复制链接</li>
          <li><code>{cmdOrCtrl} + E</code>: 执行代码</li>
        </ul>
        <h2>支持的语言</h2>
        <ul>
          <li><code>JavaScript</code></li>
          <li><code>TypeScript</code></li>
        </ul>
      </div>
    </div>
  </dialog>, document.body, 'help-dialog')
})

export default function EditorZone() {
  const searchParams = new URLSearchParams(location.search)

  const [language, setLanguage] = useState<'js' | 'ts'>(
    searchParams.get('lang') === 'js' ? 'js' : 'ts'
  )
  function changeLanguage(lang: 'js' | 'ts') {
    setLanguage(lang)
    searchParams.set('lang', lang)
    history.replaceState(null, '', '?' + searchParams.toString() + location.hash)
  }

  const hash = location.hash.slice(1)
  const [code, setCode] = useState<string>(hash ? decodeURIComponent(atob(hash)) : examples.base[language])

  const [exampleName, setExampleName] = useState<string>(!hash ? 'base' : '')

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

    let defaults: monacoEditor.languages.typescript.LanguageServiceDefaults
    if (language === 'js') {
      defaults = monaco.languages.typescript.javascriptDefaults
    } else {
      defaults = monaco.languages.typescript.typescriptDefaults
    }
    defaults.setCompilerOptions({ ...defaults.getCompilerOptions(), ...compilerOptions })
    extraModules.forEach(({ content, filePath }) => {
      monaco.editor.createModel(
        content,
        language === 'js' ? 'javascript' : 'typescript',
        monaco.Uri.parse(filePath)
      )
    })
    return () => {
      monaco.editor.getModels().forEach(model => {
        if (model.uri.path.startsWith('/node_modules/')) model.dispose()
      })
    }
  }, [language, monaco])

  let innerTheme = 'light'
  useEffect(() => onThemeChange(theme => {
    editorRef.current?.updateOptions({
      theme: theme === 'light' ? 'vs' : 'vs-dark'
    })
    innerTheme = theme
  }), [])

  const helpDialogRef = useRef<DialogRef>(null)
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
    <HelpDialog ref={helpDialogRef} />
    <div className='menu'>
      <div className='btns'>
        <button className='excute' onClick={() => {
          const code = editorRef.current?.getValue().trim()
          if (code === '' || code === undefined) return

          dododo(code, 'javascript')
        }}>Execute</button>
        <button className='history'>
          History
        </button>
        <button className='help' onClick={() => helpDialogRef.current?.open()}>
          Help
        </button>
      </div>
      <div className='opts'>
        <select
          value={exampleName}
          onChange={e => {
            const value = e.target.value
            // @ts-ignore
            const example = examples[value]?.[language]
            if (!example) {
              alert('示例暂未添加')
              e.target.value = exampleName
              return
            }
            setCode(example)
            setExampleName(value)
          }}>
          <option value='base'>基本示例</option>
          <option value='middleware'>中间件</option>
        </select>
        <Switcher lText={<div style={{ position: 'relative', width: 24, height: 24, backgroundColor: '#4272ba' }} >
                  <span style={{
                    position: 'absolute',
                    right: 1,
                    bottom: -2,
                    transform: 'scale(0.6)',
                    fontWeight: 'blob'
                  }}>TS</span>
        </div>}
                  rText={<div style={{ position: 'relative', width: 24, height: 24, backgroundColor: '#f2d949' }} >
                  <span style={{
                    position: 'absolute',
                    right: 1,
                    bottom: -2,
                    transform: 'scale(0.6)',
                    fontWeight: 'blob',
                    color: 'black'
                  }}>JS</span>
                  </div>}
                  value={language === 'js'}
                  onChange={checked => {
                    if (!hash) {
                      // @ts-ignore
                      const example = examples[exampleName]?.[checked ? 'js' : 'ts']
                      if (!example) {
                        alert('示例暂未添加')
                        return
                      }
                      setCode(example)
                    }
                    changeLanguage(checked ? 'js' : 'ts')
                  }}
        />
      </div>
    </div>
    <Editor
      language={{
        js: 'javascript',
        ts: 'typescript',
      }[language]}
      options={{
        automaticLayout: true,
        scrollbar: {
          vertical: 'hidden',
          verticalSliderSize: 0,
          verticalScrollbarSize: 0,
        }
      }}
      value={code}
      path={`file:///index.${language}`}
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
