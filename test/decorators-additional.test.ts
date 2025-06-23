import { describe, test } from 'node:test'
import assert from 'node:assert'

import { isUnauthenticated } from '../src/decorators/is-unauthenticated'
import { logIn } from '../src/decorators/login'

describe('isUnauthenticated decorator', () => {
  test('returns false when request is authenticated', () => {
    const request: any = { isAuthenticated: () => true }
    const result = isUnauthenticated.call(request)
    assert.strictEqual(result, false)
  })

  test('returns true when request is not authenticated', () => {
    const request: any = { isAuthenticated: () => false }
    const result = isUnauthenticated.call(request)
    assert.strictEqual(result, true)
  })
})

describe('logIn decorator error handling', () => {
  test('throws error when passport is not initialized', async () => {
    const request: any = {}
    await assert.rejects(
      () => (logIn as any).call(request, { id: 1 }),
      /passport\.initialize\(\) plugin not in use/
    )
  })

  test('clears user property and rethrows error when sessionManager.logIn fails', async () => {
    const error = new Error('Session login failed')
    const request: any = {
      passport: {
        userProperty: 'user',
        sessionManager: {
          async logIn () {
            throw error
          }
        }
      }
    }

    await assert.rejects(
      () => (logIn as any).call(request, { name: 'tester' }),
      /Session login failed/
    )
    assert.strictEqual(request.user, null)
  })
})
