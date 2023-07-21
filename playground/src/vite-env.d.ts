/// <reference types="vite/client" />

declare global {
  /**
   * run code in iframe
   */
  export function run(code: string, lang: string): void
}

export {}

