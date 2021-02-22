import { FastifyInstance } from 'fastify'
import { getTestServer, TestBrowserSession, TestStrategy } from './helpers'
import { Authenticator } from '../src/Authenticator'

describe('multiple registered instances', () => {
  let server: FastifyInstance
  let authenticators: Record<string, Authenticator>
  let session: TestBrowserSession

  beforeEach(async () => {
    server = getTestServer()
    authenticators = {}
    session = new TestBrowserSession(server)

    for (const name of ['a', 'b']) {
      const strategyName = `test-${name}`
      await server.register(async (instance) => {
        const authenticator = new Authenticator({ key: name, userProperty: `user${name}` })
        authenticator.use(strategyName, new TestStrategy(strategyName))
        authenticator.registerUserSerializer(async (user) => JSON.stringify(user))
        authenticator.registerUserDeserializer(async (serialized: string) => JSON.parse(serialized))

        await instance.register(authenticator.initialize())
        await instance.register(authenticator.secureSession())
        authenticators[name] = authenticator

        instance.get(
          `/${name}`,
          { preValidation: authenticator.authenticate(strategyName, { authInfo: false }) },
          async () => `hello ${name}!`
        )

        instance.get(
          `/user/${name}`,
          { preValidation: authenticator.authenticate(strategyName, { authInfo: false }) },
          async (request) => JSON.stringify(request[`user${name}`])
        )

        instance.post(
          `/login-${name}`,
          { preValidation: authenticator.authenticate(strategyName, { successRedirect: `/${name}`, authInfo: false }) },
          () => {
            return
          }
        )

        instance.post(
          `/logout-${name}`,
          { preValidation: authenticator.authenticate(strategyName, { authInfo: false }) },
          async (request, reply) => {
            await request.logout()
            void reply.send('logged out')
          }
        )
      })
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
      payload: { login: 'test', password: 'test' },
    })

    expect(loginResponse.statusCode).toEqual(302)
    expect(loginResponse.headers.location).toEqual('/a')

    // access protected route
    response = await session.inject({
      method: 'GET',
      url: '/a',
    })
    expect(response.statusCode).toEqual(200)
    expect(response.body).toEqual('hello a!')

    // access user data
    response = await session.inject({
      method: 'GET',
      url: '/user/a',
    })
    expect(response.statusCode).toEqual(200)

    // try to access route protected by other instance
    response = await session.inject({
      method: 'GET',
      url: '/b',
    })
    expect(response.statusCode).toEqual(401)
  })

  test('simultaneous login should be possible', async () => {
    // login a
    let response = await session.inject({
      method: 'POST',
      url: '/login-a',
      payload: { login: 'test', password: 'test' },
    })

    expect(response.statusCode).toEqual(302)
    expect(response.headers.location).toEqual('/a')

    // login b
    response = await session.inject({
      method: 'POST',
      url: '/login-b',
      payload: { login: 'test', password: 'test' },
    })

    expect(response.statusCode).toEqual(302)
    expect(response.headers.location).toEqual('/b')

    // access a protected route
    response = await session.inject({
      method: 'GET',
      url: '/a',
    })
    expect(response.statusCode).toEqual(200)
    expect(response.body).toEqual('hello a!')

    // access b protected route
    response = await session.inject({
      method: 'GET',
      url: '/b',
    })
    expect(response.statusCode).toEqual(200)
    expect(response.body).toEqual('hello b!')
  })

  test('logging out with one instance should not log out the other instance', async () => {
    // login a
    let response = await session.inject({
      method: 'POST',
      url: '/login-a',
      payload: { login: 'test', password: 'test' },
    })

    expect(response.statusCode).toEqual(302)
    expect(response.headers.location).toEqual('/a')

    // login b
    response = await session.inject({
      method: 'POST',
      url: '/login-b',
      payload: { login: 'test', password: 'test' },
    })

    expect(response.statusCode).toEqual(302)
    expect(response.headers.location).toEqual('/b')

    // logout a
    response = await session.inject({
      method: 'POST',
      url: '/logout-a',
    })
    expect(response.statusCode).toEqual(200)

    // try to access route protected by now logged out instance
    response = await session.inject({
      method: 'GET',
      url: '/a',
    })
    expect(response.statusCode).toEqual(401)

    // access b protected route which should still be logged in
    response = await session.inject({
      method: 'GET',
      url: '/b',
    })
    expect(response.statusCode).toEqual(200)
    expect(response.body).toEqual('hello b!')
  })

  test('user objects from different instances should be different', async () => {
    // login a
    let response = await session.inject({
      method: 'POST',
      url: '/login-a',
      payload: { login: 'test', password: 'test' },
    })

    expect(response.statusCode).toEqual(302)
    expect(response.headers.location).toEqual('/a')

    // login b
    response = await session.inject({
      method: 'POST',
      url: '/login-b',
      payload: { login: 'test', password: 'test' },
    })

    expect(response.statusCode).toEqual(302)
    expect(response.headers.location).toEqual('/b')

    response = await session.inject({
      method: 'GET',
      url: '/user/a',
    })
    expect(response.statusCode).toEqual(200)
    const userA = JSON.parse(response.body)

    response = await session.inject({
      method: 'GET',
      url: '/user/b',
    })
    expect(response.statusCode).toEqual(200)
    const userB = JSON.parse(response.body)

    expect(userA.id).not.toEqual(userB.id)
  })
})
