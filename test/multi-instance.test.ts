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

const suite = (sessionPluginName) => {
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
        expect(response.body).toEqual('Unauthorized')
        expect(response.statusCode).toEqual(401)

        response = await session.inject({ method: 'GET', url: '/b' })
        expect(response.body).toEqual('Unauthorized')
        expect(response.statusCode).toEqual(401)

        // login a
        const loginResponse = await session.inject({
          method: 'POST',
          url: '/login-a',
          payload: { login: 'test', password: 'test' }
        })

        expect(loginResponse.statusCode).toEqual(302)
        expect(loginResponse.headers.location).toEqual('/a')

        // access protected route
        response = await session.inject({
          method: 'GET',
          url: '/a'
        })
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual('hello a!')

        // access user data
        response = await session.inject({
          method: 'GET',
          url: '/user/a'
        })
        expect(response.statusCode).toEqual(200)

        // try to access route protected by other instance
        response = await session.inject({
          method: 'GET',
          url: '/b'
        })
        expect(response.statusCode).toEqual(401)
      })

      test('simultaneous login should be possible', async () => {
        // login a
        let response = await session.inject({
          method: 'POST',
          url: '/login-a',
          payload: { login: 'test', password: 'test' }
        })

        expect(response.statusCode).toEqual(302)
        expect(response.headers.location).toEqual('/a')

        // login b
        response = await session.inject({
          method: 'POST',
          url: '/login-b',
          payload: { login: 'test', password: 'test' }
        })

        expect(response.statusCode).toEqual(302)
        expect(response.headers.location).toEqual('/b')

        // access a protected route
        response = await session.inject({
          method: 'GET',
          url: '/a'
        })
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual('hello a!')

        // access b protected route
        response = await session.inject({
          method: 'GET',
          url: '/b'
        })
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual('hello b!')
      })

      test('logging out with one instance should not log out the other instance', async () => {
        // login a
        let response = await session.inject({
          method: 'POST',
          url: '/login-a',
          payload: { login: 'test', password: 'test' }
        })

        expect(response.statusCode).toEqual(302)
        expect(response.headers.location).toEqual('/a')

        // login b
        response = await session.inject({
          method: 'POST',
          url: '/login-b',
          payload: { login: 'test', password: 'test' }
        })

        expect(response.statusCode).toEqual(302)
        expect(response.headers.location).toEqual('/b')

        // logout a
        response = await session.inject({
          method: 'POST',
          url: '/logout-a'
        })
        expect(response.statusCode).toEqual(200)

        // try to access route protected by now logged out instance
        response = await session.inject({
          method: 'GET',
          url: '/a'
        })
        expect(response.statusCode).toEqual(401)

        // access b protected route which should still be logged in
        response = await session.inject({
          method: 'GET',
          url: '/b'
        })
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual('hello b!')
      })

      test('user objects from different instances should be different', async () => {
        // login a
        let response = await session.inject({
          method: 'POST',
          url: '/login-a',
          payload: { login: 'test', password: 'test' }
        })

        expect(response.statusCode).toEqual(302)
        expect(response.headers.location).toEqual('/a')

        // login b
        response = await session.inject({
          method: 'POST',
          url: '/login-b',
          payload: { login: 'test', password: 'test' }
        })

        expect(response.statusCode).toEqual(302)
        expect(response.headers.location).toEqual('/b')

        response = await session.inject({
          method: 'GET',
          url: '/user/a'
        })
        expect(response.statusCode).toEqual(200)
        const userA = JSON.parse(response.body)

        response = await session.inject({
          method: 'GET',
          url: '/user/b'
        })
        expect(response.statusCode).toEqual(200)
        const userB = JSON.parse(response.body)

        expect(userA.id).not.toEqual(userB.id)
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
        expect(response.body).toEqual('Unauthorized')
        expect(response.statusCode).toEqual(401)

        response = await session.inject({ method: 'GET', url: '/b' })
        expect(response.body).toEqual('Unauthorized')
        expect(response.statusCode).toEqual(401)

        // login a
        const loginResponse = await session.inject({
          method: 'POST',
          url: '/login-a',
          payload: { login: 'test', password: 'test' }
        })

        expect(loginResponse.statusCode).toEqual(302)
        expect(loginResponse.headers.location).toEqual('/a')

        // access protected route
        response = await session.inject({
          method: 'GET',
          url: '/a'
        })
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual('hello a!')

        // access user data
        response = await session.inject({
          method: 'GET',
          url: '/user/a'
        })
        expect(response.statusCode).toEqual(200)

        // try to access route protected by other instance
        response = await session.inject({
          method: 'GET',
          url: '/b'
        })
        expect(response.statusCode).toEqual(401)
      })

      test('simultaneous login should NOT be possible', async () => {
        // login a
        let response = await session.inject({
          method: 'POST',
          url: '/login-a',
          payload: { login: 'test', password: 'test' }
        })

        expect(response.statusCode).toEqual(302)
        expect(response.headers.location).toEqual('/a')

        // login b
        response = await session.inject({
          method: 'POST',
          url: '/login-b',
          payload: { login: 'test', password: 'test' }
        })

        expect(response.statusCode).toEqual(302)
        expect(response.headers.location).toEqual('/b')

        // access a protected route (/a) was invalidated after login /b
        response = await session.inject({
          method: 'GET',
          url: '/a'
        })
        expect(response.statusCode).toEqual(401)
        expect(response.body).toEqual('Unauthorized')

        // access b protected route
        response = await session.inject({
          method: 'GET',
          url: '/b'
        })
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual('hello b!')
      })

      test('logging out with one instance should log out the other instance', async () => {
        // login a
        let response = await session.inject({
          method: 'POST',
          url: '/login-a',
          payload: { login: 'test', password: 'test' }
        })

        expect(response.statusCode).toEqual(302)
        expect(response.headers.location).toEqual('/a')

        // login b
        response = await session.inject({
          method: 'POST',
          url: '/login-b',
          payload: { login: 'test', password: 'test' }
        })

        expect(response.statusCode).toEqual(302)
        expect(response.headers.location).toEqual('/b')

        // logout a
        response = await session.inject({
          method: 'POST',
          url: '/logout-a'
        })
        expect(response.statusCode).toEqual(401)

        // try to access route protected by now logged out instance
        response = await session.inject({
          method: 'GET',
          url: '/a'
        })
        expect(response.statusCode).toEqual(401)

        // access b protected route which should still be logged in
        response = await session.inject({
          method: 'GET',
          url: '/b'
        })
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual('hello b!')
      })

      test('user objects from different instances should be different', async () => {
        // login a
        let response = await session.inject({
          method: 'POST',
          url: '/login-a',
          payload: { login: 'test', password: 'test' }
        })
        expect(response.statusCode).toEqual(302)
        expect(response.headers.location).toEqual('/a')

        response = await session.inject({
          method: 'GET',
          url: '/user/a'
        })
        expect(response.statusCode).toEqual(200)
        const userA = JSON.parse(response.body)

        // login b
        response = await session.inject({
          method: 'POST',
          url: '/login-b',
          payload: { login: 'test', password: 'test' }
        })

        expect(response.statusCode).toEqual(302)
        expect(response.headers.location).toEqual('/b')

        response = await session.inject({
          method: 'GET',
          url: '/user/b'
        })
        expect(response.statusCode).toEqual(200)
        const userB = JSON.parse(response.body)

        expect(userA.id).not.toEqual(userB.id)
      })
    })
  })
}

suite('@fastify/session')
suite('@fastify/secure-session')
