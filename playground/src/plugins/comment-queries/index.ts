import { definePlugins } from '../index.tsx'
import * as monacoEditor from 'monaco-editor'

export default definePlugins({
  editor(monaco) {
    const inlayHintsProviderDisposable = monaco.languages.registerInlayHintsProvider('typescript', {
      async provideInlayHints(model, _, cancel) {
        if (model.isDisposed()) return

        const worker = await (
          await monaco.languages.typescript.getTypeScriptWorker()
        )(model.uri)

        const hints: monacoEditor.languages.InlayHint[] = []
        const queryRegex = /^\s*\/\/\s*\^\?$/gm

        const text = model.getValue()
        let match: RegExpExecArray | null

        while ((match = queryRegex.exec(text)) !== null) {
          const end = match.index + match[0].length - 1
          const endPos = model.getPositionAt(end)
          const inspectionPos = new monaco.Position(endPos.lineNumber - 1, endPos.column)
          const inspectionOff = model.getOffsetAt(inspectionPos)

          if (cancel.isCancellationRequested) {
            return { hints: [], dispose: () => {} }
          }

          const hint = await worker.getQuickInfoAtPosition("file://" + model.uri.path, inspectionOff) as {
            displayParts: {
              text: string
              kind: string
            }[]
            documentation: string[]
            kind: string
            kindModifiers: string
            tags: unknown
            textSpan: { start: number, length: number }
          }
          if (!hint || !hint.displayParts) continue

          let text = hint.displayParts.map(d => d.text).join("").replace(/\r?\n\s*/g, " ")
          if (text.length > 120) text = text.slice(0, 119) + "..."

          hints.push({
            // @ts-ignore
            kind: 0,
            position: new monaco.Position(endPos.lineNumber, endPos.column + 1),
            label: text,
            paddingLeft: true,
          })
        }
        return { hints, dispose: () => void 0 }
      }
    })
    return () => inlayHintsProviderDisposable.dispose()
  }
})
