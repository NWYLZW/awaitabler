import { defineMiddleware } from 'awaitabler'

export const questerMiddleware = defineMiddleware(async (ctx, next) => {
  if (['http', 'https'].includes(ctx.schema)) {
    return fetch(ctx.target)
  }
  return next()
})
