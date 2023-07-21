import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

window.dododo = function dododo(code, lang) {
  document.querySelector<HTMLIFrameElement>('iframe.eval-logs')
    ?.contentWindow
    ?.postMessage({ type: 'run', code, lang }, '*')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
