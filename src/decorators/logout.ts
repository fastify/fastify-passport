import type { FastifyPassportRequest } from '../types'

/**
 * Terminate an existing login session.
 *
 * @api public
 */
export async function logOut (this: FastifyPassportRequest): Promise<void> {
  const property = this.passport.userProperty
  this[property] = null
  await this.passport.sessionManager.logOut(this)
}
