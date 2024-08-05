import { test, describe, mock } from 'node:test'
import assert from 'node:assert'
import { FastifyInstance } from 'fastify'
import { FastifyRequest } from 'fastify/types/request'
import Authenticator from '../src/Authenticator'
import { getTestServer, TestDatabaseStrategy, TestStrategy } from './helpers'

const testSuite = (sessionPluginName: string) => {
  describe(`${sessionPluginName} tests`, () => {
    describe('Authenticator session serialization', () => {
      test('it should roundtrip a user', async () => {
        const fastifyPassport = new Authenticator()

        fastifyPassport.registerUserSerializer(async (user) => JSON.stringify(user))
        fastifyPassport.registerUserDeserializer(async (serialized: string) => JSON.parse(serialized))

        const user = { name: 'foobar' }
        const request = {} as unknown as FastifyRequest
        assert.deepStrictEqual(
          await fastifyPassport.deserializeUser(await fastifyPassport.serializeUser(user, request), request),
          user
        )
      })

      const setupSerializationTestServer = async (fastifyPassport: Authenticator) => {
        const server = getTestServer()
        void server.register(fastifyPassport.initialize())
        void server.register(fastifyPassport.secureSession())
        server.get(
          '/',
          { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
          async () => 'hello world!'
        )
        server.post(
          '/login',
          { preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: false }) },
          () => {}
        )
        server.get('/unprotected', async () => 'some content')
        return server
      }

      const verifySuccessfulLogin = async (server: FastifyInstance) => {
        const loginResponse = await server.inject({
          method: 'POST',
          url: '/login',
          payload: { login: 'test', password: 'test' }
        })

        assert.strictEqual(loginResponse.statusCode, 302)
        assert.strictEqual(loginResponse.headers.location, '/')

        const homeResponse = await server.inject({
          url: '/',
          headers: {
            cookie: loginResponse.headers['set-cookie']
          },
          method: 'GET'
        })

        assert.strictEqual(homeResponse.body, 'hello world!')
        assert.strictEqual(homeResponse.statusCode, 200)
      }

      test('should allow multiple user serializers and deserializers', async () => {
        const fastifyPassport = new Authenticator()
        fastifyPassport.use('test', new TestStrategy('test'))
        fastifyPassport.registerUserSerializer(async () => {
          throw 'pass'
        })
        fastifyPassport.registerUserSerializer(async () => {
          throw 'pass'
        })
        fastifyPassport.registerUserSerializer(async (user) => {
          return JSON.stringify(user)
        })
        fastifyPassport.registerUserDeserializer(async () => {
          throw 'pass'
        })
        fastifyPassport.registerUserDeserializer(async () => {
          throw 'pass'
        })
        fastifyPassport.registerUserDeserializer(async (serialized: string) => JSON.parse(serialized))
        const server = await setupSerializationTestServer(fastifyPassport)
        await verifySuccessfulLogin(server)
      })

      test('should allow user serializers/deserializers that work like a database', async () => {
        const fastifyPassport = new Authenticator()
        const strategy = new TestDatabaseStrategy('test', { '1': { id: '1', login: 'test', password: 'test' } })
        fastifyPassport.use('test', strategy)
        fastifyPassport.registerUserSerializer<{ id: string; name: string }, string>(async (user) => user.id)
        fastifyPassport.registerUserDeserializer(async (serialized: string) => strategy.database[serialized])

        const server = await setupSerializationTestServer(fastifyPassport)
        await verifySuccessfulLogin(server)
        await verifySuccessfulLogin(server)
      })

      test('should throw if user deserializers return undefined', async () => {
        // jest.spyOn(console, 'error').mockImplementation(jest.fn())
        console.error = mock.fn()
        const fastifyPassport = new Authenticator()
        const strategy = new TestDatabaseStrategy('test', { '1': { id: '1', login: 'test', password: 'test' } })
        fastifyPassport.use('test', strategy)
        fastifyPassport.registerUserSerializer<{ id: string; name: string }, string>(async (user) => user.id)
        fastifyPassport.registerUserDeserializer(async (serialized: string) => strategy.database[serialized])

        const server = await setupSerializationTestServer(fastifyPassport)
        await verifySuccessfulLogin(server)

        const loginResponse = await server.inject({
          method: 'POST',
          url: '/login',
          payload: { login: 'test', password: 'test' }
        })

        assert.strictEqual(loginResponse.statusCode, 302)
        assert.strictEqual(loginResponse.headers.location, '/')

        // user id 1 is logged in now, simulate deleting them from the database while logged in
        delete strategy.database['1']

        const homeResponse = await server.inject({
          url: '/',
          headers: {
            cookie: loginResponse.headers['set-cookie']
          },
          method: 'GET'
        })

        assert.strictEqual(homeResponse.statusCode, 500)
        assert.strictEqual(
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

        assert.strictEqual(otherResponse.statusCode, 500)
        assert.strictEqual(
          JSON.parse(otherResponse.body)?.message,
          'Failed to deserialize user out of session. Tried 1 serializers.'
        )
      })

      test('should deny access if user deserializers return null for logged in sessions', async () => {
        const fastifyPassport = new Authenticator()
        const strategy = new TestDatabaseStrategy('test', { '1': { id: '1', login: 'test', password: 'test' } })
        fastifyPassport.use('test', strategy)
        fastifyPassport.registerUserSerializer<{ id: string; name: string }, string>(async (user) => user.id)
        fastifyPassport.registerUserDeserializer(async (serialized: string) => strategy.database[serialized] || null)

        const server = await setupSerializationTestServer(fastifyPassport)
        await verifySuccessfulLogin(server)

        const loginResponse = await server.inject({
          method: 'POST',
          url: '/login',
          payload: { login: 'test', password: 'test' }
        })

        assert.strictEqual(loginResponse.statusCode, 302)
        assert.strictEqual(loginResponse.headers.location, '/')

        // user id 1 is logged in now, simulate deleting them from the database while logged in
        delete strategy.database['1']

        const homeResponse = await server.inject({
          url: '/',
          headers: {
            cookie: loginResponse.headers['set-cookie']
          },
          method: 'GET'
        })

        assert.strictEqual(homeResponse.statusCode, 401)

        // should still be able to serve unauthenticated requests just fine
        const otherResponse = await server.inject({
          url: '/unprotected',
          headers: {
            cookie: loginResponse.headers['set-cookie']
          },
          method: 'GET'
        })

        assert.strictEqual(otherResponse.statusCode, 200)
        assert.strictEqual(otherResponse.body, 'some content')
      })
    })
  })
}

testSuite('@fastify/session')
testSuite('@fastify/secure-session')
