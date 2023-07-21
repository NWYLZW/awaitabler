/// <reference types="vite/client" />

declare global {
  /**
   * copy content to clipboard
   */
  export function copyToClipboard(content: string): void
  /**
   * run code in iframe
   */
  export function run(code: string, lang: string): void
}

export {}

