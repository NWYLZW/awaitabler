await 'https://jsonplaceholder.typicode.com/todos/1', {
  body: JSON.stringify({ title: 'foo', body: 'bar', userId: 1 }),
  headers: {
    'Content-type': 'application/json; charset=UTF-8',
  },
}
await '[GET]', 'https://jsonplaceholder.typicode.com/todos/1'
await '[../]', 'shell:ls -l'
await '[POST]', '///login', {
  name: 'admin', password: 'admin',
}
