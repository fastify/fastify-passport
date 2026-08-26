import { test, describe, TestContext } from 'node:test'
import { Strategy } from '../src/strategies'
import { generateTestUser, getConfiguredTestServer } from './helpers'

export class TestThirdPartyStrategy extends Strategy {
  authenticate (_request: any, _options?: { pauseStream?: boolean }) {
    return this.success(generateTestUser())
  }
}

const testSuite = (sessionPluginName: string) => {
  describe(`${sessionPluginName} tests`, () => {
    describe('.authorize', () => {
      test('should return 401 Unauthorized if not logged in', async (t: TestContext) => {
        const { server, fastifyPassport } = getConfiguredTestServer()
        fastifyPassport.use(new TestThirdPartyStrategy('third-party'))
        server.get(
          '/',
          { preValidation: fastifyPassport.authorize('third-party') },
          async (request) => {
            const user = request.user as any
            t.assert.ifError(user)
            const account = request.account as any
            t.assert.ok(account.id)
            t.assert.strictEqual(account.name, 'test')

            return 'it worked'
          }
        )

        const response = await server.inject({ method: 'GET', url: '/' })
        t.assert.strictEqual(response.statusCode, 200)
      })
    })
  })
}

testSuite('@fastify/session')
testSuite('@fastify/secure-session')
