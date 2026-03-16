import { test, describe, mock } from 'node:test'
import assert from 'node:assert'
import type { SerializeFunction } from '../src/Authenticator'
import { SecureSessionManager } from '../src/session-managers/SecureSessionManager'

const serializeIdentity: SerializeFunction = async (id) => id

type MockSession = {
  regenerate?: (keepSessionInfoKeys?: string[]) => Promise<void>
  get: (key: string) => unknown
  set: (key: string, value: unknown) => void
  data?: () => Record<string, unknown> | undefined
  [key: string]: unknown
}

type MockRequest = {
  session: MockSession
}

describe('SecureSessionManager', () => {
  test('should throw an Error if no parameter was passed', () => {
    assert.throws(
      // @ts-expect-error - strictEqual-error expecting atleast a parameter
      () => new SecureSessionManager(),
      (err) => {
        assert(err instanceof Error)
        assert.strictEqual(
          err.message,
          'SecureSessionManager#constructor must have a valid serializeUser-function passed as a parameter'
        )
        return true
      }
    )
  })

  test('should throw an Error if no serializeUser-function was passed as second parameter', () => {
    assert.throws(
      // @ts-expect-error - strictEqual-error expecting a function as second parameter
      () => new SecureSessionManager({}),
      (err) => {
        assert(err instanceof Error)
        assert.strictEqual(
          err.message,
          'SecureSessionManager#constructor must have a valid serializeUser-function passed as a parameter'
        )
        return true
      }
    )
  })

  test('should throw an Error if no serializeUser-function was passed as second parameter', () => {
    assert.throws(
      // @ts-expect-error - strictEqual-error expecting a function as second parameter
      () => new SecureSessionManager({}),
      (err) => {
        assert(err instanceof Error)
        assert.strictEqual(
          err.message,
          'SecureSessionManager#constructor must have a valid serializeUser-function passed as a parameter'
        )
        return true
      }
    )
  })

  test('should not throw an Error if no serializeUser-function was passed as first parameter', () => {
    const sessionManager = new SecureSessionManager(serializeIdentity)
    assert.strictEqual(sessionManager.key, 'passport')
  })

  test('should not throw an Error if no serializeUser-function was passed as second parameter', () => {
    const sessionManager = new SecureSessionManager({}, serializeIdentity)
    assert.strictEqual(sessionManager.key, 'passport')
  })

  test('should set the key accordingly', () => {
    const sessionManager = new SecureSessionManager({ key: 'test' }, serializeIdentity)
    assert.strictEqual(sessionManager.key, 'test')
  })

  test('should ignore non-string keys', () => {
    // @ts-expect-error - strictEqual-error key has to be of type string
    const sessionManager = new SecureSessionManager({ key: 1 }, serializeIdentity)
    assert.strictEqual(sessionManager.key, 'passport')
  })

  test('should only call request.session.regenerate once if a function', async () => {
    const sessionManger = new SecureSessionManager({}, serializeIdentity)
    const user = { id: 'test' }
    const request: MockRequest = {
      session: { regenerate: mock.fn(async () => {}), get: () => undefined, set: () => {}, data: () => ({}) }
    }
    await sessionManger.logIn(request, user)
    // @ts-expect-error - regenerate is a mock function
    assert.strictEqual(request.session.regenerate.mock.callCount(), 1)
  })

  test('should call request.session.regenerate function if clearSessionOnLogin is false', async () => {
    const sessionManger = new SecureSessionManager(
      { clearSessionOnLogin: false },
      serializeIdentity
    )
    const user = { id: 'test' }
    const request: MockRequest = {
      session: { regenerate: mock.fn(async () => {}), get: () => undefined, set: () => {}, data: () => ({}) }
    }
    await sessionManger.logIn(request, user)
    // @ts-expect-error - regenerate is a mock function
    assert.strictEqual(request.session.regenerate.mock.callCount(), 1)
    mock.reset()
  })

  test('should call request.session.regenerate function with all properties from session if keepSessionInfo is true', async () => {
    const sessionManger = new SecureSessionManager(
      { clearSessionOnLogin: true },
      serializeIdentity
    )
    const user = { id: 'test' }
    const request: MockRequest = {
      session: { regenerate: mock.fn(async () => {}), get: () => undefined, set: () => {}, data: () => ({}), sessionValue: 'exist' }
    }
    await sessionManger.logIn(request, user, { keepSessionInfo: true })
    // @ts-expect-error - regenerate is a mock function
    assert.strictEqual(request.session.regenerate.mock.callCount(), 1)
    // @ts-expect-error - regenerate is a mock function
    assert.deepStrictEqual(request.session.regenerate.mock.calls[0].arguments, [
      ['session', 'regenerate', 'get', 'set', 'data', 'sessionValue']
    ])
    mock.reset()
  })

  test('should call request.session.regenerate function with default properties from session if keepSessionInfo is false', async () => {
    const sessionManger = new SecureSessionManager(
      { clearSessionOnLogin: true },
      serializeIdentity
    )
    const user = { id: 'test' }
    const request: MockRequest = {
      session: { regenerate: mock.fn(async () => {}), get: () => undefined, set: () => {}, data: () => ({}), sessionValue: 'exist' }
    }
    await sessionManger.logIn(request, user, { keepSessionInfo: false })
    // @ts-expect-error - regenerate is a mock function
    assert.strictEqual(request.session.regenerate.mock.callCount(), 1)
    // @ts-expect-error - regenerate is a mock function
    assert.deepStrictEqual(request.session.regenerate.mock.calls[0].arguments, [['session']])
  })

  test('should call session.set function if no regenerate function provided and keepSessionInfo is true', async () => {
    const sessionManger = new SecureSessionManager(
      { clearSessionOnLogin: true },
      serializeIdentity
    )
    const user = { id: 'test' }
    const set = mock.fn()
    const request: MockRequest = {
      session: { get: () => undefined, set, data: () => ({}), sessionValue: 'exist' }
    }
    await sessionManger.logIn(request, user, { keepSessionInfo: false })
    assert.strictEqual(set.mock.callCount(), 1)
    assert.deepStrictEqual(set.mock.calls[0].arguments, ['passport', { id: 'test' }])
  })
})
