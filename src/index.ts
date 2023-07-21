import * as Self from './index'

export default Self

declare global {
  export interface StringFunction {
    <T extends Record<string, unknown>>(config: T): Promise<T>
    <T extends string>(
      arr: TemplateStringsArray,
      s: T
    ): Promise<T>
  }
  export const StringFunctionConstructor: (str: string) => StringFunction
  interface String extends StringFunction {
    then: Promise<unknown>['then']
  }
  interface Window {
    StringFunction: typeof StringFunctionConstructor
  }
}

const middlewares = new Set<Middleware>()

export interface Context {
  schema: string
}
export interface Middleware {
  (ctx: Context, next: () => Promise<void>): void | Promise<void>
}
export function defineMiddleware(mid: Middleware) {
  middlewares.add(mid)
  return () => middlewares.delete(mid)
}

export function supportFetch() {
  defineMiddleware((ctx, next) => {
    if (['http', 'https'].includes(ctx.schema)) {
    }
    return next()
  })
}

export function registerString() {
  window.StringFunction = (str) => {
    return (async (a0: unknown, ...args: unknown[]) => {
      if (Array.isArray(a0)) {
        // template literals mode
        // 'url'`${'123'}`
      } else {
        // call function mode
        // 'url'({})
      }
    }) as StringFunction
  }
  String.prototype.then = /** @type {String['then']} */ (function (on0, on1) {
    return fetch(this.toString()).then(on0, on1)
  })
}

export function registerAll() {
  registerString()
}
