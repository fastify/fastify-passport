import assert from 'node:assert'
import { describe, test } from 'node:test'
import type { DeserializeFunction } from '../src/Authenticator'
import { SessionStrategy } from '../src/strategies'

describe('SessionStrategy', () => {
  test('should throw an Error if no parameter was passed', () => {
    assert.throws(
      // @ts-expect-error.strictEqual-error expecting atleast a parameter
      () => new SessionStrategy(),
      (err) => {
        assert(err instanceof Error)
        assert.strictEqual(
          err.message,
          'SessionStrategy#constructor must have a valid deserializeUser-function passed as a parameter'
        )
        return true
      }
    )
  })

  test('should throw an Error if no deserializeUser-function was passed as second parameter', () => {
    assert.throws(
      // @ts-expect-error.strictEqual-error expecting a function as second parameter
      () => new SessionStrategy({}),
      (err) => {
        assert(err instanceof Error)
        assert.strictEqual(
          err.message,
          'SessionStrategy#constructor must have a valid deserializeUser-function passed as a parameter'
        )
        return true
      }
    )
  })

  test('should throw an Error if no deserializeUser-function was passed as second parameter', () => {
    assert.throws(
      // @ts-expect-error.strictEqual-error expecting a function as second parameter
      () => new SessionStrategy({}),
      (err) => {
        assert(err instanceof Error)
        assert.strictEqual(
          err.message,
          'SessionStrategy#constructor must have a valid deserializeUser-function passed as a parameter'
        )
        return true
      }
    )
  })

  test('should not throw an Error if no deserializeUser-function was passed as first parameter', () => {
    const deserialize: DeserializeFunction = async (id) => id
    assert.doesNotThrow(() => new SessionStrategy(deserialize))
  })

  test('should not throw an Error if no deserializeUser-function was passed as second parameter', () => {
    const deserialize: DeserializeFunction = async (id) => id
    assert.doesNotThrow(() => new SessionStrategy({}, deserialize))
  })

  test('should handle authenticate call without options parameter', () => {
    const strategy = new SessionStrategy(async (user) => user)
    let passCalled = false

    strategy.pass = () => {
      passCalled = true
    }

    const mockRequest = {
      passport: {
        sessionManager: {
          getUserFromSession: () => undefined
        }
      }
    }

    strategy.authenticate(mockRequest)

    assert.ok(passCalled, 'pass should be called when no session user')
  })
})
