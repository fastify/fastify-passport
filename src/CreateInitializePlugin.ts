import fp from 'fastify-plugin'
import { logIn, logOut, isAuthenticated, isUnauthenticated } from './decorators'
import Authenticator from './Authenticator'
import flash = require('fastify-flash')

export function CreateInitializePlugin(passport: Authenticator, options: { userProperty?: string } = {}) {
  return fp(async (fastify) => {
    void fastify.register(flash)
    fastify.decorateRequest('passport', null)
    fastify.decorateRequest('logIn', null)
    fastify.decorateRequest('login', null)
    fastify.decorateRequest('logOut', null)
    fastify.decorateRequest('logout', null)
    fastify.decorateRequest('isAuthenticated', null)
    fastify.decorateRequest('isUnauthenticated', null)
    fastify.decorateRequest(options.userProperty || 'user', null)

    fastify.addHook('onRequest', (request, _reply, done) => {
      request.logIn = logIn
      request.login = logIn
      request.logOut = logOut
      request.logout = logOut
      request.isAuthenticated = isAuthenticated
      request.isUnauthenticated = isUnauthenticated
      request.passport = passport

      done()
    })
  })
}
