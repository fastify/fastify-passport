# fastify-passport

## Installation

```shell
npm install fastify-passport
```

## Example

```js
const server = fastify()
server.register(fastifyCookie)
server.register(fastifySession, {
  secret: 'ZUScxzpUKFpNoXXqLlfiPV8oTSl4zOpg',
  cookie: {secure: false}
})
server.register(fastifyPassport.initialize())
server.register(fastifyPassport.session())

server.get('/', {
  preValidation: fastifyPassport.authenticate('test', {authInfo: false})
}, async () => 'hello world!')
server.post('/login', {preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: false })}, () => {})

server.listen(0)
````

## API

### initialize()

### session()

### authenticate(strategyName, options)

## License

[MIT](./LICENSE)