import * as Self from './index'
import { configure } from './configure'

export default Self

export * from './tags'
export * from './quester'

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
  regNumber()
  regString()
}
