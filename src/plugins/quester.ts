import { defineMiddleware, defineTags } from 'awaitabler'

interface QuesterTags {
  json: '[Header.Content-Type=application/json]'
}

declare module 'awaitabler' {
  interface Tags {
    quester: QuesterTags
  }
}

export const questerTags = defineTags('quester', {
  json: '[Header.Content-Type=application/json]'
})

export const questerMiddleware = defineMiddleware(async (ctx, next) => {
  if (['http', 'https'].includes(ctx.schema)) {
    let p = fetch(ctx.target)
    if (ctx.tags.find(t => `[${t}]` === questerTags.json)) {
      p = p.then(res => res.json())
    }
    return p
  }
  return next()
})
