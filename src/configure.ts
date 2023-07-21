export let configure: {
  defaultSchema: string
}

;MODE === 'cjs' && (() => {
  configure = {
    defaultSchema: process.env.DEFAULT_SCHEMA || 'http'
  }
})()
;MODE === 'esm' && (() => {
  configure = {
    // @ts-ignore
    defaultSchema: import.meta.env.DEFAULT_SCHEMA || 'http'
  }
})()
