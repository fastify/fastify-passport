import assert from 'node:assert'
import { describe, test } from 'node:test'
import { AuthenticationError } from '../src/errors'

describe('AuthenticationError', () => {
  test('should create an AuthenticationError with a message and status', () => {
    const error = new AuthenticationError('Authentication failed', 403)

    assert.strictEqual(error.message, 'Authentication failed')
    assert.strictEqual(error.status, 403)
    assert.strictEqual(error.name, 'AuthenticationError')
    assert.ok(error instanceof Error)
  })

  test('should default to status 401 when status is not provided', () => {
    const error = new AuthenticationError('Authentication failed', 0)

    assert.strictEqual(error.message, 'Authentication failed')
    assert.strictEqual(error.status, 401)
  })

  test('should have a proper stack trace', () => {
    const error = new AuthenticationError('Test error', 401)

    assert.ok(error.stack)
    assert.ok(error.stack.includes('AuthenticationError'))
  })
})
