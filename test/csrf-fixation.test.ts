/* eslint-disable @typescript-eslint/no-floating-promises */
import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'
import { getConfiguredTestServer, TestBrowserSession } from './helpers'
import fastifyCsrfProtection from '@fastify/csrf-protection'

function createServer(sessionPluginName: '@fastify/session' | '@fastify/secure-session') {
  const { server, fastifyPassport } = getConfiguredTestServer()

  void server.register(fastifyCsrfProtection, { sessionPlugin: sessionPluginName })

  server.post(
    '/login',
    { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
    async () => 'success'
  )

  server.get('/csrf', async (_req, reply) => {
    return reply.generateCsrf()
  })
  server.get('/session', async (req) => {
    return req.session.get('_csrf')
  })
  return server
}

const testSuite = (sessionPluginName: '@fastify/session' | '@fastify/secure-session') => {
  process.env.SESSION_PLUGIN = sessionPluginName
  const server = createServer(sessionPluginName)
  describe(`${sessionPluginName} tests`, () => {
    describe('guard against fixation', () => {
      let user: TestBrowserSession

      beforeEach(() => {
        user = new TestBrowserSession(server)
      })

      test(`should renegerate csrf token on login`, async () => {
        {
          const sess = await user.inject({ method: 'GET', url: '/session' })
          assert.equal(sess.body, '')
        }
        await user.inject({ method: 'GET', url: '/csrf' })
        {
          const sess = await user.inject({ method: 'GET', url: '/session' })
          assert.notEqual(sess.body, '')
        }
        await user.inject({
          method: 'POST',
          url: '/login',
          payload: { login: 'test', password: 'test' }
        })
        {
          const sess = await user.inject({ method: 'GET', url: '/session' })
          assert.equal(sess.body, '')
        }
      })
    })
  })
  delete process.env.SESSION_PLUGIN
}

testSuite('@fastify/session')
testSuite('@fastify/secure-session')
