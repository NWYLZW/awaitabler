import { build, BuildOptions } from 'esbuild'

const common: BuildOptions = {
  entryPoints: ['src/index.ts'],

  bundle: true,
  sourcemap: true,
  target: 'es2019'
}

const targets: BuildOptions[] = [
  {
    platform: 'browser',
    format: 'iife',
    outfile: 'src/dist/index.browser.js',
    define: {
      MODE: '"browser"'
    },
  },
  {
    platform: 'browser',
    format: 'esm',
    outfile: 'src/dist/index.browser.mjs',
    define: {
      MODE: '"browser"'
    },
  },
  {
    platform: 'node',
    format: 'cjs',
    outfile: 'src/dist/index.cjs',
    define: {
      MODE: '"cjs"'
    },
  },
  {
    platform: 'node',
    format: 'esm',
    outfile: 'src/dist/index.mjs',
    define: {
      MODE: '"esm"'
    },
  },
]

Promise.all(targets.map(t => build({ ...common, ...t })))
