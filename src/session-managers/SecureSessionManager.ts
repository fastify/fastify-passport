/// <reference types="@fastify/secure-session" />
import { FastifyRequest } from 'fastify'
import { SerializeFunction } from '../Authenticator'

// add this to prevent build errors
// tests are passing, this is to backport this pr
// https://github.com/fastify/fastify-passport/commit/43c82c321db58ea3e375dd475de60befbfcf2a11
/* eslint-disable @typescript-eslint/ban-ts-comment*/

/** Class for storing passport data in the session using `fastify-secure-session` or `@fastify/session` */
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
    // Handle sessions using @fastify/session
    // @ts-ignore
    if (request.session.regenerate) {
      // regenerate session to guard against session fixation
      // @ts-ignore
      await request.session.regenerate()
    }
    request.session.set(this.key, object)
  }

  async logOut(request: FastifyRequest) {
    request.session.set(this.key, undefined)
    // @ts-ignore
    if (request.session.regenerate) {
      // @ts-ignore
      await request.session.regenerate()
    }
  }

  getUserFromSession(request: FastifyRequest) {
    return request.session.get(this.key)
  }
}
