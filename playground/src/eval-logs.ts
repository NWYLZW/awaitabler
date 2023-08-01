import * as Awaitabler from 'awaitabler'
import * as AwaitablerString from 'awaitabler/prototypes/string.reg'
import * as AwaitablerNumber from 'awaitabler/prototypes/number.reg'

import { elBridgeC } from './eval-logs-bridge.ts'
import { FILES } from './eval-logs-FILES.ts'

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

elBridgeC.on('run', () => {
  FILES.forEach(({ name, text: code }) => {
    // TODO support fileSystem
    try {
      prevDisposeFunc?.()
      addDisposeFunc(eval(
        `(function () { const module = { exports: {} }; const exports = module.exports; ${code}; return module.exports; })()`
      ).dispose)
    } catch (e) {
      console.error(e)
    }
  })
})
elBridgeC.on('update:localStorage', ([key, value]) => {
  let isReload = true
  if (key === 'uiTheme') {
    const currentTheme = JSON.parse(localStorage.getItem('uiTheme') ?? '""')
    if (currentTheme === value) {
      isReload = false
    }
  }
  localStorage.setItem(key, JSON.stringify(value))
  isReload && location.reload()
})
