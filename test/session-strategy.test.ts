import { SerializeFunction } from '../src/Authenticator'
import { SessionStrategy } from '../src/strategies/SessionStrategy'

describe('SessionStrategy', () => {
  test('should throw an Error if no parameter was passed', () => {
    // @ts-expect-error expecting atleast a paramet
    expect(() => new SessionStrategy()).toThrow(
      'SessionStrategy#constructor must have a valid deserializeUser-function passed as a parameter'
    )
  })

  test('should throw an Error if no deserializeUser-function was passed as second parameter', () => {
    // @ts-expect-error expecting a function as second parameter
    expect(() => new SessionStrategy({})).toThrow(
      'SessionStrategy#constructor must have a valid deserializeUser-function passed as a parameter'
    )
  })

  test('should throw an Error if no deserializeUser-function was passed as second parameter', () => {
    // @ts-expect-error expecting a function as second parameter
    expect(() => new SessionStrategy({})).toThrow(
      'SessionStrategy#constructor must have a valid deserializeUser-function passed as a parameter'
    )
  })

  test('should not throw an Error if no deserializeUser-function was passed as first parameter', () => {
    new SessionStrategy(((id) => id) as unknown as SerializeFunction)
  })

  test('should not throw an Error if no deserializeUser-function was passed as second parameter', () => {
    new SessionStrategy({}, ((id) => id) as unknown as SerializeFunction)
  })
})
