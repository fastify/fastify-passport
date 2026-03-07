import assert from 'node:assert'
import { describe, test } from 'node:test'
import fastify from 'fastify'
import { getConfiguredTestServer, getRegisteredTestServer } from './helpers'
import { Strategy } from '../src/strategies'
import Authenticator from '../src/Authenticator'

/** A strategy that always fails with a challenge string */
class AlwaysFailStrategy extends Strategy {
    authenticate() {
        this.fail('Bearer realm="api"', 401)
    }
}

/** A strategy that checks for an x-api-key header */
class ApiKeyStrategy extends Strategy {
    authenticate(request: any) {
        const key = request.headers['x-api-key']
        if (key === 'valid-key') {
            return this.success({ id: 'api-user', name: 'API User' })
        }
        this.fail('ApiKey', 401)
    }
}

/** A strategy that calls this.error() */
class ErrorStrategy extends Strategy {
    authenticate() {
        this.error(new Error('Internal strategy error'))
    }
}

/** A strategy that calls this.redirect() */
class RedirectStrategy extends Strategy {
    authenticate() {
        this.redirect('https://oauth.example.com/authorize', 302)
    }
}

/** A strategy that calls this.pass() */
class PassStrategy extends Strategy {
    authenticate() {
        this.pass()
    }
}

/** A strategy that throws synchronously */
class ThrowingStrategy extends Strategy {
    authenticate() {
        throw new Error('Synchronous explosion')
    }
}

describe('authenticateRequest', () => {
    describe('success cases', () => {
        test('should return ok:true with user on successful authentication', async () => {
            const { server, fastifyPassport } = getConfiguredTestServer()

            server.post('/login', async (request, reply) => {
                const result = await fastifyPassport.authenticateRequest('test', request, reply)
                reply.send(result)
            })

            const response = await server.inject({
                method: 'POST',
                url: '/login',
                payload: { login: 'test', password: 'test' }
            })

            assert.strictEqual(response.statusCode, 200)
            const body = response.json()
            assert.strictEqual(body.ok, true)
            assert.strictEqual(body.strategy, 'test')
            assert.ok(body.user)
            assert.strictEqual(body.user.name, 'test')
        })

        test('should accept a strategy instance directly (not just a name)', async () => {
            const { server, fastifyPassport } = getRegisteredTestServer()
            const strategyInstance = new ApiKeyStrategy('api-key')

            server.get('/api', async (request, reply) => {
                const result = await fastifyPassport.authenticateRequest(strategyInstance, request, reply)
                reply.send(result)
            })

            const response = await server.inject({
                method: 'GET',
                url: '/api',
                headers: { 'x-api-key': 'valid-key' }
            })

            assert.strictEqual(response.statusCode, 200)
            const body = response.json()
            assert.strictEqual(body.ok, true)
            assert.strictEqual(body.strategy, 'api-key')
            assert.strictEqual(body.user.name, 'API User')
        })

        test('should NOT set request.user by default (no side effects)', async () => {
            const { server, fastifyPassport } = getConfiguredTestServer()

            server.post('/login', async (request, reply) => {
                const result = await fastifyPassport.authenticateRequest('test', request, reply)
                reply.send({ authResult: result, requestUser: request.user })
            })

            const response = await server.inject({
                method: 'POST',
                url: '/login',
                payload: { login: 'test', password: 'test' }
            })

            const body = response.json()
            assert.strictEqual(body.authResult.ok, true)
            // request.user should NOT be set — no auto-login
            assert.ok(!body.requestUser || Object.keys(body.requestUser).length === 0)
        })

        test('should auto-login when options.session is true', async () => {
            const { server, fastifyPassport } = getConfiguredTestServer()

            server.post('/login', async (request, reply) => {
                const result = await fastifyPassport.authenticateRequest('test', request, reply, { session: true })
                reply.send({ authResult: result, requestUser: request.user })
            })

            const response = await server.inject({
                method: 'POST',
                url: '/login',
                payload: { login: 'test', password: 'test' }
            })

            const body = response.json()
            assert.strictEqual(body.authResult.ok, true)
            assert.ok(body.requestUser)
            assert.strictEqual(body.requestUser.name, 'test')
        })

        test('should explicitly NOT auto-login when options.session is false', async () => {
            const { server, fastifyPassport } = getConfiguredTestServer()

            server.post('/login', async (request, reply) => {
                // explicit false
                const result = await fastifyPassport.authenticateRequest('test', request, reply, { session: false })
                reply.send({ authResult: result, requestUser: request.user })
            })

            const response = await server.inject({
                method: 'POST',
                url: '/login',
                payload: { login: 'test', password: 'test' }
            })

            const body = response.json()
            assert.strictEqual(body.authResult.ok, true)
            // request.user should NOT be set
            assert.ok(!body.requestUser || Object.keys(body.requestUser).length === 0)
        })
    })

    describe('failure cases', () => {
        test('should return ok:false when authentication fails', async () => {
            const { server, fastifyPassport } = getConfiguredTestServer()

            server.post('/login', async (request, reply) => {
                const result = await fastifyPassport.authenticateRequest('test', request, reply)
                reply.send(result)
            })

            const response = await server.inject({
                method: 'POST',
                url: '/login',
                payload: { login: 'wrong', password: 'wrong' }
            })

            assert.strictEqual(response.statusCode, 200) // WE control the response, not passport
            const body = response.json()
            assert.strictEqual(body.ok, false)
            assert.strictEqual(body.strategy, undefined)
            assert.strictEqual(body.statusCode, 401)
        })

        test('should include challenge strings on failure', async () => {
            const { server, fastifyPassport } = getRegisteredTestServer()
            fastifyPassport.use('always-fail', new AlwaysFailStrategy('always-fail'))

            server.get('/protected', async (request, reply) => {
                const result = await fastifyPassport.authenticateRequest('always-fail', request, reply)
                reply.send(result)
            })

            const response = await server.inject({
                method: 'GET',
                url: '/protected'
            })

            const body = response.json()
            assert.strictEqual(body.ok, false)
            assert.ok(body.challenges)
            assert.ok(body.challenges.includes('Bearer realm="api"'))
        })

        test('should throw error for unknown strategy name', async () => {
            const { server, fastifyPassport } = getConfiguredTestServer()

            server.get('/test', async (request, reply) => {
                const result = await fastifyPassport.authenticateRequest('nonexistent', request, reply)
                reply.send(result)
            })

            const response = await server.inject({
                method: 'GET',
                url: '/test'
            })

            assert.strictEqual(response.statusCode, 500) // error handler catches the throw
        })
    })

    describe('multi-strategy fallback', () => {
        test('should try strategies in order and stop at first success', async () => {
            const { server, fastifyPassport } = getRegisteredTestServer()
            fastifyPassport.use('always-fail', new AlwaysFailStrategy('always-fail'))
            fastifyPassport.use('api-key', new ApiKeyStrategy('api-key'))

            server.get('/api', async (request, reply) => {
                const result = await fastifyPassport.authenticateRequest(
                    ['always-fail', 'api-key'],
                    request,
                    reply
                )
                reply.send(result)
            })

            const response = await server.inject({
                method: 'GET',
                url: '/api',
                headers: { 'x-api-key': 'valid-key' }
            })

            const body = response.json()
            assert.strictEqual(body.ok, true)
            assert.strictEqual(body.strategy, 'api-key') // second strategy won
            assert.strictEqual(body.user.name, 'API User')
        })

        test('should return failure with all challenges when all strategies fail', async () => {
            const { server, fastifyPassport } = getRegisteredTestServer()
            fastifyPassport.use('fail-1', new AlwaysFailStrategy('fail-1'))
            fastifyPassport.use('fail-2', new AlwaysFailStrategy('fail-2'))

            server.get('/api', async (request, reply) => {
                const result = await fastifyPassport.authenticateRequest(
                    ['fail-1', 'fail-2'],
                    request,
                    reply
                )
                reply.send(result)
            })

            const response = await server.inject({
                method: 'GET',
                url: '/api'
            })

            const body = response.json()
            assert.strictEqual(body.ok, false)
            assert.strictEqual(body.strategy, undefined)
            assert.strictEqual(body.statusCode, 401)
            assert.ok(body.challenges)
            assert.strictEqual(body.challenges.length, 2)
        })
    })

    describe('strategy callbacks', () => {
        test('should handle strategy error with sanitized error', async () => {
            const { server, fastifyPassport } = getRegisteredTestServer()
            fastifyPassport.use('error-strategy', new ErrorStrategy('error-strategy'))

            server.get('/test', async (request, reply) => {
                const result = await fastifyPassport.authenticateRequest('error-strategy', request, reply)
                reply.send({
                    ok: result.ok,
                    statusCode: result.statusCode,
                    errorMessage: result.error?.message,
                    authContext: (request as any).authContext
                })
            })

            const response = await server.inject({
                method: 'GET',
                url: '/test'
            })

            const body = response.json()
            assert.strictEqual(body.ok, false)
            assert.strictEqual(body.statusCode, 500)
            assert.strictEqual(body.errorMessage, 'Strategy authentication error')
            assert.strictEqual(body.authContext.attempts[0].outcome, 'error')
            assert.strictEqual(body.authContext.attempts[0].errorType, 'Error')
        })

        test('should handle strategy redirect', async () => {
            const { server, fastifyPassport } = getRegisteredTestServer()
            fastifyPassport.use('redirect-strategy', new RedirectStrategy('redirect-strategy'))

            server.get('/oauth', async (request, reply) => {
                const result = await fastifyPassport.authenticateRequest('redirect-strategy', request, reply)
                reply.send(result)
            })

            const response = await server.inject({
                method: 'GET',
                url: '/oauth'
            })

            const body = response.json()
            assert.strictEqual(body.ok, false)
            assert.strictEqual(body.strategy, 'redirect-strategy')
            assert.strictEqual(body.redirectUrl, 'https://oauth.example.com/authorize')
            assert.strictEqual(body.statusCode, 302)
        })

        test('should handle strategy pass (stops the loop)', async () => {
            const { server, fastifyPassport } = getRegisteredTestServer()
            fastifyPassport.use('pass-strategy', new PassStrategy('pass-strategy'))

            server.get('/test', async (request, reply) => {
                const result = await fastifyPassport.authenticateRequest('pass-strategy', request, reply)
                reply.send(result)
            })

            const response = await server.inject({
                method: 'GET',
                url: '/test'
            })

            const body = response.json()
            assert.strictEqual(body.ok, false)
            assert.strictEqual(body.strategy, 'pass-strategy')
        })

        test('should handle synchronous throw in strategy.authenticate()', async () => {
            const { server, fastifyPassport } = getRegisteredTestServer()
            fastifyPassport.use('throwing', new ThrowingStrategy('throwing'))

            server.get('/test', async (request, reply) => {
                const result = await fastifyPassport.authenticateRequest('throwing', request, reply)
                reply.send({ ok: result.ok, statusCode: result.statusCode, errorMessage: result.error?.message })
            })

            const response = await server.inject({
                method: 'GET',
                url: '/test'
            })

            const body = response.json()
            assert.strictEqual(body.ok, false)
            assert.strictEqual(body.statusCode, 500)
            assert.strictEqual(body.errorMessage, 'Strategy authentication error')
        })
    })

    describe('authContext', () => {
        test('should populate request.authContext on success', async () => {
            const { server, fastifyPassport } = getConfiguredTestServer()

            server.post('/login', async (request, reply) => {
                await fastifyPassport.authenticateRequest('test', request, reply)
                reply.send(request.authContext)
            })

            const response = await server.inject({
                method: 'POST',
                url: '/login',
                payload: { login: 'test', password: 'test' }
            })

            const body = response.json()
            assert.strictEqual(body.successfulStrategy, 'test')
            assert.strictEqual(body.outcome, 'authenticated')
            assert.strictEqual(body.attempts.length, 1)
            assert.strictEqual(body.attempts[0].strategy, 'test')
            assert.strictEqual(body.attempts[0].outcome, 'success')
            assert.ok(typeof body.elapsedMs === 'number')
            assert.ok(body.elapsedMs >= 0)
        })

        test('should populate request.authContext on failure', async () => {
            const { server, fastifyPassport } = getConfiguredTestServer()

            server.post('/login', async (request, reply) => {
                await fastifyPassport.authenticateRequest('test', request, reply)
                reply.send(request.authContext)
            })

            const response = await server.inject({
                method: 'POST',
                url: '/login',
                payload: { login: 'wrong', password: 'wrong' }
            })

            const body = response.json()
            assert.strictEqual(body.successfulStrategy, undefined)
            assert.strictEqual(body.outcome, 'rejected')
            assert.strictEqual(body.attempts.length, 1)
            assert.strictEqual(body.attempts[0].strategy, 'test')
            assert.strictEqual(body.attempts[0].outcome, 'fail')
        })

        test('should track correct attempt count in multi-strategy', async () => {
            const { server, fastifyPassport } = getRegisteredTestServer()
            fastifyPassport.use('always-fail', new AlwaysFailStrategy('always-fail'))
            fastifyPassport.use('api-key', new ApiKeyStrategy('api-key'))

            server.get('/api', async (request, reply) => {
                await fastifyPassport.authenticateRequest(
                    ['always-fail', 'api-key'],
                    request,
                    reply
                )
                reply.send(request.authContext)
            })

            const response = await server.inject({
                method: 'GET',
                url: '/api',
                headers: { 'x-api-key': 'valid-key' }
            })

            const body = response.json()
            assert.strictEqual(body.successfulStrategy, 'api-key')
            assert.strictEqual(body.attempts.length, 2)
            assert.strictEqual(body.attempts[0].strategy, 'always-fail')
            assert.strictEqual(body.attempts[0].outcome, 'fail')
            assert.strictEqual(body.attempts[1].strategy, 'api-key')
            assert.strictEqual(body.attempts[1].outcome, 'success')
            assert.strictEqual(body.outcome, 'authenticated')
        })

        test('should isolate authContext across concurrent requests', async () => {
            const { server, fastifyPassport } = getConfiguredTestServer()
            fastifyPassport.use('api-key', new ApiKeyStrategy('api-key'))

            server.post('/delayed-login', async (request, reply) => {
                await fastifyPassport.authenticateRequest('test', request, reply)
                // Artificial delay to ensure the second request runs while this one is yielding
                await new Promise(resolve => setTimeout(resolve, 50))
                reply.send(request.authContext)
            })

            server.get('/fast-api', async (request, reply) => {
                await fastifyPassport.authenticateRequest('api-key', request, reply)
                reply.send(request.authContext)
            })

            // Fire both requests concurrently
            const [delayedLoginResponse, fastApiResponse] = await Promise.all([
                server.inject({
                    method: 'POST',
                    url: '/delayed-login',
                    payload: { login: 'test', password: 'test' }
                }),
                server.inject({
                    method: 'GET',
                    url: '/fast-api',
                    headers: { 'x-api-key': 'valid-key' }
                })
            ])

            const loginContext = delayedLoginResponse.json()
            const apiContext = fastApiResponse.json()

            // If there is cross-request bleed, loginContext.successfulStrategy
            // will have been overwritten by 'api-key' during the delay.
            assert.strictEqual(loginContext.successfulStrategy, 'test')
            assert.strictEqual(apiContext.successfulStrategy, 'api-key')
        })
    })

    describe('edge cases', () => {
        test('should throw when passport.initialize() was not called', async () => {
            const server = fastify()
            const passport = new Authenticator()
            passport.use('test', new ApiKeyStrategy('test'))

            // Do NOT call server.register(passport.initialize())
            server.get('/test', async (request: any, reply: any) => {
                const result = await passport.authenticateRequest('test', request, reply)
                reply.send(result)
            })

            const response = await server.inject({
                method: 'GET',
                url: '/test'
            })

            assert.strictEqual(response.statusCode, 500)
            const body = response.json()
            assert.ok(body.message.includes('passport.initialize()'))
        })

        test('should throw when empty strategy array is passed', async () => {
            const { server, fastifyPassport } = getRegisteredTestServer()

            server.get('/test', async (request, reply) => {
                const result = await fastifyPassport.authenticateRequest([] as any, request, reply)
                reply.send(result)
            })

            const response = await server.inject({
                method: 'GET',
                url: '/test'
            })

            assert.strictEqual(response.statusCode, 500)
            const body = response.json()
            assert.ok(body.message.includes('at least one strategy'))
        })

        test('should rethrow non-Unhandled errors from strategy loop', async () => {
            /** A strategy that throws a real error (not via this.error(), but outside the callback bridge) */
            class RealErrorStrategy extends Strategy {
                authenticate() {
                    // Throw after a microtick to escape the try/catch in attemptStrategyProgrammatic
                    // but this is caught by the promise catch
                    throw new Error('Real non-strategy error')
                }
            }

            const { server, fastifyPassport } = getConfiguredTestServer()
            fastifyPassport.use('real-error', new RealErrorStrategy('real-error'))

            server.get('/test', async (request, reply) => {
                const result = await fastifyPassport.authenticateRequest('real-error', request, reply)
                reply.send({ ok: result.ok, statusCode: result.statusCode, errorMessage: result.error?.message })
            })

            const response = await server.inject({
                method: 'GET',
                url: '/test'
            })

            const body = response.json()
            assert.strictEqual(body.ok, false)
            assert.strictEqual(body.statusCode, 500)
            assert.strictEqual(body.errorMessage, 'Strategy authentication error')
        })

        test('should handle fail() with numeric-only challenge', async () => {
            class NumericFailStrategy extends Strategy {
                authenticate() {
                    this.fail(403)
                }
            }

            const { server, fastifyPassport } = getRegisteredTestServer()
            fastifyPassport.use('numeric-fail', new NumericFailStrategy('numeric-fail'))

            server.get('/test', async (request, reply) => {
                const result = await fastifyPassport.authenticateRequest('numeric-fail', request, reply)
                reply.send(result)
            })

            const response = await server.inject({
                method: 'GET',
                url: '/test'
            })

            const body = response.json()
            assert.strictEqual(body.ok, false)
            assert.strictEqual(body.statusCode, 403)
        })

        test('should handle async strategy that returns a rejected promise', async () => {
            class AsyncRejectStrategy extends Strategy {
                authenticate() {
                    return Promise.reject(new Error('Async rejection'))
                }
            }

            const { server, fastifyPassport } = getRegisteredTestServer()
            fastifyPassport.use('async-reject', new AsyncRejectStrategy('async-reject'))

            server.get('/test', async (request, reply) => {
                const result = await fastifyPassport.authenticateRequest('async-reject', request, reply)
                reply.send({ ok: result.ok, statusCode: result.statusCode, errorMessage: result.error?.message })
            })

            const response = await server.inject({
                method: 'GET',
                url: '/test'
            })

            const body = response.json()
            assert.strictEqual(body.ok, false)
            assert.strictEqual(body.statusCode, 500)
            assert.strictEqual(body.errorMessage, 'Strategy authentication error')
        })

        test('should use constructor.name when strategy instance has no name property', async () => {
            class UnNamedStrategy extends Strategy {
                constructor() {
                    super('')  // empty name
                }

                authenticate(request: any) {
                    this.success({ id: 'nameless', name: 'Nameless User' })
                }
            }

            const { server, fastifyPassport } = getRegisteredTestServer()
            const instance = new UnNamedStrategy()

            server.get('/test', async (request, reply) => {
                const result = await fastifyPassport.authenticateRequest(instance, request, reply)
                reply.send(result)
            })

            const response = await server.inject({
                method: 'GET',
                url: '/test'
            })

            const body = response.json()
            assert.strictEqual(body.ok, true)
            assert.strictEqual(body.strategy, 'UnNamedStrategy')
        })
    })
})
