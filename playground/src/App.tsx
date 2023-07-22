import './App.scss'

import EditorZone from './components/EditorZone'
import { ThemeSwitcher } from './components/ThemeSwitcher.tsx'

function App() {
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
