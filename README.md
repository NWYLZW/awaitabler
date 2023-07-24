# Awaitabler

用惯了一般的 await ？那么来试试这个 await 魔法 🪄。

## 示例

> 大部分已完成，能支持都写在 example 中了

### Base

我们可以通过 `await <url: '[...Tags: string] schema:target'>` 的方式触发我们的需要的中间件，例如：
- `await 'https:///api/users/@me'` 的意思是，使用 `https` 协议请求 `/api/users/@me` 的资源。

```typescript
await 'https://jsonplaceholder.typicode.com/todos/1'
await '[Application=JSON] https://jsonplaceholder.typicode.com/todos/1'
await '[Application=text/html] https://baidu.com'
await 'shell:ls -l'
await 'fs:./README.md'

const prefix = 'https://jsonplaceholder.typicode.com'
const Taged = {
    json: '[Application=JSON]',
    html: '[Application=text/html]',
}
await `${prefix}/todos/1`
await `${Taged.json} ${prefix}/todos/1`
await `${Taged.html} https://baidu.com`
```

### Callable

为什么字符串不能被当成函数调用呢！

```typescript
await 'https://jsonplaceholder.typicode.com/todos/1'({
  method: 'POST',
  body: JSON.stringify({ title: 'foo', body: 'bar', userId: 1 }),
  headers: {
    'Content-type': 'application/json; charset=UTF-8',
  },
})
await 'shell:ls -l'({ cwd: './' })
await 'fs:./README.md'({ encoding: 'utf-8' })
```

### Await with Arguments

单纯的当成函数调用已经不能满足我了！我还要更多的魔法！（不过这个没有主动类型，只能自己 assert）

```typescript
// 在这里可以省略掉括号
await 'https://jsonplaceholder.typicode.com/todos/1', {
  body: JSON.stringify({ title: 'foo', body: 'bar', userId: 1 }),
  headers: {
    'Content-type': 'application/json; charset=UTF-8',
  },
}
await '[GET]', 'https://jsonplaceholder.typicode.com/todos/1'
await '[../]', 'shell:ls -l'
// 省略 `schema:`
await '[POST]', '///login', {
  name: 'admin', password: 'admin',
}
```

### String Template Literals

string 都能当作一个函数了！那么为什么不能当作一个模版标记呢！

```typescript
declare module 'awaitabler' {
    interface RespMap {
        https: {
            '/users/@me': {
                GET: { response: { id: number, name: string } }
            }
        }
    }
}

const u = await ''`${'https:///users/@me'}`
//    ^? { id: number, name: string }
// 我们能够通过这种方式来获取到一个 url 的返回类型，而不需要其他的辅助手段（Type Asseration、JSDoc）
```

### Control Flow

同样我们也定义了一套这样的魔法，用来做控制流的处理。

```typescript
await ['u0', 'u1']
// await Promise.all([ 'u0'.f, 'u1'.f ])

await ('u0', 'u1')
// await Promise.allSettled([ 'u0'.f, 'u1'.f ])

await ['u0' && 'u1']
// [await 'u0', await 'u1']

await ['u0' || 'u1']
/**
 * let a = await 'u0'
 * if (a) return a
 * return await 'u1'
 */

await ('u0' || 'u1')
// await Promise.any([ 'u0'.f, 'u1'.f ])

await ('u0' && 'u1')
// (await 'u0', await 'u1')

for await (const message of 'ws://localhost:8080') {
    console.log(message)
}
for await (const buffer of 'https://stream.com') {
    console.log(message)
}
```

### Using

在 TypeScript@5.2 中实现了关于 `using` 的提案，我们可以基于该语法可以使用如下魔法。

```typescript
// await using 一个 ws 链接的建立
{
    await using ws = 'ws://localhost:8080'
    ws.on('message', console.log)
}

// 一个和 await 无关，但是可以同时监听做到
// using 一个文件的读取（这里也可以是异步的）
{
    using file0 = 'fs:./README.md'
    console.log(file0)
}
```
