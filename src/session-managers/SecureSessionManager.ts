import type { FastifyRequest } from 'fastify'
import type { AuthenticateOptions } from '../AuthenticationRoute'
import type { SerializeFunction } from '../Authenticator'
import type { FastifySessionObject } from '@fastify/session'
import type { Session, SessionData } from '@fastify/secure-session'
import { isStorableSessionValue } from '../session-value'

type Request = FastifyRequest & { session: FastifySessionObject | Session<SessionData> }

/**
 * Safely reads the current session data via the `data()` method exposed by both
 * `@fastify/session` and `@fastify/secure-session`. Falls back to an empty object
 * if the method is not present or not callable, instead of throwing at runtime.
 */
function getExistingSessionData (session: Request['session']): Record<string, unknown> {
  const data = (session as unknown as { data?: unknown }).data
  if (typeof data !== 'function') {
    return {}
  }
  return (data.call(session) as Record<string, unknown> | undefined) ?? {}
}

/** Class for storing passport data in the session using `@fastify/secure-session` or `@fastify/session` */
export class SecureSessionManager {
  key: string
  clearSessionOnLogin: boolean
  clearSessionIgnoreFields: string[] = ['session']
  serializeUser: SerializeFunction

  constructor (serializeUser: SerializeFunction)
  constructor (
    options: { key?: string; clearSessionOnLogin?: boolean; clearSessionIgnoreFields?: string[] },
    serializeUser: SerializeFunction
  )
  constructor (
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

  async logIn (request: Request, user: any, options?: AuthenticateOptions) {
    const object = await this.serializeUser(user, request)

    // Handle @fastify/session to prevent token/CSRF fixation
    if (request.session.regenerate) {
      if (this.clearSessionOnLogin && isStorableSessionValue(object)) {
        const keepSessionInfoKeys: string[] = [...this.clearSessionIgnoreFields]
        if (options?.keepSessionInfo) {
          keepSessionInfoKeys.push(...Object.keys(request.session))
        }
        await request.session.regenerate(keepSessionInfoKeys)
      } else {
        const existingData = getExistingSessionData(request.session)
        await request.session.regenerate()
        for (const [key, value] of Object.entries(existingData)) {
          request.session.set(key, value)
        }
      }

      // Handle @fastify/secure-session against CSRF fixation
      // TODO: This is quite hacky. The best option would be having a regenerate method
      // on secure-session as well
    } else if (this.clearSessionOnLogin && isStorableSessionValue(object)) {
      const currentData: SessionData = request.session?.data() ?? {}
      for (const field of Object.keys(currentData)) {
        if (options?.keepSessionInfo || this.clearSessionIgnoreFields.includes(field)) {
          continue
        }
        request.session.set(field, undefined)
      }
    }
    request.session.set(this.key, object)
  }

  async logOut (request: Request) {
    request.session.set(this.key, undefined)
    if (request.session.regenerate) {
      if (this.clearSessionOnLogin) {
        await request.session.regenerate()
      } else {
        const existingData = getExistingSessionData(request.session)
        await request.session.regenerate()
        for (const [key, value] of Object.entries(existingData)) {
          if (key !== this.key) {
            request.session.set(key, value)
          }
        }
      }
    }
  }

  getUserFromSession (request: Request) {
    return request.session.get(this.key)
  }
}
