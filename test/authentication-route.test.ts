import { describe, test, TestContext } from 'node:test'
import { getConfiguredTestServer, TestStrategy } from './helpers'
import { AuthenticationRoute } from '../src/authentication-route'

describe('AuthenticationRoute edge cases', () => {
  test('should use failWithError option to throw error on authentication failure', async (t: TestContext) => {
    const { server, fastifyPassport } = getConfiguredTestServer()

    server.post(
      '/login',
      {
        preValidation: fastifyPassport.authenticate('test', {
          failWithError: true
        })
      },
      async () => t.assert.fail('should not reach here')
    )

    const response = await server.inject({
      method: 'POST',
      payload: { login: 'wrong', password: 'wrong' },
      url: '/login'
    })

    t.assert.strictEqual(response.statusCode, 401)
  })

  test('should set WWW-Authenticate header on 401 when challenge is provided', async (t: TestContext) => {
    class ChallengeStrategy extends TestStrategy {
      authenticate () {
        this.fail('Bearer realm="Users"', 401)
      }
    }

    const { server, fastifyPassport } = getConfiguredTestServer('challenge', new ChallengeStrategy('challenge'))

    server.post(
      '/login',
      { preValidation: fastifyPassport.authenticate('challenge') },
      async () => t.assert.fail('should not reach here')
    )

    const response = await server.inject({
      method: 'POST',
      url: '/login'
    })

    t.assert.strictEqual(response.statusCode, 401)
    t.assert.ok(response.headers['www-authenticate'])
    // WWW-Authenticate can be an array or string
    const authHeader = response.headers['www-authenticate']
    const authValue = Array.isArray(authHeader) ? authHeader[0] : authHeader
    t.assert.strictEqual(authValue, 'Bearer realm="Users"')
  })

  test('should handle multiple challenges in WWW-Authenticate header', async (t: TestContext) => {
    class FirstChallengeStrategy extends TestStrategy {
      authenticate () {
        this.fail('Basic realm="Users"')
      }
    }

    class SecondChallengeStrategy extends TestStrategy {
      authenticate () {
        this.fail('Bearer realm="API"')
      }
    }

    const { server, fastifyPassport } = getConfiguredTestServer()
    fastifyPassport.use('first', new FirstChallengeStrategy('first'))
    fastifyPassport.use('second', new SecondChallengeStrategy('second'))

    server.post(
      '/login',
      { preValidation: fastifyPassport.authenticate(['first', 'second']) },
      async () => 'should not reach here'
    )

    const response = await server.inject({
      method: 'POST',
      url: '/login'
    })

    t.assert.strictEqual(response.statusCode, 401)
    t.assert.ok(response.headers['www-authenticate'])
  })

  test('should handle strategy error with callback', async (t: TestContext) => {
    class ErrorStrategy extends TestStrategy {
      authenticate () {
        this.error(new Error('Strategy error'))
      }
    }

    const { server, fastifyPassport } = getConfiguredTestServer('error', new ErrorStrategy('error'))

    server.post('/login', async (request: any, reply) => {
      const handler = fastifyPassport.authenticate(
        'error',
        async (req: any, rep: any, err: any, user: any) => {
          if (err) {
            return rep.status(500).send({ error: err.message })
          }
          rep.send({ user })
        }
      )
      return handler.call(server, request, reply)
    })

    const response = await server.inject({
      method: 'POST',
      url: '/login'
    })

    t.assert.strictEqual(response.statusCode, 500)
    t.assert.strictEqual(response.json().error, 'Strategy error')
  })

  test('should throw error for unknown strategy', async (t: TestContext) => {
    const { server, fastifyPassport } = getConfiguredTestServer()

    server.post(
      '/login',
      { preValidation: fastifyPassport.authenticate('nonexistent') },
      async () => t.assert.fail('should not reach here')
    )

    const response = await server.inject({
      method: 'POST',
      url: '/login'
    })

    t.assert.strictEqual(response.statusCode, 500)
  })

  test('should handle strategy instance with constructor name fallback', async (t: TestContext) => {
    class CustomNameStrategy extends TestStrategy {
      constructor () {
        super('custom')
      }
    }

    const strategy = new CustomNameStrategy()
    const { server, fastifyPassport } = getConfiguredTestServer()
    fastifyPassport.use(strategy)

    server.post(
      '/login',
      { preValidation: fastifyPassport.authenticate(strategy) },
      async (request: any) => (request.user as any).name
    )

    const response = await server.inject({
      method: 'POST',
      payload: { login: 'test', password: 'test' },
      url: '/login'
    })

    t.assert.strictEqual(response.statusCode, 200)
  })

  test('should handle failure with custom status code', async (t: TestContext) => {
    class CustomStatusStrategy extends TestStrategy {
      authenticate () {
        this.fail('Custom error', 403)
      }
    }

    const { server, fastifyPassport } = getConfiguredTestServer('custom', new CustomStatusStrategy('custom'))

    server.post(
      '/login',
      { preValidation: fastifyPassport.authenticate('custom') },
      async () => 'should not reach here'
    )

    const response = await server.inject({
      method: 'POST',
      url: '/login'
    })

    t.assert.strictEqual(response.statusCode, 403)
  })

  test('should handle object challenge in failure', async (t: TestContext) => {
    class ObjectChallengeStrategy extends TestStrategy {
      authenticate () {
        this.fail({ type: 'error', message: 'Invalid credentials' }, 401)
      }
    }

    const { server, fastifyPassport } = getConfiguredTestServer('object', new ObjectChallengeStrategy('object'))

    server.post(
      '/login',
      { preValidation: fastifyPassport.authenticate('object') },
      async () => t.assert.fail('should not reach here')
    )

    const response = await server.inject({
      method: 'POST',
      url: '/login'
    })

    t.assert.strictEqual(response.statusCode, 401)
  })

  test('should use constructor.name when strategy instance name property is empty', async (t: TestContext) => {
    class CustomNamedStrategy extends TestStrategy {
      constructor () {
        super('test')
        Object.defineProperty(this, 'name', {
          value: '',
          writable: false,
          configurable: true
        })
      }
    }

    const strategy = new CustomNamedStrategy()
    const { server, fastifyPassport } = getConfiguredTestServer()

    fastifyPassport.use('CustomNamedStrategy', strategy)

    server.post(
      '/login',
      { preValidation: fastifyPassport.authenticate(strategy) },
      async (request: any) => (request.user as any).name
    )

    const response = await server.inject({
      method: 'POST',
      payload: { login: 'test', password: 'test' },
      url: '/login'
    })

    t.assert.strictEqual(response.statusCode, 200)
  })

  test('should throw when passport is not initialized', async (t: TestContext) => {
    const { server, fastifyPassport } = getConfiguredTestServer()

    const route = new AuthenticationRoute(
      fastifyPassport,
      'test',
      {
        authInfo: false
      }
    )

    const request = {
      log: {
        debug: () => {},
        trace: () => {}
      }
    } as any

    const reply = {} as any

    await t.assert.rejects(
      () => route.handler.call(server, request, reply),
      {
        message: 'passport.initialize() plugin not in use'
      }
    )
  })
})
