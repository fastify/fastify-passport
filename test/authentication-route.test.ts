import assert from 'node:assert'
import { describe, test } from 'node:test'
import { getConfiguredTestServer, TestStrategy } from './helpers'

describe('AuthenticationRoute edge cases', () => {
  test('should use failWithError option to throw error on authentication failure', async () => {
    const { server, fastifyPassport } = getConfiguredTestServer()

    server.post(
      '/login',
      { preValidation: fastifyPassport.authenticate('test', { failWithError: true }) },
      async () => 'should not reach here'
    )

    const response = await server.inject({
      method: 'POST',
      payload: { login: 'wrong', password: 'wrong' },
      url: '/login'
    })

    assert.strictEqual(response.statusCode, 401)
  })

  test('should set WWW-Authenticate header on 401 when challenge is provided', async () => {
    class ChallengeStrategy extends TestStrategy {
      authenticate () {
        this.fail('Bearer realm="Users"', 401)
      }
    }

    const { server, fastifyPassport } = getConfiguredTestServer('challenge', new ChallengeStrategy('challenge'))

    server.post(
      '/login',
      { preValidation: fastifyPassport.authenticate('challenge') },
      async () => 'should not reach here'
    )

    const response = await server.inject({
      method: 'POST',
      url: '/login'
    })

    assert.strictEqual(response.statusCode, 401)
    assert.ok(response.headers['www-authenticate'])
    // WWW-Authenticate can be an array or string
    const authHeader = response.headers['www-authenticate']
    const authValue = Array.isArray(authHeader) ? authHeader[0] : authHeader
    assert.strictEqual(authValue, 'Bearer realm="Users"')
  })

  test('should handle multiple challenges in WWW-Authenticate header', async () => {
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

    assert.strictEqual(response.statusCode, 401)
    assert.ok(response.headers['www-authenticate'])
  })

  test('should handle strategy error with callback', async () => {
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

    assert.strictEqual(response.statusCode, 500)
    assert.strictEqual(response.json().error, 'Strategy error')
  })

  test('should throw error for unknown strategy', async () => {
    const { server, fastifyPassport } = getConfiguredTestServer()

    server.post(
      '/login',
      { preValidation: fastifyPassport.authenticate('nonexistent') },
      async () => 'should not reach here'
    )

    const response = await server.inject({
      method: 'POST',
      url: '/login'
    })

    assert.strictEqual(response.statusCode, 500)
  })

  test('should handle strategy instance with constructor name fallback', async () => {
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

    assert.strictEqual(response.statusCode, 200)
  })

  test('should handle failure with custom status code', async () => {
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

    assert.strictEqual(response.statusCode, 403)
  })

  test('should handle object challenge in failure', async () => {
    class ObjectChallengeStrategy extends TestStrategy {
      authenticate () {
        this.fail({ type: 'error', message: 'Invalid credentials' }, 401)
      }
    }

    const { server, fastifyPassport } = getConfiguredTestServer('object', new ObjectChallengeStrategy('object'))

    server.post(
      '/login',
      { preValidation: fastifyPassport.authenticate('object') },
      async () => 'should not reach here'
    )

    const response = await server.inject({
      method: 'POST',
      url: '/login'
    })

    assert.strictEqual(response.statusCode, 401)
  })

  test('should use constructor.name when strategy instance name property is empty', async () => {
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

    assert.strictEqual(response.statusCode, 200)
  })
})
