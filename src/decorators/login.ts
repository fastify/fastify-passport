import type { FastifyPassportRequest } from '../types'

export type DoneCallback = (err?: Error) => void
/**
 * Initiate a login session for `user`.
 *
 * Options:
 *   - `session`  Save login state in session, defaults to _true_
 *
 * Examples:
 *
 *     req.logIn(user, { session: false });
 *
 *     req.logIn(user, function(err) {
 *       if (err) { throw err; }
 *       // session saved
 *     });
 *
 * @param {User} user
 * @param {Object} options
 * @param {Function} done
 * @api public
 */
export async function logIn<T = unknown> (this: FastifyPassportRequest, user: T): Promise<void>
export async function logIn<T = unknown> (
  this: FastifyPassportRequest,
  user: T,
  options: { session?: boolean; keepSessionInfo?: boolean }
): Promise<void>
export async function logIn<T = unknown> (
  this: FastifyPassportRequest,
  user: T,
  options: { session?: boolean; keepSessionInfo?: boolean } = {}
) {
  if (!this.passport) {
    throw new Error('passport.initialize() plugin not in use')
  }

  const property = this.passport.userProperty
  const session = options.session === undefined ? true : options.session

  this[property] = user
  if (session) {
    try {
      await this.passport.sessionManager.logIn(this, user, options)
    } catch (e) {
      this[property] = null
      throw e
    }
  }
}
