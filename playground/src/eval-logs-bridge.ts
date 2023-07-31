import { IframeBridge } from './iframe-bridge.ts'

export type EvalLogsIframeEvent =
| {
  type: 'run'
}
| {
  type: 'compile-completed'
  data: {
    name: string
    text: string
  }[]
}
| {
  type: 'update:localStorage'
  data: [key: string, value: any]
}

export const evalLogsBridge = new IframeBridge<EvalLogsIframeEvent>(
  () => document.querySelector<HTMLIFrameElement>('iframe.eval-logs'),
  location.origin
)
