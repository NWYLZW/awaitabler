import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

window.copyToClipboard = function (content) {
  const input = document.createElement('input')
  input.value = content
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
}

window.run = function run(code, lang) {
  document.querySelector<HTMLIFrameElement>('iframe.eval-logs')
    ?.contentWindow
    ?.postMessage({ type: 'run', code, lang }, '*')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
