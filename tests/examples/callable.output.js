await StringFunction('https://jsonplaceholder.typicode.com/todos/1')({
  method: 'POST',
  body: JSON.stringify({
    title: 'foo',
    body: 'bar',
    userId: 1
  }),
  headers: {
    'Content-type': 'application/json; charset=UTF-8'
  }
});
await StringFunction('shell:ls -l')({
  cwd: './'
});
await StringFunction('fs:./README.md')({
  encoding: 'utf-8'
});
