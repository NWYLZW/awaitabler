function trimIndentation(str: string) {
  const match = str.match(/^[ \t]*(?=\S)/gm);
  if (!match) {
    return str;
  }
  const indent = Math.min(...match.map((el) => el.length));
  const re = new RegExp(`^[ \\t]{${indent}}`, "gm");
  return indent > 0 ? str.replace(re, "") : str;
}

export default {
  base: {
    js: trimIndentation(`
    // try it, press \`(Ctrl|Cmd) + E\` to run
    import Awaitabler from 'awaitabler'

    Awaitabler.registerAll()
    Awaitabler.use(Awaitabler.questerMiddleware)

    async function main() {
        const resp = /** @type {Response} */ (
            await 'https://jsonplaceholder.typicode.com/todos/1'
        )
        console.log(resp)
        console.log(resp.status)
        console.log(await resp.json())
    }

    main()
    `).trim(),
    ts: trimIndentation(`
    // try it, press \`(Ctrl|Cmd) + E\` to run
    import Awaitabler from 'awaitabler'

    Awaitabler.registerAll()
    Awaitabler.use(Awaitabler.questerMiddleware)

    async function main() {
        const resp = <Response><unknown>(
            await 'https://jsonplaceholder.typicode.com/todos/1'
        )
        console.log(resp)
        console.log(resp.status)
        console.log(await resp.json())
    }

    main()
    `).trim(),
  },
  middleware: {
    ts: trimIndentation(`
    // try it, press \`(Ctrl|Cmd) + E\` to run
    import Awaitabler, {
        use,
        questerMiddleware
    } from 'awaitabler'

    Awaitabler.registerAll()

    const effectFuncs = []
    effectFuncs.push(use(async (ctx, next) => {
        if (
            ['http', 'https'].includes(ctx.schema)
            && ctx.tags.includes('get:JSON')
        ) {
            return (
                await next()
            ).json()
        }
    }))
    effectFuncs.push(use(questerMiddleware))
    export function dispose() {
        effectFuncs.forEach(f => f())
    }

    interface Todo {
        id: number
        userId: number
        title: string
        completed: boolean
    }
    async function main() {
        const { title, completed } = <Todo><unknown> (
            await '[get:JSON] https://jsonplaceholder.typicode.com/todos/1'
        )
        console.log({ title, completed })
    }
    main()
    `).trim()
  }
}
