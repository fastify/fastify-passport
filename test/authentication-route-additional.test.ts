import { describe, test } from 'node:test'
import assert from 'node:assert'

import Authenticator from '../src/Authenticator'
import { Strategy } from '../src/strategies'
import { AuthenticationRoute } from '../src/AuthenticationRoute'
import { getRegisteredTestServer } from './helpers'

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

class NumericFailStrategy extends Strategy {
  authenticate () {
    // Trigger fail path with numeric status only (lines 241-242)
    this.fail(401)
  }
}

class ChallengeFailStrategy extends Strategy {
  authenticate () {
    // Trigger fail path with string challenge + status
    this.fail('Basic realm="Users"', 401)
  }
}

const createMockReply = () => {
  const reply: any = {
    statusCode: 0,
    headers: {} as Record<string, any>,
    status (code: number) {
      this.statusCode = code
      return this
    },
    code (code: number) {
      this.statusCode = code
      return this
    },
    header (key: string, value: any) {
      this.headers[key] = value
      return this
    },
    redirect () {
      return this
    },
    send () {
      return this
    }
  }
  return reply
}

const createMockRequest = (authenticator?: Authenticator) => {
  const messages: string[] = []
  const sessionStore: Record<string, any> = {}
  const request: any = {
    log: { debug () {}, trace () {} },
    isAuthenticated: () => false,
    session: {
      get (key: string) {
        return sessionStore[key]
      },
      set (key: string, val: any) {
        sessionStore[key] = val
      }
    },
    flash: (type: string, message: string) => {
      messages.push(`${type}:${message}`)
    },
    _messages: messages
  }
  if (authenticator) request.passport = authenticator
  return request
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                       */
/* -------------------------------------------------------------------------- */

describe('AuthenticationRoute uncovered branches', () => {
  /* Lines 102-103 – handler throws when passport not initialized */
  test('handler rejects if request.passport is missing', async () => {
    const authenticator = new Authenticator()
    const route: any = new AuthenticationRoute(authenticator, 'dummy')

    const request = createMockRequest() // no passport property
    const reply = {}

    await assert.rejects(() => route.handler(request, reply), /passport\.initialize\(\) plugin not in use/)
  })

  /* Lines 241-242 + 300-301 – numeric fail → 401 code path (no challenge header) */
  test('numeric fail results in 401 status code', async () => {
    const authenticator = new Authenticator()
    authenticator.use(new NumericFailStrategy('numeric-fail'))

    const route = new AuthenticationRoute(authenticator, 'numeric-fail')
    const request = createMockRequest(authenticator)
    const reply = createMockReply()

    await route.handler(request, reply)

    assert.strictEqual(reply.statusCode, 401)
    // No WWW-Authenticate header when only status provided
    assert.ok(!('WWW-Authenticate' in reply.headers))
  })

  /* Lines 300-301, 308-309, 312-313 – challenge fail adds WWW-Authenticate header */
  test('challenge fail sets WWW-Authenticate header', async () => {
    const authenticator = new Authenticator()
    authenticator.use(new ChallengeFailStrategy('challenge-fail'))

    const route = new AuthenticationRoute(authenticator, 'challenge-fail')
    const request = createMockRequest(authenticator)
    const reply = createMockReply()

    await route.handler(request, reply)

    assert.strictEqual(reply.statusCode, 401)
    assert.deepStrictEqual(reply.headers['WWW-Authenticate'], ['Basic realm="Users"'])
  })

  /* Lines 271-285 – onAllFailed callback branch */
  test('onAllFailed invokes provided callback', async () => {
    const authenticator = new Authenticator()
    authenticator.use(new ChallengeFailStrategy('callback-fail'))

    let callbackInvoked = false
    const callback = async (_req: any, _rep: any, err: null | Error, user: unknown) => {
      callbackInvoked = true
      assert.strictEqual(err, null)
      assert.strictEqual(user, false)
    }

    const route = new AuthenticationRoute(authenticator, 'callback-fail', {}, callback)
    const request = createMockRequest(authenticator)
    const reply = createMockReply()

    await route.handler(request, reply)

    assert.ok(callbackInvoked)
  })

  /* Lines 308-313 – applyFlashOrMessage adds flash & message */
  test('applyFlashOrMessage stores flash and session message', () => {
    const authenticator = new Authenticator()
    const options = { successFlash: true, successMessage: true }
    const route: any = new AuthenticationRoute(authenticator, 'dummy', options)

    const request = createMockRequest(authenticator)

    route.applyFlashOrMessage('success', request, { type: 'success', message: 'yay' })

    // Flash recorded
    assert.ok(request._messages.includes('success:yay'))
    // Session message stored
    assert.deepStrictEqual(request.session.get('messages'), ['yay'])
  })

  /* Lines 360-371 – getStrategyName & getStrategy error branch */
  test('getStrategyName and getStrategy behave correctly', () => {
    const authenticator = new Authenticator()
    const route: any = new AuthenticationRoute(authenticator, 'dummy')

    // getStrategyName handles strings
    assert.strictEqual(route.getStrategyName('local'), 'local')

    // getStrategyName handles instances
    const inst = new Strategy('inst')
    assert.strictEqual(route.getStrategyName(inst), 'inst')

    // getStrategy throws on unknown strategy
    assert.throws(() => route.getStrategy('missing'), /Unknown authentication strategy/)
  })

  /* failureRedirect option triggers reply.redirect */
  test('failureRedirect option triggers redirect', async () => {
    const authenticator = new Authenticator()
    authenticator.use(new ChallengeFailStrategy('redirect-fail'))

    let redirectedTo: string | null = null
    const reply = createMockReply()
    reply.redirect = (url: string) => {
      redirectedTo = url
      return reply
    }

    const route = new AuthenticationRoute(authenticator, 'redirect-fail', { failureRedirect: '/login' })
    const request = createMockRequest(authenticator)

    await route.handler(request, reply)

    assert.strictEqual(redirectedTo, '/login')
  })

  /* failWithError option propagates AuthenticationError */
  test('failWithError causes AuthenticationError to be thrown', async () => {
    const authenticator = new Authenticator()
    authenticator.use(new ChallengeFailStrategy('error-fail'))

    const route = new AuthenticationRoute(authenticator, 'error-fail', { failWithError: true })
    const request = createMockRequest(authenticator)
    const reply = createMockReply()

    await assert.rejects(() => route.handler(request, reply), (err: any) => {
      assert.ok(err instanceof Error)
      // We don't import AuthenticationError to avoid circular but check message
      return /Unauthorized/.test(err.message)
    })
  })

  /* getStrategyName constructor.name branch */
  test('getStrategyName falls back to constructor name when name is falsy', () => {
    class NoNameStrategy extends Strategy {
      constructor () {
        super('') // empty string -> falsy
      }

      authenticate () {
        this.pass()
      }
    }

    const authenticator = new Authenticator()
    const route: any = new AuthenticationRoute(authenticator, 'dummy')
    const inst = new NoNameStrategy()

    assert.strictEqual(route.getStrategyName(inst), 'NoNameStrategy')
  })

  /* strategy.redirect path sets 302 status */
  test('strategy redirect sets status 302', async () => {
    class RedirectStrategy extends Strategy {
      authenticate (_req: any) {
        this.redirect('/foo')
      }
    }

    const authenticator = new Authenticator()
    authenticator.use(new RedirectStrategy('redir'))

    const route = new AuthenticationRoute(authenticator, 'redir')
    const request = createMockRequest(authenticator)
    const reply = createMockReply()

    await route.handler(request, reply)

    assert.strictEqual(reply.statusCode, 302)
  })

  /* strategy.pass path should resolve without changing status */
  test('strategy pass resolves without error', async () => {
    class PassStrategy extends Strategy {
      authenticate (_req: any) {
        this.pass()
      }
    }

    const authenticator = new Authenticator()
    authenticator.use(new PassStrategy('pass'))

    const route = new AuthenticationRoute(authenticator, 'pass')
    const request = createMockRequest(authenticator)
    const reply = createMockReply()

    await route.handler(request, reply)

    // Since we didn't set status, default 0 should remain
    assert.strictEqual(reply.statusCode, 0)
  })

  /* multi-strategy callback branch */
  test('onAllFailed multi-strategy callback receives arrays', async () => {
    class FailStrategy extends Strategy {
      authenticate () {
        this.fail('Basic', 401)
      }
    }

    const authenticator = new Authenticator()
    authenticator.use('s1', new FailStrategy('s1'))
    authenticator.use('s2', new FailStrategy('s2'))

    let challengesArg: any
    let statusesArg: any
    const callback = async (_req: any, _rep: any, _err: null | Error, _user: unknown, info: unknown, statuses?: (number | undefined)[]) => {
      challengesArg = info
      statusesArg = statuses
    }

    const route = new AuthenticationRoute(authenticator, ['s1', 's2'] as any, {}, callback)
    // force multi-strategy branch (the library sets false)
    ;(route as any).isMultiStrategy = true

    const request = createMockRequest(authenticator)
    const reply = createMockReply()

    await route.handler(request, reply)

    assert.deepStrictEqual(challengesArg, ['Basic', 'Basic'])
    assert.deepStrictEqual(statusesArg, [401, 401])
  })

  /* fail with no arguments (undefined branch) */
  test('strategy fail with no args defaults to 401 without auth header', async () => {
    class SimpleFailStrategy extends Strategy {
      authenticate () {
        this.fail()
      }
    }

    const authenticator = new Authenticator()
    authenticator.use(new SimpleFailStrategy('simple-fail'))

    const route = new AuthenticationRoute(authenticator, 'simple-fail')
    const request = createMockRequest(authenticator)
    const reply = createMockReply()

    await route.handler(request, reply)

    assert.strictEqual(reply.statusCode, 401)
    assert.ok(!('WWW-Authenticate' in reply.headers))
  })

  /* numeric fail followed by pass to keep chain running */
  test('numeric fail then pass continues to next strategy', async () => {
    class PassStrategy extends Strategy {
      authenticate () {
        this.pass()
      }
    }

    const authenticator = new Authenticator()
    authenticator.use('fail-num', new NumericFailStrategy('fail-num'))
    authenticator.use('pass', new PassStrategy('pass'))

    const { server } = getRegisteredTestServer(null)
    server.get('/', {
      preValidation: authenticator.authenticate(['fail-num', 'pass'])
    }, async () => 'ok')

    const response = await server.inject({ method: 'GET', url: '/' })
    assert.strictEqual(response.statusCode, 200)
    assert.strictEqual(response.payload, 'ok')
  })

  /* numeric-only fail directly via AuthenticationRoute */
  test('numeric-only fail hits branch', async () => {
    const authenticator = new Authenticator()
    authenticator.use('numfail', new NumericFailStrategy('numfail'))
    authenticator.use('pass', new Strategy('pass'))

    const route: any = new AuthenticationRoute(authenticator, 'numfail')
    const request = createMockRequest(authenticator)
    const reply = createMockReply()

    await route.handler(request, reply)
    assert.strictEqual(reply.statusCode, 401)
  })
})
