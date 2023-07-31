/* eslint-disable @typescript-eslint/no-empty-function */
import got from 'got'
import { AddressInfo } from 'net'
import { AuthenticateOptions } from '../src/AuthenticationRoute'
import Authenticator from '../src/Authenticator'
import { Strategy } from '../src/strategies'
import { getConfiguredTestServer, getRegisteredTestServer, getTestServer, TestStrategy } from './helpers'

const suite = (sessionPluginName) => {
  describe(`${sessionPluginName} tests`, () => {
    test(`should return 401 Unauthorized if not logged in`, async () => {
      const { server, fastifyPassport } = getConfiguredTestServer()

      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
        async () => 'hello world!'
      )
      server.post('/login', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, () => {})

      const response = await server.inject({ method: 'GET', url: '/' })
      expect(response.body).toEqual('Unauthorized')
      expect(response.statusCode).toEqual(401)
    })

    test(`should allow login, and add successMessage to session upon logged in`, async () => {
      const { server, fastifyPassport } = getConfiguredTestServer('test', new TestStrategy('test'), null, {
        clearSessionIgnoreFields: ['messages']
      })

      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
        async (request, reply) => {
          void reply.send(request.session.get('messages'))
        }
      )
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            successRedirect: '/',
            successMessage: 'welcome',
            authInfo: false
          })
        },
        () => {}
      )

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/login',
        payload: { login: 'test', password: 'test' }
      })

      expect(loginResponse.statusCode).toEqual(302)
      expect(loginResponse.headers.location).toEqual('/')

      const homeResponse = await server.inject({
        url: '/',
        headers: {
          cookie: loginResponse.headers['set-cookie']
        },
        method: 'GET'
      })

      expect(homeResponse.body).toEqual('["welcome"]')
      expect(homeResponse.statusCode).toEqual(200)
    })

    test(`should allow login, and add successMessage to the session from a strategy that sets it`, async () => {
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

      const { server, fastifyPassport } = getConfiguredTestServer('test', new WelcomeStrategy('test'), null, {
        clearSessionIgnoreFields: ['messages']
      })
      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate('test', { authInfo: false })
        },
        async (request) => request.session.get('messages')
      )
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            successRedirect: '/',
            successMessage: true,
            authInfo: false
          })
        },
        () => {}
      )

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'welcomeuser', password: 'test' },
        url: '/login'
      })
      expect(login.statusCode).toEqual(302)
      expect(login.headers.location).toEqual('/')

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      })

      expect(response.body).toEqual('["welcome from strategy"]')
      expect(response.statusCode).toEqual(200)
    })

    test(`should throw error if pauseStream is being used`, async () => {
      jest.spyOn(console, 'error').mockImplementation(jest.fn())
      const fastifyPassport = new Authenticator({ clearSessionIgnoreFields: ['messages'] })
      fastifyPassport.use('test', new TestStrategy('test'))
      fastifyPassport.registerUserSerializer(async (user) => JSON.stringify(user))
      fastifyPassport.registerUserDeserializer(async (serialized: string) => JSON.parse(serialized))

      const server = getTestServer()
      void server.register(fastifyPassport.initialize())
      void server.register(
        fastifyPassport.secureSession({
          pauseStream: true
        } as AuthenticateOptions)
      )
      server.get('/', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, async (request) =>
        request.session.get('messages')
      )
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            successRedirect: '/',
            successMessage: 'welcome',
            authInfo: false
          })
        },
        () => {}
      )

      let response = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      })
      expect(response.statusCode).toEqual(500)

      response = await server.inject({
        url: '/',
        method: 'GET'
      })

      expect(response.statusCode).toEqual(500)
    })

    test(`should execute successFlash if logged in`, async () => {
      const { server, fastifyPassport } = getConfiguredTestServer('test', new TestStrategy('test'), null, {
        clearSessionIgnoreFields: ['flash']
      })
      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
        async (request, reply) => reply.flash('success')
      )
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            successRedirect: '/',
            successFlash: 'welcome',
            authInfo: false
          })
        },
        () => {}
      )

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      })
      expect(login.statusCode).toEqual(302)
      expect(login.headers.location).toEqual('/')

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      })

      expect(response.body).toEqual('["welcome"]')
      expect(response.statusCode).toEqual(200)
    })

    test(`should execute successFlash=true if logged in`, async () => {
      const { server, fastifyPassport } = getConfiguredTestServer()
      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
        async (request, reply) => reply.flash('success')
      )
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            successRedirect: '/',
            successFlash: true,
            authInfo: false
          })
        },
        () => {}
      )

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      })
      expect(login.statusCode).toEqual(302)
      expect(login.headers.location).toEqual('/')

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      })

      expect(response.body).toEqual('[]')
      expect(response.statusCode).toEqual(200)
    })

    test(`should return 200 if logged in and redirect to the successRedirect from options`, async () => {
      const { server, fastifyPassport } = getConfiguredTestServer()
      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
        async () => 'hello world!'
      )
      server.post(
        '/login',
        { preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: false }) },
        () => {}
      )

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      })
      expect(login.statusCode).toEqual(302)
      expect(login.headers.location).toEqual('/')

      const response = await server.inject({
        url: String(login.headers.location),
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      })

      expect(response.body).toEqual('hello world!')
      expect(response.statusCode).toEqual(200)
    })

    test(`should return use assignProperty option`, async () => {
      const { server, fastifyPassport } = getConfiguredTestServer()
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            successRedirect: '/',
            assignProperty: 'user',
            authInfo: false
          })
        },
        (request: any, reply: any) => {
          reply.send(request.user)
        }
      )

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      })
      expect(JSON.parse(login.body).name).toEqual('test')
    })

    test(`should redirect to the returnTo set in the session upon login`, async () => {
      const { server, fastifyPassport } = getConfiguredTestServer('test', new TestStrategy('test'), null, {
        clearSessionIgnoreFields: ['returnTo']
      })
      server.addHook('preValidation', async (request, _reply) => {
        request.session.set('returnTo', '/success')
      })
      server.get(
        '/success',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
        async () => 'hello world!'
      )
      server.post(
        '/login',
        { preValidation: fastifyPassport.authenticate('test', { successReturnToOrRedirect: '/', authInfo: false }) },
        () => {}
      )

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      })
      expect(login.statusCode).toEqual(302)
      expect(login.headers.location).toEqual('/success')

      const response = await server.inject({
        url: String(login.headers.location),
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      })

      expect(response.statusCode).toEqual(200)
      expect(response.body).toEqual('hello world!')
    })

    test(`should return 200 if logged in and authInfo is true`, async () => {
      const { server, fastifyPassport } = getConfiguredTestServer()
      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: true }) },
        async () => 'hello world!'
      )
      server.post(
        '/login',
        { preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: true }) },
        () => {}
      )

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      })
      expect(login.statusCode).toEqual(302)
      expect(login.headers.location).toEqual('/')

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      })

      expect(response.body).toEqual('hello world!')
      expect(response.statusCode).toEqual(200)
    })

    test(`should return 200 if logged in against a running server`, async () => {
      const { server, fastifyPassport } = getConfiguredTestServer()
      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: true }) },
        async () => 'hello world!'
      )
      server.post(
        '/login',
        { preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: true }) },
        () => {}
      )

      await server.listen()
      server.server.unref()

      const port = (server.server.address() as AddressInfo).port
      const login = await got('http://localhost:' + port + '/login', {
        method: 'POST',
        json: { login: 'test', password: 'test' },
        followRedirect: false
      })
      expect(login.statusCode).toEqual(302)
      expect(login.headers.location).toEqual('/')
      const cookies = login.headers['set-cookie']!
      expect(cookies).toHaveLength(1)

      const home = await got({
        url: 'http://localhost:' + port,
        headers: {
          cookie: cookies[0]
        },
        method: 'GET'
      })

      expect(home.statusCode).toEqual(200)
    })

    test(`should execute failureRedirect if failed to log in`, async () => {
      const { server, fastifyPassport } = getConfiguredTestServer()
      server.post(
        '/login',
        { preValidation: fastifyPassport.authenticate('test', { failureRedirect: '/failure', authInfo: false }) },
        () => {}
      )

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test1', password: 'test' },
        url: '/login'
      })
      expect(login.statusCode).toEqual(302)
      expect(login.headers.location).toEqual('/failure')
    })

    test(`should add failureMessage to session if failed to log in`, async () => {
      const { server, fastifyPassport } = getConfiguredTestServer()
      server.get('/', async (request, reply) => reply.send(request.session.get('messages')))
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            failureMessage: 'try again',
            authInfo: false
          })
        },
        async () => 'login page'
      )

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'not-correct', password: 'test' },
        url: '/login'
      })
      expect(login.statusCode).toEqual(401)

      const headers = {}
      if (login.headers['set-cookie']) {
        headers['cookie'] = login.headers['set-cookie']
      }
      const home = await server.inject({
        url: '/',
        headers,
        method: 'GET'
      })

      expect(home.body).toEqual('["try again"]')
      expect(home.statusCode).toEqual(200)
    })

    test(`should add failureFlash to session if failed to log in`, async () => {
      const { server, fastifyPassport } = getConfiguredTestServer()

      server.get('/', async (request, reply) => reply.flash('error'))
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            failureFlash: 'try again',
            authInfo: false
          })
        },
        () => {}
      )

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'not-correct', password: 'test' },
        url: '/login'
      })
      expect(login.statusCode).toEqual(401)

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      })

      expect(response.body).toEqual('["try again"]')
      expect(response.statusCode).toEqual(200)
    })

    test(`should add failureFlash=true to session if failed to log in`, async () => {
      const { server, fastifyPassport } = getConfiguredTestServer()
      server.get('/', async (request, reply) => reply.flash('error'))
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            failureFlash: true,
            authInfo: false
          })
        },
        () => {}
      )

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'not-correct', password: 'test' },
        url: '/login'
      })
      expect(login.statusCode).toEqual(401)

      const response = await server.inject({
        url: '/',
        method: 'GET'
      })

      expect(response.statusCode).toEqual(200)
      expect(response.body).toEqual('[]')
    })

    test(`should return 401 Unauthorized if not logged in when used as a handler`, async () => {
      const { server, fastifyPassport } = getConfiguredTestServer()

      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
        async () => 'hello world!'
      )
      server.post('/login', fastifyPassport.authenticate('test', { authInfo: false, successRedirect: '/' }))

      const response = await server.inject({ method: 'GET', url: '/' })
      expect(response.body).toEqual('Unauthorized')
      expect(response.statusCode).toEqual(401)
    })

    test(`should redirect when used as a handler`, async () => {
      const { server, fastifyPassport } = getConfiguredTestServer()
      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: true }) },
        async () => 'hello world!'
      )
      server.post('/login', fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: true }))

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      })
      expect(login.statusCode).toEqual(302)
      expect(login.headers.location).toEqual('/')

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      })

      expect(response.body).toEqual('hello world!')
      expect(response.statusCode).toEqual(200)
    })

    test(`should not log the user in when passed a callback`, async () => {
      const { server, fastifyPassport } = getConfiguredTestServer()
      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: true }) },
        async () => 'hello world!'
      )
      server.post(
        '/login',
        fastifyPassport.authenticate('test', async (request, reply, err, user) => {
          return (user as any).name
        })
      )

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      })
      expect(login.statusCode).toEqual(200)
      expect(login.body).toEqual('test')

      const headers: Record<string, any> = {}
      if (login.headers['set-cookie']) {
        headers['cookie'] = login.headers['set-cookie']
      }

      const response = await server.inject({
        url: '/',
        headers,
        method: 'GET'
      })

      expect(response.statusCode).toEqual(401)
    })

    test(`should allow registering strategies after creating routes referring to those strategies by name`, async () => {
      const { server, fastifyPassport } = getRegisteredTestServer(null, { clearSessionIgnoreFields: ['messages'] })

      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
        async (request, reply) => {
          void reply.send(request.session.get('messages'))
        }
      )

      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            successRedirect: '/',
            successMessage: 'welcome',
            authInfo: false
          })
        },
        () => {}
      )

      // register the test strategy late (after the above .authenticate calls)
      fastifyPassport.use(new TestStrategy('test'))

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/login',
        payload: { login: 'test', password: 'test' }
      })

      expect(loginResponse.statusCode).toEqual(302)
      expect(loginResponse.headers.location).toEqual('/')

      const homeResponse = await server.inject({
        url: '/',
        headers: {
          cookie: loginResponse.headers['set-cookie']
        },
        method: 'GET'
      })

      expect(homeResponse.body).toEqual('["welcome"]')
      expect(homeResponse.statusCode).toEqual(200)
    })
  })
}

suite('@fastify/session')
suite('@fastify/secure-session')
