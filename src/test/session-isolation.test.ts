import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'
import { generateTestUser, getConfiguredTestServer, TestBrowserSession } from './helpers'

function createServer() {
  const { server, fastifyPassport } = getConfiguredTestServer()

  server.get(
    '/protected',
    { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
    async () => 'hello!'
  )
  server.get('/my-id', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, async (request) =>
    String((request.user as any).id)
  )
  server.post(
    '/login',
    { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
    async () => 'success'
  )

  server.post('/force-login', async (request, reply) => {
    await request.logIn(generateTestUser())
    void reply.send('logged in')
  })

  server.post(
    '/logout',
    { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
    async (request, reply) => {
      await request.logout()
      void reply.send('logged out')
    }
  )
  return server
}

const testSuite = (sessionPluginName: string) => {
  process.env.SESSION_PLUGIN = sessionPluginName
  const server = createServer()
  describe(`${sessionPluginName} tests`, () => {
    const sessionOnlyTest = sessionPluginName === '@fastify/session' ? test : test.skip
    describe('session isolation', () => {
      let userA, userB, userC

      beforeEach(() => {
        userA = new TestBrowserSession(server)
        userB = new TestBrowserSession(server)
        userC = new TestBrowserSession(server)
      })
      test(`should return 401 Unauthorized if not logged in`, async () => {
        await Promise.all(
          [userA, userB, userC].map(async (user) => {
            const response = await user.inject({ method: 'GET', url: '/protected' })
            assert.strictEqual(response.statusCode, 401)
          })
        )

        await Promise.all(
          [userA, userB, userC].map(async (user) => {
            const response = await user.inject({ method: 'GET', url: '/protected' })
            assert.strictEqual(response.statusCode, 401)
          })
        )
      })

      test(`logging in one user shouldn't log in the others`, async () => {
        await Promise.all(
          [userA, userB, userC].map(async (user) => {
            const response = await user.inject({ method: 'GET', url: '/protected' })
            assert.strictEqual(response.statusCode, 401)
          })
        )

        let response = await userA.inject({
          method: 'POST',
          url: '/login',
          payload: { login: 'test', password: 'test' }
        })
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.body, 'success')

        response = await userA.inject({ method: 'GET', url: '/protected' })
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.body, 'hello!')

        await Promise.all(
          [userB, userC].map(async (user) => {
            const response = await user.inject({ method: 'GET', url: '/protected' })
            assert.strictEqual(response.statusCode, 401)
          })
        )

        response = await userA.inject({ method: 'GET', url: '/protected' })
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.body, 'hello!')
      })

      test(`logging in each user should keep their sessions independent`, async () => {
        await Promise.all(
          [userA, userB, userC].map(async (user) => {
            let response = await user.inject({
              method: 'POST',
              url: '/login',
              payload: { login: 'test', password: 'test' }
            })
            assert.strictEqual(response.statusCode, 200)
            assert.strictEqual(response.body, 'success')

            response = await user.inject({ method: 'GET', url: '/protected' })
            assert.strictEqual(response.statusCode, 200)
            assert.strictEqual(response.body, 'hello!')
          })
        )

        const ids = await Promise.all(
          [userA, userB, userC].map(async (user) => {
            const response = await user.inject({ method: 'GET', url: '/my-id' })
            assert.strictEqual(response.statusCode, 200)
            return response.body
          })
        )

        // assert.deepStrictEqual each returned ID to be unique
        assert.deepStrictEqual(Array.from(new Set(ids)).sort(), ids.sort())
      })

      test(`logging out one user shouldn't log out the others`, async () => {
        await Promise.all(
          [userA, userB, userC].map(async (user) => {
            let response = await user.inject({
              method: 'POST',
              url: '/login',
              payload: { login: 'test', password: 'test' }
            })
            assert.strictEqual(response.statusCode, 200)
            assert.strictEqual(response.body, 'success')

            response = await user.inject({ method: 'GET', url: '/protected' })
            assert.strictEqual(response.statusCode, 200)
            assert.strictEqual(response.body, 'hello!')
          })
        )

        let response = await userB.inject({
          url: '/logout',
          method: 'POST'
        })
        assert.strictEqual(response.statusCode, 200)

        response = await userB.inject({
          url: '/protected',
          method: 'GET'
        })
        assert.strictEqual(response.statusCode, 401)

        await Promise.all(
          [userA, userC].map(async (user) => {
            const response = await user.inject({ method: 'GET', url: '/protected' })
            assert.strictEqual(response.statusCode, 200)
            assert.strictEqual(response.body, 'hello!')
          })
        )
      })

      test(`force logging in users shouldn't change the login state of the others`, async () => {
        await Promise.all(
          [userA, userB, userC].map(async (user) => {
            const response = await user.inject({ method: 'POST', url: '/force-login' })
            assert.strictEqual(response.statusCode, 200)
          })
        )

        const ids = await Promise.all(
          [userA, userB, userC].map(async (user) => {
            const response = await user.inject({ method: 'GET', url: '/my-id' })
            assert.strictEqual(response.statusCode, 200)
            return response.body
          })
        )

        // assert.deepStrictEqual each returned ID to be unique
        assert.deepStrictEqual(Array.from(new Set(ids)).sort(), ids.sort())
      })

      sessionOnlyTest('should regenerate session on login', async () => {
        assert.strictEqual(userA.cookies['sessionId'], undefined)
        await userA.inject({ method: 'GET', url: '/protected' })
        assert.ok(userA.cookies['sessionId'])
        const prevSessionId = userA.cookies.sessionId
        await userA.inject({
          method: 'POST',
          url: '/login',
          payload: { login: 'test', password: 'test' }
        })
        assert.notStrictEqual(userA.cookies.sessionId, prevSessionId)
      })
    })
  })
  delete process.env.SESSION_PLUGIN
}

testSuite('@fastify/session')
testSuite('@fastify/secure-session')
