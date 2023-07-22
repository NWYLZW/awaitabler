/// <reference types="vite/client" />

declare global {
  /**
   * run code in iframe
   */
  export function dododo(code: string, lang: string): void
  export function onThemeChange(fn: (theme: string) => void): void
}

export {}

