import { Request } from '../authenticator'

/**
 * Test if request is unauthenticated.
 *
 * @return {Boolean}
 * @api public
 */
export function isUnauthenticated(this: Request): boolean {
  return !this.isAuthenticated()
}
