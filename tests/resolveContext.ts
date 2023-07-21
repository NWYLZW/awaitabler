import { describe } from 'mocha'
import { resolveContext } from 'awaitabler'
import { expect } from 'chai'

describe('resolveContext', () => {
  it('should resolve common cases.', () => {
    const ctx0 = expect(resolveContext('schema0:cmd'))
    ctx0.have.property('schema', 'schema0')
    ctx0.have.property('target', 'schema0:cmd')
    ctx0.have.property('cmd', 'cmd')
    ctx0.have.property('tags').with.lengthOf(0)

    const ctx1 = expect(resolveContext('[tag0] schema1:cmd'))
    ctx1.have.property('schema', 'schema1')
    ctx1.have.property('target', 'schema1:cmd')
    ctx1.have.property('cmd', 'cmd')
    ctx1.have.property('tags').with.lengthOf(1)
    ctx1.property('tags').that.includes('tag0')

    const ctx2 = expect(resolveContext('[tag0] [tag1] schema2:cmd'))
    ctx2.have.property('schema', 'schema2')
    ctx2.have.property('target', 'schema2:cmd')
    ctx2.have.property('cmd', 'cmd')
    ctx2.have.property('tags').with.lengthOf(2)
    ctx2.property('tags').that.eqls(['tag0', 'tag1'])

    const ctx3 = expect(resolveContext('[tag0]        [tag1]schema3:cmd'))
    ctx3.have.property('schema', 'schema3')
    ctx3.have.property('target', 'schema3:cmd')
    ctx3.have.property('cmd', 'cmd')
    ctx3.have.property('tags').with.lengthOf(2)
    ctx3.property('tags').that.eqls(['tag0', 'tag1'])
  })
})
