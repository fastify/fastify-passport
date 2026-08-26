import { describe, test, TestContext } from 'node:test'
import { AuthenticateOptions } from '../src/authentication-route'
import Authenticator from '../src/authenticator'
import { Strategy } from '../src/strategies'
import { getConfiguredTestServer, getRegisteredTestServer, getTestServer, TestStrategy } from './helpers'

const testSuite = (sessionPluginName: string) => {
  describe(`${sessionPluginName} tests`, () => {
    test('should return 401 Unauthorized if not logged in', async (t: TestContext) => {
      const { server, fastifyPassport } = getConfiguredTestServer()

      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate('test', {
            authInfo: false
          })
        },
        async () => 'hello world!'
      )
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            authInfo: false
          })
        },
        () => {}
      )

      const response = await server.inject({ method: 'GET', url: '/' })
      t.assert.strictEqual(response.body, 'Unauthorized')
      t.assert.strictEqual(response.statusCode, 401)
    })

    test('should allow login, and add successMessage to session upon logged in', async (t: TestContext) => {
      const { server, fastifyPassport } = getConfiguredTestServer('test', new TestStrategy('test'), null, {
        clearSessionIgnoreFields: ['messages']
      })

      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate('test', {
            authInfo: false
          })
        },
        async (request, reply) => {
          reply.send(request.session.get('messages'))
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

      t.assert.strictEqual(loginResponse.statusCode, 302)
      t.assert.strictEqual(loginResponse.headers.location, '/')

      const homeResponse = await server.inject({
        url: '/',
        headers: {
          cookie: loginResponse.headers['set-cookie']
        },
        method: 'GET'
      })

      t.assert.deepStrictEqual(homeResponse.json(), ['welcome'])
      t.assert.strictEqual(homeResponse.statusCode, 200)
    })

    test('should allow login, and add successMessage to the session from a strategy that sets it', async (t: TestContext) => {
      class WelcomeStrategy extends Strategy {
        authenticate (request: any, _options?: { pauseStream?: boolean }) {
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
          preValidation: fastifyPassport.authenticate('test', {
            authInfo: false
          })
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
      t.assert.strictEqual(login.statusCode, 302)
      t.assert.strictEqual(login.headers.location, '/')

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      })

      t.assert.deepStrictEqual(response.json(), ['welcome from strategy'])
      t.assert.strictEqual(response.statusCode, 200)
    })

    test('should append multiple messages to session when messages already exist', async (t: TestContext) => {
      const { server, fastifyPassport } = getConfiguredTestServer('test', new TestStrategy('test'), null, {
        clearSessionIgnoreFields: ['messages']
      })

      server.post(
        '/fail1',
        {
          preValidation: fastifyPassport.authenticate('test', {
            failureMessage: 'first failure',
            authInfo: false
          })
        },
        () => {}
      )
      server.post(
        '/fail2',
        {
          preValidation: fastifyPassport.authenticate('test', {
            failureMessage: 'second failure',
            authInfo: false
          })
        },
        () => {}
      )
      server.get('/messages', async (request) => request.session.get('messages') || [])

      const firstFail = await server.inject({
        method: 'POST',
        url: '/fail1',
        payload: { login: 'wrong', password: 'wrong' }
      })

      t.assert.strictEqual(firstFail.statusCode, 401)

      const secondFail = await server.inject({
        method: 'POST',
        url: '/fail2',
        headers: {
          cookie: firstFail.headers['set-cookie']
        },
        payload: { login: 'wrong', password: 'wrong' }
      })

      t.assert.strictEqual(secondFail.statusCode, 401)

      const response = await server.inject({
        url: '/messages',
        headers: {
          cookie: secondFail.headers['set-cookie']
        },
        method: 'GET'
      })

      t.assert.deepStrictEqual(response.json(), ['first failure', 'second failure'])
      t.assert.strictEqual(response.statusCode, 200)
    })

    test('should throw error if pauseStream is being used', async (t: TestContext) => {
      const fastifyPassport = new Authenticator({ clearSessionIgnoreFields: ['messages'] })
      fastifyPassport.use('test', new TestStrategy('test'))
      fastifyPassport.registerUserSerializer(async (user) => JSON.stringify(user))
      fastifyPassport.registerUserDeserializer(async (serialized: string) => JSON.parse(serialized))

      const server = getTestServer()
      server.register(fastifyPassport.initialize())
      server.register(
        fastifyPassport.secureSession({
          pauseStream: true
        } as AuthenticateOptions)
      )
      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate('test', {
            authInfo: false
          })
        },
        async (request) => request.session.get('messages')
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
      t.assert.strictEqual(response.statusCode, 500)

      response = await server.inject({
        url: '/',
        method: 'GET'
      })

      t.assert.strictEqual(response.statusCode, 500)
    })

    test('should execute successFlash if logged in', async (t: TestContext) => {
      const { server, fastifyPassport } = getConfiguredTestServer('test', new TestStrategy('test'), null, {
        clearSessionIgnoreFields: ['flash']
      })
      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate('test', {
            authInfo: false
          })
        },
        async (_request, reply) => reply.flash('success')
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
      t.assert.strictEqual(login.statusCode, 302)
      t.assert.strictEqual(login.headers.location, '/')

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      })

      t.assert.deepStrictEqual(response.json(), ['welcome'])
      t.assert.strictEqual(response.statusCode, 200)
    })

    test('should execute successFlash=true if logged in', async (t: TestContext) => {
      const { server, fastifyPassport } = getConfiguredTestServer()
      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate('test', {
            authInfo: false
          })
        },
        async (_request, reply) => reply.flash('success')
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
      t.assert.strictEqual(login.statusCode, 302)
      t.assert.strictEqual(login.headers.location, '/')

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      })

      t.assert.deepStrictEqual(response.json(), [])
      t.assert.strictEqual(response.statusCode, 200)
    })

    test('should return 200 if logged in and redirect to the successRedirect from options', async (t: TestContext) => {
      const { server, fastifyPassport } = getConfiguredTestServer()
      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate('test', {
            authInfo: false
          })
        },
        async () => 'hello world!'
      )
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            successRedirect: '/',
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
      t.assert.strictEqual(login.statusCode, 302)
      t.assert.strictEqual(login.headers.location, '/')

      const response = await server.inject({
        url: String(login.headers.location),
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      })

      t.assert.strictEqual(response.body, 'hello world!')
      t.assert.strictEqual(response.statusCode, 200)
    })

    test('should return use assignProperty option', async (t: TestContext) => {
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
      t.assert.strictEqual(JSON.parse(login.body).name, 'test')
    })

    test('should redirect to the returnTo set in the session upon login', async (t: TestContext) => {
      const { server, fastifyPassport } = getConfiguredTestServer('test', new TestStrategy('test'), null, {
        clearSessionIgnoreFields: ['returnTo']
      })
      server.addHook('preValidation', async (request, _reply) => {
        request.session.set('returnTo', '/success')
      })
      server.get(
        '/success',
        {
          preValidation: fastifyPassport.authenticate('test', {
            authInfo: false
          })
        },
        async () => 'hello world!'
      )
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            successReturnToOrRedirect: '/',
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
      t.assert.strictEqual(login.statusCode, 302)
      t.assert.strictEqual(login.headers.location, '/success')

      const response = await server.inject({
        url: String(login.headers.location),
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      })

      t.assert.strictEqual(response.statusCode, 200)
      t.assert.strictEqual(response.body, 'hello world!')
    })

    test('should return 200 if logged in and authInfo is true', async (t: TestContext) => {
      const { server, fastifyPassport } = getConfiguredTestServer()
      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate('test', { authInfo: true })
        },
        async () => 'hello world!'
      )
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            successRedirect: '/',
            authInfo: true
          })
        },
        () => {}
      )

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      })
      t.assert.strictEqual(login.statusCode, 302)
      t.assert.strictEqual(login.headers.location, '/')

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      })

      t.assert.strictEqual(response.body, 'hello world!')
      t.assert.strictEqual(response.statusCode, 200)
    })

    test('should return 200 if logged in against a running server', async (t: TestContext) => {
      const { server, fastifyPassport } = getConfiguredTestServer()
      t.after(() => server.close())
      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate('test', { authInfo: true })
        },
        async () => 'hello world!'
      )
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            successRedirect: '/',
            authInfo: true
          })
        },
        () => {}
      )

      const address = await server.listen()
      const login = await fetch(address + '/login', {
        method: 'POST',
        body: JSON.stringify({ login: 'test', password: 'test' }),
        headers: { 'Content-Type': 'application/json' },
        redirect: 'manual'
      })

      t.assert.strictEqual(login.status, 302)
      t.assert.strictEqual(login.headers.get('location'), '/')
      const cookies = login.headers.getSetCookie()
      t.assert.strictEqual(cookies.length, 1)
      t.assert.strictEqual(await login.text(), '')

      const home = await fetch(address, {
        headers: {
          cookie: cookies[0]
        }
      })

      t.assert.strictEqual(home.status, 200)
      t.assert.strictEqual(await home.text(), 'hello world!')
    })

    test('should execute failureRedirect if failed to log in', async (t: TestContext) => {
      const { server, fastifyPassport } = getConfiguredTestServer()
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate('test', {
            failureRedirect: '/failure',
            authInfo: false
          })
        },
        () => {}
      )

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test1', password: 'test' },
        url: '/login'
      })
      t.assert.strictEqual(login.statusCode, 302)
      t.assert.strictEqual(login.headers.location, '/failure')
    })

    test('should add failureMessage to session if failed to log in', async (t: TestContext) => {
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
      t.assert.strictEqual(login.statusCode, 401)

      const headers: Record<string, string | string[]> = {}
      if (login.headers['set-cookie']) {
        headers['cookie'] = login.headers['set-cookie']
      }
      const home = await server.inject({
        url: '/',
        headers,
        method: 'GET'
      })

      t.assert.strictEqual(home.body, '["try again"]')
      t.assert.strictEqual(home.statusCode, 200)
    })

    test('should add failureFlash to session if failed to log in', async (t: TestContext) => {
      const { server, fastifyPassport } = getConfiguredTestServer()

      server.get('/', async (_request, reply) => reply.flash('error'))
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
      t.assert.strictEqual(login.statusCode, 401)

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      })

      t.assert.deepStrictEqual(response.json(), ['try again'])
      t.assert.strictEqual(response.statusCode, 200)
    })

    test('should add failureFlash=true to session if failed to log in', async (t: TestContext) => {
      const { server, fastifyPassport } = getConfiguredTestServer()
      server.get('/', async (_request, reply) => reply.flash('error'))
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
      t.assert.strictEqual(login.statusCode, 401)

      const response = await server.inject({
        url: '/',
        method: 'GET'
      })

      t.assert.strictEqual(response.statusCode, 200)
      t.assert.deepStrictEqual(response.json(), [])
    })

    test('should return 401 Unauthorized if not logged in when used as a handler', async (t: TestContext) => {
      const { server, fastifyPassport } = getConfiguredTestServer()

      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate('test', {
            authInfo: false
          })
        },
        async () => 'hello world!'
      )
      server.post('/login', fastifyPassport.authenticate('test', { authInfo: false, successRedirect: '/' }))

      const response = await server.inject({ method: 'GET', url: '/' })
      t.assert.strictEqual(response.body, 'Unauthorized')
      t.assert.strictEqual(response.statusCode, 401)
    })

    test('should redirect when used as a handler', async (t: TestContext) => {
      const { server, fastifyPassport } = getConfiguredTestServer()
      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate('test', { authInfo: true })
        },
        async () => 'hello world!'
      )
      server.post('/login', fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: true }))

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      })
      t.assert.strictEqual(login.statusCode, 302)
      t.assert.strictEqual(login.headers.location, '/')

      const response = await server.inject({
        url: '/',
        headers: {
          cookie: login.headers['set-cookie']
        },
        method: 'GET'
      })

      t.assert.strictEqual(response.body, 'hello world!')
      t.assert.strictEqual(response.statusCode, 200)
    })

    test('should not log the user in when passed a callback', async (t: TestContext) => {
      const { server, fastifyPassport } = getConfiguredTestServer()
      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate('test', { authInfo: true })
        },
        async () => 'hello world!'
      )
      server.post(
        '/login',
        fastifyPassport.authenticate('test', async (_request, _reply, _err, user) => {
          return (user as any).name
        })
      )

      const login = await server.inject({
        method: 'POST',
        payload: { login: 'test', password: 'test' },
        url: '/login'
      })
      t.assert.strictEqual(login.statusCode, 200)
      t.assert.strictEqual(login.body, 'test')

      const headers: Record<string, any> = {}
      if (login.headers['set-cookie']) {
        headers['cookie'] = login.headers['set-cookie']
      }

      const response = await server.inject({
        url: '/',
        headers,
        method: 'GET'
      })

      t.assert.strictEqual(response.statusCode, 401)
    })

    test('should allow registering strategies after creating routes referring to those strategies by name', async (t: TestContext) => {
      const { server, fastifyPassport } = getRegisteredTestServer(null, { clearSessionIgnoreFields: ['messages'] })

      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate('test', {
            authInfo: false
          })
        },
        async (request, reply) => {
          reply.send(request.session.get('messages'))
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

      t.assert.strictEqual(loginResponse.statusCode, 302)
      t.assert.strictEqual(loginResponse.headers.location, '/')

      const homeResponse = await server.inject({
        url: '/',
        headers: {
          cookie: loginResponse.headers['set-cookie']
        },
        method: 'GET'
      })

      t.assert.deepStrictEqual(homeResponse.json(), ['welcome'])
      t.assert.strictEqual(homeResponse.statusCode, 200)
    })
  })
}

testSuite('@fastify/session')
testSuite('@fastify/secure-session')
