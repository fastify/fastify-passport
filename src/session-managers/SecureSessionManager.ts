/// <reference types="fastify-secure-session" />
import { FastifyRequest } from 'fastify'
import { SerializeFunction } from '../Authenticator'

/** Class for storing passport data in the session using `fastify-secure-session` */
export class SecureSessionManager {
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
    if (typeof request.session.set === 'function') {
      request.session.set(this.key, object)
    } else {
      request.session[this.key] = object
    }
  }

  async logOut(request: FastifyRequest) {
    if (typeof request.session.set === 'function') {
      request.session.set(this.key, undefined)
    } else {
      request.session[this.key] = undefined
    }
  }

  getUserFromSession(request: FastifyRequest) {
    if (typeof request.session.get === 'function') {
      return request.session.get(this.key)
    }
    return request.session[this.key]
  }
}
