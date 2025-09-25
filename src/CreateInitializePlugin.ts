import { fastifyPlugin } from 'fastify-plugin'
import flash from '@fastify/flash'
import type Authenticator from './Authenticator'
import { logIn } from './decorators/login'
import { logOut } from './decorators/logout'
import { isAuthenticated } from './decorators/is-authenticated'
import { isUnauthenticated } from './decorators/is-unauthenticated'

export function CreateInitializePlugin (passport: Authenticator) {
  return fastifyPlugin(async (fastify) => {
    fastify.register(flash)
    fastify.decorateRequest('passport', {
      getter () {
        return passport
      }
    })
    fastify.decorateRequest('logIn', logIn)
    fastify.decorateRequest('login', logIn)
    fastify.decorateRequest('logOut', logOut)
    fastify.decorateRequest('logout', logOut)
    fastify.decorateRequest('isAuthenticated', isAuthenticated)
    fastify.decorateRequest('isUnauthenticated', isUnauthenticated)
    fastify.decorateRequest(passport.userProperty, null)
  })
}
