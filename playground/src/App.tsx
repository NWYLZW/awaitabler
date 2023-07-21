import './App.scss'

import Awaitabler from 'awaitabler'
import EditorZone from './components/EditorZone'

Awaitabler.registerAll()

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
      </header>
      <div className='main'>
        <EditorZone />
        <iframe src='./eval-logs.html' frameBorder={0} className='eval-logs' />
      </div>
    </>
  )
}

export default App
