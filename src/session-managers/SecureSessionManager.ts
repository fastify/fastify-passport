/// <reference types="@fastify/secure-session" />
import { FastifyRequest } from 'fastify'
import { SerializeFunction } from '../Authenticator'

/** Class for storing passport data in the session using `@fastify/secure-session` or `@fastify/session` */
export class SecureSessionManager {
  key: string
  clearSessionOnLogin: boolean
  clearSessionIgnoreFields: string[] = ['session']
  serializeUser: SerializeFunction

  constructor(serializeUser: SerializeFunction)
  constructor(
    options: { key?: string; clearSessionOnLogin?: boolean; clearSessionIgnoreFields?: string[] },
    serializeUser: SerializeFunction
  )
  constructor(
    options: SerializeFunction | { key?: string; clearSessionOnLogin?: boolean; clearSessionIgnoreFields?: string[] },
    serializeUser?: SerializeFunction
  ) {
    if (typeof options === 'function') {
      this.serializeUser = options
      this.key = 'passport'
      this.clearSessionOnLogin = true
    } else if (typeof serializeUser === 'function') {
      this.serializeUser = serializeUser
      this.key =
        (options && typeof options === 'object' && typeof options.key === 'string' && options.key) || 'passport'
      this.clearSessionOnLogin = options.clearSessionOnLogin ?? true
      this.clearSessionIgnoreFields = [...this.clearSessionIgnoreFields, ...(options.clearSessionIgnoreFields || [])]
    } else {
      throw new Error('SecureSessionManager#constructor must have a valid serializeUser-function passed as a parameter')
    }
  }

  async logIn(request: FastifyRequest, user: any) {
    const object = await this.serializeUser(user, request)

    // Handle @fastify/session to prevent token/CSRF fixation
    if (request.session.regenerate) {
      if (this.clearSessionOnLogin && object) {
        await request.session.regenerate(this.clearSessionIgnoreFields)
      } else {
        await request.session.regenerate()
      }
    }
    // Handle @fastify/secure-session against CSRF fixation
    // TODO: This is quite hacky. The best option would be having a regenerate method
    // on secure-session as well
    else if (this.clearSessionOnLogin && object) {
      const currentFields = request.session.data() || {}
      for (const field of Object.keys(currentFields)) {
        if (this.clearSessionIgnoreFields.includes(field)) {
          continue
        }
        request.session.set(field, undefined)
      }
    }
    request.session.set(this.key, object)
  }

  async logOut(request: FastifyRequest) {
    request.session.set(this.key, undefined)
    if (request.session.regenerate) {
      await request.session.regenerate()
    }
  }

  getUserFromSession(request: FastifyRequest) {
    return request.session.get(this.key)
  }
}
