import { test, describe } from 'node:test'
import assert from 'node:assert'
import { SerializeFunction } from '../Authenticator'
import { SessionStrategy } from '../strategies/SessionStrategy'

describe('SessionStrategy', () => {
  test('should throw an Error if no parameter was passed', () => {
    assert.throws(
      // @ts-ignore.strictEqual-error expecting atleast a parameter
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
      // @ts-ignore.strictEqual-error expecting a function as second parameter
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
      // @ts-ignore.strictEqual-error expecting a function as second parameter
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
    assert.doesNotThrow(() => new SessionStrategy(((id) => id) as unknown as SerializeFunction))
  })

  test('should not throw an Error if no deserializeUser-function was passed as second parameter', () => {
    assert.doesNotThrow(() => new SessionStrategy({}, ((id) => id) as unknown as SerializeFunction))
  })
})
