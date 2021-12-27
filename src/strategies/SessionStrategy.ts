import { Strategy } from './base'
import { DeserializeFunction } from '../Authenticator'
import type { FastifyRequest } from 'fastify'

/**
 * Default strategy that authenticates already-authenticated requests by retrieving their auth information from the Fastify session.
 * */
export class SessionStrategy extends Strategy {
  private deserializeUser: DeserializeFunction

  constructor(deserializeUser: DeserializeFunction)
  constructor(options: any, deserializeUser: DeserializeFunction)
  constructor(options: DeserializeFunction | any, deserializeUser?: DeserializeFunction) {
    super('session')
    if (typeof options === 'function') {
      deserializeUser = options
      options = undefined
    }
    options = options || {}

    this.deserializeUser = deserializeUser!
  }

  /**
   * Authenticate request based on the current session state.
   *
   * The session authentication strategy uses the session to restore any login state across requests.  If a login session has been established, `request.user` will be populated with the current user.
   *
   * This strategy is registered automatically by fastify-passport.
   *
   * @param {Object} request
   * @param {Object} options
   * @api protected
   */
  authenticate(request: FastifyRequest, options?: { pauseStream?: boolean }) {
    if (!request.passport) {
      return this.error(new Error('passport.initialize() plugin not in use'))
    }
    options = options || {}
    // we need this to prevent basic passport's strategies to use unsupported feature.
    if (options.pauseStream) {
      return this.error(new Error("fastify-passport doesn't support pauseStream option."))
    }

    const sessionUser = request.passport.sessionManager.getUserFromSession(request)

    if (sessionUser || sessionUser === 0) {
      void this.deserializeUser(sessionUser, request)
        .catch((err: Error) => this.error(err))
        .then(async (user?: any) => {
          if (!user) {
            await request.passport.sessionManager.logOut(request)
          } else {
            request[request.passport.userProperty] = user
          }
          this.pass()
        })
    } else {
      this.pass()
    }
  }
}
