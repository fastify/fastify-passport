import { test, describe } from 'node:test'
import assert from 'node:assert'
import { FastifyInstance } from 'fastify'
import { FastifyRequest } from 'fastify/types/request'
import Authenticator from '../src/authenticator'
import { getTestServer, TestStrategy } from './helpers'

const emptyRequest = {} as unknown as FastifyRequest

declare module '@fastify/secure-session' {
  interface SessionData {
    preLogin: string
  }
}

/** Ids that are falsy but are still perfectly valid things to store in a session. */
const falsyIds = [0, '', false]

describe('Authenticator#serializeUser with falsy serialized ids', () => {
  for (const id of falsyIds) {
    test(`returns ${JSON.stringify(id)} rather than throwing`, async () => {
      const fastifyPassport = new Authenticator()
      fastifyPassport.registerUserSerializer(async () => id)

      assert.strictEqual(await fastifyPassport.serializeUser({ id }, emptyRequest), id)
    })
  }

  test('still throws when no serializer is registered', async () => {
    const fastifyPassport = new Authenticator()

    await assert.rejects(
      fastifyPassport.serializeUser({ id: 1 }, emptyRequest),
      /Failed to serialize user into session. Tried 0 serializers./
    )
  })

  test('still throws when every serializer passes', async () => {
    const fastifyPassport = new Authenticator()
    fastifyPassport.registerUserSerializer(async () => {
      throw 'pass' // eslint-disable-line no-throw-literal
    })

    await assert.rejects(
      fastifyPassport.serializeUser({ id: 1 }, emptyRequest),
      /Failed to serialize user into session. Tried 1 serializers./
    )
  })

  for (const id of [undefined, null]) {
    test(`still throws when a serializer returns ${String(id)}`, async () => {
      const fastifyPassport = new Authenticator()
      fastifyPassport.registerUserSerializer(async () => id)

      await assert.rejects(
        fastifyPassport.serializeUser({ id }, emptyRequest),
        /Failed to serialize user into session. Tried 1 serializers./
      )
    })
  }
})

describe('Authenticator#deserializeUser with falsy serialized ids', () => {
  for (const id of falsyIds) {
    test(`hands ${JSON.stringify(id)} to the registered deserializers`, async () => {
      const fastifyPassport = new Authenticator()
      const seen: unknown[] = []
      fastifyPassport.registerUserDeserializer(async (stored) => {
        seen.push(stored)
        return { name: 'test' }
      })

      assert.deepStrictEqual(await fastifyPassport.deserializeUser(id, emptyRequest), { name: 'test' })
      assert.deepStrictEqual(seen, [id])
    })
  }
})

const sessionPlugins = ['@fastify/session', '@fastify/secure-session'] as const

const setupServer = async (fastifyPassport: Authenticator) => {
  const server = getTestServer()
  server.register(fastifyPassport.initialize())
  server.register(fastifyPassport.secureSession())
  server.post(
    '/prime',
    async (request) => {
      request.session.set('preLogin', 'planted')
      return 'primed'
    }
  )
  server.post(
    '/login',
    { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
    async () => 'logged in'
  )
  server.get(
    '/protected',
    { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
    async (request) => JSON.stringify(request.user)
  )
  server.get('/session', async (request) => String(request.session.get('preLogin')))
  return server
}

const login = (server: FastifyInstance, cookie?: string) =>
  server.inject({
    method: 'POST',
    url: '/login',
    payload: { login: 'test', password: 'test' },
    headers: cookie ? { cookie } : {}
  })

for (const sessionPluginName of sessionPlugins) {
  describe(`${sessionPluginName} tests`, () => {
    describe('logging in a user whose serialized id is falsy', () => {
      for (const id of falsyIds) {
        test(`round trips a user serialized to ${JSON.stringify(id)}`, async () => {
          process.env.SESSION_PLUGIN = sessionPluginName
          try {
            const fastifyPassport = new Authenticator()
            fastifyPassport.use('test', new TestStrategy('test'))
            const seen: unknown[] = []
            fastifyPassport.registerUserSerializer(async () => id)
            fastifyPassport.registerUserDeserializer(async (stored) => {
              seen.push(stored)
              return { name: 'test', id }
            })

            const server = await setupServer(fastifyPassport)

            const loginResponse = await login(server)
            assert.strictEqual(loginResponse.statusCode, 200)
            assert.strictEqual(loginResponse.body, 'logged in')

            const protectedResponse = await server.inject({
              method: 'GET',
              url: '/protected',
              headers: { cookie: loginResponse.headers['set-cookie'] as string }
            })

            assert.strictEqual(protectedResponse.statusCode, 200)
            assert.deepStrictEqual(JSON.parse(protectedResponse.body), { name: 'test', id })
            // the id must survive the session round trip untouched, not be coerced
            assert.deepStrictEqual(seen, [id])
          } finally {
            delete process.env.SESSION_PLUGIN
          }
        })

        test(`clears the pre-login session when the serialized id is ${JSON.stringify(id)}`, async () => {
          process.env.SESSION_PLUGIN = sessionPluginName
          try {
            const fastifyPassport = new Authenticator()
            fastifyPassport.use('test', new TestStrategy('test'))
            fastifyPassport.registerUserSerializer(async () => id)
            fastifyPassport.registerUserDeserializer(async () => ({ name: 'test', id }))

            const server = await setupServer(fastifyPassport)

            const primeResponse = await server.inject({ method: 'POST', url: '/prime' })
            const primedCookie = primeResponse.headers['set-cookie'] as string

            const sessionBeforeLogin = await server.inject({
              method: 'GET',
              url: '/session',
              headers: { cookie: primedCookie }
            })
            assert.strictEqual(sessionBeforeLogin.body, 'planted')

            const loginResponse = await login(server, primedCookie)
            assert.strictEqual(loginResponse.statusCode, 200)

            const sessionAfterLogin = await server.inject({
              method: 'GET',
              url: '/session',
              headers: { cookie: (loginResponse.headers['set-cookie'] ?? primedCookie) as string }
            })
            assert.strictEqual(sessionAfterLogin.body, 'undefined')
          } finally {
            delete process.env.SESSION_PLUGIN
          }
        })
      }
    })
  })
}
