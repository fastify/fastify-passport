/* eslint-disable @typescript-eslint/no-floating-promises */
import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'
import { FastifyInstance } from 'fastify'
import { Authenticator } from '../src/Authenticator'
import { Strategy } from '../src/strategies'
import { getTestServer, TestBrowserSession } from './helpers'

let counter: number
let authenticators: Record<string, Authenticator>

async function TestStrategyModule(instance: FastifyInstance, { namespace, clearSessionOnLogin }) {
  class TestStrategy extends Strategy {
    authenticate(request: any, _options?: { pauseStream?: boolean }) {
      if (request.isAuthenticated()) {
        return this.pass()
      }
      if (request.body && request.body.login === 'test' && request.body.password === 'test') {
        return this.success({ namespace, id: String(counter++) })
      }

      this.fail()
    }
  }

  const strategyName = `test-${namespace}`
  const authenticator = new Authenticator({
    key: `passport${namespace}`,
    userProperty: `user${namespace}`,
    clearSessionOnLogin
  })
  authenticator.use(strategyName, new TestStrategy(strategyName))
  authenticator.registerUserSerializer<any, string>(async (user) => {
    if (user.namespace == namespace) {
      return namespace + '-' + JSON.stringify(user)
    }
    throw 'pass'
  })
  authenticator.registerUserDeserializer<string, any>(async (serialized: string) => {
    if (serialized.startsWith(`${namespace}-`)) {
      return JSON.parse(serialized.slice(`${namespace}-`.length))
    }
    throw 'pass'
  })

  await instance.register(authenticator.initialize())
  await instance.register(authenticator.secureSession())
  authenticators[namespace] = authenticator

  instance.get(
    `/${namespace}`,
    { preValidation: authenticator.authenticate(strategyName, { authInfo: false }) },
    async () => `hello ${namespace}!`
  )

  instance.get(
    `/user/${namespace}`,
    { preValidation: authenticator.authenticate(strategyName, { authInfo: false }) },
    async (request) => JSON.stringify(request[`user${namespace}`])
  )

  instance.post(
    `/login-${namespace}`,
    {
      preValidation: authenticator.authenticate(strategyName, {
        successRedirect: `/${namespace}`,
        authInfo: false
      })
    },
    () => {
      return
    }
  )

  instance.post(
    `/logout-${namespace}`,
    { preValidation: authenticator.authenticate(strategyName, { authInfo: false }) },
    async (request, reply) => {
      await request.logout()
      void reply.send('logged out')
    }
  )
}

const testSuite = (sessionPluginName: string) => {
  describe(`${sessionPluginName} tests`, () => {
    describe('multiple registered instances (clearSessionOnLogin: false)', () => {
      let server: FastifyInstance
      let session: TestBrowserSession

      beforeEach(async () => {
        counter = 0
        authenticators = {}
        server = getTestServer()
        session = new TestBrowserSession(server)

        for (const namespace of ['a', 'b']) {
          await server.register(TestStrategyModule, { namespace, clearSessionOnLogin: false })
        }
      })

      test('logging in with one instance should not log in the other instance', async () => {
        let response = await session.inject({ method: 'GET', url: '/a' })
        assert.strictEqual(response.body, 'Unauthorized')
        assert.strictEqual(response.statusCode, 401)

        response = await session.inject({ method: 'GET', url: '/b' })
        assert.strictEqual(response.body, 'Unauthorized')
        assert.strictEqual(response.statusCode, 401)

        // login a
        const loginResponse = await session.inject({
          method: 'POST',
          url: '/login-a',
          payload: { login: 'test', password: 'test' }
        })

        assert.strictEqual(loginResponse.statusCode, 302)
        assert.strictEqual(loginResponse.headers.location, '/a')

        // access protected route
        response = await session.inject({
          method: 'GET',
          url: '/a'
        })
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.body, 'hello a!')

        // access user data
        response = await session.inject({
          method: 'GET',
          url: '/user/a'
        })
        assert.strictEqual(response.statusCode, 200)

        // try to access route protected by other instance
        response = await session.inject({
          method: 'GET',
          url: '/b'
        })
        assert.strictEqual(response.statusCode, 401)
      })

      test('simultaneous login should be possible', async () => {
        // login a
        let response = await session.inject({
          method: 'POST',
          url: '/login-a',
          payload: { login: 'test', password: 'test' }
        })

        assert.strictEqual(response.statusCode, 302)
        assert.strictEqual(response.headers.location, '/a')

        // login b
        response = await session.inject({
          method: 'POST',
          url: '/login-b',
          payload: { login: 'test', password: 'test' }
        })

        assert.strictEqual(response.statusCode, 302)
        assert.strictEqual(response.headers.location, '/b')

        // access a protected route
        response = await session.inject({
          method: 'GET',
          url: '/a'
        })
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.body, 'hello a!')

        // access b protected route
        response = await session.inject({
          method: 'GET',
          url: '/b'
        })
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.body, 'hello b!')
      })

      test('logging out with one instance should not log out the other instance', async () => {
        // login a
        let response = await session.inject({
          method: 'POST',
          url: '/login-a',
          payload: { login: 'test', password: 'test' }
        })

        assert.strictEqual(response.statusCode, 302)
        assert.strictEqual(response.headers.location, '/a')

        // login b
        response = await session.inject({
          method: 'POST',
          url: '/login-b',
          payload: { login: 'test', password: 'test' }
        })

        assert.strictEqual(response.statusCode, 302)
        assert.strictEqual(response.headers.location, '/b')

        // logout a
        response = await session.inject({
          method: 'POST',
          url: '/logout-a'
        })
        assert.strictEqual(response.statusCode, 200)

        // try to access route protected by now logged out instance
        response = await session.inject({
          method: 'GET',
          url: '/a'
        })
        assert.strictEqual(response.statusCode, 401)

        // access b protected route which should still be logged in
        response = await session.inject({
          method: 'GET',
          url: '/b'
        })
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.body, 'hello b!')
      })

      test('user objects from different instances should be different', async () => {
        // login a
        let response = await session.inject({
          method: 'POST',
          url: '/login-a',
          payload: { login: 'test', password: 'test' }
        })

        assert.strictEqual(response.statusCode, 302)
        assert.strictEqual(response.headers.location, '/a')

        // login b
        response = await session.inject({
          method: 'POST',
          url: '/login-b',
          payload: { login: 'test', password: 'test' }
        })

        assert.strictEqual(response.statusCode, 302)
        assert.strictEqual(response.headers.location, '/b')

        response = await session.inject({
          method: 'GET',
          url: '/user/a'
        })
        assert.strictEqual(response.statusCode, 200)
        const userA = JSON.parse(response.body)

        response = await session.inject({
          method: 'GET',
          url: '/user/b'
        })
        assert.strictEqual(response.statusCode, 200)
        const userB = JSON.parse(response.body)

        assert.notStrictEqual(userA.id, userB.id)
      })
    })

    describe('multiple registered instances (clearSessionOnLogin: true)', () => {
      let server: FastifyInstance
      let session: TestBrowserSession

      beforeEach(async () => {
        server = getTestServer()
        session = new TestBrowserSession(server)
        authenticators = {}
        counter = 0

        for (const namespace of ['a', 'b']) {
          await server.register(TestStrategyModule, { namespace, clearSessionOnLogin: true })
        }
      })

      test('logging in with one instance should not log in the other instance', async () => {
        let response = await session.inject({ method: 'GET', url: '/a' })
        assert.strictEqual(response.body, 'Unauthorized')
        assert.strictEqual(response.statusCode, 401)

        response = await session.inject({ method: 'GET', url: '/b' })
        assert.strictEqual(response.body, 'Unauthorized')
        assert.strictEqual(response.statusCode, 401)

        // login a
        const loginResponse = await session.inject({
          method: 'POST',
          url: '/login-a',
          payload: { login: 'test', password: 'test' }
        })

        assert.strictEqual(loginResponse.statusCode, 302)
        assert.strictEqual(loginResponse.headers.location, '/a')

        // access protected route
        response = await session.inject({
          method: 'GET',
          url: '/a'
        })
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.body, 'hello a!')

        // access user data
        response = await session.inject({
          method: 'GET',
          url: '/user/a'
        })
        assert.strictEqual(response.statusCode, 200)

        // try to access route protected by other instance
        response = await session.inject({
          method: 'GET',
          url: '/b'
        })
        assert.strictEqual(response.statusCode, 401)
      })

      test('simultaneous login should NOT be possible', async () => {
        // login a
        let response = await session.inject({
          method: 'POST',
          url: '/login-a',
          payload: { login: 'test', password: 'test' }
        })

        assert.strictEqual(response.statusCode, 302)
        assert.strictEqual(response.headers.location, '/a')

        // login b
        response = await session.inject({
          method: 'POST',
          url: '/login-b',
          payload: { login: 'test', password: 'test' }
        })

        assert.strictEqual(response.statusCode, 302)
        assert.strictEqual(response.headers.location, '/b')

        // access a protected route (/a) was invalidated after login /b
        response = await session.inject({
          method: 'GET',
          url: '/a'
        })
        assert.strictEqual(response.statusCode, 401)
        assert.strictEqual(response.body, 'Unauthorized')

        // access b protected route
        response = await session.inject({
          method: 'GET',
          url: '/b'
        })
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.body, 'hello b!')
      })

      test('logging out with one instance should log out the other instance', async () => {
        // login a
        let response = await session.inject({
          method: 'POST',
          url: '/login-a',
          payload: { login: 'test', password: 'test' }
        })

        assert.strictEqual(response.statusCode, 302)
        assert.strictEqual(response.headers.location, '/a')

        // login b
        response = await session.inject({
          method: 'POST',
          url: '/login-b',
          payload: { login: 'test', password: 'test' }
        })

        assert.strictEqual(response.statusCode, 302)
        assert.strictEqual(response.headers.location, '/b')

        // logout a
        response = await session.inject({
          method: 'POST',
          url: '/logout-a'
        })
        assert.strictEqual(response.statusCode, 401)

        // try to access route protected by now logged out instance
        response = await session.inject({
          method: 'GET',
          url: '/a'
        })
        assert.strictEqual(response.statusCode, 401)

        // access b protected route which should still be logged in
        response = await session.inject({
          method: 'GET',
          url: '/b'
        })
        assert.strictEqual(response.statusCode, 200)
        assert.strictEqual(response.body, 'hello b!')
      })

      test('user objects from different instances should be different', async () => {
        // login a
        let response = await session.inject({
          method: 'POST',
          url: '/login-a',
          payload: { login: 'test', password: 'test' }
        })
        assert.strictEqual(response.statusCode, 302)
        assert.strictEqual(response.headers.location, '/a')

        response = await session.inject({
          method: 'GET',
          url: '/user/a'
        })
        assert.strictEqual(response.statusCode, 200)
        const userA = JSON.parse(response.body)

        // login b
        response = await session.inject({
          method: 'POST',
          url: '/login-b',
          payload: { login: 'test', password: 'test' }
        })

        assert.strictEqual(response.statusCode, 302)
        assert.strictEqual(response.headers.location, '/b')

        response = await session.inject({
          method: 'GET',
          url: '/user/b'
        })
        assert.strictEqual(response.statusCode, 200)
        const userB = JSON.parse(response.body)

        assert.notStrictEqual(userA.id, userB.id)
      })
    })
  })
}

testSuite('@fastify/session')
testSuite('@fastify/secure-session')
