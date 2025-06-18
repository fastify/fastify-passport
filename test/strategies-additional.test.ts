import { describe, test } from 'node:test'
import assert from 'node:assert'

import { SessionStrategy } from '../src/strategies/SessionStrategy'
import { Strategy } from '../src/strategies'

/* -------------------------------------------------------------------------- */
/* SessionStrategy else-branch (pass)                                         */
/* -------------------------------------------------------------------------- */

describe('SessionStrategy pass branch', () => {
  test('calls pass when no session user present', async () => {
    let passed = false

    const deserialize = async () => ({})
    const strategy = new SessionStrategy(deserialize)

    // replace pass implementation
    strategy.pass = () => {
      passed = true
    }

    const request: any = {
      passport: {
        sessionManager: {
          getUserFromSession: () => undefined
        },
        userProperty: 'user'
      }
    }

    strategy.authenticate(request)

    assert.ok(passed)
  })
})

/* -------------------------------------------------------------------------- */
/* Base Strategy authenticate must throw                                      */
/* -------------------------------------------------------------------------- */

describe('Base Strategy authenticate default', () => {
  test('throws error if not overridden', () => {
    const base = new Strategy('base')
    assert.throws(() => (base as any).authenticate({}, {}), /must be overridden/)
  })
})

describe('SessionStrategy deserialize branch', () => {
  test('deserializes user when sessionUser is present', async () => {
    let deserializedCalled = false
    const deserialize = async (stored: any, _req: any) => {
      deserializedCalled = true
      return { name: 'deserialized' }
    }

    const strategy = new SessionStrategy(deserialize)
    let passCalled = false

    let doneResolve: () => void
    const done = new Promise<void>((resolve) => { doneResolve = resolve })

    strategy.pass = () => {
      passCalled = true
      doneResolve()
    }

    const request: any = {
      passport: {
        sessionManager: {
          getUserFromSession: () => ({ id: 1 })
        },
        userProperty: 'user'
      }
    }

    await strategy.authenticate(request)
    await done

    assert.ok(deserializedCalled)
    assert.ok(passCalled)
    assert.deepStrictEqual(request.user, { name: 'deserialized' })
  })
})

describe('SessionStrategy options.pauseStream branch', () => {
  test('errors when pauseStream is true', async () => {
    const strategy = new SessionStrategy(async () => ({}))
    let errorCalled = false
    strategy.error = () => {
      errorCalled = true
    }

    const request: any = {
      passport: {
        sessionManager: {
          getUserFromSession: () => undefined
        }
      }
    }

    strategy.authenticate(request, { pauseStream: true })
    assert.ok(errorCalled)
  })
})

describe('SessionStrategy numeric zero user branch', () => {
  test('treats session user 0 as valid', async () => {
    let deserializedCount = 0
    const deserialize = async (stored: any) => {
      deserializedCount += stored
      return { id: stored }
    }

    const strategy = new SessionStrategy(deserialize)
    const done = new Promise<void>((resolve) => {
      strategy.pass = () => resolve()
    })

    const request: any = {
      passport: {
        sessionManager: {
          getUserFromSession: () => 0
        },
        userProperty: 'user'
      }
    }

    await strategy.authenticate(request)
    await done

    assert.strictEqual(deserializedCount, 0)
    assert.deepStrictEqual(request.user, { id: 0 })
  })
})

describe('SessionStrategy deserializer returns undefined', () => {
  test('logs out when user not deserialized', async () => {
    const deserialize = async () => undefined

    const strategy = new SessionStrategy(deserialize)
    let logoutCalled = false
    let passCalled = false

    let doneResolve: () => void
    const done = new Promise<void>((resolve) => { doneResolve = resolve })

    strategy.pass = () => {
      passCalled = true
      doneResolve()
    }

    const mockLogOut = async () => {
      logoutCalled = true
    }

    const request: any = {
      passport: {
        sessionManager: {
          getUserFromSession: () => ({ id: 5 }),
          logOut: mockLogOut
        },
        userProperty: 'user'
      }
    }

    await strategy.authenticate(request)
    await done

    assert.ok(logoutCalled)
    assert.ok(passCalled)
    assert.strictEqual(request.user, undefined)
  })
})

describe('SessionStrategy deserializer error branch', () => {
  test('calls error when deserializer rejects', async () => {
    const deserialize = async () => {
      throw new Error('bad')
    }

    const strategy = new SessionStrategy(deserialize)
    let errorInvoked = false
    const done = new Promise<void>((resolve) => {
      strategy.error = () => {
        errorInvoked = true
        resolve()
      }
    })

    const request: any = {
      passport: {
        sessionManager: {
          getUserFromSession: () => ({ id: 7 })
        },
        userProperty: 'user'
      }
    }

    await strategy.authenticate(request)
    await done

    assert.ok(errorInvoked)
  })
})

describe('SessionStrategy missing passport', () => {
  test('errors when passport not initialized', () => {
    const strategy = new SessionStrategy(async () => ({}))
    let errorCalled = false
    strategy.error = () => { errorCalled = true }

    const request: any = {}
    strategy.authenticate(request)
    assert.ok(errorCalled)
  })
})
