import * as Self from './index'
import { configure } from './configure'

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
  tags: string[]
  target: string
  schema: string
  cmd: string
}
export interface Middleware {
  (ctx: Context, next: () => Promise<void>): void | Promise<void>
}
export function defineMiddleware(mid: Middleware) {
  middlewares.add(mid)
  return () => middlewares.delete(mid)
}

export function supportRequest() {
  defineMiddleware((ctx, next) => {
    if (['http', 'https'].includes(ctx.schema)) {
    }
    return next()
  })
}

/**
 * await string EBNF
 * ```EBNF
 * tag = '[' , { all characters - '] ' } , '] ' ;
 * schema = { all characters - ':' } , ':' ;
 * target = schema , { all characters } ;
 * await string rule = { tag } , target ;
 * ```
 * [POST] [Header.Content-Type=application/json] https://www.com/to/target?query=string#hash
 * \_____/\_____________________________________/\____/\___________________________________/
 *  |       |                                      |       |
 * tag0    tag1                                   schema  cmd
 * \____________________________________________/\_________________________________________/
 *                    |                                              |
 *                   tags                                          target
 * more examples:
 * [../] shell:ls -l
 * [.../] fs://./url/to/file
 */
export function resolveContext(str: string) {
  const ctx: Context = {
    tags: [],
    schema: configure.defaultSchema,
    target: `${configure.defaultSchema}:`,
    cmd: ''
  }
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '[') {
      const tag = []
      while (str[i] !== ']') {
        tag.push(str[i])
        i++
      }
      ctx.tags.push(tag.join(''))
    } else if (str[i] === ':') {
      ctx.schema = str.slice(0, i)
      ctx.target = str.slice(i + 1)
      break
    }
  }
  return ctx
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
    const tags: string[] = []
    const str = this.toString()
    return fetch(str).then(on0, on1)
  })
}

export function registerAll() {
  registerString()
}
