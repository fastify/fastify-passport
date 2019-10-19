import { FastifyRequest } from 'fastify'

class SessionManager {
  _key: string
  _serializeUser: Function

  constructor(options: Function | any, serializeUser: Function) {
    if (typeof options === 'function') {
      serializeUser = options
      options = undefined
    }
    options = options || {}

    this._key = options.key || 'passport'
    this._serializeUser = serializeUser
  }

  logIn(request: FastifyRequest, user: any, cb: (err?: Error) => void) {
    const self = this
    this._serializeUser(user, request, function(err: Error, obj: any) {
      if (err) {
        return cb(err)
      }
      if (!request._passport.session) {
        request._passport.session = {}
      }
      request._passport.session.user = obj
      if (!request.session) {
        request.session = {} as any
      }
      request.session[self._key] = request._passport.session
      cb()
    })
  }

  logOut(request: FastifyRequest, cb?: () => void) {
    if (request._passport && request._passport.session) {
      delete request._passport.session.user
    }
    if (cb) {
      cb()
    }
  }
}

export default SessionManager
