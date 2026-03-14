import assert from 'node:assert'
import { describe, test } from 'node:test'
import { Strategy } from '../src/strategies/base'
import { getConfiguredTestServer } from './helpers'

type LoginBody = { login?: string, password?: string }
type StrategyRequest = Parameters<Strategy['authenticate']>[0]

describe('Additional coverage tests', () => {
  test('should use constructor name when strategy instance has no name property', async () => {
    class CustomAuthStrategy extends Strategy {
      constructor () {
        super('custom-auth')
      }

      authenticate (request: StrategyRequest) {
        const body = (typeof request.body === 'object' && request.body !== null) ? request.body as LoginBody : undefined
        if (body && body.login === 'test' && body.password === 'test') {
          return this.success({ name: 'test', id: '1' })
        }
        this.fail()
      }
    }

    const strategy = new CustomAuthStrategy()
    const { server, fastifyPassport } = getConfiguredTestServer()

    fastifyPassport.use(strategy)

    server.post(
      '/login',
      { preValidation: fastifyPassport.authenticate(strategy) },
      async (request) => (request.user as { name: string }).name
    )

    const response = await server.inject({
      method: 'POST',
      payload: { login: 'test', password: 'test' },
      url: '/login'
    })

    assert.strictEqual(response.statusCode, 200)
    assert.strictEqual(response.body, 'test')
  })

  test('should throw error when authenticate is not overridden', () => {
    const strategy = new Strategy('test')
    const fakeRequest = {} as Parameters<Strategy['authenticate']>[0]

    assert.throws(
      () => {
        strategy.authenticate(fakeRequest)
      },
      {
        message: 'Strategy#authenticate must be overridden by subclass'
      }
    )
  })

  test('should set strategy name in constructor', () => {
    const strategy = new Strategy('custom-strategy')
    assert.strictEqual(strategy.name, 'custom-strategy')
  })
})
