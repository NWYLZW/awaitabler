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
function defineProperty(prop: string, func: (this: Number) => Promise<void>) {
  // @ts-ignore
  !Number.prototype[prop]
    && Object.defineProperty(Number.prototype, prop, {
      enumerable: false,
      configurable: false,
      get: isFiniteWrap(func)
    })
  // @ts-ignore
  !BigInt.prototype[prop]
    && Object.defineProperty(BigInt.prototype, prop, {
      enumerable: false,
      configurable: false,
      get: func
    })
}
export function defineSleepProp(prop: string, times: number) {
  defineProperty(prop, function () { return sleep(Number(this) * times) })
}

export default function regNumber() {
  defineSleepProp('ms', 1)
  defineSleepProp('s', 1000)
  defineSleepProp('m', 1000 * 60)
  defineSleepProp('h', 1000 * 60 * 60)
  defineSleepProp('d', 1000 * 60 * 60 * 24)
}
