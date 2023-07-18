declare global {
  interface String {
    (): Promise<Response>
    f: Promise<Response> & {
      <T = unknown>(
        init?: RequestInit, input?: Omit<Request, 'url'>
      ): Promise<[T] extends [unknown] ? Response : T>
    }
  }
}

export = Awaitabler
export as namespace Awaitabler

declare namespace Awaitabler {
  export interface Context {
    readonly url: URL
    readonly searchParams: URLSearchParams
    readonly type: 'fetch' | ''
    readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE'
  }
  export interface Middleware {
    (ctx: Context, next: () => Promise<void>): void | Promise<void>
  }
  export interface DefineMiddleware {
    (mid: Middleware): DefineMiddleware
  }
  export var defineMiddleware: DefineMiddleware
  export function registerString(): void
}
