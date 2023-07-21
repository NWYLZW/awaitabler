require('esbuild-register/dist/node').register({
  define: { MODE: '"cjs"' },
  target: `node${process.version.slice(1)}`,
})
