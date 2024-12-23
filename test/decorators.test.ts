import { test, describe } from 'node:test'
import assert from 'node:assert'
import { getConfiguredTestServer, TestStrategy } from './helpers'

const testSuite = (sessionPluginName: string) => {
  describe(`${sessionPluginName} tests`, () => {
    const sessionOnlyTest = sessionPluginName === '@fastify/session' ? test : test.skip
    const secureSessionOnlyTest = sessionPluginName === '@fastify/secure-session' ? test : test.skip

    describe('Request decorators', () => {
      test('logIn allows logging in an arbitrary user', async () => {
        const { server, fastifyPassport } = getConfiguredTestServer()
        server.get(
          '/',
          { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
          async (request) => (request.user as any).name
        )
        server.post('/force-login', async (request, reply) => {
          await request.logIn({ name: 'force logged in user' })
          reply.send('logged in')
        })

        const login = await server.inject({
          method: 'POST',
          url: '/force-login'
        })

        assert.strictEqual(login.statusCode, 200)

        const response = await server.inject({
          url: '/',
          headers: {
            cookie: login.headers['set-cookie']
          },
          method: 'GET'
        })

        assert.strictEqual(login.statusCode, 200)
        assert.strictEqual(response.body, 'force logged in user')
      })

      secureSessionOnlyTest(
        'logIn allows logging in an arbitrary user for the duration of the request if session=false',
        async () => {
          const { server } = getConfiguredTestServer()
          server.post('/force-login', async (request, reply) => {
            await request.logIn({ name: 'force logged in user' }, { session: false })
            reply.send((request.user as any).name)
          })

          const login = await server.inject({
            method: 'POST',
            url: '/force-login'
          })

          assert.strictEqual(login.statusCode, 200)
          assert.strictEqual(login.body, 'force logged in user')
          assert.strictEqual(login.headers['set-cookie'], undefined) // no user added to session
        }
      )

      sessionOnlyTest(
        'logIn allows logging in an arbitrary user for the duration of the request if session=false',
        async () => {
          const sessionOptions = {
            secret: 'a secret with minimum length of 32 characters',
            cookie: { secure: false },
            saveUninitialized: false
          }
          const { server } = getConfiguredTestServer('test', new TestStrategy('test'), sessionOptions)
          server.post('/force-login', async (request, reply) => {
            await request.logIn({ name: 'force logged in user' }, { session: false })
            reply.send((request.user as any).name)
          })

          const login = await server.inject({
            method: 'POST',
            url: '/force-login'
          })

          assert.strictEqual(login.statusCode, 200)
          assert.strictEqual(login.body, 'force logged in user')
          assert.strictEqual(login.headers['set-cookie'], undefined) // no user added to session
        }
      )

      test('should logout', async () => {
        const { server, fastifyPassport } = getConfiguredTestServer()
        server.get(
          '/',
          { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
          async () => 'the root!'
        )
        server.get(
          '/logout',
          { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
          async (request, reply) => {
            request.logout()
            reply.send('logged out')
          }
        )
        server.post(
          '/login',
          { preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: false }) },
          async () => ''
        )

        const login = await server.inject({
          method: 'POST',
          payload: { login: 'test', password: 'test' },
          url: '/login'
        })
        assert.strictEqual(login.statusCode, 302)
        assert.strictEqual(login.headers.location, '/')

        const logout = await server.inject({
          url: '/logout',
          headers: {
            cookie: login.headers['set-cookie']
          },
          method: 'GET'
        })

        assert.strictEqual(logout.statusCode, 200)
        assert.ok(logout.headers['set-cookie'])

        const retry = await server.inject({
          url: '/',
          headers: {
            cookie: logout.headers['set-cookie']
          },
          method: 'GET'
        })

        assert.strictEqual(retry.statusCode, 401)
      })
    })
  })
}

testSuite('@fastify/session')
testSuite('@fastify/secure-session')
