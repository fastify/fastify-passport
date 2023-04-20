/* eslint-disable @typescript-eslint/no-empty-function */
import { Strategy } from '../src/strategies'
import { TestThirdPartyStrategy } from './authorize.test'
import { getConfiguredTestServer, getRegisteredTestServer, TestStrategy } from './helpers'

class WelcomeStrategy extends Strategy {
  authenticate(request: any, _options?: { pauseStream?: boolean }) {
    if (request.isAuthenticated()) {
      return this.pass()
    }
    if (request.body && request.body.login === 'welcomeuser' && request.body.password === 'test') {
      return this.success({ name: 'test' }, { message: 'welcome from strategy' })
    }
    this.fail()
  }
}

const suite = (sessionPluginName) => {
  describe(`${sessionPluginName} tests`, () => {
    test(`should allow passing a specific Strategy instance to an authenticate call`, async () => {
      const { server, fastifyPassport } = getRegisteredTestServer(null, { clearSessionIgnoreFields: ['messages'] })
      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate(new WelcomeStrategy('welcome'), { authInfo: false }),
        },
        async (request) => request.session.get('messages')
      )
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate(new WelcomeStrategy('welcome'), {
            successRedirect: '/',
            successMessage: true,
            authInfo: false,
          }),
        },
        () => {}
      )

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'welcomeuser', password: 'test' },
        url: '/login',
      })
      expect(login.statusCode).toEqual(302)
      expect(login.headers.location).toEqual('/')

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie'],
        },
        method: 'GET',
      })

      expect(response.body).toEqual('["welcome from strategy"]')
      expect(response.statusCode).toEqual(200)
    })

    test(`should allow passing a multiple specific Strategy instances to an authenticate call`, async () => {
      const { server, fastifyPassport } = getRegisteredTestServer()
      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate([new WelcomeStrategy('welcome'), new TestStrategy('test')], {
            authInfo: false,
          }),
        },
        async (request) => `messages: ${request.session.get('messages')}`
      )
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate([new WelcomeStrategy('welcome'), new TestStrategy('test')], {
            successRedirect: '/',
            successMessage: true,
            authInfo: false,
          }),
        },
        () => {}
      )

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login',
      })
      expect(login.statusCode).toEqual(302)
      expect(login.headers.location).toEqual('/')

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie'],
        },
        method: 'GET',
      })

      expect(response.body).toEqual('messages: undefined')
      expect(response.statusCode).toEqual(200)
    })

    test(`should allow passing a mix of Strategy instances and strategy names`, async () => {
      const { server, fastifyPassport } = getConfiguredTestServer()
      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate([new WelcomeStrategy('welcome'), 'test'], {
            authInfo: false,
          }),
        },
        async (request) => `messages: ${request.session.get('messages')}`
      )
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate([new WelcomeStrategy('welcome'), 'test'], {
            successRedirect: '/',
            successMessage: true,
            authInfo: false,
          }),
        },
        () => {}
      )

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login',
      })
      expect(login.statusCode).toEqual(302)
      expect(login.headers.location).toEqual('/')

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie'],
        },
        method: 'GET',
      })

      expect(response.body).toEqual('messages: undefined')
      expect(response.statusCode).toEqual(200)
    })

    test(`should allow passing specific instances to an authorize call`, async () => {
      const { server, fastifyPassport } = getConfiguredTestServer()

      server.get(
        '/',
        { preValidation: fastifyPassport.authorize(new TestThirdPartyStrategy('third-party')) },
        async (request) => {
          const user = request.user as any
          expect(user).toBeFalsy()
          const account = request.account as any
          expect(account.id).toBeTruthy()
          expect(account.name).toEqual('test')

          return 'it worked'
        }
      )

      const response = await server.inject({ method: 'GET', url: '/' })
      expect(response.statusCode).toEqual(200)
    })

    test(`Strategy instances used during one authentication shouldn't be registered`, async () => {
      const { fastifyPassport } = getRegisteredTestServer()
      // build a handler with the welcome strategy
      fastifyPassport.authenticate(new WelcomeStrategy('welcome'), { authInfo: false })
      expect(fastifyPassport.strategy('welcome')).toBeUndefined()
    })
  })
}

suite('@fastify/session')
suite('@fastify/secure-session')
