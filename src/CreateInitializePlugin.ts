import { fastifyPlugin } from 'fastify-plugin'
import flash from '@fastify/flash'
import type Authenticator from './Authenticator'
import type { FastifyPassportInitializePlugin } from './types'
import { logIn } from './decorators/login'
import { logOut } from './decorators/logout'
import { isAuthenticated } from './decorators/is-authenticated'
import { isUnauthenticated } from './decorators/is-unauthenticated'

export function CreateInitializePlugin (passport: Authenticator): FastifyPassportInitializePlugin {
  return fastifyPlugin(async (fastify) => {
    const decorated = fastify
      .register(flash)
      .decorateRequest('passport', {
        getter () {
          return passport
        }
      })
      .decorateRequest('logIn', logIn)
      .decorateRequest('login', logIn)
      .decorateRequest('logOut', logOut)
      .decorateRequest('logout', logOut)
      .decorateRequest('isAuthenticated', isAuthenticated)
      .decorateRequest('isUnauthenticated', isUnauthenticated)
      .decorateRequest(passport.userProperty, null)

    return decorated
  }) as FastifyPassportInitializePlugin
}
