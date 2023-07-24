import { transformSync } from '@babel/core'

import * as fs from 'node:fs'
import * as path from 'node:path'

import awaitAutoBox from 'awaitabler/await-auto-box'
import { expect } from 'chai'

describe('Await Auto Box', function () {
  it('should transform right by Babel.', () => {
    const cases = ['await_with_arguments', 'common', 'callable', 'control_flow']
    for (const caseName of cases) {
      const fileContent = fs
        .readFileSync(path.resolve(__dirname,
          `./examples/${caseName}.js`
        ), 'utf-8').trim()
      const outputFileContent = fs
        .readFileSync(path.resolve(__dirname,
          `./examples/${caseName}.output.js`
        ), 'utf-8').trim()
      const { code } = transformSync(fileContent, { plugins: [awaitAutoBox] })
      expect(code).to.equal(outputFileContent)
    }
  })
  it('test', () => {
    console.log(
      transformSync(`await ['u0' && 'u1']`, { plugins: [awaitAutoBox] }).code
    )
  })
})
