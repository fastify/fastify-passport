import { describe, test } from 'node:test'
import assert from 'node:assert'

import AuthenticationError from '../src/errors'

describe('AuthenticationError', () => {
  test('creates error with custom message and status code', () => {
    const err = new AuthenticationError('Access denied', 403)

    // Verify inheritance
    assert.ok(err instanceof Error)
    assert.ok(err instanceof AuthenticationError)

    // Verify properties
    assert.strictEqual(err.name, 'AuthenticationError')
    assert.strictEqual(err.message, 'Access denied')
    assert.strictEqual(err.status, 403)
  })

  test('defaults to 401 status when status is not provided', () => {
    const err = new AuthenticationError('Unauthorized', undefined as any)
    assert.strictEqual(err.status, 401)
    assert.strictEqual(err.message, 'Unauthorized')
    assert.strictEqual(err.name, 'AuthenticationError')
  })
})
