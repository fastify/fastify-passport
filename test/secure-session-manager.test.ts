import { FastifyRequest } from 'fastify'
import { SerializeFunction } from '../src/Authenticator'
import { SecureSessionManager } from '../src/session-managers/SecureSessionManager'

describe('SecureSessionManager', () => {
  test('should throw an Error if no parameter was passed', () => {
    // @ts-expect-error expecting atleast a parameter
    expect(() => new SecureSessionManager()).toThrow(
      'SecureSessionManager#constructor must have a valid serializeUser-function passed as a parameter'
    )
  })

  test('should throw an Error if no serializeUser-function was passed as second parameter', () => {
    // @ts-expect-error expecting a function as second parameter
    expect(() => new SecureSessionManager({})).toThrow(
      'SecureSessionManager#constructor must have a valid serializeUser-function passed as a parameter'
    )
  })

  test('should throw an Error if no serializeUser-function was passed as second parameter', () => {
    // @ts-expect-error expecting a function as second parameter
    expect(() => new SecureSessionManager({})).toThrow(
      'SecureSessionManager#constructor must have a valid serializeUser-function passed as a parameter'
    )
  })

  test('should not throw an Error if no serializeUser-function was passed as first parameter', () => {
    const sessionManager = new SecureSessionManager(((id) => id) as unknown as SerializeFunction)
    expect(sessionManager.key).toBe('passport')
  })

  test('should not throw an Error if no serializeUser-function was passed as second parameter', () => {
    const sessionManager = new SecureSessionManager({}, ((id) => id) as unknown as SerializeFunction)
    expect(sessionManager.key).toBe('passport')
  })

  test('should set the key accordingly', () => {
    const sessionManager = new SecureSessionManager({ key: 'test' }, ((id) => id) as unknown as SerializeFunction)
    expect(sessionManager.key).toBe('test')
  })

  test('should ignore non-string keys', () => {
    // @ts-expect-error key has to be of type string
    const sessionManager = new SecureSessionManager({ key: 1 }, ((id) => id) as unknown as SerializeFunction)
    expect(sessionManager.key).toBe('passport')
  })

  test('should only call request.session.regenerate once if a function', async () => {
    const sessionManger = new SecureSessionManager({}, ((id) => id) as unknown as SerializeFunction)
    const user = { id: 'test' }
    const request = {
      session: { regenerate: jest.fn(() => {}), set: () => {}, data: () => {} }
    } as unknown as FastifyRequest
    await sessionManger.logIn(request, user)
    expect(request.session.regenerate).toHaveBeenCalledTimes(1)
  })

  test('should call request.session.regenerate function if clearSessionOnLogin is false', async () => {
    const sessionManger = new SecureSessionManager(
      { clearSessionOnLogin: false },
      ((id) => id) as unknown as SerializeFunction
    )
    const user = { id: 'test' }
    const request = {
      session: { regenerate: jest.fn(() => {}), set: () => {}, data: () => {} }
    } as unknown as FastifyRequest
    await sessionManger.logIn(request, user)
    expect(request.session.regenerate).toHaveBeenCalledTimes(1)
  })

  test('should call request.session.regenerate function with all properties from session if keepSessionInfo is true', async () => {
    const sessionManger = new SecureSessionManager(
      { clearSessionOnLogin: true },
      ((id) => id) as unknown as SerializeFunction
    )
    const user = { id: 'test' }
    const request = {
      session: { regenerate: jest.fn(() => {}), set: () => {}, data: () => {}, sessionValue: 'exist' }
    } as unknown as FastifyRequest
    await sessionManger.logIn(request, user, { keepSessionInfo: true })
    expect(request.session.regenerate).toHaveBeenCalledTimes(1)
    expect(request.session.regenerate).toHaveBeenCalledWith(['session', 'regenerate', 'set', 'data', 'sessionValue'])
  })

  test('should call request.session.regenerate function with default properties from session if keepSessionInfo is false', async () => {
    const sessionManger = new SecureSessionManager(
      { clearSessionOnLogin: true },
      ((id) => id) as unknown as SerializeFunction
    )
    const user = { id: 'test' }
    const request = {
      session: { regenerate: jest.fn(() => {}), set: () => {}, data: () => {}, sessionValue: 'exist' }
    } as unknown as FastifyRequest
    await sessionManger.logIn(request, user, { keepSessionInfo: false })
    expect(request.session.regenerate).toHaveBeenCalledTimes(1)
    expect(request.session.regenerate).toHaveBeenCalledWith(['session'])
  })

  test('should call session.set function if no regenerate function provided and keepSessionInfo is true', async () => {
    const sessionManger = new SecureSessionManager(
      { clearSessionOnLogin: true },
      ((id) => id) as unknown as SerializeFunction
    )
    const user = { id: 'test' }
    const request = {
      session: { set: jest.fn(), data: () => {}, sessionValue: 'exist' }
    } as unknown as FastifyRequest
    await sessionManger.logIn(request, user, { keepSessionInfo: false })
    expect(request.session.set).toHaveBeenCalledTimes(1)
    expect(request.session.set).toHaveBeenCalledWith('passport', { id: 'test' })
  })
})
