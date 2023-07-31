import * as Babel from '@babel/standalone'

import * as Awaitabler from 'awaitabler'
import * as AwaitablerString from 'awaitabler/prototypes/string.reg'
import * as AwaitablerNumber from 'awaitabler/prototypes/number.reg'

import awaitAutoBox from 'awaitabler/await-auto-box'

// @ts-ignore
window.require = function (name) {
  switch (name) {
    case 'awaitabler': return Awaitabler
    case 'awaitabler/prototypes/number': {
      addDisposeFunc(AwaitablerNumber.default())
      return
    }
    case 'awaitabler/prototypes/number.reg': return AwaitablerNumber
    case 'awaitabler/prototypes/string': {
      addDisposeFunc(AwaitablerString.default())
      return
    }
    case 'awaitabler/prototypes/string.reg': return AwaitablerString
  }
  throw new Error(`Cannot find module '${name}'`)
}

let prevDisposeFunc: Function

function addDisposeFunc(func?: Function) {
  let oldDisposeFunc = prevDisposeFunc
  prevDisposeFunc = () => {
    oldDisposeFunc?.()
    func?.()
  }
}

let outputCode = ''
const listeners: Function[] = []
window.setOutPutCode = function (code: string) {
  outputCode = code
  listeners.forEach(func => func(code))
}
window.onOutPutCodeChange = function (func: Function) {
  listeners.push(func)
  func(outputCode)
}

function runCode(lang: string, originalCode: string) {
  let code = originalCode
  // noinspection FallThroughInSwitchStatementJS
  switch (lang) {
    // @ts-ignore
    case 'typescript': {
      const { code: transformCode } = Babel.transform(code, {
        presets: ['typescript'],
        plugins: [awaitAutoBox],
        filename: 'index.ts'
      }) ?? {}
      code = transformCode ?? ''
    }
    case 'javascript': {
      const { code: transformCode } = Babel.transform(code, {
        presets: ['es2015'],
        plugins: [awaitAutoBox]
      }) ?? {}
      code = transformCode ?? ''
      break
    }
    default:
      throw new Error(`Unknown language ${lang}`)
  }
  if (code === '') {
    console.warn('Empty code')
    return
  }
  try {
    prevDisposeFunc?.()
    window.setOutPutCode(code)
    addDisposeFunc(eval(
      `(function () { const module = { exports: {} }; const exports = module.exports; ${code}; return module.exports; })()`
    ).dispose)
  } catch (e) {
    console.error(e)
  }
}

window.addEventListener('message', e => {
  switch (e.data.type) {
    case 'run':
      runCode(e.data.lang, e.data.code)
      break
    case 'update:localStorage': {
      const { key, data } = e.data
      let isReload = true
      if (key === 'uiTheme') {
        const currentTheme = JSON.parse(localStorage.getItem('uiTheme') ?? '""')
        if (currentTheme === data) {
          isReload = false
        }
      }
      localStorage.setItem(key, JSON.stringify(data))
      isReload && location.reload()
    }
  }
})
