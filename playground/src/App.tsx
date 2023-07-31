import './App.scss'

import { useEffect } from 'react'

import EditorZone from './components/EditorZone'
import { ThemeSwitcher } from './components/ThemeSwitcher.tsx'
import { evalLogsBridge } from './eval-logs-bridge.ts'

window.dododo = function dododo() {
  evalLogsBridge.send('run')
}

window.updateLocalStorage = function updateLocalStorage(key, data) {
  evalLogsBridge.send('update:localStorage', [key, data])
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
