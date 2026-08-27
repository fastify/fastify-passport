import { describe, test, TestContext } from 'node:test'
import { SerializeFunction } from '../src/authenticator'
import { SessionStrategy } from '../src/strategies'
import { FastifyRequest } from 'fastify'

describe('SessionStrategy', () => {
  test('should throw an Error if no parameter was passed', (t: TestContext) => {
    t.assert.throws(
      // @ts-expect-error.strictEqual-error expecting atleast a parameter
      () => new SessionStrategy(),
      (err: any) => {
        t.assert.ok(err instanceof Error)
        t.assert.strictEqual(
          err.message,
          'SessionStrategy#constructor must have a valid deserializeUser-function passed as a parameter'
        )
        return true
      }
    )
  })

  test('should throw an Error if no deserializeUser-function was passed as second parameter', (t: TestContext) => {
    t.assert.throws(
      // @ts-expect-error.strictEqual-error expecting a function as second parameter
      () => new SessionStrategy({}),
      (err: any) => {
        t.assert.ok(err instanceof Error)
        t.assert.strictEqual(
          err.message,
          'SessionStrategy#constructor must have a valid deserializeUser-function passed as a parameter'
        )
        return true
      }
    )
  })

  test('should throw an Error if no deserializeUser-function was passed as second parameter', (t: TestContext) => {
    t.assert.throws(
      // @ts-expect-error.strictEqual-error expecting a function as second parameter
      () => new SessionStrategy({}),
      (err: any) => {
        t.assert.ok(err instanceof Error)
        t.assert.strictEqual(
          err.message,
          'SessionStrategy#constructor must have a valid deserializeUser-function passed as a parameter'
        )
        return true
      }
    )
  })

  test('should not throw an Error if no deserializeUser-function was passed as first parameter', (t: TestContext) => {
    t.assert.doesNotThrow(() => new SessionStrategy(((id: string) => id) as unknown as SerializeFunction))
  })

  test('should not throw an Error if no deserializeUser-function was passed as second parameter', (t: TestContext) => {
    t.assert.doesNotThrow(() => new SessionStrategy({}, ((id: string) => id) as unknown as SerializeFunction))
  })

  test('should handle authenticate call without options parameter', (t: TestContext) => {
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
    } as unknown as FastifyRequest

    strategy.authenticate(mockRequest)

    t.assert.ok(passCalled, 'pass should be called when no session user')
  })

  test('should call error when passport is not initialized', (t: TestContext) => {
    const strategy = new SessionStrategy(async (user) => user)

    let receivedError: Error | undefined

    strategy.error = (err: any) => {
      receivedError = err
    }

    strategy.authenticate({} as FastifyRequest)

    t.assert.ok(receivedError)
    t.assert.strictEqual(
      receivedError.message,
      'passport.initialize() plugin not in use'
    )
  })

  test('should call error when pauseStream is enabled', (t: TestContext) => {
    const strategy = new SessionStrategy(async (user) => user)

    let receivedError: Error | undefined

    strategy.error = (err: any) => {
      receivedError = err
    }

    const request = {
      passport: {}
    } as FastifyRequest

    strategy.authenticate(request, {
      pauseStream: true
    })

    t.assert.ok(receivedError)
    t.assert.strictEqual(
      receivedError.message,
      "fastify-passport doesn't support pauseStream option."
    )
  })
})
