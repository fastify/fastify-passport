import { FastifyRequest } from 'fastify'
import { SerializeFunction } from '../Authenticator'

/** Class for storing passport data in the session using `@fastify/session` */
export class SessionManager {
  key: string
  serializeUser: SerializeFunction

  constructor(options: SerializeFunction | any, serializeUser?: SerializeFunction) {
    if (typeof options === 'function') {
      serializeUser = options
      options = undefined
    }
    options = options || {}

    this.key = options.key || 'passport'
    this.serializeUser = serializeUser!
  }

  async logIn(request: FastifyRequest, user: any) {
    const object = await this.serializeUser(user, request)
    request.session[this.key] = object
  }

  async logOut(request: FastifyRequest) {
    request.session[this.key] = undefined
  }

  getUserFromSession(request: FastifyRequest) {
    return request.session[this.key]
  }
}
