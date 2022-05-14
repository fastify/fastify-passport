/* eslint-disable @typescript-eslint/no-empty-function */
import { generateTestUser, getConfiguredTestServer, TestBrowserSession } from './helpers'

const { server, fastifyPassport } = getConfiguredTestServer()

server.get(
  '/protected',
  { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
  async () => 'hello!'
)
server.get('/my-id', { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) }, async (request) =>
  String((request.user as any).id)
)
server.post(
  '/login',
  { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
  async () => 'success'
)

server.post('/force-login', async (request, reply) => {
  await request.logIn(generateTestUser())
  void reply.send('logged in')
})

server.post(
  '/logout',
  { preValidation: fastifyPassport.authenticate('test', { authInfo: false }) },
  async (request, reply) => {
    await request.logout()
    void reply.send('logged out')
  }
)

const suite = (sessionPluginName) => {
  describe(`${sessionPluginName} tests`, () => {
    describe('session isolation', () => {
      let userA, userB, userC

      beforeEach(() => {
        userA = new TestBrowserSession(server)
        userB = new TestBrowserSession(server)
        userC = new TestBrowserSession(server)
      })
      test(`should return 401 Unauthorized if not logged in`, async () => {
        await Promise.all(
          [userA, userB, userC].map(async (user) => {
            const response = await user.inject({ method: 'GET', url: '/protected' })
            expect(response.statusCode).toEqual(401)
          })
        )

        await Promise.all(
          [userA, userB, userC].map(async (user) => {
            const response = await user.inject({ method: 'GET', url: '/protected' })
            expect(response.statusCode).toEqual(401)
          })
        )
      })

      test(`logging in one user shouldn't log in the others`, async () => {
        await Promise.all(
          [userA, userB, userC].map(async (user) => {
            const response = await user.inject({ method: 'GET', url: '/protected' })
            expect(response.statusCode).toEqual(401)
          })
        )

        let response = await userA.inject({
          method: 'POST',
          url: '/login',
          payload: { login: 'test', password: 'test' },
        })
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual('success')

        response = await userA.inject({ method: 'GET', url: '/protected' })
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual('hello!')

        await Promise.all(
          [userB, userC].map(async (user) => {
            const response = await user.inject({ method: 'GET', url: '/protected' })
            expect(response.statusCode).toEqual(401)
          })
        )

        response = await userA.inject({ method: 'GET', url: '/protected' })
        expect(response.statusCode).toEqual(200)
        expect(response.body).toEqual('hello!')
      })

      test(`logging in each user should keep their sessions independent`, async () => {
        await Promise.all(
          [userA, userB, userC].map(async (user) => {
            let response = await user.inject({
              method: 'POST',
              url: '/login',
              payload: { login: 'test', password: 'test' },
            })
            expect(response.statusCode).toEqual(200)
            expect(response.body).toEqual('success')

            response = await user.inject({ method: 'GET', url: '/protected' })
            expect(response.statusCode).toEqual(200)
            expect(response.body).toEqual('hello!')
          })
        )

        const ids = await Promise.all(
          [userA, userB, userC].map(async (user) => {
            const response = await user.inject({ method: 'GET', url: '/my-id' })
            expect(response.statusCode).toEqual(200)
            return response.body
          })
        )

        // expect each returned ID to be unique
        expect(Array.from(new Set(ids)).sort()).toEqual(ids.sort())
      })

      test(`logging out one user shouldn't log out the others`, async () => {
        await Promise.all(
          [userA, userB, userC].map(async (user) => {
            let response = await user.inject({
              method: 'POST',
              url: '/login',
              payload: { login: 'test', password: 'test' },
            })
            expect(response.statusCode).toEqual(200)
            expect(response.body).toEqual('success')

            response = await user.inject({ method: 'GET', url: '/protected' })
            expect(response.statusCode).toEqual(200)
            expect(response.body).toEqual('hello!')
          })
        )

        let response = await userB.inject({
          url: '/logout',
          method: 'POST',
        })
        expect(response.statusCode).toEqual(200)

        response = await userB.inject({
          url: '/protected',
          method: 'GET',
        })
        expect(response.statusCode).toEqual(401)

        await Promise.all(
          [userA, userC].map(async (user) => {
            const response = await user.inject({ method: 'GET', url: '/protected' })
            expect(response.statusCode).toEqual(200)
            expect(response.body).toEqual('hello!')
          })
        )
      })

      test(`force logging in users shouldn't change the login state of the others`, async () => {
        await Promise.all(
          [userA, userB, userC].map(async (user) => {
            const response = await user.inject({ method: 'POST', url: '/force-login' })
            expect(response.statusCode).toEqual(200)
          })
        )

        const ids = await Promise.all(
          [userA, userB, userC].map(async (user) => {
            const response = await user.inject({ method: 'GET', url: '/my-id' })
            expect(response.statusCode).toEqual(200)
            return response.body
          })
        )

        // expect each returned ID to be unique
        expect(Array.from(new Set(ids)).sort()).toEqual(ids.sort())
      })
    })
  })
}

suite('@fastify/session')
suite('@fastify/secure-session')
