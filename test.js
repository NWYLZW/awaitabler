awaitabler.registerString()

async function foo() {
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
     * await [
     *   'https://jsonplaceholder.typicode.com/todos/1',
     *   'https://jsonplaceholder.typicode.com/todos/2',
     *   `https://jsonplaceholder.typicode.com/todos/${3}`
     * ]
     */
}

foo()
