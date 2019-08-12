import { FastifyRequest } from 'fastify'

/**
 * Test if request is authenticated.
 *
 * @return {Boolean}
 * @api public
 */
export function isAuthenticated(this: FastifyRequest): boolean {
  let property = 'user'
  if (this._passport && this._passport.instance) {
    property = this._passport.instance._userProperty || 'user'
  }

  return this[property] ? true : false
}
