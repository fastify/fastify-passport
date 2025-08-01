import { describe, test } from 'node:test'
import assert from 'node:assert'
import { SessionStrategy } from '../src/strategies/SessionStrategy'

describe('SessionStrategy deserialization error handling', () => {
  test('should call error() and not pass() when deserializeUser fails', async () => {
    let errorCalled = false
    let passCalled = false
    let errorMessage = ''

    // Create a deserializeUser function that always throws
    const deserializeUser = async () => {
      throw new Error('Deserialization failed')
    }

    const strategy = new SessionStrategy(deserializeUser)

    // Create promises to track when methods are called
    const errorPromise = new Promise<void>((resolve) => {
      strategy.error = (err: Error) => {
        errorCalled = true
        errorMessage = err.message
        resolve()
      }
    })

    strategy.pass = () => {
      passCalled = true
    }

    // Mock request with session data
    const mockRequest: any = {
      passport: {
        sessionManager: {
          getUserFromSession: () => 'user123', // Return a session user
          logOut: async () => {}
        },
        userProperty: 'user'
      }
    }

    // Call authenticate
    strategy.authenticate(mockRequest)

    // Wait for the error to be called
    await errorPromise

    // Verify that error was called but pass was not
    assert.strictEqual(errorCalled, true, 'error() should have been called')
    assert.strictEqual(passCalled, false, 'pass() should NOT have been called when deserialization fails')
    assert.strictEqual(errorMessage, 'Deserialization failed')
  })

  test('should call pass() when deserializeUser succeeds', async () => {
    let errorCalled = false
    let passCalled = false

    // Create a deserializeUser function that succeeds
    const deserializeUser = async () => {
      return { id: 'user123', name: 'Test User' }
    }

    const strategy = new SessionStrategy(deserializeUser)

    // Create promises to track when methods are called
    const passPromise = new Promise<void>((resolve) => {
      strategy.pass = () => {
        passCalled = true
        resolve()
      }
    })

    strategy.error = () => {
      errorCalled = true
    }

    // Mock request with session data
    const mockRequest: any = {
      passport: {
        sessionManager: {
          getUserFromSession: () => 'user123',
          logOut: async () => {}
        },
        userProperty: 'user'
      }
    }

    // Call authenticate
    strategy.authenticate(mockRequest)

    // Wait for pass to be called
    await passPromise

    // Verify that pass was called but error was not
    assert.strictEqual(errorCalled, false, 'error() should NOT have been called')
    assert.strictEqual(passCalled, true, 'pass() should have been called when deserialization succeeds')
    assert.ok(mockRequest.user, 'User should be set on request')
    assert.strictEqual(mockRequest.user.id, 'user123')
  })

  test('should call pass() when no session user exists', async () => {
    let errorCalled = false
    let passCalled = false

    const deserializeUser = async () => {
      throw new Error('Should not be called')
    }

    const strategy = new SessionStrategy(deserializeUser)

    // Create promises to track when methods are called
    const passPromise = new Promise<void>((resolve) => {
      strategy.pass = () => {
        passCalled = true
        resolve()
      }
    })

    strategy.error = () => {
      errorCalled = true
    }

    // Mock request with NO session data
    const mockRequest: any = {
      passport: {
        sessionManager: {
          getUserFromSession: () => null, // No session user
          logOut: async () => {}
        },
        userProperty: 'user'
      }
    }

    strategy.authenticate(mockRequest)

    // Wait for pass to be called
    await passPromise

    // Should pass immediately without trying to deserialize
    assert.strictEqual(errorCalled, false, 'error() should NOT have been called')
    assert.strictEqual(passCalled, true, 'pass() should have been called when no session user')
  })
})
