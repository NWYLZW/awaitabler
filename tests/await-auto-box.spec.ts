import { transformSync } from '@babel/core'

import * as fs from 'node:fs'
import path from 'node:path'

import awaitAutoBox from 'awaitabler/await-auto-box'
import { expect } from 'chai'

describe('Await Auto Box', function () {
  it('should transform right by Babel.', () => {
    const commonFileContent = fs
      .readFileSync(path.resolve(__dirname,
        './examples/common.js'
      ), 'utf-8').trim()
    const commonOutputFileContent = fs
      .readFileSync(path.resolve(__dirname,
        './examples/common.output.js'
      ), 'utf-8').trim()
    const { code } = transformSync(commonFileContent, { plugins: [awaitAutoBox] })
    expect(code).to.equal(commonOutputFileContent)
  })
})
