interface IframeEvent {
  type: string
  data?: unknown
}

export class IframeBridge<Events extends IframeEvent> {
  private readonly listeners: Map<string, Function[]> = new Map()

  constructor(
    private readonly iframe: () => (HTMLIFrameElement | null),
    private readonly targetOrigin: string
  ) {
    window.addEventListener('message', e => {
      if (e.origin !== targetOrigin) {
        return
      }
      const listeners = this.listeners.get(e.data.type)
      if (listeners) {
        listeners.forEach(func => func(e.data.data))
      }
    })
  }

  send<
    T extends Events['type']
  >(type: T, data?: Extract<Events, { type: T }>['data']) {
    this.iframe()?.contentWindow?.postMessage({ type, data }, this.targetOrigin)
  }

  on<
    T extends Events['type']
  >(type: T, func: (data: Extract<Events, { type: T }>['data']) => void) {
    const listeners = this.listeners.get(type)
    if (listeners) {
      listeners.push(func)
    } else {
      this.listeners.set(type, [func])
    }
  }
}
