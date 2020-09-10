import { getConfiguredTestServer } from './helpers'

describe('Request decorators', () => {
  test('logIn allows logging in an arbitrary user', async () => {
    const { server, fastifyPassport } = getConfiguredTestServer()
    server.get(
      '/',
      { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
      async (request) => (request.user as any).name
    )
    server.post('/force-login', async (request, reply) => {
      await request.logIn({ name: 'force logged in user' })
      void reply.send('logged in')
    })

    const login = await server.inject({
      method: 'POST',
      url: '/force-login',
    })

    expect(login.statusCode).toEqual(200)

    const response = await server.inject({
      url: '/',
      headers: {
        cookie: login.headers['set-cookie'],
      },
      method: 'GET',
    })

    expect(response.statusCode).toEqual(200)
    expect(response.body).toEqual('force logged in user')
  })

  test('logIn allows logging in an arbitrary user for the duration of the request if session=false', async () => {
    const { server } = getConfiguredTestServer()
    server.post('/force-login', async (request, reply) => {
      await request.logIn({ name: 'force logged in user' }, { session: false })
      void reply.send((request.user as any).name)
    })

    const login = await server.inject({
      method: 'POST',
      url: '/force-login',
    })

    expect(login.statusCode).toEqual(200)
    expect(login.body).toEqual('force logged in user')
    expect(login.headers['set-cookie']).toBeUndefined() // no user added to session
  })

  test(`should logout`, async () => {
    const { server, fastifyPassport } = getConfiguredTestServer()
    server.get(
      '/',
      { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
      async () => 'the root!'
    )
    server.get(
      '/logout',
      { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
      async (request, reply) => {
        void request.logout()
        void reply.send('logged out')
      }
    )
    server.post(
      '/login',
      { preValidation: fastifyPassport.authenticate('test', { successRedirect: '/', authInfo: false }) },
      async () => ''
    )

    const login = await server.inject({
      method: 'POST',
      payload: { login: 'test', password: 'test' },
      url: '/login',
    })
    expect(login.statusCode).toEqual(302)
    expect(login.headers.location).toEqual('/')

    const logout = await server.inject({
      url: '/logout',
      headers: {
        cookie: login.headers['set-cookie'],
      },
      method: 'GET',
    })

    expect(logout.statusCode).toEqual(200)
    expect(logout.headers['set-cookie']).toBeDefined()

    const retry = await server.inject({
      url: '/',
      headers: {
        cookie: logout.headers['set-cookie'],
      },
      method: 'GET',
    })

    expect(retry.statusCode).toEqual(401)
  })
})
