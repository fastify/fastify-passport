import fp from 'fastify-plugin'
import { logIn, logOut, isAuthenticated, isUnauthenticated } from './decorators'
import Authenticator from './Authenticator'
import flash from 'fastify-flash'

export function CreateInitializePlugin(passport: Authenticator, options: { userProperty?: string } = {}) {
  return fp(async (fastify) => {
    void fastify.register(flash)
    fastify.decorateRequest('passport', passport)
    fastify.decorateRequest('logIn', logIn)
    fastify.decorateRequest('login', logIn)
    fastify.decorateRequest('logOut', logOut)
    fastify.decorateRequest('logout', logOut)
    fastify.decorateRequest('isAuthenticated', isAuthenticated)
    fastify.decorateRequest('isUnauthenticated', isUnauthenticated)
    fastify.decorateRequest(options.userProperty || 'user', null)
  })
}
