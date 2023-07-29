import { safeChangePrototype } from './utils'

declare global {
  interface Number {
    ms: Promise<void>
    s: Promise<void>
    m: Promise<void>
    h: Promise<void>
    d: Promise<void>
  }
}

function sleep(ms: number) {
  return new Promise<void>(re => setTimeout(re, ms))
}
function isFiniteWrap(func: (this: Number) => Promise<void>) {
  return function (this: Number) {
    if (!Number.isFinite(this))
      return new Promise<void>(() => {})
    return func.call(this)
  }
}
function defineProperty(prop: string, func: (this: Number | BigInt) => Promise<void>) {
  const wrapFunc = isFiniteWrap(func)

  const disposeFuncs = [
    safeChangePrototype(Number.prototype, prop, {
      enumerable: false,
      configurable: true,
      get: wrapFunc
    }),
    safeChangePrototype(BigInt.prototype, prop, {
      enumerable: false,
      configurable: true,
      get: wrapFunc
    }),
  ]
  return () => disposeFuncs.forEach(func => func())
}
export function defineSleepProp(prop: string, times: number) {
  return defineProperty(prop, function () { return sleep(Number(this) * times) })
}

export default function regNumber() {
  const disposeFuncs = [
    defineSleepProp('ms', 1),
    defineSleepProp('s', 1000),
    defineSleepProp('m', 1000 * 60),
    defineSleepProp('h', 1000 * 60 * 60),
    defineSleepProp('d', 1000 * 60 * 60 * 24),
  ]
  return () => disposeFuncs.forEach(func => func())
}
