import { flashFactory } from '@fastify/flash/lib/flash'
import { logIn, logOut, isAuthenticated, isUnauthenticated } from './decorators'
import Authenticator from './Authenticator'

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
