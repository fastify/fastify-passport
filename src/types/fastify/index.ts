import 'fastify'
import { logIn } from '../../decorators/login'
import { logOut } from '../../decorators/logout'
import { isAuthenticated } from '../../decorators/is-authenticated'
import { isUnauthenticated } from '../../decorators/is-unauthenticated'

declare module 'fastify' {
  interface FastifyRequest {
    login: typeof logIn
    logIn: typeof logIn
    logout: typeof logOut
    logOut: typeof logOut
    isAuthenticated: typeof isAuthenticated
    isUnauthenticated: typeof isUnauthenticated
    _passport: {
      instance: any
      session?: any
    }
    user: any
    authInfo: any
  }
}
