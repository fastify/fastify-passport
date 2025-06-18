import { describe, test } from 'node:test'
import assert from 'node:assert'

import { SecureSessionManager } from '../src/session-managers/SecureSessionManager'

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

type MockSession = {
  regenerate?: (keys?: string[]) => Promise<void>
  set: (key: string, value: any) => void
  get: (key: string) => any
  data?: () => Record<string, any>
}

const createRequest = (session: MockSession): any => ({ session })

/* -------------------------------------------------------------------------- */

describe('SecureSessionManager logIn regeneration paths', () => {
  test('calls regenerate with keepSessionInfoKeys when clearSessionOnLogin true', async () => {
    let regenerateCalledWith: string[] | undefined

    const session: MockSession = {
      async regenerate (keys?: string[]) {
        regenerateCalledWith = keys
      },
      set () {},
      get () {
        return undefined
      }
    }

    const manager = new SecureSessionManager(async (u) => u)

    const request = createRequest(session)

    await manager.logIn(request, { id: 1 }, { keepSessionInfo: true })

    assert.ok(Array.isArray(regenerateCalledWith))
    assert.ok(regenerateCalledWith!.includes('session'))
  })

  test('calls regenerate without args when clearSessionOnLogin false', async () => {
    let regenerateArgs: any = 'not-called'

    const session: MockSession = {
      async regenerate (keys?: string[]) {
        regenerateArgs = keys
      },
      set () {},
      get () {
        return undefined
      }
    }

    const manager = new SecureSessionManager({ clearSessionOnLogin: false }, async (u) => u)

    const request = createRequest(session)

    await manager.logIn(request, { id: 2 })

    assert.strictEqual(regenerateArgs, undefined)
  })

  test('secure-session branch clears non-ignored fields', async () => {
    const cleared: string[] = []

    const session: MockSession = {
      // no regenerate method => secure-session path
      data: () => ({ token: 'abc', session: 'keep' }),
      set (key: string, val: any) {
        if (val === undefined) cleared.push(key)
      },
      get () {
        return undefined
      }
    }

    const manager = new SecureSessionManager(async (u) => u)
    const request = createRequest(session)

    await manager.logIn(request, { id: 3 })

    assert.deepStrictEqual(cleared, ['token'])
  })

  test('regenerate called when serialized object is falsy', async () => {
    let regenerateArgs: any = 'not-called'

    const session: MockSession = {
      async regenerate (keys?: string[]) {
        regenerateArgs = keys
      },
      set () {},
      get () {
        return undefined
      }
    }

    const manager = new SecureSessionManager(async () => null) // object falsy
    const request = createRequest(session)

    await manager.logIn(request, { id: 4 })

    assert.strictEqual(regenerateArgs, undefined)
  })
})
