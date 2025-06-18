/* eslint-disable no-throw-literal */
import { describe, test } from 'node:test'
import assert from 'node:assert'

import Authenticator from '../src/Authenticator'
import { Strategy } from '../src/strategies'

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

class SuccessStrategy extends Strategy {
  authenticate () {
    this.success({ name: 'ok' })
  }
}

/* -------------------------------------------------------------------------- */

describe('Authenticator uncovered branches', () => {
  /* 212-213: authorize() default options branch */
  test('authorize assigns default options and returns handler', () => {
    const passport = new Authenticator()
    passport.use(new SuccessStrategy('ok'))

    // no options passed -> lines 212-213 execute
    const handler = passport.authorize('ok')
    assert.strictEqual(typeof handler, 'function')
  })

  /* 273-274: deserializeUser returns false when deserializer returns false */
  test('deserializeUser returns false when deserializer returns false', async () => {
    const passport = new Authenticator()

    // deserializer that returns false triggers branch
    passport.registerUserDeserializer(async () => false)

    const result = await passport.deserializeUser('anything', {} as any)
    assert.strictEqual(result, false)
  })

  /* 327-328: runStack continues on "pass" sentinel */
  test('runStack skips over attempts that throw "pass"', async () => {
    const passport = new Authenticator()
    const stack = [

      async () => {
        // eslint-disable-next-line no-throw-literal
        throw 'pass'
      },
      async () => 'GOOD'
    ]

    // access private via casting
    const output = await (passport as any).runStack(stack, undefined, undefined)
    assert.strictEqual(output, 'GOOD')
  })

  /* 355-356: runStack fall-through returns undefined when nothing matches */
  test('runStack returns undefined when all attempts pass', async () => {
    const passport = new Authenticator()
    const stack = [

      async () => {
        // eslint-disable-next-line no-throw-literal
        throw 'pass'
      }
    ]

    const output = await (passport as any).runStack(stack, undefined, undefined)
    assert.strictEqual(output, undefined)
  })

  /* authenticate callback branch (options as function) */
  test('authenticate callback branch executed', () => {
    const passport = new Authenticator()
    passport.use(new SuccessStrategy('ok'))

    const cb = async () => {}
    const handler = passport.authenticate('ok', cb)
    assert.strictEqual(typeof handler, 'function')
  })

  /* trigger authorize branch with callback param (lines 212-213) */
  test('authorize with callback creates handler', () => {
    const passport = new Authenticator()
    passport.use(new SuccessStrategy('ok'))

    const callback = async () => {}
    const handler = passport.authorize('ok', callback)
    assert.strictEqual(typeof handler, 'function')
  })

  /* runStack continue on pass via serializeUser */
  test('serializeUser continues on "pass" sentinel', async () => {
    const passport = new Authenticator()
    passport.registerUserSerializer(async () => { throw 'pass' })
    passport.registerUserSerializer(async () => 'serial')

    const res = await passport.serializeUser({}, {} as any)
    assert.strictEqual(res, 'serial')
  })

  /* transformAuthInfo fall-through path */
  test('transformAuthInfo returns original when no transformers', async () => {
    const passport = new Authenticator()
    const info = { x: 1 }
    const out = await passport.transformAuthInfo(info, {} as any)
    assert.deepStrictEqual(out, info)
  })

  /* 273 path deserializeUser null */
  test('deserializeUser returns false when deserializer returns null', async () => {
    const passport = new Authenticator()
    passport.registerUserDeserializer(async () => null)
    const res = await passport.deserializeUser('x', {} as any)
    assert.strictEqual(res, false)
  })
})
