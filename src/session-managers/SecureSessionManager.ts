/// <reference types="@fastify/secure-session" />
import { FastifyRequest } from 'fastify'
import { SerializeFunction } from '../Authenticator'

// '@ts-ignore' prevent build errors caused by types mismatch from @fastify/session and @fastify/secure-session
/** Class for storing passport data in the session using `fastify-secure-session` or `@fastify/session` */
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
    if (this.clearSessionOnLogin && object) {
      // Handle @fastify/session to prevent token/CSRF fixation
      // @ts-ignore: property 'regenerate' does not exist on type 'Session'.
      if (request.session.regenerate) {
        // @ts-ignore: property 'regenerate' does not exist on type 'Session'.
        await request.session.regenerate(this.clearSessionIgnoreFields)
      } else {
        // @ts-ignore: property 'data' does not exist on type 'Session'
        const currentFields = request.session.data() || {}
        // Handle @fastify/secure-session against CSRF fixation
        // TODO: This is quite hacky. The best option would be having a regenerate method
        // on secure-session as well
        for (const field of Object.keys(currentFields as object)) {
          if (this.clearSessionIgnoreFields.includes(field)) {
            continue
          }
          request.session.set(field, undefined)
        }
      }
    }

    // Handle sessions using @fastify/session
    // @ts-ignore: property 'regenerate' does not exist on type 'Session'.
    if (request.session.regenerate) {
      // regenerate session to guard against session fixation
      // @ts-ignore: Property 'regenerate' does not exist on type 'Session'.
      await request.session.regenerate()
    }
    request.session.set(this.key, object)
  }

  async logOut(request: FastifyRequest) {
    request.session.set(this.key, undefined)
    // @ts-ignore: property 'regenerate' does not exist on type 'Session'.
    if (request.session.regenerate) {
      // @ts-ignore: property 'regenerate' does not exist on type 'Session'.
      await request.session.regenerate()
    }
  }

  getUserFromSession(request: FastifyRequest) {
    return request.session.get(this.key)
  }
}
