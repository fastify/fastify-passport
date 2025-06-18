import { test, describe } from 'node:test'
import assert from 'node:assert'
import { AuthenticationRoute } from '../src/AuthenticationRoute'
import Authenticator from '../src/Authenticator'
import { SecureSessionManager } from '../src/session-managers/SecureSessionManager'

describe('Coverage Additional Tests', () => {
  // Test for uncovered lines in AuthenticationRoute.toFlashObject (lines 241-242)
  test('toFlashObject handles undefined input correctly', () => {
    const authenticator = new Authenticator()
    const route: any = new AuthenticationRoute(authenticator, 'dummy')

    // Test the undefined branch (lines 241-242)
    const result = route.toFlashObject(undefined, 'info')
    assert.strictEqual(result, undefined)

    // Test string input
    const stringResult = route.toFlashObject('test message', 'error')
    assert.deepStrictEqual(stringResult, { type: 'error', message: 'test message' })

    // Test FlashObject input
    const flashObject = { type: 'success', message: 'flash message' }
    const flashResult = route.toFlashObject(flashObject, 'warning')
    assert.deepStrictEqual(flashResult, flashObject)
  })

  // Test for uncovered lines in Authenticator.serializeUser (lines 273-274)
  test('serializeUser error path when no serializers return result', async () => {
    const authenticator = new Authenticator()
    // Register serializers that all throw 'pass'
    // eslint-disable-next-line no-throw-literal
    authenticator.registerUserSerializer(async () => { throw 'pass' })
    // eslint-disable-next-line no-throw-literal
    authenticator.registerUserSerializer(async () => { throw 'pass' })

    const request = {} as any

    try {
      await authenticator.serializeUser({ id: 1 }, request)
      assert.fail('Should have thrown an error')
    } catch (error: any) {
      assert.strictEqual(error.message, 'Failed to serialize user into session. Tried 2 serializers.')
    }
  })

  // Test for uncovered lines in Authenticator.deserializeUser (lines 327-328)
  test('deserializeUser error path when no deserializers work', async () => {
    const authenticator = new Authenticator()
    // Register deserializers that all throw 'pass'
    // eslint-disable-next-line no-throw-literal
    authenticator.registerUserDeserializer(async () => { throw 'pass' })
    // eslint-disable-next-line no-throw-literal
    authenticator.registerUserDeserializer(async () => { throw 'pass' })

    const request = {} as any

    try {
      await authenticator.deserializeUser('test-data', request)
      assert.fail('Should have thrown an error')
    } catch (error: any) {
      assert.strictEqual(error.message, 'Failed to deserialize user out of session. Tried 2 serializers.')
    }
  })

  // Test for uncovered lines in Authenticator.transformAuthInfo (lines 355-356)
  test('transformAuthInfo returns original info when no transformers registered', async () => {
    const authenticator = new Authenticator()
    const info = { client: 'test-client', scope: 'read' }
    const request = {} as any

    const result = await authenticator.transformAuthInfo(info, request)
    assert.deepStrictEqual(result, info)
  })

  test('transformAuthInfo returns original info when all transformers pass', async () => {
    const authenticator = new Authenticator()
    // eslint-disable-next-line no-throw-literal
    authenticator.registerAuthInfoTransformer(async () => { throw 'pass' })
    // eslint-disable-next-line no-throw-literal
    authenticator.registerAuthInfoTransformer(async () => { throw 'pass' })

    const info = { client: 'test-client', scope: 'read' }
    const request = {} as any

    const result = await authenticator.transformAuthInfo(info, request)
    assert.deepStrictEqual(result, info)
  })

  // NEW: Test for transformAuthInfo with falsy but not undefined result (lines 355-356)
  test('transformAuthInfo uses original info when transformer returns falsy non-undefined value', async () => {
    const authenticator = new Authenticator()

    // Register a transformer that returns 0 (falsy but not undefined)
    authenticator.registerAuthInfoTransformer(async () => 0)

    const info = { client: 'test-client', scope: 'read' }
    const request = {} as any

    const result = await authenticator.transformAuthInfo(info, request)
    // Should fall back to original info because 0 is falsy in the || expression
    assert.deepStrictEqual(result, info)
  })

  // Test for uncovered line in SecureSessionManager (line 59)
  test('SecureSessionManager handles secure-session path without regenerate method', async () => {
    const serializer = async (user: any) => user
    const manager = new SecureSessionManager(serializer)

    const sessionData = { token: 'abc123', user: 'existing-user' }
    const clearedFields: string[] = []

    const request: any = {
      session: {
        // No regenerate method - simulates @fastify/secure-session
        data: () => sessionData,
        set (key: string, val: any) {
          if (val === undefined) {
            clearedFields.push(key)
          }
        },
        get () {
          return undefined
        }
      }
    }

    await manager.logIn(request, { id: 1 })

    // Should clear non-ignored fields when using secure-session
    assert.ok(clearedFields.includes('token'))
    assert.ok(!clearedFields.includes('session')) // session should be ignored
  })

  // Additional test for line 59 - test when clearSessionOnLogin is false
  test('SecureSessionManager with clearSessionOnLogin false skips clearing', async () => {
    const serializer = async (user: any) => user
    const manager = new SecureSessionManager({ clearSessionOnLogin: false }, serializer)

    const sessionData = { token: 'abc123', user: 'existing-user' }
    const clearedFields: string[] = []

    const request: any = {
      session: {
        // No regenerate method - simulates @fastify/secure-session
        data: () => sessionData,
        set (key: string, val: any) {
          if (val === undefined) {
            clearedFields.push(key)
          }
        },
        get () {
          return undefined
        }
      }
    }

    await manager.logIn(request, { id: 1 })

    // Should not clear any fields when clearSessionOnLogin is false
    assert.strictEqual(clearedFields.length, 0)
  })

  // NEW: Test targeting line 59 with null serialized object
  test('SecureSessionManager handles secure-session path when serializer returns null', async () => {
    const serializer = async () => null // Returns null (falsy)
    const manager = new SecureSessionManager(serializer)

    const sessionData = { token: 'abc123', user: 'existing-user' }
    const clearedFields: string[] = []

    const request: any = {
      session: {
        // No regenerate method - simulates @fastify/secure-session
        data: () => sessionData,
        set (key: string, val: any) {
          if (val === undefined) {
            clearedFields.push(key)
          }
        },
        get () {
          return undefined
        }
      }
    }

    await manager.logIn(request, { id: 1 })

    // Should not clear any fields because object is null (falsy)
    assert.strictEqual(clearedFields.length, 0)
  })

  // Test edge case for Authenticator runStack with empty stack
  test('runStack returns undefined for empty stack', async () => {
    const authenticator = new Authenticator()
    const emptyStack: any[] = []

    // Access the private runStack method via type assertion
    const result = await (authenticator as any).runStack(emptyStack, 'arg1', 'arg2')
    assert.strictEqual(result, undefined)
  })

  // Test Authenticator deserializeUser with result that is neither truthy nor null/false
  test('deserializeUser handles undefined result correctly', async () => {
    const authenticator = new Authenticator()
    authenticator.registerUserDeserializer(async () => undefined)

    const request = {} as any

    try {
      await authenticator.deserializeUser('test-data', request)
      assert.fail('Should have thrown an error')
    } catch (error: any) {
      assert.strictEqual(error.message, 'Failed to deserialize user out of session. Tried 1 serializers.')
    }
  })
})
