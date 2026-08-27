import { describe, test, TestContext } from 'node:test'
import '../src/index'
import { getConfiguredTestServer, TestStrategy } from './helpers'
import { logIn } from '../src/decorators/login'

const testSuite = (sessionPluginName: string) => {
  describe(`${sessionPluginName} tests`, () => {
    const sessionOnlyTest = sessionPluginName === '@fastify/session' ? test : test.skip
    const secureSessionOnlyTest = sessionPluginName === '@fastify/secure-session' ? test : test.skip

    describe('Request decorators', () => {
      test('logIn allows logging in an arbitrary user', async (t: TestContext) => {
        const { server, fastifyPassport } = getConfiguredTestServer()
        server.get(
          '/',
          {
            preValidation: fastifyPassport.authenticate('test', {
              authInfo: false
            })
          },
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

        t.assert.strictEqual(login.statusCode, 200)

        const response = await server.inject({
          url: '/',
          headers: {
            cookie: login.headers['set-cookie']
          },
          method: 'GET'
        })

        t.assert.strictEqual(login.statusCode, 200)
        t.assert.strictEqual(response.body, 'force logged in user')
      })

      secureSessionOnlyTest(
        'logIn allows logging in an arbitrary user for the duration of the request if session=false',
        async (t: TestContext) => {
          const { server } = getConfiguredTestServer()
          server.post('/force-login', async (request, reply) => {
            await request.logIn({ name: 'force logged in user' }, { session: false })
            reply.send((request.user as any).name)
          })

          const login = await server.inject({
            method: 'POST',
            url: '/force-login'
          })

          t.assert.strictEqual(login.statusCode, 200)
          t.assert.strictEqual(login.body, 'force logged in user')
          t.assert.strictEqual(login.headers['set-cookie'], undefined) // no user added to session
        }
      )

      sessionOnlyTest(
        'logIn allows logging in an arbitrary user for the duration of the request if session=false',
        async (t: TestContext) => {
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

          t.assert.strictEqual(login.statusCode, 200)
          t.assert.strictEqual(login.body, 'force logged in user')
          t.assert.strictEqual(login.headers['set-cookie'], undefined) // no user added to session
        }
      )

      test('isUnauthenticated returns true when user is not authenticated', async (t: TestContext) => {
        const { server } = getConfiguredTestServer()
        server.get('/check-auth', async (request, reply) => {
          reply.send({ isUnauthenticated: request.isUnauthenticated() })
        })

        const response = await server.inject({
          method: 'GET',
          url: '/check-auth'
        })

        t.assert.strictEqual(response.statusCode, 200)
        const body = response.json()
        t.assert.strictEqual(body.isUnauthenticated, true)
      })

      test('isUnauthenticated returns false when user is authenticated', async (t: TestContext) => {
        const { server } = getConfiguredTestServer()
        server.post('/login', async (request, reply) => {
          await request.logIn({ name: 'test user' })
          reply.send({ isUnauthenticated: request.isUnauthenticated() })
        })

        const response = await server.inject({
          method: 'POST',
          url: '/login'
        })

        t.assert.strictEqual(response.statusCode, 200)
        const body = response.json()
        t.assert.strictEqual(body.isUnauthenticated, false)
      })

      test('should logout', async (t: TestContext) => {
        const { server, fastifyPassport } = getConfiguredTestServer()
        server.get(
          '/',
          {
            preValidation: fastifyPassport.authenticate('test', {
              authInfo: false
            })
          },
          async () => 'the root!'
        )
        server.get(
          '/logout',
          {
            preValidation: fastifyPassport.authenticate('test', {
              authInfo: false
            })
          },
          async (request, reply) => {
            request.logout()
            reply.send('logged out')
          }
        )
        server.post(
          '/login',
          {
            preValidation: fastifyPassport.authenticate('test', {
              successRedirect: '/',
              authInfo: false
            })
          },
          async () => ''
        )

        const login = await server.inject({
          method: 'POST',
          payload: { login: 'test', password: 'test' },
          url: '/login'
        })
        t.assert.strictEqual(login.statusCode, 302)
        t.assert.strictEqual(login.headers.location, '/')

        const logout = await server.inject({
          url: '/logout',
          headers: {
            cookie: login.headers['set-cookie']
          },
          method: 'GET'
        })

        t.assert.strictEqual(logout.statusCode, 200)
        t.assert.ok(logout.headers['set-cookie'])

        const retry = await server.inject({
          url: '/',
          headers: {
            cookie: logout.headers['set-cookie']
          },
          method: 'GET'
        })

        t.assert.strictEqual(retry.statusCode, 401)
      })
    })
  })

  test('logIn should throw when passport is not initialized', async (t: TestContext) => {
    const request = {} as any

    await t.assert.rejects(
      logIn.call(request, { id: 1 }, {}),
      {
        message: 'passport.initialize() plugin not in use'
      }
    )
  })

  test('logIn should reset the user property when sessionManager.logIn fails', async (t: TestContext) => {
    const error = new Error('session login failed')

    const request = {
      passport: {
        userProperty: 'user',
        sessionManager: {
          logIn: async () => {
            throw error
          }
        }
      }
    } as any

    await t.assert.rejects(
      logIn.call(request, { id: 123 }, {}),
      (err) => err === error
    )

    t.assert.strictEqual(request.user, null)
  })
}

testSuite('@fastify/session')
testSuite('@fastify/secure-session')
