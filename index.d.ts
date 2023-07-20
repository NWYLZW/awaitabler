declare global {
  export interface StringFunction {
    <T extends Record<string, unknown>>(config: T): Promise<T>
    <T extends string>(arr: ReadonlyArray<string> & {
      readonly raw: readonly string[]
    }, s: T): Promise<T>
  }
  export const StringFunctionConstructor: (str: string) => StringFunction
  interface String extends StringFunction {
    then: Promise<unknown>['then']
    f: Promise<Response> & {
      <T = unknown>(
        init?: RequestInit, input?: Omit<Request, 'url'>
      ): Promise<[T] extends [unknown] ? Response : T>
    }
  }
  interface Window {
    StringFunction: typeof StringFunctionConstructor
  }
}

export = Awaitabler
export as namespace Awaitabler

declare namespace Awaitabler {
  export interface Context {
    schema: string
  }
  export interface Middleware {
    (ctx: Context, next: () => Promise<void>): void | Promise<void>
  }
  export interface DefineMiddleware {
    (mid: Middleware): DefineMiddleware
  }
  export var defineMiddleware: DefineMiddleware

  export function supportFetch(): void

  export function registerString(): void
  export function registerAll(): void
}
