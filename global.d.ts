import '../monaco/monaco'

declare global {
    export var define: Function & Record<string, any>
    export var exports: Record<string, any>
    export var awaitabler: typeof import('./index')
    /**
     * copy content to clipboard
     */
    export function copyToClipboard(content: string): void
    /**
     * base64 encode and decode
     */
    export function base64(str: string, isDecode = true): string
}

export {}
