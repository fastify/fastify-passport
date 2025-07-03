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

    // Mock the strategy methods
    strategy.error = (err: Error) => {
      errorCalled = true
      errorMessage = err.message
    }

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

    // Wait a bit for the async operations to complete
    await new Promise(resolve => setTimeout(resolve, 10))

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

    // Mock the strategy methods
    strategy.error = () => {
      errorCalled = true
    }

    strategy.pass = () => {
      passCalled = true
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

    // Wait a bit for the async operations to complete
    await new Promise(resolve => setTimeout(resolve, 10))

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

    strategy.error = () => {
      errorCalled = true
    }

    strategy.pass = () => {
      passCalled = true
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

    // Wait a bit for the async operations to complete
    await new Promise(resolve => setTimeout(resolve, 10))

    // Should pass immediately without trying to deserialize
    assert.strictEqual(errorCalled, false, 'error() should NOT have been called')
    assert.strictEqual(passCalled, true, 'pass() should have been called when no session user')
  })
})
