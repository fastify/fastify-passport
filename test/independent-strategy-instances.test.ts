import { describe, test, TestContext } from 'node:test'
import { Strategy } from '../src/strategies'
import { TestThirdPartyStrategy } from './authorize.test'
import { getConfiguredTestServer, getRegisteredTestServer, TestStrategy } from './helpers'

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

const testSuite = (sessionPluginName: string) => {
  describe(`${sessionPluginName} tests`, () => {
    test('should allow passing a specific Strategy instance to an authenticate call', async (t: TestContext) => {
      const { server, fastifyPassport } = getRegisteredTestServer(null, { clearSessionIgnoreFields: ['messages'] })
      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate(new WelcomeStrategy('welcome'), {
            authInfo: false
          })
        },
        async (request) => request.session.get('messages')
      )
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate(new WelcomeStrategy('welcome'), {
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

    test('should allow passing a multiple specific Strategy instances to an authenticate call', async (t: TestContext) => {
      const { server, fastifyPassport } = getRegisteredTestServer()
      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate([new WelcomeStrategy('welcome'), new TestStrategy('test')], {
            authInfo: false
          })
        },
        async (request) => `messages: ${request.session.get('messages')}`
      )
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate([new WelcomeStrategy('welcome'), new TestStrategy('test')], {
            successRedirect: '/',
            successMessage: true,
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

      t.assert.strictEqual(response.body, 'messages: undefined')
      t.assert.strictEqual(response.statusCode, 200)
    })

    test('should allow passing a mix of Strategy instances and strategy names', async (t: TestContext) => {
      const { server, fastifyPassport } = getConfiguredTestServer()
      server.get(
        '/',
        {
          preValidation: fastifyPassport.authenticate([new WelcomeStrategy('welcome'), 'test'], {
            authInfo: false
          })
        },
        async (request) => `messages: ${request.session.get('messages')}`
      )
      server.post(
        '/login',
        {
          preValidation: fastifyPassport.authenticate([new WelcomeStrategy('welcome'), 'test'], {
            successRedirect: '/',
            successMessage: true,
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

      t.assert.strictEqual(response.body, 'messages: undefined')
      t.assert.strictEqual(response.statusCode, 200)
    })

    test('should allow passing specific instances to an authorize call', async (t: TestContext) => {
      const { server, fastifyPassport } = getConfiguredTestServer()

      server.get(
        '/',
        {
          preValidation: fastifyPassport.authorize(
            new TestThirdPartyStrategy('third-party')
          )
        },
        async (request) => {
          const user = request.user as any
          t.assert.ifError(user)
          const account = request.account as any
          t.assert.ok(account.id)
          t.assert.strictEqual(account.name, 'test')

          return 'it worked'
        }
      )

      const response = await server.inject({ method: 'GET', url: '/' })
      t.assert.strictEqual(response.statusCode, 200)
    })

    test('Strategy instances used during one authentication shouldn\'t be registered', async (t: TestContext) => {
      const { fastifyPassport } = getRegisteredTestServer()
      // build a handler with the welcome strategy
      fastifyPassport.authenticate(new WelcomeStrategy('welcome'), { authInfo: false })
      t.assert.strictEqual(fastifyPassport.strategy('welcome'), undefined)
    })
  })
}

testSuite('@fastify/session')
testSuite('@fastify/secure-session')
