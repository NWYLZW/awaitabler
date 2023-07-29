import { safeChangePrototype } from './utils'

type AbortablePromise<T> = Promise<T> & {
  (abortSignal: AbortSignal): Promise<T>
}

declare global {
  interface Number {
    ms: AbortablePromise<void>
    s: AbortablePromise<void>
    m: AbortablePromise<void>
    h: AbortablePromise<void>
    d: AbortablePromise<void>
  }
}

function sleep(ms: number) {
  let as: AbortSignal | undefined
  const abortableFunc = (async _as => {
    as = _as
    return await abortableFunc
  }) as AbortablePromise<void>
  abortableFunc.then = (onfulfilled, onrejected) => {
    return new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, ms)
      as?.addEventListener('abort', () => {
        clearTimeout(t)
        if (as!.reason === null) {
          resolve()
        } else {
          reject(as!.reason)
        }
      })
    }).then(onfulfilled, onrejected)
  }
  return abortableFunc
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
