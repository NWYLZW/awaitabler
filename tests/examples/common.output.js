await new String('https://jsonplaceholder.typicode.com/todos/1');
await new String('[Application=JSON] https://jsonplaceholder.typicode.com/todos/1');
await new String('[Application=text/html] https://baidu.com');
await new String('shell:ls -l');
await new String('fs:./README.md');
const prefix = 'https://jsonplaceholder.typicode.com';
const Taged = {
  json: '[Application=JSON]',
  html: '[Application=text/html]'
};
await new String(`${prefix}/todos/1`);
await new String(`${Taged.json} ${prefix}/todos/1`);
await new String(`${Taged.html} https://baidu.com`);
