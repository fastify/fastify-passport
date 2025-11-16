import { test, describe } from 'node:test'
import assert, { fail } from 'node:assert'
import { Strategy as FacebookStrategy } from 'passport-facebook'
import { Strategy as GitHubStrategy } from 'passport-github2'
import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth'
import { Configuration as OpenIdClientConfiguration } from 'openid-client'
import { Strategy as OpenIdClientStrategy } from 'openid-client/passport'
import { getConfiguredTestServer, TestStrategy } from './helpers'

const testSuite = (sessionPluginName: string) => {
  describe(`${sessionPluginName} tests`, () => {
    test('should initiate oauth with the google strategy from npm', async () => {
      const strategy: TestStrategy = new GoogleStrategy(
        {
          clientID: '384163122467-cq6dolrp53at1a3pa8j0f4stpa5gvouh.apps.googleusercontent.com',
          clientSecret: 'o15Chw0KIaXtx_2wRGxNdNSy',
          callbackURL: 'http://www.example.com/auth/google/callback',
        },
        () => fail()
      ) as TestStrategy

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
      assert.strictEqual(response.statusCode, 302)
    })

    test('should initiate oauth with the facebook strategy from npm', async () => {
      const strategy: TestStrategy = new FacebookStrategy(
        {
          clientID: 'foobar',
          clientSecret: 'baz',
          callbackURL: 'http://www.example.com/auth/facebook/callback'
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
      assert.strictEqual(response.statusCode, 302)
    })

    test('should initiate oauth with the github strategy from npm', async () => {
      const strategy: TestStrategy = new GitHubStrategy(
        {
          clientID: 'foobar',
          clientSecret: 'baz',
          callbackURL: 'http://www.example.com/auth/facebook/callback'
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
      assert.strictEqual(response.statusCode, 302)
    })

    test('should initiate oauth with the openid-client strategy from npm', async () => {
      const issuer = { issuer: 'https://as.example.com/', authorization_endpoint: 'https://as.example.com/authorize' }
      const client = {
        client_id: 'identifier',
        client_secret: 'secure',
      }

      const config = new OpenIdClientConfiguration(issuer, client.client_id, client.client_secret)

      const strategy = new OpenIdClientStrategy(
        { config },
        () => fail()
      ) as unknown as TestStrategy

      const { server, fastifyPassport } = getConfiguredTestServer('openid-client', strategy)

      server.get(
        '/',
        { preValidation: fastifyPassport.authenticate('openid-client', { authInfo: false }) },
        async () => 'hello world!'
      )
      server.post(
        '/login',
        { preValidation: fastifyPassport.authenticate('openid-client', { authInfo: false }) },
        async () => 'hello'
      )

      const response = await server.inject({ method: 'GET', url: '/' })
      assert.strictEqual(response.statusCode, 302)
    })
  })
}

testSuite('@fastify/session')
testSuite('@fastify/secure-session')
