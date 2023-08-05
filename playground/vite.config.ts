import path from 'node:path'
import semver from 'semver'
import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'
import { viteExternalsPlugin } from 'vite-plugin-externals'

import { visualizer } from 'rollup-plugin-visualizer'

const promise = fetch('https://registry.npmjs.org/typescript').then<{
  'dist-tags': Record<string, string>
  versions: Record<string, unknown>
}>(res => res.json())

// https://vitejs.dev/config/
export default defineConfig(async env => {
  const typescriptPackages = await promise

  const distTags = typescriptPackages['dist-tags']

  const allVersions = Object.keys(typescriptPackages.versions)
  const versionMap = allVersions
    .filter(version => semver.satisfies(version, '>=3.3.0'))
    // only ^x.y
    .sort((v1, v2) => semver.compare(v2, v1))
    .reduce((acc, version) => {
      const major = semver.major(version)
      const minor = semver.minor(version)
      const patch = semver.patch(version)
      const key = `${major}.${minor}`
      const value = `${major}.${minor}.${patch}`
      if (acc[key] === undefined) {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, string>)
  const suggestedVersions = Object.values(versionMap)
  const versions = suggestedVersions.concat(Object.values(distTags))

  const distTagEnum = Object.fromEntries(
    Object.entries(distTags).flatMap(([key, value]) => [[key, value], [value, key]])
  )
  const distCategory = Object.keys(distTags)

  const TYPESCRIPT_VERSIONS_META = JSON.stringify({
    distCategory,
    distTagEnum,
    versions,
    suggestedVersions,
  })

  return {
    base: process.env.BASE === 'None'
      ? ''
      : (process.env.BASE ?? '/awaitabler/'),
    plugins: [
      react(),
      env.mode === 'production' ? viteExternalsPlugin({
        '@babel/standalone': 'Babel',
        'react': 'React',
        'react-dom': 'ReactDOM',
      }) : null
    ],
    // resolve: {
    //   alias: {
    //     '@monaco-editor/loader': '@monaco-editor/loader/lib/es/index.js',
    //   }
    // },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          'eval-logs': path.resolve(__dirname, 'eval-logs.html')
        },
        plugins: [visualizer()]
      }
    },
    define: {
      MODE: '"esm"',
      TYPESCRIPT_VERSIONS_META,
    }
  }
})
