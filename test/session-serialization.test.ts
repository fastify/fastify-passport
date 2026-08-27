import { test, describe, mock, TestContext } from 'node:test'
import { FastifyInstance } from 'fastify'
import { FastifyRequest } from 'fastify/types/request'
import Authenticator from '../src/authenticator'
import { getTestServer, TestDatabaseStrategy, TestStrategy } from './helpers'

const testSuite = (sessionPluginName: string) => {
  describe(`${sessionPluginName} tests`, () => {
    describe('Authenticator session serialization', () => {
      test('it should roundtrip a user', async (t: TestContext) => {
        const fastifyPassport = new Authenticator()

        fastifyPassport.registerUserSerializer(async (user) => JSON.stringify(user))
        fastifyPassport.registerUserDeserializer(async (serialized: string) => JSON.parse(serialized))

        const user = { name: 'foobar' }
        const request = {} as unknown as FastifyRequest
        t.assert.deepStrictEqual(
          await fastifyPassport.deserializeUser(await fastifyPassport.serializeUser(user, request), request),
          user
        )
      })

      const setupSerializationTestServer = async (fastifyPassport: Authenticator) => {
        const server = getTestServer()
        server.register(fastifyPassport.initialize())
        server.register(fastifyPassport.secureSession())
        server.get(
          '/',
          {
            preValidation: fastifyPassport.authenticate('test', {
              authInfo: false
            })
          },
          async () => 'hello world!'
        )
        server.post(
          '/login',
          {
            preValidation: fastifyPassport.authenticate('test', {
              successRedirect: '/',
              authInfo: false
            })
          },
          () => {}
        )
        server.get('/unprotected', async () => 'some content')
        return server
      }

      const verifySuccessfulLogin = async (server: FastifyInstance, t: any) => {
        const loginResponse = await server.inject({
          method: 'POST',
          url: '/login',
          payload: { login: 'test', password: 'test' }
        })

        t.assert.strictEqual(loginResponse.statusCode, 302)
        t.assert.strictEqual(loginResponse.headers.location, '/')

        const homeResponse = await server.inject({
          url: '/',
          headers: {
            cookie: loginResponse.headers['set-cookie']
          },
          method: 'GET'
        })

        t.assert.strictEqual(homeResponse.body, 'hello world!')
        t.assert.strictEqual(homeResponse.statusCode, 200)
      }

      test('should allow multiple user serializers and deserializers', async (t: TestContext) => {
        const fastifyPassport = new Authenticator()
        fastifyPassport.use('test', new TestStrategy('test'))
        fastifyPassport.registerUserSerializer(async () => {
          throw 'pass' // eslint-disable-line no-throw-literal
        })
        fastifyPassport.registerUserSerializer(async () => {
          throw 'pass' // eslint-disable-line no-throw-literal
        })
        fastifyPassport.registerUserSerializer(async (user) => {
          return JSON.stringify(user)
        })
        fastifyPassport.registerUserDeserializer(async () => {
          throw 'pass' // eslint-disable-line no-throw-literal
        })
        fastifyPassport.registerUserDeserializer(async () => {
          throw 'pass' // eslint-disable-line no-throw-literal
        })
        fastifyPassport.registerUserDeserializer(async (serialized: string) => JSON.parse(serialized))
        const server = await setupSerializationTestServer(fastifyPassport)
        await verifySuccessfulLogin(server, t)
      })

      test('should allow user serializers/deserializers that work like a database', async (t: TestContext) => {
        const fastifyPassport = new Authenticator()
        const strategy = new TestDatabaseStrategy('test', { 1: { id: '1', login: 'test', password: 'test' } })
        fastifyPassport.use('test', strategy)
        fastifyPassport.registerUserSerializer<{ id: string; name: string }, string>(async (user) => user.id)
        fastifyPassport.registerUserDeserializer(async (serialized: string) => strategy.database[serialized])

        const server = await setupSerializationTestServer(fastifyPassport)
        await verifySuccessfulLogin(server, t)
        await verifySuccessfulLogin(server, t)
      })

      test('should throw if user deserializers return undefined', async (t: TestContext) => {
        // jest.spyOn(console, 'error').mockImplementation(jest.fn())
        console.error = mock.fn()
        const fastifyPassport = new Authenticator()
        const strategy = new TestDatabaseStrategy('test', { 1: { id: '1', login: 'test', password: 'test' } })
        fastifyPassport.use('test', strategy)
        fastifyPassport.registerUserSerializer<{ id: string; name: string }, string>(async (user) => user.id)
        fastifyPassport.registerUserDeserializer(async (serialized: string) => strategy.database[serialized])

        const server = await setupSerializationTestServer(fastifyPassport)
        await verifySuccessfulLogin(server, t)

        const loginResponse = await server.inject({
          method: 'POST',
          url: '/login',
          payload: { login: 'test', password: 'test' }
        })

        t.assert.strictEqual(loginResponse.statusCode, 302)
        t.assert.strictEqual(loginResponse.headers.location, '/')

        // user id 1 is logged in now, simulate deleting them from the database while logged in
        delete strategy.database['1']

        const homeResponse = await server.inject({
          url: '/',
          headers: {
            cookie: loginResponse.headers['set-cookie']
          },
          method: 'GET'
        })

        t.assert.strictEqual(homeResponse.statusCode, 500)
        t.assert.strictEqual(
          JSON.parse(homeResponse.body)?.message,
          'Failed to deserialize user out of session. Tried 1 serializers.'
        )

        // can't serve other requests either because the secure session decode fails, which would populate request.user even for unauthenticated requests
        const otherResponse = await server.inject({
          url: '/unprotected',
          headers: {
            cookie: loginResponse.headers['set-cookie']
          },
          method: 'GET'
        })

        t.assert.strictEqual(otherResponse.statusCode, 500)
        t.assert.strictEqual(
          JSON.parse(otherResponse.body)?.message,
          'Failed to deserialize user out of session. Tried 1 serializers.'
        )
      })

      test('should deny access if user deserializers return null for logged in sessions', async (t: TestContext) => {
        const fastifyPassport = new Authenticator()
        const strategy = new TestDatabaseStrategy('test', { 1: { id: '1', login: 'test', password: 'test' } })
        fastifyPassport.use('test', strategy)
        fastifyPassport.registerUserSerializer<{ id: string; name: string }, string>(async (user) => user.id)
        fastifyPassport.registerUserDeserializer(async (serialized: string) => strategy.database[serialized] || null)

        const server = await setupSerializationTestServer(fastifyPassport)
        await verifySuccessfulLogin(server, t)

        const loginResponse = await server.inject({
          method: 'POST',
          url: '/login',
          payload: { login: 'test', password: 'test' }
        })

        t.assert.strictEqual(loginResponse.statusCode, 302)
        t.assert.strictEqual(loginResponse.headers.location, '/')

        // user id 1 is logged in now, simulate deleting them from the database while logged in
        delete strategy.database['1']

        const homeResponse = await server.inject({
          url: '/',
          headers: {
            cookie: loginResponse.headers['set-cookie']
          },
          method: 'GET'
        })

        t.assert.strictEqual(homeResponse.statusCode, 401)

        // should still be able to serve unauthenticated requests just fine
        const otherResponse = await server.inject({
          url: '/unprotected',
          headers: {
            cookie: loginResponse.headers['set-cookie']
          },
          method: 'GET'
        })

        t.assert.strictEqual(otherResponse.statusCode, 200)
        t.assert.strictEqual(otherResponse.body, 'some content')
      })
    })
  })
}

testSuite('@fastify/session')
testSuite('@fastify/secure-session')
