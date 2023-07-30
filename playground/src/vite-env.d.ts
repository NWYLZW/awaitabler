/// <reference types="vite/client" />

declare global {
  /**
   * run code in iframe
   */
  export function dododo(code: string, lang: string): void
  /**
   * update iframe localStorage
   */
  export function updateLocalStorage(key: string, data: unknown): void
  export function onThemeChange(fn: (theme: string, isAuto: boolean) => void): void
}

export {}

