import { describe, test, TestContext } from 'node:test'
import { Strategy } from '../src/strategies/base'
import { getConfiguredTestServer } from './helpers'

describe('Additional coverage tests', () => {
  test('should use constructor name when strategy instance has no name property', async (t: TestContext) => {
    class CustomAuthStrategy extends Strategy {
      constructor () {
        super('custom-auth')
      }

      authenticate (request: any) {
        if (request.body && request.body.login === 'test' && request.body.password === 'test') {
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
      async (request: any) => (request.user as any).name
    )

    const response = await server.inject({
      method: 'POST',
      payload: { login: 'test', password: 'test' },
      url: '/login'
    })

    t.assert.strictEqual(response.statusCode, 200)
    t.assert.strictEqual(response.body, 'test')
  })

  test('should throw error when authenticate is not overridden', (t: TestContext) => {
    const strategy = new Strategy('test')
    const fakeRequest = {} as any

    t.assert.throws(
      () => {
        strategy.authenticate(fakeRequest)
      },
      {
        message: 'Strategy#authenticate must be overridden by subclass'
      }
    )
  })

  test('should set strategy name in constructor', (t: TestContext) => {
    const strategy = new Strategy('custom-strategy')
    t.assert.strictEqual(strategy.name, 'custom-strategy')
  })
})
