require('esbuild-register/dist/node').register({
  define: {
    MODE: '"cjs"',
    'import.meta': '{}'
  },
  target: `node${process.version.slice(1)}`,
})
