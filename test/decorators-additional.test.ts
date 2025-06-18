import { describe, test } from 'node:test'
import assert from 'node:assert'

import { isUnauthenticated } from '../src/decorators/is-unauthenticated'
import { logIn } from '../src/decorators/login'

/* -------------------------------------------------------------------------- */
/* isUnauthenticated()                                                        */
/* -------------------------------------------------------------------------- */

describe('isUnauthenticated decorator', () => {
  test('returns false when request is authenticated', () => {
    const request: any = { isAuthenticated: () => true }
    const result = isUnauthenticated.call(request)
    assert.strictEqual(result, false)
  })

  test('returns true when request is NOT authenticated', () => {
    const request: any = { isAuthenticated: () => false }
    const result = isUnauthenticated.call(request)
    assert.strictEqual(result, true)
  })
})

/* -------------------------------------------------------------------------- */
/* logIn() decorator                                                           */
/* -------------------------------------------------------------------------- */

describe('logIn decorator error branches', () => {
  test('throws if passport.initialize() plugin not in use', async () => {
    const request: any = {}
    await assert.rejects(() => (logIn as any).call(request, { id: 1 }), /passport\.initialize\(\) plugin not in use/)
  })

  test('clears user property and rethrows when sessionManager.logIn rejects', async () => {
    const error = new Error('boom')
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

    await assert.rejects(() => (logIn as any).call(request, { name: 'tester' }), /boom/)
    assert.strictEqual(request.user, null)
  })
})
