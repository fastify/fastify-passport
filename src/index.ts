import type { flashFactory } from '@fastify/flash/lib/flash'
import type { logIn } from './decorators/login'
import type { logOut } from './decorators/logout'
import type { isAuthenticated } from './decorators/is-authenticated'
import type { isUnauthenticated } from './decorators/is-unauthenticated'
import Authenticator from './Authenticator'

const passport = new Authenticator()

// Workaround for importing fastify-passport in native ESM context
module.exports = exports = passport
export default passport
export { Strategy } from './strategies/base'
export { Authenticator } from './Authenticator'

declare module 'fastify' {
  /**
   * An empty interface representing the type of users that applications using `fastify-passport` might assign to the request
   * Suitable for TypeScript users of the library to declaration merge with, like so:
   * ```
   * import { User } from "./my/types";
   *
   * declare module 'fastify' {
   *   interface PassportUser {
   *     [Key in keyof User]: User[Key]
   *   }
   * }
   * ```
   */
  interface PassportUser {}

  interface ExpressSessionData {
    [key: string]: any
  }

  interface FastifyRequest {
    flash: ReturnType<typeof flashFactory>['request']

    login: typeof logIn
    logIn: typeof logIn
    logout: typeof logOut
    logOut: typeof logOut
    isAuthenticated: typeof isAuthenticated
    isUnauthenticated: typeof isUnauthenticated
    passport: Authenticator
    user?: PassportUser
    authInfo?: Record<string, any>
    account?: PassportUser
  }

  interface FastifyReply {
    flash: ReturnType<typeof flashFactory>['reply']
  }
}
