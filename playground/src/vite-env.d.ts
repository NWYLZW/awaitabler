/// <reference types="vite/client" />

declare global {
  /**
   * run code in iframe
   */
  export function runCode(code: string, lang: string): void
}

export {}

