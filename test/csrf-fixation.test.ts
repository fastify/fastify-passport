/* eslint-disable @typescript-eslint/no-empty-function */
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

const suite = (sessionPluginName: '@fastify/session' | '@fastify/secure-session') => {
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
          expect(sess.body).toBe('')
        }
        await user.inject({ method: 'GET', url: '/csrf' })
        {
          const sess = await user.inject({ method: 'GET', url: '/session' })
          expect(sess.body).not.toBe('')
        }
        await user.inject({
          method: 'POST',
          url: '/login',
          payload: { login: 'test', password: 'test' }
        })
        {
          const sess = await user.inject({ method: 'GET', url: '/session' })
          expect(sess.body).toBe('')
        }
      })
    })
  })
  delete process.env.SESSION_PLUGIN
}

suite('@fastify/session')
suite('@fastify/secure-session')
