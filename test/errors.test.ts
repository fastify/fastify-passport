import { describe, test, TestContext } from 'node:test'
import { AuthenticationError } from '../src/errors'

describe('AuthenticationError', () => {
  test('should create an AuthenticationError with a message and status', (t: TestContext) => {
    const error = new AuthenticationError('Authentication failed', 403)

    t.assert.strictEqual(error.message, 'Authentication failed')
    t.assert.strictEqual(error.status, 403)
    t.assert.strictEqual(error.name, 'AuthenticationError')
    t.assert.ok(error instanceof Error)
  })

  test('should default to status 401 when status is not provided', (t: TestContext) => {
    const error = new AuthenticationError('Authentication failed', 0)

    t.assert.strictEqual(error.message, 'Authentication failed')
    t.assert.strictEqual(error.status, 401)
  })

  test('should have a proper stack trace', (t: TestContext) => {
    const error = new AuthenticationError('Test error', 401)

    t.assert.ok(error.stack)
    t.assert.ok(error.stack.includes('AuthenticationError'))
  })
})
