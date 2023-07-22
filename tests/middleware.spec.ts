import { consumeMiddlewares, Context, use } from 'awaitabler'
import { expect } from 'chai'

describe('Middleware', () => {
  it('should consume middlewares.', async () => {
    const ctx = {
      tags: ['tag0', 'tag1']
    }
    const mid0 = use((ctx, next) => {
      ctx.tags.push('mid0')
      return next()
    })
    const mid1 = use((ctx, next) => {
      ctx.tags.push('mid1')
      return next()
    })
    await consumeMiddlewares(<Context>ctx)
    expect(ctx.tags).to.eql(['tag0', 'tag1', 'mid0', 'mid1'])
    mid0()
    mid1()
  })
  it('should consume middlewares by condition.', async () => {
    const mid0 = use((ctx, next) => {
      if (ctx.tags.includes('tag0')) {
        ctx.tags.push('mid0')
      }
      return next()
    })
    const mid1 = use((ctx, next) => {
      if (ctx.tags.includes('tag1')) {
        ctx.tags.push('mid1')
      }
      return next()
    })
    const ctx0 = <Context>{ tags: ['tag0'] }
    await consumeMiddlewares(ctx0)
    expect(ctx0.tags).to.eql(['tag0', 'mid0'])
    const ctx1 = <Context>{ tags: ['tag1'] }
    await consumeMiddlewares(ctx1)
    expect(ctx1.tags).to.eql(['tag1', 'mid1'])
    const ctx2 = <Context>{ tags: ['tag0', 'tag1'] }
    await consumeMiddlewares(ctx2)
    expect(ctx2.tags).to.eql(['tag0', 'tag1', 'mid0', 'mid1'])
    mid0()
    mid1()
  })
  it('should consume middlewares with return value.', async () => {
    const mid0 = use((ctx, next) => {
      if (ctx.tags.includes('tag0')) {
        return 'mid0'
      }
      return next()
    })
    const mid1 = use((ctx, next) => {
      if (ctx.tags.includes('tag1')) {
        return 'mid1'
      }
      return next()
    })
    const ctx = <Context>{ tags: ['tag0'] }
    expect(await consumeMiddlewares(ctx)).to.equal('mid0')
    mid0()
    mid1()
  })
  it('should do next middleware when return value is undefined.', async () => {
    const mid0 = use(ctx => {
      if (ctx.tags.includes('tag0')) {
        return
      }
      return 'mid0'
    })
    const mid1 = use(() => {
      return 'mid1'
    })
    expect(await consumeMiddlewares(<Context>{
      tags: ['tag0']
    })).to.equal('mid1')
    expect(await consumeMiddlewares(<Context>{
      tags: ['tag1']
    })).to.equal('mid0')
    mid0()
    mid1()
  })
})
