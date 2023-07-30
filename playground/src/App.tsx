import './App.scss'

import { useEffect } from 'react'

import EditorZone from './components/EditorZone'
import { ThemeSwitcher } from './components/ThemeSwitcher.tsx'

window.dododo = function dododo(code, lang) {
  document.querySelector<HTMLIFrameElement>('iframe.eval-logs')
    ?.contentWindow
    ?.postMessage({ type: 'run', code, lang }, '*')
}

window.updateLocalStorage = function updateLocalStorage(key, data) {
  document.querySelector<HTMLIFrameElement>('iframe.eval-logs')
    ?.contentWindow
    ?.postMessage({ type: 'update:localStorage', key, data }, '*')
}

function App() {
  useEffect(() => onThemeChange(theme => updateLocalStorage('uiTheme', {
    light: 'default', dark: 'dark'
  }[theme])), [])
  return (
    <>
      <header>
        <h1 style={{ margin: 0 }}>
          <a href='https://github.com/NWYLZW/awaitabler' style={{
            color: '#fff',
            textDecoration: 'none'
          }}>
            Awaitabler
          </a>
        </h1>
        <ThemeSwitcher/>
      </header>
      <div className='main'>
        <EditorZone />
        <iframe src='./eval-logs.html' frameBorder={0} className='eval-logs' />
      </div>
    </>
  )
}

export default App
