// @ts-check
// @ts-ignore
/** @typedef {import('./monaco')} */
/** @typedef {import('../global')} */

// import('./monaco') will shot error in next line
// the bug need a semi-colon to fix
;const EXAMPLE_CODE = `// try it, press \`(Ctrl|Cmd) + Enter\` to run
async function main() {
    const resp = /** @type {Response} */ (
        await 'https://jsonplaceholder.typicode.com/todos/1'
    )
    console.log(resp.status, resp.statusText)
}

main()
`.trim()

;(function () {
  const BORDER_SIZE = 4

  function setCodeByUrl() {
    const hash = location.hash.slice(1)
    const code = hash ? decodeURIComponent(atob(hash)) : EXAMPLE_CODE
    editor.setValue(code)
  }
  // watch hash change
  window.addEventListener('hashchange', setCodeByUrl)
  const el = /** @type {HTMLDivElement} */ (document.getElementById('monaco-editor'))
  const editor = monaco.editor.create(el, {
    value: '',
    automaticLayout: true,
    language: 'javascript'
  })
  setCodeByUrl()
  let historyIndex = -1
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    location.hash = `#${btoa(encodeURIComponent(editor.getValue()))}`
    // copy url to clipboard
    copyToClipboard(location.href)
    showMessage('<h3 style="margin: 0">url copied to clipboard, share it with your friends!</h3>')
  })
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, function () {
    const code = editor.getValue().trim()
    if (code === '') return

    run(code, 'javascript')
    editor.setValue('')
    historyIndex = -1
  })
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.UpArrow, function () {
    if (historyIndex === -1) {
      historyIndex = historyCodes.length - 1
    } else {
      historyIndex--
    }
    if (historyIndex < 0) {
      historyIndex = 0
    }
    editor.setValue(historyCodes[historyIndex].code)
  })
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.DownArrow, function () {
    if (historyIndex === -1) {
      historyIndex = historyCodes.length - 1
    } else {
      historyIndex++
    }
    if (historyIndex >= historyCodes.length) {
      historyIndex = historyCodes.length - 1
    }
    editor.setValue(historyCodes[historyIndex].code)
  })
  editor.focus()

  /** @type {number} */
  let mPos
  /**
   * @param {MouseEvent} e 
   */
  function resize(e) {
    const dx = e.x - mPos
    const newWidth = (parseInt(getComputedStyle(el, '').width) + dx)

    mPos = e.x
    el.style.width = newWidth + 'px'
    el.style.minWidth = '5px'
  }

  let isClick = false
  el.addEventListener('mousedown', e => {
    if (e.offsetX > el.offsetWidth - BORDER_SIZE) {
      mPos = e.x
      if (!isClick) {
        isClick = true
        setTimeout(() => isClick = false, 1000)
      } else {
        el.style.width = '500px'
      }
      document.addEventListener('mousemove', resize, false)
      el.style.userSelect = 'none'
    }
  }, false)
  document.addEventListener('mouseup', () => {
    el.style.userSelect = 'auto'
    document.removeEventListener('mousemove', resize, false)
  })

  function throttle(fn, delay) {
    let timer
    return function () {
      if (timer) return
      timer = setTimeout(() => {
        fn.apply(this, arguments)
        timer = null
      }, delay)
    }
  }
  document.querySelector('#run')
    ?.addEventListener('click', throttle(() => {
      run(editor.getValue(), 'javascript')
    }, 200))
})()
