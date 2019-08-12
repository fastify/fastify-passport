import { Strategy } from '.'
import Authenticator from '../authenticator'
import { FastifyRequest } from 'fastify'

class SessionStrategy extends Strategy {
  _deserializeUser: Function

  constructor(deserializeUser: Authenticator['deserializeUser'])
  constructor(options: any, deserializeUser: Authenticator['deserializeUser'])
  constructor(
    options: Authenticator['deserializeUser'] | any,
    deserializeUser?: Authenticator['deserializeUser'],
  ) {
    super('session')
    if (typeof options === 'function') {
      deserializeUser = options
      options = undefined
    }
    options = options || {}

    this._deserializeUser = deserializeUser!
  }

  /**
   * Authenticate request based on the current session state.
   *
   * The session authentication strategy uses the session to restore any login
   * state across requests.  If a login session has been established, `req.user`
   * will be populated with the current user.
   *
   * This strategy is registered automatically by Passport.
   *
   * @param {Object} req
   * @param {Object} options
   * @api protected
   */
  authenticate(req: FastifyRequest, options?: { pauseStream?: boolean }) {
    if (!req._passport) {
      return this.error!(new Error('passport.initialize() middleware not in use'))
    }
    options = options || {}
    // we need this to prevent basic passport's strategies to use unsupported feature.
    if (options.pauseStream) {
      throw new Error(`fastify-passport doesn't support pauseStream option.`)
    }

    let sessionUser
    if (req._passport.session) {
      sessionUser = req._passport.session.user
    }

    if (sessionUser || sessionUser === 0) {
      this._deserializeUser(sessionUser, req, (err?: Error | null, user?: any) => {
        if (err) {
          return this.error!(err)
        }
        if (!user) {
          delete req._passport.session.user
        } else {
          // TODO: Remove instance access
          const property = req._passport.instance._userProperty || 'user'
          req[property] = user
        }
        this.pass!()
      })
    } else {
      this.pass!()
    }
  }
}

export default SessionStrategy
