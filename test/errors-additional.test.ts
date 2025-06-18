import { describe, test } from 'node:test'
import assert from 'node:assert'

import AuthenticationError from '../src/errors'

describe('AuthenticationError', () => {
  test('sets name, message and custom status', () => {
    const err = new AuthenticationError('Boom', 403)

    // Inheritance checks
    assert.ok(err instanceof Error)
    assert.ok(err instanceof AuthenticationError)

    // Property checks
    assert.strictEqual(err.name, 'AuthenticationError')
    assert.strictEqual(err.message, 'Boom')
    assert.strictEqual(err.status, 403)
  })

  test('defaults status to 401 when not provided', () => {
    const err = new AuthenticationError('Unauthorized', undefined as any)
    assert.strictEqual(err.status, 401)
  })
})
