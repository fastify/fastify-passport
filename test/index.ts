import { test } from 'tap'
import fastifyCookie from 'fastify-cookie'
import fastifySession from 'fastify-session'
import fastifyPassport, { Strategy } from '../src'
import fastify from 'fastify'
import { AddressInfo } from 'net';
import AuthenticationError from '../src/errors';
const requestCallback = require('request')

class TestStrategy extends Strategy {
  authenticate(request: any, options?: { pauseStream?: boolean }) {
    if (request.isAuthenticated()) {
      return this.pass!()
    }
    if (request.body && request.body.login === 'test' && request.body.password === 'test') {
      return this.success!({name: 'test'})
    }
    this.error!(new AuthenticationError('', 401))
  }
}

fastifyPassport.use(new TestStrategy('test'))
fastifyPassport.serializeUser((user, done) => {
  done(null, JSON.stringify(user))
})
fastifyPassport.deserializeUser((user, done) => {
  done(null, user)
})

test(`should return 401 Unauthorized if not logged in`, async (t) => {
  t.plan(2)

  const server = fastify()
  server.register(fastifyCookie)
  server.register(fastifySession, { secret: 'ZUScxzpUKFpNoXXqLlfiPV8oTSl4zOpg', cookie: {secure: false} })
  server.register(fastifyPassport.initialize())
  server.register(fastifyPassport.session())
  server.get('/', {preValidation: fastifyPassport.authenticate('test', {authInfo: false})}, async (request: any, reply) => 'hello world!')
  server.post('/login', {preValidation: fastifyPassport.authenticate('test', {authInfo: false})}, () => {})

  await server.listen(0)
  server.server.unref()

  const port = (server.server.address()! as AddressInfo).port 

  const { response, body } = await request('http://localhost:' + port)

  t.is(body.toString(), '{"statusCode":401,"error":"Unauthorized","message":""}')
  t.is(response.statusCode, 401)
})

test(`should return 200 if logged in`, async (t) => {
  t.plan(4)

  const server = fastify()
  server.register(fastifyCookie)
  server.register(fastifySession, { secret: 'ZUScxzpUKFpNoXXqLlfiPV8oTSl4zOpg', cookie: {secure: false} })
  server.register(fastifyPassport.initialize())
  server.register(fastifyPassport.session())
  server.get('/', {preValidation: fastifyPassport.authenticate('test', {authInfo: false})}, async () => 'hello world!')
  server.post('/login', {preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: false })}, () => {})

  await server.listen(0)
  server.server.unref()

  const port = (server.server.address() as AddressInfo).port
  const result1 = await request({
    method: 'POST',
    body: {login: 'test', password: 'test'},
    url: 'http://localhost:' + port + '/login',
    json: true,
    followRedirect: false
  })
  t.is(result1.response.statusCode, 302)
  t.is(result1.response.headers.location, '/')

  const { response, body } = await request({
    url: 'http://localhost:' + port,
    headers: {
      cookie: result1.response.headers['set-cookie'][0]
    },
    method: 'GET'
  })

  t.is(body.toString(), 'hello world!')
  t.is(response.statusCode, 200)
})

function request(options): Promise<{response: any, body: any}> {
  return new Promise((resolve, reject) => {
    requestCallback(options, (error, response, body1) => {
      if (error) {
        reject(error)
      } else {
        resolve({response, body :body1})
      }
    })
  })
}
