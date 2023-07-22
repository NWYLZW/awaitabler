import * as Self from './index'
import { configure } from './configure'

export default Self

export * from './quester'

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
  (ctx: Context, next: () => Promise<void>): unknown | Promise<unknown>
}
export function defineMiddleware(mid: Middleware) {
  return mid
}
export function use(mid: Middleware) {
  middlewares.add(mid)
  return () => middlewares.delete(mid)
}
export async function consumeMiddlewares(ctx: Context) {
  const middlewareValues = middlewares.values()
  const next = async (): Promise<unknown> => {
    const mid = middlewareValues.next().value
    if (mid) {
      const res = await mid(ctx, next)
      if (res) return res

      return next()
    }
  }
  return next()
}

export { setConfigure } from './configure'

/**
 * await string EBNF
 * ```EBNF
 * tag = '[' , { all characters - ']' } , ']', [ { ' ' } ] ;
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
 * ://www.com
 */
export function resolveContext(str: string) {
  const ctx: Context = {
    tags: [],
    schema: '',
    target: '',
    cmd: ''
  }
  let cache = ''
  for (let i = 0; i < str.length; i++) {
    const c = str[i]
    switch (c) {
      case '[':
        let tag = ''
        while (str[++i] !== ']') {
          tag += str[i]
        }
        ctx.tags.push(tag)
        break
      case ':':
        ctx.schema = cache.trim() || configure.defaultSchema
        ctx.cmd = str.slice(i + 1)
        ctx.target = `${ctx.schema}:${ctx.cmd}`
        return ctx
      default:
        cache += c
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
  String.prototype.then = function (on0, on1) {
    return consumeMiddlewares(
      resolveContext(this.toString())
    ).then(on0, on1)
  }
}

export function registerAll() {
  registerString()
}
