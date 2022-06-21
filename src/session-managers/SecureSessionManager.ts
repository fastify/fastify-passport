/// <reference types="@fastify/secure-session" />
import { FastifyRequest } from 'fastify'
import { SerializeFunction } from '../Authenticator'

/** Class for storing passport data in the session using `@fastify/secure-session` or `@fastify/session` */
export class SecureSessionManager {
  key: string
  serializeUser: SerializeFunction

  constructor(serializeUser: SerializeFunction)
  constructor(options: { key?: string }, serializeUser: SerializeFunction)
  constructor(options: SerializeFunction | { key?: string }, serializeUser?: SerializeFunction) {
    if (typeof options === 'function') {
      this.serializeUser = options
      this.key = 'passport'
    } else if (typeof serializeUser === 'function') {
      this.serializeUser = serializeUser
      this.key =
        (options && typeof options === 'object' && typeof options.key === 'string' && options.key) || 'passport'
    } else {
      throw new Error('SecureSessionManager#constructor must have a valid serializeUser-function passed as a parameter')
    }
  }

  async logIn(request: FastifyRequest, user: any) {
    const object = await this.serializeUser(user, request)
    request.session.set(this.key, object)
  }

  async logOut(request: FastifyRequest) {
    request.session.set(this.key, undefined)
  }

  getUserFromSession(request: FastifyRequest) {
    return request.session.get(this.key)
  }
}
