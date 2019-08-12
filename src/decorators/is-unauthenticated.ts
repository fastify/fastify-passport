import { FastifyRequest } from 'fastify'

/**
 * Test if request is unauthenticated.
 *
 * @return {Boolean}
 * @api public
 */
export function isUnauthenticated(this: FastifyRequest): boolean {
  return !this.isAuthenticated()
}
