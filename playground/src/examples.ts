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

    Awaitabler.regAll()
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

    Awaitabler.regAll()
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
  'await.opts': {
    ts: trimIndentation(`
    import Awaitabler from 'awaitabler'
    Awaitabler.regAll()
    Awaitabler.use(Awaitabler.questerMiddleware)

    async function main() {
        // \`await Promise.all([...])\`
        const resps = <Response[]><unknown>await [
            'https://jsonplaceholder.typicode.com/todos/1',
            'https://jsonplaceholder.typicode.com/todos/1'
        ]
        console.log('resps', resps)
        // \`await Promise.allSettled([...])\`
        const results = <PromiseSettledResult<Response>[]><unknown>await (
            Promise.reject(1),
            'https://jsonplaceholder.typicode.com/todos/1'
        )
        console.log('results', results)
        // \`await Promise.any([...])\`
        const result = <Response><unknown>await (Promise.reject(1) || 'https://jsonplaceholder.typicode.com/todos/1')
        console.log('result', result)
        // no race
    }
    main()
    `).trim()
  },
  middleware: {
    ts: trimIndentation(`
    // try it, press \`(Ctrl|Cmd) + E\` to run
    import Awaitabler, {
        use,
        questerMiddleware
    } from 'awaitabler'
    Awaitabler.regAll()

    const effectFuncs = []
    effectFuncs.push(use(async (ctx, next) => {
        if (
            ['http', 'https'].includes(ctx.schema)
            && ctx.tags.includes('get:JSON')
        ) {
            return (
                <Response><unknown>await next()
            ).json()
        }
    }))
    effectFuncs.push(use(questerMiddleware))
    export function dispose() {
        effectFuncs.forEach(f => f())
    }

    interface Todo {
        userId: number
        id: number
        title: string
        completed: boolean
    }
    async function main() {
        const { title, completed } = <Todo><unknown>(
            await '[get:JSON] https://jsonplaceholder.typicode.com/todos/1'
        )
        console.log({ title, completed })
    }
    main()
    `).trim()
  },
  'Make number awaitabler': {
    js: trimIndentation(`
    // try it, press \`(Ctrl|Cmd) + E\` to run
    import 'awaitabler/prototypes/number'

    async function main() {
        setTimeout(() => console.log('500ms'), 500)
        setTimeout(() => console.log('950ms'), 950)
        await 51e1.ms
        console.log('await 51e1.ms')
        await 0.4.s
        console.log('await 0.4.s')
        await 200..ms
        console.log('await 200..ms')
    }

    main()
    `).trim(),
    get ts() { return this.js },
  },
  'Make `await <number>` abortable': {
    js: trimIndentation(`
    // try it, press \`(Ctrl|Cmd) + E\` to run
    import 'awaitabler/prototypes/number'

    async function main() {
        const ac = new AbortController()
        setTimeout(() => ac.abort(null), 100)
        setTimeout(() => console.log('50ms'), 50)
        setTimeout(() => console.log('200ms'), 200)
        setTimeout(() => console.log('1s'), 1000)
        console.log('await 1..s(ac) start')
        await 1..s(ac.signal)
        console.log('await 1..s(ac) end')
    }
    main()
    `).trim(),
    get ts() { return this.js },
  }
}
