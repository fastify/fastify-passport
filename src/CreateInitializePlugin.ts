import fp from 'fastify-plugin'
import { logIn, logOut, isAuthenticated, isUnauthenticated } from './decorators'
import Authenticator from './Authenticator'
import flash = require('fastify-flash')

export function CreateInitializePlugin(passport: Authenticator, options: { userProperty?: string } = {}) {
  return fp(async (fastify) => {
    void fastify.register(flash)

    fastify
      .decorateRequest(options.userProperty || 'user', null)
      .decorateRequest('passport', {
        getter() {
          return passport
        },
      })
      .decorateRequest('logIn', {
        getter() {
          return logIn
        },
      })
      .decorateRequest('login', {
        getter() {
          return logIn
        },
      })
      .decorateRequest('logOut', {
        getter() {
          return logOut
        },
      })
      .decorateRequest('logout', {
        getter() {
          return logOut
        },
      })
      .decorateRequest('isAuthenticated', {
        getter() {
          return isAuthenticated
        },
      })
      .decorateRequest('isUnauthenticated', {
        getter() {
          return isUnauthenticated
        },
      })
  })
}
