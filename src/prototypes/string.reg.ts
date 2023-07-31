import { configure, consumeMiddlewares, Context } from 'awaitabler'

import { safeChangePrototype } from './utils'

declare global {
  export interface StringFunction {
    <T extends Record<string, unknown>>(config: T): Promise<T>
    <T extends string>(
      arr: TemplateStringsArray,
      s: T
    ): Promise<T>
  }
  export var StringFunction: (str: string) => StringFunction
  interface String extends StringFunction {
    then: Promise<unknown>['then']
  }
}

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

export default function regString() {
  var global
  const This = global || window

  const cache00 = This.StringFunction
  This.StringFunction = str => (async (a0: unknown, ...args: unknown[]) => {
    if (Array.isArray(a0)) {
      // template literals mode
      // 'url'`${'123'}`
    } else {
      // call function mode
      // 'url'({})
    }
  }) as StringFunction
  const cache01 = This.StringFunction

  const disposeThen = safeChangePrototype(String.prototype, 'then', {
    enumerable: false,
    configurable: true,
    get(): (typeof String.prototype)['then'] {
      return (on0, on1) => {
        return consumeMiddlewares(
          resolveContext(this.toString())
        ).then(on0, on1)
      }
    }
  })

  return () => {
    if (cache01 === This.StringFunction) {
      This.StringFunction = cache00
    }
    disposeThen()
  }
}
