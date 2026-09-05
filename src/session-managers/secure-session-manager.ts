import type { FastifyRequest } from 'fastify'
import type { AuthenticateOptions } from '../authentication-route'
import type { SerializeFunction } from '../authenticator'
import { getSession, type PassportSession } from '../session'
import { isStorableSessionValue } from '../session-value'

/**
 * Safely reads the current session data via the `data()` method exposed by both
 * `@fastify/session` and `@fastify/secure-session`. Falls back to an empty object
 * if the method is not present or not callable, instead of throwing at runtime.
 */
function getExistingSessionData (session: PassportSession): Record<string, unknown> {
  const data = (session as unknown as { data?: unknown }).data
  if (typeof data !== 'function') {
    return {}
  }
  return (data.call(session) as Record<string, unknown> | undefined) ?? {}
}

/**
 * Session#set only accepts typed keys, but this manager uses dynamic keys.
 * Keep the type cast in this helper.
 */
function setSessionValue (session: PassportSession, key: string, value: unknown): void {
  (session as unknown as { set: (key: string, value: unknown) => void }).set(key, value)
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

  async logIn (request: FastifyRequest, user: any, options?: AuthenticateOptions) {
    const object = await this.serializeUser(user, request)
    // `regenerate` support is a fixed trait of the session store (not of a particular
    // session instance), so it's safe to check it once up front. Every other read of
    // the session below goes through `getSession(request)` freshly, though: some
    // stores (`@fastify/session`) replace `request.session` with a new object inside
    // `regenerate()`, so a cached reference to the old session would silently write to
    // a discarded object once regeneration has happened.
    const supportsRegenerate = typeof getSession(request).regenerate === 'function'

    // Handle @fastify/session to prevent token/CSRF fixation
    if (supportsRegenerate) {
      if (this.clearSessionOnLogin && isStorableSessionValue(object)) {
        const keepSessionInfoKeys: string[] = [...this.clearSessionIgnoreFields]
        if (options?.keepSessionInfo) {
          keepSessionInfoKeys.push(...Object.keys(getSession(request)))
        }
        await getSession(request).regenerate?.(keepSessionInfoKeys)
      } else {
        const existingData = getExistingSessionData(getSession(request))
        await getSession(request).regenerate?.()
        for (const [key, value] of Object.entries(existingData)) {
          setSessionValue(getSession(request), key, value)
        }
      }

      // Handle @fastify/secure-session against CSRF fixation
      // TODO: This is quite hacky. The best option would be having a regenerate method
      // on secure-session as well
    } else if (this.clearSessionOnLogin && isStorableSessionValue(object)) {
      const currentData = getSession(request)?.data() as Record<string, unknown> | undefined ?? {}
      for (const field of Object.keys(currentData)) {
        if (options?.keepSessionInfo || this.clearSessionIgnoreFields.includes(field)) {
          continue
        }
        setSessionValue(getSession(request), field, undefined)
      }
    }
    setSessionValue(getSession(request), this.key, object)
  }

  async logOut (request: FastifyRequest) {
    setSessionValue(getSession(request), this.key, undefined)
    if (typeof getSession(request).regenerate === 'function') {
      if (this.clearSessionOnLogin) {
        await getSession(request).regenerate?.()
      } else {
        const existingData = getExistingSessionData(getSession(request))
        await getSession(request).regenerate?.()
        for (const [key, value] of Object.entries(existingData)) {
          if (key !== this.key) {
            setSessionValue(getSession(request), key, value)
          }
        }
      }
    }
  }

  getUserFromSession (request: FastifyRequest) {
    return getSession(request).get(this.key)
  }
}
