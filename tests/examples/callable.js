await 'https://jsonplaceholder.typicode.com/todos/1'({
  method: 'POST',
  body: JSON.stringify({ title: 'foo', body: 'bar', userId: 1 }),
  headers: {
    'Content-type': 'application/json; charset=UTF-8',
  },
})
await 'shell:ls -l'({ cwd: './' })
await 'fs:./README.md'({ encoding: 'utf-8' })
