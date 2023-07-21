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
