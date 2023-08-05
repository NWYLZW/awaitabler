import{e as Q}from"./files-36856eb3.js";import{j as o,c as Ue}from"./index-7eb6f4b7.js";import ze from"./index-c3cb9c57.js";import Je from"./index-04b6b474.js";const Ye=`import type { PluginObj, types } from '@babel/core'
import type { SpreadElement, Expression, SequenceExpression } from '@babel/types'
import { declare } from '@babel/helper-plugin-utils'

function getIdentifierName(expr: Expression) {
  return {
    ArrayExpression: 'all',
    SequenceExpression: 'allSettled'
  }[expr.type as string]
}

function wrapStringSecure(t: typeof types, expr: Expression) {
  if (expr.type === 'StringLiteral' || expr.type === 'TemplateLiteral') {
    return t.newExpression(t.identifier('String'), [expr])
  }
  return expr
}

// argument = ArrayExpression (string | template | BinaryExpression)
// argument = SequenceExpression (string | template | BinaryExpression)
// argument = LogicalExpression
function multipleExpressionsResolve(t: typeof types, expr: Expression):
  | undefined
  | ((func: (e: Expression, noAwait?: boolean) => void) => void) {
  if (expr.type === 'LogicalExpression' && ['&&', '||'].includes(expr.operator)) {
    switch (expr.operator) {
      // ('123' || '456')
      // Promise.any([new String('123'), new String('456')])
      case '||':
        return func => func(t.callExpression(
          t.memberExpression(t.identifier('Promise'), t.identifier('any')),
          [t.arrayExpression([
            wrapStringSecure(t, expr.left),
            wrapStringSecure(t, expr.right)
          ])]
        ))
      // ('123' && '456')
      // await new String('123'), await new String('456')
      case '&&':
        return func => func(t.sequenceExpression([
          t.awaitExpression(wrapStringSecure(t, expr.left)),
          t.awaitExpression(wrapStringSecure(t, expr.right))
        ]), true)
    }
  }
  if (
    expr.type === 'ArrayExpression'
    || expr.type === 'SequenceExpression'
  ) {
    let elements: (SpreadElement | Expression | null)[] = []
    if (expr.type === 'ArrayExpression') {
      elements = expr.elements
    }
    if (expr.type === 'SequenceExpression') {
      elements = expr.expressions
    }
    const newElements = elements.map(ele => {
      if (!ele) return ele

      if (ele.type === 'StringLiteral' || ele.type === 'TemplateLiteral') {
        return t.newExpression(t.identifier('String'), [ele])
      }
      if (
        ele.type === 'ArrayExpression'
        || ele.type === 'SequenceExpression'
      ) {
        multipleExpressionsResolve(t, ele)?.(ne => ele = ne)
      }
      return ele
    })
    let identifierName: string | undefined = undefined
    if (elements.length > 1) {
      identifierName = getIdentifierName(expr)
    }
    const firstElement = elements[0]
    if (
      elements.length === 1
      && firstElement !== null
      && firstElement.type !== 'SpreadElement'
    ) {
      if (firstElement.type === 'LogicalExpression') {
        let tempEle: Expression = firstElement
        // ['123' && '456']
        // [await new String('123'), await new String('456')]
        if (firstElement.operator === '&&') {
          multipleExpressionsResolve(t, firstElement)?.(ne => tempEle = ne)
          const computedEle = tempEle as unknown as SequenceExpression
          return func => func(t.arrayExpression(computedEle.expressions), true)
        }
        // ['123' || '456']
        // Promise
        //   .resolve(new String('u0'))
        //   .catch(() => new String('u1'))
        if (firstElement.operator === '||') {
          const first = t.callExpression(
            t.memberExpression(t.identifier('Promise'), t.identifier('resolve')),
            [wrapStringSecure(t, firstElement.left)]
          )
          return func => func(t.callExpression(
            t.memberExpression(first, t.identifier('catch')),
            [t.arrowFunctionExpression(
              [],
              wrapStringSecure(t, firstElement.right)
            )]
          ))
        }
      }
      return func => func(firstElement)
    }
    if (identifierName) {
      return func => func(t.callExpression(
        t.memberExpression(t.identifier('Promise'), t.identifier(identifierName!)),
        [t.arrayExpression(newElements)]
      ))
    }
  }
}

export const awaitAutoBox = declare(({ types: t }) => {
  const visitor: PluginObj['visitor'] = {}
  visitor.AwaitExpression = function (path) {
    const { node } = path
    const { argument } = node
    // console.log('node', node)
    // console.log('argument', argument)
    if (
      argument.type === 'StringLiteral'
      || argument.type === 'TemplateLiteral'
    ) {
      let shouldSequenceExpression = false
      checkShouldSequenceExpression: if (path.parent.type === 'SequenceExpression') {
        const [expr0, ...rest] = path.parent.expressions

        if (expr0.type !== 'AwaitExpression') break checkShouldSequenceExpression
        const lastExpr = rest[rest.length - 1]
        // the last expression of sequence expression should be a string literal or object expression
        if (!['ObjectExpression', 'StringLiteral'].includes(lastExpr.type))
          break checkShouldSequenceExpression
        const stringLiterals = [expr0.argument]
        const configureExpression = lastExpr.type === 'ObjectExpression'
          ? lastExpr
          : undefined
        for (const expr of rest) {
          if (expr.type !== 'StringLiteral') {
            if (expr === lastExpr && expr.type === 'ObjectExpression') break
            break checkShouldSequenceExpression
          }
          stringLiterals.push(expr)
        }
        shouldSequenceExpression = true
        const stringBinaryExpression = stringLiterals.reduce((prev, cur) => {
          return t.binaryExpression('+',
            prev,
            t.binaryExpression('+',
              t.stringLiteral(' '),
              cur
            )
          )
        })

        if (configureExpression) {
          path.parentPath.replaceWith(t.awaitExpression(
            t.callExpression(
              t.callExpression(t.identifier('StringFunction'), [stringBinaryExpression]),
              [configureExpression]
            )
          ))
        } else {
          path.parentPath.replaceWith(t.awaitExpression(
            t.callExpression(
              t.callExpression(t.identifier('StringFunction'), [stringBinaryExpression]),
              []
            )
          ))
        }
      }
      if (!shouldSequenceExpression) {
        path.replaceWith(t.awaitExpression(
          t.newExpression(t.identifier('String'), [argument]),
        ))
      }
    }
    if (
      argument.type === 'CallExpression'
      && argument.callee.type === 'StringLiteral'
    ) {
      path.replaceWith(t.awaitExpression(
        // await StringFunction(<callee>)(<arguments>)
        t.callExpression(
          t.callExpression(t.identifier('StringFunction'), [argument.callee]),
          argument.arguments
        ),
      ))
    }
    multipleExpressionsResolve(t, argument)
      ?.((ne, noAwait) => path.replaceWith(
        noAwait
          ? ne
          : t.awaitExpression(ne)
      ))
  }
  return { visitor }
})

export default awaitAutoBox
`,Qe=`import * as Self from './index'
import { configure } from './configure'

export default Self

export * from './tags'
export * from './plugins/quester'

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
      return await mid(ctx, next) ?? await next()
    }
  }
  return next()
}

export { configure, setConfigure } from './configure'

export * from './prototypes/number.reg'
export * from './prototypes/string.reg'

import regNumber from './prototypes/number.reg'
import regString from './prototypes/string.reg'

export function regAll() {
  const disposeFuncs = [
    regNumber(),
    regString()
  ]
  return () => disposeFuncs.forEach(dispose => dispose())
}
`,Ge=`{
  "name": "awaitabler",
  "version": "0.1.0",
  "description": "Make an await.",
  "main": "./index.ts",
  "files": [
    "dist",
    "await-auto-box.js"
  ],
  "publishConfig": {
    "main": "./dist/index.cjs",
    "module": "./dist/index.mjs",
    "types": "./dist/index.d.ts",
    "exports": {
      ".": {
        "types": "./dist/index.d.ts",
        "import": "./dist/index.mjs",
        "require": "./dist/index.cjs"
      },
      "./await-auto-box": "./await-auto-box.js"
    }
  },
  "scripts": {
    "build:dts": "tsc --emitDeclarationOnly --noEmit false --declaration --outDir dist"
  },
  "keywords": [
    "Promise",
    "await",
    "awaitable",
    "request",
    "fetch"
  ],
  "author": "YiJie <yijie4188@gmail.com>",
  "license": "MIT",
  "devDependencies": {
    "@babel/helper-plugin-utils": "^7.22.5",
    "@types/babel__helper-plugin-utils": "^7.10.0"
  }
}
`,Xe=`import { defineMiddleware, defineTags } from 'awaitabler'

interface QuesterTags {
  json: '[Header.Content-Type=application/json]'
}

declare module 'awaitabler' {
  interface Tags {
    quester: QuesterTags
  }
}

export const questerTags = defineTags('quester', {
  json: '[Header.Content-Type=application/json]'
})

export const questerMiddleware = defineMiddleware(async (ctx, next) => {
  if (['http', 'https'].includes(ctx.schema)) {
    let p = fetch(ctx.target)
    if (ctx.tags.find(t => \`[\${t}]\` === questerTags.json)) {
      p = p.then(res => res.json())
    }
    return p
  }
  return next()
})
`,et=`import { safeChangePrototype } from './utils'

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
`,tt=`import regNumber from './number.reg'

export const dispose = regNumber()
`,nt=`import { configure, consumeMiddlewares, Context } from 'awaitabler'

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
 * \`\`\`EBNF
 * tag = '[' , { all characters - ']' } , ']', [ { ' ' } ] ;
 * schema = { all characters - ':' } , ':' ;
 * target = schema , { all characters } ;
 * await string rule = { tag } , target ;
 * \`\`\`
 * [POST] [Header.Content-Type=application/json] https://www.com/to/target?query=string#hash
 * \\_____/\\_____________________________________/\\____/\\___________________________________/
 *  |       |                                      |       |
 * tag0    tag1                                   schema  cmd
 * \\____________________________________________/\\_________________________________________/
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
        ctx.target = \`\${ctx.schema}:\${ctx.cmd}\`
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
      // 'url'\`\${'123'}\`
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
`,rt=`import regString from './string.reg'

export const dispose = regString()
`,ot=`export function safeChangePrototype<T>(o: T, p: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) {
  const oldDesc = Object.getOwnPropertyDescriptor(o, p)
  if (oldDesc?.configurable === false) {
    throw new Error(\`Cannot change prototype property \${p.toString()} of \${o}\`)
  }
  Object.defineProperty(o, p, attributes)
  return () => {
    if (oldDesc === undefined)
      // @ts-ignore
      delete o[p]
    else
      Object.defineProperty(o, p, oldDesc!)
  }
}
`,it=`export interface Tags {
}

export let tags: Readonly<Partial<Tags>>

export function defineTags<N extends keyof Tags, T extends Tags[N]>(
  namespace: N,
  tagsParam: T
) {
  if(tags === undefined) tags = {}

  // @ts-ignore
  return (tags[namespace] = tagsParam)
}
`;function st(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function je(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(i){return Object.getOwnPropertyDescriptor(e,i).enumerable})),n.push.apply(n,r)}return n}function Ce(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]!=null?arguments[t]:{};t%2?je(Object(n),!0).forEach(function(r){st(e,r,n[r])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):je(Object(n)).forEach(function(r){Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(n,r))})}return e}function at(e,t){if(e==null)return{};var n={},r=Object.keys(e),i,a;for(a=0;a<r.length;a++)i=r[a],!(t.indexOf(i)>=0)&&(n[i]=e[i]);return n}function ct(e,t){if(e==null)return{};var n=at(e,t),r,i;if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(i=0;i<a.length;i++)r=a[i],!(t.indexOf(r)>=0)&&Object.prototype.propertyIsEnumerable.call(e,r)&&(n[r]=e[r])}return n}function lt(e,t){return ut(e)||dt(e,t)||pt(e,t)||ft()}function ut(e){if(Array.isArray(e))return e}function dt(e,t){if(!(typeof Symbol>"u"||!(Symbol.iterator in Object(e)))){var n=[],r=!0,i=!1,a=void 0;try{for(var l=e[Symbol.iterator](),d;!(r=(d=l.next()).done)&&(n.push(d.value),!(t&&n.length===t));r=!0);}catch(p){i=!0,a=p}finally{try{!r&&l.return!=null&&l.return()}finally{if(i)throw a}}return n}}function pt(e,t){if(e){if(typeof e=="string")return Ee(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);if(n==="Object"&&e.constructor&&(n=e.constructor.name),n==="Map"||n==="Set")return Array.from(e);if(n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return Ee(e,t)}}function Ee(e,t){(t==null||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}function ft(){throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function mt(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function Se(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(i){return Object.getOwnPropertyDescriptor(e,i).enumerable})),n.push.apply(n,r)}return n}function Me(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]!=null?arguments[t]:{};t%2?Se(Object(n),!0).forEach(function(r){mt(e,r,n[r])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):Se(Object(n)).forEach(function(r){Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(n,r))})}return e}function gt(){for(var e=arguments.length,t=new Array(e),n=0;n<e;n++)t[n]=arguments[n];return function(r){return t.reduceRight(function(i,a){return a(i)},r)}}function ne(e){return function t(){for(var n=this,r=arguments.length,i=new Array(r),a=0;a<r;a++)i[a]=arguments[a];return i.length>=e.length?e.apply(this,i):function(){for(var l=arguments.length,d=new Array(l),p=0;p<l;p++)d[p]=arguments[p];return t.apply(n,[].concat(i,d))}}}function ge(e){return{}.toString.call(e).includes("Object")}function ht(e){return!Object.keys(e).length}function ae(e){return typeof e=="function"}function wt(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function xt(e,t){return ge(t)||W("changeType"),Object.keys(t).some(function(n){return!wt(e,n)})&&W("changeField"),t}function yt(e){ae(e)||W("selectorType")}function bt(e){ae(e)||ge(e)||W("handlerType"),ge(e)&&Object.values(e).some(function(t){return!ae(t)})&&W("handlersType")}function vt(e){e||W("initialIsRequired"),ge(e)||W("initialType"),ht(e)&&W("initialContent")}function _t(e,t){throw new Error(e[t]||e.default)}var jt={initialIsRequired:"initial state is required",initialType:"initial state should be an object",initialContent:"initial state shouldn't be an empty object",handlerType:"handler should be an object or a function",handlersType:"all handlers should be a functions",selectorType:"selector should be a function",changeType:"provided value of changes should be an object",changeField:'it seams you want to change a field in the state which is not specified in the "initial" state',default:"an unknown error accured in `state-local` package"},W=ne(_t)(jt),ue={changes:xt,selector:yt,handler:bt,initial:vt};function Ct(e){var t=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{};ue.initial(e),ue.handler(t);var n={current:e},r=ne(Mt)(n,t),i=ne(St)(n),a=ne(ue.changes)(e),l=ne(Et)(n);function d(){var v=arguments.length>0&&arguments[0]!==void 0?arguments[0]:function(E){return E};return ue.selector(v),v(n.current)}function p(v){gt(r,i,a,l)(v)}return[d,p]}function Et(e,t){return ae(t)?t(e.current):t}function St(e,t){return e.current=Me(Me({},e.current),t),t}function Mt(e,t,n){return ae(t)?t(e.current):Object.keys(n).forEach(function(r){var i;return(i=t[r])===null||i===void 0?void 0:i.call(t,e.current[r])}),n}var Ot={create:Ct},Pt={paths:{vs:"https://cdn.jsdelivr.net/npm/monaco-editor@0.36.1/min/vs"}};function Tt(e){return function t(){for(var n=this,r=arguments.length,i=new Array(r),a=0;a<r;a++)i[a]=arguments[a];return i.length>=e.length?e.apply(this,i):function(){for(var l=arguments.length,d=new Array(l),p=0;p<l;p++)d[p]=arguments[p];return t.apply(n,[].concat(i,d))}}}function Rt(e){return{}.toString.call(e).includes("Object")}function kt(e){return e||Oe("configIsRequired"),Rt(e)||Oe("configType"),e.urls?(At(),{paths:{vs:e.urls.monacoBase}}):e}function At(){console.warn(Ne.deprecation)}function Nt(e,t){throw new Error(e[t]||e.default)}var Ne={configIsRequired:"the configuration object is required",configType:"the configuration object should be an object",default:"an unknown error accured in `@monaco-editor/loader` package",deprecation:`Deprecation warning!
    You are using deprecated way of configuration.

    Instead of using
      monaco.config({ urls: { monacoBase: '...' } })
    use
      monaco.config({ paths: { vs: '...' } })

    For more please check the link https://github.com/suren-atoyan/monaco-loader#config
  `},Oe=Tt(Nt)(Ne),Lt={config:kt},Ft=function(){for(var t=arguments.length,n=new Array(t),r=0;r<t;r++)n[r]=arguments[r];return function(i){return n.reduceRight(function(a,l){return l(a)},i)}};function Le(e,t){return Object.keys(t).forEach(function(n){t[n]instanceof Object&&e[n]&&Object.assign(t[n],Le(e[n],t[n]))}),Ce(Ce({},e),t)}var Dt={type:"cancelation",msg:"operation is manually canceled"};function we(e){var t=!1,n=new Promise(function(r,i){e.then(function(a){return t?i(Dt):r(a)}),e.catch(i)});return n.cancel=function(){return t=!0},n}var It=Ot.create({config:Pt,isInitialized:!1,resolve:null,reject:null,monaco:null}),Fe=lt(It,2),le=Fe[0],he=Fe[1];function $t(e){var t=Lt.config(e),n=t.monaco,r=ct(t,["monaco"]);he(function(i){return{config:Le(i.config,r),monaco:n}})}function qt(){var e=le(function(t){var n=t.monaco,r=t.isInitialized,i=t.resolve;return{monaco:n,isInitialized:r,resolve:i}});if(!e.isInitialized){if(he({isInitialized:!0}),e.monaco)return e.resolve(e.monaco),we(xe);if(window.monaco&&window.monaco.editor)return De(window.monaco),e.resolve(window.monaco),we(xe);Ft(Wt,Ht)(Kt)}return we(xe)}function Wt(e){return document.body.appendChild(e)}function Vt(e){var t=document.createElement("script");return e&&(t.src=e),t}function Ht(e){var t=le(function(r){var i=r.config,a=r.reject;return{config:i,reject:a}}),n=Vt("".concat(t.config.paths.vs,"/loader.js"));return n.onload=function(){return e()},n.onerror=t.reject,n}function Kt(){var e=le(function(n){var r=n.config,i=n.resolve,a=n.reject;return{config:r,resolve:i,reject:a}}),t=window.require;t.config(e.config),t(["vs/editor/editor.main"],function(n){De(n),e.resolve(n)},function(n){e.reject(n)})}function De(e){le().monaco||he({monaco:e})}function Zt(){return le(function(e){var t=e.monaco;return t})}var xe=new Promise(function(e,t){return he({resolve:e,reject:t})}),ce={config:$t,init:qt,__getMonacoInstance:Zt};const Bt=window.React.memo,Ut=window.React,Pe=window.React.useState,z=window.React.useRef,Te=window.React.useCallback,Re=window.React.useEffect,zt=window.React.memo,ye=window.React;var Jt={wrapper:{display:"flex",position:"relative",textAlign:"initial"},fullWidth:{width:"100%"},hide:{display:"none"}},be=Jt;const Yt=window.React;var Qt={container:{display:"flex",height:"100%",width:"100%",justifyContent:"center",alignItems:"center"}},Gt=Qt;function Xt({children:e}){return Yt.createElement("div",{style:Gt.container},e)}var en=Xt,tn=en;function nn({width:e,height:t,isEditorReady:n,loading:r,_ref:i,className:a,wrapperProps:l}){return ye.createElement("section",{style:{...be.wrapper,width:e,height:t},...l},!n&&ye.createElement(tn,null,r),ye.createElement("div",{ref:i,style:{...be.fullWidth,...!n&&be.hide},className:a}))}var rn=nn,Ie=zt(rn);const on=window.React.useEffect;function sn(e){on(e,[])}var _e=sn;const an=window.React.useEffect,cn=window.React.useRef;function ln(e,t,n=!0){let r=cn(!0);an(r.current||!n?()=>{r.current=!1}:e,t)}var P=ln;function oe(){}function G(e,t,n,r){return un(e,r)||dn(e,t,n,r)}function un(e,t){return e.editor.getModel($e(e,t))}function dn(e,t,n,r){return e.editor.createModel(t,n,r?$e(e,r):void 0)}function $e(e,t){return e.Uri.parse(t)}function pn({original:e,modified:t,language:n,originalLanguage:r,modifiedLanguage:i,originalModelPath:a,modifiedModelPath:l,keepCurrentOriginalModel:d=!1,keepCurrentModifiedModel:p=!1,theme:v="light",loading:E="Loading...",options:w={},height:j="100%",width:R="100%",className:B,wrapperProps:F={},beforeMount:X=oe,onMount:D=oe}){let[S,V]=Pe(!1),[T,C]=Pe(!0),h=z(null),_=z(null),H=z(null),M=z(D),g=z(X),k=z(!1);_e(()=>{let u=ce.init();return u.then(s=>(_.current=s)&&C(!1)).catch(s=>(s==null?void 0:s.type)!=="cancelation"&&console.error("Monaco initialization: error:",s)),()=>h.current?I():u.cancel()}),P(()=>{let u=h.current.getModifiedEditor();u.getOption(_.current.editor.EditorOption.readOnly)?u.setValue(t||""):t!==u.getValue()&&(u.executeEdits("",[{range:u.getModel().getFullModelRange(),text:t||"",forceMoveMarkers:!0}]),u.pushUndoStop())},[t],S),P(()=>{var u,s;(s=(u=h.current)==null?void 0:u.getModel())==null||s.original.setValue(e||"")},[e],S),P(()=>{let{original:u,modified:s}=h.current.getModel();_.current.editor.setModelLanguage(u,r||n||"text"),_.current.editor.setModelLanguage(s,i||n||"text")},[n,r,i],S),P(()=>{var u;(u=_.current)==null||u.editor.setTheme(v)},[v],S),P(()=>{var u;(u=h.current)==null||u.updateOptions(w)},[w],S);let U=Te(()=>{var c;if(!_.current)return;g.current(_.current);let u=G(_.current,e||"",r||n||"text",a||""),s=G(_.current,t||"",i||n||"text",l||"");(c=h.current)==null||c.setModel({original:u,modified:s})},[n,t,i,e,r,a,l]),K=Te(()=>{var u;!k.current&&H.current&&(h.current=_.current.editor.createDiffEditor(H.current,{automaticLayout:!0,...w}),U(),(u=_.current)==null||u.editor.setTheme(v),V(!0),k.current=!0)},[w,v,U]);Re(()=>{S&&M.current(h.current,_.current)},[S]),Re(()=>{!T&&!S&&K()},[T,S,K]),P(()=>{if(h.current&&_.current){let u=h.current.getOriginalEditor(),s=G(_.current,e||"",r||n||"text",a||"");s!==u.getModel()&&u.setModel(s)}},[a],S),P(()=>{if(h.current&&_.current){let u=h.current.getModifiedEditor(),s=G(_.current,t||"",i||n||"text",l||"");s!==u.getModel()&&u.setModel(s)}},[l],S);function I(){var s,c,f,x;let u=(s=h.current)==null?void 0:s.getModel();d||((c=u==null?void 0:u.original)==null||c.dispose()),p||((f=u==null?void 0:u.modified)==null||f.dispose()),(x=h.current)==null||x.dispose()}return Ut.createElement(Ie,{width:R,height:j,isEditorReady:S,loading:E,_ref:H,className:B,wrapperProps:F})}var fn=pn;Bt(fn);const mn=window.React.useState;function gn(){let[e,t]=mn(ce.__getMonacoInstance());return _e(()=>{let n;return e||(n=ce.init(),n.then(r=>{t(r)})),()=>n==null?void 0:n.cancel()}),e}var hn=gn;const wn=window.React.memo,xn=window.React,ke=window.React.useState,de=window.React.useEffect,N=window.React.useRef,yn=window.React.useCallback,bn=window.React.useEffect,vn=window.React.useRef;function _n(e){let t=vn();return bn(()=>{t.current=e},[e]),t.current}var jn=_n,pe=new Map;function Cn({defaultValue:e,defaultLanguage:t,defaultPath:n,value:r,language:i,path:a,theme:l="light",line:d,loading:p="Loading...",options:v={},overrideServices:E={},saveViewState:w=!0,keepCurrentModel:j=!1,width:R="100%",height:B="100%",className:F,wrapperProps:X={},beforeMount:D=oe,onMount:S=oe,onChange:V,onValidate:T=oe}){let[C,h]=ke(!1),[_,H]=ke(!0),M=N(null),g=N(null),k=N(null),U=N(S),K=N(D),I=N(),u=N(r),s=jn(a),c=N(!1),f=N(!1);_e(()=>{let m=ce.init();return m.then(y=>(M.current=y)&&H(!1)).catch(y=>(y==null?void 0:y.type)!=="cancelation"&&console.error("Monaco initialization: error:",y)),()=>g.current?O():m.cancel()}),P(()=>{var y,b,A,$;let m=G(M.current,e||r||"",t||i||"",a||n||"");m!==((y=g.current)==null?void 0:y.getModel())&&(w&&pe.set(s,(b=g.current)==null?void 0:b.saveViewState()),(A=g.current)==null||A.setModel(m),w&&(($=g.current)==null||$.restoreViewState(pe.get(a))))},[a],C),P(()=>{var m;(m=g.current)==null||m.updateOptions(v)},[v],C),P(()=>{!g.current||r===void 0||(g.current.getOption(M.current.editor.EditorOption.readOnly)?g.current.setValue(r):r!==g.current.getValue()&&(f.current=!0,g.current.executeEdits("",[{range:g.current.getModel().getFullModelRange(),text:r,forceMoveMarkers:!0}]),g.current.pushUndoStop(),f.current=!1))},[r],C),P(()=>{var y,b;let m=(y=g.current)==null?void 0:y.getModel();m&&i&&((b=M.current)==null||b.editor.setModelLanguage(m,i))},[i],C),P(()=>{var m;d!==void 0&&((m=g.current)==null||m.revealLine(d))},[d],C),P(()=>{var m;(m=M.current)==null||m.editor.setTheme(l)},[l],C);let x=yn(()=>{var m;if(!(!k.current||!M.current)&&!c.current){K.current(M.current);let y=a||n,b=G(M.current,r||e||"",t||i||"",y||"");g.current=(m=M.current)==null?void 0:m.editor.create(k.current,{model:b,automaticLayout:!0,...v},E),w&&g.current.restoreViewState(pe.get(y)),M.current.editor.setTheme(l),h(!0),c.current=!0}},[e,t,n,r,i,a,v,E,w,l]);de(()=>{C&&U.current(g.current,M.current)},[C]),de(()=>{!_&&!C&&x()},[_,C,x]),u.current=r,de(()=>{var m,y;C&&V&&((m=I.current)==null||m.dispose(),I.current=(y=g.current)==null?void 0:y.onDidChangeModelContent(b=>{f.current||V(g.current.getValue(),b)}))},[C,V]),de(()=>{if(C){let m=M.current.editor.onDidChangeMarkers(y=>{var A;let b=(A=g.current.getModel())==null?void 0:A.uri;if(b&&y.find($=>$.path===b.path)){let $=M.current.editor.getModelMarkers({resource:b});T==null||T($)}});return()=>{m==null||m.dispose()}}return()=>{}},[C,T]);function O(){var m,y;(m=I.current)==null||m.dispose(),j?w&&pe.set(a,g.current.saveViewState()):(y=g.current.getModel())==null||y.dispose(),g.current.dispose()}return xn.createElement(Ie,{width:R,height:B,isEditorReady:C,loading:p,_ref:k,className:F,wrapperProps:X})}var En=Cn,Sn=wn(En),qe=Sn;function J(e){const t=e.match(/^[ \t]*(?=\S)/gm);if(!t)return e;const n=Math.min(...t.map(i=>i.length)),r=new RegExp(`^[ \\t]{${n}}`,"gm");return n>0?e.replace(r,""):e}const ve={base:{js:J(`
    // try it, press \`(Ctrl|Cmd) + E\` to run
    import Awaitabler from 'awaitabler'

    Awaitabler.regAll()
    Awaitabler.use(Awaitabler.questerMiddleware)

    async function main() {
        const resp = /** @type {Response} */ (
            await 'https://jsonplaceholder.typicode.com/todos/1'
        )
        console.log(resp)
        console.log(resp.status)
        console.log(await resp.json())
    }

    main()
    `).trim(),ts:J(`
    // try it, press \`(Ctrl|Cmd) + E\` to run
    import Awaitabler from 'awaitabler'

    Awaitabler.regAll()
    Awaitabler.use(Awaitabler.questerMiddleware)

    async function main() {
        const resp = <Response><unknown>(
            await 'https://jsonplaceholder.typicode.com/todos/1'
        )
        console.log(resp)
        console.log(resp.status)
        console.log(await resp.json())
    }

    main()
    `).trim()},"await.opts":{ts:J(`
    import Awaitabler from 'awaitabler'
    Awaitabler.regAll()
    Awaitabler.use(Awaitabler.questerMiddleware)

    async function main() {
        // \`await Promise.all([...])\`
        const resps = <Response[]><unknown>await [
            'https://jsonplaceholder.typicode.com/todos/1',
            'https://jsonplaceholder.typicode.com/todos/1'
        ]
        console.log('resps', resps)
        // \`await Promise.allSettled([...])\`
        const results = <PromiseSettledResult<Response>[]><unknown>await (
            Promise.reject(1),
            'https://jsonplaceholder.typicode.com/todos/1'
        )
        console.log('results', results)
        // \`await Promise.any([...])\`
        const result = <Response><unknown>await (Promise.reject(1) || 'https://jsonplaceholder.typicode.com/todos/1')
        console.log('result', result)
        // no race
    }
    main()
    `).trim()},middleware:{ts:J(`
    // try it, press \`(Ctrl|Cmd) + E\` to run
    import Awaitabler, {
        use,
        questerMiddleware
    } from 'awaitabler'
    Awaitabler.regAll()

    const effectFuncs = []
    effectFuncs.push(use(async (ctx, next) => {
        if (
            ['http', 'https'].includes(ctx.schema)
            && ctx.tags.includes('get:JSON')
        ) {
            return (
                <Response><unknown>await next()
            ).json()
        }
    }))
    effectFuncs.push(use(questerMiddleware))
    export function dispose() {
        effectFuncs.forEach(f => f())
    }

    interface Todo {
        userId: number
        id: number
        title: string
        completed: boolean
    }
    async function main() {
        const { title, completed } = <Todo><unknown>(
            await '[get:JSON] https://jsonplaceholder.typicode.com/todos/1'
        )
        console.log({ title, completed })
    }
    main()
    `).trim()},"Make number awaitabler":{js:J(`
    // try it, press \`(Ctrl|Cmd) + E\` to run
    import 'awaitabler/prototypes/number'

    async function main() {
        setTimeout(() => console.log('500ms'), 500)
        setTimeout(() => console.log('950ms'), 950)
        await 51e1.ms
        console.log('await 51e1.ms')
        await 0.4.s
        console.log('await 0.4.s')
        await 200..ms
        console.log('await 200..ms')
    }

    main()
    `).trim(),get ts(){return this.js}},"Make `await <number>` abortable":{js:J(`
    // try it, press \`(Ctrl|Cmd) + E\` to run
    import 'awaitabler/prototypes/number'

    async function main() {
        const ac = new AbortController()
        setTimeout(() => ac.abort(null), 100)
        setTimeout(() => console.log('50ms'), 50)
        setTimeout(() => console.log('200ms'), 200)
        setTimeout(() => console.log('1s'), 1000)
        console.log('await 1..s(ac) start')
        await 1..s(ac.signal)
        console.log('await 1..s(ac) end')
    }
    main()
    `).trim(),get ts(){return this.js}}};const Mn=window.React.useRef,On=window.React.useState;function Pn(e){const{value:t,onChange:n}=e,r=Mn([]),[i,a]=On(0),l=d=>{t!==d&&n(d),a(r.current[d?0:1])};return o.jsxs("div",{className:"switcher",children:[o.jsx("div",{ref:d=>(r.current[0]=(d==null?void 0:d.offsetWidth)||0,l(t)),className:"switcher__item",onClick:()=>l(!0),children:e.rText}),o.jsx("div",{ref:d=>(r.current[1]=(d==null?void 0:d.offsetWidth)||0,l(t)),className:"switcher__item",onClick:()=>l(!1),children:e.lText}),o.jsx("div",{className:"switcher__item--bar",style:{transform:`translateX(${t?0:(r.current[0]??0)+5}px)`,width:i}})]})}const Ae=window.React.useEffect,Tn=window.React.useMemo,Rn=window.React.useReducer,kn=window.React.useSyncExternalStore,We="playground-history";let Z;try{Z=JSON.parse(localStorage.getItem(We)||"[]")}catch{Z=[]}const me=[];function An(e){return me.push(e),e(Z),()=>{const t=me.indexOf(e);t!==-1&&me.splice(t,1)}}function Nn(e){Z=e,localStorage.setItem(We,JSON.stringify(Z)),me.forEach(t=>t(Z))}const Ln=[];function Ve(){const e=kn(An,()=>Z??Ln);Ae(()=>{n({type:"set",codes:e})},[e]);const[t,n]=Rn((r,i)=>{switch(i.type){case"add":return[...r,{code:i.code,time:Date.now()}];case"set":return i.codes;case"remove":return r.filter((a,l)=>l!==i.index)}},e);return Ae(()=>{Nn(t)},[t]),[Tn(()=>[...t].reverse(),[t]),n]}const Fn=window.React.useEffect,Dn=window.React.useMemo,In=window.React.useRef,fe=window.React.useState,ee={distCategory:["latest","next","beta","rc","insiders","tag-for-publishing-older-releases","dev"],distTagEnum:{latest:"5.1.6","5.1.6":"latest",next:"5.2.0-dev.20230805","5.2.0-dev.20230805":"next",beta:"5.2.0-beta","5.2.0-beta":"beta",rc:"5.1.1-rc","5.1.1-rc":"rc",insiders:"4.6.2-insiders.20220225","4.6.2-insiders.20220225":"insiders","tag-for-publishing-older-releases":"4.1.6","4.1.6":"tag-for-publishing-older-releases",dev:"3.9.4","3.9.4":"dev"},versions:["5.1.6","5.0.4","4.9.5","4.8.4","4.7.4","4.6.4","4.5.5","4.4.4","4.3.5","4.2.4","4.1.6","4.0.8","3.9.10","3.8.3","3.7.7","3.6.5","3.5.3","3.4.5","3.3.4000","5.1.6","5.2.0-dev.20230805","5.2.0-beta","5.1.1-rc","4.6.2-insiders.20220225","4.1.6","3.9.4"],suggestedVersions:["5.1.6","5.0.4","4.9.5","4.8.4","4.7.4","4.6.4","4.5.5","4.4.4","4.3.5","4.2.4","4.1.6","4.0.8","3.9.10","3.8.3","3.7.7","3.6.5","3.5.3","3.4.5","3.3.4000"]},$n=()=>{const[e,t]=fe(0),[n,r]=fe(!1),[i,a]=fe(null),[l,d]=fe(),p=Dn(()=>new AbortController,[]),v=In(!1);return Fn(()=>{if(!v.current){v.current=!0;return}return n||(r(!0),fetch("https://registry.npmmirror.com/-/package/typescript/dist-tags",{signal:p.signal}).then(E=>E.json()).then(E=>{d(E),a(null)}).catch(a).finally(()=>r(!1))),()=>p.abort()},[e]),{data:l,fetching:n,error:i,reFetch:()=>t(e+1)}},q=window.React.useEffect,te=window.React.useRef,L=window.React.useState,He=window.React.forwardRef,Ke=window.React.useImperativeHandle,Y=window.React.useMemo,Ze=window.ReactDOM.createPortal,qn=5,Wn="500px",Vn=Object.assign({"../plugins/comment-queries/index.ts":ze,"../plugins/outputs/index.tsx":Je}),Hn=Object.assign({"../../../src/await-auto-box.ts":Ye,"../../../src/index.ts":Qe,"../../../src/package.json":Ge,"../../../src/plugins/quester.ts":Xe,"../../../src/prototypes/number.reg.ts":et,"../../../src/prototypes/number.ts":tt,"../../../src/prototypes/string.reg.ts":nt,"../../../src/prototypes/string.ts":rt,"../../../src/prototypes/utils.ts":ot,"../../../src/tags.ts":it}),Kn=Object.entries(Object.assign({},Hn)).reduce((e,[t,n])=>e.concat({filePath:t.replace(/^.*\/src/,"/node_modules/awaitabler").replace(/^\.\//,""),content:n}),[]),Zn={moduleResolution:2,declaration:!0};function Bn(e){const t=document.createElement("input");t.value=e,document.body.appendChild(t),t.select(),document.execCommand("copy"),document.body.removeChild(t)}function Un(e,t,n){e.addCommand(t.KeyMod.CtrlCmd|t.KeyCode.KeyS,()=>{const r=e.getValue();history.pushState(null,"","#"+btoa(encodeURIComponent(r))),Bn(location.href),e.focus(),n(r)}),e.addCommand(t.KeyMod.CtrlCmd|t.KeyCode.KeyE,()=>Q.send("run")),e.addCommand(t.KeyMod.CtrlCmd|t.KeyCode.UpArrow,function(){}),e.addCommand(t.KeyMod.CtrlCmd|t.KeyCode.DownArrow,function(){}),e.focus()}const zn=He(function({},t){const[n,r]=L(!1);Ke(t,()=>({open:()=>r(!0),hide:()=>r(!1)}),[]);const i=navigator.platform.includes("Mac"),a=i?"⌘":"Ctrl",l=i?"⌃":"Ctrl";return q(()=>{const d=p=>{p.key==="/"&&(p.metaKey||p.ctrlKey)&&r(!0)};return document.addEventListener("keydown",d),()=>document.removeEventListener("keydown",d)},[]),q(()=>{if(n){const d=p=>{p.key==="Escape"&&r(!1)};return document.addEventListener("keyup",d),()=>document.removeEventListener("keyup",d)}},[n]),Ze(o.jsx("dialog",{className:"help",autoFocus:!0,open:n,children:o.jsxs("div",{className:"dialog__container",children:[o.jsxs("div",{className:"dialog__title",children:[o.jsx("h1",{children:"帮助"}),o.jsx("button",{className:"dialog__close",onClick:()=>r(!1),children:"×"})]}),o.jsxs("div",{className:"dialog__content",children:[o.jsx("h2",{children:"快捷键"}),o.jsxs("ul",{children:[o.jsxs("li",{children:[o.jsxs("code",{children:[a," + S"]}),": 保存并复制链接"]}),o.jsxs("li",{children:[o.jsxs("code",{children:[a," + E"]}),": 执行代码"]}),o.jsxs("li",{children:[o.jsxs("code",{children:[a," + H"]}),": 历史代码（",a," + S 保存下来的代码）"]}),o.jsxs("li",{children:[o.jsxs("code",{children:[l," + /"]}),": 查看帮助"]})]}),o.jsx("h2",{children:"支持的语言"}),o.jsxs("ul",{children:[o.jsx("li",{children:o.jsx("code",{children:"JavaScript"})}),o.jsx("li",{children:o.jsx("code",{children:"TypeScript"})})]})]})]})}),document.body,"help-dialog")}),Jn=He(function({theme:t,onChange:n},r){const[i,a]=L(!1);Ke(r,()=>({open:()=>a(!0),hide:()=>a(!1)}),[]),q(()=>{const w=j=>{j.key==="h"&&(j.metaKey||j.ctrlKey)&&a(!0)};return document.addEventListener("keydown",w),()=>document.removeEventListener("keydown",w)},[]),q(()=>{if(i){const w=j=>{j.key==="Escape"&&a(!1),j.key==="ArrowUp"&&v(R=>(R+l.length-1)%l.length),j.key==="ArrowDown"&&v(R=>(R+1)%l.length),j.key==="Enter"&&(n==null||n(E),a(!1))};return document.addEventListener("keyup",w),()=>document.removeEventListener("keyup",w)}},[i]);const[l,d]=Ve(),[p,v]=L(0),E=Y(()=>l[p],[l,p]);return Ze(o.jsx("dialog",{className:"history",autoFocus:!0,open:i,children:o.jsxs("div",{className:"dialog__container",children:[o.jsxs("div",{className:"dialog__title",children:[o.jsx("h5",{children:"历史记录"}),o.jsxs("span",{children:[o.jsx("code",{children:"↑/↓"}),"(选择)"]}),o.jsxs("span",{children:[o.jsx("code",{children:"Enter"}),"(确认)"]}),o.jsx("button",{className:"dialog__close",onClick:()=>a(!1),children:"×"})]}),i&&o.jsxs("div",{className:"dialog__content",children:[o.jsx("div",{className:"history__list",children:l.map((w,j)=>o.jsxs("div",{className:"history__item"+(j===p?" history__item--selected":""),onClick:()=>v(j),children:[o.jsx("pre",{className:"history__item__code",children:w.code}),o.jsx("div",{className:"history__item__time",children:new Date(w.time).toLocaleString()})]},w.time))}),o.jsx("div",{className:"preview",children:o.jsx(qe,{height:"100%",width:"100%",theme:t==="light"?"vs":"vs-dark",language:"javascript",value:(E==null?void 0:E.code)??"",options:{readOnly:!0,minimap:{enabled:!1},scrollbar:{vertical:"hidden"}}})})]})]})}),document.body,"history-dialog")});function Yn(){const e=new URLSearchParams(location.search),[t,n]=L(e.get("lang")==="js"?"js":"ts");function r(s){n(s),e.set("lang",s),history.replaceState(null,"","?"+e.toString()+location.hash)}const i=Y(()=>`/index.${t}`,[t]),[a,l]=L(e.get("ts")??ee.versions[0]);function d(s){var x;l(s),e.set("ts",s);const c=(x=T.current)==null?void 0:x.getValue(),f=c?"#"+btoa(encodeURIComponent(c)):"";history.replaceState(null,"","?"+e.toString()+f),location.reload()}const{data:p,fetching:v,error:E}=$n(),w=Y(()=>E!==null&&p?p:null,[p,E]),j=Y(()=>w?Object.fromEntries(Object.entries(w).flatMap(([s,c])=>[[s,c],[c,s]])):ee.distTagEnum,[p]),R=Y(()=>w?Object.keys(w):ee.distCategory,[w]),B=Y(()=>ee.suggestedVersions.indexOf(a)===-1,[a]),F=location.hash.slice(1),[X,D]=L(F?decodeURIComponent(atob(F)):ve.base[t]),[S,V]=L(F?"":"base"),T=te(null),C=te([]),h=hn();q(()=>{if(!h)return;let s;t==="js"?s=h.languages.typescript.javascriptDefaults:s=h.languages.typescript.typescriptDefaults,s.setCompilerOptions({...s.getCompilerOptions(),...Zn}),Kn.forEach(({content:f,filePath:x})=>{h.editor.createModel(f,t==="js"?"javascript":"typescript",h.Uri.parse(x))}),console.group("monaco detail data"),console.log("typescript.version",h.languages.typescript.typescriptVersion),console.log("typescript.CompilerOptions",h.languages.typescript.typescriptDefaults.getCompilerOptions()),console.groupEnd();const c=Object.values(Vn).reduce((f,x)=>{var O;return x.editor?f.concat((O=x.editor)==null?void 0:O.call(x,h)):f},[]);return()=>{c.forEach(f=>f()),h.editor.getModels().forEach(f=>{f.uri.path!==i&&f.dispose()})}},[t,h]);const _=te();q(()=>Q.on("compile",()=>{_.current&&Q.send("compile-completed",_.current.outputFiles)}),[]);const H=B?j==null?void 0:j[a]:a;ce.config({paths:{vs:`https://typescript.azureedge.net/cdn/${H}/monaco/min/vs`}});const[M,g]=L();q(()=>{function s(c){c.target instanceof HTMLScriptElement&&c.target.src.startsWith("https://typescript.azureedge.net/cdn/")&&g(`TypeScript@${a} unavailable`)}return window.addEventListener("error",s,!0),()=>window.removeEventListener("error",s)},[]);const[k,U]=L("light");q(()=>onThemeChange(U),[]);const K=te(null),I=te(null),[,u]=Ve();return o.jsxs("div",{className:"editor-zone",ref:async s=>{let c;do await new Promise(b=>setTimeout(b,100)),c=s==null?void 0:s.querySelector(":scope > section > div");while((c==null?void 0:c.innerText)==="Loading...");if(!c)return;let f,x=!1;function O(b){const A=b.x-f,$=parseInt(getComputedStyle(c,"").width)+A;f=b.x,c.style.setProperty("width",$+"px","important"),c.style.minWidth="5px"}function m(b){b.offsetX>c.offsetWidth-qn&&(f=b.x,x?c.style.width=Wn:(x=!0,setTimeout(()=>x=!1,1e3)),document.querySelectorAll("iframe").forEach(A=>{A.style.pointerEvents="none"}),document.addEventListener("mousemove",O,!1),c.style.userSelect="none")}function y(){c.style.userSelect="auto",document.removeEventListener("mousemove",O,!1),document.querySelectorAll("iframe").forEach(b=>{b.style.pointerEvents="auto"})}C.current.forEach(b=>b()),C.current=[],c.addEventListener("mousedown",m,!1),document.addEventListener("mouseup",y),C.current.push(()=>{c.removeEventListener("mousedown",m),document.removeEventListener("mouseup",y)})},children:[o.jsx(zn,{ref:K}),o.jsx(Jn,{theme:k,ref:I,onChange:s=>D(s.code)}),o.jsxs("div",{className:"menu",children:[o.jsxs("div",{className:"btns",children:[o.jsx("button",{className:"excute",onClick:()=>Q.send("run"),children:"Execute"}),o.jsx("button",{className:"history",onClick:()=>{var s;return(s=I.current)==null?void 0:s.open()},children:"History"}),o.jsx("button",{className:"help",onClick:()=>{var s;return(s=K.current)==null?void 0:s.open()},children:"Help"})]}),o.jsxs("div",{className:"opts",children:[o.jsxs("select",{value:S,onChange:s=>{var x;const c=s.target.value,f=(x=ve[c])==null?void 0:x[t];if(!f){alert("示例暂未添加"),s.target.value=S;return}D(f),V(c)},children:[o.jsx("option",{value:"base",children:"基本示例"}),o.jsx("option",{value:"await.opts",children:"控制流"}),o.jsx("option",{value:"middleware",children:"中间件"}),o.jsx("option",{value:"Make number awaitabler",children:"数字也可以！"}),o.jsx("option",{value:"Make `await <number>` abortable",children:"终止对数字的等待"})]}),o.jsx(Pn,{lText:o.jsx("div",{style:{position:"relative",width:24,height:24,backgroundColor:"#4272ba"},children:o.jsx("span",{style:{position:"absolute",right:1,bottom:-2,transform:"scale(0.6)",fontWeight:"blob"},children:"TS"})}),rText:o.jsx("div",{style:{position:"relative",width:24,height:24,backgroundColor:"#f2d949"},children:o.jsx("span",{style:{position:"absolute",right:1,bottom:-2,transform:"scale(0.6)",fontWeight:"blob",color:"black"},children:"JS"})}),value:t==="js",onChange:s=>{var c;if(!F){const f=(c=ve[S])==null?void 0:c[s?"js":"ts"];if(!f){alert("示例暂未添加");return}D(f)}r(s?"js":"ts")}}),o.jsxs("select",{value:a,onChange:s=>d(s.target.value),children:[o.jsx("optgroup",{label:"Suggested versions",children:ee.suggestedVersions.map(s=>{const c=(s==="3.3.3333"?"3.3.3":s==="3.3.4000"?"3.3.4":s)+(j[s]?` (${j[s]})`:"");return o.jsx("option",{value:s,title:c,children:c.length>15?c.slice(0,12)+"...":c},s)})}),o.jsx("option",{value:"",disabled:!0,children:"——————————"}),o.jsx("optgroup",{label:"Other versions",children:R.map(s=>o.jsx("option",{value:s,title:`${s} (${j[s]})`,children:s.length>15?s.slice(0,12)+"...":s},s))})]})]})]}),B&&v?o.jsx("div",{className:"fetching",children:"Fetching..."}):o.jsx(qe,{language:{js:"javascript",ts:"typescript"}[t],options:{automaticLayout:!0,scrollbar:{vertical:"hidden",verticalSliderSize:0,verticalScrollbarSize:0}},theme:k==="light"?"vs":"vs-dark",loading:o.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"},children:[o.jsx("div",{style:{position:"relative",width:72,height:72,backgroundColor:"#4272ba",userSelect:"none"},children:o.jsx("span",{style:{position:"absolute",right:5,bottom:-2,fontSize:30,fontWeight:"blob"},children:"TS"})}),M?o.jsx("span",{children:M}):o.jsxs("span",{children:["Downloading TypeScript@",o.jsx("code",{children:a})," ..."]})]}),path:`file://${i}`,value:X,onChange:s=>D(s??""),onMount:(s,c)=>{T.current=s,s.onDidChangeModelContent(function f(){const x=s.getModel();return x&&(c==null||c.languages.typescript.getTypeScriptWorker().then(O=>O(x.uri)).then(O=>O.getEmitOutput(x.uri.toString())).then(O=>{_.current=O,Q.send("compile-completed",O.outputFiles)})),f}()),Un(s,c,f=>u({type:"add",code:f}))}},a)]})}const Qn=window.React.useState,re="theme";let ie=null;const Be=[];window.onThemeChange=function(e){Be.push(e),ie&&e(ie,ie==="auto")};function se(e){const t=localStorage.getItem(re)??"auto";t!=="auto"?e=t:e===void 0&&(e=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":""),ie=e||"light",Be.forEach(n=>n(ie,t==="auto")),e==="dark"?document.documentElement.setAttribute("theme-mode","dark"):document.documentElement.removeAttribute("theme-mode")}se();window.matchMedia("(prefers-color-scheme: dark)").addListener(e=>{se(e.matches?"dark":"")});function Gn(){const[e,t]=Qn(localStorage.getItem(re)??"auto");return o.jsxs("div",{className:"theme-switch","data-mode":e,children:[o.jsx("div",{className:"light",onClick:()=>{t("light"),localStorage.setItem(re,"light"),se()},children:o.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 20 20",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:[o.jsx("path",{fill:"currentColor",d:"M9.99996 3.15217C10.5252 3.15217 10.951 2.72636 10.951 2.20109C10.951 1.67582 10.5252 1.25 9.99996 1.25C9.47469 1.25 9.04887 1.67582 9.04887 2.20109C9.04887 2.72636 9.47469 3.15217 9.99996 3.15217Z"}),o.jsx("path",{fill:"currentColor",d:"M9.99992 4.29348C6.84829 4.29348 4.2934 6.84838 4.2934 10C4.2934 13.1516 6.84829 15.7065 9.99992 15.7065C13.1515 15.7065 15.7064 13.1516 15.7064 10C15.7064 6.84838 13.1515 4.29348 9.99992 4.29348Z"}),o.jsx("path",{fill:"currentColor",d:"M16.4673 4.4837C16.4673 5.00896 16.0415 5.43478 15.5162 5.43478C14.991 5.43478 14.5652 5.00896 14.5652 4.4837C14.5652 3.95843 14.991 3.53261 15.5162 3.53261C16.0415 3.53261 16.4673 3.95843 16.4673 4.4837Z"}),o.jsx("path",{fill:"currentColor",d:"M17.7989 10.9511C18.3241 10.9511 18.75 10.5253 18.75 10C18.75 9.47474 18.3241 9.04891 17.7989 9.04891C17.2736 9.04891 16.8478 9.47474 16.8478 10C16.8478 10.5253 17.2736 10.9511 17.7989 10.9511Z"}),o.jsx("path",{fill:"currentColor",d:"M16.4673 15.5163C16.4673 16.0416 16.0415 16.4674 15.5162 16.4674C14.991 16.4674 14.5652 16.0416 14.5652 15.5163C14.5652 14.991 14.991 14.5652 15.5162 14.5652C16.0415 14.5652 16.4673 14.991 16.4673 15.5163Z"}),o.jsx("path",{fill:"currentColor",d:"M9.99996 18.75C10.5252 18.75 10.951 18.3242 10.951 17.7989C10.951 17.2736 10.5252 16.8478 9.99996 16.8478C9.47469 16.8478 9.04887 17.2736 9.04887 17.7989C9.04887 18.3242 9.47469 18.75 9.99996 18.75Z"}),o.jsx("path",{fill:"currentColor",d:"M5.43469 15.5163C5.43469 16.0416 5.00887 16.4674 4.4836 16.4674C3.95833 16.4674 3.53252 16.0416 3.53252 15.5163C3.53252 14.991 3.95833 14.5652 4.4836 14.5652C5.00887 14.5652 5.43469 14.991 5.43469 15.5163Z"}),o.jsx("path",{fill:"currentColor",d:"M2.20096 10.9511C2.72623 10.9511 3.15205 10.5253 3.15205 10C3.15205 9.47474 2.72623 9.04891 2.20096 9.04891C1.67569 9.04891 1.24988 9.47474 1.24988 10C1.24988 10.5253 1.67569 10.9511 2.20096 10.9511Z"}),o.jsx("path",{fill:"currentColor",d:"M5.43469 4.4837C5.43469 5.00896 5.00887 5.43478 4.4836 5.43478C3.95833 5.43478 3.53252 5.00896 3.53252 4.4837C3.53252 3.95843 3.95833 3.53261 4.4836 3.53261C5.00887 3.53261 5.43469 3.95843 5.43469 4.4837Z"})]})}),o.jsx("div",{className:"dark",onClick:()=>{t("dark"),localStorage.setItem(re,"dark"),se()},children:o.jsx("svg",{width:"20",height:"20",viewBox:"0 0 20 20",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:o.jsx("path",{fill:"currentColor",d:"M9.99993 3.12494C6.20294 3.12494 3.12488 6.203 3.12488 10C3.12488 13.797 6.20294 16.8751 9.99993 16.8751C13.7969 16.8751 16.875 13.797 16.875 10C16.875 9.52352 16.8264 9.0577 16.7337 8.6075C16.6752 8.32295 16.4282 8.11628 16.1378 8.10872C15.8474 8.10117 15.5901 8.29473 15.5168 8.57585C15.1411 10.0167 13.8302 11.0795 12.2727 11.0795C10.4212 11.0795 8.92039 9.57869 8.92039 7.72726C8.92039 6.16969 9.98319 4.85879 11.4241 4.48312C11.7052 4.40983 11.8988 4.15249 11.8912 3.86207C11.8836 3.57165 11.677 3.32473 11.3924 3.26616C10.9422 3.1735 10.4764 3.12494 9.99993 3.12494Z"})})}),o.jsxs("div",{className:"auto",title:"auto detect by system",style:{transform:"rotate(45deg)"},onClick:()=>{t("auto"),localStorage.setItem(re,"auto"),se()},children:[o.jsxs("svg",{width:"10",height:"20",viewBox:"0 0 10 20",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:[o.jsx("path",{fill:"currentColor",d:"M9.99996 3.15217C10.5252 3.15217 10.951 2.72636 10.951 2.20109C10.951 1.67582 10.5252 1.25 9.99996 1.25C9.47469 1.25 9.04887 1.67582 9.04887 2.20109C9.04887 2.72636 9.47469 3.15217 9.99996 3.15217Z"}),o.jsx("path",{fill:"currentColor",d:"M9.99992 4.29348C6.84829 4.29348 4.2934 6.84838 4.2934 10C4.2934 13.1516 6.84829 15.7065 9.99992 15.7065C13.1515 15.7065 15.7064 13.1516 15.7064 10C15.7064 6.84838 13.1515 4.29348 9.99992 4.29348Z"}),o.jsx("path",{fill:"currentColor",d:"M16.4673 4.4837C16.4673 5.00896 16.0415 5.43478 15.5162 5.43478C14.991 5.43478 14.5652 5.00896 14.5652 4.4837C14.5652 3.95843 14.991 3.53261 15.5162 3.53261C16.0415 3.53261 16.4673 3.95843 16.4673 4.4837Z"}),o.jsx("path",{fill:"currentColor",d:"M17.7989 10.9511C18.3241 10.9511 18.75 10.5253 18.75 10C18.75 9.47474 18.3241 9.04891 17.7989 9.04891C17.2736 9.04891 16.8478 9.47474 16.8478 10C16.8478 10.5253 17.2736 10.9511 17.7989 10.9511Z"}),o.jsx("path",{fill:"currentColor",d:"M16.4673 15.5163C16.4673 16.0416 16.0415 16.4674 15.5162 16.4674C14.991 16.4674 14.5652 16.0416 14.5652 15.5163C14.5652 14.991 14.991 14.5652 15.5162 14.5652C16.0415 14.5652 16.4673 14.991 16.4673 15.5163Z"}),o.jsx("path",{fill:"currentColor",d:"M9.99996 18.75C10.5252 18.75 10.951 18.3242 10.951 17.7989C10.951 17.2736 10.5252 16.8478 9.99996 16.8478C9.47469 16.8478 9.04887 17.2736 9.04887 17.7989C9.04887 18.3242 9.47469 18.75 9.99996 18.75Z"}),o.jsx("path",{fill:"currentColor",d:"M5.43469 15.5163C5.43469 16.0416 5.00887 16.4674 4.4836 16.4674C3.95833 16.4674 3.53252 16.0416 3.53252 15.5163C3.53252 14.991 3.95833 14.5652 4.4836 14.5652C5.00887 14.5652 5.43469 14.991 5.43469 15.5163Z"}),o.jsx("path",{fill:"currentColor",d:"M2.20096 10.9511C2.72623 10.9511 3.15205 10.5253 3.15205 10C3.15205 9.47474 2.72623 9.04891 2.20096 9.04891C1.67569 9.04891 1.24988 9.47474 1.24988 10C1.24988 10.5253 1.67569 10.9511 2.20096 10.9511Z"}),o.jsx("path",{fill:"currentColor",d:"M5.43469 4.4837C5.43469 5.00896 5.00887 5.43478 4.4836 5.43478C3.95833 5.43478 3.53252 5.00896 3.53252 4.4837C3.53252 3.95843 3.95833 3.53261 4.4836 3.53261C5.00887 3.53261 5.43469 3.95843 5.43469 4.4837Z"})]}),o.jsx("svg",{width:"10",height:"20",viewBox:"10 0 10 20",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:o.jsx("path",{fill:"currentColor",d:"M9.99993 3.12494C6.20294 3.12494 3.12488 6.203 3.12488 10C3.12488 13.797 6.20294 16.8751 9.99993 16.8751C13.7969 16.8751 16.875 13.797 16.875 10C16.875 9.52352 16.8264 9.0577 16.7337 8.6075C16.6752 8.32295 16.4282 8.11628 16.1378 8.10872C15.8474 8.10117 15.5901 8.29473 15.5168 8.57585C15.1411 10.0167 13.8302 11.0795 12.2727 11.0795C10.4212 11.0795 8.92039 9.57869 8.92039 7.72726C8.92039 6.16969 9.98319 4.85879 11.4241 4.48312C11.7052 4.40983 11.8988 4.15249 11.8912 3.86207C11.8836 3.57165 11.677 3.32473 11.3924 3.26616C10.9422 3.1735 10.4764 3.12494 9.99993 3.12494Z"})})]}),o.jsx("div",{className:"cur-card"})]})}const Xn=window.React.useEffect;function er(){return Xn(()=>onThemeChange(e=>Q.send("update:localStorage",["uiTheme",{light:"default",dark:"dark"}[e]])),[]),o.jsxs(o.Fragment,{children:[o.jsxs("header",{children:[o.jsx("h1",{style:{margin:0},children:o.jsx("a",{href:"https://github.com/NWYLZW/awaitabler",style:{color:"#fff",textDecoration:"none"},children:"Awaitabler"})}),o.jsx(Gn,{})]}),o.jsxs("div",{className:"main",children:[o.jsx(Yn,{}),o.jsx("iframe",{src:"./eval-logs.html",frameBorder:0,className:"eval-logs"})]})]})}const tr=window.React;Ue.createRoot(document.getElementById("root")).render(o.jsx(tr.StrictMode,{children:o.jsx(er,{})}));
