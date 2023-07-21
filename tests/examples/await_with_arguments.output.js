await StringFunction('https://jsonplaceholder.typicode.com/todos/1')({
  body: JSON.stringify({
    title: 'foo',
    body: 'bar',
    userId: 1
  }),
  headers: {
    'Content-type': 'application/json; charset=UTF-8'
  }
});
await StringFunction('[GET]' + (" " + 'https://jsonplaceholder.typicode.com/todos/1'))();
await StringFunction('[../]' + (" " + 'shell:ls -l'))();
await StringFunction('[POST]' + (" " + '///login'))({
  name: 'admin',
  password: 'admin'
});
