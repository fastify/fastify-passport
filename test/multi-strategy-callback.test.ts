import { test, describe } from 'node:test'
import assert from 'node:assert'
import { getRegisteredTestServer } from './helpers'
import { Strategy } from '../src/strategies'

// Strategy that always fails with a specific status
class FailingStrategy extends Strategy {
  constructor (name: string, private status: number = 401) {
    super(name)
  }

  authenticate (_request: any, _options?: { pauseStream?: boolean }) {
    this.fail(this.status)
  }
}

const testSuite = (sessionPluginName: string) => {
  describe(`${sessionPluginName} tests`, () => {
    test('should call callback with single status for single strategy failure', async () => {
      const { server, fastifyPassport } = getRegisteredTestServer()

      let callbackCalled = false
      let receivedStatus: number | undefined
      let receivedStatuses: (number | undefined)[] | undefined

      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate(
            new FailingStrategy('single-fail', 403),
            { authInfo: false },
            async (request, reply, err, user, info, status) => {
              callbackCalled = true
              receivedStatus = status
              receivedStatuses = undefined // Should not be called with array for single strategy
              reply.code(401).send('Authentication failed')
            }
          )
        },
        async () => 'should not reach here'
      )

      const response = await server.inject({ method: 'GET', url: '/' })

      assert.strictEqual(response.statusCode, 401)
      assert.strictEqual(callbackCalled, true)
      assert.strictEqual(receivedStatus, 403)
      assert.strictEqual(receivedStatuses, undefined)
    })

    test('should call callback with array of statuses for multi-strategy failure', async () => {
      const { server, fastifyPassport } = getRegisteredTestServer()

      let callbackCalled = false
      let receivedStatus: number | undefined
      let receivedStatuses: (number | undefined)[] | undefined

      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate(
            [new FailingStrategy('multi-fail-1', 401), new FailingStrategy('multi-fail-2', 403)],
            { authInfo: false },
            async (request, reply, err, user, info, statuses) => {
              callbackCalled = true
              receivedStatus = undefined // Should not be called with single status for multi-strategy
              receivedStatuses = statuses
              reply.code(401).send('Authentication failed')
            }
          )
        },
        async () => 'should not reach here'
      )

      const response = await server.inject({ method: 'GET', url: '/' })

      assert.strictEqual(response.statusCode, 401)
      assert.strictEqual(callbackCalled, true)
      assert.strictEqual(receivedStatus, undefined)
      assert.deepStrictEqual(receivedStatuses, [401, 403])
    })

    test('should call callback with array of statuses for multi-strategy with mixed status types', async () => {
      const { server, fastifyPassport } = getRegisteredTestServer()

      let callbackCalled = false
      let receivedStatuses: (number | undefined)[] | undefined

      // One strategy fails with status, another fails without status (undefined)
      class FailingWithoutStatusStrategy extends Strategy {
        authenticate (_request: any, _options?: { pauseStream?: boolean }) {
          this.fail() // No status provided, should be undefined
        }
      }

      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate(
            [new FailingStrategy('multi-fail-1', 402), new FailingWithoutStatusStrategy('multi-fail-2')],
            { authInfo: false },
            async (request, reply, err, user, info, statuses) => {
              callbackCalled = true
              receivedStatuses = statuses
              reply.code(401).send('Authentication failed')
            }
          )
        },
        async () => 'should not reach here'
      )

      const response = await server.inject({ method: 'GET', url: '/' })

      assert.strictEqual(response.statusCode, 401)
      assert.strictEqual(callbackCalled, true)
      assert.deepStrictEqual(receivedStatuses, [402, undefined])
    })

    test('should work correctly when first strategy succeeds in multi-strategy setup', async () => {
      const { server, fastifyPassport } = getRegisteredTestServer()

      let callbackCalled = false

      // Strategy that always succeeds
      class SucceedingStrategy extends Strategy {
        authenticate (_request: any, _options?: { pauseStream?: boolean }) {
          this.success({ id: 'test-user', name: 'Test User' })
        }
      }

      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate(
            [new SucceedingStrategy('multi-success'), new FailingStrategy('multi-fail', 403)],
            { authInfo: false },
            async (request, reply, err, user, info) => {
              callbackCalled = true
              // Success callback should not have status/statuses parameter
              reply.send('Authentication succeeded')
            }
          )
        },
        async () => 'should not reach here'
      )

      const response = await server.inject({ method: 'GET', url: '/' })

      assert.strictEqual(response.statusCode, 200)
      assert.strictEqual(response.body, 'Authentication succeeded')
      assert.strictEqual(callbackCalled, true)
    })
  })
}

testSuite('@fastify/session')
testSuite('@fastify/secure-session')
