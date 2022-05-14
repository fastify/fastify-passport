import { Strategy as FacebookStrategy } from 'passport-facebook'
import { Strategy as GitHubStrategy } from 'passport-github2'
import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth'
import { getConfiguredTestServer, TestStrategy } from './helpers'

const suite = (sessionPluginName) => {
  describe(`${sessionPluginName} tests`, () => {
    test('should initiate oauth with the google strategy from npm', async () => {
      const strategy: TestStrategy = new GoogleStrategy(
        {
          clientID: '384163122467-cq6dolrp53at1a3pa8j0f4stpa5gvouh.apps.googleusercontent.com',
          clientSecret: 'o15Chw0KIaXtx_2wRGxNdNSy',
          callbackURL: 'http://www.example.com/auth/google/callback',
        },
        () => fail()
      )

      const { server, fastifyPassport } = getConfiguredTestServer('google', strategy)

      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('google', { authInfo: false }) },
        async () => 'hello world!'
      )
      server.post(
        '/login',
        { preValidation: fastifyPassport.authenticate('google', { authInfo: false }) },
        async () => 'hello'
      )

      const response = await server.inject({ method: 'GET', url: '/' })
      expect(response.statusCode).toEqual(302)
    })

    test('should initiate oauth with the facebook strategy from npm', async () => {
      const strategy: TestStrategy = new FacebookStrategy(
        {
          clientID: 'foobar',
          clientSecret: 'baz',
          callbackURL: 'http://www.example.com/auth/facebook/callback',
        },
        () => fail()
      )

      const { server, fastifyPassport } = getConfiguredTestServer('facebook', strategy)

      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('facebook', { authInfo: false }) },
        async () => 'hello world!'
      )
      server.post(
        '/login',
        { preValidation: fastifyPassport.authenticate('facebook', { authInfo: false }) },
        async () => 'hello'
      )

      const response = await server.inject({ method: 'GET', url: '/' })
      expect(response.statusCode).toEqual(302)
    })

    test('should initiate oauth with the github strategy from npm', async () => {
      const strategy: TestStrategy = new GitHubStrategy(
        {
          clientID: 'foobar',
          clientSecret: 'baz',
          callbackURL: 'http://www.example.com/auth/facebook/callback',
        },
        () => fail()
      )

      const { server, fastifyPassport } = getConfiguredTestServer('github', strategy)

      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('github', { authInfo: false }) },
        async () => 'hello world!'
      )
      server.post(
        '/login',
        { preValidation: fastifyPassport.authenticate('github', { authInfo: false }) },
        async () => 'hello'
      )

      const response = await server.inject({ method: 'GET', url: '/' })
      expect(response.statusCode).toEqual(302)
    })
  })
}

suite('@fastify/session')
suite('@fastify/secure-session')
