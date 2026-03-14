import { test, describe } from 'node:test'
import assert from 'node:assert'
import type { RouteHandlerMethod } from 'fastify'
import { expectType } from 'tsd'
import { Strategy } from '../src/strategies'
import { generateTestUser, getConfiguredTestServer } from './helpers'

type StrategyRequest = Parameters<Strategy['authenticate']>[0]
type StrategyOptions = Parameters<Strategy['authenticate']>[1]

export class TestThirdPartyStrategy extends Strategy {
  authenticate (_request: StrategyRequest, _options?: StrategyOptions) {
    return this.success(generateTestUser())
  }
}

const testSuite = (sessionPluginName: string) => {
  describe(`${sessionPluginName} tests`, () => {
    describe('.authorize', () => {
      test('should return 401 Unauthorized if not logged in', async () => {
        const { server, fastifyPassport } = getConfiguredTestServer()
        fastifyPassport.use(new TestThirdPartyStrategy('third-party'))
        expectType<RouteHandlerMethod>(fastifyPassport.authorize('third-party'))
        server.get('/', { preValidation: fastifyPassport.authorize('third-party') }, async (request) => {
          const user = request.user
          assert.ifError(user)
          const account = request.account as { id: string, name: string }
          assert.ok(account.id)
          assert.strictEqual(account.name, 'test')

          return 'it worked'
        })

        const response = await server.inject({ method: 'GET', url: '/' })
        assert.strictEqual(response.statusCode, 200)
      })
    })
  })
}

testSuite('@fastify/session')
testSuite('@fastify/secure-session')
