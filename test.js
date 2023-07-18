// @ts-check
awaitabler.registerString()

async function foo() {
    await ['u1', 'u2']
    // ⬇️
    await Promise.all(['u1', 'u2'].map(fetch))
    // --------------------
    await ('u1', 'u2')
    // ⬇️
    await Promise.allSettled(['u1', 'u2'].map(fetch))
    // --------------------
    await ('u1' || 'u2')
    // ⬇️
    await Promise.any(['u1', 'u2'].map(fetch))
    // --------------------
    await ('u1' && 'u2')
    // ⬇️
    await Promise.oneByOne(['u1', 'u2'].map(fetch))
    // ⬇️
    [await fetch('u1'), await fetch('u2')]

    console.log(
        await 'https://jsonplaceholder.typicode.com/todos/1'
    )
    console.log(
        await `https://jsonplaceholder.typicode.com/todos/${1}`
    )
    /**
     * await 'https://jsonplaceholder.typicode.com/todos/1'
     * await `https://jsonplaceholder.typicode.com/todos/${1}`
     * 
     * await ['u0', 'u1'] =>
     * await Promise.all([fetch'u0', fetch'u1'])
     * await ('u0', 'u1') =>
     * await Promise.allSellted([fetch'u0', fetch'u1'])
     */
}

foo()
